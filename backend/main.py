#!/usr/bin/env python3
"""
Main entry point for SwissAI Tax backend
Imports the FastAPI app from app.py and adds auth routers
"""

import logging
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app import app
from middleware.rate_limiter import rate_limit_middleware

logger = logging.getLogger(__name__)

# Add request size limit middleware
class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to limit request body size"""

    def __init__(self, app, max_size: int = 50 * 1024 * 1024):  # 50MB default
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        # Check content length header
        content_length = request.headers.get('content-length')
        if content_length:
            content_length = int(content_length)
            if content_length > self.max_size:
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"Request body too large. Maximum size is {self.max_size / 1024 / 1024:.1f}MB"}
                )

        # For multipart uploads, check each file
        if request.headers.get('content-type', '').startswith('multipart/form-data'):
            # Limit individual file sizes in multipart uploads
            # This is handled by the file validation service
            pass

        return await call_next(request)

# Add middleware to app
app.add_middleware(RequestSizeLimitMiddleware, max_size=50 * 1024 * 1024)  # 50MB max request size
app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)  # Rate limiting

# Import and include all routers
# NOTE: app.py already includes: auth, user, user_counter, dashboard, profile, settings, filing, payment
# We only add the NEW routers here to avoid duplicates
try:
    from routers import (debug_device, documents, faq, health, insights, interview, multi_canton_filing,
                         pdf_generation, sessions, status, tax_calculation, tax_filing, two_factor)

    # Tax-specific routers (not in app.py)
    app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
    app.include_router(tax_calculation.router, prefix="/api/tax-calculations", tags=["Tax Calculations"])
    app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
    app.include_router(tax_filing.router, prefix="/api/tax-filing", tags=["Tax Filing"])
    app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])

    # FAQ router (public - no authentication required)
    app.include_router(faq.router, prefix="/api/faq", tags=["FAQ"])

    # Multi-canton and PDF generation routers (NEW - not in app.py)
    app.include_router(multi_canton_filing.router, tags=["Multi-Canton Filing"])
    app.include_router(pdf_generation.router, tags=["PDF Generation"])

    # Two-factor authentication router
    app.include_router(two_factor.router, tags=["Two-Factor Authentication"])

    # Session management router
    app.include_router(sessions.router, prefix="/api", tags=["Sessions"])

    # Health check and status routers (no prefix - public endpoints)
    app.include_router(health.router, tags=["Health"])
    app.include_router(status.router, tags=["Status"])

    # Debug router (for testing - can be removed in production)
    app.include_router(debug_device.router, prefix="/api", tags=["Debug"])

    logger.info("All routers loaded successfully")
except ImportError as e:
    logger.warning(f"Could not import routers: {e}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting SwissAI Tax API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
