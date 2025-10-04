import time
from typing import Optional

from google_auth_oauthlib.flow import Flow
from jose import JWTError, jwt
from fastapi import Depends
from sqlalchemy.orm import Session
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import settings
from db.session import get_db
from models import User
from models.user import UserType
from schemas.auth import UserLoginSchema
from services.user import get_user_by_email
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


def sign_jwt(email: str, user_type: UserType = UserType.TENANT) -> dict[str, str]:
    payload = {
        "email": email,
        "user_type": user_type.value,
        "exp": time.time() + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)  # Convert minutes to seconds
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

    return token_response(token)


def get_google_flow() -> Flow:
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


flow = get_google_flow()


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
