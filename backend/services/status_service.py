"""
Status Service Layer
Aggregates status data from various sources
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

from models.incident import Incident
from config import settings

logger = logging.getLogger(__name__)


class StatusService:
    """Service for aggregating and managing status information"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_current_status(self) -> Dict[str, Any]:
        """
        Get current status of all services
        Returns mock data for now - can be integrated with Uptime Kuma later
        """
        # Define our services
        services = [
            {
                "id": "frontend",
                "name": "Frontend Application",
                "status": "operational",
                "response_time": 120,
                "url": "https://swissai.tax"
            },
            {
                "id": "api",
                "name": "API Server",
                "status": "operational",
                "response_time": 45,
                "url": "https://api.homeai.ch"
            },
            {
                "id": "database",
                "name": "Database",
                "status": "operational",
                "response_time": 5,
                "url": None
            },
            {
                "id": "storage",
                "name": "File Storage (S3)",
                "status": "operational",
                "response_time": 150,
                "url": None
            },
        ]

        # Add optional services based on configuration
        if settings.STRIPE_SECRET_KEY:
            services.append({
                "id": "payments",
                "name": "Payment Processing",
                "status": "operational",
                "response_time": 200,
                "url": None
            })

        if settings.OPENAI_API_KEY:
            services.append({
                "id": "ai",
                "name": "AI Assistant",
                "status": "operational",
                "response_time": 1500,
                "url": None
            })

        # Calculate overall status
        statuses = [s["status"] for s in services]
        if any(s == "down" for s in statuses):
            overall_status = "down"
        elif any(s == "degraded" for s in statuses):
            overall_status = "degraded"
        else:
            overall_status = "operational"

        return {
            "overall_status": overall_status,
            "services": services,
            "last_updated": datetime.utcnow()
        }

    async def get_incidents(self, limit: int = 10) -> List[Dict]:
        """Get recent incidents from database"""
        try:
            query = (
                select(Incident)
                .order_by(Incident.created_at.desc())
                .limit(limit)
            )
            result = await self.db.execute(query)
            incidents = result.scalars().all()

            return [
                {
                    "id": str(inc.id),
                    "title": inc.title,
                    "description": inc.description,
                    "status": inc.status.value,
                    "severity": inc.severity.value,
                    "created_at": inc.created_at.isoformat(),
                    "resolved_at": inc.resolved_at.isoformat() if inc.resolved_at else None,
                    "affected_services": inc.affected_services
                }
                for inc in incidents
            ]
        except Exception as e:
            logger.error(f"Error fetching incidents: {e}")
            return []

    async def get_uptime_stats(self, days: int = 90) -> Dict[str, Dict]:
        """
        Get uptime statistics for all services
        Returns mock data for now - can be integrated with Uptime Kuma later
        """
        services = ["frontend", "api", "database", "storage", "payments", "ai"]

        uptime_stats = {}
        for service_id in services:
            # Generate mock uptime data
            uptime_stats[service_id] = {
                "service_id": service_id,
                "period": f"{days} days",
                "percentage": 99.95,  # Mock data
                "data_points": []
            }

        return uptime_stats

    async def create_incident(self, incident_data: Dict[str, Any]) -> Incident:
        """Create a new incident (admin only)"""
        from models.incident import IncidentStatus, IncidentSeverity

        incident = Incident(
            title=incident_data["title"],
            description=incident_data["description"],
            severity=IncidentSeverity(incident_data["severity"]),
            status=IncidentStatus.INVESTIGATING,
            affected_services=incident_data.get("affected_services")
        )

        self.db.add(incident)
        await self.db.commit()
        await self.db.refresh(incident)

        return incident

    async def update_incident(self, incident_id: str, update_data: Dict[str, Any]) -> Incident:
        """Update an existing incident (admin only)"""
        from models.incident import IncidentStatus, IncidentSeverity
        from uuid import UUID

        query = select(Incident).where(Incident.id == UUID(incident_id))
        result = await self.db.execute(query)
        incident = result.scalar_one_or_none()

        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        # Update fields
        if "title" in update_data:
            incident.title = update_data["title"]
        if "description" in update_data:
            incident.description = update_data["description"]
        if "status" in update_data:
            incident.status = IncidentStatus(update_data["status"])
            if update_data["status"] == "resolved":
                incident.resolved_at = datetime.utcnow()
        if "severity" in update_data:
            incident.severity = IncidentSeverity(update_data["severity"])
        if "post_mortem_url" in update_data:
            incident.post_mortem_url = update_data["post_mortem_url"]

        incident.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(incident)

        return incident
