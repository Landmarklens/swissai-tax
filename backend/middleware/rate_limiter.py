"""Rate limiting middleware for AI endpoints"""

from typing import Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

class RateLimiter:
    """Simple in-memory rate limiter for AI endpoints"""

    def __init__(
        self,
        requests_per_minute: int = 10,
        requests_per_hour: int = 100,
        ai_extraction_limit: int = 5  # Expensive AI operations
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.ai_extraction_limit = ai_extraction_limit

        # Store request counts by user ID
        self.minute_counts: Dict[str, list] = defaultdict(list)
        self.hour_counts: Dict[str, list] = defaultdict(list)
        self.ai_counts: Dict[str, list] = defaultdict(list)

        # Cleanup old entries periodically
        self._cleanup_task = None

    async def check_rate_limit(
        self,
        user_id: str,
        endpoint: str
    ) -> bool:
        """Check if request is within rate limits"""

        now = datetime.utcnow()

        # Clean old entries
        self._cleanup_old_entries(user_id, now)

        # Check minute limit
        minute_ago = now - timedelta(minutes=1)
        self.minute_counts[user_id] = [
            ts for ts in self.minute_counts[user_id]
            if ts > minute_ago
        ]

        if len(self.minute_counts[user_id]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait before making more requests."
            )

        # Check hour limit
        hour_ago = now - timedelta(hours=1)
        self.hour_counts[user_id] = [
            ts for ts in self.hour_counts[user_id]
            if ts > hour_ago
        ]

        if len(self.hour_counts[user_id]) >= self.requests_per_hour:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Hourly rate limit exceeded. Please try again later."
            )

        # Check AI extraction limit for expensive operations
        if "extract" in endpoint or "generate-pdf" in endpoint:
            self.ai_counts[user_id] = [
                ts for ts in self.ai_counts[user_id]
                if ts > hour_ago
            ]

            if len(self.ai_counts[user_id]) >= self.ai_extraction_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="AI processing limit reached. Please wait an hour before processing more documents."
                )

            self.ai_counts[user_id].append(now)

        # Record this request
        self.minute_counts[user_id].append(now)
        self.hour_counts[user_id].append(now)

        return True

    def _cleanup_old_entries(self, user_id: str, now: datetime):
        """Remove old entries to prevent memory bloat"""

        minute_ago = now - timedelta(minutes=1)
        hour_ago = now - timedelta(hours=1)

        # Clean minute counts
        self.minute_counts[user_id] = [
            ts for ts in self.minute_counts[user_id]
            if ts > minute_ago
        ]

        # Clean hour counts
        self.hour_counts[user_id] = [
            ts for ts in self.hour_counts[user_id]
            if ts > hour_ago
        ]

        # Clean AI counts
        self.ai_counts[user_id] = [
            ts for ts in self.ai_counts[user_id]
            if ts > hour_ago
        ]

    async def cleanup_loop(self):
        """Periodic cleanup of old entries"""
        while True:
            await asyncio.sleep(300)  # Run every 5 minutes

            now = datetime.utcnow()
            hour_ago = now - timedelta(hours=1)

            # Remove users with no recent activity
            for counts_dict in [self.minute_counts, self.hour_counts, self.ai_counts]:
                users_to_remove = []
                for user_id, timestamps in counts_dict.items():
                    if not timestamps or all(ts < hour_ago for ts in timestamps):
                        users_to_remove.append(user_id)

                for user_id in users_to_remove:
                    del counts_dict[user_id]


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """Middleware to apply rate limiting to AI endpoints"""

    # Only apply to AI endpoints
    if "/api/v1/ai/" not in str(request.url):
        return await call_next(request)

    # Extract user ID from request (assumes authentication middleware runs first)
    user = getattr(request.state, "user", None)
    if not user:
        return await call_next(request)

    user_id = str(user.id)
    endpoint = str(request.url.path)

    try:
        # Check rate limit
        await rate_limiter.check_rate_limit(user_id, endpoint)
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail}
        )

    # Process request
    response = await call_next(request)

    # Add rate limit headers
    response.headers["X-RateLimit-Limit-Minute"] = str(rate_limiter.requests_per_minute)
    response.headers["X-RateLimit-Limit-Hour"] = str(rate_limiter.requests_per_hour)

    return response