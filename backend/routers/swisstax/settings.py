"""Settings Router - condensed version"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from models.swisstax import User, UserSettings
from utils.auth import get_current_user
from schemas.swisstax.settings import PreferencesUpdate, NotificationsUpdate, SettingsResponse

router = APIRouter()

@router.get("/", response_model=SettingsResponse)
async def get_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
    return {
        "preferences": settings.preferences,
        "notifications": {"email": settings.email_notifications, "sms": settings.sms_notifications},
        "documents": {"ocr_enabled": settings.ocr_enabled, "retention_years": settings.retention_years}
    }

@router.put("/preferences")
async def update_preferences(data: PreferencesUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update preferences"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
    if data.language: settings.language = data.language
    if data.theme: settings.theme = data.theme
    if data.auto_save_enabled is not None: settings.auto_save_enabled = data.auto_save_enabled
    if data.auto_save_interval: settings.auto_save_interval = data.auto_save_interval
    db.commit()
    return {"message": "Preferences updated successfully"}
