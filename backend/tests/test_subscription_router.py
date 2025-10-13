"""
Tests for Subscription API Router
Tests all subscription endpoints with authentication and business logic

NOTE: These tests are for subscription_new.py endpoints which are not currently
registered in app.py. The app uses subscription.py instead.
Skipping these tests until subscription_new.py is integrated.
"""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4
from fastapi import status
from fastapi.testclient import TestClient

from app import app

# Skip all tests in this file since they test subscription_new endpoints
# which are not registered in the app
pytestmark = pytest.mark.skip(reason="Testing subscription_new.py endpoints which are not registered in app")
from models.swisstax.user import User
from models.swisstax.subscription import Subscription
from schemas.swisstax.payment import (
    SetupIntentResponse,
    SubscriptionResponse,
    SubscriptionCreate,
    SubscriptionCancel,
    SubscriptionSwitch,
    SubscriptionPause
)


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Create mock user"""
    user = Mock(spec=User)
    user.id = uuid4()
    user.email = "test@example.com"
    user.name = "Test User"
    user.stripe_customer_id = None
    return user


@pytest.fixture
def mock_user_with_stripe():
    """Create mock user with Stripe customer ID"""
    user = Mock(spec=User)
    user.id = uuid4()
    user.email = "test@example.com"
    user.name = "Test User"
    user.stripe_customer_id = "cus_test123"
    return user


@pytest.fixture
def mock_subscription():
    """Create mock subscription"""
    now = datetime.utcnow()
    sub = Mock(spec=Subscription)
    sub.id = uuid4()
    sub.user_id = uuid4()
    sub.plan_type = "basic"
    sub.status = "active"
    sub.stripe_subscription_id = "sub_test123"
    sub.stripe_customer_id = "cus_test123"
    sub.stripe_price_id = "price_test123"
    sub.price_chf = 49.00
    sub.current_period_start = now
    sub.current_period_end = now + timedelta(days=365)
    sub.cancel_at_period_end = False
    sub.trial_start = now
    sub.trial_end = now + timedelta(days=30)
    sub.plan_commitment_years = 1
    sub.commitment_start_date = now
    sub.commitment_end_date = now + timedelta(days=365)
    sub.pause_requested = False
    sub.pause_reason = None
    sub.switch_requested = False
    sub.switch_to_plan = None
    sub.cancellation_requested_at = None
    sub.cancellation_reason = None
    sub.created_at = now
    sub.updated_at = now
    # Add helper properties
    sub.is_active = True
    sub.is_canceled = False
    sub.is_in_trial = True
    sub.is_committed = False
    sub.can_cancel_now = True
    return sub


class TestSetupIntentEndpoint:
    """Test POST /api/subscription/setup-intent"""

    @patch('routers.swisstax.subscription_new.get_current_user')
    @patch('routers.swisstax.subscription_new.get_stripe_service')
    @patch('routers.swisstax.subscription_new.settings')
    def test_create_setup_intent_success(self, mock_settings, mock_get_stripe, mock_get_user, client, mock_user):
        """Test successful SetupIntent creation"""
        mock_settings.ENABLE_SUBSCRIPTIONS = True
        mock_get_user.return_value = mock_user

        mock_stripe_service = Mock()
        mock_stripe_customer = Mock(id="cus_new123")
        mock_setup_intent = Mock(
            id="seti_123",
            client_secret="seti_123_secret_abc"
        )

        mock_stripe_service.create_customer.return_value = mock_stripe_customer
        mock_stripe_service.create_setup_intent.return_value = mock_setup_intent
        mock_get_stripe.return_value = mock_stripe_service

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            response = client.post(
                "/api/subscription/setup-intent",
                json={"plan_type": "basic"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["client_secret"] == "seti_123_secret_abc"
        assert data["setup_intent_id"] == "seti_123"

    @patch('routers.swisstax.subscription_new.get_current_user')
    @patch('routers.swisstax.subscription_new.settings')
    def test_create_setup_intent_disabled(self, mock_settings, mock_get_user, client, mock_user):
        """Test SetupIntent creation when subscriptions disabled"""
        mock_settings.ENABLE_SUBSCRIPTIONS = False
        mock_get_user.return_value = mock_user

        response = client.post(
            "/api/subscription/setup-intent",
            json={"plan_type": "basic"},
            headers={"Authorization": "Bearer fake_token"}
        )

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert "not enabled" in response.json()["detail"].lower()

    @patch('routers.swisstax.subscription_new.get_current_user')
    @patch('routers.swisstax.subscription_new.settings')
    def test_create_setup_intent_invalid_plan(self, mock_settings, mock_get_user, client, mock_user):
        """Test SetupIntent creation with invalid plan type"""
        mock_settings.ENABLE_SUBSCRIPTIONS = True
        mock_get_user.return_value = mock_user

        response = client.post(
            "/api/subscription/setup-intent",
            json={"plan_type": "invalid_plan"},
            headers={"Authorization": "Bearer fake_token"}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestCreateSubscriptionEndpoint:
    """Test POST /api/subscription/create"""

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_create_free_subscription_success(self, mock_get_user, client, mock_user):
        """Test successful free subscription creation"""
        mock_get_user.return_value = mock_user

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock no existing subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = None

            response = client.post(
                "/api/subscription/create",
                json={"plan_type": "free", "payment_method_id": None},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["plan_type"] == "free"
        assert data["status"] == "active"
        assert data["price_chf"] == 0.0

    @patch('routers.swisstax.subscription_new.get_current_user')
    @patch('routers.swisstax.subscription_new.get_stripe_service')
    @patch('routers.swisstax.subscription_new.settings')
    def test_create_paid_subscription_success(self, mock_settings, mock_get_stripe, mock_get_user, client, mock_user_with_stripe):
        """Test successful paid subscription creation"""
        mock_settings.ENABLE_SUBSCRIPTIONS = True
        mock_settings.STRIPE_PLAN_PRICES = {"basic": "price_basic123"}
        mock_get_user.return_value = mock_user_with_stripe

        mock_stripe_service = Mock()
        mock_stripe_sub = Mock(
            id="sub_123",
            status="trialing",
            current_period_start=1234567890,
            current_period_end=1237159890,
            trial_start=1234567890,
            trial_end=1237159890,
            cancel_at_period_end=False
        )
        mock_stripe_service.create_subscription_with_trial.return_value = mock_stripe_sub
        mock_get_stripe.return_value = mock_stripe_service

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock no existing subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = None

            response = client.post(
                "/api/subscription/create",
                json={"plan_type": "basic", "payment_method_id": "pm_test123"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["plan_type"] == "basic"
        assert data["status"] == "trialing"

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_create_subscription_already_exists(self, mock_get_user, client, mock_user, mock_subscription):
        """Test subscription creation when user already has active subscription"""
        mock_get_user.return_value = mock_user

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock existing active subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

            response = client.post(
                "/api/subscription/create",
                json={"plan_type": "basic", "payment_method_id": "pm_test123"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already has an active subscription" in response.json()["detail"]


class TestGetCurrentSubscriptionEndpoint:
    """Test GET /api/subscription/current"""

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_get_current_subscription_success(self, mock_get_user, client, mock_user, mock_subscription):
        """Test successful retrieval of current subscription"""
        mock_get_user.return_value = mock_user
        mock_subscription.user_id = mock_user.id

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock existing subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

            response = client.get(
                "/api/subscription/current",
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["plan_type"] == "basic"
        assert data["status"] == "active"

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_get_current_subscription_none(self, mock_get_user, client, mock_user):
        """Test retrieval when user has no subscription"""
        mock_get_user.return_value = mock_user

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock no subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = None

            response = client.get(
                "/api/subscription/current",
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_200_OK
        assert response.json() is None


class TestCancelSubscriptionEndpoint:
    """Test POST /api/subscription/cancel"""

    @patch('routers.swisstax.subscription_new.get_current_user')
    @patch('routers.swisstax.subscription_new.get_stripe_service')
    def test_cancel_subscription_during_trial_success(self, mock_get_stripe, mock_get_user, client, mock_user, mock_subscription):
        """Test successful cancellation during trial period"""
        mock_get_user.return_value = mock_user
        mock_subscription.user_id = mock_user.id
        mock_subscription.is_in_trial = True
        mock_subscription.can_cancel_now = True

        mock_stripe_service = Mock()
        mock_canceled_sub = Mock(status="canceled")
        mock_stripe_service.cancel_subscription.return_value = mock_canceled_sub
        mock_get_stripe.return_value = mock_stripe_service

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock existing subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

            response = client.post(
                "/api/subscription/cancel",
                json={"reason": "Not satisfied"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_200_OK

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_cancel_subscription_no_subscription(self, mock_get_user, client, mock_user):
        """Test cancellation when user has no subscription"""
        mock_get_user.return_value = mock_user

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock no subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = None

            response = client.post(
                "/api/subscription/cancel",
                json={"reason": "Test"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_cancel_5year_plan_after_trial(self, mock_get_user, client, mock_user, mock_subscription):
        """Test cannot cancel 5-year plan after trial"""
        mock_get_user.return_value = mock_user
        mock_subscription.user_id = mock_user.id
        mock_subscription.plan_commitment_years = 5
        mock_subscription.is_in_trial = False
        mock_subscription.can_cancel_now = False

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock existing subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

            response = client.post(
                "/api/subscription/cancel",
                json={"reason": "Want to cancel"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "5-year commitment" in response.json()["detail"]


class TestSwitchSubscriptionEndpoint:
    """Test POST /api/subscription/switch"""

    @patch('routers.swisstax.subscription_new.get_current_user')
    @patch('routers.swisstax.subscription_new.get_stripe_service')
    @patch('routers.swisstax.subscription_new.settings')
    def test_switch_plan_during_trial_success(self, mock_settings, mock_get_stripe, mock_get_user, client, mock_user, mock_subscription):
        """Test successful plan switch during trial"""
        mock_settings.ENABLE_SUBSCRIPTIONS = True
        mock_settings.STRIPE_PLAN_PRICES = {"pro": "price_pro123"}
        mock_get_user.return_value = mock_user
        mock_subscription.user_id = mock_user.id
        mock_subscription.is_in_trial = True
        mock_subscription.plan_type = "basic"

        mock_stripe_service = Mock()
        mock_updated_sub = Mock(id="sub_123")
        mock_stripe_service.update_subscription_plan.return_value = mock_updated_sub
        mock_get_stripe.return_value = mock_stripe_service

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock existing subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

            response = client.post(
                "/api/subscription/switch",
                json={"new_plan_type": "pro", "reason": "Need more features"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_200_OK

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_switch_plan_after_trial_fails(self, mock_get_user, client, mock_user, mock_subscription):
        """Test plan switch after trial is not allowed"""
        mock_get_user.return_value = mock_user
        mock_subscription.user_id = mock_user.id
        mock_subscription.is_in_trial = False

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock existing subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

            response = client.post(
                "/api/subscription/switch",
                json={"new_plan_type": "pro", "reason": "Test"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "trial period" in response.json()["detail"].lower()


class TestPauseSubscriptionEndpoint:
    """Test POST /api/subscription/pause"""

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_pause_subscription_success(self, mock_get_user, client, mock_user, mock_subscription):
        """Test successful pause request"""
        mock_get_user.return_value = mock_user
        mock_subscription.user_id = mock_user.id

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock existing subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

            response = client.post(
                "/api/subscription/pause",
                json={"reason": "Financial difficulty", "resume_date": "2025-12-01"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["pause_requested"] == True
        assert data["pause_reason"] == "Financial difficulty"

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_pause_subscription_no_subscription(self, mock_get_user, client, mock_user):
        """Test pause request when user has no subscription"""
        mock_get_user.return_value = mock_user

        with patch('routers.swisstax.subscription_new.get_db') as mock_db:
            mock_db_session = MagicMock()
            mock_db.return_value.__enter__.return_value = mock_db_session

            # Mock no subscription
            mock_db_session.query.return_value.filter.return_value.first.return_value = None

            response = client.post(
                "/api/subscription/pause",
                json={"reason": "Test"},
                headers={"Authorization": "Bearer fake_token"}
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestGetInvoicesEndpoint:
    """Test GET /api/subscription/invoices"""

    @patch('routers.swisstax.subscription_new.get_current_user')
    @patch('routers.swisstax.subscription_new.get_stripe_service')
    @patch('routers.swisstax.subscription_new.settings')
    def test_get_invoices_from_stripe_success(self, mock_settings, mock_get_stripe, mock_get_user, client, mock_user_with_stripe):
        """Test successful invoice retrieval from Stripe"""
        mock_settings.ENABLE_SUBSCRIPTIONS = True
        mock_get_user.return_value = mock_user_with_stripe

        mock_stripe_service = Mock()
        mock_invoice = Mock(
            id="in_123",
            amount_paid=4900,
            currency="chf",
            status="paid",
            created=1234567890,
            invoice_pdf="https://stripe.com/invoice.pdf"
        )
        mock_stripe_service.list_customer_invoices.return_value = [mock_invoice]
        mock_get_stripe.return_value = mock_stripe_service

        response = client.get(
            "/api/subscription/invoices",
            headers={"Authorization": "Bearer fake_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "in_123"
        assert data[0]["amount_paid"] == 4900

    @patch('routers.swisstax.subscription_new.get_current_user')
    def test_get_invoices_no_stripe_customer(self, mock_get_user, client, mock_user):
        """Test invoice retrieval when user has no Stripe customer ID"""
        mock_get_user.return_value = mock_user

        response = client.get(
            "/api/subscription/invoices",
            headers={"Authorization": "Bearer fake_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []


class TestAuthenticationRequired:
    """Test that all endpoints require authentication"""

    def test_endpoints_require_auth(self, client):
        """Test all subscription endpoints return 401 without auth"""
        endpoints = [
            ("POST", "/api/subscription/setup-intent", {"plan_type": "basic"}),
            ("POST", "/api/subscription/create", {"plan_type": "basic"}),
            ("GET", "/api/subscription/current", None),
            ("POST", "/api/subscription/cancel", {"reason": "test"}),
            ("POST", "/api/subscription/switch", {"new_plan_type": "pro"}),
            ("POST", "/api/subscription/pause", {"reason": "test"}),
            ("GET", "/api/subscription/invoices", None),
        ]

        for method, url, payload in endpoints:
            if method == "GET":
                response = client.get(url)
            else:
                response = client.post(url, json=payload)

            assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN], \
                f"Endpoint {method} {url} should require authentication"
