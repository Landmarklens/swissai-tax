"""
User Counter Router

API endpoint for retrieving the daily user counter.
"""
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from db.session import get_db
from services.user_counter_service import UserCounterService
from utils.router import Router


router = Router()


class UserCounterResponse(BaseModel):
    """Response schema for user counter endpoint"""
    user_count: int
    target_count: int
    last_reset: datetime
    time_until_midnight: float  # in seconds

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


@router.get("/", response_model=UserCounterResponse)
async def get_user_counter(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get the current daily user counter with automatic increment.

    The counter:
    - Starts at 15 daily users
    - Has a random target between 15 and 291 daily users
    - Increments randomly throughout the day
    - Resets at midnight to a new random target

    Returns:
        UserCounterResponse: Current count, target, last reset time, and seconds until midnight
    """
    result = UserCounterService.get_user_counter(db)
    return UserCounterResponse(**result)
