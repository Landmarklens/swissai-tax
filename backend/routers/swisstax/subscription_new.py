"""
New Subscription Router - Real Stripe Integration
Handles subscription creation, management, and billing with Stripe
"""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session
import stripe

from config import settings
from core.security import get_current_user
from db.session import get_db
from models.swisstax import Payment, Subscription, User
from schemas.swisstax.payment import (
    InvoiceResponse,
    SetupIntentCreate,
    SetupIntentResponse,
    SubscriptionCancel,
    SubscriptionCreate,
    SubscriptionPause,
    SubscriptionResponse,
    SubscriptionSwitch,
)
from services.stripe_service import get_stripe_service
from services.stripe_mock_service import get_stripe_service as get_mock_stripe_service

router = APIRouter()


def get_active_stripe_service():
    """
    Get the appropriate Stripe service based on feature flag
    Returns real StripeService if ENABLE_SUBSCRIPTIONS=True, otherwise mock
    """
    if settings.ENABLE_SUBSCRIPTIONS:
        return get_stripe_service()
    else:
        return get_mock_stripe_service()


# ============================================================================
# SETUP INTENT - For collecting payment method during trial
# ============================================================================

@router.post("/setup-intent", response_model=SetupIntentResponse)
async def create_setup_intent(
    setup_data: SetupIntentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a SetupIntent for collecting payment method before subscription starts
    This is used during the signup flow to capture card details without charging
    """
    if not settings.ENABLE_SUBSCRIPTIONS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Subscriptions are not enabled yet"
        )

    stripe_service = get_stripe_service()

    # Create or get Stripe customer
    if not current_user.stripe_customer_id:
        customer = stripe_service.create_customer(
            email=current_user.email,
            name=f"{current_user.first_name} {current_user.last_name}".strip(),
            metadata={'user_id': str(current_user.id)}
        )
        # Save customer ID to user
        current_user.stripe_customer_id = customer.id
        db.commit()
        db.refresh(current_user)  # Refresh to ensure customer_id is set
        customer_id = customer.id
    else:
        customer_id = current_user.stripe_customer_id

    # Create SetupIntent
    setup_intent = stripe_service.create_setup_intent(customer_id)

    return SetupIntentResponse(
        client_secret=setup_intent.client_secret,
        setup_intent_id=setup_intent.id
    )


# ============================================================================
# SUBSCRIPTION CREATION
# ============================================================================

@router.post("/create", response_model=SubscriptionResponse)
async def create_subscription(
    sub_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new subscription with 30-day trial
    Requires payment method to be already attached to customer (via SetupIntent)
    """
    if not settings.ENABLE_SUBSCRIPTIONS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Subscriptions are not enabled yet"
        )

    # Check if user already has an active subscription
    existing_sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(['active', 'trialing'])
        )
        .first()
    )
    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active subscription"
        )

    stripe_service = get_stripe_service()

    # Ensure customer exists
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe customer found. Please complete payment method setup first."
        )

    # Get price ID for plan
    price_id = settings.STRIPE_PLAN_PRICES.get(sub_data.plan_type)
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan type: {sub_data.plan_type}"
        )

    # Determine commitment years
    commitment_years = 5 if sub_data.plan_type == '5_year_lock' else 1

    # Create Stripe subscription with trial
    try:
        stripe_sub = stripe_service.create_subscription_with_trial(
            customer_id=current_user.stripe_customer_id,
            price_id=price_id,
            trial_days=30,
            metadata={
                'user_id': str(current_user.id),
                'plan_type': sub_data.plan_type,
                'commitment_years': str(commitment_years)
            }
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create subscription: {str(e)}"
        )

    # Calculate dates
    trial_start = datetime.utcnow()
    trial_end = trial_start + timedelta(days=30)
    commitment_start = trial_end
    commitment_end = commitment_start + timedelta(days=365 * commitment_years)

    # Determine price
    price_chf = 89.00 if sub_data.plan_type == '5_year_lock' else 129.00

    # Create subscription record in database
    subscription = Subscription(
        user_id=current_user.id,
        plan_type=sub_data.plan_type,
        status='trialing',
        stripe_subscription_id=stripe_sub.id,
        stripe_customer_id=current_user.stripe_customer_id,
        stripe_price_id=price_id,
        current_period_start=datetime.fromtimestamp(stripe_sub.current_period_start),
        current_period_end=datetime.fromtimestamp(stripe_sub.current_period_end),
        price_chf=price_chf,
        plan_commitment_years=commitment_years,
        trial_start=trial_start,
        trial_end=trial_end,
        commitment_start_date=commitment_start,
        commitment_end_date=commitment_end,
        cancel_at_period_end=False
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return _build_subscription_response(subscription)


# ============================================================================
# SUBSCRIPTION RETRIEVAL
# ============================================================================

@router.get("/current", response_model=Optional[SubscriptionResponse])
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's current active subscription
    Returns None if user has no active subscription
    """
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(['active', 'trialing', 'past_due'])
        )
        .first()
    )

    if not subscription:
        return None

    return _build_subscription_response(subscription)


# ============================================================================
# SUBSCRIPTION CANCELLATION
# ============================================================================

@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    cancel_data: SubscriptionCancel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel subscription - only allowed during trial period for 5-year plan
    Annual flex plan can request cancellation anytime (handled at period end)
    """
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(['active', 'trialing'])
        )
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )

    # Check if already requested cancellation
    if subscription.cancellation_requested_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancellation already requested"
        )

    # For 5-year commitment: Only allow cancellation during trial
    if subscription.plan_type == '5_year_lock' and not subscription.is_in_trial:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="5-year plan can only be canceled during the 30-day trial period"
        )

    # Cancel in Stripe (immediately during trial, at period end otherwise)
    if settings.ENABLE_SUBSCRIPTIONS:
        stripe_service = get_stripe_service()
        try:
            cancel_immediately = subscription.is_in_trial
            stripe_service.cancel_subscription(
                subscription.stripe_subscription_id,
                immediately=cancel_immediately,
                reason=cancel_data.reason
            )
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to cancel subscription: {str(e)}"
            )

    # Update subscription in database
    subscription.cancellation_requested_at = datetime.utcnow()
    subscription.cancellation_reason = cancel_data.reason

    if subscription.is_in_trial:
        # Cancel immediately during trial
        subscription.status = "canceled"
        subscription.canceled_at = datetime.utcnow()
    else:
        # Cancel at period end for annual flex
        subscription.cancel_at_period_end = True
        subscription.canceled_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    return _build_subscription_response(subscription)


# ============================================================================
# SUBSCRIPTION SWITCHING
# ============================================================================

@router.post("/switch", response_model=SubscriptionResponse)
async def switch_subscription_plan(
    switch_data: SubscriptionSwitch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Switch between annual_flex and 5_year_lock plans
    Only allowed during trial period or at renewal
    """
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(['active', 'trialing'])
        )
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )

    # Prevent switching to same plan
    if subscription.plan_type == switch_data.new_plan_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to this plan"
        )

    # Only allow switching during trial
    if not subscription.is_in_trial:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Plan switching is only allowed during the 30-day trial period"
        )

    # Get new price ID
    new_price_id = settings.STRIPE_PLAN_PRICES.get(switch_data.new_plan_type)
    if not new_price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan type: {switch_data.new_plan_type}"
        )

    # Update in Stripe
    if settings.ENABLE_SUBSCRIPTIONS:
        stripe_service = get_stripe_service()
        try:
            stripe_service.update_subscription_plan(
                subscription.stripe_subscription_id,
                new_price_id,
                proration_behavior='none'  # No proration during trial
            )
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to switch plan: {str(e)}"
            )

    # Update subscription in database
    new_commitment_years = 5 if switch_data.new_plan_type == '5_year_lock' else 1
    new_price_chf = 89.00 if switch_data.new_plan_type == '5_year_lock' else 129.00

    subscription.plan_type = switch_data.new_plan_type
    subscription.stripe_price_id = new_price_id
    subscription.price_chf = new_price_chf
    subscription.plan_commitment_years = new_commitment_years

    # Update commitment end date
    if subscription.commitment_start_date:
        subscription.commitment_end_date = (
            subscription.commitment_start_date + timedelta(days=365 * new_commitment_years)
        )

    db.commit()
    db.refresh(subscription)

    return _build_subscription_response(subscription)


# ============================================================================
# SUBSCRIPTION PAUSE (Request only - handled manually)
# ============================================================================

@router.post("/pause", response_model=SubscriptionResponse)
async def request_pause_subscription(
    pause_data: SubscriptionPause,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Request to pause subscription
    This creates a support request - pausing is handled manually
    """
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(['active', 'trialing'])
        )
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )

    if subscription.pause_requested:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pause request already submitted"
        )

    # Mark as pause requested
    subscription.pause_requested = True
    subscription.pause_reason = pause_data.reason

    db.commit()
    db.refresh(subscription)

    # TODO: Send notification to support team

    return _build_subscription_response(subscription)


# ============================================================================
# BILLING HISTORY
# ============================================================================

@router.get("/invoices", response_model=List[InvoiceResponse])
async def get_billing_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """
    Get user's billing history (past payments and invoices)
    """
    if settings.ENABLE_SUBSCRIPTIONS and current_user.stripe_customer_id:
        # Get invoices from Stripe
        stripe_service = get_stripe_service()
        stripe_invoices = stripe_service.list_customer_invoices(
            current_user.stripe_customer_id,
            limit=limit
        )

        invoices = []
        for invoice in stripe_invoices:
            # Safely extract payment method - payment_intent might be string ID or object
            payment_method = None
            if invoice.payment_intent:
                if isinstance(invoice.payment_intent, str):
                    # It's just an ID, need to expand to get payment_method
                    payment_method = None
                elif hasattr(invoice.payment_intent, 'payment_method'):
                    payment_method = invoice.payment_intent.payment_method

            invoices.append(
                InvoiceResponse(
                    id=invoice.id,
                    amount_chf=float(invoice.amount_paid / 100),  # Convert cents to CHF
                    description=invoice.description or f"Subscription payment",
                    status=invoice.status,
                    created_at=datetime.fromtimestamp(invoice.created),
                    pdf_url=invoice.invoice_pdf,
                    payment_method=payment_method,
                    card_brand=None,
                    card_last4=None,
                )
            )
        return invoices
    else:
        # Fallback to database payments
        payments = (
            db.query(Payment)
            .filter(
                Payment.user_id == current_user.id,
                Payment.status == "succeeded"
            )
            .order_by(desc(Payment.created_at))
            .limit(limit)
            .all()
        )

        invoices = []
        for payment in payments:
            invoices.append(
                InvoiceResponse(
                    id=str(payment.id),
                    amount_chf=float(payment.amount_chf),
                    description=payment.description or f"{payment.payment_method} payment",
                    status=payment.status,
                    created_at=payment.created_at,
                    pdf_url=None,
                    payment_method=payment.payment_method,
                    card_brand=payment.card_brand,
                    card_last4=payment.card_last4,
                )
            )

        return invoices


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _build_subscription_response(subscription: Subscription) -> SubscriptionResponse:
    """Build SubscriptionResponse from Subscription model"""
    return SubscriptionResponse(
        id=str(subscription.id),
        plan_type=subscription.plan_type,
        status=subscription.status,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        price_chf=float(subscription.price_chf),
        cancel_at_period_end=subscription.cancel_at_period_end,
        canceled_at=subscription.canceled_at,
        stripe_customer_id=subscription.stripe_customer_id,
        stripe_subscription_id=subscription.stripe_subscription_id,
        trial_start=subscription.trial_start,
        trial_end=subscription.trial_end,
        is_in_trial=subscription.is_in_trial,
        plan_commitment_years=subscription.plan_commitment_years,
        commitment_start_date=subscription.commitment_start_date,
        commitment_end_date=subscription.commitment_end_date,
        is_committed=subscription.is_committed,
        can_cancel_now=subscription.can_cancel_now,
        pause_requested=subscription.pause_requested,
        switch_requested=subscription.switch_requested,
        cancellation_requested_at=subscription.cancellation_requested_at,
    )
