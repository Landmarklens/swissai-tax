import base64
import hashlib
import hmac
import json
from urllib.parse import urlencode

from fastapi import Body, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
from googleapiclient.discovery import build

from config import settings
from core.security import COOKIE_SETTINGS, get_current_user
from db.session import get_db
from models.reset_token import ResetToken
from models.swisstax import User
from schemas.auth import GoogleLoginOut, UserLoginSchema
from schemas.reset_token import (ResetPasswordConfirm,
                                 ResetPasswordMessageResponse,
                                 ResetPasswordRequest, ResetPasswordResponse,
                                 ResetPasswordVerify)
from schemas.user import UserCreate, UserProfile
from services import auth_service as authService
from services import user_service as userService
from services.auth_service import AuthProvider, create_social_user
from services.reset_password import ResetPasswordService
from services.ses_emailjs_replacement import EmailJSService
from services.user_service import (get_user_by_email, update_password,
                                   update_user)
from utils.auth import check_user, flow, sign_jwt
from utils.fastapi_rate_limiter import rate_limit
from utils.rate_limiter import limiter
from utils.router import Router

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
    user_info['first_name'] = user_info.pop('given_name')
    user_info['last_name'] = user_info.pop('family_name')

    user = get_user_by_email(db, email)
    is_new_user = False
    if user is None or not user.is_active:
        # Create user_data safely without direct unpacking
        user_data = {
            "email": email,
            "provider_id": user_info.get("provider_id"),
            "avatar_url": user_info.get("avatar_url"),
            "first_name": user_info.get("first_name"),
            "last_name": user_info.get("last_name"),
            "preferred_language": state_data.get("language", "en")
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
async def user_login(
    request: Request,
    response: Response,
    user: UserLoginSchema = Body(...),
    db=Depends(get_db),
    use_cookie: bool = Query(True, description="Set to true to use cookie-based auth (recommended)")
):
    '''
    email and password is required for login. user_type is optional

    Returns:
        user: User profile data (without sensitive token)
        requires_subscription: bool - True if user needs to subscribe

    Note: Authentication token is now set as httpOnly cookie for security.
    Set use_cookie=false for legacy header-based authentication.
    '''

    if check_user(user, db):
        # Get the actual user from database
        db_user = get_user_by_email(db, user.email)
        if db_user:
            # Generate JWT token
            token_response = sign_jwt(user.email)
            access_token = token_response["access_token"]

            # Check if user requires subscription
            requires_subscription = should_require_subscription(db_user, db)

            # Set httpOnly cookie (new secure method)
            if use_cookie:
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"[LOGIN DEBUG] Setting cookie for user: {db_user.email}")
                logger.info(f"[LOGIN DEBUG] Cookie settings: {COOKIE_SETTINGS}")
                logger.info(f"[LOGIN DEBUG] Token length: {len(access_token)}")

                response.set_cookie(
                    key="access_token",
                    value=f"Bearer {access_token}",
                    **COOKIE_SETTINGS
                )

                logger.info(f"[LOGIN DEBUG] Cookie set successfully")

                # Return user data without token (cookie handles auth)
                return {
                    "success": True,
                    "user": {
                        "id": str(db_user.id),
                        "email": db_user.email,
                        "first_name": db_user.first_name,
                        "last_name": db_user.last_name,
                        "preferred_language": db_user.preferred_language,
                        "avatar_url": db_user.avatar_url
                    },
                    "requires_subscription": requires_subscription
                }
            else:
                # Legacy response with token in body (for backward compatibility)
                token_response["requires_subscription"] = requires_subscription
                return token_response

    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/logout")
async def logout(response: Response):
    """
    Logout endpoint - clears the authentication cookie
    """
    response.delete_cookie(key="access_token")
    return {"success": True, "message": "Logged out successfully"}


@router.post("/migrate-to-cookie")
async def migrate_to_cookie(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """
    Migration endpoint: Converts existing header-based auth to cookie-based auth.
    This endpoint accepts a request with Authorization header and sets a cookie.
    """
    # User is already authenticated via header (get_current_user checks both)
    # Now set the cookie for future requests
    token_response = sign_jwt(current_user.email)
    access_token = token_response["access_token"]

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        **COOKIE_SETTINGS
    )

    return {
        "success": True,
        "message": "Successfully migrated to cookie-based authentication",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name
        }
    }


@router.post("/register", response_model=UserProfile)
@rate_limit("1000/hour")
async def register(request: Request, user: UserCreate, db=Depends(get_db)):
    """
    Registration endpoint for SwissAI Tax users

    language: de, en, fr, it
    """
    try:
        exists_user = userService.get_user_by_email(db, user.email)

        if exists_user and exists_user.is_active:
            raise HTTPException(status_code=400, detail="Email already registered")
        if exists_user:
            return update_user(db, exists_user, user)
        new_user = authService.create_user(db, user)
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

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
