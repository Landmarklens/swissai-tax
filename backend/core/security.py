"""
Security configuration for cookie-based authentication
"""
from fastapi import Cookie, HTTPException, Request
from jose import JWTError, jwt
from config import settings

ALGORITHM = "HS256"

# Cookie settings for production
COOKIE_SETTINGS = {
    "httponly": True,
    "secure": settings.ENVIRONMENT == "production",  # HTTPS only in production
    "samesite": "none" if settings.ENVIRONMENT == "production" else "lax",  # "none" required for cross-domain
    "max_age": 60 * 60 * 24 * 7,  # 7 days
    # Don't set domain - let browser handle it automatically for cross-domain (api.swissai.tax)
}


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
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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


async def get_current_user(request: Request):
    """
    Main authentication method that tries both cookie and header.
    This allows gradual migration from header-based to cookie-based auth.
    """
    # Try cookie first (new method)
    access_token = request.cookies.get("access_token")
    if access_token:
        try:
            return await get_current_user_from_cookie(request, access_token)
        except HTTPException:
            pass  # Fall through to header auth

    # Fall back to header auth (legacy method)
    try:
        return await get_current_user_from_header(request)
    except HTTPException:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
