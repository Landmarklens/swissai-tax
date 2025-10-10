"""
Tests for Stripe Service
Tests real Stripe service functionality with mocking
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import stripe

from services.stripe_service import StripeService, get_stripe_service


class TestStripeServiceInitialization:
    """Test Stripe service initialization"""

    def test_init_requires_secret_key(self):
        """Test that initialization requires STRIPE_SECRET_KEY"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = None

            with pytest.raises(ValueError, match="STRIPE_SECRET_KEY is required"):
                StripeService()

    def test_init_sets_api_key(self):
        """Test that initialization sets Stripe API key"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"

            service = StripeService()

            assert stripe.api_key == "sk_test_123"

    def test_singleton_pattern(self):
        """Test that get_stripe_service returns singleton instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"

            # Reset singleton
            import services.stripe_service
            services.stripe_service._stripe_service = None

            service1 = get_stripe_service()
            service2 = get_stripe_service()

            assert service1 is service2


class TestCustomerManagement:
    """Test customer creation and retrieval"""

    @pytest.fixture
    def service(self):
        """Create StripeService instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"
            return StripeService()

    @patch('stripe.Customer.create')
    def test_create_customer_success(self, mock_create, service):
        """Test successful customer creation"""
        mock_customer = Mock()
        mock_customer.id = "cus_123"
        mock_create.return_value = mock_customer

        customer = service.create_customer(
            email="test@example.com",
            name="Test User",
            metadata={'user_id': 'user-123'}
        )

        assert customer.id == "cus_123"
        mock_create.assert_called_once_with(
            email="test@example.com",
            name="Test User",
            metadata={'user_id': 'user-123'}
        )

    @patch('stripe.Customer.create')
    def test_create_customer_stripe_error(self, mock_create, service):
        """Test customer creation with Stripe error"""
        mock_create.side_effect = stripe.error.StripeError("API error")

        with pytest.raises(stripe.error.StripeError):
            service.create_customer(email="test@example.com")

    @patch('stripe.Customer.retrieve')
    def test_get_customer_success(self, mock_retrieve, service):
        """Test successful customer retrieval"""
        mock_customer = Mock()
        mock_customer.id = "cus_123"
        mock_retrieve.return_value = mock_customer

        customer = service.get_customer("cus_123")

        assert customer.id == "cus_123"
        mock_retrieve.assert_called_once_with("cus_123")

    @patch('stripe.Customer.retrieve')
    def test_get_customer_not_found(self, mock_retrieve, service):
        """Test customer retrieval when not found"""
        mock_retrieve.side_effect = stripe.error.StripeError("Not found")

        customer = service.get_customer("cus_invalid")

        assert customer is None


class TestSubscriptionCreation:
    """Test subscription creation with trials"""

    @pytest.fixture
    def service(self):
        """Create StripeService instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"
            return StripeService()

    @patch('stripe.Subscription.create')
    def test_create_subscription_with_trial(self, mock_create, service):
        """Test successful subscription creation with trial"""
        mock_sub = Mock()
        mock_sub.id = "sub_123"
        mock_create.return_value = mock_sub

        subscription = service.create_subscription_with_trial(
            customer_id="cus_123",
            price_id="price_456",
            trial_days=30,
            metadata={'plan_type': 'annual_flex'}
        )

        assert subscription.id == "sub_123"
        mock_create.assert_called_once()
        call_args = mock_create.call_args[1]
        assert call_args['customer'] == "cus_123"
        assert call_args['items'][0]['price'] == "price_456"
        assert call_args['trial_period_days'] == 30
        assert call_args['metadata'] == {'plan_type': 'annual_flex'}

    @patch('stripe.Subscription.create')
    def test_create_subscription_stripe_error(self, mock_create, service):
        """Test subscription creation with Stripe error"""
        mock_create.side_effect = stripe.error.CardError("Card declined", None, None)

        with pytest.raises(stripe.error.StripeError):
            service.create_subscription_with_trial(
                customer_id="cus_123",
                price_id="price_456"
            )


class TestPaymentMethodManagement:
    """Test payment method attachment and management"""

    @pytest.fixture
    def service(self):
        """Create StripeService instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"
            return StripeService()

    @patch('stripe.Customer.modify')
    @patch('stripe.PaymentMethod.attach')
    def test_attach_payment_method_success(self, mock_attach, mock_modify, service):
        """Test successful payment method attachment"""
        mock_pm = Mock()
        mock_pm.id = "pm_123"
        mock_attach.return_value = mock_pm

        pm = service.attach_payment_method("pm_123", "cus_123")

        assert pm.id == "pm_123"
        mock_attach.assert_called_once_with("pm_123", customer="cus_123")
        mock_modify.assert_called_once_with(
            "cus_123",
            invoice_settings={'default_payment_method': "pm_123"}
        )

    @patch('stripe.PaymentMethod.attach')
    def test_attach_payment_method_error(self, mock_attach, service):
        """Test payment method attachment with error"""
        mock_attach.side_effect = stripe.error.InvalidRequestError("Invalid PM", None)

        with pytest.raises(stripe.error.StripeError):
            service.attach_payment_method("pm_invalid", "cus_123")


class TestSubscriptionCancellation:
    """Test subscription cancellation"""

    @pytest.fixture
    def service(self):
        """Create StripeService instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"
            return StripeService()

    @patch('stripe.Subscription.delete')
    def test_cancel_subscription_immediately(self, mock_delete, service):
        """Test immediate subscription cancellation"""
        mock_sub = Mock()
        mock_sub.id = "sub_123"
        mock_sub.status = "canceled"
        mock_delete.return_value = mock_sub

        subscription = service.cancel_subscription("sub_123", immediately=True)

        assert subscription.status == "canceled"
        mock_delete.assert_called_once_with("sub_123", prorate=False)

    @patch('stripe.Subscription.modify')
    def test_cancel_subscription_at_period_end(self, mock_modify, service):
        """Test cancel subscription at period end"""
        mock_sub = Mock()
        mock_sub.id = "sub_123"
        mock_sub.cancel_at_period_end = True
        mock_modify.return_value = mock_sub

        subscription = service.cancel_subscription(
            "sub_123",
            immediately=False,
            reason="Too expensive"
        )

        assert subscription.cancel_at_period_end == True
        mock_modify.assert_called_once()
        call_args = mock_modify.call_args[1]
        assert call_args['cancel_at_period_end'] == True
        assert call_args['metadata']['cancellation_reason'] == "Too expensive"

    @patch('stripe.Subscription.modify')
    def test_reactivate_subscription(self, mock_modify, service):
        """Test reactivating a scheduled cancellation"""
        mock_sub = Mock()
        mock_sub.id = "sub_123"
        mock_sub.cancel_at_period_end = False
        mock_modify.return_value = mock_sub

        subscription = service.reactivate_subscription("sub_123")

        assert subscription.cancel_at_period_end == False
        mock_modify.assert_called_once_with("sub_123", cancel_at_period_end=False)


class TestSubscriptionPlanUpdate:
    """Test subscription plan switching"""

    @pytest.fixture
    def service(self):
        """Create StripeService instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"
            return StripeService()

    @patch('stripe.Subscription.modify')
    @patch('stripe.Subscription.retrieve')
    def test_update_subscription_plan(self, mock_retrieve, mock_modify, service):
        """Test successful plan update"""
        # Create a proper dict-like mock
        mock_sub = MagicMock()
        mock_sub.id = "sub_123"
        mock_sub.__getitem__.return_value = {'data': [Mock(id='si_123')]}
        mock_retrieve.return_value = mock_sub
        mock_modify.return_value = mock_sub

        subscription = service.update_subscription_plan(
            "sub_123",
            "price_new",
            proration_behavior='none'
        )

        assert subscription.id == "sub_123"
        mock_retrieve.assert_called_once_with("sub_123")
        mock_modify.assert_called_once()
        call_args = mock_modify.call_args[1]
        assert call_args['items'][0]['price'] == "price_new"
        assert call_args['proration_behavior'] == 'none'


class TestSetupIntents:
    """Test SetupIntent creation for trial signups"""

    @pytest.fixture
    def service(self):
        """Create StripeService instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"
            return StripeService()

    @patch('stripe.SetupIntent.create')
    def test_create_setup_intent(self, mock_create, service):
        """Test successful SetupIntent creation"""
        mock_si = Mock()
        mock_si.id = "seti_123"
        mock_si.client_secret = "seti_123_secret"
        mock_create.return_value = mock_si

        setup_intent = service.create_setup_intent("cus_123")

        assert setup_intent.id == "seti_123"
        assert setup_intent.client_secret == "seti_123_secret"
        mock_create.assert_called_once_with(
            customer="cus_123",
            payment_method_types=['card'],
            usage='off_session'
        )


class TestWebhookVerification:
    """Test webhook signature verification"""

    @pytest.fixture
    def service(self):
        """Create StripeService instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"
            mock_settings.STRIPE_WEBHOOK_SECRET = "whsec_123"
            return StripeService()

    @patch('stripe.Webhook.construct_event')
    def test_construct_webhook_event_success(self, mock_construct, service):
        """Test successful webhook verification"""
        mock_event = Mock()
        mock_event.id = "evt_123"
        mock_event.type = "customer.subscription.created"
        mock_construct.return_value = mock_event

        event = service.construct_webhook_event(
            payload=b'{"test": "data"}',
            signature="t=123,v1=abc"
        )

        assert event.id == "evt_123"
        assert event.type == "customer.subscription.created"
        mock_construct.assert_called_once()

    @patch('stripe.Webhook.construct_event')
    def test_construct_webhook_event_invalid_signature(self, mock_construct, service):
        """Test webhook verification with invalid signature"""
        mock_construct.side_effect = stripe.error.SignatureVerificationError("Invalid signature", None)

        with pytest.raises(ValueError, match="Invalid signature"):
            service.construct_webhook_event(
                payload=b'{"test": "data"}',
                signature="invalid"
            )


class TestInvoiceRetrieval:
    """Test invoice listing and retrieval"""

    @pytest.fixture
    def service(self):
        """Create StripeService instance"""
        with patch('services.stripe_service.settings') as mock_settings:
            mock_settings.STRIPE_SECRET_KEY = "sk_test_123"
            return StripeService()

    @patch('stripe.Invoice.list')
    def test_list_customer_invoices(self, mock_list, service):
        """Test listing customer invoices"""
        mock_invoice1 = Mock(id="in_1")
        mock_invoice2 = Mock(id="in_2")
        mock_list.return_value = Mock(data=[mock_invoice1, mock_invoice2])

        invoices = service.list_customer_invoices("cus_123", limit=10)

        assert len(invoices) == 2
        assert invoices[0].id == "in_1"
        assert invoices[1].id == "in_2"
        mock_list.assert_called_once_with(customer="cus_123", limit=10)

    @patch('stripe.Invoice.upcoming')
    def test_get_upcoming_invoice(self, mock_upcoming, service):
        """Test retrieving upcoming invoice"""
        mock_invoice = Mock(id="in_upcoming")
        mock_upcoming.return_value = mock_invoice

        invoice = service.get_upcoming_invoice("cus_123")

        assert invoice.id == "in_upcoming"
        mock_upcoming.assert_called_once_with(customer="cus_123")

    @patch('stripe.Invoice.upcoming')
    def test_get_upcoming_invoice_none(self, mock_upcoming, service):
        """Test upcoming invoice when none exists"""
        mock_upcoming.side_effect = stripe.error.InvalidRequestError("No upcoming invoice", None)

        invoice = service.get_upcoming_invoice("cus_123")

        assert invoice is None
