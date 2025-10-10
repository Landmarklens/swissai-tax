"""
Referrals API Router
Endpoints for managing referral codes and rewards
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from db.session import get_db
from routers.auth import get_current_user
from models.swisstax.user import User
from models.swisstax.referral_code import ReferralCode
from models.swisstax.referral_usage import ReferralUsage
from models.swisstax.account_credit import UserAccountCredit
from schemas.swisstax.referral import (
    ReferralCodeResponse,
    DiscountCodeValidateRequest,
    DiscountCodeValidateResponse,
    ReferralStatsResponse,
    ReferralUsageResponse,
    AccountCreditResponse,
    ReferralCodeCreate
)
from services.referral_service import ReferralService
from services.discount_service import DiscountService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/referrals", tags=["referrals"])


# ============================================================================
# USER REFERRAL ENDPOINTS
# ============================================================================

@router.get("/my-code", response_model=ReferralCodeResponse)
def get_my_referral_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get or create the current user's referral code"""
    referral_service = ReferralService(db)

    try:
        referral_code = referral_service.generate_user_referral_code(str(current_user.id))
        return referral_code
    except Exception as e:
        logger.error(f"Error getting referral code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get referral code"
        )


@router.get("/my-stats", response_model=ReferralStatsResponse)
def get_my_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's referral statistics"""
    referral_service = ReferralService(db)

    try:
        stats = referral_service.get_user_referral_stats(str(current_user.id))

        # Get recent referrals
        recent_usages = db.query(ReferralUsage).join(
            ReferralCode, ReferralUsage.referral_code_id == ReferralCode.id
        ).filter(
            ReferralCode.owner_user_id == current_user.id
        ).order_by(
            ReferralUsage.used_at.desc()
        ).limit(10).all()

        stats['recent_referrals'] = [ReferralUsageResponse.from_orm(u) for u in recent_usages]
        stats['pending_rewards_count'] = 0  # Simplified
        stats['approved_rewards_count'] = stats['successful_referrals']

        return stats
    except Exception as e:
        logger.error(f"Error getting referral stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get referral statistics"
        )


@router.get("/my-credits", response_model=List[AccountCreditResponse])
def get_my_account_credits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get current user's account credit history"""
    try:
        credits = db.query(UserAccountCredit).filter(
            UserAccountCredit.user_id == current_user.id
        ).order_by(
            UserAccountCredit.created_at.desc()
        ).limit(limit).all()

        return [AccountCreditResponse.from_orm(c) for c in credits]
    except Exception as e:
        logger.error(f"Error getting account credits: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get account credits"
        )


# ============================================================================
# DISCOUNT CODE VALIDATION
# ============================================================================

@router.post("/validate-code", response_model=DiscountCodeValidateResponse)
def validate_discount_code(
    request_data: DiscountCodeValidateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate a discount/referral code before checkout"""
    referral_service = ReferralService(db)
    discount_service = DiscountService(db)

    try:
        # Build request metadata for fraud detection
        request_metadata = {
            'ip_address': request.client.host if request.client else None,
            'user_agent': request.headers.get('user-agent'),
        }

        # Validate the code
        is_valid, referral_code, error_message = referral_service.validate_code(
            code=request_data.code,
            user_id=str(current_user.id),
            plan_type=request_data.plan_type,
            request_metadata=request_metadata
        )

        if not is_valid:
            return DiscountCodeValidateResponse(
                valid=False,
                code=request_data.code,
                error_message=error_message
            )

        # Calculate discount
        discount_info = discount_service.calculate_discount(
            referral_code=referral_code,
            plan_type=request_data.plan_type
        )

        return DiscountCodeValidateResponse(
            valid=True,
            code=request_data.code,
            discount_amount_chf=discount_info['discount_amount_chf'],
            original_price_chf=discount_info['original_price_chf'],
            final_price_chf=discount_info['final_price_chf'],
            discount_type=discount_info['discount_type'],
            code_details=ReferralCodeResponse.from_orm(referral_code)
        )

    except Exception as e:
        logger.error(f"Error validating code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate code"
        )


# ============================================================================
# ADMIN ENDPOINTS (Create promotional codes)
# ============================================================================

@router.post("/admin/create-code", response_model=ReferralCodeResponse)
def create_promotional_code(
    code_data: ReferralCodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a promotional discount code (admin only)"""
    # TODO: Add admin role check
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")

    try:
        referral_code = ReferralCode(
            code=code_data.code.upper(),
            code_type=code_data.code_type,
            discount_type=code_data.discount_type,
            discount_value=code_data.discount_value,
            max_discount_amount=code_data.max_discount_amount,
            applicable_plans=code_data.applicable_plans,
            first_time_only=code_data.first_time_only,
            minimum_subscription_months=code_data.minimum_subscription_months,
            max_total_uses=code_data.max_total_uses,
            max_uses_per_user=code_data.max_uses_per_user,
            valid_from=code_data.valid_from,
            valid_until=code_data.valid_until,
            is_active=code_data.is_active,
            is_stackable=code_data.is_stackable,
            campaign_name=code_data.campaign_name,
            description=code_data.description,
            internal_notes=code_data.internal_notes,
            created_by_admin_id=current_user.id
        )

        db.add(referral_code)
        db.commit()
        db.refresh(referral_code)

        logger.info(f"Created promotional code {referral_code.code} by admin {current_user.id}")
        return referral_code

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating promotional code: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create code: {str(e)}"
        )
