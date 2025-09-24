#!/usr/bin/env python3
"""Create the SwissAI Tax database if it doesn't exist"""

import psycopg2
from psycopg2 import sql
import os

def create_database():
    # Connection parameters
    host = os.getenv('DATABASE_HOST', 'webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com')
    port = int(os.getenv('DATABASE_PORT', 5432))
    user = os.getenv('DATABASE_USER', 'postgres')
    password = os.getenv('DATABASE_PASSWORD', 'IXq3IC0Uw6StMkBhb4mb')

    # First connect to the default postgres database
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            ('swissai_tax',)
        )

        if cursor.fetchone():
            print("Database 'swissai_tax' already exists")
        else:
            # Create database
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(
                sql.Identifier('swissai_tax')
            ))
            print("Database 'swissai_tax' created successfully")

        cursor.close()
        conn.close()

        # Now connect to the new database and create schema
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database='swissai_tax'
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Create tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                tax_year INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'in_progress',
                current_question_id VARCHAR(50),
                answers JSONB DEFAULT '{}',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tax_calculations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES interview_sessions(id),
                user_id VARCHAR(255) NOT NULL,
                tax_year INTEGER NOT NULL,
                canton VARCHAR(10) NOT NULL,
                municipality VARCHAR(100),
                gross_income DECIMAL(12,2),
                taxable_income DECIMAL(12,2),
                federal_tax DECIMAL(12,2),
                cantonal_tax DECIMAL(12,2),
                municipal_tax DECIMAL(12,2),
                total_tax DECIMAL(12,2),
                calculation_details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES interview_sessions(id),
                user_id VARCHAR(255) NOT NULL,
                document_type VARCHAR(100) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                s3_key VARCHAR(500) NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100),
                ocr_status VARCHAR(50) DEFAULT 'pending',
                ocr_result JSONB,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON interview_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_status ON interview_sessions(status);
            CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON tax_calculations(user_id);
            CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
            CREATE INDEX IF NOT EXISTS idx_documents_session_id ON documents(session_id);
        """)

        print("Database tables created successfully")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")
        raise

if __name__ == "__main__":
    create_database()