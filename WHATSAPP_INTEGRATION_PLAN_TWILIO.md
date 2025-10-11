# WhatsApp Integration Implementation Plan (Twilio)
## SwissAI Tax - Detailed Technical Specification

**Version:** 2.0 (Twilio)
**Date:** 2025-10-11
**Status:** Planning - Twilio Implementation
**Estimated Timeline:** 4 weeks (faster than Meta Direct)
**Team Required:** 2-3 developers

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Why Twilio vs Meta Direct](#why-twilio-vs-meta-direct)
3. [Architecture Overview](#architecture-overview)
4. [Phase 1: Twilio Setup](#phase-1-twilio-setup)
5. [Phase 2: Database Changes](#phase-2-database-changes)
6. [Phase 3: Backend Implementation](#phase-3-backend-implementation)
7. [Phase 4: Frontend Implementation](#phase-4-frontend-implementation)
8. [Phase 5: Security & Encryption](#phase-5-security--encryption)
9. [Phase 6: Testing Strategy](#phase-6-testing-strategy)
10. [Phase 7: Deployment & Rollout](#phase-7-deployment--rollout)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Cost Analysis](#cost-analysis)
13. [Migration to Meta Direct (Optional)](#migration-to-meta-direct-optional)

---

## Executive Summary

### Objective
Enable SwissAI Tax users to interact with the tax filing system via WhatsApp using **Twilio's WhatsApp Business API**, including:
- Document uploads (Lohnausweis, 3a statements, etc.)
- AI-powered tax questions and answers
- Status updates on tax filing progress
- Secure account linking with existing web authentication

### Key Benefits
- **Fast launch**: 4 weeks instead of 6 weeks (no Meta verification wait)
- **Better developer experience**: Twilio SDK simplifies integration
- **Excellent support**: 24/7 Twilio support during critical launch phase
- **EU data residency**: Twilio Ireland region for GDPR compliance
- **Easy migration path**: Can switch to Meta Direct later if needed

### Success Metrics
- 30% of users link WhatsApp within 3 months
- 50% reduction in document upload drop-off
- Average response time under 30 seconds for AI queries
- Zero security incidents related to WhatsApp integration
- >99.5% uptime during business hours

### Cost-Benefit Analysis
**Additional cost vs Meta Direct:** CHF 100-200/month initially
**Benefits:**
- Launch 2-3 weeks earlier
- 20-30 hours less development time (value: CHF 3,000-4,500)
- Support during critical launch phase
- **Net value: CHF 2,800-4,300 in first 6 months**

---

## Why Twilio vs Meta Direct

### Comparison Matrix

| Factor | Twilio | Meta Direct |
|--------|--------|-------------|
| **Setup Time** | 1-2 days | 2-3 weeks (verification) |
| **Technical Complexity** | Low (SDK provided) | Medium (REST API only) |
| **Developer Experience** | Excellent | Good |
| **Documentation** | Excellent | Good |
| **Support** | 24/7 email/chat | Self-service |
| **Cost (3K conv/month)** | CHF 186 | CHF 81 |
| **Free Tier** | No | Yes (1,000/month) |
| **EU Data Centers** | ✅ Ireland | ✅ Ireland/Netherlands |
| **Phone Provisioning** | Twilio provides | Bring your own |
| **Migration Path** | Can switch to Meta later | - |

### Decision: Start with Twilio

**Rationale:**
1. **Speed to market** - Launch before tax season
2. **Validate concept** - Test if users actually use WhatsApp
3. **Development efficiency** - SDK saves 20-30 hours
4. **Risk mitigation** - Professional support during launch
5. **Cost acceptable** - CHF 100-200/month is negligible vs delayed launch

**Future option:** Migrate to Meta Direct at Month 6 if volume justifies (>5,000 conversations/month)

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
│  Meta WhatsApp Servers          │
│  (End-to-end encrypted)         │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  Twilio WhatsApp API            │
│  (Ireland - EU Region)          │
│  - Message routing              │
│  - Media hosting                │
│  - Status tracking              │
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
           └──→ Send Response → Twilio API
```

### Technology Stack (New Components)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| WhatsApp API | **Twilio WhatsApp API** | Message sending/receiving |
| Twilio SDK | twilio-python | Simplified API integration |
| Encryption | Cryptography (Fernet) | Phone number encryption |
| Message Queue | Redis (optional) | Webhook deduplication |
| Webhook Validation | Twilio signature verification | Verify webhook authenticity |

---

## Phase 1: Twilio Setup

### 1.1 Create Twilio Account (Day 1 - 15 minutes)

**Steps:**

1. **Sign up for Twilio**
   - Go to: https://www.twilio.com/try-twilio
   - Click "Sign up"
   - Enter:
     - Email: tech@swissai.tax
     - Password: (strong password)
     - First/Last name
     - Company: SwissAI Tax

2. **Verify email and phone**
   - Check email for verification link
   - Verify phone number via SMS

3. **Complete profile**
   - Company type: Business
   - Industry: Financial Services
   - Use case: Customer Support
   - Expected monthly volume: 1,000-5,000 messages

4. **Billing setup**
   - Add credit card (no charge yet)
   - Set up billing alerts (optional)
   - Budget: CHF 200-300/month

**Result:** Twilio account created (takes 15 minutes)

---

### 1.2 Configure EU Data Residency (Day 1 - 5 minutes)

**CRITICAL for GDPR compliance**

**Steps:**

1. Log in to Twilio Console: https://console.twilio.com
2. Go to: **Settings → General**
3. Scroll to **Data Residency**
4. Select: **Ireland (EU) - ie1**
5. Click **Save**

**Verify:**
```bash
# All new resources will use EU region
# Phone numbers, messages, logs stay in EU
```

**Important:** Set this BEFORE creating any resources!

---

### 1.3 Enable WhatsApp (Day 1 - 10 minutes)

**Steps:**

1. In Twilio Console → **Messaging** → **Try it out**
2. Find **WhatsApp** section
3. Click **Get started with WhatsApp**
4. Follow guided setup:
   - Accept Meta's terms
   - Connect to WhatsApp Business API
5. Complete business profile:
   - Business name: SwissAI Tax
   - Business description: AI-powered Swiss tax filing assistant
   - Website: https://swissai.tax
   - Category: Finance
   - Address: Your business address

**Result:** WhatsApp enabled on Twilio account

---

### 1.4 Get Twilio WhatsApp Sandbox (Day 1 - Testing)

**For immediate testing (before production number):**

1. Console → Messaging → Try WhatsApp
2. Copy **Sandbox number**: `whatsapp:+14155238886`
3. Follow instructions to join sandbox:
   - Send `join <your-code>` from your personal WhatsApp
   - Example: `join water-clock`
4. Test sending message via API:

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "From=whatsapp:+14155238886" \
  --data-urlencode "To=whatsapp:+41791234567" \
  --data-urlencode "Body=Hello from SwissAI Tax!" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

**Result:** Can test immediately with sandbox

---

### 1.5 Request Production WhatsApp Number (Day 1-2)

**Option A: Use existing number (if you have one)**

1. Console → Phone Numbers → Buy a Number
2. Select: **WhatsApp Enabled**
3. Country: Switzerland (+41)
4. Click **Search**
5. Pick number → **Buy** (CHF 2-5/month)
6. Configure for WhatsApp:
   - Enable WhatsApp messaging
   - Set webhook URL (will configure later)

**Option B: Use Twilio-provided number**

1. Console → Messaging → WhatsApp → Senders
2. Click **New Sender**
3. Select **Twilio Number**
4. Choose country: Switzerland
5. Twilio provisions number automatically

**Business Profile Submission:**

After number assigned:
1. Fill out business profile
2. Submit for Facebook review (1-3 days)
3. While waiting, continue development with sandbox

**Timeline:** 1-3 days for approval (vs 2-3 weeks for Meta Direct)

---

### 1.6 Get API Credentials (Day 1 - 5 minutes)

**Find your credentials:**

1. Console → Account Dashboard
2. Copy these values:

```
TWILIO_ACCOUNT_SID:
(Format: AC################################)

TWILIO_AUTH_TOKEN:
(Format: 32-character string)
Click "Show" to reveal

TWILIO_WHATSAPP_NUMBER:
(Format: +14155238886 or your production number)
```

**Save to AWS Parameter Store:**

```bash
#!/bin/bash
# infrastructure/setup-twilio-parameters.sh

AWS_REGION="us-east-1"

# Twilio API credentials
aws ssm put-parameter \
  --name "/swissai-tax/twilio/account-sid" \
  --value "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  --type "String" \
  --description "Twilio Account SID" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/swissai-tax/twilio/auth-token" \
  --value "your_auth_token_here" \
  --type "SecureString" \
  --description "Twilio Auth Token (sensitive)" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/swissai-tax/twilio/whatsapp-number" \
  --value "+14155238886" \
  --type "String" \
  --description "Twilio WhatsApp sender number" \
  --region $AWS_REGION

# Webhook validation (for securing your endpoint)
aws ssm put-parameter \
  --name "/swissai-tax/twilio/webhook-auth-token" \
  --value "$(openssl rand -hex 32)" \
  --type "SecureString" \
  --description "Token for webhook authentication" \
  --region $AWS_REGION

# Encryption key for phone numbers (separate from general encryption)
aws ssm put-parameter \
  --name "/swissai-tax/whatsapp/phone-encryption-key" \
  --value "$(python3 -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')" \
  --type "SecureString" \
  --description "Encryption key for WhatsApp phone numbers" \
  --region $AWS_REGION

echo "✅ All Twilio parameters created successfully"
```

---

### 1.7 S3 Bucket Configuration (Same as before)

**No changes needed** - use existing bucket structure:

```bash
swissai-tax-documents-1758721021/
├── documents/{session_id}/...  (existing)
└── whatsapp/{user_id}/
    ├── media/{message_id}.{ext}
    └── temp/{upload_id}.{ext}
```

Apply lifecycle policy:

```bash
# infrastructure/setup-whatsapp-s3-lifecycle.sh

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

---

### 1.8 IAM Permissions Update (Same as before)

App Runner role needs S3 and Parameter Store access:

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
      "Sid": "TwilioParameterStoreAccess",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:ssm:us-east-1:*:parameter/swissai-tax/twilio/*",
        "arn:aws:ssm:us-east-1:*:parameter/swissai-tax/whatsapp/*"
      ]
    }
  ]
}
```

---

### 1.9 CloudWatch Setup (Same as before)

```bash
# infrastructure/setup-whatsapp-cloudwatch.sh

# Alarm 1: High webhook error rate
aws cloudwatch put-metric-alarm \
  --alarm-name "WhatsApp-Twilio-WebhookErrors-High" \
  --alarm-description "WhatsApp Twilio webhook error rate above 5%" \
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
  --alarm-name "WhatsApp-Twilio-ProcessingLatency-High" \
  --alarm-description "Twilio message processing taking >30s" \
  --metric-name ProcessingDuration \
  --namespace SwissAI/WhatsApp \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 30000 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

---

## Phase 2: Database Changes

**No changes from original plan** - database structure is the same regardless of Twilio vs Meta.

Use the same 3 Alembic migrations from original plan:
1. `add_whatsapp_fields_to_users`
2. `create_whatsapp_messages_table`
3. `create_whatsapp_linking_tokens_table`

See original plan document for complete migration code.

---

## Phase 3: Backend Implementation

### 3.1 Install Twilio SDK

**File:** `backend/requirements.txt`

Add Twilio dependency:

```txt
# WhatsApp integration (Twilio)
twilio==9.0.4  # Twilio Python SDK
cryptography==44.0.3  # Already exists - phone encryption
```

Install:
```bash
cd backend
pip install twilio==9.0.4
```

---

### 3.2 Update Configuration

**File:** `backend/config.py`

```python
# In backend/config.py, add to Settings class:

class Settings(BaseSettings):
    # ... existing fields ...

    # ========== Twilio WhatsApp Settings ==========
    TWILIO_ACCOUNT_SID: str | None = Field(None, description="Twilio Account SID")
    TWILIO_AUTH_TOKEN: str | None = Field(None, description="Twilio Auth Token")
    TWILIO_WHATSAPP_NUMBER: str | None = Field(None, description="Twilio WhatsApp sender number")
    TWILIO_WEBHOOK_AUTH_TOKEN: str | None = Field(None, description="Token for webhook authentication")
    WHATSAPP_PHONE_ENCRYPTION_KEY: str | None = Field(None, description="Encryption key for phone numbers")

    def _load_from_parameter_store(self):
        """Try to load values from AWS Parameter Store"""
        # ... existing code ...

        param_mappings = {
            # ... existing mappings ...

            # Twilio parameters
            '/swissai-tax/twilio/account-sid': 'TWILIO_ACCOUNT_SID',
            '/swissai-tax/twilio/auth-token': 'TWILIO_AUTH_TOKEN',
            '/swissai-tax/twilio/whatsapp-number': 'TWILIO_WHATSAPP_NUMBER',
            '/swissai-tax/twilio/webhook-auth-token': 'TWILIO_WEBHOOK_AUTH_TOKEN',
            '/swissai-tax/whatsapp/phone-encryption-key': 'WHATSAPP_PHONE_ENCRYPTION_KEY',
        }

        # ... rest of existing code ...
```

---

### 3.3 Create Twilio Service

**File:** `backend/services/twilio_whatsapp_service.py` (NEW)

```python
"""
Twilio WhatsApp API service
Simplified integration using Twilio's Python SDK
"""

import logging
from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from config import settings

logger = logging.getLogger(__name__)


class TwilioWhatsAppService:
    """
    Service for interacting with Twilio's WhatsApp API
    Much simpler than direct Meta integration - Twilio handles complexity
    """

    def __init__(self):
        if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN]):
            logger.warning("Twilio credentials not configured")
            self.client = None
        else:
            # Initialize Twilio client with EU region
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN,
                region='ie1',  # Ireland (EU) region
                edge='dublin'   # Use Dublin edge location
            )
            logger.info("Twilio WhatsApp client initialized (EU region)")

        self.from_number = f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}"

    def send_text_message(self, to: str, message: str) -> Dict[str, Any]:
        """
        Send a text message via WhatsApp

        Args:
            to: Phone number in E.164 format (e.g., +41791234567)
            message: Text message content (max 1600 chars)

        Returns:
            Message SID and status
        """
        if not self.client:
            raise ValueError("Twilio client not initialized")

        # Ensure 'to' is in WhatsApp format
        if not to.startswith('whatsapp:'):
            to = f"whatsapp:{to}"

        try:
            message_obj = self.client.messages.create(
                from_=self.from_number,
                to=to,
                body=message
            )

            logger.info(f"Sent WhatsApp message: {message_obj.sid}")

            return {
                "message_sid": message_obj.sid,
                "status": message_obj.status,
                "to": to,
                "success": True
            }

        except TwilioRestException as e:
            logger.error(f"Twilio API error: {e.msg} (code: {e.code})")
            return {
                "success": False,
                "error": e.msg,
                "error_code": e.code
            }
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def send_media_message(
        self,
        to: str,
        message: str,
        media_url: str
    ) -> Dict[str, Any]:
        """
        Send a message with media (image, document, etc.)

        Args:
            to: Phone number
            message: Caption/body text
            media_url: Public URL of media file

        Returns:
            Message SID and status
        """
        if not self.client:
            raise ValueError("Twilio client not initialized")

        if not to.startswith('whatsapp:'):
            to = f"whatsapp:{to}"

        try:
            message_obj = self.client.messages.create(
                from_=self.from_number,
                to=to,
                body=message,
                media_url=[media_url]  # Can send multiple media URLs
            )

            logger.info(f"Sent WhatsApp media message: {message_obj.sid}")

            return {
                "message_sid": message_obj.sid,
                "status": message_obj.status,
                "to": to,
                "success": True
            }

        except TwilioRestException as e:
            logger.error(f"Twilio API error sending media: {e.msg}")
            return {
                "success": False,
                "error": e.msg,
                "error_code": e.code
            }

    def get_message_status(self, message_sid: str) -> Dict[str, Any]:
        """
        Check the status of a sent message

        Args:
            message_sid: Twilio message SID

        Returns:
            Message status details
        """
        if not self.client:
            raise ValueError("Twilio client not initialized")

        try:
            message = self.client.messages(message_sid).fetch()

            return {
                "sid": message.sid,
                "status": message.status,  # queued, sent, delivered, read, failed
                "error_code": message.error_code,
                "error_message": message.error_message,
                "date_sent": message.date_sent,
                "date_updated": message.date_updated
            }

        except TwilioRestException as e:
            logger.error(f"Error fetching message status: {e.msg}")
            return {
                "success": False,
                "error": e.msg
            }

    def download_media(self, media_url: str) -> bytes:
        """
        Download media from Twilio

        Twilio handles media hosting - much simpler than Meta's approach

        Args:
            media_url: Twilio media URL from webhook

        Returns:
            Media content as bytes
        """
        if not self.client:
            raise ValueError("Twilio client not initialized")

        try:
            # Twilio media URLs are authenticated automatically
            import requests
            response = requests.get(media_url, auth=(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            ))
            response.raise_for_status()

            return response.content

        except Exception as e:
            logger.error(f"Error downloading media: {e}")
            raise

    def validate_webhook_signature(
        self,
        url: str,
        post_data: dict,
        signature: str
    ) -> bool:
        """
        Validate that webhook request came from Twilio

        Args:
            url: Full URL of your webhook endpoint
            post_data: POST data from webhook
            signature: X-Twilio-Signature header value

        Returns:
            True if signature is valid
        """
        from twilio.request_validator import RequestValidator

        validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
        return validator.validate(url, post_data, signature)


# Global instance
twilio_whatsapp = TwilioWhatsAppService()
```

---

### 3.4 WhatsApp Business Logic Service (Adapted for Twilio)

**File:** `backend/services/whatsapp_service.py` (UPDATED)

```python
"""
WhatsApp business logic service
Handles message processing, user linking, and document uploads
Uses Twilio for WhatsApp communication
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
from services.twilio_whatsapp_service import twilio_whatsapp
from services.document_service import DocumentService
from services.ai_document_intelligence_service import AIDocumentIntelligenceService
from utils.whatsapp_encryption import phone_encryption

logger = logging.getLogger(__name__)

# Initialize AWS clients
s3_client = boto3.client('s3', region_name=settings.AWS_REGION)


class WhatsAppService:
    """
    Main service for WhatsApp integration via Twilio
    Handles all WhatsApp-related business logic
    """

    def __init__(self):
        self.document_service = DocumentService()
        self.ai_service = AIDocumentIntelligenceService()

    # ========== User Linking (Same as before) ==========

    def generate_linking_token(self, db: Session, user_id: UUID) -> WhatsAppLinkingToken:
        """Generate a 6-digit PIN for linking WhatsApp"""
        # Invalidate existing tokens
        db.query(WhatsAppLinkingToken).filter(
            WhatsAppLinkingToken.user_id == user_id,
            WhatsAppLinkingToken.used == False
        ).update({"used": True, "used_at": datetime.now()})
        db.commit()

        # Generate new token
        token = str(uuid.uuid4().int)[-6:]
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
        """Link WhatsApp account using PIN"""
        # Find valid token
        linking_token = db.query(WhatsAppLinkingToken).filter(
            WhatsAppLinkingToken.token == token,
            WhatsAppLinkingToken.used == False,
            WhatsAppLinkingToken.expires_at > datetime.now()
        ).first()

        if not linking_token:
            return {
                "success": False,
                "error": "Invalid or expired code. Please generate a new code."
            }

        # Get user
        user = db.query(User).filter(User.id == linking_token.user_id).first()
        if not user:
            return {"success": False, "error": "User not found"}

        # Check if phone already linked
        encrypted_phone = phone_encryption.encrypt_phone(phone_number)
        existing_user = db.query(User).filter(
            User.whatsapp_phone == encrypted_phone,
            User.id != user.id
        ).first()

        if existing_user:
            return {
                "success": False,
                "error": "This phone number is already linked to another account"
            }

        # Link account
        user.whatsapp_phone = encrypted_phone
        user.whatsapp_enabled = True
        user.whatsapp_linked_at = datetime.now()
        user.whatsapp_consent_given_at = datetime.now()
        user.whatsapp_session_token = str(uuid.uuid4())

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
        """Unlink WhatsApp account"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        user.whatsapp_phone = None
        user.whatsapp_enabled = False
        user.whatsapp_session_token = None

        db.commit()
        logger.info(f"Unlinked WhatsApp for user {user_id}")
        return True

    # ========== Message Processing (Updated for Twilio) ==========

    async def process_incoming_message(
        self,
        db: Session,
        from_phone: str,
        message_sid: str,  # Twilio message SID
        body: Optional[str] = None,
        num_media: int = 0,
        media_urls: list = None
    ) -> Dict[str, Any]:
        """
        Process incoming WhatsApp message from Twilio webhook

        Args:
            db: Database session
            from_phone: Sender's phone number (may have whatsapp: prefix)
            message_sid: Twilio message SID
            body: Text content (if text message)
            num_media: Number of media attachments
            media_urls: List of media URLs from Twilio

        Returns:
            Processing result
        """
        # Clean phone number (remove whatsapp: prefix if present)
        from_phone = from_phone.replace('whatsapp:', '').replace(' ', '')
        if not from_phone.startswith('+'):
            from_phone = f'+{from_phone}'

        # Authenticate user
        user = self.authenticate_user(db, from_phone)
        if not user:
            # User not linked - send instructions
            await twilio_whatsapp.send_text_message(
                to=from_phone,
                message="Welcome to SwissAI Tax! To get started, please link your account at https://swissai.tax/settings/whatsapp"
            )
            return {"status": "not_linked"}

        # Determine message type
        message_type = "text" if num_media == 0 else "image" if num_media > 0 else "text"

        # Save message to database
        message = WhatsAppMessage(
            user_id=user.id,
            message_id=message_sid,  # Twilio SID
            direction="inbound",
            message_type=message_type,
            content=body,
            status="received"
        )
        db.add(message)
        db.commit()

        # Process based on type
        if num_media > 0 and media_urls:
            return await self._process_media_message(db, user, media_urls[0], message_type)
        elif body:
            return await self._process_text_message(db, user, body)
        else:
            return {"status": "empty_message"}

    async def _process_text_message(self, db: Session, user: User, content: str) -> Dict[str, Any]:
        """Process text message (question or command)"""
        content_lower = content.lower().strip()
        phone = phone_encryption.decrypt_phone(user.whatsapp_phone)

        # Check for linking command
        if content_lower.startswith("link "):
            token = content_lower.replace("link ", "").strip()
            result = self.link_whatsapp_account(db, token, phone)

            message = "✅ Your WhatsApp is now linked to your SwissAI Tax account!" if result["success"] else f"❌ {result['error']}"
            await twilio_whatsapp.send_text_message(to=phone, message=message)
            return result

        # Status command
        if content_lower in ["status", "help", "info"]:
            status_message = self._get_user_status_message(db, user)
            await twilio_whatsapp.send_text_message(to=phone, message=status_message)
            return {"status": "info_sent"}

        # AI tax question
        try:
            answer = await self.ai_service.answer_tax_question(
                user_id=user.id,
                question=content,
                language=user.preferred_language or 'EN'
            )
            await twilio_whatsapp.send_text_message(to=phone, message=answer)
            return {"status": "question_answered"}
        except Exception as e:
            logger.error(f"Error processing tax question: {e}")
            await twilio_whatsapp.send_text_message(
                to=phone,
                message="Sorry, I encountered an error. Please try again or contact support."
            )
            return {"status": "error", "error": str(e)}

    async def _process_media_message(self, db: Session, user: User, media_url: str, media_type: str) -> Dict[str, Any]:
        """Process media message (document upload) from Twilio"""
        phone = phone_encryption.decrypt_phone(user.whatsapp_phone)

        try:
            # Download media from Twilio
            media_content = twilio_whatsapp.download_media(media_url)

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

            # Get or create session
            session_id = self._get_or_create_session(db, user.id)

            # Save document metadata
            document = self.document_service.save_document_metadata(
                session_id=session_id,
                document_type_id=1,
                file_name=file_name,
                s3_key=s3_key
            )

            # Start OCR processing
            if media_type in ["document", "image"]:
                self.document_service.process_document_with_textract(document['id'])

            # Send confirmation
            await twilio_whatsapp.send_text_message(
                to=phone,
                message="✅ Document received! I'm processing it now. I'll let you know what I find."
            )

            return {"status": "document_uploaded", "document_id": document['id']}

        except Exception as e:
            logger.error(f"Error processing media: {e}")
            await twilio_whatsapp.send_text_message(
                to=phone,
                message="Sorry, I couldn't process your document. Please try again."
            )
            return {"status": "error", "error": str(e)}

    # ========== Helper Methods ==========

    def authenticate_user(self, db: Session, phone_number: str) -> Optional[User]:
        """Authenticate user by phone number"""
        try:
            encrypted_phone = phone_encryption.encrypt_phone(phone_number)
            user = db.query(User).filter(
                User.whatsapp_phone == encrypted_phone,
                User.whatsapp_enabled == True,
                User.is_active == True
            ).first()

            if user:
                logger.info(f"Authenticated WhatsApp user: {user.id}")
            return user
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None

    def _get_or_create_session(self, db: Session, user_id: UUID) -> str:
        """Get or create a tax filing session for user"""
        from models.tax_filing_session import TaxFilingSession

        session = db.query(TaxFilingSession).filter(
            TaxFilingSession.user_id == user_id,
            TaxFilingSession.status.in_(['active', 'in_progress'])
        ).first()

        if not session:
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
- Visit https://swissai.tax
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

### 3.5 Create Twilio Webhook Router

**File:** `backend/routers/whatsapp.py` (NEW - Twilio version)

```python
"""
WhatsApp integration endpoints (Twilio)
Handles webhooks, linking, and message management
"""

import logging
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends, Query, Form
from sqlalchemy.orm import Session

from config import settings
from core.security import get_current_user
from db.session import get_db
from models.swisstax.user import User
from schemas.whatsapp import (
    WhatsAppLinkingResponse,
    WhatsAppUnlinkRequest,
    WhatsAppStatus,
    WhatsAppMessageHistoryResponse
)
from services.whatsapp_service import whatsapp_service
from services.twilio_whatsapp_service import twilio_whatsapp
from utils.whatsapp_encryption import phone_encryption

logger = logging.getLogger(__name__)

router = APIRouter()


# ========== Twilio Webhook Endpoint (Public) ==========

@router.post("/webhook")
async def receive_twilio_webhook(
    request: Request,
    db: Session = Depends(get_db),
    # Twilio sends data as form-encoded, not JSON
    From: str = Form(...),
    To: str = Form(...),
    Body: Optional[str] = Form(None),
    MessageSid: str = Form(...),
    NumMedia: int = Form(0),
    MediaUrl0: Optional[str] = Form(None),
):
    """
    Webhook receiver endpoint for Twilio WhatsApp messages

    Twilio automatically handles:
    - Message encryption (E2E with WhatsApp)
    - Media hosting (temporary URLs)
    - Delivery status tracking
    - Signature verification (we'll add this)
    """

    # Verify request came from Twilio
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    post_data = await request.form()

    if not twilio_whatsapp.validate_webhook_signature(url, dict(post_data), signature):
        logger.error("Invalid Twilio signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        # Build media URLs list
        media_urls = []
        if NumMedia > 0:
            for i in range(NumMedia):
                media_url = post_data.get(f"MediaUrl{i}")
                if media_url:
                    media_urls.append(media_url)

        # Process message
        result = await whatsapp_service.process_incoming_message(
            db=db,
            from_phone=From,
            message_sid=MessageSid,
            body=Body,
            num_media=NumMedia,
            media_urls=media_urls
        )

        logger.info(f"Processed Twilio webhook: {result}")

        # Twilio expects 200 OK (empty response is fine)
        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Error processing Twilio webhook: {e}", exc_info=True)
        # Still return 200 to avoid Twilio retries
        return {"status": "error", "message": str(e)}


# ========== Status Webhook (Optional - for delivery receipts) ==========

@router.post("/webhook/status")
async def receive_status_webhook(
    request: Request,
    MessageSid: str = Form(...),
    MessageStatus: str = Form(...),  # queued, sent, delivered, read, failed
    ErrorCode: Optional[str] = Form(None),
):
    """
    Optional: Receive message status updates from Twilio
    Use this to update message delivery status in database
    """
    try:
        logger.info(f"Message {MessageSid} status: {MessageStatus}")

        # TODO: Update WhatsAppMessage record in database
        # For now, just log

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing status webhook: {e}")
        return {"status": "error"}


# ========== User Endpoints (Authenticated) ==========

@router.post("/link", response_model=WhatsAppLinkingResponse)
async def generate_linking_code(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a 6-digit PIN for linking WhatsApp"""
    if user.whatsapp_enabled:
        raise HTTPException(status_code=400, detail="WhatsApp already linked")

    token = whatsapp_service.generate_linking_token(db, user.id)
    expires_in = int((token.expires_at - token.created_at).total_seconds())

    return WhatsAppLinkingResponse(
        token=token.token,
        expires_at=token.expires_at,
        expires_in_seconds=expires_in,
        instructions=f"Send this message via WhatsApp to {settings.TWILIO_WHATSAPP_NUMBER}:\n\nLINK {token.token}"
    )


@router.post("/unlink")
async def unlink_whatsapp(
    request: WhatsAppUnlinkRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlink WhatsApp account"""
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
    """Get WhatsApp integration status for current user"""
    if not user.whatsapp_enabled:
        return WhatsAppStatus(
            enabled=False,
            linked=False
        )

    from models.swisstax.whatsapp_message import WhatsAppMessage
    message_count = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.user_id == user.id
    ).count()

    last_message = db.query(WhatsAppMessage).filter(
        WhatsAppMessage.user_id == user.id
    ).order_by(WhatsAppMessage.created_at.desc()).first()

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
    """Get WhatsApp message history for current user"""
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

### 3.6 Register Router in Main App

**File:** `backend/app.py`

Add WhatsApp router:

```python
# Add import at top
from routers import whatsapp

# Add router registration (around line 240, with other routers)
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["whatsapp"])
```

---

### 3.7 Configure Twilio Webhook URL (After Deployment)

Once backend is deployed to App Runner:

1. Go to Twilio Console: https://console.twilio.com
2. Phone Numbers → Manage → Active Numbers
3. Click your WhatsApp number
4. Scroll to **Messaging Configuration**
5. Set **"A MESSAGE COMES IN"**:
   - Webhook: `https://api.swissai.tax/api/whatsapp/webhook`
   - HTTP POST
6. Set **"STATUS CALLBACK URL"** (optional):
   - Webhook: `https://api.swissai.tax/api/whatsapp/webhook/status`
   - HTTP POST
7. Click **Save**

**Test webhook:**
```bash
# Send test message from your personal WhatsApp
# To: Your Twilio WhatsApp number
# Message: "test"

# Check backend logs
# Should see: "Processed Twilio webhook: ..."
```

---

## Phase 4: Frontend Implementation

**No changes from original plan** - frontend is identical for Twilio vs Meta.

Use the same React components from original plan:
- `WhatsAppSettings.jsx` - Settings component
- `whatsappService.js` - API client
- Translation keys for 4 languages

See original plan document for complete frontend code.

**Only difference:** Display Twilio number in linking instructions:
```jsx
instructions={`Send this message via WhatsApp to ${twilioNumber}:\n\nLINK ${code}`}
```

---

## Phase 5: Security & Encryption

**Mostly same as original plan**, with Twilio-specific additions:

### Twilio-Specific Security

**1. Webhook Signature Validation**

Twilio signs all webhook requests. Validate in router:

```python
# Already implemented in router (section 3.5)
def validate_webhook_signature(url, post_data, signature):
    from twilio.request_validator import RequestValidator
    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    return validator.validate(url, post_data, signature)
```

**2. HTTPS Only**

- Twilio requires HTTPS webhooks
- Your API already has this: `https://api.swissai.tax`

**3. Auth Token Security**

- Never commit `TWILIO_AUTH_TOKEN` to git
- Store in AWS Parameter Store (SecureString)
- Rotate every 90 days

**4. Rate Limiting**

```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/webhook")
@limiter.limit("100/minute")  # Twilio won't exceed this
async def receive_twilio_webhook(...):
    ...
```

---

## Phase 6: Testing Strategy

### 6.1 Twilio Sandbox Testing (Day 1)

**Immediate testing without approval:**

1. Console → Messaging → Try WhatsApp
2. Join sandbox from personal WhatsApp
3. Test sending/receiving messages
4. Validate webhook processing

**Test cases:**
- [x] Send text message → receive AI response
- [x] Send image → document processing
- [x] Linking command → account link
- [x] Status command → user info
- [x] Invalid phone → error handling

---

### 6.2 Unit Tests (Same as before)

See original plan for complete test suite.

**Twilio-specific tests:**

```python
# backend/tests/test_twilio_service.py

def test_send_text_message():
    """Test sending text via Twilio"""
    result = twilio_whatsapp.send_text_message(
        to="+41791234567",
        message="Test message"
    )
    assert result["success"] is True
    assert "message_sid" in result

def test_webhook_signature_validation():
    """Test Twilio signature validation"""
    from twilio.request_validator import RequestValidator

    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    is_valid = validator.validate(url, params, signature)
    assert is_valid is True
```

---

### 6.3 Integration Tests

**Test with Twilio sandbox:**

```python
# backend/tests/test_twilio_integration.py

@pytest.mark.integration
async def test_end_to_end_message_flow():
    """Test complete flow: send → webhook → response"""

    # 1. Send message via Twilio API
    result = twilio_whatsapp.send_text_message(
        to=test_number,
        message="What's my tax rate?"
    )
    assert result["success"]

    # 2. Simulate webhook callback
    response = client.post("/api/whatsapp/webhook", data={
        "From": f"whatsapp:{test_number}",
        "Body": "What's my tax rate?",
        "MessageSid": "SM1234567890"
    })
    assert response.status_code == 200

    # 3. Verify response sent
    # (check Twilio dashboard or mock)
```

---

## Phase 7: Deployment & Rollout

### Updated Timeline (Faster with Twilio)

| Week | Tasks | Deliverables |
|------|-------|--------------|
| **Week 1** | Twilio setup, database migrations | Twilio account ready, DB updated |
| **Week 2** | Backend implementation, testing | API endpoints working |
| **Week 3** | Frontend, integration testing | Web app updated |
| **Week 4** | Deploy, beta testing, launch | Live in production |

**Total: 4 weeks** (vs 6 weeks with Meta Direct)

---

### Deployment Steps

**Day 1: Twilio Setup**
```bash
# 1. Create Twilio account
# 2. Configure EU region
# 3. Set up WhatsApp sandbox
# 4. Add credentials to Parameter Store
bash infrastructure/setup-twilio-parameters.sh
```

**Day 2-3: Database**
```bash
# Run migrations
cd backend
alembic upgrade head
```

**Week 2: Backend Development**
```bash
# Install Twilio SDK
pip install twilio==9.0.4

# Implement services
# Test locally with sandbox
```

**Week 3: Deploy Backend**
```bash
# Push to GitHub (App Runner auto-deploys)
git push origin main

# Configure Twilio webhook
# Point to: https://api.swissai.tax/api/whatsapp/webhook
```

**Week 3: Frontend**
```bash
# Deploy frontend (Amplify auto-deploys)
git push origin main
```

**Week 4: Testing & Launch**
```bash
# Beta test with 10-20 users
# Monitor for 1 week
# Full launch
```

---

## Monitoring & Maintenance

### Twilio-Specific Monitoring

**1. Twilio Console Dashboard**
- Monitor message volume
- Track delivery rates
- View failed messages
- Check error logs

**2. CloudWatch Metrics**
```python
import boto3
cloudwatch = boto3.client('cloudwatch')

# Log Twilio message sent
cloudwatch.put_metric_data(
    Namespace='SwissAI/WhatsApp',
    MetricData=[{
        'MetricName': 'TwilioMessageSent',
        'Value': 1,
        'Unit': 'Count'
    }]
)
```

**3. Cost Monitoring**
```bash
# Set up billing alerts in Twilio
# Alert if >CHF 300/month
# Alert if >5,000 messages/day
```

**4. Error Alerting**
```python
# In webhook handler
if error_rate > 5%:
    send_alert_email("High WhatsApp error rate")
```

---

## Cost Analysis (Twilio)

### Monthly Cost Breakdown

**Twilio Costs (3,000 conversations/month example):**

| Item | Cost |
|------|------|
| Phone number | CHF 3/month |
| 3,000 service conversations | 3,000 × CHF 0.0611 = CHF 183.30 |
| **Total Twilio** | **CHF 186.30/month** |

**AWS Costs (same as before):**
| Item | Cost |
|------|------|
| S3 storage (50 GB) | CHF 1.15 |
| S3 requests (100K) | CHF 0.04 |
| Textract (5,000 pages) | CHF 7.50 |
| CloudWatch Logs (10 GB) | CHF 5.00 |
| **Total AWS** | **CHF 13.69/month** |

**Grand Total: CHF 199.99/month (~CHF 200/month)**

**Comparison to Meta Direct:**
- Meta: CHF 81 + CHF 14 = CHF 95/month
- Twilio: CHF 200/month
- **Extra cost: CHF 105/month** (110% more expensive)

**Break-even analysis:**
- Development time saved: 25 hours
- Developer cost: CHF 150/hour
- Savings: 25 × 150 = CHF 3,750
- Extra monthly cost: CHF 105
- **Break-even: 36 months (3 years)**

**Conclusion:** Twilio costs more long-term, but faster launch and better support justify the cost for first 6-12 months.

---

## Migration to Meta Direct (Optional)

### When to Consider Migration

**Migrate if:**
- ✅ Volume >5,000 conversations/month (saves CHF 200+/month)
- ✅ Product-market fit validated
- ✅ Dev team has capacity
- ✅ Want full control and lowest cost

**Stay with Twilio if:**
- ❌ Volume <3,000 conversations/month (savings minimal)
- ❌ Value support and simplicity
- ❌ Don't want to maintain Meta integration

---

### Migration Plan (Month 6+)

**Phase 1: Prepare (Week 1)**
1. Start Meta business verification (2-3 weeks)
2. Build Meta Direct integration (parallel to Twilio)
3. Test Meta integration in staging

**Phase 2: Gradual Cutover (Week 2-4)**
1. Deploy Meta endpoints (don't switch webhook yet)
2. Test with 10% of users
3. Monitor for issues
4. Gradually increase to 100%

**Phase 3: Complete Migration (Week 5)**
1. Switch Twilio webhook to Meta
2. Update frontend (if needed)
3. Monitor for 1 week
4. Deprecate Twilio (keep as backup for 1 month)

**Total migration time:** 5-6 weeks

**Code changes:** Minimal - mostly swap `twilio_whatsapp` with `meta_whatsapp` service

---

## Summary

### Twilio Implementation: Key Points

**Pros:**
✅ **Fast launch:** 4 weeks vs 6 weeks
✅ **Easier development:** SDK + docs save 20-30 hours
✅ **Better support:** 24/7 Twilio support
✅ **Proven reliability:** 99.95% uptime
✅ **Easy testing:** Sandbox available immediately

**Cons:**
❌ **Higher cost:** ~110% more expensive than Meta (CHF 105/month extra)
❌ **Vendor dependency:** Locked into Twilio pricing
❌ **No free tier:** Pay from message 1

**Best for:**
- Startups wanting to validate quickly
- Teams valuing support over cost
- Projects with tight deadlines
- Developers preferring SDKs over raw APIs

**Migration path:** Can switch to Meta Direct after 6-12 months if volume justifies

---

### Quick Start Checklist

- [ ] Day 1: Create Twilio account, configure EU region
- [ ] Day 1: Add credentials to AWS Parameter Store
- [ ] Day 1: Test with Twilio sandbox
- [ ] Week 1: Run database migrations
- [ ] Week 2: Implement backend (Twilio SDK)
- [ ] Week 3: Implement frontend, deploy
- [ ] Week 3: Configure webhook URL in Twilio
- [ ] Week 4: Beta test, full launch

**Estimated effort:** 60-80 hours total (vs 80-100 hours for Meta Direct)

---

**Document Version:** 2.0 (Twilio)
**Last Updated:** 2025-10-11
**Author:** SwissAI Tax Development Team
**Status:** Ready for Implementation with Twilio
