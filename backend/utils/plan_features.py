"""
Feature definitions and access control for subscription plans.

Phase 0: All features enabled for all plans during development.
This allows us to test the infrastructure without restricting users.

To enforce limits, update PLAN_FEATURES and add @require_feature() decorators to routes.
"""
from typing import Optional, Dict, Any, Callable
from functools import wraps
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models.swisstax.subscription import Subscription
from backend.models.swisstax.user import User

logger = logging.getLogger(__name__)


# Grandfather clause: Users created before this date get all features
# Set to None to disable grandfathering, or set before Phase 3 rollout
FEATURE_GATING_ROLLOUT_DATE: Optional[datetime] = None  # datetime(2025, 11, 1, 0, 0, 0)


# Feature matrix: maps plan types to their feature limits
# Phase 0: All features unlimited/enabled for all plans
PLAN_FEATURES = {
    'free': {
        # Filing limits
        'filings_per_year': 999,  # Unlimited (temporary)
        'filing_amendments': True,

        # Document management
        'document_uploads': None,  # Unlimited (temporary)
        'document_storage_mb': 999999,  # Unlimited (temporary)
        'document_ocr': True,

        # AI features
        'ai_questions_limit': None,  # Unlimited (temporary)
        'ai_optimization': True,  # Enabled (temporary)
        'ai_tax_assistant': True,
        'ai_document_analysis': True,

        # Export features
        'pdf_export': 'professional',  # Full access (temporary)
        'csv_export': True,
        'bulk_export': True,

        # Comparison & analysis
        'canton_comparison': 999,  # Unlimited (temporary)
        'tax_scenarios': True,
        'multi_year_comparison': True,

        # Support features
        'expert_review': True,  # Enabled (temporary)
        'priority_support': True,
        'email_support': True,
        'phone_support': True,

        # Advanced features
        'multi_property': True,
        'joint_filing': True,
        'business_income': True,
        'investment_income': True,
        'foreign_income': True,

        # API access
        'api_access': True,
        'api_rate_limit': 999999,  # Unlimited (temporary)
    },
    'basic': {
        # Same as free for Phase 0
        'filings_per_year': 999,
        'filing_amendments': True,
        'document_uploads': None,
        'document_storage_mb': 999999,
        'document_ocr': True,
        'ai_questions_limit': None,
        'ai_optimization': True,
        'ai_tax_assistant': True,
        'ai_document_analysis': True,
        'pdf_export': 'professional',
        'csv_export': True,
        'bulk_export': True,
        'canton_comparison': 999,
        'tax_scenarios': True,
        'multi_year_comparison': True,
        'expert_review': True,
        'priority_support': True,
        'email_support': True,
        'phone_support': True,
        'multi_property': True,
        'joint_filing': True,
        'business_income': True,
        'investment_income': True,
        'foreign_income': True,
        'api_access': True,
        'api_rate_limit': 999999,
    },
    'pro': {
        # Same as free for Phase 0
        'filings_per_year': 999,
        'filing_amendments': True,
        'document_uploads': None,
        'document_storage_mb': 999999,
        'document_ocr': True,
        'ai_questions_limit': None,
        'ai_optimization': True,
        'ai_tax_assistant': True,
        'ai_document_analysis': True,
        'pdf_export': 'professional',
        'csv_export': True,
        'bulk_export': True,
        'canton_comparison': 999,
        'tax_scenarios': True,
        'multi_year_comparison': True,
        'expert_review': True,
        'priority_support': True,
        'email_support': True,
        'phone_support': True,
        'multi_property': True,
        'joint_filing': True,
        'business_income': True,
        'investment_income': True,
        'foreign_income': True,
        'api_access': True,
        'api_rate_limit': 999999,
    },
    'premium': {
        # Same as free for Phase 0
        'filings_per_year': 999,
        'filing_amendments': True,
        'document_uploads': None,
        'document_storage_mb': 999999,
        'document_ocr': True,
        'ai_questions_limit': None,
        'ai_optimization': True,
        'ai_tax_assistant': True,
        'ai_document_analysis': True,
        'pdf_export': 'professional',
        'csv_export': True,
        'bulk_export': True,
        'canton_comparison': 999,
        'tax_scenarios': True,
        'multi_year_comparison': True,
        'expert_review': True,
        'priority_support': True,
        'email_support': True,
        'phone_support': True,
        'multi_property': True,
        'joint_filing': True,
        'business_income': True,
        'investment_income': True,
        'foreign_income': True,
        'api_access': True,
        'api_rate_limit': 999999,
    }
}


def is_grandfathered(user: User) -> bool:
    """
    Check if user is grandfathered (created before feature gating rollout).

    Grandfathered users get all features regardless of plan.
    This prevents alienating early adopters.

    Args:
        user: The user object

    Returns:
        True if user is grandfathered, False otherwise
    """
    if FEATURE_GATING_ROLLOUT_DATE is None:
        return False

    # Handle timezone-aware vs naive datetime comparison
    user_created = user.created_at
    rollout_date = FEATURE_GATING_ROLLOUT_DATE

    # If user_created is timezone-aware and rollout_date is naive, make rollout_date aware
    if user_created.tzinfo is not None and rollout_date.tzinfo is None:
        from datetime import timezone
        rollout_date = rollout_date.replace(tzinfo=timezone.utc)
    # If user_created is naive and rollout_date is aware, make user_created aware
    elif user_created.tzinfo is None and rollout_date.tzinfo is not None:
        from datetime import timezone
        user_created = user_created.replace(tzinfo=timezone.utc)

    return user_created < rollout_date


def get_user_plan_type(user: User, db: Session) -> str:
    """
    Get the user's current plan type based on subscription status.

    Args:
        user: The user object
        db: Database session

    Returns:
        Plan type: 'free', 'basic', 'pro', or 'premium'
    """
    # Check for active or trialing subscription
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user.id,
            Subscription.status.in_(['active', 'trialing'])
        )
        .order_by(Subscription.created_at.desc())
        .first()
    )

    if subscription:
        plan_type = subscription.plan_type

        # Validate plan type
        if plan_type not in PLAN_FEATURES:
            logger.warning(
                f"Invalid plan_type '{plan_type}' for user {user.id}, "
                f"subscription {subscription.id}. Defaulting to 'free'."
            )
            return 'free'

        return plan_type

    # Default to free plan if no subscription
    return 'free'


def get_active_subscription(user: User, db: Session) -> Optional[Subscription]:
    """
    Get the user's active subscription.

    Args:
        user: The user object
        db: Database session

    Returns:
        Active subscription or None
    """
    return (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user.id,
            Subscription.status.in_(['active', 'trialing'])
        )
        .order_by(Subscription.created_at.desc())
        .first()
    )


def get_plan_features(plan_type: str) -> Dict[str, Any]:
    """
    Get all features for a specific plan type.

    Args:
        plan_type: One of 'free', 'basic', 'pro', 'premium'

    Returns:
        Dictionary of feature names to their values/limits
    """
    return PLAN_FEATURES.get(plan_type, PLAN_FEATURES['free'])


def has_feature(user: User, db: Session, feature_name: str) -> bool:
    """
    Check if a user has access to a specific feature.

    Phase 0: Always returns True (all features enabled).

    Args:
        user: The user object
        db: Database session
        feature_name: Name of the feature to check

    Returns:
        True if user has access, False otherwise
    """
    # Grandfather clause: early users get everything
    if is_grandfathered(user):
        return True

    plan_type = get_user_plan_type(user, db)
    features = get_plan_features(plan_type)

    # Get feature value
    feature_value = features.get(feature_name, False)

    # Boolean features: return the value directly
    if isinstance(feature_value, bool):
        return feature_value

    # Numeric limits: if None (unlimited) or > 0, return True
    if feature_value is None or (isinstance(feature_value, (int, float)) and feature_value > 0):
        return True

    # String features (like pdf_export): if not empty, return True
    if isinstance(feature_value, str) and feature_value:
        return True

    return False


def get_feature_limit(user: User, db: Session, feature_name: str) -> Optional[int]:
    """
    Get the usage limit for a specific feature.

    Args:
        user: The user object
        db: Database session
        feature_name: Name of the feature to check

    Returns:
        The numeric limit, or None if unlimited
    """
    # Grandfathered users have unlimited access
    if is_grandfathered(user):
        return None

    plan_type = get_user_plan_type(user, db)
    features = get_plan_features(plan_type)

    feature_value = features.get(feature_name)

    # Return numeric limits
    if isinstance(feature_value, (int, float)):
        # Return None for "unlimited" values (999+)
        if feature_value >= 999:
            return None
        return int(feature_value)

    # Non-numeric features have no limit concept
    return None


def get_user_features(user: User, db: Session) -> Dict[str, Any]:
    """
    Get all features available to a user.

    Args:
        user: The user object
        db: Database session

    Returns:
        Dictionary of all features and their values for the user's plan
    """
    plan_type = get_user_plan_type(user, db)
    return get_plan_features(plan_type)


# Plan comparison helper
def compare_plans(current_plan: str, target_plan: str) -> Dict[str, Any]:
    """
    Compare features between two plans.

    Args:
        current_plan: Current plan type
        target_plan: Target plan type

    Returns:
        Dictionary with 'upgrades', 'downgrades', and 'unchanged' features
    """
    current_features = get_plan_features(current_plan)
    target_features = get_plan_features(target_plan)

    upgrades = {}
    downgrades = {}
    unchanged = {}

    # Compare all features
    all_features = set(current_features.keys()) | set(target_features.keys())

    for feature in all_features:
        current_value = current_features.get(feature)
        target_value = target_features.get(feature)

        if current_value == target_value:
            unchanged[feature] = current_value
        elif _is_upgrade(current_value, target_value):
            upgrades[feature] = {
                'from': current_value,
                'to': target_value
            }
        else:
            downgrades[feature] = {
                'from': current_value,
                'to': target_value
            }

    return {
        'upgrades': upgrades,
        'downgrades': downgrades,
        'unchanged': unchanged
    }


def _is_upgrade(current_value: Any, target_value: Any) -> bool:
    """Helper to determine if a feature change is an upgrade."""
    # Boolean: False -> True is upgrade
    if isinstance(current_value, bool) and isinstance(target_value, bool):
        return not current_value and target_value

    # Numeric: higher is better (None means unlimited)
    if isinstance(current_value, (int, float)) and isinstance(target_value, (int, float)):
        return target_value > current_value
    if current_value is not None and target_value is None:
        return True  # Limited -> Unlimited

    # String: any change to non-empty is upgrade
    if not current_value and target_value:
        return True

    return False


# ============================================================================
# DECORATORS FOR ROUTE PROTECTION
# ============================================================================

def require_feature(feature_name: str):
    """
    Decorator to require a specific feature for route access.

    IMPORTANT: This decorator checks feature access but does NOT inject
    dependencies. The route function must still declare db and current_user
    with Depends() as normal.

    Usage:
        @router.post("/optimize")
        @require_feature('ai_optimization')
        async def optimize_tax(
            filing_id: str,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            # Implementation here
            ...

    Args:
        feature_name: Name of the feature to check (e.g., 'ai_optimization')

    Returns:
        Decorated function that checks feature access before execution
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user and db from kwargs (injected by FastAPI)
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')

            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Authentication dependencies not properly configured"
                )

            # Check feature access
            if not has_feature(current_user, db, feature_name):
                subscription = get_active_subscription(current_user, db)
                current_plan = subscription.plan_type if subscription else 'free'
                required_plan = _get_required_plan(feature_name)

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "feature_restricted",
                        "message": f"This feature requires a {required_plan} plan or higher",
                        "feature": feature_name,
                        "current_plan": current_plan,
                        "required_plan": required_plan,
                        "upgrade_url": "/subscription/plans"
                    }
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_plan(min_plan: str):
    """
    Decorator to require a minimum subscription plan.

    Usage:
        @router.post("/optimize")
        @require_plan('pro')
        async def optimize_tax(
            filing_id: str,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            # Implementation here
            ...

    Args:
        min_plan: Minimum plan required ('free', 'basic', 'pro', 'premium')

    Returns:
        Decorated function that checks plan level before execution
    """
    plan_order = ['free', 'basic', 'pro', 'premium']

    if min_plan not in plan_order:
        raise ValueError(f"Invalid plan: {min_plan}. Must be one of {plan_order}")

    min_plan_index = plan_order.index(min_plan)

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user and db from kwargs
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')

            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Authentication dependencies not properly configured"
                )

            # Check plan level
            current_plan = get_user_plan_type(current_user, db)
            current_plan_index = plan_order.index(current_plan) if current_plan in plan_order else 0

            if current_plan_index < min_plan_index:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "plan_required",
                        "message": f"This feature requires a {min_plan} plan or higher",
                        "current_plan": current_plan,
                        "required_plan": min_plan,
                        "upgrade_url": "/subscription/plans"
                    }
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def _get_required_plan(feature_name: str) -> str:
    """
    Determine the minimum plan that unlocks a feature.

    Args:
        feature_name: Name of the feature

    Returns:
        Minimum plan type that has this feature
    """
    # Check plans in order from lowest to highest
    plan_order = ['free', 'basic', 'pro', 'premium']

    for plan in plan_order:
        features = PLAN_FEATURES.get(plan, {})
        feature_value = features.get(feature_name)

        # If feature is enabled in this plan, return it
        if feature_value:
            # Boolean: must be True
            if isinstance(feature_value, bool) and feature_value:
                return plan
            # Numeric: must be > 0 or None (unlimited)
            if isinstance(feature_value, (int, float)) and feature_value > 0:
                return plan
            if feature_value is None:  # Unlimited
                return plan
            # String: non-empty means enabled
            if isinstance(feature_value, str) and feature_value:
                return plan

    return 'premium'  # Default to highest plan
