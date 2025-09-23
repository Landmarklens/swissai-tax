-- SwissAI Tax Database Schema
-- Database: swissai_tax_db
-- Schema: swisstax

SET search_path TO swisstax;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    preferred_language VARCHAR(2) DEFAULT 'DE' CHECK (preferred_language IN ('DE', 'FR', 'EN', 'IT')),
    canton VARCHAR(2),
    municipality VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tax years table
CREATE TABLE IF NOT EXISTS tax_years (
    id SERIAL PRIMARY KEY,
    year INTEGER UNIQUE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    filing_deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interview questions master table
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(10) PRIMARY KEY, -- Q01, Q02, etc.
    category VARCHAR(50),
    question_text_de TEXT NOT NULL,
    question_text_fr TEXT,
    question_text_en TEXT,
    question_text_it TEXT,
    help_text_de TEXT,
    help_text_fr TEXT,
    help_text_en TEXT,
    help_text_it TEXT,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('boolean', 'text', 'number', 'date', 'select', 'multiselect')),
    options JSONB, -- For select/multiselect types
    validation_rules JSONB,
    depends_on VARCHAR(10), -- Reference to parent question
    depends_on_value JSONB, -- Expected value for dependency
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User interview sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tax_year INTEGER,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'submitted', 'archived')),
    current_question VARCHAR(10),
    completion_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, tax_year)
);

-- Interview answers
CREATE TABLE IF NOT EXISTS interview_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(10) REFERENCES questions(id),
    answer_value JSONB,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, question_id)
);

-- Document types master table
CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_de VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255),
    name_en VARCHAR(255),
    name_it VARCHAR(255),
    description_de TEXT,
    description_fr TEXT,
    description_en TEXT,
    description_it TEXT,
    category VARCHAR(50),
    is_mandatory BOOLEAN DEFAULT FALSE,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Required documents based on interview answers
CREATE TABLE IF NOT EXISTS required_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    document_type_id INTEGER REFERENCES document_types(id),
    is_required BOOLEAN DEFAULT TRUE,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, document_type_id)
);

-- Uploaded documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    document_type_id INTEGER REFERENCES document_types(id),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    s3_key VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed', 'deleted')),
    ocr_data JSONB,
    extracted_fields JSONB,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Tax calculations
CREATE TABLE IF NOT EXISTS tax_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    calculation_type VARCHAR(20) CHECK (calculation_type IN ('estimate', 'final')),
    gross_income DECIMAL(12,2),
    deductions DECIMAL(12,2),
    taxable_income DECIMAL(12,2),
    federal_tax DECIMAL(12,2),
    cantonal_tax DECIMAL(12,2),
    municipal_tax DECIMAL(12,2),
    church_tax DECIMAL(12,2),
    total_tax DECIMAL(12,2),
    calculation_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Canton-specific tax rates
CREATE TABLE IF NOT EXISTS tax_rates (
    id SERIAL PRIMARY KEY,
    canton VARCHAR(2) NOT NULL,
    municipality VARCHAR(100),
    tax_year INTEGER NOT NULL,
    rate_type VARCHAR(20) CHECK (rate_type IN ('cantonal', 'municipal', 'church')),
    tax_bracket_min DECIMAL(12,2),
    tax_bracket_max DECIMAL(12,2),
    tax_rate DECIMAL(5,4),
    fixed_amount DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(canton, municipality, tax_year, rate_type, tax_bracket_min)
);

-- Standard deductions
CREATE TABLE IF NOT EXISTS standard_deductions (
    id SERIAL PRIMARY KEY,
    canton VARCHAR(2),
    deduction_type VARCHAR(50) NOT NULL,
    deduction_name_de VARCHAR(255),
    deduction_name_fr VARCHAR(255),
    deduction_name_en VARCHAR(255),
    deduction_name_it VARCHAR(255),
    amount DECIMAL(12,2),
    percentage DECIMAL(5,2),
    max_amount DECIMAL(12,2),
    min_amount DECIMAL(12,2),
    tax_year INTEGER NOT NULL,
    conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX idx_interview_answers_session_id ON interview_answers(session_id);
CREATE INDEX idx_documents_session_id ON documents(session_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_tax_calculations_session_id ON tax_calculations(session_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();