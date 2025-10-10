#!/usr/bin/env python3
"""
Run the seed_incidents.sql script via SSH tunnel
"""
import psycopg2
import sys

# Database connection via SSH tunnel
DB_CONFIG = {
    'host': 'localhost',
    'port': 15432,
    'database': 'swissai_tax',
    'user': 'webscrapinguser',
    'password': 'IXq3IC0Uw6StMkBhb4mb'
}

def run_seed():
    """Connect and run seed script"""
    try:
        print("🔗 Connecting to database via SSH tunnel...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()

        # Check current incident count
        print("\n📊 Checking current incidents...")
        cursor.execute("SELECT COUNT(*) FROM incidents;")
        current_count = cursor.fetchone()[0]
        print(f"   Current incidents in table: {current_count}")

        if current_count > 0:
            print(f"\n⚠️  Table already has {current_count} incidents.")
            response = input("   Do you want to proceed anyway? (y/N): ")
            if response.lower() != 'y':
                print("   Aborted.")
                return

        # Insert incidents (only if table is empty)
        print("\n🌱 Inserting incidents...")
        insert_sql = """
INSERT INTO incidents (title, description, status, severity, created_at, resolved_at, affected_services)
SELECT * FROM (VALUES
    (
        'Database Connection Pool Exhaustion',
        'High traffic caused database connection pool to reach maximum capacity. Users experienced slow response times. Increased pool size and optimized long-running queries.',
        'resolved'::incidentstatus,
        'high'::incidentseverity,
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '45 days' + INTERVAL '2 hours',
        'API,Database'
    ),
    (
        'Scheduled Maintenance - Database Upgrade',
        'Scheduled maintenance window for PostgreSQL version upgrade. System was in read-only mode during the upgrade process.',
        'resolved'::incidentstatus,
        'medium'::incidentseverity,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '30 days' + INTERVAL '1 hour 15 minutes',
        'API,Database'
    ),
    (
        'Intermittent S3 Upload Failures',
        'Some users experienced issues uploading tax documents. AWS S3 service was experiencing elevated error rates in us-east-1. Issue resolved automatically when AWS restored normal operations.',
        'resolved'::incidentstatus,
        'medium'::incidentseverity,
        NOW() - INTERVAL '22 days',
        NOW() - INTERVAL '22 days' + INTERVAL '3 hours 45 minutes',
        'Storage,Document Upload'
    ),
    (
        'Email Delivery Delays',
        'Password reset and verification emails were delayed due to SendGrid rate limiting. Upgraded to higher tier plan to prevent future occurrences.',
        'resolved'::incidentstatus,
        'low'::incidentseverity,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days' + INTERVAL '4 hours',
        'Email'
    ),
    (
        'SSL Certificate Renewal',
        'Scheduled SSL certificate renewal completed successfully. No service interruption occurred.',
        'resolved'::incidentstatus,
        'low'::incidentseverity,
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '8 days' + INTERVAL '25 minutes',
        'API'
    ),
    (
        'API Response Time Degradation',
        'Investigating reports of slower API response times during peak hours. Identified inefficient database queries in tax calculation endpoint.',
        'resolved'::incidentstatus,
        'medium'::incidentseverity,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '4 days',
        'API,Tax Calculation'
    ),
    (
        'Google OAuth Login Issues',
        'Some users reported issues with Google OAuth login. Updated OAuth callback configuration to resolve cookie handling on subdomain.',
        'resolved'::incidentstatus,
        'medium'::incidentseverity,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days' + INTERVAL '6 hours',
        'Authentication'
    )
) AS v(title, description, status, severity, created_at, resolved_at, affected_services)
WHERE NOT EXISTS (SELECT 1 FROM incidents LIMIT 1);
"""
        cursor.execute(insert_sql)
        print("   ✓ Incidents inserted")

        # Verify incidents were created
        print("\n📊 Verifying insertion...")
        cursor.execute("""
            SELECT
                COUNT(*) as total_incidents,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
                COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
                COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_severity,
                COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_severity
            FROM incidents;
        """)

        results = cursor.fetchone()
        print(f"\n📊 Summary:")
        print(f"   Total incidents: {results[0]}")
        print(f"   Resolved: {results[1]}")
        print(f"   High severity: {results[2]}")
        print(f"   Medium severity: {results[3]}")
        print(f"   Low severity: {results[4]}")

        # Show recent incidents
        cursor.execute("""
            SELECT
                title,
                severity,
                status,
                EXTRACT(DAY FROM (NOW() - created_at)) as days_ago,
                CASE
                    WHEN resolved_at IS NOT NULL
                    THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600
                    ELSE NULL
                END as resolution_hours
            FROM incidents
            ORDER BY created_at DESC
            LIMIT 10;
        """)

        results = cursor.fetchall()
        if results:
            print(f"\n📝 Incident Details:")
            for row in results:
                title, severity, status, days_ago, resolution_hours = row
                if resolution_hours:
                    print(f"   • {title}")
                    print(f"     Severity: {severity} | Status: {status} | {int(days_ago)} days ago | Resolved in: {resolution_hours:.1f}h")
                else:
                    print(f"   • {title}")
                    print(f"     Severity: {severity} | Status: {status} | {int(days_ago)} days ago")

        cursor.close()
        conn.close()

        print("\n✅ Done! Your status page now has realistic incident history.")
        print("   View it at: https://swissai.tax/status")

    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"\n❌ Could not find scripts/seed_incidents.sql")
        print(f"   Make sure you're running this from the backend directory")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_seed()
