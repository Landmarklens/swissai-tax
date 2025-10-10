"""
Tests for Stripe Webhook Handler
Tests webhook event processing and signature verification
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4
from fastapi import status
from fastapi.testclient import TestClient
import stripe

from app import app
from models.swisstax.user import User
from models.swisstax.subscription import Subscription
from models.swisstax.payment import Payment


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def valid_webhook_signature():
    """Mock valid webhook signature"""
    return "t=1234567890,v1=valid_signature_hash"


@pytest.fixture
def mock_stripe_event():
    """Create mock Stripe event"""
    event = Mock()
    event.id = "evt_test123"
    event.type = "customer.subscription.created"
    event.data = Mock()
    event.data.object = Mock()
    return event


@pytest.fixture
def mock_subscription_object():
    """Create mock Stripe subscription object"""
    now_timestamp = int(datetime.utcnow().timestamp())
    sub = Mock()
    sub.id = "sub_stripe123"
    sub.customer = "cus_test123"
    sub.status = "active"
    sub.current_period_start = now_timestamp
    sub.current_period_end = now_timestamp + (365 * 24 * 60 * 60)
    sub.trial_start = now_timestamp
    sub.trial_end = now_timestamp + (30 * 24 * 60 * 60)
    sub.cancel_at_period_end = False
    sub.items = Mock()
    sub.items.data = [Mock(price=Mock(id="price_123"))]
    sub.metadata = {"plan_type": "basic", "user_id": str(uuid4())}
    return sub


@pytest.fixture
def mock_invoice_object():
    """Create mock Stripe invoice object"""
    now_timestamp = int(datetime.utcnow().timestamp())
    invoice = Mock()
    invoice.id = "in_test123"
    invoice.customer = "cus_test123"
    invoice.subscription = "sub_test123"
    invoice.amount_paid = 4900
    invoice.amount_due = 4900
    invoice.currency = "chf"
    invoice.status = "paid"
    invoice.created = now_timestamp
    invoice.invoice_pdf = "https://stripe.com/invoice.pdf"
    invoice.hosted_invoice_url = "https://stripe.com/invoice"
    return invoice


class TestWebhookSignatureVerification:
    """Test webhook signature verification"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    def test_webhook_invalid_signature(self, mock_get_stripe, client):
        """Test webhook with invalid signature is rejected"""
        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.side_effect = ValueError("Invalid signature")
        mock_get_stripe.return_value = mock_stripe_service

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "test.event"},
            headers={"Stripe-Signature": "invalid_signature"}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid signature" in response.json()["detail"]

    @patch('routers.swisstax.webhooks.get_stripe_service')
    def test_webhook_missing_signature(self, mock_get_stripe, client):
        """Test webhook without signature header is rejected"""
        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "test.event"}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestSubscriptionCreatedEvent:
    """Test customer.subscription.created event"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_subscription_created_new_subscription(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_subscription_object
    ):
        """Test creating new subscription from webhook"""
        mock_stripe_event.type = "customer.subscription.created"
        mock_stripe_event.data.object = mock_subscription_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock user lookup
        mock_user = Mock(spec=User, id=uuid4(), stripe_customer_id="cus_test123")
        mock_db_session.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User lookup
            None  # No existing subscription
        ]

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.created"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_db_session.add.called

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_subscription_created_updates_existing(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_subscription_object
    ):
        """Test updating existing subscription from webhook"""
        mock_stripe_event.type = "customer.subscription.created"
        mock_stripe_event.data.object = mock_subscription_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock user and existing subscription
        mock_user = Mock(spec=User, id=uuid4(), stripe_customer_id="cus_test123")
        mock_existing_sub = Mock(spec=Subscription, id=uuid4())
        mock_db_session.query.return_value.filter.return_value.first.side_effect = [
            mock_user,  # User lookup
            mock_existing_sub  # Existing subscription
        ]

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.created"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_existing_sub.status == "active"


class TestSubscriptionUpdatedEvent:
    """Test customer.subscription.updated event"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_subscription_updated_status_change(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_subscription_object
    ):
        """Test subscription status update from webhook"""
        mock_stripe_event.type = "customer.subscription.updated"
        mock_subscription_object.status = "active"
        mock_stripe_event.data.object = mock_subscription_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock existing subscription
        mock_existing_sub = Mock(spec=Subscription, id=uuid4(), status="trialing")
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_existing_sub

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.updated"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_existing_sub.status == "active"

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_subscription_updated_trial_to_active(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_subscription_object
    ):
        """Test subscription transitioning from trial to active"""
        mock_stripe_event.type = "customer.subscription.updated"
        mock_subscription_object.status = "active"
        mock_subscription_object.trial_end = None  # Trial ended
        mock_stripe_event.data.object = mock_subscription_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock existing subscription in trial
        mock_existing_sub = Mock(spec=Subscription, id=uuid4(), status="trialing")
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_existing_sub

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.updated"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_existing_sub.status == "active"


class TestSubscriptionDeletedEvent:
    """Test customer.subscription.deleted event"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_subscription_deleted_marks_canceled(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_subscription_object
    ):
        """Test subscription deletion marks as canceled"""
        mock_stripe_event.type = "customer.subscription.deleted"
        mock_subscription_object.status = "canceled"
        mock_stripe_event.data.object = mock_subscription_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock existing subscription
        mock_existing_sub = Mock(spec=Subscription, id=uuid4(), status="active")
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_existing_sub

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.deleted"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_existing_sub.status == "canceled"


class TestTrialWillEndEvent:
    """Test customer.subscription.trial_will_end event"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_trial_will_end_notification(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_subscription_object
    ):
        """Test trial ending notification is logged"""
        mock_stripe_event.type = "customer.subscription.trial_will_end"
        mock_stripe_event.data.object = mock_subscription_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock user and subscription
        mock_user = Mock(spec=User, id=uuid4(), email="test@example.com", name="Test User")
        mock_subscription = Mock(spec=Subscription, id=uuid4(), user_id=mock_user.id)
        mock_db_session.query.return_value.filter.return_value.first.side_effect = [
            mock_subscription,
            mock_user
        ]

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.trial_will_end"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK


class TestInvoicePaymentSucceededEvent:
    """Test invoice.payment_succeeded event"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_invoice_payment_succeeded_creates_payment_record(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_invoice_object
    ):
        """Test successful payment creates payment record"""
        mock_stripe_event.type = "invoice.payment_succeeded"
        mock_stripe_event.data.object = mock_invoice_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock subscription lookup
        mock_subscription = Mock(spec=Subscription, id=uuid4(), user_id=uuid4())
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "invoice.payment_succeeded"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK
        # Verify payment record was added
        assert mock_db_session.add.called

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_invoice_payment_succeeded_updates_subscription_status(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_invoice_object
    ):
        """Test successful payment updates subscription to active"""
        mock_stripe_event.type = "invoice.payment_succeeded"
        mock_stripe_event.data.object = mock_invoice_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock subscription in past_due status
        mock_subscription = Mock(spec=Subscription, id=uuid4(), user_id=uuid4(), status="past_due")
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "invoice.payment_succeeded"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_subscription.status == "active"


class TestInvoicePaymentFailedEvent:
    """Test invoice.payment_failed event"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_invoice_payment_failed_updates_status(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_invoice_object
    ):
        """Test failed payment updates subscription to past_due"""
        mock_stripe_event.type = "invoice.payment_failed"
        mock_invoice_object.status = "open"
        mock_stripe_event.data.object = mock_invoice_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock active subscription
        mock_subscription = Mock(spec=Subscription, id=uuid4(), user_id=uuid4(), status="active")
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_subscription

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "invoice.payment_failed"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_subscription.status == "past_due"


class TestPaymentIntentEvents:
    """Test payment_intent.succeeded and payment_intent.payment_failed events"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    def test_payment_intent_succeeded(self, mock_get_stripe, client, valid_webhook_signature, mock_stripe_event):
        """Test payment intent succeeded event is logged"""
        mock_stripe_event.type = "payment_intent.succeeded"
        payment_intent = Mock(id="pi_123", amount=4900, currency="chf")
        mock_stripe_event.data.object = payment_intent

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "payment_intent.succeeded"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK

    @patch('routers.swisstax.webhooks.get_stripe_service')
    def test_payment_intent_payment_failed(self, mock_get_stripe, client, valid_webhook_signature, mock_stripe_event):
        """Test payment intent failed event is logged"""
        mock_stripe_event.type = "payment_intent.payment_failed"
        payment_intent = Mock(id="pi_123", amount=4900, currency="chf", last_payment_error=Mock(message="Card declined"))
        mock_stripe_event.data.object = payment_intent

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "payment_intent.payment_failed"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK


class TestUnhandledEvents:
    """Test unhandled webhook events"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    def test_unhandled_event_type(self, mock_get_stripe, client, valid_webhook_signature, mock_stripe_event):
        """Test unhandled event types are acknowledged"""
        mock_stripe_event.type = "customer.created"
        mock_stripe_event.data.object = Mock()

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.created"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        assert response.status_code == status.HTTP_200_OK


class TestWebhookErrorHandling:
    """Test webhook error handling"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_webhook_database_error(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_subscription_object
    ):
        """Test webhook handles database errors gracefully"""
        mock_stripe_event.type = "customer.subscription.created"
        mock_stripe_event.data.object = mock_subscription_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        # Mock database error
        mock_db_session = MagicMock()
        mock_db_session.commit.side_effect = Exception("Database error")
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        response = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.created"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        # Should still return 200 to prevent Stripe from retrying
        assert response.status_code == status.HTTP_200_OK

    @patch('routers.swisstax.webhooks.get_stripe_service')
    def test_webhook_invalid_json(self, mock_get_stripe, client, valid_webhook_signature):
        """Test webhook with invalid JSON"""
        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.side_effect = ValueError("Invalid JSON")
        mock_get_stripe.return_value = mock_stripe_service

        response = client.post(
            "/api/webhooks/stripe",
            data="invalid json",
            headers={
                "Stripe-Signature": valid_webhook_signature,
                "Content-Type": "application/json"
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestWebhookIdempotency:
    """Test webhook idempotency (processing same event twice)"""

    @patch('routers.swisstax.webhooks.get_stripe_service')
    @patch('routers.swisstax.webhooks.get_db')
    def test_duplicate_webhook_event(
        self, mock_get_db, mock_get_stripe, client, valid_webhook_signature,
        mock_stripe_event, mock_subscription_object
    ):
        """Test processing same webhook event twice is safe"""
        mock_stripe_event.type = "customer.subscription.created"
        mock_stripe_event.data.object = mock_subscription_object

        mock_stripe_service = Mock()
        mock_stripe_service.construct_webhook_event.return_value = mock_stripe_event
        mock_get_stripe.return_value = mock_stripe_service

        mock_db_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_db_session

        # Mock user and existing subscription
        mock_user = Mock(spec=User, id=uuid4(), stripe_customer_id="cus_test123")
        mock_existing_sub = Mock(spec=Subscription, id=uuid4(), stripe_subscription_id="sub_stripe123")
        mock_db_session.query.return_value.filter.return_value.first.side_effect = [
            mock_user,
            mock_existing_sub
        ]

        # Send webhook twice
        response1 = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.created"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        response2 = client.post(
            "/api/webhooks/stripe",
            json={"type": "customer.subscription.created"},
            headers={"Stripe-Signature": valid_webhook_signature}
        )

        # Both should succeed
        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK
