"""
Stripe Webhook Handler
Processes Stripe webhook events for subscription lifecycle management
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends, status
from sqlalchemy.orm import Session
import stripe

from config import settings
from db.session import get_db
from models.swisstax import Subscription, Payment, User
from services.stripe_service import get_stripe_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/stripe")
async def handle_stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle incoming Stripe webhook events

    Events handled:
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - customer.subscription.trial_will_end
    - invoice.payment_succeeded
    - invoice.payment_failed
    - payment_intent.succeeded
    - payment_intent.payment_failed
    """
    if not settings.ENABLE_SUBSCRIPTIONS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhooks are not enabled"
        )

    # Get raw body and signature
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature"
        )

    # Verify and construct event
    stripe_service = get_stripe_service()
    try:
        event = stripe_service.construct_webhook_event(payload, sig_header)
    except ValueError as e:
        logger.error(f"Invalid webhook payload or signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Handle the event
    event_type = event['type']
    event_data = event['data']['object']

    try:
        if event_type == 'customer.subscription.created':
            handle_subscription_created(event_data, db)

        elif event_type == 'customer.subscription.updated':
            handle_subscription_updated(event_data, db)

        elif event_type == 'customer.subscription.deleted':
            handle_subscription_deleted(event_data, db)

        elif event_type == 'customer.subscription.trial_will_end':
            handle_trial_will_end(event_data, db)

        elif event_type == 'invoice.payment_succeeded':
            handle_payment_succeeded(event_data, db)

        elif event_type == 'invoice.payment_failed':
            handle_payment_failed(event_data, db)

        elif event_type == 'payment_intent.succeeded':
            handle_payment_intent_succeeded(event_data, db)

        elif event_type == 'payment_intent.payment_failed':
            handle_payment_intent_failed(event_data, db)

        else:
            logger.info(f"Unhandled webhook event type: {event_type}")

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error processing webhook {event_type}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing failed: {str(e)}"
        )


# ============================================================================
# SUBSCRIPTION EVENT HANDLERS
# ============================================================================

def handle_subscription_created(data: dict, db: Session):
    """Handle customer.subscription.created event"""
    subscription_id = data['id']
    customer_id = data['customer']
    status = data['status']

    logger.info(f"Subscription created: {subscription_id} for customer {customer_id} - Status: {status}")

    # Find user by customer ID
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.warning(f"User not found for customer {customer_id}")
        return

    # Find or create subscription
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_id
    ).first()

    if subscription:
        # Update existing subscription
        subscription.status = status
        subscription.current_period_start = datetime.fromtimestamp(data['current_period_start'])
        subscription.current_period_end = datetime.fromtimestamp(data['current_period_end'])
        logger.info(f"Updated existing subscription {subscription_id}")
    else:
        # Create new subscription
        subscription = Subscription(
            user_id=user.id,
            stripe_subscription_id=subscription_id,
            stripe_customer_id=customer_id,
            status=status,
            current_period_start=datetime.fromtimestamp(data['current_period_start']),
            current_period_end=datetime.fromtimestamp(data['current_period_end']),
            trial_start=datetime.fromtimestamp(data['trial_start']) if data.get('trial_start') else None,
            trial_end=datetime.fromtimestamp(data['trial_end']) if data.get('trial_end') else None,
            cancel_at_period_end=data.get('cancel_at_period_end', False)
        )
        db.add(subscription)
        logger.info(f"Created new subscription {subscription_id}")

    db.commit()


def handle_subscription_updated(data: dict, db: Session):
    """Handle customer.subscription.updated event"""
    subscription_id = data['id']
    new_status = data['status']

    logger.info(f"Subscription updated: {subscription_id} - New status: {new_status}")

    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_id
    ).first()

    if not subscription:
        logger.warning(f"Subscription {subscription_id} not found in database")
        return

    # Update subscription status and period
    subscription.status = new_status
    subscription.current_period_start = datetime.fromtimestamp(data['current_period_start'])
    subscription.current_period_end = datetime.fromtimestamp(data['current_period_end'])
    subscription.cancel_at_period_end = data.get('cancel_at_period_end', False)

    # Check if trial ended (transition from trialing to active)
    if new_status == 'active' and subscription.trial_end:
        if datetime.utcnow() >= subscription.trial_end:
            logger.info(f"Trial ended for subscription {subscription_id}")
            # Trial has ended, commitment period started
            if not subscription.commitment_start_date:
                subscription.commitment_start_date = datetime.utcnow()

    db.commit()
    logger.info(f"Subscription {subscription_id} updated successfully")


def handle_subscription_deleted(data: dict, db: Session):
    """Handle customer.subscription.deleted event"""
    subscription_id = data['id']

    logger.info(f"Subscription deleted: {subscription_id}")

    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_id
    ).first()

    if not subscription:
        logger.warning(f"Subscription {subscription_id} not found in database")
        return

    # Mark as canceled
    subscription.status = 'canceled'
    subscription.canceled_at = datetime.utcnow()

    db.commit()
    logger.info(f"Subscription {subscription_id} marked as canceled")


def handle_trial_will_end(data: dict, db: Session):
    """Handle customer.subscription.trial_will_end event (3 days before trial ends)"""
    subscription_id = data['id']
    customer_id = data['customer']
    trial_end = datetime.fromtimestamp(data['trial_end'])

    logger.info(f"Trial ending soon for subscription {subscription_id} - Ends: {trial_end}")

    # Find user by stripe customer ID
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()

    if user:
        # TODO: Send email notification that trial is ending in 3 days
        logger.info(f"Sending trial ending notification to {user.email}")
        # Email service integration here
    else:
        logger.warning(f"User not found for customer {customer_id}")


# ============================================================================
# PAYMENT EVENT HANDLERS
# ============================================================================

def handle_payment_succeeded(data: dict, db: Session):
    """Handle invoice.payment_succeeded event"""
    invoice_id = data['id']
    customer_id = data['customer']
    subscription_id = data.get('subscription')
    amount_paid = data['amount_paid'] / 100  # Convert cents to CHF
    payment_intent_id = data.get('payment_intent')

    logger.info(
        f"Payment succeeded: Invoice {invoice_id} - "
        f"Amount: CHF {amount_paid} - "
        f"Customer: {customer_id}"
    )

    # Find user
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.warning(f"User not found for customer {customer_id}")
        return

    # Create payment record
    payment = Payment(
        user_id=user.id,
        amount_chf=amount_paid,
        currency='CHF',
        status='succeeded',
        stripe_payment_intent_id=payment_intent_id,
        stripe_charge_id=data.get('charge'),
        payment_method='card',
        description=f"Subscription payment - Invoice {invoice_id}",
        paid_at=datetime.fromtimestamp(data['status_transitions']['paid_at']) if data.get('status_transitions', {}).get('paid_at') else datetime.utcnow()
    )

    db.add(payment)

    # Update subscription status if applicable
    if subscription_id:
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription_id
        ).first()

        if subscription:
            # Ensure status is active after successful payment
            if subscription.status != 'active':
                subscription.status = 'active'
                logger.info(f"Subscription {subscription_id} activated after successful payment")

    db.commit()
    logger.info(f"Payment record created for user {user.id}")


def handle_payment_failed(data: dict, db: Session):
    """Handle invoice.payment_failed event"""
    invoice_id = data['id']
    customer_id = data['customer']
    subscription_id = data.get('subscription')
    amount_due = data['amount_due'] / 100

    logger.warning(
        f"Payment failed: Invoice {invoice_id} - "
        f"Amount: CHF {amount_due} - "
        f"Customer: {customer_id}"
    )

    # Find user
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.warning(f"User not found for customer {customer_id}")
        return

    # Update subscription status to past_due
    if subscription_id:
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription_id
        ).first()

        if subscription:
            subscription.status = 'past_due'
            db.commit()
            logger.info(f"Subscription {subscription_id} marked as past_due")

    # TODO: Send email notification about failed payment
    logger.info(f"Sending payment failed notification to {user.email}")
    # Email service integration here


def handle_payment_intent_succeeded(data: dict, db: Session):
    """Handle payment_intent.succeeded event"""
    payment_intent_id = data['id']
    customer_id = data.get('customer')
    amount = data['amount'] / 100

    logger.info(
        f"PaymentIntent succeeded: {payment_intent_id} - "
        f"Amount: CHF {amount} - "
        f"Customer: {customer_id}"
    )

    # Additional processing if needed


def handle_payment_intent_failed(data: dict, db: Session):
    """Handle payment_intent.payment_failed event"""
    payment_intent_id = data['id']
    customer_id = data.get('customer')
    amount = data['amount'] / 100
    failure_message = data.get('last_payment_error', {}).get('message', 'Unknown error')

    logger.warning(
        f"PaymentIntent failed: {payment_intent_id} - "
        f"Amount: CHF {amount} - "
        f"Customer: {customer_id} - "
        f"Error: {failure_message}"
    )

    # Find user and send notification
    if customer_id:
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            # TODO: Send email notification about failed payment
            logger.info(f"Sending payment failed notification to {user.email}")
