from sqlalchemy.orm import Session

from models.swisstax import User
from schemas.user import UserCreate
from utils.password import get_password_hash
from utils.sanitizer import sanitize_user_profile


# Define constants (removed from old User model)
class AuthProvider:
    LOCAL = "local"
    GOOGLE = "google"


def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)

    # Sanitize user data
    user_data = user.model_dump()
    user_data = sanitize_user_profile(user_data)

    user_obj = User(
        email=user_data.get('email'),
        password=hashed_password,
        first_name=user_data.get('first_name'),
        last_name=user_data.get('last_name'),
        preferred_language=user.preferred_language if hasattr(user, 'preferred_language') else 'en',
        provider='local',
        is_active=True
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)

    return user_obj


async def create_social_user(db: Session, user_info: dict, provider: str):
    # Sanitize user info
    user_info = sanitize_user_profile(user_info)

    existing_user = db.query(User).filter(User.email == user_info["email"]).first()
    if existing_user:
        existing_user.provider = provider
        existing_user.provider_id = user_info.get("provider_id")
        existing_user.preferred_language = user_info.get("preferred_language", "en")
        existing_user.avatar_url = user_info.get("avatar_url")
        existing_user.is_active = True
        db.commit()
        return existing_user

    # Create new user
    new_user = User(
        email=user_info.get("email"),
        provider=provider,
        provider_id=user_info.get("provider_id"),
        first_name=user_info.get("first_name"),
        last_name=user_info.get("last_name"),
        avatar_url=user_info.get("avatar_url"),
        preferred_language=user_info.get("preferred_language", "en"),
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
