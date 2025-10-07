"""Profile Router - condensed version"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.swisstax import User, UserSettings
from schemas.swisstax.profile import (PersonalInfoUpdate, ProfileResponse,
                                      TaxProfileUpdate)
from utils.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user profile"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "personal": {
            "fullName": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone,
            "canton": current_user.canton,
            "municipality": current_user.municipality
        },
        "tax": {"filing_status": "single", "ahv_number": None},  # Placeholder
        "account": {"created_at": current_user.created_at, "language": settings.language if settings else "de"}
    }

@router.put("/personal")
async def update_personal(data: PersonalInfoUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update personal information"""
    if data.first_name: current_user.first_name = data.first_name
    if data.last_name: current_user.last_name = data.last_name
    if data.phone: current_user.phone = data.phone
    if data.canton: current_user.canton = data.canton
    if data.municipality: current_user.municipality = data.municipality
    db.commit()
    return {"message": "Profile updated successfully"}
