from pydantic import BaseModel, EmailStr

from models.user import UserType, UserStatus, UserLanguage, DEFAULT_USER_LANGUAGE


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    firstname: str
    lastname: str
    user_type: UserType
    status: UserStatus = UserStatus.ACTIVE
    language: UserLanguage = DEFAULT_USER_LANGUAGE

    class Config:
        use_enum_values = True


class UserProfile(BaseModel):
    id: int
    email: EmailStr | None = None
    firstname: str | None = None
    lastname: str | None = None
    phone: str | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    address: str | None = None
    zip_code: str | None = None
    avatar_url: str | None = None
    user_type: UserType
    status: UserStatus
    language: UserLanguage

    class Config:
        use_enum_values = True


class UserProfileUpdate(BaseModel):
    firstname: str | None = None
    lastname: str | None = None
    phone: str | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    zip_code: str | None = None
    address: str | None = None
    language: UserLanguage | None = None

class AvatarUrl(BaseModel):
    avatar_url: str


class UpdatePassword(BaseModel):
    password: str
    new_password: str

class UpdatePasswordOut(BaseModel):
    message: str
