#!/usr/bin/env python3
"""
Fix usertype enum: Add 'all', update existing records, remove old values
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import psycopg2
from database.connection import get_db_config

def fix_enum():
    """Fix the usertype enum in the database"""

    db_config = get_db_config()
    conn = psycopg2.connect(
        host=db_config['host'],
        port=db_config['port'],
        database=db_config['database'],
        user=db_config['user'],
        password=db_config['password']
    )

    try:
        cur = conn.cursor()

        print("🔧 Fixing usertype enum...")

        # Step 1: Add 'all' to enum if it doesn't exist
        print("  ➤ Adding 'all' value to enum...")
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON e.enumtypid = t.oid
                    JOIN pg_namespace n ON t.typnamespace = n.oid
                    WHERE t.typname = 'usertype'
                    AND n.nspname = 'swisstax'
                    AND e.enumlabel = 'all'
                ) THEN
                    ALTER TYPE swisstax.usertype ADD VALUE 'all';
                END IF;
            END $$;
        """)
        conn.commit()
        print("  ✓ Added 'all' value")

        # Step 2: Update all existing records to use 'all'
        print("  ➤ Updating existing FAQ categories...")
        cur.execute("""
            UPDATE swisstax.faq_categories
            SET user_type = 'all'::swisstax.usertype
            WHERE user_type IN ('tenant'::swisstax.usertype, 'landlord'::swisstax.usertype, 'both'::swisstax.usertype);
        """)
        categories_updated = cur.rowcount
        print(f"  ✓ Updated {categories_updated} categories")

        print("  ➤ Updating existing FAQs...")
        cur.execute("""
            UPDATE swisstax.faqs
            SET user_type = 'all'::swisstax.usertype
            WHERE user_type IN ('tenant'::swisstax.usertype, 'landlord'::swisstax.usertype, 'both'::swisstax.usertype);
        """)
        faqs_updated = cur.rowcount
        print(f"  ✓ Updated {faqs_updated} FAQs")

        conn.commit()

        print("\n✅ Usertype enum fixed successfully!")
        print("   Note: Old enum values (tenant, landlord, both) are still in the enum type")
        print("   but no longer used. They cannot be removed without recreating the type.")

        cur.close()

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    fix_enum()
