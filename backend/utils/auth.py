import time
from typing import Optional

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google_auth_oauthlib.flow import Flow
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import settings
from db.session import get_db
from models.swisstax import User
from schemas.auth import UserLoginSchema
from services.user_service import get_user_by_email
from utils.password import verify_password

ALGORITHM = "HS256"

security = HTTPBearer()


def check_user(data: UserLoginSchema, db: Session):
    user = get_user_by_email(db, data.email)
    if user and user.email == data.email and verify_password(data.password, user.password):
        return True
    return False


def token_response(token: str, token_type: str = "bearer") -> dict[str, str]:
    return {
        "access_token": token,
        "token_type": token_type
    }


def sign_jwt(email: str, user_type: Optional[str] = None, session_id: Optional[str] = None) -> dict[str, str]:
    import uuid
    payload = {
        "email": email,
        "exp": time.time() + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60),  # Convert minutes to seconds
        "session_id": session_id or str(uuid.uuid4())
    }
    if user_type:
        payload["user_type"] = user_type
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

    return token_response(token)


def sign_temp_2fa_jwt(email: str, user_id: str) -> dict[str, str]:
    """
    Create a temporary JWT token for 2FA verification
    This token is only valid for 5 minutes and requires_2fa verification

    Args:
        email: User's email
        user_id: User's ID

    Returns:
        dict with temp_token and token_type
    """
    payload = {
        "email": email,
        "user_id": user_id,
        "requires_2fa": True,
        "exp": time.time() + (5 * 60)  # 5 minutes expiry
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

    return {
        "temp_token": token,
        "token_type": "bearer"
    }


def verify_temp_2fa_jwt(token: str) -> Optional[dict]:
    """
    Verify a temporary 2FA token

    Args:
        token: The temporary JWT token

    Returns:
        Payload dict if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])

        # Verify it's a 2FA temp token
        if not payload.get("requires_2fa"):
            return None

        return payload
    except JWTError:
        return None


def get_google_flow() -> Flow:
    """
    Get Google OAuth flow instance.

    Raises:
        ValueError: If Google OAuth credentials are not configured
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_REDIRECT_URI:
        raise ValueError(
            "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, "
            "GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in environment or Parameter Store."
        )

    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
        }
    }

    return Flow.from_client_config(
        client_config,
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )


# Create flow getter function - call this instead of using flow directly
def get_flow():
    """Get the Google OAuth flow instance (creates on each call to avoid stale credentials)"""
    return get_google_flow()


class JWTHandler(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTHandler, self).__init__(auto_error=auto_error)
        self.token = None
        self.payload = None

    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super(JWTHandler, self).__call__(request)

        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(status_code=403, detail="Invalid token or expired token.")
            self.token = credentials.credentials
            return self
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, jwtoken: str) -> bool:
        try:
            self.payload = jwt.decode(jwtoken, settings.SECRET_KEY, algorithms=[ALGORITHM])
            return True
        except JWTError:
            self.payload = None
            return False

    def get_user(self, db: Session) -> Optional[User]:
        if not self.payload:
            return None
        user_email = self.payload.get("email")
        if user_email:
            user = db.query(User).filter(User.email == user_email).first()
            return user
        return None

    def get_payload(self) -> dict:
        return self.payload or {}


async def get_current_user(
        jwt_handler: JWTHandler = Depends(JWTHandler()),
        db: Session = Depends(get_db)
):
    user = jwt_handler.get_user(db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    return user


async def get_current_user_optional(
        request: Request,
        db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    try:
        # Check if authorization header exists
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        jwt_handler = JWTHandler()
        jwt_handler.credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        user = jwt_handler.get_user(db)
        if user and user.is_active:
            return user
    except Exception:
        pass
    
    return None
