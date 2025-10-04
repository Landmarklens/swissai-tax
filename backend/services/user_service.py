from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.user import User, UserStatus
from schemas.user import UserProfileUpdate
from services.aws_s3_service import AWSS3Service
from utils.password import get_password_hash, verify_password
from utils.sanitizer import sanitize_user_profile
from sqlalchemy import func


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(func.lower(User.email) == email.lower()).first()


def get_list_of_users(db: Session):
    return db.query(User).all()


def update_user(db: Session, current_user: User, new_user: UserProfileUpdate):
    user = get_user_by_email(db, current_user.email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = new_user.model_dump(exclude_unset=True)
    
    # Sanitize user input to prevent XSS
    update_data = sanitize_user_profile(update_data)

    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            user.password = get_password_hash(password)

    # Only update fields that exist on the User model
    for key, value in update_data.items():
        if hasattr(user, key):
            setattr(user, key, value)
        else:
            # Log warning but don't fail
            print(f"Warning: Attempted to set non-existent field {key} on User model")

    user.status = UserStatus.ACTIVE
    user.is_active = True

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def update_password(db: Session, user: User, new_password: str):

    user.password = get_password_hash(new_password)

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def deactivate_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()

    if not user or user.status == UserStatus.INACTIVE:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = UserStatus.INACTIVE
    db.commit()
    db.refresh(user)
    return user


def update_avatar(db: Session, file, user):
    from utils.file_validation import validate_image_upload, sanitize_filename
    
    # Validate file before upload
    mime_type, file_size = validate_image_upload(file)
    
    # Sanitize filename
    safe_filename = sanitize_filename(file.filename)
    
    s3_service = AWSS3Service()
    
    try:
        # Upload with sanitized filename
        avatar_url = s3_service.upload_file_to_s3(file, object_name=f"avatars/{user.id}_{safe_filename}")

        old_avatar_url = user.avatar_url
        user.avatar_url = avatar_url

        db.add(user)
        db.commit()
        db.refresh(user)

        # Clean up old avatar if exists
        if old_avatar_url:
            try:
                file_name = old_avatar_url.rsplit('/')[-1]
                if s3_service.check_file_exists(file_name):
                    s3_service.delete_file_by_url(old_avatar_url)
            except Exception as e:
                # Log error but don't fail the upload
                import logging
                logging.warning(f"Failed to delete old avatar: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to upload avatar")
    
    return user
