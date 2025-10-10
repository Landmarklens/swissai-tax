"""
Unit tests for FraudDetectionService
"""
import pytest
from unittest.mock import MagicMock, Mock
import uuid

from services.fraud_detection_service import FraudDetectionService
from models.swisstax.referral_code import ReferralCode
from models.swisstax.referral_usage import ReferralUsage


class TestFraudDetectionService:
    """Test suite for FraudDetectionService"""

    def test_check_referral_fraud_clean(self, mock_db_session):
        """Test fraud check for a clean referral"""
        service = FraudDetectionService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.id = uuid.uuid4()
        mock_code.owner_user_id = uuid.uuid4()
        mock_code.code_type = 'user_referral'

        user_id = uuid.uuid4()

        # Mock queries to return 0 usages
        mock_query = MagicMock()
        mock_query.filter.return_value.count.return_value = 0
        mock_db_session.query.return_value = mock_query

        request_metadata = {
            'ip_address': '127.0.0.1',
            'user_agent': 'Mozilla/5.0'
        }

        # Execute
        result = service.check_referral_fraud(
            'REF-TEST',
            str(user_id),
            mock_code,
            request_metadata
        )

        # Verify
        assert result['is_suspicious'] is False
        assert result['fraud_score'] == 0.0
        assert result['reason'] is None
        assert result['checks']['self_referral'] is False
        assert result['checks']['ip_abuse'] is False
        assert result['checks']['duplicate_usage'] is False

    def test_check_referral_fraud_self_referral(self, mock_db_session):
        """Test detection of self-referral"""
        service = FraudDetectionService(mock_db_session)

        owner_id = uuid.uuid4()
        mock_code = Mock(spec=ReferralCode)
        mock_code.id = uuid.uuid4()
        mock_code.owner_user_id = owner_id
        mock_code.code_type = 'user_referral'

        # Mock query
        mock_query = MagicMock()
        mock_query.filter.return_value.count.return_value = 0
        mock_db_session.query.return_value = mock_query

        # Execute with same user as owner
        result = service.check_referral_fraud(
            'REF-TEST',
            str(owner_id),  # Same as owner
            mock_code,
            {}
        )

        # Verify
        assert result['is_suspicious'] is True
        assert result['fraud_score'] >= 0.7
        assert 'Self-referral detected' in result['reason']
        assert result['checks']['self_referral'] is True

    def test_check_referral_fraud_ip_abuse(self, mock_db_session):
        """Test detection of IP abuse"""
        service = FraudDetectionService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.id = uuid.uuid4()
        mock_code.owner_user_id = uuid.uuid4()

        user_id = uuid.uuid4()

        # Mock queries - IP used 3+ times
        ip_query = MagicMock()
        ip_query.filter.return_value.count.return_value = 3

        usage_query = MagicMock()
        usage_query.filter.return_value.count.return_value = 0

        call_count = [0]
        def query_side_effect(model):
            call_count[0] += 1
            if call_count[0] == 1:  # First call for IP check
                return ip_query
            else:  # Second call for duplicate check
                return usage_query

        mock_db_session.query.side_effect = query_side_effect

        request_metadata = {'ip_address': '192.168.1.1'}

        # Execute
        result = service.check_referral_fraud(
            'REF-TEST',
            str(user_id),
            mock_code,
            request_metadata
        )

        # Verify
        assert result['is_suspicious'] is True
        assert 'IP address used 3 times' in result['reason']
        assert result['checks']['ip_abuse'] is True

    def test_check_referral_fraud_duplicate_usage(self, mock_db_session):
        """Test detection of duplicate code usage"""
        service = FraudDetectionService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.id = uuid.uuid4()
        mock_code.owner_user_id = uuid.uuid4()

        user_id = uuid.uuid4()

        # Mock queries
        ip_query = MagicMock()
        ip_query.filter.return_value.count.return_value = 0

        usage_query = MagicMock()
        usage_query.filter.return_value.count.return_value = 0
        usage_query.filter.return_value.first.return_value = Mock()  # Existing usage

        call_count = [0]
        def query_side_effect(model):
            call_count[0] += 1
            if call_count[0] == 1:  # IP check
                return ip_query
            else:  # Duplicate check
                return usage_query

        mock_db_session.query.side_effect = query_side_effect

        request_metadata = {'ip_address': '127.0.0.1'}

        # Execute
        result = service.check_referral_fraud(
            'REF-TEST',
            str(user_id),
            mock_code,
            request_metadata
        )

        # Verify
        assert result['is_suspicious'] is True
        assert 'already used by this user' in result['reason']
        assert result['checks']['duplicate_usage'] is True

    def test_check_referral_fraud_multiple_issues(self, mock_db_session):
        """Test combined fraud indicators"""
        service = FraudDetectionService(mock_db_session)

        owner_id = uuid.uuid4()
        mock_code = Mock(spec=ReferralCode)
        mock_code.id = uuid.uuid4()
        mock_code.owner_user_id = owner_id

        # Mock queries - high IP usage
        ip_query = MagicMock()
        ip_query.filter.return_value.count.return_value = 5

        usage_query = MagicMock()
        usage_query.filter.return_value.count.return_value = 0

        call_count = [0]
        def query_side_effect(model):
            call_count[0] += 1
            if call_count[0] == 1:
                return ip_query
            else:
                return usage_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute - self-referral + IP abuse
        result = service.check_referral_fraud(
            'REF-TEST',
            str(owner_id),  # Same as owner
            mock_code,
            {'ip_address': '192.168.1.1'}
        )

        # Verify - multiple issues detected
        assert result['is_suspicious'] is True
        assert result['fraud_score'] >= 1.0  # Self-referral (1.0) + IP abuse (0.5)
        assert 'Self-referral' in result['reason']
        assert 'IP address used' in result['reason']
        assert result['checks']['self_referral'] is True
        assert result['checks']['ip_abuse'] is True

    def test_check_referral_fraud_no_ip_provided(self, mock_db_session):
        """Test fraud check when IP address is not provided"""
        service = FraudDetectionService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.id = uuid.uuid4()
        mock_code.owner_user_id = uuid.uuid4()

        user_id = uuid.uuid4()

        # Mock queries
        mock_query = MagicMock()
        mock_query.filter.return_value.count.return_value = 0
        mock_db_session.query.return_value = mock_query

        # Execute without IP
        result = service.check_referral_fraud(
            'REF-TEST',
            str(user_id),
            mock_code,
            {}  # No IP address
        )

        # Verify - should still work, just skip IP check
        assert result['is_suspicious'] is False
        assert 'ip_abuse' not in result['checks'] or result['checks'].get('ip_abuse') is False

    def test_check_referral_fraud_borderline_score(self, mock_db_session):
        """Test borderline fraud score (just under threshold)"""
        service = FraudDetectionService(mock_db_session)

        mock_code = Mock(spec=ReferralCode)
        mock_code.id = uuid.uuid4()
        mock_code.owner_user_id = uuid.uuid4()

        user_id = uuid.uuid4()

        # Mock queries - IP used 2 times (score 0.0, under threshold)
        ip_query = MagicMock()
        ip_query.filter.return_value.count.return_value = 2  # Below 3 threshold

        usage_query = MagicMock()
        usage_query.filter.return_value.count.return_value = 0

        call_count = [0]
        def query_side_effect(model):
            call_count[0] += 1
            if call_count[0] == 1:
                return ip_query
            else:
                return usage_query

        mock_db_session.query.side_effect = query_side_effect

        # Execute
        result = service.check_referral_fraud(
            'REF-TEST',
            str(user_id),
            mock_code,
            {'ip_address': '192.168.1.1'}
        )

        # Verify - not flagged as suspicious
        assert result['is_suspicious'] is False
        assert result['fraud_score'] < 0.7
