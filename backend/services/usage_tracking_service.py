"""
Usage Tracking Service

Tracks and enforces usage-based feature limits for subscription plans.
Supports monthly and annual reset periods.
"""

from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.swisstax.user import User
from models.swisstax.feature_usage import FeatureUsage
from models.swisstax.subscription import Subscription
from utils.plan_features import get_feature_limit, get_user_plan_type, is_grandfathered


class UsageTrackingService:
    """Service for tracking feature usage and enforcing limits"""

    def __init__(self, db: Session):
        self.db = db

    def get_current_period(self, reset_type: str = 'annual') -> tuple[date, date]:
        """
        Get the current tracking period based on reset type.

        Args:
            reset_type: 'monthly' or 'annual'

        Returns:
            Tuple of (period_start, period_end)
        """
        today = datetime.now().date()

        if reset_type == 'monthly':
            # Monthly period: first day of month to last day of month
            period_start = date(today.year, today.month, 1)

            # Calculate last day of month
            if today.month == 12:
                period_end = date(today.year + 1, 1, 1) - timedelta(days=1)
            else:
                period_end = date(today.year, today.month + 1, 1) - timedelta(days=1)

        else:  # annual
            # Annual period: January 1 to December 31
            period_start = date(today.year, 1, 1)
            period_end = date(today.year, 12, 31)

        return period_start, period_end

    def get_or_create_usage(
        self,
        user: User,
        feature_name: str,
        reset_type: str = 'annual'
    ) -> FeatureUsage:
        """
        Get or create a usage record for the current period.

        Args:
            user: User object
            feature_name: Name of feature to track
            reset_type: 'monthly' or 'annual'

        Returns:
            FeatureUsage record
        """
        period_start, period_end = self.get_current_period(reset_type)

        # Try to find existing usage record
        usage = (
            self.db.query(FeatureUsage)
            .filter(
                and_(
                    FeatureUsage.user_id == user.id,
                    FeatureUsage.feature_name == feature_name,
                    FeatureUsage.period_start == period_start,
                    FeatureUsage.period_end == period_end
                )
            )
            .first()
        )

        # Create if doesn't exist
        if not usage:
            usage = FeatureUsage(
                user_id=user.id,
                feature_name=feature_name,
                usage_count=0,
                period_start=period_start,
                period_end=period_end
            )
            self.db.add(usage)
            self.db.commit()
            self.db.refresh(usage)

        return usage

    def get_usage_count(
        self,
        user: User,
        feature_name: str,
        reset_type: str = 'annual'
    ) -> int:
        """
        Get current usage count for a feature.

        Args:
            user: User object
            feature_name: Name of feature
            reset_type: 'monthly' or 'annual'

        Returns:
            Current usage count
        """
        usage = self.get_or_create_usage(user, feature_name, reset_type)
        return usage.usage_count

    def increment_usage(
        self,
        user: User,
        feature_name: str,
        amount: int = 1,
        reset_type: str = 'annual'
    ) -> int:
        """
        Increment usage count for a feature atomically.

        Uses database-level update to prevent race conditions.

        Args:
            user: User object
            feature_name: Name of feature
            amount: Amount to increment (default: 1)
            reset_type: 'monthly' or 'annual'

        Returns:
            New usage count

        Raises:
            ValueError: If amount is negative
        """
        if amount < 0:
            raise ValueError("Amount must be non-negative")

        # Ensure usage record exists
        usage = self.get_or_create_usage(user, feature_name, reset_type)

        # Use database-level atomic increment to prevent race conditions
        from sqlalchemy import update
        period_start, period_end = self.get_current_period(reset_type)

        result = self.db.execute(
            update(FeatureUsage)
            .where(
                and_(
                    FeatureUsage.user_id == user.id,
                    FeatureUsage.feature_name == feature_name,
                    FeatureUsage.period_start == period_start,
                    FeatureUsage.period_end == period_end
                )
            )
            .values(usage_count=FeatureUsage.usage_count + amount)
            .returning(FeatureUsage.usage_count)
        )

        self.db.commit()

        # Get the new count
        new_count = result.scalar()
        return new_count if new_count is not None else usage.usage_count + amount

    def check_limit(
        self,
        user: User,
        feature_name: str,
        reset_type: str = 'annual',
        required_amount: int = 1
    ) -> Dict[str, Any]:
        """
        Check if user can use a feature without exceeding limit.

        Args:
            user: User object
            feature_name: Name of feature
            reset_type: 'monthly' or 'annual'
            required_amount: Amount needed (default: 1)

        Returns:
            Dict with:
                - allowed (bool): Whether usage is allowed
                - current_usage (int): Current usage count
                - limit (int|None): Limit (None = unlimited)
                - remaining (int|None): Remaining usage (None = unlimited)
                - is_grandfathered (bool): Whether user is grandfathered
        """
        # Grandfathered users have unlimited access
        if is_grandfathered(user):
            return {
                'allowed': True,
                'current_usage': 0,
                'limit': None,
                'remaining': None,
                'is_grandfathered': True
            }

        # Get user's limit for this feature
        limit = get_feature_limit(user, self.db, feature_name)

        # Unlimited access (limit is None)
        if limit is None:
            return {
                'allowed': True,
                'current_usage': 0,
                'limit': None,
                'remaining': None,
                'is_grandfathered': False
            }

        # Get current usage
        current_usage = self.get_usage_count(user, feature_name, reset_type)

        # Check if new usage would exceed limit
        allowed = (current_usage + required_amount) <= limit
        remaining = max(0, limit - current_usage)

        return {
            'allowed': allowed,
            'current_usage': current_usage,
            'limit': limit,
            'remaining': remaining,
            'is_grandfathered': False
        }

    def track_and_check(
        self,
        user: User,
        feature_name: str,
        reset_type: str = 'annual',
        increment: bool = True,
        amount: int = 1
    ) -> Dict[str, Any]:
        """
        Check limit and optionally increment usage in one operation.

        Args:
            user: User object
            feature_name: Name of feature
            reset_type: 'monthly' or 'annual'
            increment: Whether to increment if allowed
            amount: Amount to use/increment

        Returns:
            Dict with result of check_limit() plus:
                - incremented (bool): Whether usage was incremented
        """
        # Check if allowed
        result = self.check_limit(user, feature_name, reset_type, amount)

        # Increment if allowed and requested
        if result['allowed'] and increment:
            new_usage = self.increment_usage(user, feature_name, amount, reset_type)
            result['current_usage'] = new_usage
            result['incremented'] = True
            if result['limit'] is not None:
                result['remaining'] = max(0, result['limit'] - new_usage)
        else:
            result['incremented'] = False

        return result

    def get_all_usage_for_user(
        self,
        user: User,
        current_period_only: bool = True
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get all feature usage for a user.

        Args:
            user: User object
            current_period_only: If True, only return current period usage

        Returns:
            Dict mapping feature_name to usage info
        """
        query = self.db.query(FeatureUsage).filter(FeatureUsage.user_id == user.id)

        if current_period_only:
            today = datetime.now().date()
            query = query.filter(
                and_(
                    FeatureUsage.period_start <= today,
                    FeatureUsage.period_end >= today
                )
            )

        usages = query.all()

        result = {}
        for usage in usages:
            limit = get_feature_limit(user, self.db, usage.feature_name)
            result[usage.feature_name] = {
                'usage_count': usage.usage_count,
                'limit': limit,
                'remaining': None if limit is None else max(0, limit - usage.usage_count),
                'period_start': usage.period_start.isoformat(),
                'period_end': usage.period_end.isoformat(),
                'is_current_period': usage.is_current_period()
            }

        return result

    def reset_usage(
        self,
        user: User,
        feature_name: str,
        reset_type: str = 'annual'
    ) -> None:
        """
        Reset usage count for a feature.

        This is typically done automatically by period tracking,
        but can be used for manual resets.

        Args:
            user: User object
            feature_name: Name of feature
            reset_type: 'monthly' or 'annual'
        """
        usage = self.get_or_create_usage(user, feature_name, reset_type)
        usage.reset()
        self.db.commit()

    def cleanup_old_periods(self, days_to_keep: int = 365) -> int:
        """
        Delete usage records older than specified days.

        Args:
            days_to_keep: Keep records from last N days (default: 365)

        Returns:
            Number of records deleted
        """
        cutoff_date = datetime.now().date() - timedelta(days=days_to_keep)

        result = (
            self.db.query(FeatureUsage)
            .filter(FeatureUsage.period_end < cutoff_date)
            .delete()
        )

        self.db.commit()
        return result


# Helper function for easy access
def get_usage_service(db: Session) -> UsageTrackingService:
    """
    Get an instance of UsageTrackingService.

    Args:
        db: Database session

    Returns:
        UsageTrackingService instance
    """
    return UsageTrackingService(db)
