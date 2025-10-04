from pydantic import BaseModel, Field, EmailStr, HttpUrl

from models.user import UserType


class GoogleLoginOut(BaseModel):
    authorization_url: HttpUrl


class UserLoginSchema(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(...)
    user_type: UserType | None = Field(UserType.TENANT)
