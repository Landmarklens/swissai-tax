"""
Unit tests for plan_features module.

Tests feature matrix, decorators, grandfathering, and plan comparison.
"""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, Mock, patch
from fastapi import HTTPException

from backend.utils.plan_features import (
    PLAN_FEATURES,
    FEATURE_GATING_ROLLOUT_DATE,
    is_grandfathered,
    get_user_plan_type,
    get_active_subscription,
    get_plan_features,
    has_feature,
    get_feature_limit,
    get_user_features,
    compare_plans,
    require_feature,
    require_plan,
    _get_required_plan,
    _is_upgrade,
)
from backend.models.swisstax.user import User
from backend.models.swisstax.subscription import Subscription


# ============================================================================
# TEST: is_grandfathered
# ============================================================================

@pytest.mark.unit
def test_is_grandfathered_disabled():
    """Test grandfathering when FEATURE_GATING_ROLLOUT_DATE is None"""
    user = Mock(spec=User)
    user.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)

    # With FEATURE_GATING_ROLLOUT_DATE = None, should return False
    result = is_grandfathered(user)
    assert result is False


@pytest.mark.unit
@patch('backend.utils.plan_features.FEATURE_GATING_ROLLOUT_DATE', datetime(2025, 11, 1))
def test_is_grandfathered_before_date():
    """Test user created before rollout date is grandfathered"""
    user = Mock(spec=User)
    user.created_at = datetime(2025, 10, 1, tzinfo=timezone.utc)

    result = is_grandfathered(user)
    assert result is True


@pytest.mark.unit
@patch('backend.utils.plan_features.FEATURE_GATING_ROLLOUT_DATE', datetime(2025, 11, 1))
def test_is_grandfathered_after_date():
    """Test user created after rollout date is not grandfathered"""
    user = Mock(spec=User)
    user.created_at = datetime(2025, 12, 1, tzinfo=timezone.utc)

    result = is_grandfathered(user)
    assert result is False


@pytest.mark.unit
@patch('backend.utils.plan_features.FEATURE_GATING_ROLLOUT_DATE', datetime(2025, 11, 1, tzinfo=timezone.utc))
def test_is_grandfathered_timezone_aware_user():
    """Test timezone-aware comparison"""
    user = Mock(spec=User)
    user.created_at = datetime(2025, 10, 1, tzinfo=timezone.utc)

    result = is_grandfathered(user)
    assert result is True


@pytest.mark.unit
@patch('backend.utils.plan_features.FEATURE_GATING_ROLLOUT_DATE', datetime(2025, 11, 1))
def test_is_grandfathered_naive_user_datetime():
    """Test naive user datetime with aware rollout date"""
    user = Mock(spec=User)
    user.created_at = datetime(2025, 10, 1)  # Naive

    result = is_grandfathered(user)
    assert result is True


# ============================================================================
# TEST: get_user_plan_type
# ============================================================================

@pytest.mark.unit
def test_get_user_plan_type_free_no_subscription(mock_user, mock_db_session):
    """Test user with no subscription gets free plan"""
    # Setup mock query to return None
    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(None)

    result = get_user_plan_type(mock_user, mock_db_session)
    assert result == 'free'


@pytest.mark.unit
def test_get_user_plan_type_active_subscription(mock_user, mock_db_session):
    """Test user with active subscription"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'pro'
    mock_subscription.status = 'active'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = get_user_plan_type(mock_user, mock_db_session)
    assert result == 'pro'


@pytest.mark.unit
def test_get_user_plan_type_trialing_subscription(mock_user, mock_db_session):
    """Test user on trial gets their subscribed plan"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'premium'
    mock_subscription.status = 'trialing'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = get_user_plan_type(mock_user, mock_db_session)
    assert result == 'premium'


@pytest.mark.unit
def test_get_user_plan_type_invalid_plan_type(mock_user, mock_db_session):
    """Test invalid plan_type defaults to free with warning"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.id = 'sub_123'
    mock_subscription.plan_type = 'INVALID_PLAN'
    mock_subscription.status = 'active'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    with patch('backend.utils.plan_features.logger') as mock_logger:
        result = get_user_plan_type(mock_user, mock_db_session)

        assert result == 'free'
        mock_logger.warning.assert_called_once()
        assert 'Invalid plan_type' in str(mock_logger.warning.call_args)


# ============================================================================
# TEST: get_plan_features
# ============================================================================

@pytest.mark.unit
def test_get_plan_features_free():
    """Test getting free plan features"""
    features = get_plan_features('free')
    assert features is not None
    assert 'filings_per_year' in features
    assert 'ai_optimization' in features


@pytest.mark.unit
def test_get_plan_features_premium():
    """Test getting premium plan features"""
    features = get_plan_features('premium')
    assert features is not None
    assert features['filings_per_year'] == 999  # Phase 0: unlimited


@pytest.mark.unit
def test_get_plan_features_invalid_defaults_to_free():
    """Test invalid plan type defaults to free"""
    features = get_plan_features('INVALID')
    free_features = get_plan_features('free')
    assert features == free_features


# ============================================================================
# TEST: has_feature
# ============================================================================

@pytest.mark.unit
def test_has_feature_boolean_true(mock_user, mock_db_session):
    """Test boolean feature that is True"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'pro'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = has_feature(mock_user, mock_db_session, 'ai_optimization')
    assert result is True  # Phase 0: all features enabled


@pytest.mark.unit
def test_has_feature_numeric_positive(mock_user, mock_db_session):
    """Test numeric feature with positive limit"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'free'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = has_feature(mock_user, mock_db_session, 'filings_per_year')
    assert result is True  # Phase 0: 999 (unlimited)


@pytest.mark.unit
def test_has_feature_numeric_none_unlimited(mock_user, mock_db_session):
    """Test numeric feature with None (unlimited)"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'pro'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = has_feature(mock_user, mock_db_session, 'document_uploads')
    assert result is True  # Phase 0: None (unlimited)


@pytest.mark.unit
def test_has_feature_string_nonempty(mock_user, mock_db_session):
    """Test string feature with non-empty value"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'basic'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = has_feature(mock_user, mock_db_session, 'pdf_export')
    assert result is True  # 'professional' is non-empty string


@pytest.mark.unit
def test_has_feature_undefined_feature(mock_user, mock_db_session):
    """Test undefined feature returns False"""
    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(None)

    result = has_feature(mock_user, mock_db_session, 'nonexistent_feature')
    assert result is False


@pytest.mark.unit
@patch('backend.utils.plan_features.is_grandfathered', return_value=True)
def test_has_feature_grandfathered_user(mock_is_grandfathered, mock_user, mock_db_session):
    """Test grandfathered user has all features"""
    result = has_feature(mock_user, mock_db_session, 'any_feature')
    assert result is True


# ============================================================================
# TEST: get_feature_limit
# ============================================================================

@pytest.mark.unit
def test_get_feature_limit_numeric_limit(mock_user, mock_db_session):
    """Test getting numeric limit"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'basic'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    # In Phase 0, filings_per_year is 999, which should return None (unlimited)
    result = get_feature_limit(mock_user, mock_db_session, 'filings_per_year')
    assert result is None  # 999+ treated as unlimited


@pytest.mark.unit
def test_get_feature_limit_none_unlimited(mock_user, mock_db_session):
    """Test None returns as unlimited"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'pro'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = get_feature_limit(mock_user, mock_db_session, 'document_uploads')
    assert result is None  # None means unlimited


@pytest.mark.unit
def test_get_feature_limit_boolean_returns_none(mock_user, mock_db_session):
    """Test boolean features return None (no limit concept)"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'premium'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = get_feature_limit(mock_user, mock_db_session, 'ai_optimization')
    assert result is None  # Boolean features have no limit


@pytest.mark.unit
@patch('backend.utils.plan_features.is_grandfathered', return_value=True)
def test_get_feature_limit_grandfathered(mock_is_grandfathered, mock_user, mock_db_session):
    """Test grandfathered user gets unlimited"""
    result = get_feature_limit(mock_user, mock_db_session, 'filings_per_year')
    assert result is None  # Grandfathered = unlimited


# ============================================================================
# TEST: compare_plans
# ============================================================================

@pytest.mark.unit
def test_compare_plans_same():
    """Test comparing same plan"""
    result = compare_plans('pro', 'pro')
    assert len(result['upgrades']) == 0
    assert len(result['downgrades']) == 0
    assert len(result['unchanged']) > 0


@pytest.mark.unit
def test_compare_plans_upgrade():
    """Test upgrade from free to premium"""
    result = compare_plans('free', 'premium')

    # In Phase 0, all features are same, so everything should be unchanged
    assert len(result['unchanged']) > 0


@pytest.mark.unit
def test_compare_plans_downgrade():
    """Test downgrade from premium to free"""
    result = compare_plans('premium', 'free')

    # In Phase 0, all features are same
    assert len(result['unchanged']) > 0


# ============================================================================
# TEST: _is_upgrade helper
# ============================================================================

@pytest.mark.unit
def test_is_upgrade_boolean():
    """Test boolean upgrade detection"""
    assert _is_upgrade(False, True) is True
    assert _is_upgrade(True, False) is False
    assert _is_upgrade(True, True) is False


@pytest.mark.unit
def test_is_upgrade_numeric():
    """Test numeric upgrade detection"""
    assert _is_upgrade(5, 10) is True
    assert _is_upgrade(10, 5) is False
    assert _is_upgrade(10, 10) is False


@pytest.mark.unit
def test_is_upgrade_limited_to_unlimited():
    """Test upgrade from limited to unlimited (None)"""
    assert _is_upgrade(100, None) is True
    assert _is_upgrade(None, 100) is False


@pytest.mark.unit
def test_is_upgrade_string():
    """Test string upgrade detection"""
    assert _is_upgrade('', 'watermarked') is True
    assert _is_upgrade(None, 'professional') is True
    assert _is_upgrade('basic', 'professional') is False  # Not implemented


# ============================================================================
# TEST: _get_required_plan
# ============================================================================

@pytest.mark.unit
def test_get_required_plan_boolean_feature():
    """Test getting required plan for boolean feature"""
    # In Phase 0, ai_optimization is True for all plans including free
    result = _get_required_plan('ai_optimization')
    assert result == 'free'  # First plan with feature enabled


@pytest.mark.unit
def test_get_required_plan_numeric_feature():
    """Test getting required plan for numeric feature"""
    result = _get_required_plan('filings_per_year')
    assert result == 'free'  # Phase 0: all plans have 999


@pytest.mark.unit
def test_get_required_plan_nonexistent():
    """Test getting required plan for nonexistent feature defaults to premium"""
    result = _get_required_plan('nonexistent_feature')
    assert result == 'premium'


# ============================================================================
# TEST: Decorators
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_require_feature_decorator_allowed(mock_user, mock_db_session):
    """Test @require_feature allows access when user has feature"""
    from tests.conftest import create_mock_query_result
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'pro'
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    @require_feature('ai_optimization')
    async def test_endpoint(db, current_user):
        return {"status": "success"}

    result = await test_endpoint(db=mock_db_session, current_user=mock_user)
    assert result == {"status": "success"}


@pytest.mark.unit
@pytest.mark.asyncio
async def test_require_feature_decorator_denied():
    """Test @require_feature denies access when user lacks feature"""
    mock_user = Mock(spec=User)
    mock_user.id = 'user_123'
    mock_user.created_at = datetime.utcnow()

    mock_db = MagicMock()

    # Setup mock to return free plan with feature disabled
    with patch('backend.utils.plan_features.has_feature', return_value=False):
        with patch('backend.utils.plan_features.get_active_subscription', return_value=None):
            with patch('backend.utils.plan_features._get_required_plan', return_value='pro'):
                @require_feature('premium_feature')
                async def test_endpoint(db, current_user):
                    return {"status": "success"}

                with pytest.raises(HTTPException) as exc_info:
                    await test_endpoint(db=mock_db, current_user=mock_user)

                assert exc_info.value.status_code == 403
                assert exc_info.value.detail['error'] == 'feature_restricted'


@pytest.mark.unit
@pytest.mark.asyncio
async def test_require_plan_decorator_allowed(mock_user, mock_db_session):
    """Test @require_plan allows access when user has minimum plan"""
    from tests.conftest import create_mock_query_result
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'premium'
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    @require_plan('pro')
    async def test_endpoint(db, current_user):
        return {"status": "success"}

    result = await test_endpoint(db=mock_db_session, current_user=mock_user)
    assert result == {"status": "success"}


@pytest.mark.unit
@pytest.mark.asyncio
async def test_require_plan_decorator_denied(mock_user, mock_db_session):
    """Test @require_plan denies access when user doesn't have minimum plan"""
    from tests.conftest import create_mock_query_result
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'free'
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    @require_plan('premium')
    async def test_endpoint(db, current_user):
        return {"status": "success"}

    with pytest.raises(HTTPException) as exc_info:
        await test_endpoint(db=mock_db_session, current_user=mock_user)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail['error'] == 'plan_required'


@pytest.mark.unit
def test_require_plan_invalid_plan():
    """Test @require_plan raises error for invalid plan"""
    with pytest.raises(ValueError) as exc_info:
        @require_plan('invalid_plan')
        async def test_endpoint(db, current_user):
            pass

    assert 'Invalid plan' in str(exc_info.value)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_require_feature_missing_dependencies():
    """Test decorator raises error when dependencies are missing"""
    @require_feature('ai_optimization')
    async def test_endpoint():
        pass

    with pytest.raises(HTTPException) as exc_info:
        # Call without db or current_user kwargs
        await test_endpoint()

    assert exc_info.value.status_code == 500
    assert 'dependencies not properly configured' in exc_info.value.detail.lower()


# ============================================================================
# TEST: get_user_features
# ============================================================================

@pytest.mark.unit
def test_get_user_features(mock_user, mock_db_session):
    """Test getting all features for a user"""
    from tests.conftest import create_mock_query_result
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.plan_type = 'basic'
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = get_user_features(mock_user, mock_db_session)
    assert result is not None
    assert 'filings_per_year' in result
    assert 'ai_optimization' in result
    assert result == PLAN_FEATURES['basic']


# ============================================================================
# TEST: get_active_subscription
# ============================================================================

@pytest.mark.unit
def test_get_active_subscription_exists(mock_user, mock_db_session):
    """Test getting active subscription when it exists"""
    mock_subscription = Mock(spec=Subscription)
    mock_subscription.id = 'sub_123'
    mock_subscription.status = 'active'

    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(mock_subscription)

    result = get_active_subscription(mock_user, mock_db_session)
    assert result is not None
    assert result.id == 'sub_123'


@pytest.mark.unit
def test_get_active_subscription_none(mock_user, mock_db_session):
    """Test getting active subscription when none exists"""
    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(None)

    result = get_active_subscription(mock_user, mock_db_session)
    assert result is None


# ============================================================================
# EDGE CASES
# ============================================================================

@pytest.mark.unit
def test_plan_features_structure():
    """Test that PLAN_FEATURES has expected structure"""
    assert 'free' in PLAN_FEATURES
    assert 'basic' in PLAN_FEATURES
    assert 'pro' in PLAN_FEATURES
    assert 'premium' in PLAN_FEATURES

    # Check all plans have same keys (in Phase 0)
    free_keys = set(PLAN_FEATURES['free'].keys())
    for plan in ['basic', 'pro', 'premium']:
        plan_keys = set(PLAN_FEATURES[plan].keys())
        assert free_keys == plan_keys, f"{plan} plan has different keys than free"


@pytest.mark.unit
def test_empty_feature_name(mock_user, mock_db_session):
    """Test handling of empty feature name"""
    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(None)

    result = has_feature(mock_user, mock_db_session, '')
    assert result is False


@pytest.mark.unit
def test_none_feature_name(mock_user, mock_db_session):
    """Test handling of None feature name"""
    from tests.conftest import create_mock_query_result
    mock_db_session.query.return_value = create_mock_query_result(None)

    result = has_feature(mock_user, mock_db_session, None)
    assert result is False
