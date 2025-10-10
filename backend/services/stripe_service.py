"""
Stripe Service for Real Subscription Management
Replaces StripeMockService when ENABLE_SUBSCRIPTIONS feature flag is enabled
"""
import logging
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from uuid import UUID
import stripe

from config import settings

logger = logging.getLogger(__name__)


class StripeService:
    """
    Real Stripe service for subscription management
    Handles customer creation, subscription management, and payment processing
    """

    def __init__(self):
        """Initialize Stripe service with API keys"""
        if not settings.STRIPE_SECRET_KEY:
            raise ValueError("STRIPE_SECRET_KEY is required for Stripe integration")

        stripe.api_key = settings.STRIPE_SECRET_KEY
        logger.info("Initialized Stripe service with live API key")

    # ============================================================================
    # CUSTOMER MANAGEMENT
    # ============================================================================

    def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> stripe.Customer:
        """
        Create a new Stripe customer

        Args:
            email: Customer email
            name: Customer name
            metadata: Additional metadata (user_id, etc.)

        Returns:
            Stripe Customer object
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            logger.info(f"Created Stripe customer {customer.id} for {email}")
            return customer
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {e}")
            raise

    def get_customer(self, customer_id: str) -> Optional[stripe.Customer]:
        """Get Stripe customer by ID"""
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve customer {customer_id}: {e}")
            return None

    # ============================================================================
    # SUBSCRIPTION CREATION
    # ============================================================================

    def create_subscription_with_trial(
        self,
        customer_id: str,
        price_id: str,
        trial_days: int = 30,
        metadata: Optional[Dict] = None
    ) -> stripe.Subscription:
        """
        Create subscription with trial period

        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID (annual_flex or 5_year_lock)
            trial_days: Number of trial days (default 30)
            metadata: Additional metadata (commitment_years, user_id, etc.)

        Returns:
            Stripe Subscription object
        """
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': price_id}],
                trial_period_days=trial_days,
                payment_behavior='default_incomplete',
                payment_settings={
                    'payment_method_types': ['card'],
                    'save_default_payment_method': 'on_subscription'
                },
                metadata=metadata or {},
                expand=['latest_invoice.payment_intent']
            )
            logger.info(
                f"Created subscription {subscription.id} for customer {customer_id} "
                f"with {trial_days}-day trial"
            )
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create subscription: {e}")
            raise

    def attach_payment_method(
        self,
        payment_method_id: str,
        customer_id: str
    ) -> stripe.PaymentMethod:
        """
        Attach payment method to customer and set as default

        Args:
            payment_method_id: Stripe PaymentMethod ID
            customer_id: Stripe customer ID

        Returns:
            Stripe PaymentMethod object
        """
        try:
            # Attach to customer
            payment_method = stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id
            )

            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={'default_payment_method': payment_method_id}
            )

            logger.info(f"Attached payment method {payment_method_id} to customer {customer_id}")
            return payment_method
        except stripe.error.StripeError as e:
            logger.error(f"Failed to attach payment method: {e}")
            raise

    # ============================================================================
    # SUBSCRIPTION MANAGEMENT
    # ============================================================================

    def cancel_subscription(
        self,
        subscription_id: str,
        immediately: bool = False,
        reason: str = None
    ) -> stripe.Subscription:
        """
        Cancel subscription

        Args:
            subscription_id: Stripe subscription ID
            immediately: If True, cancel immediately. If False, cancel at period end
            reason: Cancellation reason

        Returns:
            Updated Stripe Subscription object
        """
        try:
            if immediately:
                subscription = stripe.Subscription.delete(
                    subscription_id,
                    prorate=False
                )
                logger.info(f"Immediately canceled subscription {subscription_id}")
            else:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True,
                    metadata={'cancellation_reason': reason or 'user_requested'}
                )
                logger.info(f"Scheduled cancellation for subscription {subscription_id} at period end")

            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription {subscription_id}: {e}")
            raise

    def reactivate_subscription(self, subscription_id: str) -> stripe.Subscription:
        """
        Reactivate a subscription that was scheduled for cancellation

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Updated Stripe Subscription object
        """
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
            logger.info(f"Reactivated subscription {subscription_id}")
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to reactivate subscription {subscription_id}: {e}")
            raise

    def update_subscription_plan(
        self,
        subscription_id: str,
        new_price_id: str,
        proration_behavior: str = 'create_prorations'
    ) -> stripe.Subscription:
        """
        Update subscription to new plan/price

        Args:
            subscription_id: Stripe subscription ID
            new_price_id: New Stripe price ID
            proration_behavior: 'create_prorations', 'none', or 'always_invoice'

        Returns:
            Updated Stripe Subscription object
        """
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)

            subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': new_price_id,
                }],
                proration_behavior=proration_behavior
            )
            logger.info(f"Updated subscription {subscription_id} to price {new_price_id}")
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update subscription plan: {e}")
            raise

    def pause_subscription(
        self,
        subscription_id: str,
        resume_at: Optional[datetime] = None
    ) -> stripe.Subscription:
        """
        Pause subscription collection

        Args:
            subscription_id: Stripe subscription ID
            resume_at: When to resume (None = keep paused)

        Returns:
            Updated Stripe Subscription object
        """
        try:
            pause_collection = {'behavior': 'void'}
            if resume_at:
                pause_collection['resumes_at'] = int(resume_at.timestamp())

            subscription = stripe.Subscription.modify(
                subscription_id,
                pause_collection=pause_collection
            )
            logger.info(f"Paused subscription {subscription_id}")
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to pause subscription: {e}")
            raise

    def resume_subscription(self, subscription_id: str) -> stripe.Subscription:
        """
        Resume a paused subscription

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Updated Stripe Subscription object
        """
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                pause_collection=''  # Empty string removes pause
            )
            logger.info(f"Resumed subscription {subscription_id}")
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to resume subscription: {e}")
            raise

    # ============================================================================
    # SUBSCRIPTION QUERIES
    # ============================================================================

    def get_subscription(self, subscription_id: str) -> Optional[stripe.Subscription]:
        """Get subscription by ID"""
        try:
            return stripe.Subscription.retrieve(subscription_id, expand=['latest_invoice'])
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
            return None

    def list_customer_subscriptions(
        self,
        customer_id: str,
        status: Optional[str] = None
    ) -> List[stripe.Subscription]:
        """
        List all subscriptions for a customer

        Args:
            customer_id: Stripe customer ID
            status: Filter by status (active, canceled, etc.)

        Returns:
            List of Stripe Subscription objects
        """
        try:
            params = {'customer': customer_id, 'limit': 100}
            if status:
                params['status'] = status

            subscriptions = stripe.Subscription.list(**params)
            return list(subscriptions.auto_paging_iter())
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list subscriptions for customer {customer_id}: {e}")
            return []

    # ============================================================================
    # INVOICES & PAYMENTS
    # ============================================================================

    def list_customer_invoices(
        self,
        customer_id: str,
        limit: int = 50
    ) -> List[stripe.Invoice]:
        """
        List invoices for a customer

        Args:
            customer_id: Stripe customer ID
            limit: Maximum number of invoices to return

        Returns:
            List of Stripe Invoice objects
        """
        try:
            invoices = stripe.Invoice.list(
                customer=customer_id,
                limit=limit
            )
            return list(invoices.data)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list invoices for customer {customer_id}: {e}")
            return []

    def get_invoice(self, invoice_id: str) -> Optional[stripe.Invoice]:
        """Get invoice by ID"""
        try:
            return stripe.Invoice.retrieve(invoice_id)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve invoice {invoice_id}: {e}")
            return None

    def get_upcoming_invoice(self, customer_id: str) -> Optional[stripe.Invoice]:
        """
        Get upcoming invoice for customer

        Args:
            customer_id: Stripe customer ID

        Returns:
            Stripe Invoice object or None
        """
        try:
            return stripe.Invoice.upcoming(customer=customer_id)
        except stripe.error.InvalidRequestError:
            # No upcoming invoice
            return None
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve upcoming invoice: {e}")
            return None

    # ============================================================================
    # PAYMENT METHODS
    # ============================================================================

    def list_customer_payment_methods(
        self,
        customer_id: str,
        type: str = 'card'
    ) -> List[stripe.PaymentMethod]:
        """
        List payment methods for customer

        Args:
            customer_id: Stripe customer ID
            type: Payment method type (card, sepa_debit, etc.)

        Returns:
            List of PaymentMethod objects
        """
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type=type
            )
            return list(payment_methods.data)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list payment methods: {e}")
            return []

    def detach_payment_method(self, payment_method_id: str) -> stripe.PaymentMethod:
        """Detach (remove) payment method"""
        try:
            payment_method = stripe.PaymentMethod.detach(payment_method_id)
            logger.info(f"Detached payment method {payment_method_id}")
            return payment_method
        except stripe.error.StripeError as e:
            logger.error(f"Failed to detach payment method: {e}")
            raise

    # ============================================================================
    # SETUP INTENTS (for collecting payment methods)
    # ============================================================================

    def create_setup_intent(self, customer_id: str) -> stripe.SetupIntent:
        """
        Create SetupIntent for collecting payment method during trial

        Args:
            customer_id: Stripe customer ID

        Returns:
            Stripe SetupIntent object
        """
        try:
            setup_intent = stripe.SetupIntent.create(
                customer=customer_id,
                payment_method_types=['card'],
                usage='off_session'  # Allow charging without customer present
            )
            logger.info(f"Created SetupIntent {setup_intent.id} for customer {customer_id}")
            return setup_intent
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create SetupIntent: {e}")
            raise

    # ============================================================================
    # WEBHOOK VERIFICATION
    # ============================================================================

    def construct_webhook_event(
        self,
        payload: bytes,
        signature: str
    ) -> stripe.Event:
        """
        Verify and construct webhook event

        Args:
            payload: Raw request body
            signature: Stripe-Signature header value

        Returns:
            Verified Stripe Event object

        Raises:
            ValueError: If signature verification fails
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET
            )
            logger.info(f"Verified webhook event {event.id} - {event.type}")
            return event
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise ValueError("Invalid signature")


# Singleton instance
_stripe_service = None


def get_stripe_service() -> StripeService:
    """Get or create Stripe service instance"""
    global _stripe_service
    if _stripe_service is None:
        _stripe_service = StripeService()
    return _stripe_service
