"""
Subscription Guard Utilities
Provides functions to check user subscription status and access control
"""
from typing import Optional

from sqlalchemy.orm import Session

from models.swisstax import Subscription, User


def get_active_subscription(user: User, db: Session) -> Optional[Subscription]:
    """
    Get the user's active subscription if it exists.

    This function queries the database for an active subscription belonging to the user.
    A subscription is considered active if its status is 'active'.

    Args:
        user: User model instance to check subscription for
        db: Database session for querying

    Returns:
        Subscription: The active subscription object if found
        None: If the user has no active subscription

    Usage:
        Used during authentication to determine if a user should be redirected
        to the subscription checkout page. If this returns None, the user needs
        to subscribe.
    """
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user.id,
            Subscription.status == "active"
        )
        .first()
    )

    return subscription
