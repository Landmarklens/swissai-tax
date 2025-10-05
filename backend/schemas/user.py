from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    firstname: str
    lastname: str
    language: str = "en"  # de, en, fr, it


class UserProfile(BaseModel):
    id: UUID
    email: Optional[EmailStr] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    canton: Optional[str] = None  # SwissAI Tax uses canton instead of country/state
    municipality: Optional[str] = None  # SwissAI Tax uses municipality instead of city
    avatar_url: Optional[str] = None
    preferred_language: str = "en"
    is_active: bool = True

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    canton: Optional[str] = None
    city: Optional[str] = None  # Alias for municipality
    language: Optional[str] = None


class AvatarUrl(BaseModel):
    avatar_url: str


class UpdatePassword(BaseModel):
    password: str
    new_password: str


class UpdatePasswordOut(BaseModel):
    message: str
