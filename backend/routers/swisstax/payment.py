"""Payment Router - condensed version with Stripe"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from db.session import get_db
from models.swisstax import User, Payment, Subscription
from utils.auth import get_current_user
from schemas.swisstax.payment import PaymentIntentCreate, PaymentIntentResponse
from datetime import datetime
from decimal import Decimal

router = APIRouter()

# Stripe will be configured when needed
PLANS = {
    "basic": 0,
    "standard": 39,
    "premium": 99
}

@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(data: PaymentIntentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create payment intent (Stripe integration placeholder)"""
    amount = PLANS.get(data.plan_type, 0)

    # Placeholder - real implementation would use Stripe
    payment = Payment(
        user_id=current_user.id,
        filing_id=data.filing_id,
        amount_chf=Decimal(str(amount)),
        status="pending",
        payment_method="card"
    )
    db.add(payment)
    db.commit()

    return {
        "client_secret": "placeholder_secret",
        "payment_intent_id": str(payment.id),
        "amount_chf": float(amount)
    }

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    # Placeholder - real implementation would verify Stripe signature
    return {"status": "success"}
