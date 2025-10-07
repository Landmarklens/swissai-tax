"""
Profile Pydantic schemas
"""

from typing import Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class PersonalInfoUpdate(BaseModel):
    """Update personal information"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    canton: Optional[str] = Field(None, min_length=2, max_length=2)
    municipality: Optional[str] = Field(None, max_length=100)


class TaxProfileUpdate(BaseModel):
    """Update tax profile"""
    filing_status: Optional[str] = None  # single, married, divorced, widowed
    spouse_name: Optional[str] = None
    ahv_number: Optional[str] = None
    employer: Optional[str] = None
    dependents: Optional[List[Dict]] = None  # [{name, age}, ...]


class SecurityUpdate(BaseModel):
    """Update security settings"""
    current_password: str
    new_password: str = Field(..., min_length=8)


class ProfileResponse(BaseModel):
    """Complete profile data"""
    id: str
    email: str
    personal: Dict
    tax: Dict
    account: Dict

    class Config:
        from_attributes = True
