"""
FastAPI application for SwissAI Tax Backend
Designed for AWS App Runner deployment
"""

import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, Optional

import uvicorn
from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

# Import routers
from routers import auth, user, user_counter
from routers.swisstax import dashboard, filing, payment, profile, settings
from services.document_service import DocumentService
from services.interview_service import interview_service
from services.tax_calculation_service import TaxCalculationService
from utils.validators import validate_session_id, validate_tax_year

# Try to import connection pool for App Runner, fallback to regular connection
try:
    from database.connection_pool import check_db_health, close_connection_pool
    using_pool = True
except ImportError:
    from database.connection import check_db_health
    close_connection_pool = lambda: None
    using_pool = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Services are initialized in their modules
# interview_service is imported from services.interview_service
document_service = DocumentService()
tax_service = TaxCalculationService()

# Lifecycle manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting SwissAI Tax API...")

    # Check database connection
    if not check_db_health():
        logger.error("Database connection failed!")
    else:
        logger.info("Database connection successful")

    yield

    # Shutdown
    logger.info("Shutting down SwissAI Tax API...")

# Create FastAPI app
app = FastAPI(
    title="SwissAI Tax API",
    description="Swiss Tax Filing Backend API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Configure CORS
# Allow localhost origins in all environments for development/testing
allowed_origins = [
    "https://swissai.tax",
    "https://www.swissai.tax",
    "http://localhost:3000",  # For local development
    "http://localhost:3001",  # For local development (alternate port)
]

# Add development origins if not in production
import os

if os.getenv("ENVIRONMENT", "development") == "development":
    allowed_origins.extend([
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log validation errors and return detailed error response"""
    logger.error(f"Validation error on {request.method} {request.url.path}")
    logger.error(f"Validation errors: {exc.errors()}")
    logger.error(f"Request body: {await request.body()}")

    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.body
        }
    )

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(user_counter.router, prefix="/api/user-counter", tags=["user-counter"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(filing.router, prefix="/api/filing", tags=["filing"])
app.include_router(payment.router, prefix="/api/payment", tags=["payment"])

# Pydantic models for request/response validation
class InterviewStartRequest(BaseModel):
    userId: Optional[str] = Field(None, description="User ID (optional, will be generated if not provided)")
    taxYear: int = Field(2024, description="Tax year")
    language: str = Field("en", description="Language preference")

class InterviewAnswerRequest(BaseModel):
    sessionId: str = Field(..., description="Session ID")
    questionId: str = Field(..., description="Question ID")
    answer: Any = Field(..., description="Answer value")
    language: str = Field("en", description="Language preference")

class DocumentUploadRequest(BaseModel):
    sessionId: str = Field(..., description="Session ID")
    documentType: str = Field(..., description="Document type code")
    fileName: str = Field(..., description="File name")

class TaxCalculateRequest(BaseModel):
    sessionId: str = Field(..., description="Session ID")

class TaxEstimateRequest(BaseModel):
    income: float = Field(..., description="Annual income")
    canton: str = Field("ZH", description="Canton code")
    maritalStatus: str = Field("single", description="Marital status")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_healthy = check_db_health()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "service": "swissai-tax-api",
        "database": "connected" if db_healthy else "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }

# NOTE: Interview endpoints moved to routers/interview.py (registered in main.py)

# SECURITY: Document endpoints removed - use authenticated endpoints in routers/documents.py
# All document operations require authentication via /api/documents/* router

# Tax calculation endpoints
@app.post("/api/calculation/calculate")
async def calculate_tax(request: TaxCalculateRequest):
    """Calculate taxes based on session data"""
    try:
        calculation = tax_service.calculate_taxes(request.sessionId)
        return calculation
    except Exception as e:
        logger.error(f"Tax calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calculation/estimate")
async def estimate_tax(request: TaxEstimateRequest):
    """Quick tax estimate without full session"""
    try:
        from decimal import Decimal

        # Create simplified answers for estimate
        answers = {
            'Q01': request.maritalStatus,
            'Q03': True,
            'income_employment': request.income,
            'canton': request.canton,
            'municipality': request.canton
        }

        # Use the calculation service with mock data
        income_data = {'total_income': float(request.income)}
        deductions_data = {'total_deductions': float(request.income * 0.15)}
        taxable_income = Decimal(str(max(0, request.income - request.income * 0.15)))

        federal_tax = tax_service._calculate_federal_tax(taxable_income, answers)
        cantonal_tax = tax_service._calculate_cantonal_tax(taxable_income, request.canton, answers)
        municipal_tax = tax_service._calculate_municipal_tax(cantonal_tax, request.canton, request.canton)

        total_tax = federal_tax + cantonal_tax + municipal_tax

        return {
            "type": "estimate",
            "income": request.income,
            "estimated_deductions": float(request.income * 0.15),
            "taxable_income": float(taxable_income),
            "federal_tax": float(federal_tax),
            "cantonal_tax": float(cantonal_tax),
            "municipal_tax": float(municipal_tax),
            "total_tax": float(total_tax),
            "effective_rate": float((total_tax / Decimal(str(max(request.income, 1)))) * 100),
            "monthly_tax": float(total_tax / 12)
        }
    except Exception as e:
        logger.error(f"Tax estimate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calculation/summary")
async def get_tax_summary(sessionId: str):
    """Get tax calculation summary"""
    try:
        summary = tax_service.get_tax_summary(sessionId)
        if not summary:
            raise HTTPException(status_code=404, detail="No calculation found")
        return summary
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tax summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "SwissAI Tax API",
        "version": "1.0.0",
        "documentation": "/api/docs",
        "health": "/health",
        "endpoints": [
            "/api/interview",
            "/api/documents",
            "/api/calculation"
        ]
    }

# Run with uvicorn when executed directly
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )