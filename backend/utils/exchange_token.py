"""
Exchange Token Service
Manages one-time use tokens for secure cookie setting after OAuth redirects
"""
import secrets
import time
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class ExchangeTokenStore:
    """
    In-memory store for exchange tokens.

    Exchange tokens are short-lived (60 seconds), one-time use tokens
    that allow the frontend to exchange for a session cookie after OAuth redirect.

    This prevents cookie setting issues on redirect responses.
    """

    def __init__(self):
        self._tokens: Dict[str, dict] = {}
        self._cleanup_interval = 120  # Clean up every 2 minutes
        self._last_cleanup = time.time()

    def create_token(self, access_token: str, session_id: str, ttl: int = 60) -> str:
        """
        Create a new exchange token.

        Args:
            access_token: JWT access token to exchange
            session_id: Session ID associated with this token
            ttl: Time to live in seconds (default: 60)

        Returns:
            Exchange token string
        """
        # Generate secure random token
        exchange_token = secrets.token_urlsafe(32)

        # Store with expiration
        self._tokens[exchange_token] = {
            "access_token": access_token,
            "session_id": session_id,
            "expires_at": time.time() + ttl,
            "used": False
        }

        # Periodic cleanup
        self._cleanup_expired()

        logger.info(f"Created exchange token for session {session_id}, expires in {ttl}s")
        return exchange_token

    def consume_token(self, exchange_token: str) -> Optional[Dict[str, str]]:
        """
        Consume an exchange token (one-time use).

        Args:
            exchange_token: The exchange token to consume

        Returns:
            Dict with access_token and session_id, or None if invalid/expired/used
        """
        token_data = self._tokens.get(exchange_token)

        if not token_data:
            logger.warning(f"Exchange token not found: {exchange_token[:10]}...")
            return None

        # Check if already used
        if token_data["used"]:
            logger.warning(f"Exchange token already used: {exchange_token[:10]}...")
            return None

        # Check if expired
        if time.time() > token_data["expires_at"]:
            logger.warning(f"Exchange token expired: {exchange_token[:10]}...")
            del self._tokens[exchange_token]
            return None

        # Mark as used and return data
        token_data["used"] = True

        result = {
            "access_token": token_data["access_token"],
            "session_id": token_data["session_id"]
        }

        # Delete token after use (one-time use)
        del self._tokens[exchange_token]

        logger.info(f"Exchange token consumed successfully for session {result['session_id']}")
        return result

    def _cleanup_expired(self):
        """Remove expired tokens from storage"""
        now = time.time()

        # Only run cleanup periodically
        if now - self._last_cleanup < self._cleanup_interval:
            return

        self._last_cleanup = now

        # Find expired tokens
        expired_tokens = [
            token for token, data in self._tokens.items()
            if now > data["expires_at"] or data["used"]
        ]

        # Remove expired tokens
        for token in expired_tokens:
            del self._tokens[token]

        if expired_tokens:
            logger.info(f"Cleaned up {len(expired_tokens)} expired exchange tokens")

    def get_active_count(self) -> int:
        """Get count of active (non-expired, non-used) tokens"""
        now = time.time()
        return sum(
            1 for data in self._tokens.values()
            if not data["used"] and now <= data["expires_at"]
        )


# Global singleton instance
exchange_token_store = ExchangeTokenStore()
