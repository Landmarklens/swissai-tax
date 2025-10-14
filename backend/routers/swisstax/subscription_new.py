"""
New Subscription Router - Real Stripe Integration
Handles subscription creation, management, and billing with Stripe
"""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
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
from services.referral_service import ReferralService
from services.discount_service import DiscountService

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
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info(f"Creating setup intent for user {current_user.id}, plan: {setup_data.plan_type}")

        if not settings.ENABLE_SUBSCRIPTIONS:
            logger.warning("Subscriptions not enabled")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Subscriptions are not enabled yet"
            )

        stripe_service = get_stripe_service()

        # Create or get Stripe customer
        if not current_user.stripe_customer_id:
            logger.info(f"Creating Stripe customer for user {current_user.email}")
            customer = stripe_service.create_customer(
                email=current_user.email,
                name=f"{current_user.first_name} {current_user.last_name}".strip(),
                metadata={'user_id': str(current_user.id)}
            )

            # Query the user from the current session to avoid detached instance error
            user_in_session = db.query(User).filter(User.id == current_user.id).first()
            if not user_in_session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            # Save customer ID to user in session
            user_in_session.stripe_customer_id = customer.id
            db.commit()
            db.refresh(user_in_session)
            customer_id = customer.id
            logger.info(f"Created Stripe customer: {customer_id}")
        else:
            customer_id = current_user.stripe_customer_id
            logger.info(f"Using existing Stripe customer: {customer_id}")

        # Create SetupIntent
        logger.info(f"Creating SetupIntent for customer {customer_id}")
        setup_intent = stripe_service.create_setup_intent(customer_id)
        logger.info(f"Created SetupIntent: {setup_intent.id}")

        return SetupIntentResponse(
            client_secret=setup_intent.client_secret,
            setup_intent_id=setup_intent.id
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating setup intent: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating setup intent: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create setup intent: {str(e)}"
        )


# ============================================================================
# SUBSCRIPTION CREATION
# ============================================================================

@router.post("/create", response_model=SubscriptionResponse)
async def create_subscription(
    sub_data: SubscriptionCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new subscription with 30-day trial (for paid plans) or free subscription
    Free plan: No Stripe required, database-only subscription
    Paid plans: Requires payment method to be already attached to customer (via SetupIntent)
    Supports optional discount codes for promotional or referral discounts
    """
    # Check if user already has an active subscription
    existing_sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(['active', 'trialing'])
        )
        .first()
    )

    # ========================================================================
    # SPECIAL HANDLING FOR FREE PLAN - No Stripe required
    # ========================================================================
    if sub_data.plan_type == 'free':
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[create_subscription] FREE PLAN requested by user_id: {current_user.id}, email: {current_user.email}")
        logger.info(f"[create_subscription] Existing subscription check: {existing_sub}")

        # If user already has a free subscription, return it (idempotent operation)
        if existing_sub and existing_sub.plan_type == 'free':
            logger.info(f"[create_subscription] User {current_user.id} already has free subscription, returning existing (idempotent)")
            return _build_subscription_response(existing_sub)

        plan_config = _get_plan_config('free')
        logger.info(f"[create_subscription] Creating new free subscription for user_id: {current_user.id}")

        # Create free subscription record in database (no Stripe)
        subscription = Subscription(
            user_id=current_user.id,
            plan_type='free',
            status='active',  # Free plan is immediately active
            stripe_subscription_id=None,  # No Stripe subscription
            stripe_customer_id=None,  # No Stripe customer needed
            stripe_price_id=None,  # No Stripe price
            current_period_start=datetime.utcnow(),
            current_period_end=None,  # Free plan doesn't expire
            price_chf=0.00,
            plan_commitment_years=0,
            trial_start=None,  # No trial for free plan
            trial_end=None,
            commitment_start_date=None,
            commitment_end_date=None,
            cancel_at_period_end=False
        )

        db.add(subscription)
        db.commit()
        db.refresh(subscription)

        logger.info(f"[create_subscription] Successfully created free subscription for user_id: {current_user.id}, subscription_id: {subscription.id}")
        return _build_subscription_response(subscription)

    # ========================================================================
    # PAID PLANS - Require Stripe integration
    # ========================================================================
    # Block duplicate subscriptions for paid plans
    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active subscription"
        )

    if not settings.ENABLE_SUBSCRIPTIONS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Subscriptions are not enabled yet"
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

    # Determine commitment years and pricing based on plan
    plan_config = _get_plan_config(sub_data.plan_type)
    commitment_years = plan_config['commitment_years']

    # ========================================================================
    # DISCOUNT CODE HANDLING
    # ========================================================================
    discount_info = None
    referral_code = None

    if sub_data.discount_code:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Processing discount code: {sub_data.discount_code} for user {current_user.id}")

        # Initialize services
        referral_service = ReferralService(db)
        discount_service = DiscountService(db)

        # Build request metadata for fraud detection
        request_metadata = {
            'ip_address': request.client.host if request.client else None,
            'user_agent': request.headers.get('user-agent'),
        }

        # Validate discount code
        is_valid, referral_code, error_message = referral_service.validate_code(
            code=sub_data.discount_code,
            user_id=str(current_user.id),
            plan_type=sub_data.plan_type,
            request_metadata=request_metadata
        )

        if not is_valid:
            logger.warning(f"Invalid discount code {sub_data.discount_code}: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Discount code invalid: {error_message}"
            )

        # Calculate discount
        from decimal import Decimal
        original_price = Decimal(str(plan_config['price_chf']))
        discount_info = discount_service.calculate_discount(
            referral_code=referral_code,
            plan_type=sub_data.plan_type,
            original_price=original_price
        )

        logger.info(f"Discount applied: {discount_info['discount_amount_chf']} CHF off {discount_info['original_price_chf']} CHF")

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

    # Get price from plan config (use discounted price if applicable)
    price_chf = plan_config['price_chf']
    if discount_info:
        price_chf = discount_info['final_price_chf']

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
        cancel_at_period_end=False,
        # Discount tracking
        discount_code_used=sub_data.discount_code if discount_info else None,
        original_price_chf=discount_info['original_price_chf'] if discount_info else None,
        discount_amount_chf=discount_info['discount_amount_chf'] if discount_info else None,
        referral_code_id=referral_code.id if referral_code else None
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    # ========================================================================
    # RECORD REFERRAL USAGE AND ISSUE REWARDS
    # ========================================================================
    if discount_info and referral_code:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Recording referral usage for code {sub_data.discount_code}")

        referral_service = ReferralService(db)

        # Build request metadata again
        request_metadata = {
            'ip_address': request.client.host if request.client else None,
            'user_agent': request.headers.get('user-agent'),
        }

        try:
            # Record usage
            from decimal import Decimal
            usage = referral_service.record_code_usage(
                code=sub_data.discount_code,
                user_id=str(current_user.id),
                subscription_id=str(subscription.id),
                discount_applied=Decimal(str(discount_info['discount_amount_chf'])),
                original_price=Decimal(str(discount_info['original_price_chf'])),
                final_price=Decimal(str(discount_info['final_price_chf'])),
                request_metadata=request_metadata,
                stripe_coupon_id=None  # We're not using Stripe coupons for now
            )

            # Create reward if this is a user referral code
            if referral_code.code_type == 'user_referral':
                reward = referral_service.create_reward(str(usage.id))
                if reward:
                    logger.info(f"Created reward {reward.id} for referral code {sub_data.discount_code}")
        except Exception as e:
            logger.error(f"Error recording referral usage: {e}", exc_info=True)
            # Don't fail the subscription creation if referral tracking fails
            # The subscription is already created successfully

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
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"[get_current_subscription] Called for user_id: {current_user.id}, email: {current_user.email}")

    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(['active', 'trialing', 'past_due'])
        )
        .first()
    )

    if not subscription:
        logger.info(f"[get_current_subscription] No active subscription found for user_id: {current_user.id}")
        return None

    logger.info(f"[get_current_subscription] Found subscription for user_id: {current_user.id}, plan_type: {subscription.plan_type}, status: {subscription.status}")
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

    # Legacy: For 5-year commitment, only allow cancellation during trial
    if subscription.plan_type == '5_year_lock' and not subscription.is_in_trial:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="5-year plan can only be canceled during the 30-day trial period"
        )

    # New 4-tier model: All plans (basic, pro, premium) can cancel anytime
    # Free plan has no subscription to cancel

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

    # Get new plan configuration
    new_plan_config = _get_plan_config(switch_data.new_plan_type)
    new_commitment_years = new_plan_config['commitment_years']
    new_price_chf = new_plan_config['price_chf']

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

def _get_plan_config(plan_type: str) -> dict:
    """
    Get plan configuration (price, commitment, features)
    Supports new 4-tier model: free, basic, pro, premium
    """
    plans = {
        # New 4-tier model
        'free': {
            'price_chf': 0.00,
            'commitment_years': 0,
            'name': 'Free'
        },
        'basic': {
            'price_chf': 49.00,
            'commitment_years': 1,
            'name': 'Basic'
        },
        'pro': {
            'price_chf': 99.00,
            'commitment_years': 1,
            'name': 'Pro'
        },
        'premium': {
            'price_chf': 149.00,
            'commitment_years': 1,
            'name': 'Premium'
        },
        # Legacy plans (for backward compatibility)
        'annual_flex': {
            'price_chf': 129.00,
            'commitment_years': 1,
            'name': 'Annual Flex'
        },
        '5_year_lock': {
            'price_chf': 89.00,
            'commitment_years': 5,
            'name': '5-Year Price Lock'
        }
    }

    return plans.get(plan_type, plans['free'])


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
