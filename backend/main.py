#!/usr/bin/env python3
"""
Main entry point for SwissAI Tax backend
Imports the FastAPI app from app.py and adds auth routers
"""

import logging

from app import app

logger = logging.getLogger(__name__)

# Import and include all routers
# NOTE: app.py already includes: auth, user, user_counter, dashboard, profile, settings, filing, payment
# We only add the NEW routers here to avoid duplicates
try:
    from routers import (documents, insights, interview, multi_canton_filing,
                         pdf_generation, sessions, tax_calculation, tax_filing, two_factor)

    # Tax-specific routers (not in app.py)
    app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
    app.include_router(tax_calculation.router, prefix="/api/tax-calculations", tags=["Tax Calculations"])
    app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
    app.include_router(tax_filing.router, prefix="/api/tax-filing", tags=["Tax Filing"])
    app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])

    # Multi-canton and PDF generation routers (NEW - not in app.py)
    app.include_router(multi_canton_filing.router, tags=["Multi-Canton Filing"])
    app.include_router(pdf_generation.router, tags=["PDF Generation"])

    # Two-factor authentication router
    app.include_router(two_factor.router, tags=["Two-Factor Authentication"])

    # Session management router
    app.include_router(sessions.router, prefix="/api", tags=["Sessions"])

    logger.info("All routers loaded successfully")
except ImportError as e:
    logger.warning(f"Could not import routers: {e}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting SwissAI Tax API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
