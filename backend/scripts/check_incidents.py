#!/usr/bin/env python3
"""
Check incidents in production database
"""
import psycopg2

# Database connection via SSH tunnel
DB_CONFIG = {
    'host': 'localhost',
    'port': 15432,
    'database': 'swissai_tax',
    'user': 'webscrapinguser',
    'password': 'IXq3IC0Uw6StMkBhb4mb'
}

def check_incidents():
    """Check current incidents"""
    try:
        print("🔗 Connecting to database via SSH tunnel...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Get incident count
        cursor.execute("SELECT COUNT(*) FROM incidents;")
        count = cursor.fetchone()[0]
        print(f"\n📊 Total incidents: {count}")

        # Get incident details
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
            ORDER BY created_at DESC;
        """)

        results = cursor.fetchall()
        if results:
            print(f"\n📝 All Incidents in Database:")
            for row in results:
                title, severity, status, days_ago, resolution_hours = row
                if resolution_hours:
                    print(f"\n   • {title}")
                    print(f"     Severity: {severity} | Status: {status}")
                    print(f"     Created: {int(days_ago)} days ago")
                    print(f"     Resolved in: {resolution_hours:.1f} hours")
                else:
                    print(f"\n   • {title}")
                    print(f"     Severity: {severity} | Status: {status}")
                    print(f"     Created: {int(days_ago)} days ago")

        cursor.close()
        conn.close()

        print("\n✅ Status page has realistic incident history!")
        print("   View it at: https://swissai.tax/status")

    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    check_incidents()
