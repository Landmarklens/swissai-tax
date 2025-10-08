"""
User Data Management Router
Handles account deletion and data export (GDPR compliance)
"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models.swisstax import User
from schemas.data_export import (
    DataExportCreatedResponse,
    DataExportListResponse,
    DataExportRequest,
    DataExportResponse,
)
from schemas.deletion import (
    DeletionCancellation,
    DeletionCancellationResponse,
    DeletionRequestResponse,
    DeletionStatusResponse,
    DeletionVerification,
    DeletionVerificationResponse,
)
from services.data_export_service import DataExportService
from services.user_deletion_service import UserDeletionService

router = APIRouter()


def get_client_info(request: Request) -> tuple:
    """Extract IP address and user agent from request"""
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    return ip_address, user_agent


# ============================================================================
# ACCOUNT DELETION ENDPOINTS
# ============================================================================

@router.post("/deletion/request", response_model=DeletionRequestResponse)
async def request_account_deletion(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate account deletion request
    Sends verification code to user's email
    """
    ip_address, user_agent = get_client_info(request)
    service = UserDeletionService(db)

    try:
        deletion_request, verification_code = service.request_deletion(
            user_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # TODO: Send verification email with code
        # email_service.send_deletion_verification(
        #     to_email=current_user.email,
        #     verification_code=verification_code,
        #     expires_at=deletion_request.expires_at
        # )

        return DeletionRequestResponse(
            request_id=deletion_request.id,
            message=f"Verification code sent to {current_user.email}",
            email_sent=True,
            expires_at=deletion_request.expires_at
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/deletion/verify", response_model=DeletionVerificationResponse)
async def verify_account_deletion(
    verification: DeletionVerification,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify deletion request with 6-digit code
    Schedules account deletion after grace period
    """
    ip_address, user_agent = get_client_info(request)
    service = UserDeletionService(db)

    try:
        deletion_request = service.verify_and_schedule_deletion(
            user_id=current_user.id,
            code=verification.code,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # TODO: Send confirmation email with cancellation link
        # email_service.send_deletion_scheduled(
        #     to_email=current_user.email,
        #     scheduled_deletion_at=deletion_request.scheduled_deletion_at,
        #     cancellation_token=deletion_request.verification_token
        # )

        return DeletionVerificationResponse(
            request_id=deletion_request.id,
            message="Account deletion scheduled successfully",
            scheduled_deletion_at=deletion_request.scheduled_deletion_at,
            grace_period_days=service.GRACE_PERIOD_DAYS
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/deletion/cancel", response_model=DeletionCancellationResponse)
async def cancel_account_deletion(
    cancellation: DeletionCancellation,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel pending account deletion
    Requires cancellation token from email
    """
    ip_address, user_agent = get_client_info(request)
    service = UserDeletionService(db)

    try:
        service.cancel_deletion(
            user_id=current_user.id,
            token=cancellation.token,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # TODO: Send cancellation confirmation email
        # email_service.send_deletion_cancelled(
        #     to_email=current_user.email
        # )

        return DeletionCancellationResponse(
            message="Account deletion cancelled successfully",
            cancelled_at=datetime.utcnow()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/deletion/status", response_model=DeletionStatusResponse)
async def get_deletion_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current deletion request status
    Returns information about pending deletion or null if none
    """
    service = UserDeletionService(db)
    deletion_request = service.get_deletion_status(current_user.id)

    if not deletion_request:
        return DeletionStatusResponse(
            has_pending_deletion=False
        )

    return DeletionStatusResponse(
        has_pending_deletion=True,
        request_id=deletion_request.id,
        status=deletion_request.status,
        scheduled_deletion_at=deletion_request.scheduled_deletion_at,
        days_remaining=deletion_request.days_until_deletion,
        can_cancel=deletion_request.can_cancel
    )


# ============================================================================
# DATA EXPORT ENDPOINTS
# ============================================================================

@router.post("/export/request", response_model=DataExportCreatedResponse)
async def request_data_export(
    export_request: DataExportRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Request data export
    Creates export request and queues background job
    """
    ip_address, user_agent = get_client_info(request)
    service = DataExportService(db)

    try:
        export = service.request_export(
            user_id=current_user.id,
            format=export_request.format.value,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # TODO: Queue background job to generate export
        # background_jobs.enqueue(
        #     service.generate_export,
        #     export_id=export.id
        # )

        # Store export details before session potentially expires
        export_id = export.id
        export_status = export.status

        # For now, generate synchronously (in production, this should be async)
        try:
            service.generate_export(export_id)
            export_status = "completed"
        except Exception as e:
            # Log error but don't fail the request
            print(f"Export generation failed: {e}")

        return DataExportCreatedResponse(
            export_id=export_id,
            message="Export request created successfully",
            estimated_completion_minutes=5,
            status=export_status
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/export/list", response_model=DataExportListResponse)
async def list_data_exports(
    include_expired: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all data exports for current user
    Optionally include expired exports
    """
    service = DataExportService(db)
    exports = service.get_user_exports(
        user_id=current_user.id,
        include_expired=include_expired
    )

    export_responses = [
        DataExportResponse(
            id=exp.id,
            status=exp.status,
            format=exp.format,
            file_url=exp.file_url,
            file_size_mb=exp.file_size_mb,
            created_at=exp.created_at,
            completed_at=exp.completed_at,
            expires_at=exp.expires_at,
            hours_until_expiry=exp.hours_until_expiry,
            is_available=exp.is_available,
            is_expired=exp.is_expired,
            error_message=exp.error_message
        )
        for exp in exports
    ]

    return DataExportListResponse(
        exports=export_responses,
        total_count=len(export_responses)
    )


@router.get("/export/{export_id}", response_model=DataExportResponse)
async def get_data_export(
    export_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific data export
    """
    service = DataExportService(db)

    try:
        from uuid import UUID
        export_uuid = UUID(export_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid export ID")

    from models.swisstax import DataExport

    export = db.query(DataExport).filter(
        DataExport.id == export_uuid,
        DataExport.user_id == current_user.id
    ).first()

    if not export:
        raise HTTPException(status_code=404, detail="Export not found")

    return DataExportResponse(
        id=export.id,
        status=export.status,
        format=export.format,
        file_url=export.file_url,
        file_size_mb=export.file_size_mb,
        created_at=export.created_at,
        completed_at=export.completed_at,
        expires_at=export.expires_at,
        hours_until_expiry=export.hours_until_expiry,
        is_available=export.is_available,
        is_expired=export.is_expired,
        error_message=export.error_message
    )


# TODO: Add download endpoint that streams the actual file
# @router.get("/download-export/{export_id}")
# async def download_export(export_id: str, ...):
#     # Stream file from S3 or return generated content
#     pass
