from sqlalchemy.orm import Session

from schemas.user import UserCreate
from models.user import User, DEFAULT_USER_STATUS, AuthProvider, UserType, UserLanguage
from utils.password import get_password_hash
from utils.sanitizer import sanitize_user_profile


def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    
    # Sanitize user data
    user_data = user.model_dump()
    user_data = sanitize_user_profile(user_data)

    user = User(
        email=user_data.get('email'),
        password=hashed_password,
        firstname=user_data.get('firstname'),
        lastname=user_data.get('lastname'),
        user_type=user.user_type,
        language=user.language,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


async def create_social_user(db: Session, user_info: dict, provider: AuthProvider):
    # Sanitize user info
    user_info = sanitize_user_profile(user_info)
    
    existing_user = db.query(User).filter(User.email == user_info["email"]).first()
    if existing_user:
        existing_user.provider = provider
        existing_user.provider_id = user_info.get("provider_id")
        existing_user.status = DEFAULT_USER_STATUS
        existing_user.user_type = UserType(user_info["user_type"])
        existing_user.language = UserLanguage(user_info["language"])
        existing_user.avatar_url = user_info.get("avatar_url")
        existing_user.is_active = True
        db.commit()
        return existing_user

    # Create new user with only necessary fields
    new_user = User(
        email=user_info.get("email"),
        provider=provider,
        provider_id=user_info.get("provider_id"),
        firstname=user_info.get("firstname"),
        lastname=user_info.get("lastname"),
        avatar_url=user_info.get("avatar_url"),
        user_type=UserType(user_info["user_type"]),
        language=UserLanguage(user_info["language"]),
        status=DEFAULT_USER_STATUS,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
