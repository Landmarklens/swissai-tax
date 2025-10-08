"""
Stripe Mock Service for Subscription Management
Provides mock Stripe functionality until real Stripe integration is implemented
"""
import logging
from typing import Optional, Dict, List
from uuid import UUID
from datetime import datetime

logger = logging.getLogger(__name__)


class StripeMockService:
    """
    Mock Stripe service for subscription cancellation
    Returns simulated success responses without making actual Stripe API calls
    """

    def __init__(self):
        """Initialize Stripe mock service"""
        logger.info("Initialized Stripe mock service (no real Stripe integration)")

    def cancel_subscription(self, subscription_id: str, reason: str = None) -> Dict:
        """
        Mock subscription cancellation

        Args:
            subscription_id: Stripe subscription ID
            reason: Cancellation reason

        Returns:
            Dictionary with cancellation details
        """
        try:
            logger.info(
                f"MOCK: Cancelling subscription {subscription_id}"
                + (f" - Reason: {reason}" if reason else "")
            )

            # Simulate successful cancellation
            mock_response = {
                'id': subscription_id,
                'status': 'canceled',
                'canceled_at': int(datetime.utcnow().timestamp()),
                'cancellation_reason': reason or 'user_requested',
                'mock': True,  # Indicator that this is a mock response
                'message': 'Subscription cancellation simulated (mock service)'
            }

            logger.info(f"MOCK: Successfully cancelled subscription {subscription_id}")
            return mock_response

        except Exception as e:
            logger.error(f"Error in mock subscription cancellation: {e}")
            return {
                'error': str(e),
                'mock': True,
                'status': 'error'
            }

    def cancel_user_subscriptions(self, user_id: UUID, reason: str = None) -> Dict[str, int]:
        """
        Mock cancellation of all subscriptions for a user

        Args:
            user_id: User ID
            reason: Cancellation reason

        Returns:
            Dictionary with cancellation statistics {'cancelled': int, 'failed': int}
        """
        try:
            logger.info(f"MOCK: Cancelling all subscriptions for user {user_id}")

            # In a real implementation, this would:
            # 1. Query database for all active subscriptions for this user
            # 2. Call Stripe API to cancel each subscription
            # 3. Update database with cancellation status

            # For now, simulate success
            mock_stats = {
                'cancelled': 0,  # Would be actual count from database
                'failed': 0,
                'mock': True,
                'message': 'All subscriptions cancellation simulated (mock service)'
            }

            logger.info(f"MOCK: Successfully cancelled subscriptions for user {user_id}")
            return mock_stats

        except Exception as e:
            logger.error(f"Error in mock user subscriptions cancellation: {e}")
            return {
                'cancelled': 0,
                'failed': 0,
                'error': str(e),
                'mock': True
            }

    def get_subscription_status(self, subscription_id: str) -> Optional[Dict]:
        """
        Mock get subscription status

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Dictionary with subscription details or None
        """
        try:
            logger.info(f"MOCK: Getting subscription status for {subscription_id}")

            # Simulate active subscription
            mock_response = {
                'id': subscription_id,
                'status': 'active',
                'current_period_end': int(datetime.utcnow().timestamp()) + (30 * 24 * 3600),  # 30 days
                'mock': True,
                'message': 'Subscription status simulated (mock service)'
            }

            return mock_response

        except Exception as e:
            logger.error(f"Error getting mock subscription status: {e}")
            return None

    def refund_last_payment(self, subscription_id: str, reason: str = None) -> Dict:
        """
        Mock refund for last payment (optional - for account deletion)

        Args:
            subscription_id: Stripe subscription ID
            reason: Refund reason

        Returns:
            Dictionary with refund details
        """
        try:
            logger.info(
                f"MOCK: Refunding last payment for subscription {subscription_id}"
                + (f" - Reason: {reason}" if reason else "")
            )

            # Simulate successful refund
            mock_response = {
                'id': f"re_mock_{subscription_id}",
                'status': 'succeeded',
                'amount': 0,  # Would be actual amount from Stripe
                'created': int(datetime.utcnow().timestamp()),
                'reason': reason or 'requested_by_customer',
                'mock': True,
                'message': 'Payment refund simulated (mock service)'
            }

            logger.info(f"MOCK: Successfully refunded payment for subscription {subscription_id}")
            return mock_response

        except Exception as e:
            logger.error(f"Error in mock payment refund: {e}")
            return {
                'error': str(e),
                'mock': True,
                'status': 'failed'
            }

    def list_user_subscriptions(self, stripe_customer_id: str) -> List[Dict]:
        """
        Mock list all subscriptions for a Stripe customer

        Args:
            stripe_customer_id: Stripe customer ID

        Returns:
            List of subscription dictionaries
        """
        try:
            logger.info(f"MOCK: Listing subscriptions for customer {stripe_customer_id}")

            # Simulate empty list (no active subscriptions)
            mock_response = []

            logger.info(f"MOCK: Found {len(mock_response)} subscriptions")
            return mock_response

        except Exception as e:
            logger.error(f"Error listing mock subscriptions: {e}")
            return []


# Singleton instance
_stripe_mock_service = None


def get_stripe_service() -> StripeMockService:
    """Get or create Stripe mock service instance"""
    global _stripe_mock_service
    if _stripe_mock_service is None:
        _stripe_mock_service = StripeMockService()
    return _stripe_mock_service
