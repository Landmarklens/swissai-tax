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
    from routers import auth, user, interview, tax_calculation, documents

    # Authentication routers
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(user.router, prefix="/api/users", tags=["Users"])

    # Tax-specific routers
    app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
    app.include_router(tax_calculation.router, prefix="/api/tax-calculations", tags=["Tax Calculations"])
    app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])

    logger.info("All routers loaded successfully")
except ImportError as e:
    logger.warning(f"Could not import routers: {e}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting SwissAI Tax API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
