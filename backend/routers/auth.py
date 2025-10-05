import base64
import json
import hmac
import hashlib
from urllib.parse import urlencode

from fastapi import Depends, HTTPException, Body, Request, Query
from fastapi.responses import RedirectResponse
from googleapiclient.discovery import build

from models.reset_token import ResetToken
from models.swisstax import User
from services.auth_service import AuthProvider
from schemas.auth import UserLoginSchema, GoogleLoginOut
from schemas.reset_token import ResetPasswordRequest, ResetPasswordVerify, ResetPasswordConfirm, \
    ResetPasswordMessageResponse, ResetPasswordResponse
from schemas.user import UserCreate, UserProfile
from db.session import get_db
from services import auth_service as authService
from services import user_service as userService
from services.auth_service import create_social_user
from services.reset_password import ResetPasswordService
from services.ses_emailjs_replacement import EmailJSService
from config import settings
from services.user_service import get_user_by_email, update_user, update_password
from utils.auth import check_user, sign_jwt, flow
from utils.router import Router
from utils.rate_limiter import limiter
from utils.fastapi_rate_limiter import rate_limit

router = Router()


def should_require_subscription(user, db) -> bool:
    """
    Check if a user should be redirected to subscription checkout.

    Returns True if:
    - ENFORCE_SUBSCRIPTIONS is enabled
    - User is not grandfathered or test user
    - User has no active subscription

    Args:
        user: User model instance
        db: Database session

    Returns:
        bool: True if subscription is required, False otherwise
    """
    if not settings.ENFORCE_SUBSCRIPTIONS:
        return False

    # Grandfathered user bypass
    if user.is_grandfathered:
        return False

    # Test user bypass
    if user.is_test_user:
        return False

    # Check for active subscription
    from utils.subscription_guard import get_active_subscription
    subscription = get_active_subscription(user, db)

    # Require subscription if none exists
    return subscription is None


@router.get("/login/google", response_model=GoogleLoginOut)
async def login_or_registration_google(user_type: str = Query("taxpayer"),
                                       language: str = Query("en"),
                                       redirect_url: str = Query(...)):
    """
    Use this endpoint to login or register with Google.
    """

    state_data = {
        "user_type": user_type.value,
        "language": language.value,
        "redirect_url": redirect_url,
    }
    
    # Create a signed state parameter to prevent tampering
    state_json = json.dumps(state_data)
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        state_json.encode(),
        hashlib.sha256
    ).hexdigest()
    
    signed_state = {
        "data": state_data,
        "signature": signature
    }
    
    encoded_state = base64.urlsafe_b64encode(json.dumps(signed_state).encode()).decode()

    authorization_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=encoded_state,
    )

    return {"authorization_url": authorization_url}


@router.get("/login/google/callback", include_in_schema=False)
async def callback(request: Request, db=Depends(get_db)):
    flow.fetch_token(code=request.query_params["code"])
    credentials = flow.credentials

    user_info_service = build('oauth2', 'v2', credentials=credentials)
    user_info = user_info_service.userinfo().get().execute()

    encoded_state = request.query_params.get('state', '')
    
    # Validate the state parameter
    try:
        decoded_state = json.loads(base64.urlsafe_b64decode(encoded_state).decode())
        state_data = decoded_state.get('data', {})
        received_signature = decoded_state.get('signature', '')
        
        # Verify signature
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode(),
            json.dumps(state_data).encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(received_signature, expected_signature):
            raise HTTPException(status_code=400, detail="Invalid state parameter")
            
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    redirect_url = state_data.pop('redirect_url')
    email = user_info['email']
    user_info['provider_id'] = user_info.pop('id')
    user_info['avatar_url'] = user_info.pop('picture')
    user_info['firstname'] = user_info.pop('given_name')
    user_info['lastname'] = user_info.pop('family_name')

    user = get_user_by_email(db, email)
    is_new_user = False
    if user is None or not user.is_active:
        # Create user_data safely without direct unpacking
        user_data = {
            "email": email,
            "provider_id": user_info.get("provider_id"),
            "avatar_url": user_info.get("avatar_url"),
            "firstname": user_info.get("firstname"),
            "lastname": user_info.get("lastname"),
            "user_type": state_data.get("user_type"),
            "language": state_data.get("language")
        }
        user = await create_social_user(db, user_data, "google")
        is_new_user = True

    token = sign_jwt(user_info["email"])

    if isinstance(token, dict):
        token_query = urlencode(token)
    else:
        token_query = urlencode({"access_token": token})

    # Check if user requires subscription using helper function
    requires_subscription = should_require_subscription(user, db)

    # Build redirect URL with tokens
    redirect_url = f"{redirect_url}?{token_query}"

    # Add subscription flag if needed - GoogleCallback will handle the redirect
    if requires_subscription:
        redirect_url = f"{redirect_url}&requires_subscription=true"

    return RedirectResponse(url=redirect_url)


@router.post("/login")
@rate_limit("1000/minute")
async def user_login(request: Request, user: UserLoginSchema = Body(...), db=Depends(get_db)):
    '''
    email and password is required for login. user_type is optional

    Returns:
        access_token: JWT token
        token_type: "bearer"
        requires_subscription: bool - True if user needs to subscribe
    '''

    if check_user(user, db):
        # Get the actual user from database to use their real user_type
        db_user = get_user_by_email(db, user.email)
        if db_user:
            token_response = sign_jwt(user.email, user_type=db_user.user_type)

            # Check if user requires subscription
            requires_subscription = should_require_subscription(db_user, db)

            # Add subscription requirement flag to response
            token_response["requires_subscription"] = requires_subscription

            return token_response
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/register", response_model=UserProfile)
@rate_limit("1000/hour")
async def register(request: Request, user: UserCreate, db=Depends(get_db)):
    """
    Registration endpoint for SwissAI Tax users

    language: de, en, fr, it
    """

    exists_user = userService.get_user_by_email(db, user.email)

    if exists_user and exists_user.is_active:
        raise HTTPException(status_code=400, detail="Email already registered")
    if exists_user:
        return update_user(db, exists_user, user)
    user = authService.create_user(db, user)
    return user

@router.post("/reset-password/request", response_model=ResetPasswordResponse)
@rate_limit("12/hour")
async def request_password_reset(request: Request, reset_password: ResetPasswordRequest, db=Depends(get_db)):
    email = reset_password.email

    if not userService.get_user_by_email(db, email):
        raise HTTPException(status_code=400, detail="User not found")

    token = ResetPasswordService.create_password_reset_token(email)
    try:
        await ResetToken.create_reset_token(db, email, token)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Wrong save token") from exc

    template_data = {
        "link": ResetPasswordService.get_reset_link(token),
    }

    try:
        result = await EmailJSService.send_email(
            email,
            template_data,
            template_id=settings.EMAILJS_RESET_TEMPLATE_ID,
        )
        # Construct a response that matches ResetPasswordResponse
        return {
            "status": result["status"],
            "status_code": result["status_code"],
            "message": "Password reset email sent successfully"
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send password reset email: {exc}",
        )


@router.post("/reset-password/verify", response_model=ResetPasswordMessageResponse)
@rate_limit("40/hour")
async def password_reset_verify_token(request: Request, reset_password: ResetPasswordVerify, db=Depends(get_db)):
    reset_token = await ResetToken.get_by_token(db, reset_password.token)
    if reset_token and ResetPasswordService.verify_password_reset_token(reset_token.token):
        return {"message": "Token verified"}
    raise HTTPException(
        status_code=400,
        detail="Invalid token"
    )


@router.post("/reset-password/confirm", response_model=ResetPasswordMessageResponse)
@rate_limit("20/hour")
async def password_reset_confirm(request: Request, reset_password: ResetPasswordConfirm, db=Depends(get_db)):
    reset_token = await ResetToken.get_by_token(db, reset_password.token)
    if reset_token and ResetPasswordService.verify_password_reset_token(reset_token.token):
        try:
            user = userService.get_user_by_email(db, reset_token.email)
            update_password(db, user, reset_password.new_password)
            await ResetToken.delete_token(db, reset_token.token)
        except Exception:
            raise HTTPException(status_code=400, detail="Wrong update password")
        return {"message": "Password reset"}
    raise HTTPException(
        status_code=400,
        detail="Invalid token"
    )
