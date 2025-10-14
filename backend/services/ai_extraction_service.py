"""AI Document Extraction Service for Swiss Tax Documents"""

import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from decimal import Decimal
import re
from dataclasses import dataclass
from enum import Enum

import boto3
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from ..utils.database_transaction import async_transaction_scope, retry_on_deadlock
from .encryption_service import EncryptionService, SecureDataStore
from .file_validation_service import FileValidationService

from ..models.swisstax import (
    ExtractionSession,
    DocumentExtraction,
    TaxProfile,
    ConflictResolution,
    AIExtractionTemplate,
)
from ..models import Document
from ..config import settings

logger = logging.getLogger(__name__)


class ExtractionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class DocumentType(str, Enum):
    LOHNAUSWEIS = "lohnausweis"
    BANK_STATEMENT = "bank_statement"
    BROKER_STATEMENT = "broker_statement"
    MORTGAGE_STATEMENT = "mortgage_statement"
    PROPERTY_VALUATION = "property_valuation"
    PILLAR_3A = "pillar_3a_certificate"
    PILLAR_2 = "pillar_2_statement"
    INSURANCE_PREMIUM = "insurance_premium"
    DAYCARE_INVOICE = "daycare_invoice"
    MEDICAL_INVOICE = "medical_invoice"
    DONATION_RECEIPT = "donation_receipt"
    EDUCATION_INVOICE = "education_invoice"
    BUSINESS_PNL = "business_pnl"
    VAT_STATEMENT = "vat_statement"
    FOREIGN_INCOME = "foreign_income_statement"


@dataclass
class ExtractionResult:
    """Result from AI document extraction"""
    extracted_data: Dict[str, Any]
    confidence_score: float
    conflicts: List[Dict[str, Any]]
    missing_fields: List[str]
    metadata: Dict[str, Any]


@dataclass
class ConflictInfo:
    """Information about a data conflict"""
    field_name: str
    values: List[Dict[str, Any]]
    resolution_method: str
    resolved_value: Any
    confidence: float


class AIExtractionService:
    """Service for AI-powered document extraction"""

    def __init__(self, db: Session):
        self.db = db
        self.openai_client = self._init_openai()
        self.textract_client = self._init_textract()
        self.s3_client = boto3.client('s3')
        self.encryption_service = EncryptionService()
        self.secure_store = SecureDataStore(self.encryption_service)
        self.file_validator = FileValidationService()

    def _init_openai(self) -> Optional[OpenAI]:
        """Initialize OpenAI client"""
        try:
            if hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
                return OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.warning("OpenAI API key not configured")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI: {e}")
            return None

    def _init_textract(self) -> Optional[Any]:
        """Initialize AWS Textract client"""
        try:
            return boto3.client(
                'textract',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
        except Exception as e:
            logger.warning(f"Failed to initialize Textract: {e}")
            return None

    @retry_on_deadlock(max_retries=3)
    async def extract_from_documents(
        self,
        user_id: str,
        document_ids: List[str],
        user_context: Dict[str, Any]
    ) -> ExtractionResult:
        """
        Extract tax-relevant data from multiple documents

        Args:
            user_id: User ID
            document_ids: List of document IDs to process
            user_context: User answers and profile information

        Returns:
            ExtractionResult with all extracted data
        """
        start_time = datetime.utcnow()

        # Create extraction session
        session = ExtractionSession(
            user_id=user_id,
            status=ExtractionStatus.PROCESSING,
            metadata={
                "document_count": len(document_ids),
                "user_context": user_context
            }
        )
        self.db.add(session)
        self.db.commit()

        try:
            # Validate document IDs are valid UUIDs
            import uuid
            validated_ids = []
            for doc_id in document_ids:
                try:
                    # Ensure it's a valid UUID
                    validated_id = uuid.UUID(str(doc_id))
                    validated_ids.append(str(validated_id))
                except (ValueError, TypeError):
                    logger.warning(f"Invalid document ID format: {doc_id}")
                    continue

            if not validated_ids:
                raise ValueError("No valid document IDs provided")

            # Load documents with additional security check
            documents = self.db.query(Document).filter(
                Document.id.in_(validated_ids),
                Document.user_id == user_id  # Ensure user owns the documents
            ).all()

            if not documents:
                raise ValueError("No documents found or access denied")

            # Process each document
            all_extractions = []
            for doc in documents:
                extraction = await self._process_single_document(
                    doc, session.id, user_context
                )
                all_extractions.append(extraction)

            # Merge and reconcile results
            merged_data = self._merge_extractions(all_extractions)
            conflicts = self._detect_conflicts(merged_data)
            resolved_data = await self._resolve_conflicts(conflicts, session.id)

            # Calculate overall confidence
            confidence = self._calculate_confidence(all_extractions)

            # Encrypt sensitive data before storage
            encrypted_data = self.secure_store.prepare_for_storage(resolved_data)

            # Update session with transaction
            async with async_transaction_scope(self.db) as db:
                session.status = ExtractionStatus.COMPLETED
                session.extracted_data = encrypted_data
                session.conflicts = conflicts
                session.confidence_score = confidence
                session.completed_at = datetime.utcnow()
                session.processing_time_ms = int(
                    (datetime.utcnow() - start_time).total_seconds() * 1000
                )

                # Update tax profile
                tax_profile = db.query(TaxProfile).filter_by(user_id=user_id).first()
                if not tax_profile:
                    tax_profile = TaxProfile(
                        user_id=user_id,
                        profile_type=self._determine_profile_type(resolved_data),
                        extracted_data=encrypted_data,
                        completeness_score=self._calculate_completeness(resolved_data)
                    )
                    db.add(tax_profile)
                else:
                    tax_profile.extracted_data = encrypted_data
                    tax_profile.completeness_score = self._calculate_completeness(resolved_data)
                    tax_profile.last_extraction_id = session.id

            return ExtractionResult(
                extracted_data=resolved_data,
                confidence_score=confidence,
                conflicts=conflicts,
                missing_fields=self._identify_missing_fields(resolved_data, user_context),
                metadata={
                    "session_id": str(session.id),
                    "document_count": len(documents),
                    "processing_time_ms": session.processing_time_ms
                }
            )

        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            session.status = ExtractionStatus.FAILED
            session.error_message = str(e)
            self.db.commit()
            raise

    async def _process_single_document(
        self,
        document: Document,
        session_id: str,
        user_context: Dict[str, Any]
    ) -> DocumentExtraction:
        """Process a single document"""
        start_time = datetime.utcnow()

        # Determine document type
        doc_type = self._classify_document(document)

        # Get extraction template
        template = self.db.query(AIExtractionTemplate).filter_by(
            document_type=doc_type,
            is_active=True
        ).first()

        if not template:
            logger.warning(f"No template found for document type: {doc_type}")
            template = self._get_default_template()

        # Extract text using OCR
        ocr_text = await self._extract_text_ocr(document)

        # Build AI prompt
        prompt = self._build_extraction_prompt(
            ocr_text,
            template,
            user_context,
            doc_type
        )

        # Call AI for extraction
        extracted_fields = await self._call_ai_extraction(prompt)

        # Validate extraction
        validated_fields = self._validate_extraction(
            extracted_fields,
            template.validation_rules if template else {}
        )

        # Calculate confidence scores
        confidence_scores = self._calculate_field_confidence(validated_fields)

        # Create extraction record
        extraction = DocumentExtraction(
            document_id=document.id,
            extraction_session_id=session_id,
            document_type=doc_type,
            extracted_fields=validated_fields,
            confidence_scores=confidence_scores,
            page_references=self._extract_page_references(ocr_text),
            ai_model_version=settings.AI_MODEL_VERSION,
            extraction_method="openai" if self.openai_client else "textract",
            processing_time_ms=int(
                (datetime.utcnow() - start_time).total_seconds() * 1000
            ),
            ocr_text=ocr_text[:10000]  # Store first 10k chars
        )

        self.db.add(extraction)
        self.db.commit()

        # Update document metadata
        document.ai_processed = True
        document.extraction_confidence = sum(confidence_scores.values()) / len(confidence_scores) if confidence_scores else 0
        document.extracted_metadata = validated_fields
        self.db.commit()

        return extraction

    def _classify_document(self, document: Document) -> str:
        """Classify document type based on filename and content"""
        filename = document.file_name.lower() if document.file_name else ""

        # Simple classification based on filename patterns
        patterns = {
            DocumentType.LOHNAUSWEIS: r'lohn|salary|wage|gehalt',
            DocumentType.BANK_STATEMENT: r'bank|konto|account|statement',
            DocumentType.BROKER_STATEMENT: r'broker|depot|portfolio|wertschriften',
            DocumentType.MORTGAGE_STATEMENT: r'mortgage|hypothek|darlehen',
            DocumentType.PROPERTY_VALUATION: r'property|liegenschaft|immobilie|steuerwert',
            DocumentType.PILLAR_3A: r'3a|säule.*3|pillar.*3',
            DocumentType.INSURANCE_PREMIUM: r'insurance|versicherung|prämie|premium',
            DocumentType.DAYCARE_INVOICE: r'kita|daycare|kinderbetreuung|childcare',
            DocumentType.MEDICAL_INVOICE: r'medical|arzt|doctor|spital|hospital',
            DocumentType.DONATION_RECEIPT: r'donation|spende|charity',
            DocumentType.BUSINESS_PNL: r'pnl|profit.*loss|gewinn.*verlust|business',
            DocumentType.VAT_STATEMENT: r'vat|mwst|mehrwertsteuer',
        }

        for doc_type, pattern in patterns.items():
            if re.search(pattern, filename):
                return doc_type.value

        # Default to generic document
        return "generic_document"

    async def _extract_text_ocr(self, document: Document) -> str:
        """Extract text from document using OCR"""
        if not self.textract_client:
            return ""

        try:
            # Download document from S3
            s3_key = document.s3_key or document.file_url

            # Call Textract
            response = self.textract_client.detect_document_text(
                Document={
                    'S3Object': {
                        'Bucket': settings.S3_BUCKET_NAME,
                        'Name': s3_key
                    }
                }
            )

            # Extract text from response
            text_lines = []
            for block in response.get('Blocks', []):
                if block['BlockType'] == 'LINE':
                    text_lines.append(block.get('Text', ''))

            return '\n'.join(text_lines)

        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return ""

    def _build_extraction_prompt(
        self,
        ocr_text: str,
        template: AIExtractionTemplate,
        user_context: Dict[str, Any],
        doc_type: str
    ) -> str:
        """Build the extraction prompt for AI"""

        base_prompt = """You are an AI document parser specialized in Swiss personal income & wealth tax returns.
Your job: extract all relevant tax data from the provided document and return as JSON.

Context:
- Tax year: {tax_year}
- Canton: {canton}
- Municipality: {municipality}
- Document type: {doc_type}
- User context: {user_context}

Document text:
{ocr_text}

Instructions:
{extraction_instructions}

Required output format:
{{
  "extracted_fields": {{
    // Field names and values based on document type
  }},
  "confidence": {{
    // Confidence score (0-1) for each field
  }},
  "page_references": {{
    // Page number where each field was found
  }}
}}

Return only valid JSON, no explanations."""

        instructions = template.extraction_prompt if template else f"Extract all relevant fields for {doc_type}"

        return base_prompt.format(
            tax_year=user_context.get('tax_year', 2024),
            canton=user_context.get('canton', 'Unknown'),
            municipality=user_context.get('municipality', 'Unknown'),
            doc_type=doc_type,
            user_context=json.dumps(user_context),
            ocr_text=ocr_text[:5000],  # Limit text length
            extraction_instructions=instructions
        )

    async def _call_ai_extraction(self, prompt: str) -> Dict[str, Any]:
        """Call AI model for extraction"""
        if not self.openai_client:
            # Fallback to regex extraction
            return self._fallback_extraction(prompt)

        try:
            response = self.openai_client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Swiss tax document extraction expert. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )

            content = response.choices[0].message.content
            return json.loads(content).get('extracted_fields', {})

        except Exception as e:
            logger.error(f"AI extraction failed: {e}")
            return self._fallback_extraction(prompt)

    def _fallback_extraction(self, text: str) -> Dict[str, Any]:
        """Fallback regex-based extraction"""
        extracted = {}

        # Extract common patterns
        patterns = {
            'gross_salary': r'(?:brutto|gross|total).*?(\d+[\'\d]*\.?\d*)',
            'net_salary': r'(?:netto|net).*?(\d+[\'\d]*\.?\d*)',
            'iban': r'CH\d{2}[A-Z0-9]{4}\d{12}',
            'year_end_balance': r'(?:saldo|balance).*?31\.12.*?(\d+[\'\d]*\.?\d*)',
            'ahv_number': r'\d{3}\.\d{4}\.\d{4}\.\d{2}',
        }

        for field, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1) if '(' in pattern else match.group(0)
                # Clean Swiss number format
                if field in ['gross_salary', 'net_salary', 'year_end_balance']:
                    value = value.replace("'", "").replace(",", ".")
                extracted[field] = value

        return extracted

    def _validate_extraction(
        self,
        fields: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate extracted fields against rules"""
        validated = {}

        for field_name, value in fields.items():
            if field_name in rules:
                rule = rules[field_name]

                # Type validation
                if 'type' in rule:
                    try:
                        if rule['type'] == 'number':
                            value = float(str(value).replace("'", "").replace(",", "."))
                        elif rule['type'] == 'integer':
                            value = int(value)
                    except:
                        continue

                # Range validation
                if 'min' in rule and value < rule['min']:
                    continue
                if 'max' in rule and value > rule['max']:
                    continue

                # Pattern validation
                if 'pattern' in rule:
                    if not re.match(rule['pattern'], str(value)):
                        continue

            validated[field_name] = value

        return validated

    def _calculate_field_confidence(self, fields: Dict[str, Any]) -> Dict[str, float]:
        """Calculate confidence scores for extracted fields"""
        confidence = {}

        for field_name, value in fields.items():
            # Base confidence
            score = 0.7

            # Adjust based on field characteristics
            if value:
                # Well-formatted numbers get higher confidence
                if isinstance(value, (int, float)):
                    score = 0.85

                # IBANs with correct format
                if field_name == 'iban' and re.match(r'CH\d{2}[A-Z0-9]{16}', str(value)):
                    score = 0.95

                # AHV numbers with correct format
                if field_name == 'ahv' and re.match(r'\d{3}\.\d{4}\.\d{4}\.\d{2}', str(value)):
                    score = 0.95

            confidence[field_name] = score

        return confidence

    def _extract_page_references(self, text: str) -> List[Dict[str, Any]]:
        """Extract page references from OCR text"""
        # Simple page detection (would be enhanced with actual OCR metadata)
        pages = []
        lines = text.split('\n')

        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in ['seite', 'page', 'blatt']):
                pages.append({
                    'line': i + 1,
                    'text': line[:100]
                })

        return pages

    def _merge_extractions(
        self,
        extractions: List[DocumentExtraction]
    ) -> Dict[str, Any]:
        """Merge data from multiple document extractions"""
        merged = {
            'personal': {},
            'employment': [],
            'bank_accounts': [],
            'securities': {},
            'pensions': [],
            'mortgages': [],
            'properties': [],
            'deductions': {},
            'foreign_income': []
        }

        for extraction in extractions:
            fields = extraction.extracted_fields
            doc_type = extraction.document_type

            # Route to appropriate section based on document type
            if doc_type == DocumentType.LOHNAUSWEIS.value:
                merged['employment'].append(fields)
            elif doc_type == DocumentType.BANK_STATEMENT.value:
                merged['bank_accounts'].append(fields)
            elif doc_type == DocumentType.BROKER_STATEMENT.value:
                merged['securities'] = fields
            elif doc_type == DocumentType.MORTGAGE_STATEMENT.value:
                merged['mortgages'].append(fields)
            elif doc_type == DocumentType.PROPERTY_VALUATION.value:
                merged['properties'].append(fields)
            elif doc_type in [DocumentType.PILLAR_3A.value, DocumentType.PILLAR_2.value]:
                merged['pensions'].append(fields)
            elif doc_type == DocumentType.FOREIGN_INCOME.value:
                merged['foreign_income'].append(fields)
            else:
                # Add to deductions
                for key, value in fields.items():
                    if key not in merged['deductions']:
                        merged['deductions'][key] = []
                    merged['deductions'][key].append(value)

        return merged

    def _detect_conflicts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect conflicts in merged data"""
        conflicts = []

        # Check for duplicate accounts with different balances
        if len(data.get('bank_accounts', [])) > 1:
            accounts_by_iban = {}
            for account in data['bank_accounts']:
                iban = account.get('iban')
                if iban:
                    if iban in accounts_by_iban:
                        # Conflict detected
                        conflicts.append({
                            'field': 'bank_account_balance',
                            'iban': iban,
                            'values': [
                                accounts_by_iban[iban].get('year_end_balance'),
                                account.get('year_end_balance')
                            ]
                        })
                    else:
                        accounts_by_iban[iban] = account

        # Check for multiple salary entries
        if len(data.get('employment', [])) > 1:
            total_gross = sum(
                float(emp.get('gross_salary', 0))
                for emp in data['employment']
                if emp.get('gross_salary')
            )

            # Flag if salaries seem duplicated rather than multiple employers
            salaries = [emp.get('gross_salary') for emp in data['employment']]
            if len(set(salaries)) == 1 and len(salaries) > 1:
                conflicts.append({
                    'field': 'employment_income',
                    'type': 'potential_duplicate',
                    'values': salaries
                })

        return conflicts

    async def _resolve_conflicts(
        self,
        conflicts: List[Dict[str, Any]],
        session_id: str
    ) -> Dict[str, Any]:
        """Resolve detected conflicts"""
        for conflict in conflicts:
            resolution = ConflictResolution(
                extraction_session_id=session_id,
                field_name=conflict['field'],
                conflicting_values=conflict['values'],
                resolution_method='highest_confidence'
            )

            # Apply resolution strategy
            if conflict.get('type') == 'potential_duplicate':
                # Take unique value for duplicates
                resolution.resolved_value = conflict['values'][0]
                resolution.confidence_score = 0.9
            else:
                # Take highest value for financial amounts (conservative)
                values = [v for v in conflict['values'] if v]
                if values:
                    resolution.resolved_value = max(values)
                    resolution.confidence_score = 0.7

            resolution.resolved_at = datetime.utcnow()
            self.db.add(resolution)

        self.db.commit()
        return {}  # Return resolved data structure

    def _calculate_confidence(self, extractions: List[DocumentExtraction]) -> float:
        """Calculate overall confidence score"""
        if not extractions:
            return 0.0

        total_confidence = 0
        total_fields = 0

        for extraction in extractions:
            for confidence in extraction.confidence_scores.values():
                total_confidence += confidence
                total_fields += 1

        return total_confidence / total_fields if total_fields > 0 else 0.0

    def _identify_missing_fields(
        self,
        data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> List[str]:
        """Identify missing required fields based on user profile"""
        missing = []

        # Always required
        if not data.get('employment'):
            missing.append('Lohnausweis (salary certificate)')
        if not data.get('bank_accounts'):
            missing.append('Bank year-end statements')

        # Conditional requirements
        if context.get('has_children') and not data.get('deductions', {}).get('childcare'):
            missing.append('Childcare invoices')
        if context.get('self_employed') and not data.get('business'):
            missing.append('Business P&L statement')
        if context.get('has_property') and not data.get('properties'):
            missing.append('Property valuation')
        if context.get('has_investments') and not data.get('securities'):
            missing.append('Broker/investment statements')

        return missing

    def _get_default_template(self) -> AIExtractionTemplate:
        """Get default extraction template"""
        return AIExtractionTemplate(
            document_type='generic',
            extraction_prompt='Extract all tax-relevant information including amounts, dates, names, and identifiers.',
            field_mappings={},
            validation_rules={}
        )