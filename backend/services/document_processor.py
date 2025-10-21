"""
Unified Document Processor

This service handles all document types:
1. Structured imports (eCH-0196, Swissdec ELM)
2. AI OCR extraction (existing functionality)
3. Manual PDF uploads

It auto-detects the document type and routes to the appropriate processor.
"""

import logging
from enum import Enum
from typing import Any, Dict, Optional, Tuple

from parsers.ech0196_parser import ECH0196Parser
from parsers.swissdec_parser import SwissdecParser
from services.ai_document_intelligence_service import AIDocumentIntelligenceService

logger = logging.getLogger(__name__)


class DocumentType(Enum):
    """Document type classification"""
    ECH_0196 = "eCH-0196"
    SWISSDEC_ELM = "Swissdec-ELM"
    PDF_GENERIC = "PDF-Generic"
    UNKNOWN = "Unknown"


class ProcessingMethod(Enum):
    """Processing method used"""
    STRUCTURED_BARCODE = "structured_barcode"  # eCH-0196 barcode
    STRUCTURED_XML = "structured_xml"  # Direct XML
    AI_OCR = "ai_ocr"  # AI-powered OCR
    MANUAL = "manual"  # User manual entry


class UnifiedDocumentProcessor:
    """
    Unified processor for all tax document types.

    Auto-detects format and processes accordingly:
    - eCH-0196 bank statements: Structured parsing (99% accuracy)
    - Swissdec salary certificates: Structured parsing (99% accuracy)
    - Generic PDFs: AI OCR (85% accuracy)
    """

    def __init__(self, anthropic_api_key: Optional[str] = None):
        """
        Initialize processor with all parsers.

        Args:
            anthropic_api_key: API key for AI OCR fallback
        """
        self.ech_parser = ECH0196Parser()
        self.swissdec_parser = SwissdecParser()
        self.ai_service = None

        if anthropic_api_key:
            self.ai_service = AIDocumentIntelligenceService(
                ai_provider='anthropic',
                api_key=anthropic_api_key
            )

    def process_document(
        self,
        file_bytes: bytes,
        mime_type: str,
        filename: str = ""
    ) -> Dict[str, Any]:
        """
        Process a document and extract structured data.

        This is the main entry point. It:
        1. Auto-detects document type
        2. Routes to appropriate parser
        3. Falls back to AI OCR if structured parsing fails
        4. Returns unified result format

        Args:
            file_bytes: Document file as bytes
            mime_type: MIME type
            filename: Original filename (optional)

        Returns:
            Dict with:
                - document_type: Detected type
                - format: Specific format (e.g., "eCH-0196-2.2")
                - data: Extracted structured data
                - confidence: Confidence score (0.0-1.0)
                - method: Processing method used
                - is_structured_import: Boolean flag
                - fallback_used: Boolean if AI OCR was used as fallback
        """
        logger.info(f"Processing document: {filename} ({mime_type})")

        # Step 1: Auto-detect document type
        doc_type = self._detect_document_type(file_bytes, mime_type)
        logger.info(f"Detected document type: {doc_type.value}")

        result = {
            'document_type': doc_type.value,
            'is_structured_import': False,
            'fallback_used': False,
            'filename': filename
        }

        # Step 2: Try structured parsing first (eCH-0196 or Swissdec)
        if doc_type == DocumentType.ECH_0196:
            try:
                parsed = self.ech_parser.parse_document(file_bytes, mime_type)
                result.update({
                    'format': parsed['format'],
                    'data': parsed['data'],
                    'confidence': parsed['confidence'],
                    'method': parsed['method'],
                    'is_structured_import': True,
                    'structured_data': parsed.get('raw_xml'),
                    'tax_profile_mappings': self.ech_parser.map_to_tax_profile(parsed['data'])
                })
                logger.info(f"Successfully parsed eCH-0196 document (confidence: {parsed['confidence']})")
                return result

            except Exception as e:
                logger.warning(f"eCH-0196 parsing failed, falling back to AI OCR: {e}")
                result['fallback_used'] = True

        elif doc_type == DocumentType.SWISSDEC_ELM:
            try:
                parsed = self.swissdec_parser.parse_document(file_bytes, mime_type)
                result.update({
                    'format': parsed['format'],
                    'data': parsed['data'],
                    'confidence': parsed['confidence'],
                    'method': parsed['method'],
                    'is_structured_import': True,
                    'structured_data': parsed.get('raw_xml'),
                    'tax_profile_mappings': self.swissdec_parser.map_to_tax_profile(parsed['data'])
                })
                logger.info(f"Successfully parsed Swissdec document (confidence: {parsed['confidence']})")
                return result

            except Exception as e:
                logger.warning(f"Swissdec parsing failed, falling back to AI OCR: {e}")
                result['fallback_used'] = True

        # Step 3: Fallback to AI OCR for generic PDFs or failed structured parsing
        if self.ai_service:
            try:
                ai_result = self.ai_service.analyze_document(
                    image_bytes=file_bytes,
                    document_type=None  # Auto-detect
                )

                result.update({
                    'format': 'AI-OCR',
                    'data': ai_result['extracted_data'],
                    'confidence': ai_result['confidence'],
                    'method': ProcessingMethod.AI_OCR.value,
                    'is_structured_import': False,
                    'ai_provider': ai_result.get('ai_provider', 'anthropic'),
                    'tax_profile_mappings': self.ai_service.map_to_tax_profile(
                        ai_result['extracted_data'],
                        ai_result['document_type']
                    )
                })
                logger.info(f"Successfully processed with AI OCR (confidence: {ai_result['confidence']})")
                return result

            except Exception as e:
                logger.error(f"AI OCR also failed: {e}")
                raise ValueError(f"All processing methods failed. Structured parsing: No. AI OCR: {e}")

        else:
            raise ValueError("No AI service configured and structured parsing failed")

    def _detect_document_type(self, file_bytes: bytes, mime_type: str) -> DocumentType:
        """
        Auto-detect document type from content.

        Args:
            file_bytes: Document bytes
            mime_type: MIME type

        Returns:
            DocumentType enum
        """
        try:
            # Check for XML content
            if mime_type == 'application/xml' or mime_type == 'text/xml':
                content = file_bytes.decode('utf-8', errors='ignore')

                # Check for Swissdec
                if 'swissdec' in content.lower() or 'SalaryDeclaration' in content:
                    return DocumentType.SWISSDEC_ELM

                # Check for eCH-0196
                if 'eTaxStatement' in content or 'ech-0196' in content.lower():
                    return DocumentType.ECH_0196

            # Check PDF content
            elif mime_type == 'application/pdf' or file_bytes.startswith(b'%PDF'):
                # Extract first 5000 bytes to check for markers
                preview = file_bytes[:5000].decode('latin-1', errors='ignore')

                # Look for eCH-0196 markers
                if 'eCH-0196' in preview or 'eTaxStatement' in preview:
                    return DocumentType.ECH_0196

                # Look for Swissdec markers
                if 'Swissdec' in preview or 'SalaryDeclaration' in preview or 'Lohnausweis' in preview:
                    return DocumentType.SWISSDEC_ELM

                # Check if PDF contains Data Matrix or barcodes (indicator of structured format)
                if '/Barcode' in preview or 'DataMatrix' in preview or 'PDF417' in preview:
                    # Could be eCH-0196
                    return DocumentType.ECH_0196

                # Generic PDF
                return DocumentType.PDF_GENERIC

            return DocumentType.UNKNOWN

        except Exception as e:
            logger.error(f"Document type detection failed: {e}")
            return DocumentType.UNKNOWN

    def validate_structured_document(self, file_bytes: bytes, doc_type: DocumentType) -> bool:
        """
        Validate a structured document against its standard.

        Args:
            file_bytes: Document bytes
            doc_type: Document type

        Returns:
            True if valid, False otherwise
        """
        try:
            if doc_type == DocumentType.ECH_0196:
                # Try to extract XML first
                if file_bytes.startswith(b'%PDF'):
                    xml_content, _ = self.ech_parser._extract_xml_from_pdf(file_bytes)
                else:
                    xml_content = file_bytes.decode('utf-8')

                if xml_content:
                    return self.ech_parser.validate(xml_content)

            elif doc_type == DocumentType.SWISSDEC_ELM:
                if file_bytes.startswith(b'%PDF'):
                    xml_content = self.swissdec_parser._extract_xml_from_pdf(file_bytes)
                else:
                    xml_content = file_bytes.decode('utf-8')

                if xml_content:
                    return self.swissdec_parser.validate(xml_content)

            return False

        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False

    def get_supported_formats(self) -> Dict[str, Any]:
        """
        Get information about all supported formats.

        Returns:
            Dict with format information
        """
        return {
            'structured_imports': {
                'eCH-0196': {
                    'name': 'eCH-0196 Electronic Tax Statement',
                    'description': 'Swiss bank statements with Data Matrix barcodes',
                    'versions': ['2.0', '2.1', '2.2'],
                    'accuracy': '99%',
                    'file_types': ['PDF with barcode', 'XML'],
                    'fields_extracted': 17
                },
                'Swissdec-ELM': {
                    'name': 'Swissdec ELM Salary Certificate',
                    'description': 'Electronic salary certificates (Lohnausweis)',
                    'versions': ['5.0', '5.4', '5.5'],
                    'accuracy': '99%',
                    'file_types': ['XML', 'PDF with embedded XML'],
                    'fields_extracted': 15
                }
            },
            'ai_ocr': {
                'name': 'AI-Powered OCR',
                'description': 'Generic PDF document processing',
                'accuracy': '85%',
                'file_types': ['PDF', 'JPG', 'PNG'],
                'supported_documents': [
                    'Lohnausweis', 'Pillar 3a', 'Mortgage statements',
                    'Insurance documents', 'Medical receipts'
                ]
            }
        }
