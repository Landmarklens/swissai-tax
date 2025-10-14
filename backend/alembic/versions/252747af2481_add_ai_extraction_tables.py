"""add_ai_extraction_tables

Revision ID: 252747af2481
Revises: 20251013_feature_usage
Create Date: 2025-10-14 11:01:59.781983

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision: str = '252747af2481'
down_revision: Union[str, Sequence[str], None] = '20251013_feature_usage'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add AI extraction tables for intelligent document processing"""

    # Check and create schema if it doesn't exist
    op.execute("CREATE SCHEMA IF NOT EXISTS swisstax")

    # 1. Create extraction_sessions table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.extraction_sessions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES swisstax.users(id) ON DELETE CASCADE,
            status VARCHAR(50) DEFAULT 'pending',
            confidence_score DECIMAL(3,2),
            extracted_data JSONB DEFAULT '{}',
            conflicts JSONB DEFAULT '[]',
            ai_model_version VARCHAR(100),
            processing_time_ms INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            error_message TEXT,
            metadata JSONB DEFAULT '{}',
            CONSTRAINT check_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1),
            CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial'))
        )
    """)

    # Add indexes for extraction_sessions
    op.execute("CREATE INDEX IF NOT EXISTS idx_extraction_sessions_user_id ON swisstax.extraction_sessions(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_extraction_sessions_status ON swisstax.extraction_sessions(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_extraction_sessions_created_at ON swisstax.extraction_sessions(created_at DESC)")

    # 2. Create document_extractions table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.document_extractions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            document_id UUID REFERENCES swisstax.documents(id) ON DELETE CASCADE,
            extraction_session_id UUID REFERENCES swisstax.extraction_sessions(id) ON DELETE CASCADE,
            document_type VARCHAR(100),
            extracted_fields JSONB DEFAULT '{}',
            confidence_scores JSONB DEFAULT '{}',
            page_references JSONB DEFAULT '[]',
            ai_model_version VARCHAR(50),
            extraction_method VARCHAR(50) DEFAULT 'openai',
            processing_time_ms INTEGER,
            ocr_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT check_extraction_method CHECK (extraction_method IN ('openai', 'textract', 'manual', 'hybrid'))
        )
    """)

    # Add indexes for document_extractions
    op.execute("CREATE INDEX IF NOT EXISTS idx_document_extractions_document_id ON swisstax.document_extractions(document_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_document_extractions_session_id ON swisstax.document_extractions(extraction_session_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_document_extractions_document_type ON swisstax.document_extractions(document_type)")

    # 3. Create question_conditions table for dynamic questionnaire
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.question_conditions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            question_id VARCHAR(10) REFERENCES swisstax.questions(id) ON DELETE CASCADE,
            condition_type VARCHAR(50) NOT NULL,
            condition_expression TEXT NOT NULL,
            target_question_id VARCHAR(10),
            priority INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT check_condition_type CHECK (condition_type IN ('show_if', 'hide_if', 'required_if', 'optional_if', 'calculate'))
        )
    """)

    # Add indexes for question_conditions
    op.execute("CREATE INDEX IF NOT EXISTS idx_question_conditions_question_id ON swisstax.question_conditions(question_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_question_conditions_target_id ON swisstax.question_conditions(target_question_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_question_conditions_active ON swisstax.question_conditions(is_active) WHERE is_active = true")

    # 4. Create tax_profiles table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.tax_profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES swisstax.users(id) ON DELETE CASCADE UNIQUE,
            profile_type VARCHAR(50),
            extracted_data JSONB DEFAULT '{}',
            validated_data JSONB DEFAULT '{}',
            profile_flags JSONB DEFAULT '{}',
            completeness_score DECIMAL(3,2),
            last_extraction_id UUID REFERENCES swisstax.extraction_sessions(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT check_completeness CHECK (completeness_score >= 0 AND completeness_score <= 1),
            CONSTRAINT check_profile_type CHECK (profile_type IN ('simple_employee', 'self_employed', 'investor', 'property_owner', 'complex', 'expat'))
        )
    """)

    # Add indexes for tax_profiles
    op.execute("CREATE INDEX IF NOT EXISTS idx_tax_profiles_user_id ON swisstax.tax_profiles(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tax_profiles_type ON swisstax.tax_profiles(profile_type)")

    # 5. Create minimal_questionnaire_responses table
    # Note: tax_filing_sessions.id is VARCHAR, not UUID
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.minimal_questionnaire_responses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES swisstax.users(id) ON DELETE CASCADE,
            session_id VARCHAR(50) REFERENCES swisstax.tax_filing_sessions(id) ON DELETE CASCADE,
            question_key VARCHAR(100) NOT NULL,
            answer_value TEXT,
            answer_type VARCHAR(50),
            is_ai_suggested BOOLEAN DEFAULT false,
            confidence_score DECIMAL(3,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(session_id, question_key)
        )
    """)

    # Add indexes for minimal_questionnaire_responses
    op.execute("CREATE INDEX IF NOT EXISTS idx_minimal_responses_user_id ON swisstax.minimal_questionnaire_responses(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_minimal_responses_session_id ON swisstax.minimal_questionnaire_responses(session_id)")

    # 6. Create document_requirements table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.document_requirements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            profile_type VARCHAR(50),
            document_type VARCHAR(100) NOT NULL,
            is_required BOOLEAN DEFAULT false,
            condition_expression TEXT,
            priority INTEGER DEFAULT 0,
            help_text_de TEXT,
            help_text_fr TEXT,
            help_text_it TEXT,
            help_text_en TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Add indexes for document_requirements
    op.execute("CREATE INDEX IF NOT EXISTS idx_document_requirements_profile ON swisstax.document_requirements(profile_type)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_document_requirements_type ON swisstax.document_requirements(document_type)")

    # 7. Create ai_extraction_templates table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.ai_extraction_templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            document_type VARCHAR(100) NOT NULL UNIQUE,
            extraction_prompt TEXT NOT NULL,
            field_mappings JSONB DEFAULT '{}',
            validation_rules JSONB DEFAULT '{}',
            sample_output JSONB,
            version VARCHAR(20) DEFAULT '1.0',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Add index for ai_extraction_templates
    op.execute("CREATE INDEX IF NOT EXISTS idx_extraction_templates_type ON swisstax.ai_extraction_templates(document_type)")

    # 8. Create canton_form_mappings table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.canton_form_mappings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            canton VARCHAR(10) NOT NULL,
            tax_year INTEGER NOT NULL,
            form_type VARCHAR(100) NOT NULL,
            field_mappings JSONB DEFAULT '{}',
            form_template_url TEXT,
            validation_rules JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(canton, tax_year, form_type)
        )
    """)

    # Add indexes for canton_form_mappings
    op.execute("CREATE INDEX IF NOT EXISTS idx_canton_mappings_canton ON swisstax.canton_form_mappings(canton)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_canton_mappings_year ON swisstax.canton_form_mappings(tax_year)")

    # 9. Create conflict_resolutions table
    op.execute("""
        CREATE TABLE IF NOT EXISTS swisstax.conflict_resolutions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            extraction_session_id UUID REFERENCES swisstax.extraction_sessions(id) ON DELETE CASCADE,
            field_name VARCHAR(200) NOT NULL,
            conflicting_values JSONB DEFAULT '[]',
            resolution_method VARCHAR(50),
            resolved_value TEXT,
            user_override TEXT,
            confidence_score DECIMAL(3,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            resolved_by UUID REFERENCES swisstax.users(id),
            CONSTRAINT check_resolution_method CHECK (resolution_method IN ('highest_confidence', 'most_recent', 'user_override', 'ai_reconciliation', 'average', 'sum'))
        )
    """)

    # Add indexes for conflict_resolutions
    op.execute("CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_session ON swisstax.conflict_resolutions(extraction_session_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_field ON swisstax.conflict_resolutions(field_name)")

    # 10. Add new columns to existing questions table for minimal questionnaire support
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema = 'swisstax'
                          AND table_name = 'questions'
                          AND column_name = 'is_minimal') THEN
                ALTER TABLE swisstax.questions
                ADD COLUMN is_minimal BOOLEAN DEFAULT false;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema = 'swisstax'
                          AND table_name = 'questions'
                          AND column_name = 'ai_extractable') THEN
                ALTER TABLE swisstax.questions
                ADD COLUMN ai_extractable BOOLEAN DEFAULT false;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema = 'swisstax'
                          AND table_name = 'questions'
                          AND column_name = 'extraction_sources') THEN
                ALTER TABLE swisstax.questions
                ADD COLUMN extraction_sources JSONB DEFAULT '[]';
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema = 'swisstax'
                          AND table_name = 'questions'
                          AND column_name = 'skip_option_enabled') THEN
                ALTER TABLE swisstax.questions
                ADD COLUMN skip_option_enabled BOOLEAN DEFAULT false;
            END IF;
        END $$;
    """)

    # 11. Add AI-related columns to documents table
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema = 'swisstax'
                          AND table_name = 'documents'
                          AND column_name = 'ai_processed') THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN ai_processed BOOLEAN DEFAULT false;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema = 'swisstax'
                          AND table_name = 'documents'
                          AND column_name = 'extraction_confidence') THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN extraction_confidence DECIMAL(3,2);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema = 'swisstax'
                          AND table_name = 'documents'
                          AND column_name = 'extracted_metadata') THEN
                ALTER TABLE swisstax.documents
                ADD COLUMN extracted_metadata JSONB DEFAULT '{}';
            END IF;
        END $$;
    """)

    # 12. Create triggers for updated_at timestamps
    op.execute("""
        CREATE OR REPLACE FUNCTION swisstax.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)

    # Add triggers to all new tables
    for table in ['extraction_sessions', 'document_extractions', 'question_conditions',
                  'tax_profiles', 'minimal_questionnaire_responses', 'document_requirements',
                  'ai_extraction_templates', 'canton_form_mappings', 'conflict_resolutions']:
        op.execute(f"""
            DROP TRIGGER IF EXISTS update_{table}_updated_at ON swisstax.{table};
            CREATE TRIGGER update_{table}_updated_at
            BEFORE UPDATE ON swisstax.{table}
            FOR EACH ROW EXECUTE PROCEDURE swisstax.update_updated_at_column();
        """)

    print("✅ AI extraction tables created successfully")


def downgrade() -> None:
    """Remove AI extraction tables"""

    # Drop triggers first
    for table in ['extraction_sessions', 'document_extractions', 'question_conditions',
                  'tax_profiles', 'minimal_questionnaire_responses', 'document_requirements',
                  'ai_extraction_templates', 'canton_form_mappings', 'conflict_resolutions']:
        op.execute(f"DROP TRIGGER IF EXISTS update_{table}_updated_at ON swisstax.{table}")

    # Drop tables in reverse order of dependencies
    op.execute("DROP TABLE IF EXISTS swisstax.conflict_resolutions CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.canton_form_mappings CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.ai_extraction_templates CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.document_requirements CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.minimal_questionnaire_responses CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.tax_profiles CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.question_conditions CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.document_extractions CASCADE")
    op.execute("DROP TABLE IF EXISTS swisstax.extraction_sessions CASCADE")

    # Remove columns from existing tables
    op.execute("""
        ALTER TABLE swisstax.questions
        DROP COLUMN IF EXISTS is_minimal,
        DROP COLUMN IF EXISTS ai_extractable,
        DROP COLUMN IF EXISTS extraction_sources,
        DROP COLUMN IF EXISTS skip_option_enabled;
    """)

    op.execute("""
        ALTER TABLE swisstax.documents
        DROP COLUMN IF EXISTS ai_processed,
        DROP COLUMN IF EXISTS extraction_confidence,
        DROP COLUMN IF EXISTS extracted_metadata;
    """)

    print("✅ AI extraction tables dropped successfully")
