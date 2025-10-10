"""
Unit tests for Referral Models
Tests model properties and validation
"""
import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import Mock
import uuid

from models.swisstax.referral_code import ReferralCode


class TestReferralCodeModel:
    """Test suite for ReferralCode model"""

    def test_is_valid_property_active_code(self):
        """Test is_valid for active code within date range"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            is_active=True,
            valid_from=datetime.now(timezone.utc) - timedelta(days=1),
            valid_until=datetime.now(timezone.utc) + timedelta(days=30),
            current_usage_count=0,
            max_total_uses=100
        )

        assert code.is_valid is True

    def test_is_valid_property_inactive_code(self):
        """Test is_valid for inactive code"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            is_active=False,
            valid_from=datetime.now(timezone.utc) - timedelta(days=1),
            valid_until=datetime.now(timezone.utc) + timedelta(days=30),
            current_usage_count=0
        )

        assert code.is_valid is False

    def test_is_valid_property_expired_code(self):
        """Test is_valid for expired code"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            is_active=True,
            valid_from=datetime.now(timezone.utc) - timedelta(days=60),
            valid_until=datetime.now(timezone.utc) - timedelta(days=1),  # Expired
            current_usage_count=0
        )

        assert code.is_valid is False

    def test_is_valid_property_not_yet_valid(self):
        """Test is_valid for code with future start date"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            is_active=True,
            valid_from=datetime.now(timezone.utc) + timedelta(days=1),  # Future
            valid_until=datetime.now(timezone.utc) + timedelta(days=30),
            current_usage_count=0
        )

        assert code.is_valid is False

    def test_is_valid_property_max_uses_reached(self):
        """Test is_valid when max uses reached"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            is_active=True,
            current_usage_count=100,
            max_total_uses=100  # At limit
        )

        assert code.is_valid is False

    def test_is_valid_property_unlimited_uses(self):
        """Test is_valid with unlimited uses"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            is_active=True,
            current_usage_count=1000,
            max_total_uses=None  # Unlimited
        )

        assert code.is_valid is True

    def test_uses_remaining_property(self):
        """Test uses_remaining calculation"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            current_usage_count=25,
            max_total_uses=100
        )

        assert code.uses_remaining == 75

    def test_uses_remaining_property_unlimited(self):
        """Test uses_remaining for unlimited code"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            current_usage_count=1000,
            max_total_uses=None
        )

        assert code.uses_remaining is None

    def test_uses_remaining_property_negative_prevented(self):
        """Test uses_remaining doesn't go negative"""
        code = ReferralCode(
            code="TEST-123",
            code_type="user_referral",
            discount_type="percentage",
            discount_value=10.0,
            current_usage_count=150,
            max_total_uses=100  # Over limit
        )

        assert code.uses_remaining == 0

    def test_repr_method(self):
        """Test __repr__ method"""
        code = ReferralCode(
            code="TEST-123",
            code_type="promotional",
            discount_type="percentage",
            discount_value=20.0
        )
        code.id = uuid.uuid4()

        repr_str = repr(code)
        assert "ReferralCode" in repr_str
        assert "TEST-123" in repr_str
        assert "promotional" in repr_str
