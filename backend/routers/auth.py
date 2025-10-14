import base64
import hashlib
import hmac
import json
from datetime import datetime
from urllib.parse import urlencode

from fastapi import BackgroundTasks, Body, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
from googleapiclient.discovery import build

from config import settings
from core.security import COOKIE_SETTINGS, get_current_user, get_cookie_settings_for_request
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
from utils.auth import check_user, get_flow, sign_jwt, sign_temp_2fa_jwt, verify_temp_2fa_jwt
from utils.fastapi_rate_limiter import rate_limit
from utils.rate_limiter import limiter
from utils.router import Router
from services.audit_log_service import log_login_success, log_logout

router = Router()


def should_require_subscription(user, db) -> bool:
    """
    Check if a user should be redirected to subscription checkout.

    Returns True if:
    - ENABLE_SUBSCRIPTIONS is enabled
    - User is not grandfathered or test user
    - User has no active subscription

    Args:
        user: User model instance
        db: Database session

    Returns:
        bool: True if subscription is required, False otherwise
    """
    if not settings.ENABLE_SUBSCRIPTIONS:
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
        "user_type": user_type,
        "language": language,
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

    # Get fresh flow instance
    oauth_flow = get_flow()
    authorization_url, _ = oauth_flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=encoded_state,
    )

    return {"authorization_url": authorization_url}


@router.get("/login/google/callback", include_in_schema=False)
async def callback(request: Request, response: Response, background_tasks: BackgroundTasks, db=Depends(get_db)):
    # Get fresh flow instance
    oauth_flow = get_flow()
    oauth_flow.fetch_token(code=request.query_params["code"])
    credentials = oauth_flow.credentials

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
    if user is None or not user.is_active:
        user_data = {
            "email": email,
            "provider_id": user_info.get("provider_id"),
            "avatar_url": user_info.get("avatar_url"),
            "first_name": user_info.get("first_name"),
            "last_name": user_info.get("last_name"),
            "preferred_language": state_data.get("language", "en")
        }
        user = await create_social_user(db, user_data, "google")

    # Generate session ID for tracking
    import uuid
    session_id = str(uuid.uuid4())

    # Generate JWT token with session ID
    token_response = sign_jwt(user_info["email"], session_id=session_id)
    access_token = token_response["access_token"]

    # Create session record
    from services.session_service import session_service
    try:
        session_service.create_session(
            db=db,
            user_id=str(user.id),
            session_id=session_id,
            request=request,
            is_current=True
        )
    except Exception:
        pass  # Session creation is optional

    # Log successful login in background (non-blocking)
    background_tasks.add_task(
        log_login_success,
        db,
        user.id,
        request.client.host if request.client else "unknown",
        request.headers.get("user-agent", ""),
        session_id
    )

    # Check if user requires subscription
    requires_subscription = should_require_subscription(user, db)

    # Build redirect URL (frontend will use cookie for auth, not URL params)
    final_redirect_url = redirect_url
    if requires_subscription:
        final_redirect_url = f"{final_redirect_url}?requires_subscription=true"

    # Get cookie settings based on request
    cookie_settings = get_cookie_settings_for_request(request)

    # Create redirect response with 302 status code
    redirect_response = RedirectResponse(url=final_redirect_url, status_code=302)

    # Set httpOnly cookie on the redirect response
    redirect_response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        **cookie_settings
    )

    return redirect_response


@router.post("/login")
@rate_limit("1000/minute")
async def user_login(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
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
            # Check if 2FA is enabled for this user
            if db_user.two_factor_enabled:
                # Generate temporary token for 2FA verification
                temp_token_response = sign_temp_2fa_jwt(db_user.email, str(db_user.id))

                # Return 2FA challenge (no session token yet)
                return {
                    "success": True,
                    "requires_2fa": True,
                    "temp_token": temp_token_response["temp_token"],
                    "message": "Please enter your 2FA code to complete login"
                }

            # No 2FA - proceed with normal login
            # Generate session ID for tracking
            import uuid
            session_id = str(uuid.uuid4())

            # Generate JWT token with session ID
            token_response = sign_jwt(user.email, session_id=session_id)
            access_token = token_response["access_token"]

            # Create session record
            from services.session_service import session_service
            try:
                session_service.create_session(
                    db=db,
                    user_id=str(db_user.id),
                    session_id=session_id,
                    request=request,
                    is_current=True
                )
            except Exception:
                pass  # Session creation is optional

            # Check if user requires subscription
            requires_subscription = should_require_subscription(db_user, db)

            # Log successful login in background (non-blocking)
            background_tasks.add_task(
                log_login_success,
                db,
                db_user.id,
                request.client.host if request.client else "unknown",
                request.headers.get("user-agent", ""),
                session_id
            )

            # Set httpOnly cookie (new secure method)
            if use_cookie:
                cookie_settings = get_cookie_settings_for_request(request)

                response.set_cookie(
                    key="access_token",
                    value=f"Bearer {access_token}",
                    **cookie_settings
                )

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


@router.post("/login/verify-2fa")
@rate_limit("5/15 minutes")  # Strict rate limit for security
async def verify_two_factor_login(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    temp_token: str = Body(...),
    code: str = Body(...),
    use_cookie: bool = Query(True, description="Set to true to use cookie-based auth"),
    db=Depends(get_db)
):
    """
    Verify 2FA code and complete login.
    Exchanges temporary token + 2FA code for full session token.

    Args:
        temp_token: Temporary token from initial login
        code: 6-digit TOTP code or 8-character backup code
        use_cookie: Whether to use cookie-based auth

    Returns:
        Full authentication response with user data
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        # Verify the temporary token
        payload = verify_temp_2fa_jwt(temp_token)
        if not payload:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired temporary token. Please login again."
            )

        # Get user from database
        user_email = payload.get("email")
        db_user = get_user_by_email(db, user_email)

        if not db_user or not db_user.two_factor_enabled:
            raise HTTPException(
                status_code=400,
                detail="Two-factor authentication is not enabled for this account"
            )

        # Import 2FA service
        from services.two_factor_service import two_factor_service

        # Verify TOTP code or backup code
        is_valid = False
        used_backup_code = False

        # Try TOTP first (6 digits)
        if len(code.replace('-', '').replace(' ', '')) == 6:
            # Decrypt the secret
            secret = two_factor_service.decrypt_secret(db_user.two_factor_secret)
            is_valid = two_factor_service.verify_totp(secret, code)
            logger.info(f"[2FA] TOTP verification for {db_user.email}: {'success' if is_valid else 'failed'}")

        # Try backup code if TOTP failed or code looks like backup code
        if not is_valid:
            is_valid = two_factor_service.verify_backup_code(db_user, code, db)
            if is_valid:
                used_backup_code = True
                logger.info(f"[2FA] Backup code used for {db_user.email}")

        if not is_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid verification code"
            )

        # 2FA verification successful - generate session ID and full session token
        import uuid
        session_id = str(uuid.uuid4())

        token_response = sign_jwt(db_user.email, session_id=session_id)
        access_token = token_response["access_token"]

        # Create session record
        from services.session_service import session_service
        try:
            session_service.create_session(
                db=db,
                user_id=str(db_user.id),
                session_id=session_id,
                request=request,
                is_current=True
            )
        except Exception as e:
            logger.warning(f"Failed to create session record: {e}")

        # Check if user requires subscription
        requires_subscription = should_require_subscription(db_user, db)

        # Update last login
        db_user.last_login = datetime.utcnow()
        db.commit()

        logger.info(f"[2FA] Login successful for user: {db_user.email}")

        # Log successful 2FA login in background (non-blocking)
        background_tasks.add_task(
            log_login_success,
            db,
            db_user.id,
            request.client.host if request.client else "unknown",
            request.headers.get("user-agent", ""),
            session_id
        )

        # Set httpOnly cookie if requested
        if use_cookie:
            response.set_cookie(
                key="access_token",
                value=f"Bearer {access_token}",
                **get_cookie_settings_for_request(request)
            )

            # Return user data without token (cookie handles auth)
            result = {
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

            # Warn if backup code was used and running low
            if used_backup_code:
                remaining = two_factor_service.get_remaining_backup_codes_count(db_user)
                if remaining < 3:
                    result["warning"] = f"You have only {remaining} backup codes remaining. Consider regenerating them."

            return result
        else:
            # Legacy response with token in body
            token_response["requires_subscription"] = requires_subscription
            if used_backup_code:
                remaining = two_factor_service.get_remaining_backup_codes_count(db_user)
                if remaining < 3:
                    token_response["warning"] = f"You have only {remaining} backup codes remaining."
            return token_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[2FA] Verification error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to verify 2FA code")


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Logout endpoint - clears cookie and revokes session
    """
    import logging
    logger = logging.getLogger(__name__)

    # Get session_id from request
    from core.security import get_session_id_from_request
    session_id = get_session_id_from_request(request)

    # Clear cookie immediately for fast response
    response.delete_cookie(key="access_token")

    # Revoke session in background (non-blocking)
    if session_id:
        from services.session_service import session_service
        background_tasks.add_task(
            session_service.revoke_session_by_session_id,
            db,
            session_id
        )

        # Log logout in background (non-blocking)
        background_tasks.add_task(
            log_logout,
            db,
            current_user.id,
            request.client.host if request.client else "unknown",
            request.headers.get("user-agent", ""),
            session_id
        )

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


@router.post("/register")
@rate_limit("1000/hour")
async def register(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    user: UserCreate,
    db=Depends(get_db),
    use_cookie: bool = Query(True, description="Set to true to use cookie-based auth (recommended)")
):
    """
    Registration endpoint for SwissAI Tax users
    Automatically logs in the user after successful registration

    Returns:
        User profile data with requires_subscription flag
        Sets authentication cookie for automatic login

    language: de, en, fr, it
    """
    import logging
    import uuid
    logger = logging.getLogger(__name__)

    try:
        exists_user = userService.get_user_by_email(db, user.email)

        if exists_user and exists_user.is_active:
            raise HTTPException(status_code=400, detail="Email already registered")

        if exists_user:
            updated_user = update_user(db, exists_user, user)
            # Check if subscription is required for updated user
            requires_subscription = should_require_subscription(updated_user, db)

            # Generate session ID for tracking
            session_id = str(uuid.uuid4())

            # Generate JWT token with session ID
            token_response = sign_jwt(updated_user.email, session_id=session_id)
            access_token = token_response["access_token"]

            # Create session record
            from services.session_service import session_service
            try:
                session_service.create_session(
                    db=db,
                    user_id=str(updated_user.id),
                    session_id=session_id,
                    request=request,
                    is_current=True
                )
            except Exception:
                pass  # Session creation is optional

            # Log successful registration/login in background
            background_tasks.add_task(
                log_login_success,
                db,
                updated_user.id,
                request.client.host if request.client else "unknown",
                request.headers.get("user-agent", ""),
                session_id
            )

            # Set httpOnly cookie
            if use_cookie:
                cookie_settings = get_cookie_settings_for_request(request)
                response.set_cookie(
                    key="access_token",
                    value=f"Bearer {access_token}",
                    **cookie_settings
                )

            logger.info(f"[register] User re-activated and logged in: {updated_user.email}")

            # Convert to dict and add requires_subscription
            user_dict = {
                "success": True,
                "user": {
                    "id": str(updated_user.id),
                    "email": updated_user.email,
                    "first_name": updated_user.first_name,
                    "last_name": updated_user.last_name,
                    "preferred_language": updated_user.preferred_language,
                    "is_active": updated_user.is_active,
                },
                "requires_subscription": requires_subscription
            }
            return user_dict

        new_user = authService.create_user(db, user)

        # Check if subscription is required for new user
        requires_subscription = should_require_subscription(new_user, db)

        # Generate session ID for tracking
        session_id = str(uuid.uuid4())

        # Generate JWT token with session ID
        token_response = sign_jwt(new_user.email, session_id=session_id)
        access_token = token_response["access_token"]

        # Create session record
        from services.session_service import session_service
        try:
            session_service.create_session(
                db=db,
                user_id=str(new_user.id),
                session_id=session_id,
                request=request,
                is_current=True
            )
        except Exception:
            pass  # Session creation is optional

        # Log successful registration/login in background
        background_tasks.add_task(
            log_login_success,
            db,
            new_user.id,
            request.client.host if request.client else "unknown",
            request.headers.get("user-agent", ""),
            session_id
        )

        # Set httpOnly cookie for automatic login
        if use_cookie:
            cookie_settings = get_cookie_settings_for_request(request)
            response.set_cookie(
                key="access_token",
                value=f"Bearer {access_token}",
                **cookie_settings
            )

        logger.info(f"[register] New user registered and logged in: {new_user.email}")

        # Convert to dict and add requires_subscription
        user_dict = {
            "success": True,
            "user": {
                "id": str(new_user.id),
                "email": new_user.email,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name,
                "preferred_language": new_user.preferred_language,
                "is_active": new_user.is_active,
            },
            "requires_subscription": requires_subscription
        }
        return user_dict

    except HTTPException:
        raise
    except Exception as e:
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
