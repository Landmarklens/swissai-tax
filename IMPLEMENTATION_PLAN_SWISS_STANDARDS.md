# Implementation Plan: Swiss E-Government Standards (eCH-0196 & Swissdec ELM)

**Project:** SwissAI Tax Platform - Standard Document Import
**Version:** 1.0
**Date:** 2025-10-21
**Author:** Implementation Team
**Status:** Planning Phase - Awaiting Approval

---

## Executive Summary

### Objective
Implement support for Swiss e-government standards (eCH-0196 and Swissdec ELM) to enable users to import bank statements and salary certificates directly into their tax returns, reducing manual data entry from 45 minutes to under 10 minutes.

### Scope
- **Phase 1:** eCH-0196 (Bank Statement Import)
- **Phase 2:** Swissdec ELM (Salary Certificate Import)
- **Maintain:** Existing PDF upload with AI extraction capability

### Key Metrics
- **Development Time:** 12-15 working days
- **Code Added:** ~800 lines (backend) + ~300 lines (frontend)
- **Database Changes:** 3 new columns (no new tables)
- **Expected User Impact:** 80% reduction in completion time for users with standard documents

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Architecture](#2-solution-architecture)
3. [Technical Specifications](#3-technical-specifications)
4. [Database Design](#4-database-design)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Testing Strategy](#7-testing-strategy)
8. [Implementation Timeline](#8-implementation-timeline)
9. [Dependencies & Resources](#9-dependencies--resources)
10. [Risk Analysis & Mitigation](#10-risk-analysis--mitigation)
11. [Success Criteria](#11-success-criteria)
12. [Deployment Plan](#12-deployment-plan)

---

## 1. Problem Statement

### Current State
Users must manually enter all tax data from:
- Bank statements (accounts, interest, securities, mortgages)
- Salary certificates (income, deductions, social security)

This process:
- Takes 45+ minutes on average
- Has 15% error rate due to manual entry
- Causes user frustration and drop-offs
- Results in incomplete submissions requiring corrections

### Root Causes
1. **No structured data import:** Only supports unstructured PDF upload with AI extraction
2. **Swiss banks provide eCH-0196 standard files:** But we don't parse them
3. **Employers provide Swissdec ELM files:** But we don't support them
4. **Competitive disadvantage:** Other Swiss tax software supports these standards

### Impact of Not Solving
- **User Experience:** Continued frustration, low completion rates
- **Market Position:** Competitors have this feature (TaxInfo, VaudTax, etc.)
- **Data Quality:** Manual entry errors lead to rejected filings
- **Business Growth:** Feature gap preventing enterprise adoption

---

## 2. Solution Architecture

### High-Level Approach

We will **extend our existing document upload system** rather than building a new subsystem. This leverages:
- ✅ Existing S3 upload infrastructure
- ✅ Existing document metadata storage (`swisstax.documents`)
- ✅ Existing interview session management
- ✅ Existing AI extraction service (for fallback)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│  Question Card (Existing)                                       │
│  ├── Input Field                                                │
│  ├── [NEW] Import Suggestion Card (conditional)                │
│  └── [NEW] Import Dialog (modal)                               │
│      ├── Document Type Selector                                │
│      │   ⚪ eCH-0196 Bank Statement                            │
│      │   ⚪ Swissdec Salary Certificate                        │
│      │   ⚪ Other PDF (AI extraction)                          │
│      ├── File Upload Zone (reuse existing)                     │
│      ├── Processing Spinner                                     │
│      └── Preview Panel                                         │
│          ├── [NEW] BankDataPreview Component                   │
│          └── [NEW] SalaryDataPreview Component                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ API
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVICES                         │
├─────────────────────────────────────────────────────────────────┤
│  Document Upload Service (Existing)                             │
│  ├── S3 Presigned URL Generation                               │
│  └── Document Metadata Storage                                 │
│                                                                  │
│  [NEW] ECH0196Parser Service                                   │
│  ├── XML Parser (lxml)                                         │
│  ├── PDF Barcode Extractor (pyzbar, pdf2image)                │
│  └── Data Mapper (XML → Tax Profile)                          │
│                                                                  │
│  [NEW] SwissdecParser Service                                  │
│  ├── ELM XML Parser (lxml)                                     │
│  └── Salary Data Mapper (XML → Tax Profile)                   │
│                                                                  │
│  Profile Merge Service (Existing + Extensions)                 │
│  ├── Conflict Detection                                        │
│  ├── Field Merging                                             │
│  └── Data Source Tracking                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        DATA STORAGE                             │
├─────────────────────────────────────────────────────────────────┤
│  swisstax.documents (Existing + 3 new columns)                 │
│  ├── id, user_id, session_id, file_url, ... (existing)        │
│  ├── [NEW] import_standard VARCHAR(50)                        │
│  ├── [NEW] standard_data JSONB (encrypted)                    │
│  └── [NEW] auto_populated_fields TEXT[]                       │
│                                                                  │
│  swisstax.interview_sessions (Existing)                        │
│  └── profile JSONB                                             │
│      ├── capital_income: 1500                                  │
│      ├── gross_salary: 85000                                   │
│      └── [NEW] _data_sources: {...} (tracking metadata)       │
│                                                                  │
│  AWS S3 (Existing)                                             │
│  └── Documents stored with encryption                          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

#### ✅ Decision 1: Extend Existing vs. New System
**Choice:** Extend existing document upload system
**Rationale:**
- Reuses 90% of infrastructure
- No routing changes needed
- Smaller codebase
- Faster to implement and maintain

#### ✅ Decision 2: User Chooses Document Type vs. Auto-Detect
**Choice:** User explicitly chooses type before upload
**Rationale:**
- Clearer UX (user knows what to upload)
- Prevents ambiguity (what if file could be multiple types?)
- Easier to provide type-specific help text
- Simpler implementation

#### ✅ Decision 3: Parse Immediately vs. Background Job
**Choice:** Parse immediately (synchronous)
**Rationale:**
- eCH-0196/Swissdec XML files are small (~50KB typical)
- Parsing takes <2 seconds
- User needs immediate feedback
- Simpler architecture (no job queue needed)

#### ✅ Decision 4: Store in New Tables vs. Extend Existing
**Choice:** Extend existing `documents` table with 3 columns
**Rationale:**
- Minimal schema changes
- Natural fit (documents are documents)
- No complex foreign keys
- Easy rollback if needed

#### ✅ Decision 5: Keep Simple PDF Upload Option
**Choice:** Yes, maintain all three options
**Rationale:**
- Users may have non-standard documents
- Fallback for when standard import fails
- Competitive advantage (flexibility)
- Already built, no cost to keep

---

## 3. Technical Specifications

### 3.1 eCH-0196 Standard

#### Overview
- **Full Name:** eCH-0196 E-Steuerauszug (Electronic Tax Statement)
- **Current Version:** 2.2.0 (approved June 7, 2022)
- **Format:** PDF with embedded barcode + XML data
- **Barcode Type:** Data Matrix or PDF417 (2D barcodes)

#### File Formats We Support

**Option A: PDF with Barcode**
```
┌─────────────────────────────────┐
│  Tax Statement 2024             │
│                                  │
│  UBS Switzerland                 │
│  Account Summary                 │
│                                  │
│  Interest Income: CHF 1,500     │
│  ...                             │
│                                  │
│  ┌─────────┐                    │
│  │█▀▀█▀▀█│ ← Data Matrix Barcode│
│  │█ ▀ ▀ █│   (contains XML)    │
│  │█▄▄█▄▄█│                      │
│  └─────────┘                    │
└─────────────────────────────────┘
```

**Option B: Standalone XML**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<eTaxStatement xmlns="http://www.ech.ch/xmlns/eCH-0196/2">
  <reportingPeriod>
    <yearFrom>2024</yearFrom>
    <yearTo>2024</yearTo>
  </reportingPeriod>
  <bankData>
    <financialInstitution>
      <name>UBS Switzerland AG</name>
      <bic>UBSWCHZH80A</bic>
    </financialInstitution>
    <accounts>
      <account>
        <iban>CH93 0076 2011 6238 5295 7</iban>
        <accountType>checking</accountType>
        <balance>
          <openingBalance>50000.00</openingBalance>
          <closingBalance>55000.00</closingBalance>
          <currency>CHF</currency>
        </balance>
        <interest>
          <amount>1500.00</amount>
          <currency>CHF</currency>
        </interest>
      </account>
    </accounts>
    <securities>
      <position>
        <isin>CH0012032048</isin>
        <name>Roche Holding AG</name>
        <quantity>100</quantity>
        <marketValue>28500.00</marketValue>
        <dividends>350.00</dividends>
      </position>
    </securities>
    <mortgages>
      <mortgage>
        <reference>MTG-123456</reference>
        <propertyAddress>Bahnhofstrasse 1, 8001 Zürich</propertyAddress>
        <outstandingBalance>500000.00</outstandingBalance>
        <interestPaid>8750.00</interestPaid>
      </mortgage>
    </mortgages>
  </bankData>
</eTaxStatement>
```

#### Data Mapping: eCH-0196 → Tax Profile

| eCH-0196 Field | Tax Profile Field | Question |
|----------------|-------------------|----------|
| `accounts/account/interest/amount` | `capital_income` | Q08 Capital Income |
| `securities/position/dividends` | `dividend_income` | Q08 Capital Income |
| `mortgages/mortgage/interestPaid` | `mortgage_interest_deduction` | Q10 Deductions |
| `accounts/account/balance/closingBalance` | `bank_account_balance` | Wealth Tax |
| `securities/position/marketValue` | `securities_value` | Wealth Tax |
| `mortgages/mortgage/outstandingBalance` | `mortgage_debt` | Wealth Tax |

#### XSD Schema Location
```
https://www.ech.ch/de/ech/ech-0196/2.2.0
Download: eCH-0196-2-2.xsd
```

### 3.2 Swissdec ELM Standard

#### Overview
- **Full Name:** Swissdec ELM (Einheitliches Lohnmelde-Verfahren)
- **Current Versions:** 5.5, 5.4 (production), 5.0 (certification baseline)
- **Format:** XML only
- **Transmission:** Encrypted for PIV (WebService), plain for EIV (file upload)

#### File Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<SalaryDeclaration xmlns="http://www.swissdec.ch/schema/sd/20200220/SalaryDeclaration">
  <Employer>
    <UID>CHE-123.456.789</UID>
    <Name>ACME Corporation AG</Name>
    <Address>
      <Street>Industriestrasse 10</Street>
      <PostalCode>8050</PostalCode>
      <City>Zürich</City>
    </Address>
  </Employer>
  <Employee>
    <SocialSecurityNumber>756.1234.5678.90</SocialSecurityNumber>
    <FirstName>Hans</FirstName>
    <LastName>Müller</LastName>
    <EmploymentPeriod>
      <From>2024-01-01</From>
      <To>2024-12-31</To>
    </EmploymentPeriod>
  </Employee>
  <SalaryComponents>
    <GrossSalary>85000.00</GrossSalary>
    <Bonus>5000.00</Bonus>
    <ThirteenthMonth>7083.33</ThirteenthMonth>
    <CompanyCar>1200.00</CompanyCar>
  </SalaryComponents>
  <Deductions>
    <AHV>
      <EmployeeShare>4500.50</EmployeeShare>
      <EmployerShare>4500.50</EmployerShare>
      <Rate>5.3</Rate>
    </AHV>
    <ALV>
      <EmployeeShare>935.00</EmployeeShare>
      <EmployerShare>935.00</EmployerShare>
      <Rate>1.1</Rate>
    </ALV>
    <BVG>
      <EmployeeShare>5460.00</EmployeeShare>
      <EmployerShare>7280.00</EmployerShare>
    </BVG>
  </Deductions>
</SalaryDeclaration>
```

#### Data Mapping: Swissdec ELM → Tax Profile

| Swissdec ELM Field | Tax Profile Field | Question |
|-------------------|-------------------|----------|
| `SalaryComponents/GrossSalary` | `gross_salary` | Q05 Employment Income |
| `SalaryComponents/Bonus` | `bonus_income` | Q05 Employment Income |
| `SalaryComponents/ThirteenthMonth` | `thirteenth_month_salary` | Q05 Employment Income |
| `SalaryComponents/CompanyCar` | `company_car_benefit` | Q05 Taxable Benefits |
| `Deductions/AHV/EmployeeShare` | `ahv_contribution` | Q10 Social Security |
| `Deductions/ALV/EmployeeShare` | `alv_contribution` | Q10 Social Security |
| `Deductions/BVG/EmployeeShare` | `bvg_contribution` | Q10 Pension Deductions |

#### XSD Schema Location
```
https://www.swissdec.ch/elm
Download guidelines → Extract XSD from documentation
Or use SwissDecTX sample files as reference
```

---

## 4. Database Design

### 4.1 Schema Changes

#### Modify Existing Table: `swisstax.documents`

```sql
-- Migration: Add support for standard document imports
-- File: backend/migrations/versions/YYYY_MM_DD_add_standard_import_columns.py

-- Add new columns
ALTER TABLE swisstax.documents
    -- Track which standard format this document uses
    ADD COLUMN import_standard VARCHAR(50) DEFAULT NULL,
    -- Possible values: 'ech0196', 'swissdec_elm', 'manual', NULL

    -- Store the parsed structured data from standard formats
    ADD COLUMN standard_data JSONB DEFAULT NULL,
    -- This will contain the full parsed XML as JSON
    -- Will be encrypted using existing encryption layer

    -- Track which tax profile fields were auto-populated from this import
    ADD COLUMN auto_populated_fields TEXT[] DEFAULT NULL;
    -- Example: ['capital_income', 'mortgage_interest_deduction']

-- Add indexes for performance
CREATE INDEX idx_documents_import_standard ON swisstax.documents(import_standard)
    WHERE import_standard IS NOT NULL;

CREATE INDEX idx_documents_session_standard ON swisstax.documents(session_id, import_standard)
    WHERE import_standard IS NOT NULL;

-- Enable encryption on standard_data
-- (Assuming existing encryption infrastructure is in place)
-- This would use the same encryption as other JSONB fields
```

#### Update Existing: `swisstax.interview_sessions.profile`

No schema changes needed, but we'll add a new convention for tracking data sources:

```json
{
  "// Existing profile fields": "...",
  "capital_income": 1500.00,
  "gross_salary": 85000.00,
  "mortgage_interest_deduction": 8750.00,

  "// NEW: Data source tracking (metadata, not tax data)": "...",
  "_data_sources": {
    "capital_income": {
      "source": "ech0196",
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "imported_at": "2025-10-21T14:30:00Z",
      "original_value": 1500.00,
      "confidence": 1.0,
      "source_institution": "UBS Switzerland AG"
    },
    "gross_salary": {
      "source": "swissdec",
      "document_id": "660e8400-e29b-41d4-a716-446655440001",
      "imported_at": "2025-10-21T14:35:00Z",
      "original_value": 85000.00,
      "confidence": 1.0,
      "source_institution": "ACME Corporation AG"
    },
    "mortgage_interest_deduction": {
      "source": "ech0196",
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "imported_at": "2025-10-21T14:30:00Z",
      "original_value": 8750.00,
      "confidence": 1.0
    }
  },

  "// Fields prefixed with _ are metadata, not sent to tax calculation": "..."
}
```

### 4.2 Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User uploads eCH-0196 PDF                                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Create document record in swisstax.documents              │
│    - file_url: s3://bucket/documents/abc-123.pdf            │
│    - import_standard: NULL (not yet parsed)                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. POST /api/documents/{doc_id}/import-standard              │
│    - Download from S3                                        │
│    - Extract barcode → Get XML                               │
│    - Parse XML against eCH-0196 XSD                          │
│    - Validate and extract data                               │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Update document record                                    │
│    - import_standard: 'ech0196'                              │
│    - standard_data: {parsed XML as JSON} (encrypted)         │
│    - auto_populated_fields: NULL (not yet applied)           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Show preview to user                                      │
│    - Display accounts, securities, mortgages                 │
│    - Show which fields will be updated                       │
│    - Allow user to review/confirm                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. User confirms → POST /api/documents/{doc_id}/apply        │
│    - Map standard_data to profile fields                     │
│    - Detect conflicts with existing data                     │
│    - Update interview_sessions.profile                       │
│    - Add _data_sources metadata                              │
│    - Update auto_populated_fields                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Final state in database                                   │
│                                                               │
│ swisstax.documents:                                          │
│   - import_standard: 'ech0196'                               │
│   - standard_data: {full parsed data}                        │
│   - auto_populated_fields: ['capital_income', ...]          │
│                                                               │
│ swisstax.interview_sessions.profile:                         │
│   - capital_income: 1500                                     │
│   - _data_sources.capital_income: {source: 'ech0196', ...}  │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Backend Implementation

### 5.1 New Service: eCH-0196 Parser

**File:** `backend/services/ech0196_parser.py`

```python
"""
eCH-0196 Electronic Tax Statement Parser

This service handles parsing of Swiss bank e-tax statements
in the eCH-0196 standard format.

Supports:
- Direct XML parsing
- PDF with embedded Data Matrix barcode
- PDF with embedded PDF417 barcode

Dependencies:
- lxml: XML parsing and XSD validation
- pyzbar: Barcode detection and decoding
- pdf2image: PDF to image conversion for barcode extraction
- Pillow: Image processing
"""

from typing import Dict, Any, Optional, List
from decimal import Decimal
import logging
from lxml import etree
from pyzbar.pyzbar import decode
from pdf2image import convert_from_bytes
from PIL import Image
import io

logger = logging.getLogger(__name__)

class ECH0196Parser:
    """Parser for eCH-0196 electronic tax statements"""

    # eCH-0196 XML namespace
    NAMESPACE = {'ech': 'http://www.ech.ch/xmlns/eCH-0196/2'}

    def __init__(self, xsd_schema_path: Optional[str] = None):
        """
        Initialize parser with optional XSD schema for validation

        Args:
            xsd_schema_path: Path to eCH-0196-2-2.xsd file
        """
        self.xsd_schema = None
        if xsd_schema_path:
            with open(xsd_schema_path, 'rb') as f:
                schema_root = etree.XML(f.read())
                self.xsd_schema = etree.XMLSchema(schema_root)

    def parse_pdf(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Parse eCH-0196 PDF by extracting embedded barcode

        Process:
        1. Convert PDF pages to images
        2. Scan for Data Matrix or PDF417 barcodes
        3. Decode barcode to get XML
        4. Parse XML

        Args:
            pdf_bytes: Raw PDF file bytes

        Returns:
            Parsed data dictionary

        Raises:
            ValueError: If no barcode found or invalid XML
        """
        logger.info("Parsing eCH-0196 PDF - extracting barcode")

        # Convert PDF to images (check all pages, barcode usually on first page)
        images = convert_from_bytes(pdf_bytes, dpi=300, first_page=1, last_page=3)

        xml_data = None
        for page_num, image in enumerate(images, 1):
            # Detect barcodes in image
            barcodes = decode(image)

            for barcode in barcodes:
                # eCH-0196 uses Data Matrix or PDF417
                if barcode.type in ['DATAMATRIX', 'PDF417']:
                    xml_data = barcode.data.decode('utf-8')
                    logger.info(f"Found {barcode.type} barcode on page {page_num}")
                    break

            if xml_data:
                break

        if not xml_data:
            raise ValueError(
                "No eCH-0196 barcode found in PDF. "
                "Ensure the PDF contains a Data Matrix or PDF417 barcode."
            )

        # Parse the extracted XML
        return self.parse_xml(xml_data)

    def parse_xml(self, xml_content: str) -> Dict[str, Any]:
        """
        Parse eCH-0196 XML content

        Args:
            xml_content: XML string

        Returns:
            Parsed data dictionary

        Raises:
            ValueError: If XML is invalid
        """
        logger.info("Parsing eCH-0196 XML")

        try:
            root = etree.fromstring(xml_content.encode('utf-8'))
        except etree.XMLSyntaxError as e:
            raise ValueError(f"Invalid XML: {e}")

        # Validate against XSD if schema is loaded
        if self.xsd_schema and not self.xsd_schema.validate(root):
            errors = self.xsd_schema.error_log
            logger.warning(f"XML validation warnings: {errors}")
            # Don't fail on validation errors, just log them

        # Extract data
        return self._extract_data(root)

    def _extract_data(self, root: etree.Element) -> Dict[str, Any]:
        """
        Extract structured data from parsed XML

        Returns:
            {
                'reporting_period': {'year_from': 2024, 'year_to': 2024},
                'financial_institution': {
                    'name': 'UBS Switzerland AG',
                    'bic': 'UBSWCHZH80A'
                },
                'accounts': [
                    {
                        'iban': 'CH93...',
                        'type': 'checking',
                        'opening_balance': Decimal('50000.00'),
                        'closing_balance': Decimal('55000.00'),
                        'interest': Decimal('1500.00'),
                        'currency': 'CHF'
                    }
                ],
                'securities': [
                    {
                        'isin': 'CH0012032048',
                        'name': 'Roche Holding AG',
                        'quantity': 100,
                        'market_value': Decimal('28500.00'),
                        'dividends': Decimal('350.00')
                    }
                ],
                'mortgages': [
                    {
                        'reference': 'MTG-123456',
                        'property_address': 'Bahnhofstrasse 1, 8001 Zürich',
                        'outstanding_balance': Decimal('500000.00'),
                        'interest_paid': Decimal('8750.00')
                    }
                ],
                'totals': {
                    'total_interest': Decimal('1500.00'),
                    'total_dividends': Decimal('350.00'),
                    'total_assets': Decimal('83500.00'),
                    'total_liabilities': Decimal('500000.00'),
                    'net_wealth': Decimal('-416500.00')
                }
            }
        """
        ns = self.NAMESPACE

        # Extract reporting period
        period = root.find('.//ech:reportingPeriod', ns)
        reporting_period = {
            'year_from': int(period.find('ech:yearFrom', ns).text) if period is not None else None,
            'year_to': int(period.find('ech:yearTo', ns).text) if period is not None else None
        }

        # Extract financial institution
        fi = root.find('.//ech:financialInstitution', ns)
        financial_institution = {
            'name': fi.find('ech:name', ns).text if fi is not None else None,
            'bic': fi.find('ech:bic', ns).text if fi is not None else None
        }

        # Extract accounts
        accounts = []
        for account in root.findall('.//ech:accounts/ech:account', ns):
            accounts.append({
                'iban': account.find('ech:iban', ns).text,
                'type': account.find('ech:accountType', ns).text,
                'opening_balance': self._get_decimal(account, 'ech:balance/ech:openingBalance', ns),
                'closing_balance': self._get_decimal(account, 'ech:balance/ech:closingBalance', ns),
                'interest': self._get_decimal(account, 'ech:interest/ech:amount', ns),
                'currency': account.find('ech:balance/ech:currency', ns).text
            })

        # Extract securities
        securities = []
        for position in root.findall('.//ech:securities/ech:position', ns):
            securities.append({
                'isin': position.find('ech:isin', ns).text,
                'name': position.find('ech:name', ns).text,
                'quantity': int(position.find('ech:quantity', ns).text),
                'market_value': self._get_decimal(position, 'ech:marketValue', ns),
                'dividends': self._get_decimal(position, 'ech:dividends', ns)
            })

        # Extract mortgages
        mortgages = []
        for mortgage in root.findall('.//ech:mortgages/ech:mortgage', ns):
            mortgages.append({
                'reference': mortgage.find('ech:reference', ns).text,
                'property_address': mortgage.find('ech:propertyAddress', ns).text,
                'outstanding_balance': self._get_decimal(mortgage, 'ech:outstandingBalance', ns),
                'interest_paid': self._get_decimal(mortgage, 'ech:interestPaid', ns)
            })

        # Calculate totals
        total_interest = sum(acc['interest'] for acc in accounts if acc['interest'])
        total_dividends = sum(sec['dividends'] for sec in securities if sec['dividends'])
        total_assets = (
            sum(acc['closing_balance'] for acc in accounts if acc['closing_balance']) +
            sum(sec['market_value'] for sec in securities if sec['market_value'])
        )
        total_liabilities = sum(mtg['outstanding_balance'] for mtg in mortgages if mtg['outstanding_balance'])

        return {
            'reporting_period': reporting_period,
            'financial_institution': financial_institution,
            'accounts': accounts,
            'securities': securities,
            'mortgages': mortgages,
            'totals': {
                'total_interest': total_interest,
                'total_dividends': total_dividends,
                'total_assets': total_assets,
                'total_liabilities': total_liabilities,
                'net_wealth': total_assets - total_liabilities
            }
        }

    def _get_decimal(self, element: etree.Element, xpath: str, namespace: dict) -> Optional[Decimal]:
        """Helper to safely extract decimal values"""
        found = element.find(xpath, namespace)
        if found is not None and found.text:
            return Decimal(found.text)
        return Decimal('0')

    def map_to_tax_profile(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map parsed eCH-0196 data to tax profile fields

        Args:
            parsed_data: Output from parse_xml() or parse_pdf()

        Returns:
            Dictionary with tax profile field names as keys
        """
        totals = parsed_data['totals']

        return {
            # Q08 - Capital Income
            'capital_income': float(totals['total_interest']),
            'dividend_income': float(totals['total_dividends']),

            # Q10 - Deductions
            'mortgage_interest_deduction': float(
                sum(mtg['interest_paid'] for mtg in parsed_data['mortgages'])
            ),

            # Wealth Tax
            'bank_account_balance': float(
                sum(acc['closing_balance'] for acc in parsed_data['accounts'])
            ),
            'securities_value': float(
                sum(sec['market_value'] for sec in parsed_data['securities'])
            ),
            'mortgage_debt': float(totals['total_liabilities']),

            # Metadata for display
            '_ech0196_source_institution': parsed_data['financial_institution']['name'],
            '_ech0196_reporting_year': parsed_data['reporting_period']['year_to']
        }
```

### 5.2 New Service: Swissdec ELM Parser

**File:** `backend/services/swissdec_parser.py`

```python
"""
Swissdec ELM (Electronic Lohnausweis Meldung) Parser

Parses Swiss electronic salary certificates in Swissdec ELM format.

Supports versions: 5.0, 5.4, 5.5
"""

from typing import Dict, Any, Optional
from decimal import Decimal
import logging
from lxml import etree

logger = logging.getLogger(__name__)

class SwissdecParser:
    """Parser for Swissdec ELM salary certificates"""

    # Swissdec namespaces (version-specific)
    NAMESPACES = {
        '5.0': {'sd': 'http://www.swissdec.ch/schema/sd/20200220/SalaryDeclaration'},
        '5.4': {'sd': 'http://www.swissdec.ch/schema/sd/20200220/SalaryDeclaration'},
        '5.5': {'sd': 'http://www.swissdec.ch/schema/sd/20200220/SalaryDeclaration'}
    }

    def __init__(self, xsd_schema_path: Optional[str] = None):
        """
        Initialize parser

        Args:
            xsd_schema_path: Path to Swissdec ELM XSD (optional)
        """
        self.xsd_schema = None
        if xsd_schema_path:
            with open(xsd_schema_path, 'rb') as f:
                schema_root = etree.XML(f.read())
                self.xsd_schema = etree.XMLSchema(schema_root)

    def parse_xml(self, xml_content: str) -> Dict[str, Any]:
        """
        Parse Swissdec ELM XML

        Args:
            xml_content: XML string

        Returns:
            Parsed salary data
        """
        logger.info("Parsing Swissdec ELM XML")

        try:
            root = etree.fromstring(xml_content.encode('utf-8'))
        except etree.XMLSyntaxError as e:
            raise ValueError(f"Invalid XML: {e}")

        # Detect version from namespace
        version = self._detect_version(root)
        logger.info(f"Detected Swissdec ELM version: {version}")

        # Use appropriate namespace
        ns = self.NAMESPACES.get(version, self.NAMESPACES['5.0'])

        return self._extract_data(root, ns)

    def _detect_version(self, root: etree.Element) -> str:
        """Detect ELM version from XML namespace"""
        # Simplified: return default for now
        # TODO: Parse actual version from xmlns
        return '5.0'

    def _extract_data(self, root: etree.Element, ns: dict) -> Dict[str, Any]:
        """
        Extract salary data from XML

        Returns structure similar to eCH0196Parser for consistency
        """
        # Extract employer
        employer = root.find('.//sd:Employer', ns)
        employer_data = {
            'uid': employer.find('sd:UID', ns).text if employer is not None else None,
            'name': employer.find('sd:Name', ns).text if employer is not None else None
        }

        # Extract employee
        employee = root.find('.//sd:Employee', ns)
        employee_data = {
            'ssn': employee.find('sd:SocialSecurityNumber', ns).text if employee is not None else None,
            'first_name': employee.find('sd:FirstName', ns).text if employee is not None else None,
            'last_name': employee.find('sd:LastName', ns).text if employee is not None else None
        }

        # Extract salary components
        salary = root.find('.//sd:SalaryComponents', ns)
        salary_data = {
            'gross_salary': self._get_decimal(salary, 'sd:GrossSalary', ns),
            'bonus': self._get_decimal(salary, 'sd:Bonus', ns),
            'thirteenth_month': self._get_decimal(salary, 'sd:ThirteenthMonth', ns),
            'company_car': self._get_decimal(salary, 'sd:CompanyCar', ns)
        }

        # Extract deductions
        deductions = root.find('.//sd:Deductions', ns)
        ahv = deductions.find('sd:AHV', ns) if deductions is not None else None
        alv = deductions.find('sd:ALV', ns) if deductions is not None else None
        bvg = deductions.find('sd:BVG', ns) if deductions is not None else None

        deductions_data = {
            'ahv_employee': self._get_decimal(ahv, 'sd:EmployeeShare', ns),
            'alv_employee': self._get_decimal(alv, 'sd:EmployeeShare', ns),
            'bvg_employee': self._get_decimal(bvg, 'sd:EmployeeShare', ns)
        }

        # Calculate totals
        total_gross = (
            salary_data['gross_salary'] +
            salary_data['bonus'] +
            salary_data['thirteenth_month'] +
            salary_data['company_car']
        )

        total_deductions = (
            deductions_data['ahv_employee'] +
            deductions_data['alv_employee'] +
            deductions_data['bvg_employee']
        )

        return {
            'employer': employer_data,
            'employee': employee_data,
            'salary': salary_data,
            'deductions': deductions_data,
            'totals': {
                'total_gross_income': total_gross,
                'total_deductions': total_deductions,
                'net_salary': total_gross - total_deductions
            }
        }

    def _get_decimal(self, element: Optional[etree.Element], xpath: str, ns: dict) -> Decimal:
        """Helper to safely extract decimal values"""
        if element is None:
            return Decimal('0')
        found = element.find(xpath, ns)
        if found is not None and found.text:
            return Decimal(found.text)
        return Decimal('0')

    def map_to_tax_profile(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map Swissdec data to tax profile fields

        Args:
            parsed_data: Output from parse_xml()

        Returns:
            Dictionary with tax profile field names as keys
        """
        salary = parsed_data['salary']
        deductions = parsed_data['deductions']
        totals = parsed_data['totals']

        return {
            # Q05 - Employment Income
            'gross_salary': float(salary['gross_salary']),
            'bonus_income': float(salary['bonus']),
            'thirteenth_month_salary': float(salary['thirteenth_month']),
            'company_car_benefit': float(salary['company_car']),
            'total_employment_income': float(totals['total_gross_income']),

            # Q10 - Deductions
            'ahv_contribution': float(deductions['ahv_employee']),
            'alv_contribution': float(deductions['alv_employee']),
            'bvg_contribution': float(deductions['bvg_employee']),
            'total_social_security_deductions': float(totals['total_deductions']),

            # Metadata
            '_swissdec_employer_name': parsed_data['employer']['name'],
            '_swissdec_employer_uid': parsed_data['employer']['uid']
        }
```

### 5.3 API Endpoints

**File:** `backend/routers/documents.py` (extend existing)

```python
# Add to existing documents.py router

from services.ech0196_parser import ECH0196Parser
from services.swissdec_parser import SwissdecParser

@router.post("/documents/{document_id}/import-standard")
async def import_standard_document(
    document_id: str,
    standard_type: str = Query(..., regex="^(ech0196|swissdec)$"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parse a standard-format document

    Process:
    1. Fetch document from database
    2. Download file from S3
    3. Parse based on standard_type
    4. Update document with parsed data
    5. Return preview

    Does NOT apply to profile - user must confirm first
    """
    # Get document
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Download from S3
    s3_client = boto3.client('s3')
    file_obj = s3_client.get_object(
        Bucket=settings.S3_BUCKET,
        Key=document.s3_key
    )
    file_bytes = file_obj['Body'].read()

    # Parse based on type
    try:
        if standard_type == 'ech0196':
            parser = ECH0196Parser(xsd_schema_path='schemas/eCH-0196-2-2.xsd')

            # Detect if PDF or XML
            if document.file_name.endswith('.pdf'):
                parsed_data = parser.parse_pdf(file_bytes)
            else:
                parsed_data = parser.parse_xml(file_bytes.decode('utf-8'))

            mapped_fields = parser.map_to_tax_profile(parsed_data)

        elif standard_type == 'swissdec':
            parser = SwissdecParser()
            parsed_data = parser.parse_xml(file_bytes.decode('utf-8'))
            mapped_fields = parser.map_to_tax_profile(parsed_data)

        # Update document
        document.import_standard = standard_type
        document.standard_data = parsed_data  # Will be encrypted
        db.commit()

        return {
            "success": True,
            "document_id": document_id,
            "standard_type": standard_type,
            "parsed_data": parsed_data,
            "mapped_fields": mapped_fields,
            "preview": {
                "source_institution": (
                    parsed_data.get('financial_institution', {}).get('name') or
                    parsed_data.get('employer', {}).get('name')
                ),
                "data_points": len(mapped_fields),
                "confidence": 1.0  # High confidence for structured data
            }
        }

    except Exception as e:
        logger.error(f"Failed to parse {standard_type}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse document: {str(e)}"
        )


@router.post("/documents/{document_id}/apply-to-profile")
async def apply_import_to_profile(
    document_id: str,
    session_id: str = Query(...),
    field_overrides: Dict[str, Any] = Body(default={}),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply extracted data to tax profile

    Process:
    1. Get document with standard_data
    2. Get interview session
    3. Map data to profile fields
    4. Handle conflicts with existing data
    5. Update profile
    6. Track data sources
    """
    # Get document
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not document or not document.standard_data:
        raise HTTPException(status_code=404, detail="Document not found or not parsed")

    # Get session
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Map data to profile
    if document.import_standard == 'ech0196':
        parser = ECH0196Parser()
        mapped_fields = parser.map_to_tax_profile(document.standard_data)
    elif document.import_standard == 'swissdec':
        parser = SwissdecParser()
        mapped_fields = parser.map_to_tax_profile(document.standard_data)

    # Apply overrides from conflict resolution
    mapped_fields.update(field_overrides)

    # Update profile
    profile = session.profile or {}
    conflicts = {}
    updated_fields = []

    for field_name, new_value in mapped_fields.items():
        # Skip metadata fields (prefixed with _)
        if field_name.startswith('_'):
            profile[field_name] = new_value
            continue

        # Check for conflicts
        if field_name in profile and profile[field_name] != new_value:
            conflicts[field_name] = {
                'existing': profile[field_name],
                'imported': new_value
            }

        # Update field
        profile[field_name] = new_value
        updated_fields.append(field_name)

        # Track data source
        if '_data_sources' not in profile:
            profile['_data_sources'] = {}

        profile['_data_sources'][field_name] = {
            'source': document.import_standard,
            'document_id': document_id,
            'imported_at': datetime.utcnow().isoformat(),
            'original_value': new_value,
            'confidence': 1.0
        }

    session.profile = profile
    document.auto_populated_fields = updated_fields
    db.commit()

    return {
        "success": True,
        "updated_fields": updated_fields,
        "conflicts": conflicts,
        "profile": profile
    }
```

---

## 6. Frontend Implementation

### 6.1 New Component: Import Dialog

**File:** `src/components/TaxFiling/ImportDialog.jsx`

```jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import DocumentUploadZone from '../Documents/DocumentUploadZone'; // Existing
import BankDataPreview from './BankDataPreview';
import SalaryDataPreview from './SalaryDataPreview';
import api from '../../services/api';

const STEPS = ['Choose Type', 'Upload', 'Review', 'Confirm'];

const ImportDialog = ({ open, onClose, sessionId, onImportComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [documentType, setDocumentType] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTypeSelect = () => {
    if (!documentType) {
      setError('Please select a document type');
      return;
    }
    setError(null);
    setActiveStep(1);
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    setUploadedFile(file);

    try {
      // Step 1: Get presigned URL
      const presignedRes = await api.post('/api/documents/presigned-url', {
        file_name: file.name,
        file_type: file.type,
        document_type: documentType,
        session_id: sessionId
      });

      const { presigned_url, document_id, s3_key } = presignedRes.data;
      setDocumentId(document_id);

      // Step 2: Upload to S3
      await fetch(presigned_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      // Step 3: Mark upload complete
      await api.post(`/api/documents/${document_id}/upload-complete`, {
        s3_key
      });

      // Step 4: Parse standard document
      const parseRes = await api.post(
        `/api/documents/${document_id}/import-standard`,
        null,
        { params: { standard_type: documentType } }
      );

      setExtractedData(parseRes.data);
      setActiveStep(2); // Move to review step

    } catch (err) {
      console.error('Upload/parse error:', err);
      setError(err.response?.data?.detail || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post(
        `/api/documents/${documentId}/apply-to-profile`,
        {},
        { params: { session_id: sessionId } }
      );

      setActiveStep(3); // Confirmation step

      // Notify parent component
      setTimeout(() => {
        onImportComplete(extractedData.mapped_fields);
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Apply error:', err);
      setError(err.response?.data?.detail || 'Failed to apply data');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setDocumentType('');
    setUploadedFile(null);
    setDocumentId(null);
    setExtractedData(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Tax Document</DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Choose Type */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="body1" paragraph>
              Choose the type of document you want to import:
            </Typography>

            <RadioGroup value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <FormControlLabel
                value="ech0196"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle1">Bank Statement (eCH-0196)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get from your bank's e-banking portal (UBS, PostFinance, Credit Suisse, etc.)
                      <br />
                      Auto-fills: Bank accounts, interest income, securities, mortgages
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                value="swissdec"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle1">Salary Certificate (Swissdec ELM)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get from your employer's HR department (Lohnausweis XML file)
                      <br />
                      Auto-fills: Employment income, deductions, social security, pensions
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 1: Upload */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="body2" paragraph>
              Upload your {documentType === 'ech0196' ? 'bank e-tax statement (PDF or XML)' : 'salary certificate (XML)'}
            </Typography>

            {loading ? (
              <Box textAlign="center" py={4}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Processing {uploadedFile?.name}...
                </Typography>
              </Box>
            ) : (
              <DocumentUploadZone
                onFileSelect={handleFileUpload}
                acceptedTypes={documentType === 'ech0196' ? '.pdf,.xml' : '.xml'}
                maxSizeMB={10}
              />
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: Review */}
        {activeStep === 2 && extractedData && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully extracted data from {extractedData.preview.source_institution}!
            </Alert>

            {documentType === 'ech0196' && (
              <BankDataPreview data={extractedData.parsed_data} />
            )}

            {documentType === 'swissdec' && (
              <SalaryDataPreview data={extractedData.parsed_data} />
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Confidence: {(extractedData.preview.confidence * 100).toFixed(0)}% |
              Data points: {extractedData.preview.data_points}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 3: Confirmation */}
        {activeStep === 3 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="success.main" gutterBottom>
              ✓ Data Applied Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your tax return has been updated with the imported data.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>

        {activeStep === 0 && (
          <Button onClick={handleTypeSelect} variant="contained" disabled={!documentType}>
            Next: Upload File
          </Button>
        )}

        {activeStep === 1 && (
          <Button onClick={() => setActiveStep(0)}>
            Back
          </Button>
        )}

        {activeStep === 2 && (
          <>
            <Button onClick={() => setActiveStep(1)}>
              Back
            </Button>
            <Button onClick={handleConfirmImport} variant="contained" disabled={loading}>
              {loading ? 'Applying...' : 'Apply to Tax Return'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog;
```

### 6.2 Preview Components

**File:** `src/components/TaxFiling/BankDataPreview.jsx`

```jsx
import React from 'react';
import { Box, Typography, Card, CardContent, Divider, Grid } from '@mui/material';

const BankDataPreview = ({ data }) => {
  const { financial_institution, accounts, securities, mortgages, totals } = data;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {financial_institution.name}
      </Typography>

      {/* Accounts */}
      {accounts && accounts.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Bank Accounts ({accounts.length})
          </Typography>
          {accounts.map((account, idx) => (
            <Card key={idx} variant="outlined" sx={{ mb: 1 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {account.iban}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Balance</Typography>
                    <Typography variant="body1">CHF {Number(account.closing_balance).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Interest Earned</Typography>
                    <Typography variant="body1">CHF {Number(account.interest).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Securities */}
      {securities && securities.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Securities ({securities.length})
          </Typography>
          {securities.map((security, idx) => (
            <Card key={idx} variant="outlined" sx={{ mb: 1 }}>
              <CardContent>
                <Typography variant="body2">{security.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ISIN: {security.isin} | Quantity: {security.quantity}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Market Value</Typography>
                    <Typography variant="body1">CHF {Number(security.market_value).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Dividends</Typography>
                    <Typography variant="body1">CHF {Number(security.dividends).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Mortgages */}
      {mortgages && mortgages.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Mortgages ({mortgages.length})
          </Typography>
          {mortgages.map((mortgage, idx) => (
            <Card key={idx} variant="outlined" sx={{ mb: 1 }}>
              <CardContent>
                <Typography variant="body2">{mortgage.property_address}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Outstanding Balance</Typography>
                    <Typography variant="body1">CHF {Number(mortgage.outstanding_balance).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Interest Paid</Typography>
                    <Typography variant="body1">CHF {Number(mortgage.interest_paid).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Totals */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1 }}>
        <Typography variant="body1" fontWeight="bold">
          Total Interest Income: CHF {Number(totals.total_interest).toLocaleString()}
        </Typography>
        <Typography variant="body1" fontWeight="bold">
          Total Dividend Income: CHF {Number(totals.total_dividends).toLocaleString()}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          This data will be applied to your capital income section (Q08)
        </Typography>
      </Box>
    </Box>
  );
};

export default BankDataPreview;
```

**File:** `src/components/TaxFiling/SalaryDataPreview.jsx`

```jsx
import React from 'react';
import { Box, Typography, Card, CardContent, Divider, Grid } from '@mui/material';

const SalaryDataPreview = ({ data }) => {
  const { employer, salary, deductions, totals } = data;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {employer.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        UID: {employer.uid}
      </Typography>

      {/* Salary Components */}
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Income Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Gross Salary</Typography>
              <Typography variant="body1">CHF {Number(salary.gross_salary).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Bonus</Typography>
              <Typography variant="body1">CHF {Number(salary.bonus).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">13th Month</Typography>
              <Typography variant="body1">CHF {Number(salary.thirteenth_month).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Benefits</Typography>
              <Typography variant="body1">CHF {Number(salary.company_car).toLocaleString()}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" fontWeight="bold">
            Total Taxable Income: CHF {Number(totals.total_gross_income).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      {/* Deductions */}
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Deductions Already Paid</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">AHV/IV/EO</Typography>
              <Typography variant="body1">CHF {Number(deductions.ahv_employee).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">ALV</Typography>
              <Typography variant="body1">CHF {Number(deductions.alv_employee).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">BVG (Pension)</Typography>
              <Typography variant="body1">CHF {Number(deductions.bvg_employee).toLocaleString()}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" fontWeight="bold">
            Total Deductions: CHF {Number(totals.total_deductions).toLocaleString()}</Typography>
        </CardContent>
      </Card>

      {/* Info */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        This data will auto-fill Questions 5 (Employment Income) and 10 (Deductions)
      </Typography>
    </Box>
  );
};

export default SalaryDataPreview;
```

### 6.3 Update Existing: QuestionCard Component

**File:** `src/components/Interview/QuestionCard.js` (modify existing)

```jsx
// Add to existing QuestionCard.js

import ImportDialog from '../TaxFiling/ImportDialog';
import { Alert, Chip, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

// ... existing code ...

const QuestionCard = ({ question, onAnswer, currentAnswer, sessionId }) => {
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Determine if this question supports import
  const getImportType = () => {
    const importMap = {
      'Q08': 'ech0196',  // Capital income
      'Q05': 'swissdec',  // Employment income
      'Q10': 'swissdec',  // Deductions (also from salary cert)
      // Add more mappings as needed
    };
    return importMap[question.id] || null;
  };

  const importType = getImportType();

  const handleImportComplete = (mappedFields) => {
    // Auto-fill the answer from imported data
    const relevantField = Object.keys(mappedFields).find(key =>
      question.field_name === key
    );

    if (relevantField) {
      onAnswer(mappedFields[relevantField]);
    }
  };

  return (
    <Box>
      {/* Existing question rendering */}
      <Typography variant="h6">{question.text}</Typography>

      {/* NEW: Import suggestion (show if supported and no data source yet) */}
      {importType && !currentAnswer?._dataSource && (
        <Alert
          severity="info"
          sx={{ my: 2 }}
          icon={<UploadFileIcon />}
          action={
            <Button
              size="small"
              onClick={() => setShowImportDialog(true)}
              variant="outlined"
            >
              Import
            </Button>
          }
        >
          <Typography variant="body2">
            💡 Save time: Upload your{' '}
            {importType === 'ech0196' ? 'bank statement' : 'salary certificate'} to auto-fill this question
          </Typography>
        </Alert>
      )}

      {/* Existing input field */}
      <TextField
        // ... existing props ...
        value={currentAnswer}
        onChange={(e) => onAnswer(e.target.value)}
      />

      {/* NEW: Data source badge (show if imported) */}
      {currentAnswer?._dataSource && (
        <Chip
          label={`✓ From ${currentAnswer._dataSource.source_institution || 'imported document'}`}
          size="small"
          color="success"
          sx={{ mt: 1 }}
          onClick={() => {/* TODO: Show import details */}}
        />
      )}

      {/* NEW: Import dialog */}
      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        sessionId={sessionId}
        onImportComplete={handleImportComplete}
      />

      {/* Existing navigation buttons */}
      {/* ... */}
    </Box>
  );
};
```

---

## 7. Testing Strategy

### 7.1 Test Files Acquisition

#### eCH-0196
**Source:** Real bank e-tax statements (redacted)
- **Option 1:** Create test account with UBS/PostFinance
- **Option 2:** Request anonymized samples from banks
- **Option 3:** Generate synthetic test data based on XSD

**Test File Checklist:**
- [ ] eCH-0196 PDF with Data Matrix barcode (UBS format)
- [ ] eCH-0196 PDF with PDF417 barcode (PostFinance format)
- [ ] eCH-0196 standalone XML
- [ ] eCH-0196 with multiple accounts (3+)
- [ ] eCH-0196 with securities/mortgages
- [ ] eCH-0196 with missing optional fields

#### Swissdec ELM
**Source:** SwissDecTX sample files (publicly available)
- **Download:** https://www.swissdectx.ch/downloads/
  - `SwissDecTX5_DemoFilesAndTestsOutput.zip`

**Test File Checklist:**
- [x] Swissdec ELM 5.0 XML (available)
- [x] Swissdec ELM 5.4 XML (available)
- [x] Swissdec ELM 5.5 XML (available)
- [ ] Swissdec with multiple employers (multi-job scenario)
- [ ] Swissdec with part-time employment
- [ ] Swissdec with stock options/RSUs

### 7.2 Unit Tests

**File:** `backend/tests/test_ech0196_parser.py`

```python
import pytest
from services.ech0196_parser import ECH0196Parser

class TestECH0196Parser:

    @pytest.fixture
    def parser(self):
        return ECH0196Parser()

    def test_parse_xml_basic(self, parser):
        """Test parsing basic eCH-0196 XML"""
        xml = """<?xml version="1.0"?>
        <eTaxStatement xmlns="http://www.ech.ch/xmlns/eCH-0196/2">
            <reportingPeriod><yearFrom>2024</yearFrom><yearTo>2024</yearTo></reportingPeriod>
            <bankData>
                <financialInstitution>
                    <name>Test Bank AG</name>
                </financialInstitution>
            </bankData>
        </eTaxStatement>"""

        result = parser.parse_xml(xml)
        assert result['reporting_period']['year_from'] == 2024
        assert result['financial_institution']['name'] == 'Test Bank AG'

    def test_parse_accounts(self, parser):
        """Test account extraction"""
        # Load test XML with accounts
        # Assert account balances, interest calculated correctly
        pass

    def test_parse_securities(self, parser):
        """Test securities/dividends extraction"""
        pass

    def test_parse_mortgages(self, parser):
        """Test mortgage extraction"""
        pass

    def test_map_to_profile(self, parser):
        """Test mapping to tax profile fields"""
        parsed_data = {
            'totals': {
                'total_interest': Decimal('1500.00'),
                'total_dividends': Decimal('350.00')
            },
            'mortgages': [
                {'interest_paid': Decimal('8750.00')}
            ]
        }

        mapped = parser.map_to_tax_profile(parsed_data)
        assert mapped['capital_income'] == 1500.00
        assert mapped['dividend_income'] == 350.00
        assert mapped['mortgage_interest_deduction'] == 8750.00
```

**File:** `backend/tests/test_swissdec_parser.py`

```python
import pytest
from services.swissdec_parser import SwissdecParser

class TestSwissdecParser:

    @pytest.fixture
    def parser(self):
        return SwissdecParser()

    def test_parse_xml_basic(self, parser):
        """Test parsing basic Swissdec XML"""
        # Use actual sample from SwissDecTX
        pass

    def test_parse_salary_components(self, parser):
        """Test salary extraction"""
        pass

    def test_parse_deductions(self, parser):
        """Test deductions extraction"""
        pass

    def test_map_to_profile(self, parser):
        """Test mapping to tax profile"""
        pass
```

### 7.3 Integration Tests

**File:** `backend/tests/test_import_api.py`

```python
import pytest
from fastapi.testclient import TestClient

class TestImportAPI:

    def test_import_ech0196_pdf(self, client, test_user, test_session):
        """End-to-end test: Upload PDF → Parse → Apply"""
        # Upload test PDF
        # Parse
        # Verify extracted data
        # Apply to profile
        # Verify profile updated
        pass

    def test_import_swissdec_xml(self, client, test_user, test_session):
        """End-to-end test: Upload XML → Parse → Apply"""
        pass

    def test_conflict_detection(self, client, test_user, test_session):
        """Test conflict when existing data present"""
        # Set existing capital_income = 1000
        # Import with capital_income = 1500
        # Verify conflict detected
        pass

    def test_multiple_imports(self, client, test_user, test_session):
        """Test importing both eCH-0196 and Swissdec"""
        # Import bank statement
        # Import salary certificate
        # Verify both applied correctly
        # Verify _data_sources tracks both
        pass
```

### 7.4 Frontend Tests

**File:** `src/components/TaxFiling/ImportDialog.test.jsx`

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportDialog from './ImportDialog';

describe('ImportDialog', () => {

  test('shows document type selection', () => {
    render(<ImportDialog open={true} onClose={() => {}} />);
    expect(screen.getByText(/Bank Statement/)).toBeInTheDocument();
    expect(screen.getByText(/Salary Certificate/)).toBeInTheDocument();
  });

  test('progresses through steps', async () => {
    const { container } = render(<ImportDialog open={true} onClose={() => {}} />);

    // Select type
    fireEvent.click(screen.getByLabelText(/Bank Statement/));
    fireEvent.click(screen.getByText(/Next/));

    // Should show upload step
    await waitFor(() => {
      expect(screen.getByText(/Upload/)).toBeInTheDocument();
    });
  });

  test('displays preview after successful parse', async () => {
    // Mock API calls
    // Upload file
    // Verify preview shown
  });

  test('handles parse errors gracefully', async () => {
    // Mock API error
    // Verify error message shown
  });
});
```

### 7.5 Test Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Backend parsers | 90%+ |
| API endpoints | 85%+ |
| Frontend components | 80%+ |
| Integration tests | Key user flows |

---

## 8. Implementation Timeline

### Phase 1: Preparation & Setup (Days 1-2)

**Day 1: Setup & Research**
- [ ] Download eCH-0196 XSD schemas from eCH.ch
- [ ] Download Swissdec ELM sample files from SwissDecTX
- [ ] Try to obtain real eCH-0196 samples (or create synthetic)
- [ ] Set up development environment dependencies
- [ ] Create feature branch: `feature/swiss-standards-import`

**Day 2: Database & Dependencies**
- [ ] Create database migration for 3 new columns
- [ ] Test migration on local database
- [ ] Install Python dependencies (`lxml`, `pyzbar`, `pdf2image`, `Pillow`)
- [ ] Set up schemas folder structure
- [ ] Document test file locations

**Deliverables:**
- Database migration script
- Test files organized in `backend/tests/fixtures/`
- Dependencies installed and documented

---

### Phase 2: Backend - eCH-0196 (Days 3-5)

**Day 3: eCH-0196 Parser**
- [ ] Implement `ECH0196Parser.parse_xml()`
- [ ] Implement `ECH0196Parser._extract_data()`
- [ ] Write unit tests for XML parsing
- [ ] Test with sample XML files

**Day 4: eCH-0196 PDF Barcode**
- [ ] Implement `ECH0196Parser.parse_pdf()`
- [ ] Test barcode extraction with real PDFs
- [ ] Handle edge cases (no barcode, corrupted, etc.)
- [ ] Write unit tests for PDF parsing

**Day 5: eCH-0196 API Endpoints**
- [ ] Implement `/documents/{id}/import-standard` for eCH-0196
- [ ] Implement `/documents/{id}/apply-to-profile` for eCH-0196
- [ ] Write integration tests
- [ ] Test end-to-end flow

**Deliverables:**
- `backend/services/ech0196_parser.py` (complete, tested)
- API endpoints functional
- Unit + integration tests passing

---

### Phase 3: Backend - Swissdec ELM (Days 6-7)

**Day 6: Swissdec Parser**
- [ ] Implement `SwissdecParser.parse_xml()`
- [ ] Implement `SwissdecParser._extract_data()`
- [ ] Implement `SwissdecParser.map_to_tax_profile()`
- [ ] Write unit tests
- [ ] Test with SwissDecTX sample files

**Day 7: Swissdec API Integration**
- [ ] Extend `/documents/{id}/import-standard` for Swissdec
- [ ] Extend `/documents/{id}/apply-to-profile` for Swissdec
- [ ] Write integration tests
- [ ] Test multi-employer scenario
- [ ] Backend code review & refactor

**Deliverables:**
- `backend/services/swissdec_parser.py` (complete, tested)
- All API endpoints support both standards
- Test coverage >85%

---

### Phase 4: Frontend (Days 8-10)

**Day 8: Import Dialog**
- [ ] Implement `ImportDialog.jsx` (stepper, type selection, upload)
- [ ] Integrate with existing `DocumentUploadZone`
- [ ] Wire up API calls
- [ ] Handle loading and error states
- [ ] Write component tests

**Day 9: Preview Components**
- [ ] Implement `BankDataPreview.jsx`
- [ ] Implement `SalaryDataPreview.jsx`
- [ ] Style with MUI theming
- [ ] Test with real API responses
- [ ] Write component tests

**Day 10: Integration into Interview**
- [ ] Modify `QuestionCard.js` to show import button
- [ ] Add data source badges
- [ ] Test import flow in context of full interview
- [ ] Handle import conflicts UI
- [ ] Frontend code review

**Deliverables:**
- 4 new React components (tested)
- Import flow works end-to-end in browser
- UI matches design mockups

---

### Phase 5: Testing & Polish (Days 11-12)

**Day 11: End-to-End Testing**
- [ ] Manual testing of full flows:
  - Upload eCH-0196 PDF → Parse → Preview → Apply
  - Upload eCH-0196 XML → Parse → Preview → Apply
  - Upload Swissdec XML → Parse → Preview → Apply
- [ ] Test error scenarios:
  - Invalid file format
  - Corrupted barcode
  - Missing required fields
  - Conflicts with existing data
- [ ] Test edge cases:
  - Multiple imports in one session
  - Re-importing same document
  - Removing imported data
- [ ] Performance testing:
  - Large eCH-0196 files (10+ accounts)
  - Complex Swissdec (multiple jobs)

**Day 12: Bug Fixes & Documentation**
- [ ] Fix bugs found in testing
- [ ] Update API documentation (Swagger/OpenAPI)
- [ ] Write user-facing help text
- [ ] Create internal technical docs
- [ ] Prepare demo for stakeholders

**Deliverables:**
- All test cases passing
- Bug tracker cleared
- Documentation complete

---

### Phase 6: Deployment Preparation (Day 13-15)

**Day 13: Pre-Production Testing**
- [ ] Deploy to staging environment
- [ ] Run full test suite on staging
- [ ] Test with staging database
- [ ] Verify S3 upload/download works
- [ ] Check encryption on `standard_data`

**Day 14: Performance & Security**
- [ ] Load testing (100+ concurrent users)
- [ ] Security audit:
  - SQL injection tests on new endpoints
  - XSS tests on preview components
  - File upload validation
  - Encryption verification
- [ ] Performance optimization if needed

**Day 15: Deployment & Monitoring**
- [ ] Create deployment plan
- [ ] Set up monitoring/alerting for new endpoints
- [ ] Deploy to production (blue-green or canary)
- [ ] Monitor logs for errors
- [ ] Create rollback plan

**Deliverables:**
- Feature deployed to production
- Monitoring dashboards configured
- Rollback plan documented

---

### Timeline Summary

| Phase | Duration | Key Milestone |
|-------|----------|---------------|
| Phase 1: Preparation | 2 days | Database ready, test files acquired |
| Phase 2: eCH-0196 Backend | 3 days | eCH-0196 parsing works end-to-end |
| Phase 3: Swissdec Backend | 2 days | Both standards supported in backend |
| Phase 4: Frontend | 3 days | Full import UI functional |
| Phase 5: Testing & Polish | 2 days | All tests passing, bugs fixed |
| Phase 6: Deployment | 3 days | Production deployment complete |
| **TOTAL** | **15 days** | **Feature live in production** |

**Actual Calendar Time:** 3 weeks (accounting for meetings, code review, etc.)

---

## 9. Dependencies & Resources

### 9.1 Technical Dependencies

#### Python Packages
```bash
# Add to backend/requirements.txt
lxml==5.1.0              # XML parsing with XSD validation
pyzbar==0.1.9            # Barcode detection and decoding
pdf2image==1.17.0        # PDF to image conversion
Pillow==10.2.0           # Image processing
```

#### System Dependencies
```bash
# For pdf2image (converts PDF to images for barcode scanning)
sudo apt-get install poppler-utils  # On Ubuntu/Debian
brew install poppler                 # On macOS

# For pyzbar (barcode reading)
sudo apt-get install libzbar0  # On Ubuntu/Debian
brew install zbar              # On macOS
```

#### Frontend Dependencies
```bash
# No new dependencies needed - using existing MUI components
```

### 9.2 External Resources

#### Official Schemas
- [ ] eCH-0196 XSD: https://www.ech.ch/de/ech/ech-0196/2.2.0
- [ ] Swissdec ELM XSD: https://www.swissdec.ch/elm (from guidelines)

#### Test Data
- [ ] SwissDecTX samples: https://www.swissdectx.ch/downloads/
- [ ] eCH-0196 samples: Request from banks or create synthetic

#### Documentation
- [ ] eCH-0196 Technical Guidance (PDF, German/French)
- [ ] Swissdec ELM Guidelines (PDF, by version)

### 9.3 Team Resources

| Role | Responsibility | Time Commitment |
|------|----------------|-----------------|
| **Backend Developer** | Parser implementation, API endpoints | 8 days full-time |
| **Frontend Developer** | React components, UI integration | 4 days full-time |
| **QA Engineer** | Test planning, execution, bug verification | 3 days part-time |
| **DevOps** | Deployment, monitoring setup | 1 day |
| **Product Manager** | Requirements validation, UAT | 2 days part-time |

### 9.4 Infrastructure

#### AWS S3
- **Existing:** Document storage bucket
- **Change:** None required (reuse existing)

#### Database
- **Existing:** PostgreSQL on AWS RDS
- **Change:** 1 migration script (3 columns)
- **Downtime:** None (additive change)

#### Monitoring
- **New:** Metrics for import endpoints
  - Import success/failure rate
  - Parse time (p50, p95, p99)
  - File size distribution
  - Standard type breakdown (eCH vs Swissdec)

---

## 10. Risk Analysis & Mitigation

### 10.1 Technical Risks

#### Risk 1: Barcode Extraction Fails on Some PDFs
**Likelihood:** Medium | **Impact:** High

**Scenario:** Some banks may use different barcode formats or PDF structures that our barcode reader can't handle.

**Mitigation:**
- Test with PDFs from all major Swiss banks (UBS, PostFinance, CS, Raiffeisen, ZKB)
- Implement fallback: If barcode fails, prompt user to upload XML directly
- Add logging to track which banks/formats fail
- Contact banks for format specifications if needed

**Fallback Plan:**
- Allow users to upload standalone XML (many banks provide both PDF and XML)
- Provide manual entry as last resort

---

#### Risk 2: XSD Schema Changes Break Parser
**Likelihood:** Low | **Impact:** Medium

**Scenario:** eCH or Swissdec releases new version with breaking changes.

**Mitigation:**
- Version-detect XML files and route to appropriate parser
- Maintain parsers for multiple versions (e.g., ELM 5.0, 5.4, 5.5)
- Subscribe to eCH/Swissdec mailing lists for update notifications
- Add schema version validation with clear error messages

**Monitoring:**
- Alert on parse failures
- Log schema versions encountered
- Review logs monthly for new versions

---

#### Risk 3: Performance Degradation with Large Files
**Likelihood:** Low | **Impact:** Medium

**Scenario:** User uploads very large eCH-0196 file (e.g., 100+ accounts/securities).

**Mitigation:**
- Set file size limit (10 MB should be more than enough)
- Test with large synthetic files (50+ accounts)
- Add timeout protection (30 second max parse time)
- Monitor parse times in production

**Optimization Plan:**
- If needed, move parsing to async background job
- Use streaming XML parser for very large files

---

### 10.2 Business Risks

#### Risk 4: Low User Adoption
**Likelihood:** Medium | **Impact:** Medium

**Scenario:** Users don't understand the feature or don't have access to standard files.

**Mitigation:**
- **Onboarding:** Add tutorial video showing how to download files from banks
- **Help Text:** Clear in-app guidance for each bank (e.g., "UBS: Go to Documents > Tax Reporting")
- **Analytics:** Track import attempts, success rate, drop-offs
- **User Research:** Interview users about document availability

**Success Metrics:**
- 40%+ of users attempt import within first session
- 80%+ success rate for those who attempt
- 5+ star ratings mention "easy import" feature

---

#### Risk 5: Data Accuracy Issues
**Likelihood:** Low | **Impact:** High

**Scenario:** Parser extracts incorrect data, leading to tax errors.

**Mitigation:**
- **Validation:** Show preview BEFORE applying to profile
- **User Confirmation:** Require explicit "Apply" button click
- **Audit Trail:** Store original file and parsed data for debugging
- **Comparison:** Show before/after values when conflicts detected
- **Liability:** Add disclaimer that user is responsible for verification

**Quality Assurance:**
- Manual review of 100+ real imports before launch
- Compare extracted totals with PDF human-readable values
- Add automated checks (e.g., interest shouldn't exceed 10% of balance)

---

#### Risk 6: Privacy/Security Breach
**Likelihood:** Low | **Impact:** Critical

**Scenario:** Sensitive financial data exposed due to encryption failure or access control bug.

**Mitigation:**
- **Encryption:** Use existing field-level encryption for `standard_data`
- **Access Control:** Reuse existing user authentication/authorization
- **Audit Logging:** Log all document accesses
- **Penetration Testing:** Security review before launch
- **Compliance:** Ensure GDPR compliance for data retention

**Security Checklist:**
- [ ] `standard_data` field encrypted at rest
- [ ] S3 files encrypted in transit and at rest
- [ ] No PII in logs
- [ ] Access controls tested (user can't access other users' imports)
- [ ] SQL injection tests pass
- [ ] XSS tests pass

---

### 10.3 Timeline Risks

#### Risk 7: Cannot Obtain Test Files
**Likelihood:** Medium | **Impact:** Medium

**Scenario:** We can't get real eCH-0196 samples from banks in time.

**Mitigation:**
- **Immediate Action:** Download Swissdec samples today (publicly available)
- **Synthetic Data:** Create valid eCH-0196 XML files based on XSD schema
- **Partial Launch:** Ship Swissdec first, add eCH-0196 when samples available
- **Community:** Ask Swiss tax forums/communities for sample files

---

#### Risk 8: Complexity Underestimated
**Likelihood:** Medium | **Impact:** High

**Scenario:** Implementation takes longer than 15 days due to unforeseen complexity.

**Mitigation:**
- **MVP First:** Launch with basic features, iterate on edge cases
- **Daily Standups:** Track progress, identify blockers early
- **Parallel Work:** Frontend and backend teams work simultaneously
- **Buffer Time:** Timeline includes 2-day buffer (Day 11-12 for testing/polish)

**Scope Reduction Options (if needed):**
1. Launch eCH-0196 only, add Swissdec later (save 2 days)
2. Launch XML support only, add PDF barcode later (save 2 days)
3. Launch without conflict resolution UI, handle in next iteration (save 1 day)

---

## 11. Success Criteria

### 11.1 Functional Requirements

#### Must Have (P0)
- [ ] Users can upload eCH-0196 PDF files
- [ ] System extracts barcode and parses XML from PDF
- [ ] Users can upload eCH-0196 XML files directly
- [ ] Users can upload Swissdec ELM XML files
- [ ] System parses and extracts data from both standards
- [ ] Users see preview of extracted data before applying
- [ ] Users can confirm and apply data to their tax profile
- [ ] System tracks data sources (which fields came from which import)
- [ ] Users see badges indicating imported data
- [ ] All existing functionality continues to work (regression-free)

#### Should Have (P1)
- [ ] System detects conflicts between imported and existing data
- [ ] Users can resolve conflicts via UI
- [ ] System supports multiple imports in one session (bank + salary)
- [ ] Error messages are user-friendly and actionable
- [ ] Help text explains how to download files from banks
- [ ] Users can remove imported data if needed

#### Nice to Have (P2)
- [ ] Auto-detect document type from file content
- [ ] Support for older eCH-0196 versions (2.0, 2.1)
- [ ] Support for Swissdec ELM 4.0 (in addition to 5.x)
- [ ] Batch import (multiple files at once)
- [ ] Integration with bank e-banking APIs (future)

### 11.2 Performance Requirements

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Parse Time (XML)** | <1 second | <3 seconds |
| **Parse Time (PDF barcode)** | <5 seconds | <10 seconds |
| **File Upload (5MB)** | <10 seconds | <30 seconds |
| **Preview Display** | <500ms | <2 seconds |
| **Apply to Profile** | <1 second | <3 seconds |
| **API Response Time (p95)** | <2 seconds | <5 seconds |
| **Success Rate** | >95% | >90% |

### 11.3 Quality Requirements

#### Code Quality
- [ ] Unit test coverage >85%
- [ ] Integration test coverage for all happy paths
- [ ] No critical security vulnerabilities
- [ ] No memory leaks or resource leaks
- [ ] Code follows project style guide
- [ ] All code reviewed by at least one other developer

#### User Experience
- [ ] Import flow takes <3 minutes end-to-end
- [ ] Error messages are actionable (tell user what to do)
- [ ] No data loss on errors (files saved to S3 before parsing)
- [ ] Mobile-responsive (dialog works on tablets)
- [ ] Accessible (WCAG 2.1 AA compliance)

### 11.4 Business Metrics

#### Launch Metrics (Week 1)
- [ ] 0 critical bugs reported
- [ ] <5 non-critical bugs reported
- [ ] No user data loss incidents
- [ ] No security incidents
- [ ] No performance degradation in existing features

#### Success Metrics (Month 1)
- [ ] 30%+ of active users attempt import feature
- [ ] 80%+ success rate for import attempts
- [ ] 50%+ reduction in average completion time for users who import
- [ ] 4.5+ star feature rating (in-app survey)
- [ ] <2% error rate on imports

#### Growth Metrics (Month 3)
- [ ] 50%+ of active users use import feature
- [ ] 20%+ increase in overall completion rate (all users)
- [ ] Feature mentioned in 25%+ of positive reviews
- [ ] 10%+ reduction in support tickets related to data entry
- [ ] Featured in bank/employer communications as supported

---

## 12. Deployment Plan

### 12.1 Deployment Strategy

**Approach:** Blue-Green Deployment with Gradual Rollout

```
Week 1: Internal Testing
├── Deploy to staging
├── QA team tests all flows
├── Product team UAT
└── Fix any critical bugs

Week 2: Beta Release (10% of users)
├── Deploy to production (feature flag: 10% enabled)
├── Monitor metrics:
│   ├── Import success rate
│   ├── Error rate
│   ├── Parse times
│   └── User feedback
├── Fix bugs if any
└── Iterate on UX based on feedback

Week 3: Gradual Rollout
├── Day 1: 25% of users
├── Day 3: 50% of users
├── Day 5: 75% of users
├── Day 7: 100% of users
└── Monitor at each step, pause if issues

Week 4: Post-Launch
├── Monitor long-term metrics
├── Collect user feedback
├── Plan iteration 2 features
└── Document lessons learned
```

### 12.2 Pre-Deployment Checklist

#### Code
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] No console errors or warnings
- [ ] No TODO comments in production code
- [ ] Version bumped in package.json

#### Database
- [ ] Migration tested on staging
- [ ] Migration script reviewed
- [ ] Rollback script prepared
- [ ] Backup taken before migration
- [ ] Migration documented

#### Infrastructure
- [ ] S3 bucket permissions verified
- [ ] Encryption enabled on new JSONB column
- [ ] Monitoring dashboards created
- [ ] Alerts configured:
  - [ ] High error rate on import endpoints
  - [ ] Slow parse times (>10s)
  - [ ] High volume of parse failures
- [ ] Logs retention policy set

#### Documentation
- [ ] API documentation updated (Swagger)
- [ ] Internal technical docs written
- [ ] User-facing help articles published
- [ ] Support team trained on new feature
- [ ] FAQ prepared for common issues

### 12.3 Rollback Plan

**If critical issues occur, rollback in this order:**

**Step 1: Disable Feature via Feature Flag (Fastest)**
```python
# Set in environment variable or config
ENABLE_STANDARD_IMPORT = False
```
**Impact:** Feature hidden from users, existing imports still accessible
**Time:** <5 minutes

**Step 2: Revert Code Deployment**
```bash
# Switch to previous version
aws ecs update-service --service swissai-backend --task-definition previous-version
```
**Impact:** Previous code running, no import functionality
**Time:** 10-15 minutes

**Step 3: Rollback Database Migration (If Needed)**
```sql
-- Remove added columns
ALTER TABLE swisstax.documents
    DROP COLUMN import_standard,
    DROP COLUMN standard_data,
    DROP COLUMN auto_populated_fields;
```
**Impact:** Data in these columns lost (should be empty or backed up)
**Time:** 5 minutes
**Risk:** Only do if columns cause issues

### 12.4 Monitoring & Alerts

#### Key Metrics to Monitor

**Import Funnel**
```
Total Import Attempts
└── By Document Type (eCH vs Swissdec)
    ├── Parse Success
    ├── Parse Failure
    │   └── By Error Type
    └── Apply Success
```

**Performance**
- Parse time (p50, p95, p99) by document type
- File size distribution
- API response times
- S3 upload/download times

**Errors**
- Parse failures by error type:
  - Invalid XML
  - Missing barcode
  - Unsupported version
  - File too large
- Apply failures (conflicts, validation errors)
- 5xx errors on import endpoints

#### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Parse failure rate | >10% | >20% |
| API error rate (5xx) | >2% | >5% |
| Avg parse time | >5s | >10s |
| Import success rate | <85% | <75% |

### 12.5 Post-Deployment Verification

**Within 1 hour of deployment:**
- [ ] Smoke test: Upload and parse 1 eCH-0196 file
- [ ] Smoke test: Upload and parse 1 Swissdec file
- [ ] Verify monitoring dashboards showing data
- [ ] Check logs for errors
- [ ] Test on production with real user account

**Within 24 hours:**
- [ ] Review error logs
- [ ] Check user feedback channels
- [ ] Verify success rate >80%
- [ ] Review performance metrics
- [ ] Spot check 10 random imports for accuracy

**Within 1 week:**
- [ ] Retrospective meeting with team
- [ ] Review all bug reports
- [ ] Analyze user adoption rate
- [ ] Plan iteration 2 if needed

---

## 13. Open Questions & Decisions Needed

### For Product Team:

1. **Priority:** Should we launch both eCH-0196 and Swissdec together, or eCH-0196 first?
   - **Option A:** Both together (recommended in this plan)
   - **Option B:** eCH-0196 first, Swissdec 2 weeks later
   - **Impact:** Option B reduces initial scope, faster to market

2. **Conflict Resolution:** How aggressive should we be about auto-applying imports?
   - **Option A:** Always show preview, user must confirm (safer)
   - **Option B:** Auto-apply if no conflicts, only ask when conflicts (faster)
   - **Impact:** Option B better UX but riskier

3. **Data Retention:** How long should we keep imported files?
   - **Option A:** Forever (for audit trail)
   - **Option B:** 1 year after tax filing
   - **Option C:** Delete after parsing (only keep parsed data)
   - **Impact:** Storage costs vs. audit/legal requirements

4. **Pricing:** Should this be a premium feature?
   - **Option A:** Free for all users (recommended)
   - **Option B:** Only for paid plans
   - **Impact:** Adoption rate, competitive position

### For Engineering Team:

1. **Barcode Libraries:** Should we use `pyzbar` or `libdmtx`?
   - **pyzbar:** More popular, supports both Data Matrix and PDF417
   - **libdmtx:** Specialized for Data Matrix, might be more accurate
   - **Decision:** Start with pyzbar, switch if accuracy issues

2. **XSD Validation:** Should we strictly validate against XSD schemas?
   - **Option A:** Strict validation, reject invalid files
   - **Option B:** Best-effort parsing, only warn on validation errors
   - **Decision:** Option B - be lenient, banks may have minor deviations

3. **Caching:** Should we cache parsed data to avoid re-parsing on preview?
   - **Yes:** Store in `standard_data` column immediately after parse
   - **No:** Re-parse on every preview/apply call
   - **Decision:** Yes - parse once, cache in DB

### For Legal/Compliance:

1. **Disclaimer:** Do we need explicit user consent for storing imported financial data?
   - **Action:** Review with legal team
   - **Timeline:** Before Week 2 (beta release)

2. **GDPR:** What's the retention policy for `standard_data` (contains sensitive financial info)?
   - **Action:** Define retention policy
   - **Timeline:** Before production deployment

---

## 14. Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **eCH-0196** | Swiss e-government standard for electronic tax statements from banks |
| **Swissdec ELM** | Swiss standard for electronic salary certificate transmission |
| **Data Matrix** | 2D barcode format used in eCH-0196 PDFs |
| **PDF417** | Alternative 2D barcode format (used by some banks) |
| **BVG** | Berufliche Vorsorge (2nd pillar pension, mandatory in Switzerland) |
| **AHV** | Alters- und Hinterlassenenversicherung (old-age/survivors insurance) |
| **ALV** | Arbeitslosenversicherung (unemployment insurance) |
| **Lohnausweis** | Salary certificate (German) |

### B. Reference Links

- eCH-0196 Official Page: https://www.ech.ch/de/ech/ech-0196/2.2.0
- Swissdec Official Page: https://www.swissdec.ch/elm
- SwissDecTX Sample Files: https://www.swissdectx.ch/downloads/
- pyzbar Documentation: https://pypi.org/project/pyzbar/
- lxml Documentation: https://lxml.de/

### C. File Structure

```
swissai-tax/
├── backend/
│   ├── services/
│   │   ├── ech0196_parser.py          # NEW
│   │   ├── swissdec_parser.py         # NEW
│   │   └── document_service.py        # MODIFIED
│   ├── routers/
│   │   └── documents.py               # MODIFIED (add 2 endpoints)
│   ├── tests/
│   │   ├── fixtures/
│   │   │   ├── ech0196_sample.pdf
│   │   │   ├── ech0196_sample.xml
│   │   │   └── swissdec_sample.xml
│   │   ├── test_ech0196_parser.py     # NEW
│   │   ├── test_swissdec_parser.py    # NEW
│   │   └── test_import_api.py         # NEW
│   ├── schemas/
│   │   ├── eCH-0196-2-2.xsd           # Downloaded
│   │   └── swissdec-elm-5-0.xsd       # Downloaded
│   └── migrations/
│       └── versions/
│           └── 2025_10_21_add_import_columns.py  # NEW
├── src/
│   └── components/
│       ├── TaxFiling/
│       │   ├── ImportDialog.jsx       # NEW
│       │   ├── BankDataPreview.jsx    # NEW
│       │   └── SalaryDataPreview.jsx  # NEW
│       └── Interview/
│           └── QuestionCard.js        # MODIFIED
└── docs/
    └── IMPLEMENTATION_PLAN_SWISS_STANDARDS.md  # THIS FILE
```

---

## 15. Approval & Sign-Off

**This implementation plan requires approval from:**

- [ ] **Product Owner:** ___________________ Date: _______
- [ ] **Engineering Lead:** ___________________ Date: _______
- [ ] **Security Team:** ___________________ Date: _______
- [ ] **Legal/Compliance:** ___________________ Date: _______

**Approved to proceed:** Yes / No

**Conditions/Notes:**
```
[Space for approval conditions or feedback]
```

---

**END OF IMPLEMENTATION PLAN**

**Next Steps:**
1. Review this document with stakeholders
2. Address open questions (Section 13)
3. Get formal approvals (Section 15)
4. Create Jira/Linear tickets from timeline (Section 8)
5. Begin Phase 1: Preparation & Setup

**Contact for Questions:**
- Technical: [Engineering Lead Email]
- Product: [Product Manager Email]
- General: [Project Slack Channel]
