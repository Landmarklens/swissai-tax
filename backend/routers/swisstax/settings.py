"""Settings Router - condensed version"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.swisstax import User, UserSettings
from schemas.swisstax.settings import (NotificationsUpdate, PreferencesUpdate,
                                       SettingsResponse)
from core.security import get_current_user

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
        db.commit()
        db.refresh(settings)

    if data.language is not None: settings.language = data.language
    if data.theme is not None: settings.theme = data.theme
    if data.auto_save_enabled is not None: settings.auto_save_enabled = data.auto_save_enabled
    if data.auto_save_interval is not None: settings.auto_save_interval = data.auto_save_interval
    if data.auto_calculate_enabled is not None: settings.auto_calculate_enabled = data.auto_calculate_enabled
    if data.show_tax_tips is not None: settings.show_tax_tips = data.show_tax_tips
    if data.default_tax_year is not None: settings.default_tax_year = data.default_tax_year
    if data.rounding_method is not None: settings.rounding_method = data.rounding_method
    if data.default_canton is not None: settings.default_canton = data.default_canton
    db.commit()
    return {"message": "Preferences updated successfully"}

@router.put("/notifications")
async def update_notifications(data: NotificationsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update notification settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    if data.email_deadline_reminders is not None: settings.email_deadline_reminders = data.email_deadline_reminders
    if data.email_document_processing is not None: settings.email_document_processing = data.email_document_processing
    if data.email_tax_calculation is not None: settings.email_tax_calculation = data.email_tax_calculation
    if data.email_marketing is not None: settings.email_marketing = data.email_marketing
    if data.sms_account_updates is not None: settings.sms_account_updates = data.sms_account_updates
    if data.sms_filing_reminders is not None: settings.sms_filing_reminders = data.sms_filing_reminders
    db.commit()
    return {"message": "Notifications updated successfully"}
