from typing import List, Optional

from sqlalchemy.orm import Session

from models.swisstax import User
from schemas.user import UserCreate, UserProfileUpdate
from utils.password import get_password_hash, verify_password


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def get_list_of_users(db: Session) -> List[User]:
    """Get all active users"""
    return db.query(User).filter(User.is_active == True).all()


def update_user(db: Session, user: User, profile_data: UserProfileUpdate):
    """Update user profile"""
    if profile_data.first_name is not None:
        user.first_name = profile_data.first_name
    if profile_data.last_name is not None:
        user.last_name = profile_data.last_name
    if profile_data.phone is not None:
        user.phone = profile_data.phone
    if profile_data.address is not None:
        user.address = profile_data.address
    if profile_data.postal_code is not None:
        user.postal_code = profile_data.postal_code
    if profile_data.canton is not None:
        user.canton = profile_data.canton
    if profile_data.municipality is not None:
        user.municipality = profile_data.municipality
    if profile_data.preferred_language is not None:
        user.preferred_language = profile_data.preferred_language

    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user: User, new_password: str):
    """Update user password"""
    user.password = get_password_hash(new_password)
    db.commit()


def deactivate_user(db: Session, user_id: str):
    """Deactivate user account"""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_active = False
        db.commit()


def update_avatar(db: Session, file, user: User):
    """Update user avatar - placeholder"""
    # This would upload to S3 and return URL
    # For now, just return placeholder
    return {"avatar_url": "https://placeholder.com/avatar.jpg"}
