"""
Security configuration for cookie-based authentication
"""
import time
from fastapi import Cookie, HTTPException, Request
from jose import JWTError, jwt

from config import settings

ALGORITHM = "HS256"

# Default cookie settings for production
# For production HTTPS: secure=True, samesite="none", domain=".swissai.tax"
COOKIE_SETTINGS = {
    "httponly": True,
    "secure": True,  # HTTPS only (overridden for localhost)
    "samesite": "none",  # Cross-domain (overridden to "lax" for localhost)
    "max_age": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Match JWT expiry (6 hours)
    "domain": ".swissai.tax",  # Allow across subdomains (cleared for localhost)
}


def get_cookie_settings_for_request(request: Request) -> dict:
    """
    Get appropriate cookie settings based on request origin.

    Automatically detects localhost and adjusts cookie settings:
    - Localhost (HTTP): secure=False, samesite="lax", no domain restriction
    - Production (HTTPS): secure=True, samesite="none", domain=".swissai.tax"

    Args:
        request: FastAPI Request object

    Returns:
        Dictionary of cookie settings ready for response.set_cookie()
    """
    host = request.headers.get("host", "")
    is_localhost = "localhost" in host or "127.0.0.1" in host

    cookie_settings = COOKIE_SETTINGS.copy()

    if is_localhost:
        # Override for localhost: allow HTTP, use lax samesite, no domain restriction
        cookie_settings.update({
            "secure": False,
            "samesite": "lax",
            "domain": None
        })

    return cookie_settings


def create_access_token(email: str, user_type: str = None, session_id: str = None) -> str:
    """
    Create a new JWT access token

    Args:
        email: User email
        user_type: Optional user type
        session_id: Optional session ID for tracking

    Returns:
        JWT token string
    """
    import uuid
    payload = {
        "email": email,
        "exp": time.time() + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60),
        "session_id": session_id or str(uuid.uuid4())
    }
    if user_type:
        payload["user_type"] = user_type

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user_from_cookie(
    request: Request,
    access_token: str = Cookie(None, alias="access_token")
):
    """
    Extract and verify user from httpOnly cookie.
    This is the new secure method for authentication.
    """
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    # Remove "Bearer " prefix if present
    token = access_token.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        # Get user from database
        from db.session import get_db
        from services.user_service import get_user_by_email

        db = next(get_db())
        try:
            user = get_user_by_email(db, email)

            if user is None:
                raise HTTPException(status_code=401, detail="User not found")

            if not user.is_active:
                raise HTTPException(status_code=401, detail="Inactive user")

            return user
        finally:
            db.close()

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials"
        )


async def get_current_user_from_header(
    request: Request,
):
    """
    Legacy method: Extract user from Authorization header.
    Kept for backward compatibility during migration.
    Will be deprecated after migration is complete.
    """
    from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

    from utils.auth import JWTHandler

    security = HTTPBearer()

    try:
        credentials: HTTPAuthorizationCredentials = await security(request)
        if credentials:
            handler = JWTHandler()
            if handler.verify_jwt(credentials.credentials):
                email = handler.payload.get("email")

                from db.session import get_db
                from services.user_service import get_user_by_email

                db = next(get_db())
                try:
                    user = get_user_by_email(db, email)

                    if user and user.is_active:
                        return user
                finally:
                    db.close()

        raise HTTPException(status_code=401, detail="Invalid authentication")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")


def get_session_id_from_request(request: Request) -> str:
    """
    Extract session_id from JWT token in request

    Args:
        request: FastAPI Request object

    Returns:
        session_id from JWT or None
    """
    # Try cookie first
    access_token = request.cookies.get("access_token")

    if not access_token:
        # Try authorization header
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header[7:]  # Remove "Bearer " prefix

    if access_token:
        # Remove "Bearer " prefix if present
        token = access_token.replace("Bearer ", "")

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            return payload.get("session_id")
        except JWTError:
            return None

    return None


async def get_current_user(request: Request):
    """
    Main authentication method that tries both cookie and header.
    This allows gradual migration from header-based to cookie-based auth.
    """
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"[AUTH DEBUG] get_current_user called for path: {request.url.path}")
    logger.info(f"[AUTH DEBUG] Request cookies: {list(request.cookies.keys())}")
    logger.info(f"[AUTH DEBUG] Request headers: {dict(request.headers)}")

    # Try cookie first (new method)
    access_token = request.cookies.get("access_token")
    logger.info(f"[AUTH DEBUG] Cookie access_token present: {bool(access_token)}")

    if access_token:
        logger.info(f"[AUTH DEBUG] Trying cookie-based auth, token length: {len(access_token)}")
        try:
            user = await get_current_user_from_cookie(request, access_token)
            logger.info(f"[AUTH DEBUG] Cookie auth SUCCESS - User: {user.email}")

            # Validate session if session_id is present
            session_id = get_session_id_from_request(request)
            if session_id:
                from services.session_service import session_service
                from db.session import get_db
                db = next(get_db())
                try:
                    logger.info(f"[AUTH DEBUG] Validating session: {session_id}")
                    session_exists = session_service.get_session_by_id(db, session_id)

                    if not session_exists:
                        # Session doesn't exist - create it (handles legacy logins before session mgmt)
                        logger.info(f"[AUTH DEBUG] Session {session_id} not found, creating it")
                        try:
                            session_service.create_session(
                                db=db,
                                user_id=str(user.id),
                                session_id=session_id,
                                request=request,
                                is_current=True,
                                expires_in_days=30
                            )
                            logger.info(f"[AUTH DEBUG] Created missing session {session_id}")
                        except Exception as e:
                            # Race condition - another request may have created it
                            logger.warning(f"[AUTH DEBUG] Failed to create session (race condition?): {e}")
                            # Try to validate it now (another thread likely created it)
                            if session_service.validate_session(db, session_id):
                                logger.info(f"[AUTH DEBUG] Session validated after race condition")
                            else:
                                logger.error(f"[AUTH DEBUG] Session still invalid after creation attempt")
                    else:
                        # Session exists, validate and update it
                        if not session_service.validate_session(db, session_id):
                            logger.warning(f"[AUTH DEBUG] Invalid session {session_id}")
                            raise HTTPException(status_code=401, detail="Session invalid or expired")
                        logger.info(f"[AUTH DEBUG] Session {session_id} validated and updated")
                finally:
                    db.close()

            return user
        except HTTPException as e:
            logger.error(f"[AUTH DEBUG] Cookie auth FAILED: {e.status_code} - {e.detail}")
            pass  # Fall through to header auth

    # Fall back to header auth (legacy method)
    auth_header = request.headers.get("authorization")
    logger.info(f"[AUTH DEBUG] Authorization header present: {bool(auth_header)}")

    try:
        user = await get_current_user_from_header(request)
        logger.info(f"[AUTH DEBUG] Header auth SUCCESS - User: {user.email}")

        # Validate session if session_id is present (same as cookie auth)
        session_id = get_session_id_from_request(request)
        if session_id:
            from services.session_service import session_service
            from db.session import get_db
            db = next(get_db())
            try:
                logger.info(f"[AUTH DEBUG] Validating session: {session_id}")
                session_exists = session_service.get_session_by_id(db, session_id)

                if not session_exists:
                    # Session doesn't exist - create it (handles legacy logins before session mgmt)
                    logger.info(f"[AUTH DEBUG] Session {session_id} not found, creating it")
                    try:
                        session_service.create_session(
                            db=db,
                            user_id=str(user.id),
                            session_id=session_id,
                            request=request,
                            is_current=True,
                            expires_in_days=30
                        )
                        logger.info(f"[AUTH DEBUG] Created missing session {session_id}")
                    except Exception as e:
                        # Race condition - another request may have created it
                        logger.warning(f"[AUTH DEBUG] Failed to create session (race condition?): {e}")
                        # Try to validate it now (another thread likely created it)
                        if session_service.validate_session(db, session_id):
                            logger.info(f"[AUTH DEBUG] Session validated after race condition")
                        else:
                            logger.error(f"[AUTH DEBUG] Session still invalid after creation attempt")
                else:
                    # Session exists, validate and update it
                    if not session_service.validate_session(db, session_id):
                        logger.warning(f"[AUTH DEBUG] Invalid session {session_id}")
                        raise HTTPException(status_code=401, detail="Session invalid or expired")
                    logger.info(f"[AUTH DEBUG] Session {session_id} validated and updated")
            finally:
                db.close()

        return user
    except HTTPException as e:
        logger.error(f"[AUTH DEBUG] Header auth FAILED: {e.status_code} - {e.detail}")
        logger.error(f"[AUTH DEBUG] AUTHENTICATION FAILED - No valid cookie or header")
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
