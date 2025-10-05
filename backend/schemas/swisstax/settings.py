"""
Settings Pydantic schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict


class PreferencesUpdate(BaseModel):
    """Update user preferences"""
    language: Optional[str] = Field(None, pattern="^(de|fr|it|en)$")
    theme: Optional[str] = Field(None, pattern="^(light|dark|auto)$")
    auto_save_enabled: Optional[bool] = None
    auto_save_interval: Optional[int] = Field(None, ge=10, le=300)
    default_canton: Optional[str] = Field(None, min_length=2, max_length=2)


class NotificationsUpdate(BaseModel):
    """Update notification settings"""
    email_deadline_reminders: Optional[bool] = None
    email_document_processing: Optional[bool] = None
    email_tax_calculation: Optional[bool] = None
    email_marketing: Optional[bool] = None
    sms_account_updates: Optional[bool] = None
    sms_filing_reminders: Optional[bool] = None


class DocumentSettingsUpdate(BaseModel):
    """Update document management settings"""
    ocr_enabled: Optional[bool] = None
    compress_documents: Optional[bool] = None
    retention_years: Optional[int] = Field(None, ge=1, le=20)


class SettingsResponse(BaseModel):
    """Complete settings data"""
    preferences: Dict
    notifications: Dict
    documents: Dict

    class Config:
        from_attributes = True
