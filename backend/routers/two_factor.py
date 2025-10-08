"""
Two-Factor Authentication Router
Handles 2FA setup, verification, and management endpoints
"""
import logging
from typing import Optional

from fastapi import Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models.swisstax import User
from schemas.two_factor import (
    TwoFactorDisableRequest,
    TwoFactorMessageResponse,
    TwoFactorRegenerateCodesRequest,
    TwoFactorRegenerateCodesResponse,
    TwoFactorSetupInitResponse,
    TwoFactorSetupVerifyRequest,
    TwoFactorStatusResponse,
    TwoFactorVerifyRequest,
)
from services.two_factor_service import two_factor_service
from services.user_service import get_user_by_email
from utils.fastapi_rate_limiter import rate_limit
from utils.password import verify_password
from utils.router import Router

logger = logging.getLogger(__name__)
router = Router()


@router.post("/api/2fa/setup/init", response_model=TwoFactorSetupInitResponse)
@rate_limit("10/hour")
async def initialize_two_factor_setup(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initialize 2FA setup - generates secret, QR code, and backup codes.
    This does NOT enable 2FA yet - user must verify with a code first.

    Requires: Authenticated user
    Returns: Secret (for manual entry), QR code, and backup codes
    """
    try:
        # Check if 2FA is already enabled
        if current_user.two_factor_enabled:
            raise HTTPException(
                status_code=400,
                detail="Two-factor authentication is already enabled. Disable it first to set up again."
            )

        # Generate new secret and codes
        secret = two_factor_service.generate_secret()
        qr_code = two_factor_service.generate_qr_code(secret, current_user.email)
        backup_codes = two_factor_service.generate_backup_codes()

        # Store temporarily in session or return to user
        # Note: These are NOT saved to database yet - only after verification

        logger.info(f"2FA setup initialized for user {current_user.email}")

        return TwoFactorSetupInitResponse(
            secret=secret,
            qr_code=qr_code,
            backup_codes=backup_codes
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA setup initialization failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize 2FA setup")


@router.post("/api/2fa/setup/verify", response_model=TwoFactorMessageResponse)
@rate_limit("10/hour")
async def verify_and_enable_two_factor(
    request: Request,
    verify_request: TwoFactorSetupVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify the TOTP code and enable 2FA.
    User must provide the secret and backup_codes from the init step.

    Requires: Authenticated user, TOTP code, secret, backup codes
    Returns: Success message
    """
    try:
        # Check if 2FA is already enabled
        if current_user.two_factor_enabled:
            raise HTTPException(
                status_code=400,
                detail="Two-factor authentication is already enabled"
            )

        # Verify the TOTP code
        if not two_factor_service.verify_totp(verify_request.secret, verify_request.code):
            raise HTTPException(
                status_code=400,
                detail="Invalid verification code. Please try again."
            )

        # Enable 2FA
        success = two_factor_service.enable_two_factor(
            user=current_user,
            secret=verify_request.secret,
            backup_codes=verify_request.backup_codes,
            db=db
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to enable two-factor authentication"
            )

        logger.info(f"2FA successfully enabled for user {current_user.email}")

        return TwoFactorMessageResponse(
            message="Two-factor authentication has been enabled successfully",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA verification failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify and enable 2FA")


@router.post("/api/2fa/verify", response_model=dict)
@rate_limit("5/15 minutes")  # Strict rate limit for security
async def verify_two_factor_login(
    request: Request,
    verify_request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify 2FA code during login.
    This endpoint exchanges a temporary token + 2FA code for a full session token.

    Note: This endpoint is deprecated. Use POST /api/auth/login/verify-2fa instead.
    This is kept for backward compatibility.

    Requires: Temporary auth token, TOTP code or backup code
    Returns: Full authentication token
    """
    logger.warning("Deprecated endpoint /api/2fa/verify called. Use /api/auth/login/verify-2fa instead.")

    raise HTTPException(
        status_code=410,  # Gone
        detail="This endpoint is deprecated. Please use POST /api/auth/login/verify-2fa instead."
    )


@router.post("/api/2fa/disable", response_model=TwoFactorMessageResponse)
@rate_limit("5/hour")
async def disable_two_factor(
    request: Request,
    disable_request: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disable two-factor authentication.
    Requires password confirmation for security.

    Requires: Authenticated user, password confirmation
    Returns: Success message
    """
    try:
        # Check if 2FA is enabled
        if not current_user.two_factor_enabled:
            raise HTTPException(
                status_code=400,
                detail="Two-factor authentication is not enabled"
            )

        # Verify password
        if not verify_password(disable_request.password, current_user.password):
            raise HTTPException(
                status_code=401,
                detail="Invalid password"
            )

        # Disable 2FA
        success = two_factor_service.disable_two_factor(current_user, db)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to disable two-factor authentication"
            )

        logger.info(f"2FA disabled for user {current_user.email}")

        # TODO: Send email notification about 2FA being disabled

        return TwoFactorMessageResponse(
            message="Two-factor authentication has been disabled",
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to disable 2FA: {e}")
        raise HTTPException(status_code=500, detail="Failed to disable 2FA")


@router.post("/api/2fa/backup-codes/regenerate", response_model=TwoFactorRegenerateCodesResponse)
@rate_limit("3/hour")
async def regenerate_backup_codes(
    request: Request,
    regenerate_request: TwoFactorRegenerateCodesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerate backup recovery codes.
    Invalidates all existing backup codes and creates new ones.
    Requires password confirmation for security.

    Requires: Authenticated user, password confirmation
    Returns: New backup codes
    """
    try:
        # Check if 2FA is enabled
        if not current_user.two_factor_enabled:
            raise HTTPException(
                status_code=400,
                detail="Two-factor authentication is not enabled"
            )

        # Verify password
        if not verify_password(regenerate_request.password, current_user.password):
            raise HTTPException(
                status_code=401,
                detail="Invalid password"
            )

        # Regenerate codes
        new_codes = two_factor_service.regenerate_backup_codes(current_user, db)

        if not new_codes:
            raise HTTPException(
                status_code=500,
                detail="Failed to regenerate backup codes"
            )

        logger.info(f"Backup codes regenerated for user {current_user.email}")

        return TwoFactorRegenerateCodesResponse(backup_codes=new_codes)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to regenerate backup codes: {e}")
        raise HTTPException(status_code=500, detail="Failed to regenerate backup codes")


@router.get("/api/2fa/status", response_model=TwoFactorStatusResponse)
async def get_two_factor_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current 2FA status for the authenticated user.

    Requires: Authenticated user
    Returns: 2FA status, verification date, backup codes count
    """
    try:
        backup_codes_remaining = 0
        if current_user.two_factor_enabled:
            backup_codes_remaining = two_factor_service.get_remaining_backup_codes_count(current_user)

        return TwoFactorStatusResponse(
            enabled=current_user.two_factor_enabled,
            verified_at=current_user.two_factor_verified_at,
            backup_codes_remaining=backup_codes_remaining
        )

    except Exception as e:
        logger.error(f"Failed to get 2FA status: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve 2FA status")
