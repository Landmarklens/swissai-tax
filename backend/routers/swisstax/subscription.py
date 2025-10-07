"""
Subscription Router - User subscription management
Handles fetching subscription details, cancellation, and billing history
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models.swisstax import Payment, Subscription, User
from schemas.swisstax.payment import (
    InvoiceResponse,
    SubscriptionCancel,
    SubscriptionResponse,
)

router = APIRouter()


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
            Subscription.status == "active"
        )
        .first()
    )

    if not subscription:
        return None

    return SubscriptionResponse(
        id=str(subscription.id),
        plan_type=subscription.plan_type,
        status=subscription.status,
        current_period_end=subscription.current_period_end,
        price_chf=float(subscription.price_chf),
        cancel_at_period_end=subscription.cancel_at_period_end,
        stripe_customer_id=subscription.stripe_customer_id,
        stripe_subscription_id=subscription.stripe_subscription_id,
        current_period_start=subscription.current_period_start,
        canceled_at=subscription.canceled_at,
    )


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    cancel_data: SubscriptionCancel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel user's subscription
    - If immediately=False: Cancel at period end (default)
    - If immediately=True: Cancel immediately (loses access)
    """
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        )
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )

    # Check if already canceled
    if subscription.cancel_at_period_end or subscription.status == "canceled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription is already canceled"
        )

    # Update subscription
    if cancel_data.immediately:
        subscription.status = "canceled"
        subscription.canceled_at = datetime.utcnow()
        # TODO: When Stripe is integrated, call stripe.Subscription.delete()
    else:
        subscription.cancel_at_period_end = True
        subscription.canceled_at = datetime.utcnow()
        # TODO: When Stripe is integrated, call stripe.Subscription.modify(
        #   subscription.stripe_subscription_id,
        #   cancel_at_period_end=True
        # )

    db.commit()
    db.refresh(subscription)

    return SubscriptionResponse(
        id=str(subscription.id),
        plan_type=subscription.plan_type,
        status=subscription.status,
        current_period_end=subscription.current_period_end,
        price_chf=float(subscription.price_chf),
        cancel_at_period_end=subscription.cancel_at_period_end,
        stripe_customer_id=subscription.stripe_customer_id,
        stripe_subscription_id=subscription.stripe_subscription_id,
        current_period_start=subscription.current_period_start,
        canceled_at=subscription.canceled_at,
    )


@router.get("/invoices", response_model=List[InvoiceResponse])
async def get_billing_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """
    Get user's billing history (past payments)
    Returns list of successful payments ordered by most recent
    """
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
                pdf_url=None,  # TODO: Generate invoice PDFs or get from Stripe
                payment_method=payment.payment_method,
                card_brand=payment.card_brand,
                card_last4=payment.card_last4,
            )
        )

    return invoices
