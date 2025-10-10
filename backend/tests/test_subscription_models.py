"""
Tests for Subscription Models
Tests subscription model properties and business logic
"""
import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from models.swisstax.subscription import Subscription


class TestSubscriptionProperties:
    """Test subscription model properties"""

    def test_is_active(self):
        """Test is_active property"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="active",
            price_chf=129.00
        )

        assert subscription.is_active == True

    def test_is_not_active(self):
        """Test is_active when canceled"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="canceled",
            price_chf=129.00
        )

        assert subscription.is_active == False

    def test_is_canceled(self):
        """Test is_canceled property"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="canceled",
            price_chf=129.00
        )

        assert subscription.is_canceled == True

    def test_is_canceled_with_flag(self):
        """Test is_canceled when cancel_at_period_end is True"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="active",
            cancel_at_period_end=True,
            price_chf=129.00
        )

        assert subscription.is_canceled == True

    def test_is_in_trial_true(self):
        """Test is_in_trial when in trial period"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="trialing",
            price_chf=129.00,
            trial_start=now - timedelta(days=5),
            trial_end=now + timedelta(days=25)
        )

        assert subscription.is_in_trial == True

    def test_is_in_trial_false(self):
        """Test is_in_trial when trial expired"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="active",
            price_chf=129.00,
            trial_start=now - timedelta(days=40),
            trial_end=now - timedelta(days=10)
        )

        assert subscription.is_in_trial == False

    def test_is_in_trial_none(self):
        """Test is_in_trial when trial_end is None"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="active",
            price_chf=129.00,
            trial_end=None
        )

        assert subscription.is_in_trial == False

    def test_is_committed_5_year(self):
        """Test is_committed for 5-year plan"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="5_year_lock",
            status="active",
            price_chf=89.00,
            plan_commitment_years=5
        )

        assert subscription.is_committed == True

    def test_is_committed_annual(self):
        """Test is_committed for annual plan"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="active",
            price_chf=129.00,
            plan_commitment_years=1
        )

        assert subscription.is_committed == False

    def test_can_cancel_now_during_trial(self):
        """Test can_cancel_now during trial"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="5_year_lock",
            status="trialing",
            price_chf=89.00,
            plan_commitment_years=5,
            trial_start=now - timedelta(days=5),
            trial_end=now + timedelta(days=25)
        )

        assert subscription.can_cancel_now == True

    def test_can_cancel_now_after_trial(self):
        """Test can_cancel_now after trial for 5-year plan"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="5_year_lock",
            status="active",
            price_chf=89.00,
            plan_commitment_years=5,
            trial_start=now - timedelta(days=40),
            trial_end=now - timedelta(days=10)
        )

        assert subscription.can_cancel_now == False

    def test_repr(self):
        """Test __repr__ method"""
        user_id = uuid4()
        sub_id = uuid4()
        subscription = Subscription(
            id=sub_id,
            user_id=user_id,
            plan_type="annual_flex",
            status="active",
            price_chf=129.00
        )

        repr_str = repr(subscription)
        assert "Subscription" in repr_str
        assert str(sub_id) in repr_str
        assert str(user_id) in repr_str
        assert "annual_flex" in repr_str
        assert "active" in repr_str


class TestSubscriptionBusinessLogic:
    """Test subscription business rules"""

    def test_5_year_plan_pricing(self):
        """Test 5-year plan has correct pricing"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="5_year_lock",
            status="active",
            price_chf=89.00,
            plan_commitment_years=5
        )

        assert subscription.price_chf == 89.00
        assert subscription.plan_commitment_years == 5
        assert subscription.is_committed == True

    def test_annual_flex_pricing(self):
        """Test annual flex plan has correct pricing"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="active",
            price_chf=129.00,
            plan_commitment_years=1
        )

        assert subscription.price_chf == 129.00
        assert subscription.plan_commitment_years == 1
        assert subscription.is_committed == False

    def test_trial_period_30_days(self):
        """Test trial period is 30 days"""
        trial_start = datetime.now(timezone.utc).replace(tzinfo=None)
        trial_end = trial_start + timedelta(days=30)

        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="trialing",
            price_chf=129.00,
            trial_start=trial_start,
            trial_end=trial_end
        )

        assert subscription.is_in_trial == True
        # Check that trial is approximately 30 days
        trial_duration = (subscription.trial_end - subscription.trial_start).days
        assert trial_duration == 30

    def test_commitment_dates_5_year(self):
        """Test commitment dates for 5-year plan"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        commitment_start = now
        commitment_end = commitment_start + timedelta(days=365 * 5)

        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="5_year_lock",
            status="active",
            price_chf=89.00,
            plan_commitment_years=5,
            commitment_start_date=commitment_start,
            commitment_end_date=commitment_end
        )

        duration_days = (subscription.commitment_end_date - subscription.commitment_start_date).days
        # Should be approximately 5 years (accounting for leap years)
        assert 1824 <= duration_days <= 1827

    def test_cancellation_tracking(self):
        """Test cancellation request tracking"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="active",
            price_chf=129.00,
            cancellation_requested_at=now,
            cancellation_reason="Too expensive"
        )

        assert subscription.cancellation_requested_at is not None
        assert subscription.cancellation_reason == "Too expensive"

    def test_pause_request_tracking(self):
        """Test pause request tracking"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="active",
            price_chf=129.00,
            pause_requested=True,
            pause_reason="Temporary financial issues"
        )

        assert subscription.pause_requested == True
        assert subscription.pause_reason == "Temporary financial issues"

    def test_switch_request_tracking(self):
        """Test plan switch request tracking"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_type="annual_flex",
            status="trialing",
            price_chf=129.00,
            switch_requested=True,
            switch_to_plan="5_year_lock"
        )

        assert subscription.switch_requested == True
        assert subscription.switch_to_plan == "5_year_lock"
