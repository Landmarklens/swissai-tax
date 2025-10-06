#!/usr/bin/env python3
"""
Main entry point for SwissAI Tax backend
Imports the FastAPI app from app.py and adds auth routers
"""

from app import app
import logging

logger = logging.getLogger(__name__)

# Import and include all routers
try:
    from routers import auth, user, interview, tax_calculation, documents, tax_filing, insights, multi_canton_filing, pdf_generation

    # Authentication routers
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(user.router, prefix="/api/users", tags=["Users"])

    # Tax-specific routers
    app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
    app.include_router(tax_calculation.router, prefix="/api/tax-calculations", tags=["Tax Calculations"])
    app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
    app.include_router(tax_filing.router, prefix="/api/tax-filing", tags=["Tax Filing"])
    app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])

    # Multi-canton and PDF generation routers
    app.include_router(multi_canton_filing.router, tags=["Multi-Canton Filing"])
    app.include_router(pdf_generation.router, tags=["PDF Generation"])

    logger.info("All routers loaded successfully")
except ImportError as e:
    logger.warning(f"Could not import routers: {e}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting SwissAI Tax API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
