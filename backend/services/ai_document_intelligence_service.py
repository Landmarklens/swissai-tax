"""
AI Document Intelligence Service

This service uses AI (GPT-4 Vision/Claude) to extract data from tax-related documents:
- Swiss salary certificates (Lohnausweis)
- Pension statements (AHV/IV)
- Property documents
- Receipts and invoices
- Bank statements
- Insurance certificates

The service uses OCR and structured extraction to auto-fill tax forms.
"""

import logging
import base64
import io
import json
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
from decimal import Decimal
from datetime import datetime

try:
    from PIL import Image
except ImportError:
    raise ImportError("Pillow not installed. Run: pip install pillow")

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    import openai
except ImportError:
    openai = None

logger = logging.getLogger(__name__)


class DocumentIntelligenceError(Exception):
    """Base exception for document intelligence errors"""
    pass


class UnsupportedDocumentError(DocumentIntelligenceError):
    """Raised when document type is not supported"""
    pass


class ExtractionError(DocumentIntelligenceError):
    """Raised when data extraction fails"""
    pass


class AIDocumentIntelligenceService:
    """
    AI-powered document intelligence for Swiss tax documents.

    Supports:
    - Lohnausweis (salary certificate)
    - AHV/IV statements
    - Property tax assessments
    - Receipts and invoices
    - Bank statements
    - Insurance certificates
    """

    # Document type classification prompts
    DOCUMENT_TYPES = {
        'lohnausweis': {
            'name': 'Swiss Salary Certificate (Lohnausweis)',
            'keywords': ['lohnausweis', 'salaire', 'salary', 'arbeitgeber', 'employer'],
            'fields': [
                'employer_name', 'employer_address', 'employee_name', 'employee_ssn',
                'gross_salary', 'net_salary', 'tax_year', 'pension_contributions',
                'unemployment_insurance', 'accident_insurance'
            ]
        },
        'ahv_statement': {
            'name': 'AHV/IV Pension Statement',
            'keywords': ['ahv', 'iv', 'rente', 'pension', 'assurance-vieillesse'],
            'fields': [
                'recipient_name', 'recipient_ssn', 'annual_pension',
                'payment_start_date', 'pension_type'
            ]
        },
        'property_tax': {
            'name': 'Property Tax Assessment',
            'keywords': ['grundstücksteuer', 'taxe foncière', 'liegenschaft', 'immobilier'],
            'fields': [
                'property_address', 'property_value', 'tax_amount',
                'tax_year', 'owner_name', 'cadastral_number'
            ]
        },
        'expense_receipt': {
            'name': 'Expense Receipt',
            'keywords': ['quittung', 'reçu', 'receipt', 'rechnung', 'invoice'],
            'fields': [
                'vendor_name', 'date', 'total_amount', 'category',
                'description', 'vat_amount'
            ]
        },
        'bank_statement': {
            'name': 'Bank Statement',
            'keywords': ['kontoauszug', 'relevé', 'bank', 'compte'],
            'fields': [
                'account_holder', 'account_number', 'bank_name',
                'statement_period', 'interest_earned', 'balance'
            ]
        },
        'insurance_certificate': {
            'name': 'Insurance Certificate',
            'keywords': ['versicherung', 'assurance', 'insurance', 'prämie', 'prime'],
            'fields': [
                'policyholder_name', 'policy_number', 'insurance_company',
                'annual_premium', 'coverage_type', 'tax_year'
            ]
        },
        'pillar_3a_statement': {
            'name': 'Pillar 3a Statement',
            'keywords': ['säule 3a', 'pilier 3a', '3a', 'vorsorge', 'prévoyance'],
            'fields': [
                'account_holder', 'institution_name', 'contributions_year',
                'total_contributions', 'account_balance', 'tax_year'
            ]
        }
    }

    def __init__(self, ai_provider: str = 'anthropic', api_key: str = None):
        """
        Initialize AI document intelligence service.

        Args:
            ai_provider: 'anthropic' (Claude) or 'openai' (GPT-4)
            api_key: API key for chosen provider
        """
        self.ai_provider = ai_provider.lower()
        self.api_key = api_key

        if self.ai_provider == 'anthropic':
            if anthropic is None:
                raise ImportError("anthropic not installed. Run: pip install anthropic")
            self.client = anthropic.Anthropic(api_key=api_key)
        elif self.ai_provider == 'openai':
            if openai is None:
                raise ImportError("openai not installed. Run: pip install openai")
            self.client = openai.OpenAI(api_key=api_key)
        else:
            raise ValueError(f"Unsupported AI provider: {ai_provider}")

    def analyze_document(
        self,
        image_path: Union[str, Path] = None,
        image_bytes: bytes = None,
        document_type: str = None
    ) -> Dict[str, Any]:
        """
        Analyze a tax document and extract structured data.

        Args:
            image_path: Path to document image
            image_bytes: Document image as bytes
            document_type: Optional document type hint

        Returns:
            Dict with extracted data and metadata
        """
        # Load image
        if image_path:
            with open(image_path, 'rb') as f:
                image_bytes = f.read()
        elif image_bytes is None:
            raise ValueError("Must provide either image_path or image_bytes")

        # Detect document type if not provided
        if document_type is None:
            document_type = self._classify_document(image_bytes)

        if document_type not in self.DOCUMENT_TYPES:
            raise UnsupportedDocumentError(
                f"Document type '{document_type}' not supported. "
                f"Supported types: {list(self.DOCUMENT_TYPES.keys())}"
            )

        # Extract data based on document type
        extracted_data = self._extract_document_data(
            image_bytes,
            document_type
        )

        return {
            'document_type': document_type,
            'document_type_name': self.DOCUMENT_TYPES[document_type]['name'],
            'extracted_data': extracted_data,
            'confidence': extracted_data.get('_confidence', 0.0),
            'timestamp': datetime.utcnow().isoformat(),
            'ai_provider': self.ai_provider
        }

    def _classify_document(self, image_bytes: bytes) -> str:
        """
        Classify document type using AI vision.

        Args:
            image_bytes: Document image

        Returns:
            Document type identifier
        """
        prompt = f"""You are analyzing a Swiss tax-related document.

Based on the document content, classify it into ONE of these types:

{json.dumps({k: v['name'] for k, v in self.DOCUMENT_TYPES.items()}, indent=2)}

Look for key indicators:
- Document headers and titles
- Logos and company names
- Field labels and terminology
- Document structure and layout

Respond with ONLY the document type key (e.g., 'lohnausweis', 'ahv_statement', etc.).
If the document doesn't match any type, respond with 'unknown'.
"""

        try:
            classification = self._call_vision_ai(image_bytes, prompt)

            # Clean response
            classification = classification.strip().lower()

            if classification in self.DOCUMENT_TYPES:
                logger.info(f"Document classified as: {classification}")
                return classification
            else:
                logger.warning(f"Unknown document type: {classification}")
                return 'unknown'

        except Exception as e:
            logger.error(f"Document classification failed: {e}")
            raise ExtractionError(f"Failed to classify document: {e}")

    def _extract_document_data(
        self,
        image_bytes: bytes,
        document_type: str
    ) -> Dict[str, Any]:
        """
        Extract structured data from document.

        Args:
            image_bytes: Document image
            document_type: Document type

        Returns:
            Extracted data dict
        """
        doc_config = self.DOCUMENT_TYPES[document_type]
        expected_fields = doc_config['fields']

        prompt = f"""You are analyzing a {doc_config['name']}.

Extract the following information from this document:

{json.dumps(expected_fields, indent=2)}

Important instructions:
1. Extract data EXACTLY as it appears in the document
2. For currency amounts, extract as numbers (e.g., 85000.00, not "CHF 85'000.00")
3. For dates, use ISO format YYYY-MM-DD
4. For Swiss Social Security Numbers (AHV), use format: 756.1234.5678.97
5. If a field is not found, use null
6. Be precise with decimal numbers
7. Identify the tax year from the document

Respond with a JSON object containing:
{{
  "field_name": "extracted_value",
  ...
  "_confidence": 0.95,  // Your confidence in the extraction (0.0-1.0)
  "_notes": "Any relevant notes about the extraction"
}}

Respond ONLY with the JSON object, no additional text.
"""

        try:
            response = self._call_vision_ai(image_bytes, prompt)

            # Parse JSON response
            extracted_data = self._parse_json_response(response)

            # Validate and clean data
            validated_data = self._validate_extracted_data(
                extracted_data,
                expected_fields
            )

            logger.info(
                f"Extracted {len(validated_data)} fields from {document_type} "
                f"(confidence: {validated_data.get('_confidence', 0.0):.2f})"
            )

            return validated_data

        except Exception as e:
            logger.error(f"Data extraction failed for {document_type}: {e}")
            raise ExtractionError(f"Failed to extract data: {e}")

    def _call_vision_ai(self, image_bytes: bytes, prompt: str) -> str:
        """
        Call vision AI API.

        Args:
            image_bytes: Image data
            prompt: Analysis prompt

        Returns:
            AI response text
        """
        # Convert image to base64
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')

        # Determine image format
        image_format = self._detect_image_format(image_bytes)

        try:
            if self.ai_provider == 'anthropic':
                # Claude API
                message = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=2048,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": f"image/{image_format}",
                                        "data": image_b64
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                )
                return message.content[0].text

            elif self.ai_provider == 'openai':
                # GPT-4 Vision API
                response = self.client.chat.completions.create(
                    model="gpt-4-vision-preview",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/{image_format};base64,{image_b64}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=2048
                )
                return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Vision AI API call failed: {e}")
            raise ExtractionError(f"AI API call failed: {e}")

    def _detect_image_format(self, image_bytes: bytes) -> str:
        """Detect image format from bytes"""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            format_lower = img.format.lower()
            if format_lower == 'jpeg':
                return 'jpeg'
            elif format_lower == 'png':
                return 'png'
            elif format_lower in ('webp', 'gif'):
                return format_lower
            else:
                return 'jpeg'  # Default
        except:
            return 'jpeg'  # Default fallback

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON from AI response.

        Args:
            response: AI response text

        Returns:
            Parsed JSON dict
        """
        # Try to find JSON in response
        # Sometimes AI wraps JSON in markdown code blocks
        response = response.strip()

        # Remove markdown code blocks
        if response.startswith('```'):
            lines = response.split('\n')
            # Remove first and last line (``` markers)
            response = '\n'.join(lines[1:-1])
            # Remove 'json' language identifier
            if response.startswith('json'):
                response = response[4:].strip()

        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {response[:200]}")
            raise ExtractionError(f"Invalid JSON response from AI: {e}")

    def _validate_extracted_data(
        self,
        data: Dict[str, Any],
        expected_fields: List[str]
    ) -> Dict[str, Any]:
        """
        Validate and clean extracted data.

        Args:
            data: Extracted data
            expected_fields: Expected field names

        Returns:
            Validated data
        """
        validated = {}

        for field in expected_fields:
            value = data.get(field)

            if value is not None and value != '':
                # Clean and validate based on field type
                if 'amount' in field or 'salary' in field or 'premium' in field or 'value' in field:
                    # Currency field
                    try:
                        validated[field] = float(value)
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid currency value for {field}: {value}")
                        validated[field] = None

                elif 'date' in field:
                    # Date field - keep as string but validate format
                    validated[field] = str(value)

                elif 'ssn' in field or 'ahv' in field:
                    # SSN field - format validation
                    validated[field] = str(value)

                else:
                    # Text field
                    validated[field] = str(value)
            else:
                validated[field] = None

        # Preserve metadata
        if '_confidence' in data:
            validated['_confidence'] = float(data['_confidence'])
        if '_notes' in data:
            validated['_notes'] = str(data['_notes'])

        return validated

    def analyze_multiple_documents(
        self,
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze multiple documents and aggregate data.

        Args:
            documents: List of documents, each with 'image_path' or 'image_bytes'

        Returns:
            Aggregated analysis results
        """
        results = {
            'total_documents': len(documents),
            'successful': 0,
            'failed': 0,
            'by_type': {},
            'documents': []
        }

        for i, doc in enumerate(documents):
            try:
                analysis = self.analyze_document(
                    image_path=doc.get('image_path'),
                    image_bytes=doc.get('image_bytes'),
                    document_type=doc.get('document_type')
                )

                results['successful'] += 1
                doc_type = analysis['document_type']

                if doc_type not in results['by_type']:
                    results['by_type'][doc_type] = []

                results['by_type'][doc_type].append(analysis)
                results['documents'].append({
                    'index': i,
                    'success': True,
                    'analysis': analysis
                })

                logger.info(
                    f"✓ Document {i+1}/{len(documents)}: {doc_type} "
                    f"(confidence: {analysis['confidence']:.2f})"
                )

            except Exception as e:
                results['failed'] += 1
                results['documents'].append({
                    'index': i,
                    'success': False,
                    'error': str(e)
                })
                logger.error(f"✗ Document {i+1}/{len(documents)}: {e}")

        return results

    def map_to_tax_profile(
        self,
        extracted_data: Dict[str, Any],
        document_type: str
    ) -> Dict[str, Any]:
        """
        Map extracted document data to tax profile fields.

        Args:
            extracted_data: Data from analyze_document()
            document_type: Document type

        Returns:
            Dict mapping to tax profile field names
        """
        mapping = {}

        if document_type == 'lohnausweis':
            mapping = {
                'employment_income': extracted_data.get('gross_salary'),
                'employer_name': extracted_data.get('employer_name'),
                'pension_contributions': extracted_data.get('pension_contributions'),
                'unemployment_insurance': extracted_data.get('unemployment_insurance'),
            }

        elif document_type == 'ahv_statement':
            mapping = {
                'pension_income': extracted_data.get('annual_pension'),
            }

        elif document_type == 'pillar_3a_statement':
            mapping = {
                'pillar_3a_contributions': extracted_data.get('total_contributions'),
            }

        elif document_type == 'insurance_certificate':
            mapping = {
                'insurance_premiums': extracted_data.get('annual_premium'),
            }

        elif document_type == 'property_tax':
            mapping = {
                'property_value': extracted_data.get('property_value'),
                'property_address': extracted_data.get('property_address'),
            }

        # Remove None values
        return {k: v for k, v in mapping.items() if v is not None}


def main():
    """Command-line interface for testing"""
    import argparse

    parser = argparse.ArgumentParser(
        description='AI Document Intelligence for Swiss Tax Documents'
    )
    parser.add_argument(
        '--image',
        required=True,
        help='Path to document image'
    )
    parser.add_argument(
        '--type',
        help='Document type (optional, will auto-detect if not provided)'
    )
    parser.add_argument(
        '--provider',
        default='anthropic',
        choices=['anthropic', 'openai'],
        help='AI provider'
    )
    parser.add_argument(
        '--api-key',
        help='API key (or set via environment variable)'
    )

    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    # Get API key
    api_key = args.api_key
    if not api_key:
        import os
        if args.provider == 'anthropic':
            api_key = os.getenv('ANTHROPIC_API_KEY')
        else:
            api_key = os.getenv('OPENAI_API_KEY')

    if not api_key:
        print(f"Error: No API key provided. Set via --api-key or environment variable")
        return

    # Analyze document
    service = AIDocumentIntelligenceService(
        ai_provider=args.provider,
        api_key=api_key
    )

    try:
        result = service.analyze_document(
            image_path=args.image,
            document_type=args.type
        )

        print(f"\n{'='*60}")
        print(f"Document Analysis Results")
        print(f"{'='*60}")
        print(f"Type: {result['document_type_name']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print(f"\nExtracted Data:")
        print(json.dumps(result['extracted_data'], indent=2))

        # Map to tax profile
        mapped = service.map_to_tax_profile(
            result['extracted_data'],
            result['document_type']
        )

        if mapped:
            print(f"\nMapped to Tax Profile:")
            print(json.dumps(mapped, indent=2))

    except Exception as e:
        print(f"\nError: {e}")
        raise


if __name__ == '__main__':
    main()
