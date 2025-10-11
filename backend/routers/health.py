"""
Health Check Router
Provides health check endpoints for monitoring system status
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import time
import boto3
from botocore.exceptions import ClientError
import httpx
from datetime import datetime
import logging

from db.session import get_db
from config import settings
from schemas.health import HealthCheckResponse, SimpleHealthResponse, ServiceHealth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/scheduler")
async def health_scheduler():
    """
    Background scheduler health check endpoint
    Returns scheduler status and job information
    """
    try:
        from services.background_jobs import get_scheduler

        scheduler = get_scheduler()
        status_info = scheduler.get_jobs_status()

        if status_info['status'] == 'running':
            return {
                "status": "healthy",
                "details": f"Scheduler running with {len(status_info.get('jobs', []))} jobs",
                "jobs": status_info.get('jobs', [])
            }
        else:
            return {
                "status": "down",
                "details": "Scheduler is not running",
                "jobs": []
            }
    except Exception as e:
        logger.error(f"Scheduler health check failed: {e}")
        return {
            "status": "down",
            "details": f"Scheduler error: {str(e)[:100]}",
            "jobs": []
        }


@router.get("/", response_model=SimpleHealthResponse)
async def health_check():
    """
    Simple health check - quick response for load balancer
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }


@router.get("/detailed", response_model=HealthCheckResponse)
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """
    Detailed health check for all services
    Used by Uptime Kuma for comprehensive monitoring
    """
    start_time = time.time()

    services = {
        "api": await check_api_health(),
        "database": await check_database_health(db),
        "storage": await check_s3_health(),
        "scheduler": await check_scheduler_health(),
    }

    # Add optional service checks
    if settings.STRIPE_SECRET_KEY:
        services["payments"] = await check_stripe_health()

    if settings.OPENAI_API_KEY:
        services["ai"] = await check_openai_health()

    if settings.SENDGRID_API_KEY:
        services["email"] = await check_email_health()

    # Determine overall status
    statuses = [s["status"] for s in services.values()]
    if all(s == "healthy" for s in statuses):
        overall_status = "healthy"
    elif any(s == "down" for s in statuses):
        overall_status = "degraded"
    else:
        overall_status = "degraded"

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow(),
        "response_time_ms": int((time.time() - start_time) * 1000),
        "services": services,
        "version": "1.0.0"
    }


async def check_api_health() -> Dict[str, Any]:
    """Check API server health"""
    return {
        "status": "healthy",
        "response_time_ms": 1,
        "details": "API server operational"
    }


async def check_database_health(db: AsyncSession) -> Dict[str, Any]:
    """Check PostgreSQL database connection"""
    start_time = time.time()
    try:
        # Simple query to test connection
        from sqlalchemy import text
        result = await db.execute(text("SELECT 1"))
        response_time = int((time.time() - start_time) * 1000)

        return {
            "status": "healthy",
            "response_time_ms": response_time,
            "details": "Database connected"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "down",
            "response_time_ms": 0,
            "details": f"Database error: {str(e)[:100]}"
        }


async def check_s3_health() -> Dict[str, Any]:
    """Check AWS S3 connection"""
    start_time = time.time()
    try:
        s3_client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )

        # Check if bucket exists and is accessible
        s3_client.head_bucket(Bucket=settings.AWS_S3_BUCKET_NAME)

        response_time = int((time.time() - start_time) * 1000)
        return {
            "status": "healthy",
            "response_time_ms": response_time,
            "details": "S3 bucket accessible"
        }
    except ClientError as e:
        logger.error(f"S3 health check failed: {e}")
        return {
            "status": "down",
            "response_time_ms": 0,
            "details": f"S3 error: {str(e)[:100]}"
        }
    except Exception as e:
        logger.error(f"S3 health check failed: {e}")
        return {
            "status": "down",
            "response_time_ms": 0,
            "details": f"S3 error: {str(e)[:100]}"
        }


async def check_scheduler_health() -> Dict[str, Any]:
    """Check background job scheduler status"""
    start_time = time.time()
    try:
        from services.background_jobs import get_scheduler

        scheduler = get_scheduler()
        status_info = scheduler.get_jobs_status()
        response_time = int((time.time() - start_time) * 1000)

        if status_info['status'] == 'running':
            job_count = len(status_info.get('jobs', []))
            return {
                "status": "healthy",
                "response_time_ms": response_time,
                "details": f"Scheduler running with {job_count} jobs"
            }
        else:
            return {
                "status": "down",
                "response_time_ms": response_time,
                "details": "Scheduler is not running"
            }
    except Exception as e:
        logger.error(f"Scheduler health check failed: {e}")
        return {
            "status": "down",
            "response_time_ms": 0,
            "details": f"Scheduler error: {str(e)[:100]}"
        }


async def check_stripe_health() -> Dict[str, Any]:
    """Check Stripe API connection"""
    start_time = time.time()
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        # Simple API call to test connection
        stripe.Account.retrieve()

        response_time = int((time.time() - start_time) * 1000)
        return {
            "status": "healthy",
            "response_time_ms": response_time,
            "details": "Stripe API connected"
        }
    except Exception as e:
        logger.error(f"Stripe health check failed: {e}")
        return {
            "status": "down",
            "response_time_ms": 0,
            "details": f"Stripe error: {str(e)[:100]}"
        }


async def check_openai_health() -> Dict[str, Any]:
    """Check OpenAI API connection"""
    start_time = time.time()
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
            }
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers=headers,
                timeout=5.0
            )
            response.raise_for_status()

        response_time = int((time.time() - start_time) * 1000)
        return {
            "status": "healthy",
            "response_time_ms": response_time,
            "details": "OpenAI API connected"
        }
    except Exception as e:
        logger.error(f"OpenAI health check failed: {e}")
        return {
            "status": "down",
            "response_time_ms": 0,
            "details": f"OpenAI error: {str(e)[:100]}"
        }


async def check_email_health() -> Dict[str, Any]:
    """Check SendGrid email service"""
    start_time = time.time()
    try:
        from sendgrid import SendGridAPIClient

        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        # Test API key validity
        response = sg.client.api_keys.get()

        response_time = int((time.time() - start_time) * 1000)
        return {
            "status": "healthy",
            "response_time_ms": response_time,
            "details": "SendGrid connected"
        }
    except Exception as e:
        logger.error(f"SendGrid health check failed: {e}")
        return {
            "status": "down",
            "response_time_ms": 0,
            "details": f"SendGrid error: {str(e)[:100]}"
        }


# Individual service endpoints for granular monitoring
@router.get("/database")
async def health_database(db: AsyncSession = Depends(get_db)):
    """Database health check endpoint"""
    result = await check_database_health(db)
    if result["status"] != "healthy":
        raise HTTPException(status_code=503, detail=result)
    return result


@router.get("/storage")
async def health_storage():
    """Storage (S3) health check endpoint"""
    result = await check_s3_health()
    if result["status"] != "healthy":
        raise HTTPException(status_code=503, detail=result)
    return result


@router.get("/payments")
async def health_payments():
    """Payment system (Stripe) health check endpoint"""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=404, detail="Stripe not configured")

    result = await check_stripe_health()
    if result["status"] != "healthy":
        raise HTTPException(status_code=503, detail=result)
    return result


@router.get("/ai")
async def health_ai():
    """AI services (OpenAI) health check endpoint"""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=404, detail="OpenAI not configured")

    result = await check_openai_health()
    if result["status"] != "healthy":
        raise HTTPException(status_code=503, detail=result)
    return result


@router.get("/email")
async def health_email():
    """Email service (SendGrid) health check endpoint"""
    if not settings.SENDGRID_API_KEY:
        raise HTTPException(status_code=404, detail="SendGrid not configured")

    result = await check_email_health()
    if result["status"] != "healthy":
        raise HTTPException(status_code=503, detail=result)
    return result
