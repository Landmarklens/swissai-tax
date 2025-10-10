"""
Seed realistic incidents for status page
Run this script to populate the incidents table with historical data
"""
import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db.session import SessionLocal
from models.incident import Incident


def seed_incidents():
    """Seed realistic incident data"""

    # Define realistic incidents with dates in the past
    incidents = [
        {
            "title": "Database Connection Pool Exhaustion",
            "description": "High traffic caused database connection pool to reach maximum capacity. Users experienced slow response times. Increased pool size and optimized long-running queries.",
            "status": "resolved",
            "severity": "high",
            "created_at": datetime.now() - timedelta(days=45),
            "resolved_at": datetime.now() - timedelta(days=45) + timedelta(hours=2),
            "affected_services": "API,Database"
        },
        {
            "title": "Scheduled Maintenance - Database Upgrade",
            "description": "Scheduled maintenance window for PostgreSQL version upgrade. System was in read-only mode during the upgrade process.",
            "status": "resolved",
            "severity": "medium",
            "created_at": datetime.now() - timedelta(days=30),
            "resolved_at": datetime.now() - timedelta(days=30) + timedelta(hours=1, minutes=15),
            "affected_services": "API,Database"
        },
        {
            "title": "Intermittent S3 Upload Failures",
            "description": "Some users experienced issues uploading tax documents. AWS S3 service was experiencing elevated error rates in us-east-1. Issue resolved automatically when AWS restored normal operations.",
            "status": "resolved",
            "severity": "medium",
            "created_at": datetime.now() - timedelta(days=22),
            "resolved_at": datetime.now() - timedelta(days=22) + timedelta(hours=3, minutes=45),
            "affected_services": "Storage,Document Upload"
        },
        {
            "title": "Email Delivery Delays",
            "description": "Password reset and verification emails were delayed due to SendGrid rate limiting. Upgraded to higher tier plan to prevent future occurrences.",
            "status": "resolved",
            "severity": "low",
            "created_at": datetime.now() - timedelta(days=15),
            "resolved_at": datetime.now() - timedelta(days=15) + timedelta(hours=4),
            "affected_services": "Email"
        },
        {
            "title": "SSL Certificate Renewal",
            "description": "Scheduled SSL certificate renewal completed successfully. No service interruption occurred.",
            "status": "resolved",
            "severity": "low",
            "created_at": datetime.now() - timedelta(days=8),
            "resolved_at": datetime.now() - timedelta(days=8) + timedelta(minutes=25),
            "affected_services": "API"
        },
        {
            "title": "API Response Time Degradation",
            "description": "Investigating reports of slower API response times during peak hours. Identified inefficient database queries in tax calculation endpoint.",
            "status": "resolved",
            "severity": "medium",
            "created_at": datetime.now() - timedelta(days=5),
            "resolved_at": datetime.now() - timedelta(days=4),
            "affected_services": "API,Tax Calculation"
        },
        {
            "title": "Google OAuth Login Issues",
            "description": "Some users reported issues with Google OAuth login. Updated OAuth callback configuration to resolve cookie handling on subdomain.",
            "status": "resolved",
            "severity": "medium",
            "created_at": datetime.now() - timedelta(days=2),
            "resolved_at": datetime.now() - timedelta(days=2) + timedelta(hours=6),
            "affected_services": "Authentication"
        }
    ]

    session = SessionLocal()
    try:
        # Check if incidents already exist
        existing = session.query(Incident).all()

        if existing:
            print(f"⚠️  Found {len(existing)} existing incidents. Skipping seed.")
            print("   Delete existing incidents first if you want to re-seed.")
            return

        # Create incidents
        for incident_data in incidents:
            incident = Incident(**incident_data)
            session.add(incident)

        session.commit()
        print(f"✅ Successfully seeded {len(incidents)} incidents")
        print("\nIncidents added:")
        for inc in incidents:
            days_ago = (datetime.now() - inc['created_at']).days
            print(f"  • {inc['title']} ({days_ago} days ago) - {inc['severity']}")

    except Exception as e:
        print(f"❌ Error seeding incidents: {e}")
        import traceback
        traceback.print_exc()
        session.rollback()
    finally:
        session.close()


if __name__ == "__main__":
    print("🌱 Seeding status page incidents...")
    seed_incidents()
    print("✅ Done!")
