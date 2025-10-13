"""
Unit tests for UsageTrackingService.

Tests usage tracking, limit checking, and period management.
"""
import pytest
from datetime import datetime, date, timedelta
from unittest.mock import MagicMock, Mock, patch
from sqlalchemy import and_

from backend.services.usage_tracking_service import UsageTrackingService, get_usage_service
from backend.models.swisstax.user import User
from backend.models.swisstax.feature_usage import FeatureUsage


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def usage_service(mock_db_session):
    """Create UsageTrackingService instance"""
    return UsageTrackingService(mock_db_session)


@pytest.fixture
def mock_feature_usage():
    """Create mock FeatureUsage object"""
    usage = Mock(spec=FeatureUsage)
    usage.id = 'usage_123'
    usage.user_id = 'user_123'
    usage.feature_name = 'filings_per_year'
    usage.usage_count = 5
    usage.period_start = date(2025, 1, 1)
    usage.period_end = date(2025, 12, 31)
    usage.created_at = datetime.utcnow()
    usage.updated_at = datetime.utcnow()

    # Add methods
    usage.is_current_period = Mock(return_value=True)
    usage.increment = Mock(side_effect=lambda amount: setattr(usage, 'usage_count', usage.usage_count + amount))
    usage.reset = Mock(side_effect=lambda: setattr(usage, 'usage_count', 0))

    return usage


# ============================================================================
# TEST: get_current_period
# ============================================================================

@pytest.mark.unit
def test_get_current_period_annual(usage_service):
    """Test getting current annual period"""
    with patch('backend.services.usage_tracking_service.datetime') as mock_datetime:
        mock_datetime.now.return_value.date.return_value = date(2025, 6, 15)

        period_start, period_end = usage_service.get_current_period('annual')

        assert period_start == date(2025, 1, 1)
        assert period_end == date(2025, 12, 31)


@pytest.mark.unit
def test_get_current_period_monthly_mid_year(usage_service):
    """Test getting current monthly period mid-year"""
    with patch('backend.services.usage_tracking_service.datetime') as mock_datetime:
        mock_datetime.now.return_value.date.return_value = date(2025, 6, 15)

        period_start, period_end = usage_service.get_current_period('monthly')

        assert period_start == date(2025, 6, 1)
        assert period_end == date(2025, 6, 30)


@pytest.mark.unit
def test_get_current_period_monthly_december(usage_service):
    """Test getting monthly period for December"""
    with patch('backend.services.usage_tracking_service.datetime') as mock_datetime:
        mock_datetime.now.return_value.date.return_value = date(2025, 12, 15)

        period_start, period_end = usage_service.get_current_period('monthly')

        assert period_start == date(2025, 12, 1)
        assert period_end == date(2025, 12, 31)


@pytest.mark.unit
def test_get_current_period_monthly_february_leap_year(usage_service):
    """Test getting monthly period for February in leap year"""
    with patch('backend.services.usage_tracking_service.datetime') as mock_datetime:
        mock_datetime.now.return_value.date.return_value = date(2024, 2, 15)

        period_start, period_end = usage_service.get_current_period('monthly')

        assert period_start == date(2024, 2, 1)
        assert period_end == date(2024, 2, 29)  # 2024 is leap year


@pytest.mark.unit
def test_get_current_period_monthly_february_non_leap_year(usage_service):
    """Test getting monthly period for February in non-leap year"""
    with patch('backend.services.usage_tracking_service.datetime') as mock_datetime:
        mock_datetime.now.return_value.date.return_value = date(2025, 2, 15)

        period_start, period_end = usage_service.get_current_period('monthly')

        assert period_start == date(2025, 2, 1)
        assert period_end == date(2025, 2, 28)


# ============================================================================
# TEST: get_or_create_usage
# ============================================================================

@pytest.mark.unit
def test_get_or_create_usage_existing(mock_user, usage_service, mock_feature_usage):
    """Test getting existing usage record"""
    from tests.conftest import create_mock_query_result
    usage_service.db.query.return_value = create_mock_query_result(mock_feature_usage)

    result = usage_service.get_or_create_usage(mock_user, 'filings_per_year', 'annual')

    assert result == mock_feature_usage
    usage_service.db.add.assert_not_called()


@pytest.mark.unit
def test_get_or_create_usage_creates_new(mock_user, usage_service):
    """Test creating new usage record when none exists"""
    from tests.conftest import create_mock_query_result
    usage_service.db.query.return_value = create_mock_query_result(None)

    with patch('backend.services.usage_tracking_service.FeatureUsage') as MockFeatureUsage:
        mock_new_usage = Mock(spec=FeatureUsage)
        MockFeatureUsage.return_value = mock_new_usage

        result = usage_service.get_or_create_usage(mock_user, 'filings_per_year', 'annual')

        usage_service.db.add.assert_called_once()
        usage_service.db.commit.assert_called_once()


# ============================================================================
# TEST: get_usage_count
# ============================================================================

@pytest.mark.unit
def test_get_usage_count(mock_user, usage_service, mock_feature_usage):
    """Test getting current usage count"""
    with patch.object(usage_service, 'get_or_create_usage', return_value=mock_feature_usage):
        result = usage_service.get_usage_count(mock_user, 'filings_per_year')

        assert result == 5  # mock_feature_usage.usage_count


# ============================================================================
# TEST: increment_usage
# ============================================================================

@pytest.mark.unit
def test_increment_usage_by_one(mock_user, usage_service, mock_feature_usage):
    """Test incrementing usage by 1"""
    from tests.conftest import create_mock_query_result

    # Mock get_or_create_usage
    with patch.object(usage_service, 'get_or_create_usage', return_value=mock_feature_usage):
        # Mock execute to return new count
        mock_result = Mock()
        mock_result.scalar.return_value = 6
        usage_service.db.execute.return_value = mock_result

        result = usage_service.increment_usage(mock_user, 'filings_per_year', 1)

        assert result == 6
        usage_service.db.commit.assert_called_once()


@pytest.mark.unit
def test_increment_usage_by_multiple(mock_user, usage_service, mock_feature_usage):
    """Test incrementing usage by multiple amounts"""
    with patch.object(usage_service, 'get_or_create_usage', return_value=mock_feature_usage):
        mock_result = Mock()
        mock_result.scalar.return_value = 8
        usage_service.db.execute.return_value = mock_result

        result = usage_service.increment_usage(mock_user, 'filings_per_year', 3)

        assert result == 8


@pytest.mark.unit
def test_increment_usage_negative_raises_error(mock_user, usage_service):
    """Test that negative increment raises ValueError"""
    with pytest.raises(ValueError) as exc_info:
        usage_service.increment_usage(mock_user, 'filings_per_year', -1)

    assert 'must be non-negative' in str(exc_info.value)


# ============================================================================
# TEST: check_limit
# ============================================================================

@pytest.mark.unit
@patch('backend.services.usage_tracking_service.is_grandfathered', return_value=True)
def test_check_limit_grandfathered_user(mock_is_grandfathered, mock_user, usage_service):
    """Test grandfathered user has unlimited access"""
    result = usage_service.check_limit(mock_user, 'filings_per_year')

    assert result['allowed'] is True
    assert result['limit'] is None
    assert result['remaining'] is None
    assert result['is_grandfathered'] is True


@pytest.mark.unit
@patch('backend.services.usage_tracking_service.get_feature_limit', return_value=None)
def test_check_limit_unlimited(mock_get_limit, mock_user, usage_service):
    """Test unlimited feature returns allowed=True"""
    result = usage_service.check_limit(mock_user, 'document_uploads')

    assert result['allowed'] is True
    assert result['limit'] is None
    assert result['remaining'] is None


@pytest.mark.unit
@patch('backend.services.usage_tracking_service.get_feature_limit', return_value=10)
def test_check_limit_within_limit(mock_get_limit, mock_user, usage_service):
    """Test usage within limit is allowed"""
    with patch.object(usage_service, 'get_usage_count', return_value=5):
        result = usage_service.check_limit(mock_user, 'filings_per_year', required_amount=1)

        assert result['allowed'] is True
        assert result['current_usage'] == 5
        assert result['limit'] == 10
        assert result['remaining'] == 5


@pytest.mark.unit
@patch('backend.services.usage_tracking_service.get_feature_limit', return_value=10)
def test_check_limit_at_limit(mock_get_limit, mock_user, usage_service):
    """Test usage at limit is not allowed"""
    with patch.object(usage_service, 'get_usage_count', return_value=10):
        result = usage_service.check_limit(mock_user, 'filings_per_year', required_amount=1)

        assert result['allowed'] is False
        assert result['current_usage'] == 10
        assert result['limit'] == 10
        assert result['remaining'] == 0


@pytest.mark.unit
@patch('backend.services.usage_tracking_service.get_feature_limit', return_value=10)
def test_check_limit_exceeds_limit(mock_get_limit, mock_user, usage_service):
    """Test usage exceeding limit is not allowed"""
    with patch.object(usage_service, 'get_usage_count', return_value=8):
        result = usage_service.check_limit(mock_user, 'filings_per_year', required_amount=5)

        assert result['allowed'] is False
        assert result['current_usage'] == 8
        assert result['limit'] == 10
        assert result['remaining'] == 2


# ============================================================================
# TEST: track_and_check
# ============================================================================

@pytest.mark.unit
@patch('backend.services.usage_tracking_service.get_feature_limit', return_value=10)
def test_track_and_check_allowed_with_increment(mock_get_limit, mock_user, usage_service):
    """Test track_and_check increments when allowed"""
    with patch.object(usage_service, 'get_usage_count', return_value=5):
        with patch.object(usage_service, 'increment_usage', return_value=6) as mock_increment:
            result = usage_service.track_and_check(
                mock_user, 'filings_per_year',
                reset_type='annual',
                increment=True,
                amount=1
            )

            assert result['allowed'] is True
            assert result['incremented'] is True
            assert result['current_usage'] == 6
            mock_increment.assert_called_once_with(mock_user, 'filings_per_year', 1, 'annual')


@pytest.mark.unit
@patch('backend.services.usage_tracking_service.get_feature_limit', return_value=10)
def test_track_and_check_not_allowed_no_increment(mock_get_limit, mock_user, usage_service):
    """Test track_and_check doesn't increment when not allowed"""
    with patch.object(usage_service, 'get_usage_count', return_value=10):
        with patch.object(usage_service, 'increment_usage') as mock_increment:
            result = usage_service.track_and_check(
                mock_user, 'filings_per_year',
                increment=True
            )

            assert result['allowed'] is False
            assert result['incremented'] is False
            mock_increment.assert_not_called()


@pytest.mark.unit
@patch('backend.services.usage_tracking_service.get_feature_limit', return_value=10)
def test_track_and_check_allowed_no_increment_requested(mock_get_limit, mock_user, usage_service):
    """Test track_and_check doesn't increment when increment=False"""
    with patch.object(usage_service, 'get_usage_count', return_value=5):
        with patch.object(usage_service, 'increment_usage') as mock_increment:
            result = usage_service.track_and_check(
                mock_user, 'filings_per_year',
                increment=False
            )

            assert result['allowed'] is True
            assert result['incremented'] is False
            mock_increment.assert_not_called()


# ============================================================================
# TEST: get_all_usage_for_user
# ============================================================================

@pytest.mark.unit
def test_get_all_usage_for_user(mock_user, usage_service, mock_feature_usage):
    """Test getting all usage for a user"""
    mock_usage_2 = Mock(spec=FeatureUsage)
    mock_usage_2.feature_name = 'document_uploads'
    mock_usage_2.usage_count = 3
    mock_usage_2.period_start = date(2025, 1, 1)
    mock_usage_2.period_end = date(2025, 12, 31)
    mock_usage_2.is_current_period = Mock(return_value=True)

    from tests.conftest import create_mock_query_result
    mock_query = create_mock_query_result(None)
    mock_query.all.return_value = [mock_feature_usage, mock_usage_2]
    usage_service.db.query.return_value = mock_query

    with patch('backend.services.usage_tracking_service.get_feature_limit') as mock_get_limit:
        mock_get_limit.side_effect = [10, None]  # First feature has limit, second unlimited

        result = usage_service.get_all_usage_for_user(mock_user)

        assert 'filings_per_year' in result
        assert 'document_uploads' in result
        assert result['filings_per_year']['usage_count'] == 5
        assert result['filings_per_year']['limit'] == 10
        assert result['filings_per_year']['remaining'] == 5
        assert result['document_uploads']['limit'] is None


# ============================================================================
# TEST: reset_usage
# ============================================================================

@pytest.mark.unit
def test_reset_usage(mock_user, usage_service, mock_feature_usage):
    """Test resetting usage count"""
    with patch.object(usage_service, 'get_or_create_usage', return_value=mock_feature_usage):
        usage_service.reset_usage(mock_user, 'filings_per_year')

        mock_feature_usage.reset.assert_called_once()
        usage_service.db.commit.assert_called_once()


# ============================================================================
# TEST: cleanup_old_periods
# ============================================================================

@pytest.mark.unit
def test_cleanup_old_periods(usage_service):
    """Test cleaning up old usage records"""
    mock_query = Mock()
    mock_query.filter.return_value = mock_query
    mock_query.delete.return_value = 5  # 5 records deleted

    usage_service.db.query.return_value = mock_query

    result = usage_service.cleanup_old_periods(days_to_keep=365)

    assert result == 5
    usage_service.db.commit.assert_called_once()


# ============================================================================
# TEST: get_usage_service helper
# ============================================================================

@pytest.mark.unit
def test_get_usage_service(mock_db_session):
    """Test get_usage_service helper function"""
    service = get_usage_service(mock_db_session)

    assert isinstance(service, UsageTrackingService)
    assert service.db == mock_db_session


# ============================================================================
# EDGE CASES
# ============================================================================

@pytest.mark.unit
def test_increment_usage_zero_amount(mock_user, usage_service, mock_feature_usage):
    """Test incrementing by zero is allowed"""
    with patch.object(usage_service, 'get_or_create_usage', return_value=mock_feature_usage):
        mock_result = Mock()
        mock_result.scalar.return_value = 5
        usage_service.db.execute.return_value = mock_result

        result = usage_service.increment_usage(mock_user, 'filings_per_year', 0)

        # Should complete without error
        assert result == 5


@pytest.mark.unit
def test_get_current_period_invalid_reset_type(usage_service):
    """Test invalid reset_type defaults to annual"""
    period_start, period_end = usage_service.get_current_period('invalid')

    # Should default to annual
    today = datetime.now().date()
    assert period_start.year == today.year
    assert period_start.month == 1
    assert period_start.day == 1


@pytest.mark.unit
@patch('backend.services.usage_tracking_service.get_feature_limit', return_value=0)
def test_check_limit_zero_limit(mock_get_limit, mock_user, usage_service):
    """Test feature with zero limit"""
    with patch.object(usage_service, 'get_usage_count', return_value=0):
        result = usage_service.check_limit(mock_user, 'disabled_feature')

        assert result['allowed'] is False
        assert result['limit'] == 0
        assert result['remaining'] == 0


@pytest.mark.unit
def test_feature_usage_model_methods():
    """Test FeatureUsage model helper methods"""
    usage = FeatureUsage()
    usage.usage_count = 5
    usage.period_start = date.today()
    usage.period_end = date.today() + timedelta(days=30)

    # Test increment
    usage.increment(3)
    assert usage.usage_count == 8

    # Test reset
    usage.reset()
    assert usage.usage_count == 0

    # Test is_current_period
    assert usage.is_current_period() is True

    # Test past period
    usage.period_end = date.today() - timedelta(days=1)
    assert usage.is_current_period() is False
