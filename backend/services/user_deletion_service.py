"""
User Deletion Service
Handles GDPR-compliant account deletion with verification and grace period
"""
import logging
import secrets
import string
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from models.swisstax import DeletionRequest, Filing, Payment, Subscription, User
from services.audit_log_service import AuditLogService
from services.s3_storage_service import S3StorageService, get_storage_service
from services.stripe_mock_service import StripeMockService, get_stripe_service

logger = logging.getLogger(__name__)


class UserDeletionService:
    """Service for handling user account deletion requests"""

    GRACE_PERIOD_DAYS = 7
    VERIFICATION_CODE_EXPIRY_MINUTES = 15
    VERIFICATION_CODE_LENGTH = 6

    def __init__(
        self,
        db: Session,
        s3_service: Optional[S3StorageService] = None,
        stripe_service: Optional[StripeMockService] = None
    ):
        self.db = db
        self.s3 = s3_service or get_storage_service()
        self.stripe = stripe_service or get_stripe_service()

    def generate_verification_code(self) -> str:
        """Generate a 6-digit verification code"""
        return ''.join(secrets.choice(string.digits) for _ in range(self.VERIFICATION_CODE_LENGTH))

    def generate_secure_token(self) -> str:
        """Generate a secure token for email links"""
        return secrets.token_urlsafe(32)

    def request_deletion(
        self,
        user_id: UUID,
        ip_address: str,
        user_agent: str
    ) -> Tuple[DeletionRequest, str]:
        """
        Initiate account deletion request

        Args:
            user_id: User requesting deletion
            ip_address: Request IP address
            user_agent: Request user agent

        Returns:
            Tuple of (DeletionRequest, verification_code)

        Raises:
            ValueError: If user has active deletion request or blocker exists
        """
        # Check for existing pending/verified requests
        existing = self.db.query(DeletionRequest).filter(
            DeletionRequest.user_id == user_id,
            DeletionRequest.status.in_(['pending', 'verified'])
        ).first()

        if existing:
            raise ValueError("Active deletion request already exists")

        # Check for blockers
        blockers = self.check_deletion_blockers(user_id)
        if blockers:
            raise ValueError(f"Cannot delete account: {', '.join(blockers)}")

        # Generate codes
        verification_code = self.generate_verification_code()
        verification_token = self.generate_secure_token()

        # Create deletion request
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=self.VERIFICATION_CODE_EXPIRY_MINUTES)
        scheduled_deletion_at = now + timedelta(days=self.GRACE_PERIOD_DAYS)

        request = DeletionRequest(
            user_id=user_id,
            verification_code=verification_code,
            verification_token=verification_token,
            requested_at=now,
            expires_at=expires_at,
            scheduled_deletion_at=scheduled_deletion_at,
            status='pending',
            ip_address=ip_address,
            user_agent=user_agent
        )

        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)

        # Log event (both logger and audit log)
        logger.info(
            f"Deletion requested: user_id={user_id}, request_id={request.id}, "
            f"scheduled_for={request.scheduled_deletion_at}, ip={ip_address}"
        )
        AuditLogService.log_event(
            self.db, user_id, "deletion_requested", "account",
            "User initiated account deletion request",
            ip_address, user_agent,
            metadata={'deletion_request_id': str(request.id)}
        )

        return request, verification_code

    def verify_and_schedule_deletion(
        self,
        user_id: UUID,
        code: str,
        ip_address: str,
        user_agent: str
    ) -> DeletionRequest:
        """
        Verify deletion code and schedule deletion

        Args:
            user_id: User ID
            code: 6-digit verification code
            ip_address: Request IP address
            user_agent: Request user agent

        Returns:
            Updated DeletionRequest

        Raises:
            ValueError: If verification fails
        """
        # Find pending request
        request = self.db.query(DeletionRequest).filter(
            DeletionRequest.user_id == user_id,
            DeletionRequest.status == 'pending'
        ).first()

        if not request:
            raise ValueError("No pending deletion request found")

        if request.is_expired:
            raise ValueError("Verification code has expired")

        if request.verification_code != code:
            # Log failed verification attempt
            logger.warning(
                f"Deletion verification failed: user_id={user_id}, request_id={request.id}, ip={ip_address}"
            )
            raise ValueError("Invalid verification code")

        # Update status to verified
        request.status = 'verified'
        request.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(request)

        # Log successful verification
        logger.info(
            f"Deletion verified: user_id={user_id}, request_id={request.id}, "
            f"scheduled_for={request.scheduled_deletion_at}, ip={ip_address}"
        )
        AuditLogService.log_event(
            self.db, user_id, "deletion_verified", "account",
            f"Deletion verified, scheduled for {request.scheduled_deletion_at}",
            ip_address, user_agent,
            metadata={'deletion_request_id': str(request.id)}
        )

        return request

    def cancel_deletion(
        self,
        user_id: UUID,
        token: str,
        ip_address: str,
        user_agent: str
    ) -> bool:
        """
        Cancel pending deletion request

        Args:
            user_id: User ID
            token: Cancellation token
            ip_address: Request IP address
            user_agent: Request user agent

        Returns:
            True if cancelled successfully

        Raises:
            ValueError: If cancellation fails
        """
        # Find request by token
        request = self.db.query(DeletionRequest).filter(
            DeletionRequest.user_id == user_id,
            DeletionRequest.verification_token == token,
            DeletionRequest.status.in_(['pending', 'verified'])
        ).first()

        if not request:
            raise ValueError("Deletion request not found or cannot be cancelled")

        if not request.can_cancel:
            raise ValueError("Deletion request can no longer be cancelled")

        # Update status
        request.status = 'cancelled'
        request.updated_at = datetime.utcnow()

        self.db.commit()

        # Log cancellation
        logger.info(
            f"Deletion cancelled: user_id={user_id}, request_id={request.id}, ip={ip_address}"
        )
        AuditLogService.log_event(
            self.db, user_id, "deletion_cancelled", "account",
            "User cancelled account deletion request",
            ip_address, user_agent,
            metadata={'deletion_request_id': str(request.id)}
        )

        return True

    def check_deletion_blockers(self, user_id: UUID) -> List[str]:
        """
        Check if there are any reasons preventing deletion

        Args:
            user_id: User ID

        Returns:
            List of blocker reasons (empty if no blockers)
        """
        blockers = []

        # Check for active filings in submitted status
        active_filings = self.db.query(Filing).filter(
            Filing.user_id == user_id,
            Filing.status.in_(['submitted', 'confirmed'])
        ).count()

        if active_filings > 0:
            blockers.append(f"{active_filings} active tax filing(s) in submitted status")

        # Check for pending payments
        pending_payments = self.db.query(Payment).filter(
            Payment.user_id == user_id,
            Payment.status.in_(['pending', 'processing'])
        ).count()

        if pending_payments > 0:
            blockers.append(f"{pending_payments} pending payment(s)")

        return blockers

    def get_deletion_status(self, user_id: UUID) -> Optional[DeletionRequest]:
        """
        Get current deletion request status

        Args:
            user_id: User ID

        Returns:
            DeletionRequest if exists, None otherwise
        """
        return self.db.query(DeletionRequest).filter(
            DeletionRequest.user_id == user_id,
            DeletionRequest.status.in_(['pending', 'verified'])
        ).first()

    def execute_deletion(
        self,
        deletion_request_id: UUID
    ) -> Dict[str, any]:
        """
        Execute the actual account deletion (called by background job)

        Args:
            deletion_request_id: DeletionRequest ID

        Returns:
            Dict with deletion results

        Raises:
            ValueError: If deletion cannot be executed
        """
        request = self.db.query(DeletionRequest).filter(
            DeletionRequest.id == deletion_request_id
        ).first()

        if not request:
            raise ValueError("Deletion request not found")

        if not request.is_ready_for_deletion:
            raise ValueError("Deletion request is not ready for execution")

        user_id = request.user_id
        user = self.db.query(User).filter(User.id == user_id).first()

        if not user:
            # User already deleted
            request.status = 'completed'
            self.db.commit()
            return {'status': 'already_deleted', 'user_id': str(user_id)}

        results = {
            'user_id': str(user_id),
            'user_email': user.email,
            'deletion_request_id': str(request.id),
            'started_at': datetime.utcnow().isoformat()
        }

        try:
            # Step 1: Cancel active subscriptions (will be handled externally via Stripe)
            active_subs = self.db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == 'active'
            ).all()
            results['subscriptions_to_cancel'] = len(active_subs)

            # Step 2: Mark user for deletion (actual cascade happens via DB constraints)
            # The CASCADE delete constraints will automatically delete:
            # - user_settings
            # - subscriptions
            # - payments
            # - filings
            # - interview_sessions
            # - interview_answers
            # - documents
            # - required_documents

            # Step 3: Delete user (triggers cascades)
            self.db.delete(user)

            # Step 4: Mark request as completed
            request.status = 'completed'
            request.updated_at = datetime.utcnow()

            # Step 5: Log deletion
            logger.info(
                f"Account deleted: user_id={user_id}, email={user.email}, "
                f"request_id={request.id}"
            )

            self.db.commit()

            results['status'] = 'success'
            results['completed_at'] = datetime.utcnow().isoformat()

        except Exception as e:
            self.db.rollback()
            request.status = 'failed'
            self.db.commit()

            results['status'] = 'failed'
            results['error'] = str(e)
            raise

        return results

    def get_deletion_requests_ready_for_execution(self) -> List[DeletionRequest]:
        """
        Get all deletion requests that are ready to be executed
        Used by background job

        Returns:
            List of DeletionRequest objects ready for deletion
        """
        now = datetime.utcnow()
        return self.db.query(DeletionRequest).filter(
            DeletionRequest.status == 'verified',
            DeletionRequest.scheduled_deletion_at <= now
        ).all()
