from typing import Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class GoogleLoginOut(BaseModel):
    authorization_url: HttpUrl


class UserLoginSchema(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(...)
    user_type: Optional[str] = Field(None)  # Optional for SwissAI Tax (no user types)
