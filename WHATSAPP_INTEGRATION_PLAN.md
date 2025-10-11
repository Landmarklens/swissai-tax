# WhatsApp Integration Implementation Plan
## SwissAI Tax - Detailed Technical Specification

**Version:** 1.0
**Date:** 2025-10-11
**Status:** Planning
**Estimated Timeline:** 6 weeks
**Team Required:** 2-3 developers

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: AWS Infrastructure Setup](#phase-1-aws-infrastructure-setup)
4. [Phase 2: Database Changes](#phase-2-database-changes)
5. [Phase 3: Backend Implementation](#phase-3-backend-implementation)
6. [Phase 4: Frontend Implementation](#phase-4-frontend-implementation)
7. [Phase 5: Security & Encryption](#phase-5-security--encryption)
8. [Phase 6: Testing Strategy](#phase-6-testing-strategy)
9. [Phase 7: Deployment & Rollout](#phase-7-deployment--rollout)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Cost Analysis](#cost-analysis)
12. [Risk Assessment](#risk-assessment)

---

## Executive Summary

### Objective
Enable SwissAI Tax users to interact with the tax filing system via WhatsApp, including:
- Document uploads (Lohnausweis, 3a statements, etc.)
- AI-powered tax questions and answers
- Status updates on tax filing progress
- Secure account linking with existing web authentication

### Key Benefits
- **Improved accessibility**: Users can manage taxes on mobile without app
- **Higher engagement**: WhatsApp has 98% open rate vs 20% email
- **Document convenience**: Upload photos directly from phone
- **Swiss compliance**: GDPR-compliant with data sovereignty

### Success Metrics
- 30% of users link WhatsApp within 3 months
- 50% reduction in document upload drop-off
- Average response time under 30 seconds for AI queries
- Zero security incidents related to WhatsApp integration

---

## Architecture Overview

### High-Level Data Flow

```
┌─────────────────────┐
│   User's WhatsApp   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────┐
│  Meta WhatsApp Cloud API        │
│  (EU Data Center - GDPR)        │
└──────────┬──────────────────────┘
           │ HTTPS Webhook
           ↓
┌─────────────────────────────────┐
│  AWS App Runner                 │
│  FastAPI Backend                │
│  /api/webhooks/whatsapp         │
└──────────┬──────────────────────┘
           │
           ├──→ Phone → User Lookup (encrypted)
           │
           ├──→ Download Media → S3 Bucket
           │    (swissai-tax-documents-1758721021)
           │
           ├──→ Process Document → Textract
           │
           ├──→ AI Tax Assistant → OpenAI
           │
           └──→ Send Response → WhatsApp API
```

### Technology Stack (New Components)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| WhatsApp API | Meta Cloud API | Message sending/receiving |
| Encryption | Cryptography (Fernet) | Phone number encryption |
| Message Queue | Redis (optional) | Webhook deduplication |
| Webhook Validation | HMAC SHA-256 | Verify Meta signatures |

---

## Phase 1: AWS Infrastructure Setup

### 1.1 WhatsApp Business API Setup

**Prerequisites:**
- Meta Business Manager account
- Verified business
- Facebook Business Page
- Phone number for WhatsApp Business

**Steps:**

#### A. Create Meta Business App
```bash
# Manual steps (via Meta Developer Console):
1. Go to https://developers.facebook.com/
2. Create new app → Type: "Business"
3. Add WhatsApp product to app
4. Complete business verification (2-3 weeks)
```

#### B. Configure WhatsApp API
```bash
# Settings to configure:
- Display name: "SwissAI Tax Assistant"
- Category: "Financial Services"
- Description: "AI-powered Swiss tax filing assistant"
- Profile picture: SwissAI logo
- About text: "Get help with your Swiss taxes"
```

#### C. Get API Credentials
```bash
# Save these values (to be stored in Parameter Store):
WHATSAPP_PHONE_NUMBER_ID=<from Meta console>
WHATSAPP_BUSINESS_ACCOUNT_ID=<from Meta console>
WHATSAPP_API_KEY=<permanent access token>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<generate random 32-char string>
```

---

### 1.2 AWS Parameter Store Configuration

**New Parameters to Add:**

```bash
#!/bin/bash
# Run this script to create all WhatsApp parameters

AWS_REGION="us-east-1"

# WhatsApp API credentials
aws ssm put-parameter \
  --name "/swissai-tax/whatsapp/api-key" \
  --value "YOUR_META_PERMANENT_TOKEN" \
  --type "SecureString" \
  --description "Meta WhatsApp Cloud API access token" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/swissai-tax/whatsapp/phone-number-id" \
  --value "YOUR_PHONE_NUMBER_ID" \
  --type "String" \
  --description "WhatsApp Business phone number ID" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/swissai-tax/whatsapp/business-account-id" \
  --value "YOUR_BUSINESS_ACCOUNT_ID" \
  --type "String" \
  --description "WhatsApp Business account ID" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/swissai-tax/whatsapp/webhook-verify-token" \
  --value "$(openssl rand -hex 32)" \
  --type "SecureString" \
  --description "Token for webhook verification" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/swissai-tax/whatsapp/webhook-secret" \
  --value "$(openssl rand -hex 32)" \
  --type "SecureString" \
  --description "Secret for webhook signature verification" \
  --region $AWS_REGION

# Encryption key for phone numbers (separate from general encryption)
aws ssm put-parameter \
  --name "/swissai-tax/whatsapp/phone-encryption-key" \
  --value "$(python3 -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')" \
  --type "SecureString" \
  --description "Encryption key for WhatsApp phone numbers" \
  --region $AWS_REGION

echo "✅ All WhatsApp parameters created successfully"
```

**Save this as:** `infrastructure/setup-whatsapp-parameters.sh`

---

### 1.3 S3 Bucket Configuration

**No new bucket needed** - extend existing bucket structure:

```bash
# Add lifecycle policy for WhatsApp temporary files
cat > whatsapp-lifecycle-policy.json <<EOF
{
  "Rules": [
    {
      "Id": "WhatsAppTempFilesCleanup",
      "Status": "Enabled",
      "Prefix": "whatsapp/temp/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "WhatsAppMediaFiles",
      "Status": "Enabled",
      "Prefix": "whatsapp/",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket swissai-tax-documents-1758721021 \
  --lifecycle-configuration file://whatsapp-lifecycle-policy.json \
  --region us-east-1
```

**Save this as:** `infrastructure/setup-whatsapp-s3-lifecycle.sh`

---

### 1.4 IAM Permissions Update

**Update App Runner IAM role** to include WhatsApp-specific permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "WhatsAppS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::swissai-tax-documents-1758721021/whatsapp/*"
      ]
    },
    {
      "Sid": "WhatsAppParameterStoreAccess",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:ssm:us-east-1:*:parameter/swissai-tax/whatsapp/*"
      ]
    }
  ]
}
```

**Save this as:** `infrastructure/whatsapp-iam-policy.json`

**Apply the policy:**
```bash
# Get current App Runner service role
SERVICE_ROLE=$(aws apprunner describe-service \
  --service-arn <YOUR_SERVICE_ARN> \
  --query 'Service.InstanceConfiguration.InstanceRoleArn' \
  --output text --region us-east-1)

ROLE_NAME=$(echo $SERVICE_ROLE | awk -F'/' '{print $NF}')

# Attach inline policy
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name WhatsAppAccessPolicy \
  --policy-document file://infrastructure/whatsapp-iam-policy.json
```

---

### 1.5 CloudWatch Alarms Setup

**Create monitoring alarms for WhatsApp integration:**

```bash
#!/bin/bash
# infrastructure/setup-whatsapp-cloudwatch.sh

# Alarm 1: High webhook error rate
aws cloudwatch put-metric-alarm \
  --alarm-name "WhatsApp-WebhookErrors-High" \
  --alarm-description "WhatsApp webhook error rate above 5%" \
  --metric-name ErrorCount \
  --namespace SwissAI/WhatsApp \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1

# Alarm 2: Message processing latency
aws cloudwatch put-metric-alarm \
  --alarm-name "WhatsApp-ProcessingLatency-High" \
  --alarm-description "WhatsApp message processing taking >30s" \
  --metric-name ProcessingDuration \
  --namespace SwissAI/WhatsApp \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 30000 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1

# Alarm 3: Failed message deliveries
aws cloudwatch put-metric-alarm \
  --alarm-name "WhatsApp-DeliveryFailures-High" \
  --alarm-description "WhatsApp message delivery failures above 2%" \
  --metric-name DeliveryFailures \
  --namespace SwissAI/WhatsApp \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

---

## Phase 2: Database Changes

### 2.1 Alembic Migration - Add WhatsApp Fields to Users Table

**Create migration file:**

```bash
cd backend
alembic revision -m "add_whatsapp_fields_to_users"
```

**Migration file:** `backend/alembic/versions/20251011_add_whatsapp_fields_to_users.py`

```python
"""add_whatsapp_fields_to_users

Revision ID: whatsapp_001
Revises: <previous_revision_id>
Create Date: 2025-10-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'whatsapp_001'
down_revision = '<previous_revision_id>'  # Update this
branch_labels = None
depends_on = None


def upgrade():
    """Add WhatsApp-related fields to swisstax.users table"""

    # Add WhatsApp columns
    op.add_column(
        'users',
        sa.Column('whatsapp_phone', sa.String(length=255), nullable=True),
        schema='swisstax'
    )
    op.add_column(
        'users',
        sa.Column('whatsapp_linked_at', sa.DateTime(timezone=True), nullable=True),
        schema='swisstax'
    )
    op.add_column(
        'users',
        sa.Column('whatsapp_session_token', sa.String(length=255), nullable=True),
        schema='swisstax'
    )
    op.add_column(
        'users',
        sa.Column('whatsapp_enabled', sa.Boolean(), server_default='false', nullable=False),
        schema='swisstax'
    )
    op.add_column(
        'users',
        sa.Column('whatsapp_consent_given_at', sa.DateTime(timezone=True), nullable=True),
        schema='swisstax'
    )

    # Create index for phone number lookups (critical for performance)
    op.create_index(
        'idx_users_whatsapp_phone',
        'users',
        ['whatsapp_phone'],
        unique=False,
        schema='swisstax',
        postgresql_where=sa.text('whatsapp_phone IS NOT NULL')
    )

    # Create index for enabled users
    op.create_index(
        'idx_users_whatsapp_enabled',
        'users',
        ['whatsapp_enabled'],
        unique=False,
        schema='swisstax',
        postgresql_where=sa.text('whatsapp_enabled = true')
    )


def downgrade():
    """Remove WhatsApp fields from users table"""

    # Drop indexes first
    op.drop_index('idx_users_whatsapp_enabled', table_name='users', schema='swisstax')
    op.drop_index('idx_users_whatsapp_phone', table_name='users', schema='swisstax')

    # Drop columns
    op.drop_column('users', 'whatsapp_consent_given_at', schema='swisstax')
    op.drop_column('users', 'whatsapp_enabled', schema='swisstax')
    op.drop_column('users', 'whatsapp_session_token', schema='swisstax')
    op.drop_column('users', 'whatsapp_linked_at', schema='swisstax')
    op.drop_column('users', 'whatsapp_phone', schema='swisstax')
```

---

### 2.2 Create WhatsApp Messages Table

**Create migration file:**

```bash
alembic revision -m "create_whatsapp_messages_table"
```

**Migration file:** `backend/alembic/versions/20251011_create_whatsapp_messages_table.py`

```python
"""create_whatsapp_messages_table

Revision ID: whatsapp_002
Revises: whatsapp_001
Create Date: 2025-10-11 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'whatsapp_002'
down_revision = 'whatsapp_001'
branch_labels = None
depends_on = None


def upgrade():
    """Create swisstax.whatsapp_messages table"""

    op.create_table(
        'whatsapp_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('message_id', sa.String(length=255), nullable=False, unique=True),
        sa.Column('direction', sa.String(length=10), nullable=False),  # 'inbound' or 'outbound'
        sa.Column('message_type', sa.String(length=20), nullable=False),  # 'text', 'image', 'document', 'audio'
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('media_url', sa.String(length=500), nullable=True),
        sa.Column('media_mime_type', sa.String(length=100), nullable=True),
        sa.Column('s3_key', sa.String(length=500), nullable=True),  # For downloaded media
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),  # 'pending', 'sent', 'delivered', 'read', 'failed'
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),  # For additional data
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        schema='swisstax'
    )

    # Foreign key to users table
    op.create_foreign_key(
        'fk_whatsapp_messages_user_id',
        'whatsapp_messages', 'users',
        ['user_id'], ['id'],
        source_schema='swisstax',
        referent_schema='swisstax',
        ondelete='CASCADE'
    )

    # Indexes for performance
    op.create_index(
        'idx_whatsapp_messages_user_id',
        'whatsapp_messages',
        ['user_id'],
        schema='swisstax'
    )

    op.create_index(
        'idx_whatsapp_messages_created_at',
        'whatsapp_messages',
        ['created_at'],
        schema='swisstax'
    )

    op.create_index(
        'idx_whatsapp_messages_status',
        'whatsapp_messages',
        ['status'],
        schema='swisstax'
    )

    # Composite index for user message history queries
    op.create_index(
        'idx_whatsapp_messages_user_created',
        'whatsapp_messages',
        ['user_id', 'created_at'],
        schema='swisstax'
    )


def downgrade():
    """Drop whatsapp_messages table"""
    op.drop_table('whatsapp_messages', schema='swisstax')
```

---

### 2.3 Create WhatsApp Linking Tokens Table

**Create migration file:**

```bash
alembic revision -m "create_whatsapp_linking_tokens_table"
```

**Migration file:** `backend/alembic/versions/20251011_create_whatsapp_linking_tokens_table.py`

```python
"""create_whatsapp_linking_tokens_table

Revision ID: whatsapp_003
Revises: whatsapp_002
Create Date: 2025-10-11 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'whatsapp_003'
down_revision = 'whatsapp_002'
branch_labels = None
depends_on = None


def upgrade():
    """Create table for temporary linking tokens (PINs)"""

    op.create_table(
        'whatsapp_linking_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token', sa.String(length=6), nullable=False, unique=True),  # 6-digit PIN
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('phone_number', sa.String(length=255), nullable=True),  # Set when token is used
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        schema='swisstax'
    )

    # Foreign key to users
    op.create_foreign_key(
        'fk_whatsapp_linking_tokens_user_id',
        'whatsapp_linking_tokens', 'users',
        ['user_id'], ['id'],
        source_schema='swisstax',
        referent_schema='swisstax',
        ondelete='CASCADE'
    )

    # Indexes
    op.create_index(
        'idx_whatsapp_linking_tokens_token',
        'whatsapp_linking_tokens',
        ['token'],
        unique=True,
        schema='swisstax'
    )

    op.create_index(
        'idx_whatsapp_linking_tokens_user_id',
        'whatsapp_linking_tokens',
        ['user_id'],
        schema='swisstax'
    )

    # Cleanup old tokens automatically (PostgreSQL-specific)
    op.execute("""
        CREATE OR REPLACE FUNCTION cleanup_expired_linking_tokens()
        RETURNS void AS $$
        BEGIN
            DELETE FROM swisstax.whatsapp_linking_tokens
            WHERE expires_at < NOW() - INTERVAL '1 hour';
        END;
        $$ LANGUAGE plpgsql;
    """)


def downgrade():
    """Drop linking tokens table and cleanup function"""
    op.execute("DROP FUNCTION IF EXISTS cleanup_expired_linking_tokens();")
    op.drop_table('whatsapp_linking_tokens', schema='swisstax')
```

---

### 2.4 Run Migrations

```bash
#!/bin/bash
# Run all WhatsApp migrations

cd backend

echo "🔄 Running WhatsApp database migrations..."

# Check current revision
alembic current

# Run upgrade
alembic upgrade head

# Verify migrations
alembic current

echo "✅ WhatsApp migrations completed successfully"

# Verify tables exist
psql $DATABASE_URL -c "\dt swisstax.whatsapp*"
```

**Save this as:** `backend/scripts/run_whatsapp_migrations.sh`

---

## Phase 3: Backend Implementation

### 3.1 Update Configuration

**File:** `backend/config.py`

Add these fields to the `Settings` class:

```python
# In backend/config.py, add to Settings class:

class Settings(BaseSettings):
    # ... existing fields ...

    # ========== WhatsApp Settings ==========
    WHATSAPP_API_KEY: str | None = Field(None, description="Meta WhatsApp Cloud API access token")
    WHATSAPP_PHONE_NUMBER_ID: str | None = Field(None, description="WhatsApp Business phone number ID")
    WHATSAPP_BUSINESS_ACCOUNT_ID: str | None = Field(None, description="WhatsApp Business account ID")
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str | None = Field(None, description="Token for webhook verification")
    WHATSAPP_WEBHOOK_SECRET: str | None = Field(None, description="Secret for webhook signature verification")
    WHATSAPP_PHONE_ENCRYPTION_KEY: str | None = Field(None, description="Encryption key for phone numbers")
    WHATSAPP_API_URL: str = Field("https://graph.facebook.com/v18.0", description="Meta Graph API base URL")

    def _load_from_parameter_store(self):
        """Try to load values from AWS Parameter Store"""
        # ... existing code ...

        param_mappings = {
            # ... existing mappings ...

            # WhatsApp parameters
            '/swissai-tax/whatsapp/api-key': 'WHATSAPP_API_KEY',
            '/swissai-tax/whatsapp/phone-number-id': 'WHATSAPP_PHONE_NUMBER_ID',
            '/swissai-tax/whatsapp/business-account-id': 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            '/swissai-tax/whatsapp/webhook-verify-token': 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
            '/swissai-tax/whatsapp/webhook-secret': 'WHATSAPP_WEBHOOK_SECRET',
            '/swissai-tax/whatsapp/phone-encryption-key': 'WHATSAPP_PHONE_ENCRYPTION_KEY',
        }

        # ... rest of existing code ...
```

---

### 3.2 Create Database Models

**File:** `backend/models/swisstax/whatsapp_message.py` (NEW)

```python
"""
WhatsApp Message model for SwissAI Tax
Stores WhatsApp message history
"""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from .base import Base, SwissTaxBase


class WhatsAppMessage(SwissTaxBase, Base):
    """
    WhatsApp message history
    Tracks all messages sent/received via WhatsApp integration
    """
    __tablename__ = "whatsapp_messages"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False)

    # Message details
    message_id = Column(String(255), nullable=False, unique=True, index=True)  # WhatsApp message ID
    direction = Column(String(10), nullable=False)  # 'inbound' or 'outbound'
    message_type = Column(String(20), nullable=False)  # 'text', 'image', 'document', 'audio'
    content = Column(Text, nullable=True)  # Message text content
    media_url = Column(String(500), nullable=True)  # WhatsApp CDN URL (temporary)
    media_mime_type = Column(String(100), nullable=True)
    s3_key = Column(String(500), nullable=True)  # Permanent storage in S3

    # Status tracking
    status = Column(String(20), nullable=False, server_default='pending')  # pending, sent, delivered, read, failed
    error_message = Column(Text, nullable=True)

    # Additional metadata (JSONB for flexibility)
    metadata = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<WhatsAppMessage(id={self.id}, user_id={self.user_id}, direction={self.direction}, type={self.message_type})>"


class WhatsAppLinkingToken(SwissTaxBase, Base):
    """
    Temporary tokens for linking WhatsApp accounts
    6-digit PINs with 10-minute expiry
    """
    __tablename__ = "whatsapp_linking_tokens"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey('swisstax.users.id', ondelete='CASCADE'), nullable=False)

    # Token details
    token = Column(String(6), nullable=False, unique=True, index=True)  # 6-digit PIN
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, server_default='false', nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    phone_number = Column(String(255), nullable=True)  # Encrypted phone when used

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<WhatsAppLinkingToken(id={self.id}, token={self.token}, used={self.used})>"

    @property
    def is_expired(self) -> bool:
        """Check if token is expired"""
        return datetime.now() > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Check if token is valid (not used and not expired)"""
        return not self.used and not self.is_expired
```

---

### 3.3 Update User Model

**File:** `backend/models/swisstax/user.py`

Add WhatsApp fields to existing User model:

```python
# Add these imports at the top
from sqlalchemy.orm import relationship

# Add these columns to the User class (after existing fields):

class User(SwissTaxBase, Base):
    # ... existing fields ...

    # ========== WhatsApp Integration Fields ==========
    whatsapp_phone = Column(String(255), nullable=True)  # Encrypted phone number
    whatsapp_linked_at = Column(DateTime(timezone=True), nullable=True)
    whatsapp_session_token = Column(String(255), nullable=True)  # Hashed session token
    whatsapp_enabled = Column(Boolean, server_default='false', nullable=False)
    whatsapp_consent_given_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships (optional - can be enabled later)
    # whatsapp_messages = relationship("WhatsAppMessage", back_populates="user", cascade="all, delete-orphan")

    # ... rest of existing code ...
```

---

### 3.4 Create Pydantic Schemas

**File:** `backend/schemas/whatsapp.py` (NEW)

```python
"""
Pydantic schemas for WhatsApp integration
"""

from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field


# ========== WhatsApp Webhook Schemas ==========

class WhatsAppWebhookMessage(BaseModel):
    """Incoming message from WhatsApp webhook"""
    from_: str = Field(..., alias="from")
    id: str
    timestamp: str
    type: Literal["text", "image", "document", "audio", "video"]
    text: Optional[dict] = None  # {"body": "message text"}
    image: Optional[dict] = None  # {"id": "media_id", "mime_type": "image/jpeg"}
    document: Optional[dict] = None
    audio: Optional[dict] = None


class WhatsAppWebhookEntry(BaseModel):
    """Webhook entry containing messages"""
    id: str
    changes: list[dict]


class WhatsAppWebhookPayload(BaseModel):
    """Complete webhook payload from Meta"""
    object: str
    entry: list[WhatsAppWebhookEntry]


# ========== Linking Schemas ==========

class WhatsAppLinkingRequest(BaseModel):
    """Request to generate a linking PIN"""
    # No fields needed - user from JWT token
    pass


class WhatsAppLinkingResponse(BaseModel):
    """Response with linking PIN"""
    token: str = Field(..., description="6-digit PIN for linking")
    expires_at: datetime
    expires_in_seconds: int
    instructions: str = Field(
        default="Send this code via WhatsApp to link your account: 'LINK <code>'"
    )


class WhatsAppUnlinkRequest(BaseModel):
    """Request to unlink WhatsApp"""
    confirm: bool = Field(..., description="Must be true to confirm unlink")


# ========== Message Schemas ==========

class WhatsAppMessageBase(BaseModel):
    """Base message fields"""
    direction: Literal["inbound", "outbound"]
    message_type: Literal["text", "image", "document", "audio"]
    content: Optional[str] = None
    media_url: Optional[str] = None
    s3_key: Optional[str] = None


class WhatsAppMessageCreate(WhatsAppMessageBase):
    """Create a new message"""
    user_id: UUID
    message_id: str
    status: str = "pending"


class WhatsAppMessageResponse(WhatsAppMessageBase):
    """Message response"""
    id: UUID
    user_id: UUID
    message_id: str
    status: str
    created_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WhatsAppMessageHistoryResponse(BaseModel):
    """Response for message history"""
    messages: list[WhatsAppMessageResponse]
    total: int
    page: int
    page_size: int


# ========== Outbound Message Schemas ==========

class WhatsAppSendTextRequest(BaseModel):
    """Send a text message via WhatsApp"""
    to: str = Field(..., description="Phone number (E.164 format)")
    message: str = Field(..., min_length=1, max_length=4096)


class WhatsAppSendDocumentRequest(BaseModel):
    """Send a document via WhatsApp"""
    to: str
    document_url: str
    filename: str
    caption: Optional[str] = None


# ========== Status Schemas ==========

class WhatsAppStatus(BaseModel):
    """WhatsApp integration status for a user"""
    enabled: bool
    linked: bool
    phone_number_masked: Optional[str] = None  # e.g., "+41 79 *** ** 67"
    linked_at: Optional[datetime] = None
    message_count: int = 0
    last_message_at: Optional[datetime] = None
```

---

### 3.5 Create Encryption Utility

**File:** `backend/utils/whatsapp_encryption.py` (NEW)

```python
"""
Encryption utilities for WhatsApp phone numbers
Separate from general S3 encryption for security isolation
"""

import logging
from cryptography.fernet import Fernet, InvalidToken
from config import settings

logger = logging.getLogger(__name__)


class WhatsAppPhoneEncryption:
    """
    Handles encryption/decryption of WhatsApp phone numbers
    Uses Fernet (symmetric encryption) with key from Parameter Store
    """

    def __init__(self):
        """Initialize encryption with key from Parameter Store"""
        if not settings.WHATSAPP_PHONE_ENCRYPTION_KEY:
            raise ValueError("WHATSAPP_PHONE_ENCRYPTION_KEY not configured in Parameter Store")

        try:
            self.cipher = Fernet(settings.WHATSAPP_PHONE_ENCRYPTION_KEY.encode())
        except Exception as e:
            logger.error(f"Failed to initialize WhatsApp phone encryption: {e}")
            raise

    def encrypt_phone(self, phone: str) -> str:
        """
        Encrypt a phone number

        Args:
            phone: Phone number in E.164 format (e.g., +41791234567)

        Returns:
            Encrypted phone number (base64 encoded)
        """
        if not phone:
            raise ValueError("Phone number cannot be empty")

        # Normalize phone format
        phone = phone.strip().replace(" ", "").replace("-", "")
        if not phone.startswith("+"):
            raise ValueError("Phone number must be in E.164 format (start with +)")

        try:
            encrypted = self.cipher.encrypt(phone.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Error encrypting phone number: {e}")
            raise

    def decrypt_phone(self, encrypted_phone: str) -> str:
        """
        Decrypt a phone number

        Args:
            encrypted_phone: Encrypted phone number (base64 encoded)

        Returns:
            Decrypted phone number in E.164 format
        """
        if not encrypted_phone:
            raise ValueError("Encrypted phone cannot be empty")

        try:
            decrypted = self.cipher.decrypt(encrypted_phone.encode())
            return decrypted.decode()
        except InvalidToken:
            logger.error("Invalid encryption token - possible key mismatch")
            raise ValueError("Failed to decrypt phone number")
        except Exception as e:
            logger.error(f"Error decrypting phone number: {e}")
            raise

    def mask_phone(self, phone: str) -> str:
        """
        Mask a phone number for display
        Example: +41791234567 -> +41 79 *** ** 67

        Args:
            phone: Phone number in E.164 format

        Returns:
            Masked phone number
        """
        if not phone or len(phone) < 8:
            return "***"

        # Extract country code and last 2 digits
        if phone.startswith("+41"):  # Swiss number
            return f"+41 {phone[3:5]} *** ** {phone[-2:]}"
        elif phone.startswith("+"):
            return f"{phone[:3]} *** *** {phone[-2:]}"
        else:
            return "*** *** **"


# Global instance
phone_encryption = WhatsAppPhoneEncryption()
```

---

### 3.6 Create WhatsApp API Service

**File:** `backend/services/whatsapp_api_service.py` (NEW)

```python
"""
WhatsApp Cloud API service
Handles communication with Meta's WhatsApp Business API
"""

import logging
import httpx
from typing import Optional, Dict, Any
from config import settings

logger = logging.getLogger(__name__)


class WhatsAppAPIService:
    """
    Service for interacting with Meta WhatsApp Cloud API
    """

    def __init__(self):
        self.api_url = settings.WHATSAPP_API_URL
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.api_key = settings.WHATSAPP_API_KEY

        if not all([self.api_url, self.phone_number_id, self.api_key]):
            logger.warning("WhatsApp API credentials not fully configured")

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def send_text_message(self, to: str, message: str) -> Dict[str, Any]:
        """
        Send a text message via WhatsApp

        Args:
            to: Phone number in E.164 format (e.g., +41791234567)
            message: Text message content (max 4096 chars)

        Returns:
            API response with message ID
        """
        url = f"{self.api_url}/{self.phone_number_id}/messages"

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to.replace("+", ""),  # Remove + for API
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"WhatsApp API error: {e}")
            raise

    async def send_image_message(self, to: str, image_url: str, caption: Optional[str] = None) -> Dict[str, Any]:
        """
        Send an image via WhatsApp

        Args:
            to: Phone number
            image_url: Public URL of image
            caption: Optional caption

        Returns:
            API response
        """
        url = f"{self.api_url}/{self.phone_number_id}/messages"

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to.replace("+", ""),
            "type": "image",
            "image": {
                "link": image_url
            }
        }

        if caption:
            payload["image"]["caption"] = caption

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"WhatsApp API error sending image: {e}")
            raise

    async def send_document_message(self, to: str, document_url: str, filename: str, caption: Optional[str] = None) -> Dict[str, Any]:
        """
        Send a document via WhatsApp

        Args:
            to: Phone number
            document_url: Public URL of document
            filename: Document filename
            caption: Optional caption

        Returns:
            API response
        """
        url = f"{self.api_url}/{self.phone_number_id}/messages"

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to.replace("+", ""),
            "type": "document",
            "document": {
                "link": document_url,
                "filename": filename
            }
        }

        if caption:
            payload["document"]["caption"] = caption

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"WhatsApp API error sending document: {e}")
            raise

    async def download_media(self, media_id: str) -> bytes:
        """
        Download media from WhatsApp CDN

        Args:
            media_id: WhatsApp media ID

        Returns:
            Media content as bytes
        """
        # Step 1: Get media URL
        url = f"{self.api_url}/{media_id}"

        try:
            async with httpx.AsyncClient() as client:
                # Get media metadata
                response = await client.get(
                    url,
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                media_info = response.json()

                media_url = media_info.get("url")
                if not media_url:
                    raise ValueError("No media URL in response")

                # Download actual media
                media_response = await client.get(
                    media_url,
                    headers=self._get_headers(),
                    timeout=60.0
                )
                media_response.raise_for_status()

                return media_response.content
        except httpx.HTTPError as e:
            logger.error(f"Error downloading WhatsApp media: {e}")
            raise

    async def mark_message_as_read(self, message_id: str) -> Dict[str, Any]:
        """
        Mark a message as read

        Args:
            message_id: WhatsApp message ID

        Returns:
            API response
        """
        url = f"{self.api_url}/{self.phone_number_id}/messages"

        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self._get_headers(),
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Error marking message as read: {e}")
            raise


# Global instance
whatsapp_api = WhatsAppAPIService()
```

---

**(Continuing in next section due to length...)**

### 3.7 Create WhatsApp Business Logic Service

**File:** `backend/services/whatsapp_service.py` (NEW)

```python
"""
WhatsApp business logic service
Handles message processing, user linking, and document uploads
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID

import boto3
from sqlalchemy.orm import Session

from config import settings
from models.swisstax.user import User
from models.swisstax.whatsapp_message import WhatsAppMessage, WhatsAppLinkingToken
from schemas.whatsapp import WhatsAppMessageCreate
from services.whatsapp_api_service import whatsapp_api
from services.document_service import DocumentService
from services.ai_document_intelligence_service import AIDocumentIntelligenceService
from utils.whatsapp_encryption import phone_encryption

logger = logging.getLogger(__name__)

# Initialize AWS clients
s3_client = boto3.client('s3', region_name=settings.AWS_REGION)


class WhatsAppService:
    """
    Main service for WhatsApp integration
    Handles all WhatsApp-related business logic
    """

    def __init__(self):
        self.document_service = DocumentService()
        self.ai_service = AIDocumentIntelligenceService()

    # ========== User Linking ==========

    def generate_linking_token(self, db: Session, user_id: UUID) -> WhatsAppLinkingToken:
        """
        Generate a 6-digit PIN for linking WhatsApp

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Linking token object
        """
        # Invalidate any existing tokens for this user
        db.query(WhatsAppLinkingToken).filter(
            WhatsAppLinkingToken.user_id == user_id,
            WhatsAppLinkingToken.used == False
        ).update({"used": True, "used_at": datetime.now()})
        db.commit()

        # Generate new 6-digit token
        token = str(uuid.uuid4().int)[-6:]  # Last 6 digits of UUID
        expires_at = datetime.now() + timedelta(minutes=10)

        linking_token = WhatsAppLinkingToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        db.add(linking_token)
        db.commit()
        db.refresh(linking_token)

        logger.info(f"Generated linking token for user {user_id}: {token}")
        return linking_token

    def link_whatsapp_account(self, db: Session, token: str, phone_number: str) -> Dict[str, Any]:
        """
        Link WhatsApp account using PIN

        Args:
            db: Database session
            token: 6-digit PIN
            phone_number: Phone number from WhatsApp (E.164 format)

        Returns:
            Result with success/failure
        """
        # Find valid token
        linking_token = db.query(WhatsAppLinkingToken).filter(
            WhatsAppLinkingToken.token == token,
            WhatsAppLinkingToken.used == False,
            WhatsAppLinkingToken.expires_at > datetime.now()
        ).first()

        if not linking_token:
            logger.warning(f"Invalid or expired linking token: {token}")
            return {
                "success": False,
                "error": "Invalid or expired code. Please generate a new code."
            }

        # Get user
        user = db.query(User).filter(User.id == linking_token.user_id).first()
        if not user:
            logger.error(f"User not found for linking token: {linking_token.user_id}")
            return {
                "success": False,
                "error": "User not found"
            }

        # Check if phone already linked to another account
        encrypted_phone = phone_encryption.encrypt_phone(phone_number)
        existing_user = db.query(User).filter(
            User.whatsapp_phone == encrypted_phone,
            User.id != user.id
        ).first()

        if existing_user:
            logger.warning(f"Phone {phone_number} already linked to another account")
            return {
                "success": False,
                "error": "This phone number is already linked to another account"
            }

        # Link account
        user.whatsapp_phone = encrypted_phone
        user.whatsapp_enabled = True
        user.whatsapp_linked_at = datetime.now()
        user.whatsapp_consent_given_at = datetime.now()
        user.whatsapp_session_token = str(uuid.uuid4())  # Generate session token

        # Mark token as used
        linking_token.used = True
        linking_token.used_at = datetime.now()
        linking_token.phone_number = encrypted_phone

        db.commit()

        logger.info(f"Successfully linked WhatsApp for user {user.id}")

        return {
            "success": True,
            "user_id": str(user.id),
            "message": "WhatsApp account linked successfully!"
        }

    def unlink_whatsapp_account(self, db: Session, user_id: UUID) -> bool:
        """
        Unlink WhatsApp account

        Args:
            db: Database session
            user_id: User ID

        Returns:
            True if successful
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        # Clear WhatsApp fields
        user.whatsapp_phone = None
        user.whatsapp_enabled = False
        user.whatsapp_session_token = None

        db.commit()

        logger.info(f"Unlinked WhatsApp for user {user_id}")
        return True

    # ========== Message Processing ==========

    async def process_incoming_message(
        self,
        db: Session,
        from_phone: str,
        message_id: str,
        message_type: str,
        content: Optional[str] = None,
        media_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process incoming WhatsApp message

        Args:
            db: Database session
            from_phone: Sender's phone number (E.164 format)
            message_id: WhatsApp message ID
            message_type: Message type (text, image, document)
            content: Text content (if text message)
            media_id: Media ID (if media message)

        Returns:
            Processing result
        """
        # Authenticate user
        user = self.authenticate_user(db, from_phone)
        if not user:
            # User not linked - send instructions
            await whatsapp_api.send_text_message(
                to=from_phone,
                message="Welcome to SwissAI Tax! To get started, please link your account at https://swissai.tax/settings/whatsapp"
            )
            return {"status": "not_linked"}

        # Save message to database
        message = WhatsAppMessage(
            user_id=user.id,
            message_id=message_id,
            direction="inbound",
            message_type=message_type,
            content=content,
            status="received"
        )
        db.add(message)
        db.commit()

        # Mark as read
        await whatsapp_api.mark_message_as_read(message_id)

        # Process based on type
        if message_type == "text":
            return await self._process_text_message(db, user, content)
        elif message_type in ["image", "document"]:
            return await self._process_media_message(db, user, media_id, message_type)
        else:
            await whatsapp_api.send_text_message(
                to=from_phone,
                message=f"Sorry, {message_type} messages are not supported yet."
            )
            return {"status": "unsupported_type"}

    async def _process_text_message(self, db: Session, user: User, content: str) -> Dict[str, Any]:
        """Process text message (question or command)"""
        content_lower = content.lower().strip()
        phone = phone_encryption.decrypt_phone(user.whatsapp_phone)

        # Check for linking command
        if content_lower.startswith("link "):
            token = content_lower.replace("link ", "").strip()
            result = self.link_whatsapp_account(db, token, phone)

            if result["success"]:
                await whatsapp_api.send_text_message(
                    to=phone,
                    message="✅ Your WhatsApp is now linked to your SwissAI Tax account! You can now send documents and ask tax questions."
                )
            else:
                await whatsapp_api.send_text_message(
                    to=phone,
                    message=f"❌ {result['error']}"
                )
            return result

        # Check for status command
        if content_lower in ["status", "help", "info"]:
            status_message = self._get_user_status_message(db, user)
            await whatsapp_api.send_text_message(to=phone, message=status_message)
            return {"status": "info_sent"}

        # Otherwise, treat as tax question
        try:
            # Use AI service to answer question
            answer = await self.ai_service.answer_tax_question(
                user_id=user.id,
                question=content,
                language=user.preferred_language or 'EN'
            )

            await whatsapp_api.send_text_message(to=phone, message=answer)

            return {"status": "question_answered"}
        except Exception as e:
            logger.error(f"Error processing tax question: {e}")
            await whatsapp_api.send_text_message(
                to=phone,
                message="Sorry, I encountered an error processing your question. Please try again or contact support."
            )
            return {"status": "error", "error": str(e)}

    async def _process_media_message(self, db: Session, user: User, media_id: str, media_type: str) -> Dict[str, Any]:
        """Process media message (document upload)"""
        phone = phone_encryption.decrypt_phone(user.whatsapp_phone)

        try:
            # Download media from WhatsApp
            media_content = await whatsapp_api.download_media(media_id)

            # Determine file extension
            extension = "pdf" if media_type == "document" else "jpg"
            file_name = f"whatsapp_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{extension}"

            # Upload to S3
            s3_key = f"whatsapp/{user.id}/{uuid.uuid4()}.{extension}"
            s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET_NAME,
                Key=s3_key,
                Body=media_content,
                ServerSideEncryption='AES256'
            )

            # Get or create session for user
            session_id = self._get_or_create_session(db, user.id)

            # Save document metadata
            document = self.document_service.save_document_metadata(
                session_id=session_id,
                document_type_id=1,  # Generic document type
                file_name=file_name,
                s3_key=s3_key
            )

            # Start OCR processing if PDF/image
            if media_type in ["document", "image"]:
                self.document_service.process_document_with_textract(document['id'])

            # Send confirmation
            await whatsapp_api.send_text_message(
                to=phone,
                message=f"✅ Document received! I'm processing it now. I'll let you know what I find."
            )

            # TODO: Send results after OCR completes (requires webhook or polling)

            return {"status": "document_uploaded", "document_id": document['id']}

        except Exception as e:
            logger.error(f"Error processing media: {e}")
            await whatsapp_api.send_text_message(
                to=phone,
                message="Sorry, I couldn't process your document. Please try again or upload it via the website."
            )
            return {"status": "error", "error": str(e)}

    # ========== Helper Methods ==========

    def authenticate_user(self, db: Session, phone_number: str) -> Optional[User]:
        """
        Authenticate user by phone number

        Args:
            db: Database session
            phone_number: Phone number in E.164 format

        Returns:
            User object if authenticated, None otherwise
        """
        try:
            encrypted_phone = phone_encryption.encrypt_phone(phone_number)
            user = db.query(User).filter(
                User.whatsapp_phone == encrypted_phone,
                User.whatsapp_enabled == True,
                User.is_active == True
            ).first()

            if user:
                logger.info(f"Authenticated WhatsApp user: {user.id}")
            else:
                logger.warning(f"No user found for phone: {phone_number}")

            return user
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None

    def _get_or_create_session(self, db: Session, user_id: UUID) -> str:
        """Get or create a tax filing session for user"""
        # Check for active session
        # This is simplified - you'll need to adapt to your session model
        from models.tax_filing_session import TaxFilingSession

        session = db.query(TaxFilingSession).filter(
            TaxFilingSession.user_id == user_id,
            TaxFilingSession.status.in_(['active', 'in_progress'])
        ).first()

        if not session:
            # Create new session
            session = TaxFilingSession(
                user_id=user_id,
                tax_year=datetime.now().year - 1,
                status='active'
            )
            db.add(session)
            db.commit()
            db.refresh(session)

        return str(session.id)

    def _get_user_status_message(self, db: Session, user: User) -> str:
        """Generate status message for user"""
        message_count = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.user_id == user.id
        ).count()

        return f"""
📊 *SwissAI Tax - Your Status*

✅ WhatsApp linked
👤 Account: {user.email}
💬 Messages: {message_count}
🗓️ Linked: {user.whatsapp_linked_at.strftime('%d.%m.%Y')}

📱 *Commands:*
- Send a document photo to upload
- Ask any tax question
- Type "help" for more info
- Visit https://swissai.tax for full access
        """.strip()

    def get_message_history(
        self,
        db: Session,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get message history for user"""
        total = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.user_id == user_id
        ).count()

        messages = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.user_id == user_id
        ).order_by(WhatsAppMessage.created_at.desc()).limit(limit).offset(offset).all()

        return {
            "messages": messages,
            "total": total,
            "page": offset // limit + 1,
            "page_size": limit
        }


# Global instance
whatsapp_service = WhatsAppService()
```

---

### 3.8 Create WhatsApp Router

**File:** `backend/routers/whatsapp.py` (NEW)

```python
"""
WhatsApp integration endpoints
Handles webhooks, linking, and message management
"""

import hmac
import hashlib
import logging
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from config import settings
from core.security import get_current_user
from db.session import get_db
from models.swisstax.user import User
from schemas.whatsapp import (
    WhatsAppLinkingResponse,
    WhatsAppUnlinkRequest,
    WhatsAppStatus,
    WhatsAppMessageHistoryResponse,
    WhatsAppWebhookPayload
)
from services.whatsapp_service import whatsapp_service
from utils.whatsapp_encryption import phone_encryption

logger = logging.getLogger(__name__)

router = APIRouter()


# ========== Webhook Endpoints (Public) ==========

@router.get("/webhook")
async def verify_webhook(
    request: Request,
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge")
):
    """
    Webhook verification endpoint (GET)
    Meta will call this to verify the webhook URL
    """
    logger.info(f"Webhook verification request: mode={hub_mode}")

    # Verify token
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN:
        logger.info("Webhook verified successfully")
        return int(hub_challenge)
    else:
        logger.warning("Webhook verification failed - invalid token")
        raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook receiver endpoint (POST)
    Receives messages from WhatsApp
    """
    # Verify signature
    signature = request.headers.get("X-Hub-Signature-256", "")
    if not _verify_webhook_signature(await request.body(), signature):
        logger.error("Invalid webhook signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Parse payload
    try:
        payload = await request.json()
        logger.info(f"Received webhook: {payload}")

        # Extract message data
        if payload.get("object") != "whatsapp_business_account":
            logger.warning(f"Unknown webhook object type: {payload.get('object')}")
            return {"status": "ignored"}

        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})

                # Process messages
                for message in value.get("messages", []):
                    await _process_webhook_message(db, message, value)

                # Process status updates
                for status in value.get("statuses", []):
                    await _process_status_update(db, status)

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        # Return 200 anyway to avoid Meta retrying
        return {"status": "error", "message": str(e)}


async def _process_webhook_message(db: Session, message: dict, value: dict):
    """Process individual webhook message"""
    from_phone = message.get("from")
    message_id = message.get("id")
    message_type = message.get("type")

    # Extract content based on type
    content = None
    media_id = None

    if message_type == "text":
        content = message.get("text", {}).get("body")
    elif message_type == "image":
        media_id = message.get("image", {}).get("id")
    elif message_type == "document":
        media_id = message.get("document", {}).get("id")

    # Format phone number
    if not from_phone.startswith("+"):
        from_phone = f"+{from_phone}"

    # Process message
    await whatsapp_service.process_incoming_message(
        db=db,
        from_phone=from_phone,
        message_id=message_id,
        message_type=message_type,
        content=content,
        media_id=media_id
    )


async def _process_status_update(db: Session, status: dict):
    """Process message status update (delivered, read, etc.)"""
    message_id = status.get("id")
    status_type = status.get("status")  # sent, delivered, read, failed

    logger.info(f"Status update for message {message_id}: {status_type}")

    # Update message status in database
    from models.swisstax.whatsapp_message import WhatsAppMessage
    message = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.message_id == message_id
    ).first()

    if message:
        message.status = status_type
        if status_type == "delivered":
            from datetime import datetime
            message.delivered_at = datetime.now()
        elif status_type == "read":
            message.read_at = datetime.now()
        db.commit()


def _verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """Verify webhook signature from Meta"""
    if not settings.WHATSAPP_WEBHOOK_SECRET:
        logger.warning("Webhook secret not configured - skipping verification")
        return True

    expected_signature = hmac.new(
        settings.WHATSAPP_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    # Signature format: sha256=<hash>
    signature_hash = signature.replace("sha256=", "")

    return hmac.compare_digest(signature_hash, expected_signature)


# ========== User Endpoints (Authenticated) ==========

@router.post("/link", response_model=WhatsAppLinkingResponse)
async def generate_linking_code(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a 6-digit PIN for linking WhatsApp
    User will send this code via WhatsApp to link their account
    """
    if user.whatsapp_enabled:
        raise HTTPException(status_code=400, detail="WhatsApp already linked")

    token = whatsapp_service.generate_linking_token(db, user.id)

    expires_in = int((token.expires_at - token.created_at).total_seconds())

    return WhatsAppLinkingResponse(
        token=token.token,
        expires_at=token.expires_at,
        expires_in_seconds=expires_in,
        instructions=f"Send this message to +41 XX XXX XX XX via WhatsApp:\n\nLINK {token.token}"
    )


@router.post("/unlink")
async def unlink_whatsapp(
    request: WhatsAppUnlinkRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlink WhatsApp account
    """
    if not request.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required")

    if not user.whatsapp_enabled:
        raise HTTPException(status_code=400, detail="WhatsApp not linked")

    success = whatsapp_service.unlink_whatsapp_account(db, user.id)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to unlink WhatsApp")

    return {"message": "WhatsApp unlinked successfully"}


@router.get("/status", response_model=WhatsAppStatus)
async def get_whatsapp_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get WhatsApp integration status for current user
    """
    if not user.whatsapp_enabled:
        return WhatsAppStatus(
            enabled=False,
            linked=False
        )

    # Get message count and last message
    from models.swisstax.whatsapp_message import WhatsAppMessage
    message_count = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.user_id == user.id
    ).count()

    last_message = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.user_id == user.id
    ).order_by(WhatsAppMessage.created_at.desc()).first()

    # Mask phone number
    masked_phone = None
    if user.whatsapp_phone:
        decrypted_phone = phone_encryption.decrypt_phone(user.whatsapp_phone)
        masked_phone = phone_encryption.mask_phone(decrypted_phone)

    return WhatsAppStatus(
        enabled=True,
        linked=True,
        phone_number_masked=masked_phone,
        linked_at=user.whatsapp_linked_at,
        message_count=message_count,
        last_message_at=last_message.created_at if last_message else None
    )


@router.get("/messages", response_model=WhatsAppMessageHistoryResponse)
async def get_message_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get WhatsApp message history for current user
    """
    if not user.whatsapp_enabled:
        raise HTTPException(status_code=400, detail="WhatsApp not linked")

    offset = (page - 1) * page_size

    result = whatsapp_service.get_message_history(
        db=db,
        user_id=user.id,
        limit=page_size,
        offset=offset
    )

    return WhatsAppMessageHistoryResponse(
        messages=result["messages"],
        total=result["total"],
        page=page,
        page_size=page_size
    )
```

---

### 3.9 Register Router in Main App

**File:** `backend/app.py`

Add WhatsApp router:

```python
# Add import at top
from routers import whatsapp

# Add router registration (around line 240, with other routers)
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["whatsapp"])
```

---

### 3.10 Update Requirements

**File:** `backend/requirements.txt`

Add new dependencies:

```txt
# WhatsApp integration
httpx==0.28.1  # Already exists - async HTTP client for WhatsApp API
cryptography==44.0.3  # Already exists - phone encryption
```

No new dependencies needed! All required packages already exist.

---

## Phase 4: Frontend Implementation

### 4.1 Create WhatsApp API Service

**File:** `src/services/whatsappService.js` (NEW)

```javascript
import axios from 'axios';
import config from '../config/environments';

const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.swissai.tax';

class WhatsAppService {
  /**
   * Generate linking code for WhatsApp
   * Returns 6-digit PIN and expiry time
   */
  async generateLinkingCode() {
    try {
      const response = await axios.post(
        `${API_URL}/api/whatsapp/link`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Unlink WhatsApp account
   */
  async unlinkWhatsApp() {
    try {
      const response = await axios.post(
        `${API_URL}/api/whatsapp/unlink`,
        { confirm: true },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Get WhatsApp integration status
   */
  async getStatus() {
    try {
      const response = await axios.get(
        `${API_URL}/api/whatsapp/status`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Get message history
   */
  async getMessageHistory(page = 1, pageSize = 50) {
    try {
      const response = await axios.get(
        `${API_URL}/api/whatsapp/messages`,
        {
          params: { page, page_size: pageSize },
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

const whatsappService = new WhatsAppService();
export default whatsappService;
```

---

### 4.2 Create WhatsApp Settings Component

**File:** `src/components/settings/WhatsAppSettings.jsx` (NEW)

```jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-toastify';
import whatsappService from '../../services/whatsappService';

const WhatsAppSettings = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkingDialogOpen, setLinkingDialogOpen] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [linkingCode, setLinkingCode] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Load WhatsApp status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  // Countdown timer for linking code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && linkingCode) {
      // Code expired
      setLinkingCode(null);
      toast.warning('Linking code expired. Please generate a new one.');
    }
  }, [countdown, linkingCode]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await whatsappService.getStatus();
      setStatus(data);
    } catch (error) {
      toast.error('Failed to load WhatsApp status');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const response = await whatsappService.generateLinkingCode();
      setLinkingCode(response);
      setCountdown(response.expires_in_seconds);
      setLinkingDialogOpen(true);
    } catch (error) {
      toast.error(error.detail || 'Failed to generate linking code');
      console.error(error);
    }
  };

  const handleUnlink = async () => {
    try {
      await whatsappService.unlinkWhatsApp();
      toast.success('WhatsApp unlinked successfully');
      setUnlinkDialogOpen(false);
      await loadStatus();
    } catch (error) {
      toast.error(error.detail || 'Failed to unlink WhatsApp');
      console.error(error);
    }
  };

  const handleCopyCode = () => {
    if (linkingCode) {
      navigator.clipboard.writeText(`LINK ${linkingCode.token}`);
      toast.success('Code copied to clipboard!');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <WhatsAppIcon sx={{ fontSize: 40, color: '#25D366' }} />
          <Typography variant="h5" component="h2">
            WhatsApp Integration
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" paragraph>
          Link your WhatsApp to interact with SwissAI Tax on mobile. Send documents,
          ask questions, and get updates directly via WhatsApp.
        </Typography>

        <Divider sx={{ my: 2 }} />

        {status?.linked ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>WhatsApp Linked</strong>
              <br />
              You can now send documents and ask tax questions via WhatsApp!
            </Alert>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body1">
                  {status.phone_number_masked}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Linked Since
                </Typography>
                <Typography variant="body1">
                  {new Date(status.linked_at).toLocaleDateString('de-CH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Message History
                </Typography>
                <Typography variant="body1">
                  {status.message_count} messages
                  {status.last_message_at && (
                    <span style={{ color: '#666', marginLeft: 8 }}>
                      (Last: {new Date(status.last_message_at).toLocaleDateString('de-CH')})
                    </span>
                  )}
                </Typography>
              </Box>

              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LinkOffIcon />}
                  onClick={() => setUnlinkDialogOpen(true)}
                >
                  Unlink WhatsApp
                </Button>
              </Box>
            </Stack>
          </Box>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              WhatsApp is not linked to your account yet.
            </Alert>

            <Typography variant="body2" paragraph>
              <strong>How to link:</strong>
            </Typography>
            <ol style={{ marginLeft: 20, color: '#666' }}>
              <li>Click "Link WhatsApp" below</li>
              <li>Copy the 6-digit code</li>
              <li>Send it via WhatsApp to our business number</li>
              <li>Your account will be linked instantly!</li>
            </ol>

            <Button
              variant="contained"
              color="success"
              startIcon={<LinkIcon />}
              onClick={handleGenerateCode}
              sx={{ mt: 2, backgroundColor: '#25D366' }}
            >
              Link WhatsApp
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Linking Code Dialog */}
      <Dialog
        open={linkingDialogOpen}
        onClose={() => setLinkingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Link Your WhatsApp
        </DialogTitle>
        <DialogContent>
          {linkingCode && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This code expires in <strong>{formatTime(countdown)}</strong>
              </Alert>

              <Typography variant="body2" paragraph>
                Send this message to <strong>+41 XX XXX XX XX</strong> via WhatsApp:
              </Typography>

              <Box
                sx={{
                  backgroundColor: '#f5f5f5',
                  padding: 3,
                  borderRadius: 2,
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <Typography variant="h3" sx={{ fontFamily: 'monospace', mb: 1 }}>
                  {linkingCode.token}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Or send: LINK {linkingCode.token}
                </Typography>

                <Button
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyCode}
                  sx={{ mt: 2 }}
                  variant="outlined"
                  size="small"
                >
                  Copy Code
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                After sending the code, your WhatsApp will be linked automatically.
                You can close this dialog and refresh the page to see the status.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkingDialogOpen(false)}>
            Close
          </Button>
          <Button onClick={loadStatus} variant="contained">
            Refresh Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog
        open={unlinkDialogOpen}
        onClose={() => setUnlinkDialogOpen(false)}
      >
        <DialogTitle>
          Unlink WhatsApp?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to unlink your WhatsApp account?
            You will no longer be able to send documents or ask questions via WhatsApp.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Your message history will be preserved, but you'll need to link again
            to continue using WhatsApp.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlinkDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUnlink} color="error" variant="contained">
            Unlink
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default WhatsAppSettings;
```

---

### 4.3 Add to Settings Page

**File:** `src/pages/Settings.jsx` (or wherever your settings page is)

```jsx
// Add import
import WhatsAppSettings from '../components/settings/WhatsAppSettings';

// Add to settings sections (example):
<Box sx={{ mb: 4 }}>
  <WhatsAppSettings />
</Box>
```

---

### 4.4 Add Translation Keys

**File:** `src/locales/en/components.json`

```json
{
  "whatsapp": {
    "title": "WhatsApp Integration",
    "description": "Link your WhatsApp to interact with SwissAI Tax on mobile",
    "linked": "WhatsApp Linked",
    "not_linked": "WhatsApp Not Linked",
    "link_button": "Link WhatsApp",
    "unlink_button": "Unlink WhatsApp",
    "generate_code": "Generate Linking Code",
    "code_expires": "Code expires in {time}",
    "send_code": "Send this code via WhatsApp:",
    "copy_code": "Copy Code",
    "phone_number": "Phone Number",
    "linked_since": "Linked Since",
    "message_count": "Message History",
    "unlink_confirm": "Are you sure you want to unlink WhatsApp?",
    "unlink_warning": "You will no longer be able to send documents via WhatsApp"
  }
}
```

**Repeat for:** `de/components.json`, `fr/components.json`, `it/components.json`

---

## Phase 5: Security & Encryption

### 5.1 Security Checklist

**Implement these security measures:**

#### A. Phone Number Encryption
- ✅ Separate encryption key from general S3 encryption
- ✅ Store key in Parameter Store (SecureString)
- ✅ Never log decrypted phone numbers
- ✅ Use constant-time comparison for lookups

#### B. Webhook Security
- ✅ Verify Meta signature (HMAC SHA-256)
- ✅ Validate webhook token on verification
- ✅ Rate limiting (100 requests/hour per user)
- ✅ Deduplication (track processed message IDs)

#### C. User Authentication
- ✅ Encrypt phone number before DB storage
- ✅ Check `whatsapp_enabled` flag
- ✅ Check `is_active` user status
- ✅ Session token validation

#### D. Data Protection
- ✅ S3 encryption at rest (AES-256)
- ✅ TLS in transit (HTTPS only)
- ✅ Media files deleted from WhatsApp CDN after 30 days
- ✅ Local copies in S3 with lifecycle policies

---

### 5.2 Rate Limiting Implementation

**File:** `backend/routers/whatsapp.py`

Add rate limiting to webhook:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Add to webhook endpoint
@router.post("/webhook")
@limiter.limit("100/hour")  # Max 100 webhooks per hour per IP
async def receive_webhook(...):
    ...
```

---

### 5.3 Audit Logging

**Update:** `backend/services/whatsapp_service.py`

Add audit logging for all WhatsApp operations:

```python
from models.audit_log import AuditLog

def _log_audit(self, db: Session, user_id: UUID, action: str, details: dict):
    """Log WhatsApp action to audit log"""
    audit_entry = AuditLog(
        user_id=user_id,
        action=f"whatsapp_{action}",
        details=details,
        ip_address="whatsapp_api",
        user_agent="Meta WhatsApp Cloud API"
    )
    db.add(audit_entry)
    db.commit()

# Add calls throughout service:
self._log_audit(db, user.id, "account_linked", {"phone_masked": phone_encryption.mask_phone(phone)})
self._log_audit(db, user.id, "message_received", {"type": message_type})
self._log_audit(db, user.id, "document_uploaded", {"s3_key": s3_key})
```

---

## Phase 6: Testing Strategy

### 6.1 Unit Tests

**File:** `backend/tests/test_whatsapp_service.py` (NEW)

```python
"""
Unit tests for WhatsApp service
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from services.whatsapp_service import whatsapp_service
from models.swisstax.user import User
from models.swisstax.whatsapp_message import WhatsAppLinkingToken
from utils.whatsapp_encryption import phone_encryption


@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    user = User(
        email="test@example.com",
        first_name="Test",
        last_name="User",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def linked_user(db_session, test_user):
    """Create a user with WhatsApp linked"""
    encrypted_phone = phone_encryption.encrypt_phone("+41791234567")
    test_user.whatsapp_phone = encrypted_phone
    test_user.whatsapp_enabled = True
    test_user.whatsapp_linked_at = datetime.now()
    db_session.commit()
    return test_user


class TestWhatsAppLinking:
    """Test WhatsApp account linking"""

    def test_generate_linking_token(self, db_session, test_user):
        """Test generating a linking token"""
        token = whatsapp_service.generate_linking_token(db_session, test_user.id)

        assert token is not None
        assert len(token.token) == 6
        assert token.user_id == test_user.id
        assert not token.used
        assert token.expires_at > datetime.now()

    def test_link_whatsapp_account_success(self, db_session, test_user):
        """Test successful account linking"""
        # Generate token
        token = whatsapp_service.generate_linking_token(db_session, test_user.id)

        # Link account
        result = whatsapp_service.link_whatsapp_account(
            db_session,
            token.token,
            "+41791234567"
        )

        assert result["success"] is True

        # Verify user updated
        db_session.refresh(test_user)
        assert test_user.whatsapp_enabled is True
        assert test_user.whatsapp_phone is not None

    def test_link_with_invalid_token(self, db_session, test_user):
        """Test linking with invalid token"""
        result = whatsapp_service.link_whatsapp_account(
            db_session,
            "999999",
            "+41791234567"
        )

        assert result["success"] is False
        assert "Invalid or expired" in result["error"]

    def test_link_with_expired_token(self, db_session, test_user):
        """Test linking with expired token"""
        # Create expired token
        token = WhatsAppLinkingToken(
            user_id=test_user.id,
            token="123456",
            expires_at=datetime.now() - timedelta(minutes=1)
        )
        db_session.add(token)
        db_session.commit()

        result = whatsapp_service.link_whatsapp_account(
            db_session,
            "123456",
            "+41791234567"
        )

        assert result["success"] is False

    def test_link_duplicate_phone(self, db_session, test_user, linked_user):
        """Test linking phone already used by another user"""
        token = whatsapp_service.generate_linking_token(db_session, test_user.id)

        result = whatsapp_service.link_whatsapp_account(
            db_session,
            token.token,
            "+41791234567"  # Same phone as linked_user
        )

        assert result["success"] is False
        assert "already linked" in result["error"]

    def test_unlink_whatsapp_account(self, db_session, linked_user):
        """Test unlinking WhatsApp"""
        success = whatsapp_service.unlink_whatsapp_account(db_session, linked_user.id)

        assert success is True

        db_session.refresh(linked_user)
        assert linked_user.whatsapp_enabled is False
        assert linked_user.whatsapp_phone is None


class TestWhatsAppAuthentication:
    """Test WhatsApp user authentication"""

    def test_authenticate_linked_user(self, db_session, linked_user):
        """Test authenticating a linked user"""
        user = whatsapp_service.authenticate_user(db_session, "+41791234567")

        assert user is not None
        assert user.id == linked_user.id

    def test_authenticate_non_linked_user(self, db_session, test_user):
        """Test authenticating non-linked user"""
        user = whatsapp_service.authenticate_user(db_session, "+41799999999")

        assert user is None

    def test_authenticate_inactive_user(self, db_session, linked_user):
        """Test authenticating inactive user"""
        linked_user.is_active = False
        db_session.commit()

        user = whatsapp_service.authenticate_user(db_session, "+41791234567")

        assert user is None


class TestPhoneEncryption:
    """Test phone number encryption"""

    def test_encrypt_decrypt_phone(self):
        """Test encryption and decryption"""
        phone = "+41791234567"

        encrypted = phone_encryption.encrypt_phone(phone)
        assert encrypted != phone
        assert len(encrypted) > 0

        decrypted = phone_encryption.decrypt_phone(encrypted)
        assert decrypted == phone

    def test_mask_phone_swiss(self):
        """Test masking Swiss phone number"""
        masked = phone_encryption.mask_phone("+41791234567")

        assert masked == "+41 79 *** ** 67"
        assert "+41" in masked
        assert "79" in masked
        assert "67" in masked
        assert "***" in masked

    def test_encrypt_invalid_phone(self):
        """Test encrypting invalid phone number"""
        with pytest.raises(ValueError):
            phone_encryption.encrypt_phone("123456")  # Missing +


# Run tests with:
# pytest backend/tests/test_whatsapp_service.py -v
```

---

### 6.2 Integration Tests

**File:** `backend/tests/test_whatsapp_webhook.py` (NEW)

```python
"""
Integration tests for WhatsApp webhook endpoints
"""

import pytest
import hmac
import hashlib
from fastapi.testclient import TestClient

from app import app
from config import settings


client = TestClient(app)


def create_webhook_signature(payload: str) -> str:
    """Create valid webhook signature"""
    signature = hmac.new(
        settings.WHATSAPP_WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


class TestWebhookVerification:
    """Test webhook verification endpoint"""

    def test_verify_webhook_success(self):
        """Test successful webhook verification"""
        response = client.get(
            "/api/whatsapp/webhook",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
                "hub.challenge": "1234567890"
            }
        )

        assert response.status_code == 200
        assert response.text == "1234567890"

    def test_verify_webhook_invalid_token(self):
        """Test webhook verification with invalid token"""
        response = client.get(
            "/api/whatsapp/webhook",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": "wrong_token",
                "hub.challenge": "1234567890"
            }
        )

        assert response.status_code == 403


class TestWebhookMessage:
    """Test webhook message processing"""

    def test_receive_text_message(self):
        """Test receiving text message webhook"""
        payload = {
            "object": "whatsapp_business_account",
            "entry": [{
                "id": "123456",
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "messages": [{
                            "from": "41791234567",
                            "id": "wamid.xxx",
                            "timestamp": "1234567890",
                            "type": "text",
                            "text": {
                                "body": "Hello SwissAI Tax"
                            }
                        }]
                    }
                }]
            }]
        }

        import json
        payload_str = json.dumps(payload)
        signature = create_webhook_signature(payload_str)

        response = client.post(
            "/api/whatsapp/webhook",
            json=payload,
            headers={"X-Hub-Signature-256": signature}
        )

        assert response.status_code == 200
        assert response.json()["status"] in ["ok", "not_linked"]

    def test_receive_webhook_invalid_signature(self):
        """Test webhook with invalid signature"""
        payload = {"object": "whatsapp_business_account", "entry": []}

        response = client.post(
            "/api/whatsapp/webhook",
            json=payload,
            headers={"X-Hub-Signature-256": "sha256=invalid"}
        )

        assert response.status_code == 403


# Run with:
# pytest backend/tests/test_whatsapp_webhook.py -v
```

---

### 6.3 Frontend Tests

**File:** `src/components/settings/__tests__/WhatsAppSettings.test.jsx` (NEW)

```jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WhatsAppSettings from '../WhatsAppSettings';
import whatsappService from '../../../services/whatsappService';

// Mock the service
jest.mock('../../../services/whatsappService');

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <WhatsAppSettings />
    </BrowserRouter>
  );
};

describe('WhatsAppSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    whatsappService.getStatus.mockResolvedValue({ linked: false });

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders not linked state', async () => {
    whatsappService.getStatus.mockResolvedValue({
      enabled: false,
      linked: false
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/WhatsApp is not linked/i)).toBeInTheDocument();
      expect(screen.getByText('Link WhatsApp')).toBeInTheDocument();
    });
  });

  test('renders linked state with details', async () => {
    whatsappService.getStatus.mockResolvedValue({
      enabled: true,
      linked: true,
      phone_number_masked: '+41 79 *** ** 67',
      linked_at: '2025-01-15T10:00:00Z',
      message_count: 42,
      last_message_at: '2025-10-11T15:30:00Z'
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/WhatsApp Linked/i)).toBeInTheDocument();
      expect(screen.getByText('+41 79 *** ** 67')).toBeInTheDocument();
      expect(screen.getByText(/42 messages/i)).toBeInTheDocument();
    });
  });

  test('generates linking code when button clicked', async () => {
    whatsappService.getStatus.mockResolvedValue({ linked: false });
    whatsappService.generateLinkingCode.mockResolvedValue({
      token: '123456',
      expires_at: new Date(Date.now() + 600000).toISOString(),
      expires_in_seconds: 600
    });

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Link WhatsApp'));
    });

    await waitFor(() => {
      expect(screen.getByText('123456')).toBeInTheDocument();
      expect(whatsappService.generateLinkingCode).toHaveBeenCalledTimes(1);
    });
  });

  test('unlinks WhatsApp when confirmed', async () => {
    whatsappService.getStatus.mockResolvedValue({
      enabled: true,
      linked: true,
      phone_number_masked: '+41 79 *** ** 67',
      linked_at: '2025-01-15T10:00:00Z'
    });
    whatsappService.unlinkWhatsApp.mockResolvedValue({ message: 'Success' });

    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Unlink WhatsApp'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /unlink/i }));

    await waitFor(() => {
      expect(whatsappService.unlinkWhatsApp).toHaveBeenCalledTimes(1);
    });
  });

  test('handles API errors gracefully', async () => {
    whatsappService.getStatus.mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      // Component should render without crashing
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});

// Run with:
// npm test -- WhatsAppSettings
```

---

### 6.4 Manual Testing Checklist

**Test these scenarios manually:**

#### Account Linking
- [ ] Generate linking code from web app
- [ ] Code displays correctly with countdown
- [ ] Send "LINK <code>" via WhatsApp
- [ ] Account links successfully
- [ ] Web app shows linked status
- [ ] Email notification sent
- [ ] Can't use same code twice
- [ ] Expired code (after 10 min) shows error

#### Message Processing
- [ ] Send text message → receive AI response
- [ ] Send photo of document → receives confirmation
- [ ] Document appears in web app
- [ ] OCR processing completes
- [ ] Extracted data shown in web app
- [ ] Send "help" → receives help text
- [ ] Send "status" → receives status

#### Security
- [ ] Can't link same phone to multiple accounts
- [ ] Unlinked user receives instructions
- [ ] Phone number masked in UI
- [ ] Webhook signature validation works
- [ ] Rate limiting prevents spam

#### Data Protection
- [ ] Documents stored encrypted in S3
- [ ] Audit logs created for all actions
- [ ] Can export WhatsApp data
- [ ] Account deletion removes WhatsApp link

---

## Phase 7: Deployment & Rollout

### 7.1 Pre-Deployment Checklist

**Complete these before deploying:**

#### Infrastructure
- [ ] AWS Parameter Store configured with all secrets
- [ ] Meta WhatsApp Business account verified
- [ ] Webhook URL accessible (https://api.swissai.tax/api/whatsapp/webhook)
- [ ] IAM roles updated with WhatsApp permissions
- [ ] S3 lifecycle policies applied
- [ ] CloudWatch alarms created

#### Database
- [ ] All migrations tested in staging
- [ ] Migrations run successfully in production
- [ ] Indexes created and working
- [ ] Cleanup functions deployed

#### Code
- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Frontend builds without errors
- [ ] Backend starts without errors
- [ ] Security audit completed
- [ ] GDPR compliance verified

---

### 7.2 Deployment Steps

**Deploy in this order:**

#### Step 1: Database Migration (Week 6, Day 1)
```bash
# Production deployment

# 1. Backup database
aws rds create-db-snapshot \
  --db-instance-identifier swissai-tax-db \
  --db-snapshot-identifier swissai-tax-before-whatsapp-$(date +%Y%m%d)

# 2. Run migrations
cd backend
alembic upgrade head

# 3. Verify tables
psql $DATABASE_URL -c "\dt swisstax.whatsapp*"
```

#### Step 2: Backend Deployment (Week 6, Day 1)
```bash
# App Runner will auto-deploy from GitHub

# 1. Merge to main branch
git checkout main
git merge feature/whatsapp-integration
git push origin main

# 2. Monitor deployment
aws apprunner list-operations \
  --service-arn <YOUR_SERVICE_ARN> \
  --region us-east-1

# 3. Check health
curl https://api.swissai.tax/health

# 4. Verify WhatsApp endpoints
curl https://api.swissai.tax/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=test
```

#### Step 3: Configure Meta Webhook (Week 6, Day 2)
```bash
# In Meta Developer Console:
# 1. Go to WhatsApp → Configuration
# 2. Set Webhook URL: https://api.swissai.tax/api/whatsapp/webhook
# 3. Set Verify Token: <from Parameter Store>
# 4. Subscribe to: messages, message_status
# 5. Click "Verify and Save"
```

#### Step 4: Frontend Deployment (Week 6, Day 2)
```bash
# AWS Amplify will auto-deploy from GitHub

# 1. Merge to main
git push origin main

# 2. Monitor build
aws amplify start-job \
  --app-id <YOUR_APP_ID> \
  --branch-name main \
  --job-type RELEASE

# 3. Verify deployment
curl https://swissai.tax

# 4. Test WhatsApp settings page
open https://swissai.tax/settings
```

---

### 7.3 Rollout Strategy

**Phased rollout to minimize risk:**

#### Phase 1: Internal Testing (Week 6, Days 1-2)
- Enable for internal team only (5 users)
- Test all scenarios
- Monitor logs and metrics
- Fix any critical issues

#### Phase 2: Beta Users (Week 6, Days 3-5)
- Enable for 50 beta users
- Announce via email
- Gather feedback
- Monitor performance
- Iterate on UX issues

#### Phase 3: Limited Release (Week 7, Days 1-3)
- Enable for 500 users (10% of user base)
- Monitor system load
- Track usage metrics
- Optimize performance

#### Phase 4: Full Release (Week 7, Day 4+)
- Enable for all users
- Major announcement (email, social media)
- Create help documentation
- Monitor support requests

---

### 7.4 Rollback Plan

**If critical issues occur:**

```bash
# Emergency Rollback Procedure

# 1. Disable webhook in Meta console
# 2. Revert backend deployment
git revert <whatsapp_commit_hash>
git push origin main

# 3. Revert database migrations (if necessary)
cd backend
alembic downgrade -1  # Or specific revision

# 4. Notify users
# 5. Investigate issue
# 6. Fix and re-deploy
```

---

## Monitoring & Maintenance

### 8.1 Metrics to Track

**Monitor these KPIs:**

#### Usage Metrics
- Number of linked accounts (daily)
- Messages received per day
- Documents uploaded via WhatsApp per day
- Average response time
- User satisfaction (from feedback)

#### Technical Metrics
- Webhook processing time (avg, p95, p99)
- WhatsApp API error rate
- OCR processing success rate
- S3 upload success rate
- Database query performance

#### Business Metrics
- WhatsApp vs web upload ratio
- Conversion rate (linked users → paid)
- Feature engagement
- Support ticket volume

---

### 8.2 CloudWatch Dashboards

**Create dashboard:** `SwissAI-WhatsApp-Metrics`

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["SwissAI/WhatsApp", "MessageReceived"],
          [".", "MessageSent"],
          [".", "ErrorCount"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "WhatsApp Message Volume"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["SwissAI/WhatsApp", "ProcessingDuration", { "stat": "Average" }],
          ["...", { "stat": "p95" }],
          ["...", { "stat": "p99" }]
        ],
        "period": 300,
        "region": "us-east-1",
        "title": "Processing Latency"
      }
    }
  ]
}
```

---

### 8.3 Maintenance Tasks

**Schedule these regular tasks:**

#### Daily
- Check CloudWatch alarms
- Review error logs
- Monitor webhook queue (if using async processing)

#### Weekly
- Clean up expired linking tokens
- Review usage metrics
- Check S3 storage costs
- Review user feedback

#### Monthly
- Rotate WhatsApp API keys (if recommended by Meta)
- Review and optimize database indexes
- Update security patches
- Backup WhatsApp message history

---

## Cost Analysis

### 9.1 Monthly Cost Breakdown

**Estimated costs for 5,000 active users:**

| Service | Volume | Unit Cost | Monthly Cost |
|---------|--------|-----------|--------------|
| WhatsApp Messages (inbound) | 15,000 | FREE | $0 |
| WhatsApp Messages (outbound) | 20,000 | $0.005 | $100 |
| S3 Storage (media) | 50 GB | $0.023/GB | $1.15 |
| S3 Requests | 100,000 | $0.0004/1000 | $0.04 |
| Textract (OCR) | 5,000 pages | $1.50/1000 | $7.50 |
| Parameter Store | 10 params | FREE | $0 |
| CloudWatch Logs | 10 GB | $0.50/GB | $5.00 |
| **TOTAL** | | | **~$114/month** |

**Notes:**
- WhatsApp costs scale linearly with usage
- Meta offers 1,000 free "service conversations" per month
- A "service conversation" = 24-hour window from user message
- S3 costs minimal due to lifecycle policies

---

### 9.2 Cost Optimization Tips

1. **Batch responses** within 24-hour window (1 service conversation)
2. **Use templates** for common responses (lower cost)
3. **Lifecycle policies** move old media to Glacier
4. **Compress images** before S3 upload
5. **Cache OCR results** to avoid re-processing

---

## Risk Assessment

### 10.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WhatsApp API outage | High | Low | Graceful degradation, status page |
| Phone number takeover | Critical | Very Low | Email notifications, re-verification |
| S3 bucket misconfiguration | Critical | Low | IaC, automated tests, least privilege |
| Database performance | Medium | Medium | Indexes, connection pooling, monitoring |
| OCR processing delays | Low | Medium | Async processing, status updates |

---

### 10.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption rate | Medium | Medium | Marketing, user education, incentives |
| High support volume | Medium | Medium | Comprehensive docs, FAQ, automation |
| Meta policy changes | High | Low | Monitor Meta updates, backup plan |
| GDPR compliance issues | Critical | Very Low | Legal review, audit, documentation |

---

### 10.3 Security Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data breach via WhatsApp | Critical | Very Low | Encryption, audit logs, access control |
| Webhook forgery | High | Low | Signature verification, rate limiting |
| Phone enumeration attack | Medium | Low | Rate limiting, CAPTCHA on linking |
| Unauthorized account access | High | Very Low | Strong auth, session management |

---

## Appendix

### A. Environment Variables

**Complete list of environment variables:**

```bash
# WhatsApp API
WHATSAPP_API_KEY=<from Parameter Store>
WHATSAPP_PHONE_NUMBER_ID=<from Parameter Store>
WHATSAPP_BUSINESS_ACCOUNT_ID=<from Parameter Store>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<from Parameter Store>
WHATSAPP_WEBHOOK_SECRET=<from Parameter Store>
WHATSAPP_PHONE_ENCRYPTION_KEY=<from Parameter Store>

# Existing (no changes)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=swissai-tax-documents-1758721021
POSTGRES_HOST=<from Parameter Store>
POSTGRES_DB=swissai_tax
# ... etc
```

---

### B. API Documentation

**WhatsApp endpoints:**

```yaml
/api/whatsapp/webhook:
  get:
    summary: Verify webhook (Meta calls this)
    parameters:
      - hub.mode
      - hub.verify_token
      - hub.challenge
    responses:
      200: Challenge value (int)
      403: Verification failed

  post:
    summary: Receive webhook messages
    security:
      - Meta signature verification
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/WhatsAppWebhookPayload'
    responses:
      200: Message processed

/api/whatsapp/link:
  post:
    summary: Generate linking PIN
    security:
      - JWT token (httpOnly cookie)
    responses:
      200: Linking code with expiry
      400: Already linked

/api/whatsapp/unlink:
  post:
    summary: Unlink WhatsApp
    security:
      - JWT token
    requestBody:
      content:
        application/json:
          schema:
            properties:
              confirm:
                type: boolean
    responses:
      200: Successfully unlinked
      400: Not linked or confirmation missing

/api/whatsapp/status:
  get:
    summary: Get WhatsApp integration status
    security:
      - JWT token
    responses:
      200: Status with details

/api/whatsapp/messages:
  get:
    summary: Get message history
    security:
      - JWT token
    parameters:
      - page (int, default: 1)
      - page_size (int, default: 50, max: 100)
    responses:
      200: Paginated message history
```

---

### C. Meta Webhook Payload Examples

**Text message:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "123456",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "41123456789",
          "phone_number_id": "123456"
        },
        "contacts": [{
          "profile": {
            "name": "John Doe"
          },
          "wa_id": "41791234567"
        }],
        "messages": [{
          "from": "41791234567",
          "id": "wamid.xxx",
          "timestamp": "1697123456",
          "type": "text",
          "text": {
            "body": "What's my tax rate?"
          }
        }]
      }
    }]
  }]
}
```

**Image message:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "41791234567",
          "id": "wamid.yyy",
          "timestamp": "1697123456",
          "type": "image",
          "image": {
            "caption": "My Lohnausweis",
            "mime_type": "image/jpeg",
            "sha256": "abc123...",
            "id": "media_id_123"
          }
        }]
      }
    }]
  }]
}
```

**Status update:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1697123456",
          "recipient_id": "41791234567"
        }]
      }
    }]
  }]
}
```

---

### D. Support Documentation

**User guide outline:**

1. **What is WhatsApp Integration?**
   - Benefits
   - How it works
   - Privacy & security

2. **How to Link WhatsApp**
   - Step-by-step guide
   - Screenshots
   - Troubleshooting

3. **Using WhatsApp**
   - Sending documents
   - Asking questions
   - Getting updates

4. **Commands**
   - LINK <code>
   - HELP
   - STATUS

5. **FAQ**
   - Is my data safe?
   - Can I unlink?
   - What types of documents?
   - Response time?

6. **Troubleshooting**
   - Code expired
   - Can't link
   - Not receiving messages

---

## Summary

**Total Implementation:**
- **Timeline:** 6 weeks
- **New files:** ~15 backend, ~5 frontend
- **Database tables:** 2 new, 1 modified
- **API endpoints:** 6 new
- **Tests:** 50+ unit tests, 20+ integration tests
- **Estimated cost:** $100-150/month for 5,000 users
- **Team:** 2-3 developers

**Key Benefits:**
✅ Seamless document uploads via mobile
✅ AI-powered tax assistance on WhatsApp
✅ 80% code reuse from existing infrastructure
✅ GDPR compliant with Swiss data protection
✅ Secure phone number encryption
✅ Complete audit trail

**Next Steps:**
1. Review and approve this plan
2. Set up Meta WhatsApp Business account (2-3 weeks approval)
3. Configure AWS Parameter Store
4. Begin Phase 1: Database migrations
5. Iterate through phases 2-7

---

**Document Version:** 1.0
**Last Updated:** 2025-10-11
**Author:** SwissAI Tax Development Team
**Status:** Ready for Implementation
