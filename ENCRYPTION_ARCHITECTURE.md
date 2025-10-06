# SwissAI Tax - Encryption Architecture & Security

## Overview

This document describes the comprehensive encryption architecture implemented for SwissAI Tax to protect sensitive taxpayer data. The system implements multi-layered encryption across database storage, file storage, and data transmission.

## Table of Contents

1. [Security Objectives](#security-objectives)
2. [Encryption Layers](#encryption-layers)
3. [Architecture Components](#architecture-components)
4. [Implementation Details](#implementation-details)
5. [Key Management](#key-management)
6. [Data Classification](#data-classification)
7. [Encryption Workflows](#encryption-workflows)
8. [Monitoring & Auditing](#monitoring--auditing)
9. [Key Rotation](#key-rotation)
10. [Compliance](#compliance)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)

---

## Security Objectives

### Primary Goals

1. **Data Protection at Rest**: All sensitive data encrypted in database and file storage
2. **Transparent Encryption**: Automatic encryption/decryption without application changes
3. **Key Security**: Encryption keys managed securely via AWS Secrets Manager
4. **Compliance**: Meet Swiss data protection requirements (FADP) and GDPR
5. **Performance**: Minimal performance impact on user experience
6. **Auditability**: Complete audit trail of encryption operations

### Threat Model

- **Database Breach**: Encrypted data unreadable without encryption keys
- **Backup Exposure**: Backups contain encrypted data only
- **Insider Threats**: Sensitive data encrypted, keys access-controlled
- **File Storage Breach**: S3 documents encrypted with AWS KMS
- **Key Compromise**: Key rotation procedures limit exposure window

---

## Encryption Layers

### Layer 1: Application-Level Encryption

**What**: Sensitive fields encrypted before database storage
**How**: Fernet symmetric encryption (AES-128)
**Where**: SQLAlchemy custom types

```
Plaintext Data → Application Encryption → Encrypted Storage
```

### Layer 2: Database-Level Encryption

**What**: PostgreSQL transparent data encryption (TDE)
**How**: AWS RDS encryption at rest
**Where**: Entire database volume

### Layer 3: Transport Encryption

**What**: Data in transit protection
**How**: TLS 1.2+ for all connections
**Where**: API endpoints, database connections, AWS services

### Layer 4: File Storage Encryption

**What**: Document storage encryption
**How**: AWS S3 Server-Side Encryption with KMS (SSE-KMS)
**Where**: Tax documents, uploaded files

---

## Architecture Components

### 1. Encryption Service (`utils/encryption.py`)

Core encryption/decryption functionality using Fernet (symmetric encryption).

**Key Features:**
- String encryption/decryption
- Dictionary field encryption
- Secure token generation
- One-way hashing for passwords
- Data anonymization utilities

**Example Usage:**
```python
from utils.encryption import get_encryption_service

service = get_encryption_service()
encrypted = service.encrypt("sensitive data")
decrypted = service.decrypt(encrypted)
```

### 2. SQLAlchemy Custom Types (`utils/encrypted_types.py`)

Transparent encryption for database columns.

**Available Types:**
- `EncryptedString`: For short sensitive strings
- `EncryptedText`: For longer sensitive text
- `EncryptedJSON`: For entire JSON objects
- `HashedString`: For one-way hashed data (passwords)

**Example Usage:**
```python
from utils.encrypted_types import EncryptedString, EncryptedJSON

class TaxFilingSession(Base):
    # Automatically encrypted/decrypted
    profile = Column(EncryptedJSON)
```

### 3. JSON Field Encryptor (`utils/json_encryption.py`)

Selective field encryption within JSON documents.

**Features:**
- Encrypt specific fields only
- Support for nested fields (dot notation)
- Tax-specific profile encryptor

**Example Usage:**
```python
from utils.json_encryption import get_tax_profile_encryptor

encryptor = get_tax_profile_encryptor()
encrypted_profile = encryptor.encrypt_profile(profile)
decrypted_profile = encryptor.decrypt_profile(encrypted_profile)
```

### 4. AWS Secrets Manager Integration (`utils/aws_secrets.py`)

Secure key storage and retrieval.

**Features:**
- Encryption key storage
- Secret versioning
- Automatic key rotation support
- Regional deployment

**Example Usage:**
```python
from utils.aws_secrets import get_encryption_key

key = get_encryption_key()  # Retrieves from Secrets Manager
```

### 5. S3 Encrypted Storage (`utils/s3_encryption.py`)

Secure document storage with encryption.

**Features:**
- SSE-KMS encryption (customer-managed keys)
- Presigned URLs for secure access
- Metadata encryption
- Bucket-level encryption policy

**Example Usage:**
```python
from utils.s3_encryption import get_s3_storage

storage = get_s3_storage()
storage.upload_document('file.pdf', 'user_123/tax_2024.pdf')
```

### 6. Encryption Monitoring (`utils/encryption_monitor.py`)

Performance and security monitoring.

**Features:**
- Operation metrics tracking
- Anomaly detection
- Key rotation status
- Health checks

**Example Usage:**
```python
from utils.encryption_monitor import get_encryption_health_check

health = get_encryption_health_check()
status = health.perform_health_check()
```

---

## Implementation Details

### Database Models with Encryption

#### TaxFilingSession Model

```python
class TaxFilingSession(Base):
    __tablename__ = "tax_filing_sessions"

    # Regular columns
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.id'))

    # ENCRYPTED: Contains sensitive financial data
    profile = Column(EncryptedJSON, default=dict)

    # Non-encrypted metadata
    status = Column(Enum(FilingStatus))
    completion_percentage = Column(Integer)
```

**What's Encrypted:**
- `profile`: Complete tax profile with financial amounts, location data

**Encryption Method:**
- Application-level: EncryptedJSON custom type
- Automatic encryption on write, decryption on read

#### TaxAnswer Model

```python
class TaxAnswer(Base):
    __tablename__ = "tax_answers"

    # Regular columns
    id = Column(String(36), primary_key=True)
    question_id = Column(String(50))

    # ENCRYPTED: Sensitive answer data
    answer_value = Column(EncryptedText, nullable=False)

    # Flag to track sensitivity
    is_sensitive = Column(Boolean, default=True)
```

**What's Encrypted:**
- `answer_value`: User responses to sensitive questions
  - Names, dates of birth
  - Financial amounts
  - Location data

**Encryption Method:**
- Application-level: EncryptedText custom type
- Selective encryption based on question sensitivity

### Interview Service Encryption

The interview service automatically encrypts sensitive answers:

```python
def submit_answer(self, session_id: str, question_id: str, answer: Any):
    if self._is_question_sensitive(question_id):
        # Automatically encrypt sensitive answers
        encrypted_answer = self.encryption_service.encrypt(str(answer))
        session['answers'][question_id] = encrypted_answer
    else:
        session['answers'][question_id] = answer
```

**Sensitive Questions:**
- Q01a-c: Spouse information (names, DOB)
- Q02a: Municipality
- Q03b: Child details
- Q08a: Pillar 3a amount
- Q11a: Donation amount
- Q12a: Alimony amount
- Q13a: Medical expense amount

---

## Key Management

### Key Storage Strategy

1. **Production**: AWS Secrets Manager
2. **Development**: Environment variable (`ENCRYPTION_KEY`)
3. **Testing**: Generated test keys

### Key Hierarchy

```
AWS KMS Master Key (Customer Managed)
    ↓
AWS Secrets Manager Secret
    ↓
Application Encryption Key (Fernet)
    ↓
Individual Data Encryption
```

### Key Access Control

**AWS IAM Permissions Required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:region:account:secret:swissai-tax/encryption-key*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:region:account:key/key-id"
    }
  ]
}
```

### Environment Variables

```bash
# Production (recommended)
ENCRYPTION_SECRET_NAME=swissai-tax/encryption-key
AWS_REGION=us-east-1

# Development fallback
ENCRYPTION_KEY=<base64-encoded-key>

# Optional configuration
ENCRYPTION_KEY_CREATED_AT=2025-01-15T00:00:00
ENCRYPTION_KEY_ROTATION_DAYS=90
```

---

## Data Classification

### Highly Sensitive (Always Encrypted)

**Personal Identifying Information:**
- Full names (user, spouse, children)
- Dates of birth
- Addresses, municipalities

**Financial Information:**
- Income amounts
- Pillar 3a contributions
- Donation amounts
- Alimony payments
- Medical expense amounts
- Property values
- Securities holdings

**Location Data:**
- Precise municipality
- Property addresses

### Sensitive (Encrypted in Profile)

**Tax Details:**
- Complete tax profile JSON
- Calculation results with specific amounts

### Non-Sensitive (Not Encrypted)

**Metadata:**
- Tax year
- Canton (broad location)
- Civil status categories
- Yes/no indicators
- Filing status
- Progress percentages
- UI state (pinned, archived)

**Audit Information:**
- Timestamps
- Question IDs
- Session IDs

---

## Encryption Workflows

### Workflow 1: User Submits Sensitive Answer

```
1. User submits answer via API
2. InterviewService checks if question is sensitive
3. If sensitive:
   - Encrypt answer with Fernet
   - Store encrypted value in session
4. If not sensitive:
   - Store plaintext
5. On profile generation:
   - Decrypt sensitive answers
   - Generate profile
   - Encrypt entire profile for storage
```

### Workflow 2: Tax Profile Storage

```
1. Interview complete, generate profile
2. Profile contains mix of sensitive/non-sensitive data
3. SQLAlchemy EncryptedJSON type intercepts write:
   - Serialize profile to JSON string
   - Encrypt entire JSON with Fernet
   - Store encrypted blob in database
4. On read:
   - Retrieve encrypted blob
   - Decrypt to JSON string
   - Deserialize to Python dict
   - Return to application
```

### Workflow 3: Document Upload

```
1. User uploads tax document (PDF)
2. Backend receives file
3. S3EncryptedStorage.upload_document():
   - Specifies SSE-KMS encryption
   - References customer-managed KMS key
   - S3 encrypts file before storage
4. S3 stores:
   - Encrypted file content
   - Encrypted metadata
   - Encryption key identifier
```

### Workflow 4: Data Retrieval for Display

```
1. API request for user's tax profile
2. Database query retrieves TaxFilingSession
3. SQLAlchemy automatically:
   - Reads encrypted profile column
   - Decrypts using EncryptedJSON type
   - Returns plain profile object
4. API applies field-level masking if needed
5. Frontend receives decrypted data
6. Data transmitted over TLS
```

---

## Monitoring & Auditing

### Metrics Tracked

**Operation Metrics:**
- Encryption/decryption operation counts
- Operation durations (performance)
- Data sizes processed
- Success/failure rates

**Security Metrics:**
- Encryption key age
- Last rotation date
- Failed decryption attempts
- Anomalous access patterns

### Health Checks

```python
from utils.encryption_monitor import get_encryption_health_check

health = get_encryption_health_check()
status = health.perform_health_check()

# Returns:
{
  "overall_status": "healthy",
  "checks": {
    "encryption_service": {"status": "healthy"},
    "recent_operations": {"status": "healthy", "success_rate": 99.8},
    "key_rotation": {"status": "healthy", "days_until_rotation": 45},
    "anomalies": {"status": "healthy", "count": 0}
  }
}
```

### Logging

**Encrypted Operations Logged:**
```python
logger.info("Stored encrypted answer for sensitive question Q01a")
logger.warning("Slow encryption operation: 1250ms for 10KB")
logger.error("Failed decryption attempt for profile XYZ")
```

**What is NOT Logged:**
- Plaintext sensitive data
- Encryption keys
- Decrypted values

---

## Key Rotation

### Rotation Policy

**Recommended Schedule:**
- Production keys: Rotate every 90 days
- Development keys: Rotate every 180 days
- Test keys: Generate per test run

### Rotation Process

#### Step 1: Generate New Key

```bash
# Generate new Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

#### Step 2: Store in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name swissai-tax/encryption-key \
  --secret-string '{"encryption_key":"<NEW_KEY>","created_at":"2025-01-15T00:00:00","environment":"production"}'
```

#### Step 3: Re-encrypt Data

```python
# Migration script (backend/scripts/rotate_encryption_key.py)
from utils.encryption import EncryptionService
from models.tax_filing_session import TaxFilingSession

old_service = EncryptionService(key=OLD_KEY)
new_service = EncryptionService(key=NEW_KEY)

# Re-encrypt all profiles
for session in TaxFilingSession.query.all():
    # Decrypt with old key
    profile = old_service.decrypt(session.encrypted_profile)
    # Encrypt with new key
    session.encrypted_profile = new_service.encrypt(profile)
    db.session.commit()
```

#### Step 4: Update Environment

```bash
# Update ENCRYPTION_KEY_CREATED_AT
export ENCRYPTION_KEY_CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S")
```

#### Step 5: Verify

```python
from utils.encryption_monitor import get_key_rotation_manager

manager = get_key_rotation_manager()
status = manager.check_key_age()
print(status)  # Should show new creation date
```

### Automated Rotation (Future Enhancement)

AWS Lambda function to automate rotation:
```python
def rotate_key_handler(event, context):
    # 1. Generate new key
    # 2. Store in Secrets Manager (new version)
    # 3. Trigger ECS task to re-encrypt data
    # 4. Update parameter store
    # 5. Notify ops team
    pass
```

---

## Compliance

### Swiss Federal Act on Data Protection (FADP)

**Requirement**: Appropriate technical and organizational measures to protect personal data

**Our Implementation:**
✅ Encryption at rest for all sensitive personal data
✅ Encryption in transit (TLS)
✅ Access controls via AWS IAM
✅ Audit logging of data access
✅ Data retention policies
✅ Right to data deletion (cascade delete)

### GDPR Compliance

**Article 32**: Security of Processing

**Our Implementation:**
✅ Pseudonymization and encryption
✅ Ongoing confidentiality, integrity, availability
✅ Regular security testing
✅ Process for regular restoration

**Article 33**: Breach Notification

**Our Implementation:**
✅ Encryption reduces breach severity
✅ Monitoring detects anomalies
✅ Health checks identify issues

---

## Deployment Guide

### Prerequisites

1. **AWS Account** with:
   - Secrets Manager access
   - KMS key management
   - S3 bucket created
   - RDS encryption enabled

2. **Python Dependencies**:
```bash
pip install cryptography boto3 sqlalchemy
```

3. **Environment Setup**:
```bash
# AWS credentials configured
aws configure

# Test Secrets Manager access
aws secretsmanager list-secrets
```

### Step-by-Step Deployment

#### 1. Create KMS Key

```bash
aws kms create-key \
  --description "SwissAI Tax encryption key" \
  --key-policy file://kms-key-policy.json

# Output: "KeyId": "1234abcd-12ab-34cd-56ef-1234567890ab"
```

#### 2. Create Encryption Secret

```bash
# Generate key
ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# Store in Secrets Manager
aws secretsmanager create-secret \
  --name swissai-tax/encryption-key \
  --description "Application encryption key for sensitive data" \
  --secret-string "{\"encryption_key\":\"$ENCRYPTION_KEY\",\"created_at\":\"$(date -u +%Y-%m-%dT%H:%M:%S)\",\"environment\":\"production\"}" \
  --kms-key-id "1234abcd-12ab-34cd-56ef-1234567890ab"
```

#### 3. Configure S3 Bucket Encryption

```bash
# Enable default encryption
aws s3api put-bucket-encryption \
  --bucket swissai-tax-documents \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:region:account:key/key-id"
      },
      "BucketKeyEnabled": true
    }]
  }'
```

#### 4. Run Database Migration

```bash
cd backend
alembic upgrade head
```

#### 5. Update Application Configuration

```bash
# Set environment variables in ECS/Fargate task definition
{
  "environment": [
    {"name": "ENCRYPTION_SECRET_NAME", "value": "swissai-tax/encryption-key"},
    {"name": "AWS_REGION", "value": "us-east-1"},
    {"name": "TAX_DOCUMENTS_BUCKET", "value": "swissai-tax-documents"},
    {"name": "TAX_KMS_KEY_ID", "value": "arn:aws:kms:..."},
    {"name": "ENCRYPTION_KEY_ROTATION_DAYS", "value": "90"}
  ]
}
```

#### 6. Verify Deployment

```bash
# Test encryption service
python scripts/test_encryption.py

# Check health endpoint
curl https://api.swissaitax.ch/api/health/encryption
```

---

## Troubleshooting

### Issue: "Decryption failed for value"

**Cause**: Data encrypted with different key than current

**Solutions:**
1. Check `ENCRYPTION_KEY` environment variable
2. Verify Secrets Manager secret value
3. Check for recent key rotation
4. Verify AWS credentials for Secrets Manager access

**Debug:**
```python
from utils.aws_secrets import get_encryption_key
key = get_encryption_key()
print(f"Key retrieved: {key[:10]}...")  # Show first 10 chars
```

### Issue: "Failed to retrieve encryption key from AWS"

**Cause**: IAM permissions or network issues

**Solutions:**
1. Check IAM role has `secretsmanager:GetSecretValue` permission
2. Verify secret name matches `ENCRYPTION_SECRET_NAME`
3. Check VPC endpoints for Secrets Manager
4. Verify AWS region configuration

**Debug:**
```bash
# Test AWS access
aws secretsmanager get-secret-value \
  --secret-id swissai-tax/encryption-key
```

### Issue: "Slow encryption operations"

**Cause**: Large data sizes or performance issues

**Solutions:**
1. Check data sizes being encrypted
2. Review encryption monitoring metrics
3. Consider caching decrypted frequently-accessed data
4. Optimize database queries to reduce decryption operations

**Debug:**
```python
from utils.encryption_monitor import get_encryption_monitor
monitor = get_encryption_monitor()
summary = monitor.get_metrics_summary(hours=1)
print(summary)
```

### Issue: S3 upload fails with encryption error

**Cause**: KMS key permissions or configuration

**Solutions:**
1. Verify KMS key policy allows S3 usage
2. Check IAM role has `kms:GenerateDataKey` permission
3. Verify bucket encryption configuration
4. Check `TAX_KMS_KEY_ID` environment variable

**Debug:**
```python
from utils.s3_encryption import get_s3_storage
storage = get_s3_storage()
metadata = storage.get_document_metadata('test-file')
print(metadata.get('encryption'))  # Should show 'aws:kms'
```

---

## Best Practices

### Development

1. **Never commit encryption keys** to git
2. **Use separate keys** for dev/staging/production
3. **Test encryption** in unit tests
4. **Mock AWS services** in local development

### Operations

1. **Monitor encryption health** daily
2. **Rotate keys** on schedule (90 days)
3. **Audit key access** via CloudTrail
4. **Test disaster recovery** including key restoration

### Security

1. **Principle of least privilege** for key access
2. **Encrypt backups** before storage
3. **Use TLS** for all network communications
4. **Log security events** without sensitive data

---

## Additional Resources

- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [Cryptography Library Documentation](https://cryptography.io/)
- [Swiss Federal Act on Data Protection](https://www.admin.ch/opc/en/classified-compilation/19920153/index.html)
- [GDPR Article 32](https://gdpr-info.eu/art-32-gdpr/)

---

## Support

For encryption-related issues:
1. Check health endpoint: `GET /api/health/encryption`
2. Review application logs for encryption errors
3. Contact DevOps team for key rotation
4. Escalate security incidents to security@swissaitax.ch

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Author**: SwissAI Tax Security Team
