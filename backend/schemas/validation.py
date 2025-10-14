"""Comprehensive input validation schemas for SwissAI Tax"""

from pydantic import BaseModel, Field, validator, constr, conint, confloat
from typing import Optional, List, Dict, Any, Union
from datetime import date, datetime
from decimal import Decimal
import re
from enum import Enum


class Canton(str, Enum):
    """Swiss canton codes"""
    ZH = "ZH"  # Zurich
    BE = "BE"  # Bern
    LU = "LU"  # Lucerne
    UR = "UR"  # Uri
    SZ = "SZ"  # Schwyz
    OW = "OW"  # Obwalden
    NW = "NW"  # Nidwalden
    GL = "GL"  # Glarus
    ZG = "ZG"  # Zug
    FR = "FR"  # Fribourg
    SO = "SO"  # Solothurn
    BS = "BS"  # Basel-Stadt
    BL = "BL"  # Basel-Landschaft
    SH = "SH"  # Schaffhausen
    AR = "AR"  # Appenzell Ausserrhoden
    AI = "AI"  # Appenzell Innerrhoden
    SG = "SG"  # St. Gallen
    GR = "GR"  # Graubünden
    AG = "AG"  # Aargau
    TG = "TG"  # Thurgau
    TI = "TI"  # Ticino
    VD = "VD"  # Vaud
    VS = "VS"  # Valais
    NE = "NE"  # Neuchâtel
    GE = "GE"  # Geneva
    JU = "JU"  # Jura


class CivilStatus(str, Enum):
    """Civil status options"""
    SINGLE = "single"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"
    SEPARATED = "separated"
    REGISTERED_PARTNERSHIP = "registered_partnership"


class DocumentType(str, Enum):
    """Document types for tax filing"""
    LOHNAUSWEIS = "lohnausweis"
    BANK_STATEMENT = "bank_statement"
    INSURANCE_PREMIUM = "insurance_premium"
    MORTGAGE_STATEMENT = "mortgage_statement"
    INVESTMENT_REPORT = "investment_report"
    PENSION_CERTIFICATE = "pension_certificate"
    DONATION_RECEIPT = "donation_receipt"
    MEDICAL_INVOICE = "medical_invoice"
    EDUCATION_INVOICE = "education_invoice"
    OTHER = "other"


# Custom validators
def validate_ahv_number(v: str) -> str:
    """Validate Swiss AHV number format"""
    if not v:
        return v

    # Remove dots and spaces
    clean = re.sub(r'[.\s]', '', v)

    # Check format: 756.XXXX.XXXX.XX or 756XXXXXXXXXX
    if not re.match(r'^756\d{10}$', clean):
        raise ValueError('Invalid AHV number format. Expected: 756.XXXX.XXXX.XX')

    # Format with dots
    return f"{clean[:3]}.{clean[3:7]}.{clean[7:11]}.{clean[11:]}"


def validate_iban(v: str) -> str:
    """Validate IBAN format (Swiss)"""
    if not v:
        return v

    # Remove spaces
    clean = re.sub(r'\s', '', v.upper())

    # Check Swiss IBAN format
    if not re.match(r'^CH\d{2}[0-9A-Z]{17}$', clean):
        raise ValueError('Invalid Swiss IBAN format')

    # Verify checksum (basic)
    # Move first 4 chars to end
    rearranged = clean[4:] + clean[:4]

    # Convert letters to numbers (A=10, B=11, ..., Z=35)
    numeric = ''
    for char in rearranged:
        if char.isdigit():
            numeric += char
        else:
            numeric += str(ord(char) - ord('A') + 10)

    # Check mod 97
    if int(numeric) % 97 != 1:
        raise ValueError('Invalid IBAN checksum')

    # Format with spaces
    return f"{clean[:4]} {clean[4:8]} {clean[8:12]} {clean[12:16]} {clean[16:20]} {clean[20:]}"


def validate_phone(v: str) -> str:
    """Validate Swiss phone number"""
    if not v:
        return v

    # Remove all non-digits
    clean = re.sub(r'\D', '', v)

    # Check Swiss phone formats
    if clean.startswith('41'):
        clean = '0' + clean[2:]  # Convert international to local

    if not re.match(r'^0[0-9]{9}$', clean):
        raise ValueError('Invalid Swiss phone number')

    return clean


def validate_postal_code(v: str) -> str:
    """Validate Swiss postal code"""
    if not v:
        return v

    # Swiss postal codes are 4 digits
    if not re.match(r'^[1-9]\d{3}$', v):
        raise ValueError('Invalid Swiss postal code')

    return v


# Input validation schemas
class PersonalInfoSchema(BaseModel):
    """Personal information validation"""

    first_name: constr(min_length=1, max_length=100, strip_whitespace=True) = Field(
        ...,
        description="First name"
    )
    last_name: constr(min_length=1, max_length=100, strip_whitespace=True) = Field(
        ...,
        description="Last name"
    )
    birth_date: date = Field(
        ...,
        description="Date of birth"
    )
    ahv_number: Optional[str] = Field(
        None,
        description="AHV/AVS number"
    )
    civil_status: CivilStatus = Field(
        ...,
        description="Civil status"
    )
    nationality: constr(min_length=2, max_length=100) = Field(
        ...,
        description="Nationality"
    )
    phone: Optional[str] = Field(
        None,
        description="Phone number"
    )
    email: constr(regex=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$') = Field(
        ...,
        description="Email address"
    )

    @validator('ahv_number')
    def validate_ahv(cls, v):
        return validate_ahv_number(v) if v else v

    @validator('phone')
    def validate_phone_number(cls, v):
        return validate_phone(v) if v else v

    @validator('birth_date')
    def validate_birth_date(cls, v):
        if v > date.today():
            raise ValueError('Birth date cannot be in the future')
        if v.year < 1900:
            raise ValueError('Invalid birth year')
        return v


class AddressSchema(BaseModel):
    """Address validation"""

    street: constr(min_length=1, max_length=200, strip_whitespace=True) = Field(
        ...,
        description="Street name"
    )
    house_number: constr(min_length=1, max_length=20, strip_whitespace=True) = Field(
        ...,
        description="House number"
    )
    postal_code: str = Field(
        ...,
        description="Postal code"
    )
    city: constr(min_length=1, max_length=100, strip_whitespace=True) = Field(
        ...,
        description="City"
    )
    canton: Canton = Field(
        ...,
        description="Canton"
    )
    municipality: Optional[constr(min_length=1, max_length=100)] = Field(
        None,
        description="Municipality"
    )

    @validator('postal_code')
    def validate_postal(cls, v):
        return validate_postal_code(v)


class IncomeSchema(BaseModel):
    """Income validation"""

    gross_salary: confloat(ge=0, le=10000000) = Field(
        ...,
        description="Gross salary in CHF"
    )
    net_salary: Optional[confloat(ge=0, le=10000000)] = Field(
        None,
        description="Net salary in CHF"
    )
    bonuses: Optional[confloat(ge=0, le=10000000)] = Field(
        0,
        description="Bonuses in CHF"
    )
    other_income: Optional[confloat(ge=0, le=10000000)] = Field(
        0,
        description="Other income in CHF"
    )
    employer_name: Optional[constr(max_length=200)] = Field(
        None,
        description="Employer name"
    )
    employer_address: Optional[constr(max_length=500)] = Field(
        None,
        description="Employer address"
    )

    @validator('net_salary')
    def validate_net_salary(cls, v, values):
        if v and 'gross_salary' in values and v > values['gross_salary']:
            raise ValueError('Net salary cannot exceed gross salary')
        return v


class DeductionSchema(BaseModel):
    """Deduction validation"""

    professional_expenses: confloat(ge=0, le=1000000) = Field(
        0,
        description="Professional expenses in CHF"
    )
    insurance_premiums: confloat(ge=0, le=100000) = Field(
        0,
        description="Insurance premiums in CHF"
    )
    pillar_3a: confloat(ge=0, le=7056) = Field(  # 2024 maximum
        0,
        description="Pillar 3a contributions in CHF"
    )
    donations: confloat(ge=0, le=1000000) = Field(
        0,
        description="Charitable donations in CHF"
    )
    childcare: confloat(ge=0, le=25000) = Field(
        0,
        description="Childcare costs in CHF"
    )
    education_costs: confloat(ge=0, le=50000) = Field(
        0,
        description="Education costs in CHF"
    )
    medical_expenses: confloat(ge=0, le=100000) = Field(
        0,
        description="Medical expenses in CHF"
    )

    @validator('pillar_3a')
    def validate_pillar_3a(cls, v):
        # Check against maximum allowed (changes yearly)
        max_employed = 7056  # 2024 limit for employed
        max_self_employed = 35280  # 2024 limit for self-employed

        if v > max_self_employed:
            raise ValueError(f'Pillar 3a contribution exceeds maximum allowed ({max_self_employed} CHF)')
        return v


class BankAccountSchema(BaseModel):
    """Bank account validation"""

    bank_name: constr(min_length=1, max_length=200) = Field(
        ...,
        description="Bank name"
    )
    account_number: Optional[constr(max_length=50)] = Field(
        None,
        description="Account number"
    )
    iban: str = Field(
        ...,
        description="IBAN"
    )
    balance: confloat(ge=-1000000, le=100000000) = Field(
        ...,
        description="Account balance in CHF"
    )
    interest_received: Optional[confloat(ge=0, le=1000000)] = Field(
        0,
        description="Interest received in CHF"
    )

    @validator('iban')
    def validate_iban_format(cls, v):
        return validate_iban(v)


class DocumentUploadSchema(BaseModel):
    """Document upload validation"""

    document_type: DocumentType = Field(
        ...,
        description="Type of document"
    )
    file_name: constr(max_length=255, regex=r'^[^\/\\:*?"<>|]+$') = Field(
        ...,
        description="File name"
    )
    file_size: conint(gt=0, le=10485760) = Field(  # Max 10MB
        ...,
        description="File size in bytes"
    )
    mime_type: constr(regex=r'^(application/pdf|image/png|image/jpeg|image/jpg)$') = Field(
        ...,
        description="MIME type"
    )
    description: Optional[constr(max_length=500)] = Field(
        None,
        description="Document description"
    )

    @validator('file_name')
    def sanitize_filename(cls, v):
        # Remove potentially dangerous characters
        import os
        return os.path.basename(v)


class TaxFilingRequestSchema(BaseModel):
    """Complete tax filing request validation"""

    personal_info: PersonalInfoSchema
    address: AddressSchema
    income: IncomeSchema
    deductions: DeductionSchema
    bank_accounts: Optional[List[BankAccountSchema]] = []
    tax_year: conint(ge=2020, le=2024) = Field(
        ...,
        description="Tax year"
    )
    filing_type: constr(regex=r'^(regular|correction|late)$') = Field(
        "regular",
        description="Type of filing"
    )
    consent_given: bool = Field(
        ...,
        description="User consent for data processing"
    )

    @validator('consent_given')
    def validate_consent(cls, v):
        if not v:
            raise ValueError('User consent is required for tax filing')
        return v

    @validator('tax_year')
    def validate_tax_year(cls, v):
        current_year = datetime.now().year
        if v > current_year:
            raise ValueError('Cannot file for future tax years')
        return v


class ExtractionRequestSchema(BaseModel):
    """AI extraction request validation"""

    document_ids: List[constr(regex=r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')] = Field(
        ...,
        min_items=1,
        max_items=50,
        description="List of document UUIDs"
    )
    user_context: Optional[Dict[str, Any]] = Field(
        {},
        description="User context for extraction"
    )
    extraction_mode: constr(regex=r'^(auto|manual|hybrid)$') = Field(
        "auto",
        description="Extraction mode"
    )
    language: constr(regex=r'^(de|fr|it|en)$') = Field(
        "de",
        description="Language for extraction"
    )

    @validator('document_ids')
    def validate_unique_ids(cls, v):
        if len(v) != len(set(v)):
            raise ValueError('Duplicate document IDs not allowed')
        return v


class MinimalQuestionnaireAnswerSchema(BaseModel):
    """Minimal questionnaire answer validation"""

    question_key: constr(regex=r'^[A-Z]\d{2}$') = Field(
        ...,
        description="Question key (e.g., M01)"
    )
    answer_value: Union[str, int, float, bool, None] = Field(
        ...,
        description="Answer value"
    )
    is_skip: bool = Field(
        False,
        description="Whether question was skipped"
    )
    confidence: Optional[confloat(ge=0, le=1)] = Field(
        None,
        description="Confidence score for AI-suggested answers"
    )

    @validator('answer_value')
    def validate_answer(cls, v, values):
        if values.get('is_skip') and v is not None:
            raise ValueError('Answer value must be None when question is skipped')
        return v


class PDFGenerationRequestSchema(BaseModel):
    """PDF generation request validation"""

    canton: Canton = Field(
        ...,
        description="Canton for tax form"
    )
    tax_year: conint(ge=2020, le=2024) = Field(
        ...,
        description="Tax year"
    )
    format: constr(regex=r'^(official|summary)$') = Field(
        "official",
        description="PDF format"
    )
    include_attachments: bool = Field(
        False,
        description="Include supporting documents"
    )
    language: constr(regex=r'^(de|fr|it|en)$') = Field(
        "de",
        description="Language for PDF"
    )
    watermark: Optional[bool] = Field(
        False,
        description="Add draft watermark"
    )


# Sanitization helpers
def sanitize_string(value: str, max_length: int = 1000) -> str:
    """
    Sanitize string input

    Args:
        value: String to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized string
    """
    if not value:
        return value

    # Remove control characters
    value = re.sub(r'[\x00-\x1F\x7F]', '', value)

    # Limit length
    value = value[:max_length]

    # Strip whitespace
    value = value.strip()

    return value


def sanitize_html(value: str) -> str:
    """
    Remove HTML/script tags from string

    Args:
        value: String to sanitize

    Returns:
        Sanitized string
    """
    if not value:
        return value

    # Remove script tags
    value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)

    # Remove all HTML tags
    value = re.sub(r'<[^>]+>', '', value)

    # Decode HTML entities
    import html
    value = html.unescape(value)

    return value