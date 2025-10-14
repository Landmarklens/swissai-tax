#!/usr/bin/env python3
"""Verify AI extraction tables were created successfully"""

import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
DB_URL = "postgresql://webscrapinguser:IXq3IC0Uw6StMkBhb4mb@webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com:5432/swissai_tax"

def verify_tables():
    """Check that all AI extraction tables exist"""

    expected_tables = [
        'extraction_sessions',
        'document_extractions',
        'question_conditions',
        'tax_profiles',
        'minimal_questionnaire_responses',
        'document_requirements',
        'ai_extraction_templates',
        'canton_form_mappings',
        'conflict_resolutions'
    ]

    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Check tables exist
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'swisstax'
            AND table_name = ANY(%s)
            ORDER BY table_name
        """, (expected_tables,))

        existing_tables = [row['table_name'] for row in cur.fetchall()]

        print("✅ Tables created successfully:")
        for table in existing_tables:
            print(f"  - {table}")

        missing_tables = set(expected_tables) - set(existing_tables)
        if missing_tables:
            print("\n❌ Missing tables:")
            for table in missing_tables:
                print(f"  - {table}")
            return False

        # Check minimal questions were inserted
        cur.execute("""
            SELECT COUNT(*) as count
            FROM swisstax.questions
            WHERE id LIKE 'M%'
        """)
        question_count = cur.fetchone()['count']
        print(f"\n✅ Minimal questions inserted: {question_count}")

        # Check AI extraction templates
        cur.execute("""
            SELECT COUNT(*) as count
            FROM swisstax.ai_extraction_templates
        """)
        template_count = cur.fetchone()['count']
        print(f"✅ AI extraction templates: {template_count}")

        # Check canton form mappings
        cur.execute("""
            SELECT COUNT(*) as count, canton
            FROM swisstax.canton_form_mappings
            GROUP BY canton
        """)
        for row in cur.fetchall():
            print(f"✅ Canton {row['canton']} form mappings: {row['count']}")

        # Check document requirements
        cur.execute("""
            SELECT COUNT(*) as count
            FROM swisstax.document_requirements
        """)
        req_count = cur.fetchone()['count']
        print(f"✅ Document requirements: {req_count}")

        # Check new columns on existing tables
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'swisstax'
            AND table_name = 'questions'
            AND column_name IN ('is_minimal', 'ai_extractable', 'extraction_sources', 'skip_option_enabled')
        """)
        new_columns = [row['column_name'] for row in cur.fetchall()]
        if new_columns:
            print(f"\n✅ New columns added to questions table:")
            for col in new_columns:
                print(f"  - {col}")

        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'swisstax'
            AND table_name = 'documents'
            AND column_name IN ('ai_processed', 'extraction_confidence', 'extracted_metadata')
        """)
        doc_columns = [row['column_name'] for row in cur.fetchall()]
        if doc_columns:
            print(f"\n✅ New columns added to documents table:")
            for col in doc_columns:
                print(f"  - {col}")

        cur.close()
        conn.close()

        print("\n🎉 All AI extraction database components are ready!")
        return True

    except Exception as e:
        print(f"\n❌ Error verifying database: {e}")
        return False

if __name__ == "__main__":
    verify_tables()