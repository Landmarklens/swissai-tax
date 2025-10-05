from sqlalchemy.orm import Session
from typing import Optional, List

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
    if profile_data.firstname:
        user.first_name = profile_data.firstname
    if profile_data.lastname:
        user.last_name = profile_data.lastname
    if profile_data.phone:
        user.phone = profile_data.phone
    if profile_data.canton:
        user.canton = profile_data.canton
    if profile_data.city:
        user.municipality = profile_data.city

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
