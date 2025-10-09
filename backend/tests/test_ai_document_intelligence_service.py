"""
Unit tests for AIDocumentIntelligenceService
Tests document classification, data extraction, and error handling
Target: 90% coverage
"""
import base64
import io
import json
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch, mock_open

import pytest
from PIL import Image

from services.ai_document_intelligence_service import (
    AIDocumentIntelligenceService,
    DocumentIntelligenceError,
    ExtractionError,
    UnsupportedDocumentError
)


class TestAIDocumentIntelligenceService:
    """Test suite for AI Document Intelligence Service"""

    @pytest.fixture
    def mock_anthropic_client(self):
        """Create mock Anthropic client"""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_content = MagicMock()
        mock_content.text = "lohnausweis"
        mock_response.content = [mock_content]
        mock_client.messages.create.return_value = mock_response
        return mock_client

    @pytest.fixture
    def mock_openai_client(self):
        """Create mock OpenAI client"""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_choice = MagicMock()
        mock_message = MagicMock()
        mock_message.content = "lohnausweis"
        mock_choice.message = mock_message
        mock_response.choices = [mock_choice]
        mock_client.chat.completions.create.return_value = mock_response
        return mock_client

    @pytest.fixture
    def sample_image_bytes(self):
        """Create sample image bytes for testing"""
        img = Image.new('RGB', (100, 100), color='white')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        return img_buffer.getvalue()

    @pytest.fixture
    def sample_extraction_response(self):
        """Sample JSON response from AI for data extraction"""
        return json.dumps({
            "employer_name": "Example AG",
            "employer_address": "Zurich",
            "employee_name": "John Doe",
            "employee_ssn": "756.1234.5678.97",
            "gross_salary": 85000.00,
            "net_salary": 70000.00,
            "tax_year": 2024,
            "pension_contributions": 7056.00,
            "unemployment_insurance": 1200.00,
            "accident_insurance": 500.00,
            "_confidence": 0.95,
            "_notes": "All fields extracted successfully"
        })

    # ============================================================================
    # INITIALIZATION TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_init_anthropic_provider(self, mock_anthropic_module):
        """Test initialization with Anthropic provider"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        assert service.ai_provider == 'anthropic'
        assert service.api_key == 'test-key'
        mock_anthropic_module.Anthropic.assert_called_once_with(api_key='test-key')

    @patch('services.ai_document_intelligence_service.openai')
    def test_init_openai_provider(self, mock_openai_module):
        """Test initialization with OpenAI provider"""
        mock_openai_module.OpenAI.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='openai',
            api_key='test-key'
        )

        assert service.ai_provider == 'openai'
        assert service.api_key == 'test-key'
        mock_openai_module.OpenAI.assert_called_once_with(api_key='test-key')

    @patch('services.ai_document_intelligence_service.anthropic', None)
    def test_init_anthropic_not_installed(self):
        """Test error when Anthropic library not installed"""
        with pytest.raises(ImportError, match="anthropic not installed"):
            AIDocumentIntelligenceService(
                ai_provider='anthropic',
                api_key='test-key'
            )

    @patch('services.ai_document_intelligence_service.openai', None)
    def test_init_openai_not_installed(self):
        """Test error when OpenAI library not installed"""
        with pytest.raises(ImportError, match="openai not installed"):
            AIDocumentIntelligenceService(
                ai_provider='openai',
                api_key='test-key'
            )

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_init_unsupported_provider(self, mock_anthropic_module):
        """Test error with unsupported AI provider"""
        with pytest.raises(ValueError, match="Unsupported AI provider"):
            AIDocumentIntelligenceService(
                ai_provider='invalid_provider',
                api_key='test-key'
            )

    # ============================================================================
    # ANALYZE DOCUMENT TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_document_with_image_path(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes,
        sample_extraction_response,
        tmp_path
    ):
        """Test analyzing document from image path"""
        # Setup
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        # Create temporary image file
        image_file = tmp_path / "test_doc.png"
        with open(image_file, 'wb') as f:
            f.write(sample_image_bytes)

        # Mock AI responses
        mock_content = MagicMock()
        mock_content.text = "lohnausweis"
        mock_response1 = MagicMock()
        mock_response1.content = [mock_content]

        mock_content2 = MagicMock()
        mock_content2.text = sample_extraction_response
        mock_response2 = MagicMock()
        mock_response2.content = [mock_content2]

        mock_anthropic_client.messages.create.side_effect = [
            mock_response1,  # Classification
            mock_response2   # Extraction
        ]

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Execute
        result = service.analyze_document(image_path=str(image_file))

        # Assert
        assert result['document_type'] == 'lohnausweis'
        assert result['document_type_name'] == 'Swiss Salary Certificate (Lohnausweis)'
        assert result['confidence'] == 0.95
        assert result['ai_provider'] == 'anthropic'
        assert 'extracted_data' in result
        assert result['extracted_data']['employer_name'] == 'Example AG'
        assert result['extracted_data']['gross_salary'] == 85000.00

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_document_with_image_bytes(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes,
        sample_extraction_response
    ):
        """Test analyzing document from image bytes"""
        # Setup
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        mock_content = MagicMock()
        mock_content.text = "lohnausweis"
        mock_response1 = MagicMock()
        mock_response1.content = [mock_content]

        mock_content2 = MagicMock()
        mock_content2.text = sample_extraction_response
        mock_response2 = MagicMock()
        mock_response2.content = [mock_content2]

        mock_anthropic_client.messages.create.side_effect = [
            mock_response1,
            mock_response2
        ]

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Execute
        result = service.analyze_document(image_bytes=sample_image_bytes)

        # Assert
        assert result['document_type'] == 'lohnausweis'
        assert 'extracted_data' in result

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_document_with_provided_type(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes,
        sample_extraction_response
    ):
        """Test analyzing document with pre-specified document type"""
        # Setup
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        mock_content = MagicMock()
        mock_content.text = sample_extraction_response
        mock_response = MagicMock()
        mock_response.content = [mock_content]

        mock_anthropic_client.messages.create.return_value = mock_response

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Execute
        result = service.analyze_document(
            image_bytes=sample_image_bytes,
            document_type='lohnausweis'
        )

        # Assert
        assert result['document_type'] == 'lohnausweis'
        # Should only call AI once (no classification needed)
        assert mock_anthropic_client.messages.create.call_count == 1

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_document_no_image_provided(self, mock_anthropic_module):
        """Test error when no image provided"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        with pytest.raises(ValueError, match="Must provide either image_path or image_bytes"):
            service.analyze_document()

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_document_unsupported_type(
        self,
        mock_anthropic_module,
        sample_image_bytes
    ):
        """Test error with unsupported document type"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        with pytest.raises(UnsupportedDocumentError, match="not supported"):
            service.analyze_document(
                image_bytes=sample_image_bytes,
                document_type='invalid_type'
            )

    # ============================================================================
    # CLASSIFY DOCUMENT TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_classify_document_lohnausweis(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes
    ):
        """Test document classification as lohnausweis"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        mock_content = MagicMock()
        mock_content.text = "  LOHNAUSWEIS  "  # Test whitespace and case handling
        mock_response = MagicMock()
        mock_response.content = [mock_content]
        mock_anthropic_client.messages.create.return_value = mock_response

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        result = service._classify_document(sample_image_bytes)

        assert result == 'lohnausweis'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_classify_document_unknown_type(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes
    ):
        """Test classification returns 'unknown' for unrecognized docs"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        mock_content = MagicMock()
        mock_content.text = "unknown"
        mock_response = MagicMock()
        mock_response.content = [mock_content]
        mock_anthropic_client.messages.create.return_value = mock_response

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        result = service._classify_document(sample_image_bytes)

        assert result == 'unknown'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_classify_document_ai_error(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes
    ):
        """Test classification error handling"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client
        mock_anthropic_client.messages.create.side_effect = Exception("API Error")

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        with pytest.raises(ExtractionError, match="Failed to classify document"):
            service._classify_document(sample_image_bytes)

    # ============================================================================
    # EXTRACT DOCUMENT DATA TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_extract_document_data_success(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes,
        sample_extraction_response
    ):
        """Test successful data extraction"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        mock_content = MagicMock()
        mock_content.text = sample_extraction_response
        mock_response = MagicMock()
        mock_response.content = [mock_content]
        mock_anthropic_client.messages.create.return_value = mock_response

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        result = service._extract_document_data(
            sample_image_bytes,
            'lohnausweis'
        )

        assert result['employer_name'] == 'Example AG'
        assert result['gross_salary'] == 85000.00
        assert result['_confidence'] == 0.95

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_extract_document_data_ai_error(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes
    ):
        """Test extraction error handling"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client
        mock_anthropic_client.messages.create.side_effect = Exception("API Error")

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        with pytest.raises(ExtractionError, match="Failed to extract data"):
            service._extract_document_data(sample_image_bytes, 'lohnausweis')

    # ============================================================================
    # CALL VISION AI TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_call_vision_ai_anthropic(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes
    ):
        """Test calling Anthropic vision API"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        mock_content = MagicMock()
        mock_content.text = "Test Response"
        mock_response = MagicMock()
        mock_response.content = [mock_content]
        mock_anthropic_client.messages.create.return_value = mock_response

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        result = service._call_vision_ai(sample_image_bytes, "Test prompt")

        assert result == "Test Response"
        mock_anthropic_client.messages.create.assert_called_once()
        call_args = mock_anthropic_client.messages.create.call_args
        assert call_args[1]['model'] == 'claude-3-5-sonnet-20241022'
        assert call_args[1]['max_tokens'] == 2048

    @patch('services.ai_document_intelligence_service.openai')
    def test_call_vision_ai_openai(
        self,
        mock_openai_module,
        mock_openai_client,
        sample_image_bytes
    ):
        """Test calling OpenAI vision API"""
        mock_openai_module.OpenAI.return_value = mock_openai_client

        mock_response = MagicMock()
        mock_choice = MagicMock()
        mock_message = MagicMock()
        mock_message.content = "Test Response"
        mock_choice.message = mock_message
        mock_response.choices = [mock_choice]
        mock_openai_client.chat.completions.create.return_value = mock_response

        service = AIDocumentIntelligenceService(
            ai_provider='openai',
            api_key='test-key'
        )

        result = service._call_vision_ai(sample_image_bytes, "Test prompt")

        assert result == "Test Response"
        mock_openai_client.chat.completions.create.assert_called_once()
        call_args = mock_openai_client.chat.completions.create.call_args
        assert call_args[1]['model'] == 'gpt-4-vision-preview'
        assert call_args[1]['max_tokens'] == 2048

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_call_vision_ai_error(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes
    ):
        """Test vision AI call error handling"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client
        mock_anthropic_client.messages.create.side_effect = Exception("API Error")

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        with pytest.raises(ExtractionError, match="AI API call failed"):
            service._call_vision_ai(sample_image_bytes, "Test prompt")

    # ============================================================================
    # IMAGE FORMAT DETECTION TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_detect_image_format_jpeg(self, mock_anthropic_module):
        """Test JPEG format detection"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Create JPEG image
        img = Image.new('RGB', (10, 10))
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG')

        result = service._detect_image_format(img_buffer.getvalue())
        assert result == 'jpeg'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_detect_image_format_png(self, mock_anthropic_module):
        """Test PNG format detection"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Create PNG image
        img = Image.new('RGB', (10, 10))
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')

        result = service._detect_image_format(img_buffer.getvalue())
        assert result == 'png'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_detect_image_format_invalid_defaults_to_jpeg(self, mock_anthropic_module):
        """Test invalid image defaults to JPEG"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Invalid image bytes
        result = service._detect_image_format(b'invalid data')
        assert result == 'jpeg'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_detect_image_format_bmp_defaults_to_jpeg(self, mock_anthropic_module):
        """Test BMP format (unsupported) defaults to JPEG"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Create BMP image - should fall to default 'jpeg'
        img = Image.new('RGB', (10, 10))
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='BMP')

        result = service._detect_image_format(img_buffer.getvalue())
        # BMP not in supported formats, should default to jpeg
        assert result == 'jpeg'

    # ============================================================================
    # PARSE JSON RESPONSE TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_parse_json_response_plain_json(self, mock_anthropic_module):
        """Test parsing plain JSON response"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        json_str = '{"field": "value", "number": 123}'
        result = service._parse_json_response(json_str)

        assert result['field'] == 'value'
        assert result['number'] == 123

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_parse_json_response_markdown_wrapped(self, mock_anthropic_module):
        """Test parsing JSON wrapped in markdown code blocks"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        json_str = '```json\n{"field": "value"}\n```'
        result = service._parse_json_response(json_str)

        assert result['field'] == 'value'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_parse_json_response_markdown_no_language(self, mock_anthropic_module):
        """Test parsing JSON in markdown without language identifier"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        json_str = '```\n{"field": "value"}\n```'
        result = service._parse_json_response(json_str)

        assert result['field'] == 'value'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_parse_json_response_with_json_prefix(self, mock_anthropic_module):
        """Test parsing JSON with 'json' prefix after stripping code fence"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # This specific format triggers the response[4:].strip() line
        json_str = '```\njson\n{"field": "value"}\n```'
        result = service._parse_json_response(json_str)

        assert result['field'] == 'value'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_parse_json_response_invalid_json(self, mock_anthropic_module):
        """Test error on invalid JSON"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        with pytest.raises(ExtractionError, match="Invalid JSON response"):
            service._parse_json_response('not valid json {')

    # ============================================================================
    # VALIDATE EXTRACTED DATA TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_currency_fields(self, mock_anthropic_module):
        """Test validation of currency fields"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        data = {
            'gross_salary': '85000',
            'net_salary': 70000.50,
            'tax_amount': 'invalid',
            '_confidence': 0.95
        }
        expected_fields = ['gross_salary', 'net_salary', 'tax_amount']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['gross_salary'] == 85000.0
        assert result['net_salary'] == 70000.50
        assert result['tax_amount'] is None  # Invalid value
        assert result['_confidence'] == 0.95

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_date_fields(self, mock_anthropic_module):
        """Test validation of date fields"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        data = {
            'start_date': '2024-01-01',
            'end_date': 12345
        }
        expected_fields = ['start_date', 'end_date']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['start_date'] == '2024-01-01'
        assert result['end_date'] == '12345'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_ssn_fields(self, mock_anthropic_module):
        """Test validation of SSN fields"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        data = {
            'employee_ssn': '756.1234.5678.97'
        }
        expected_fields = ['employee_ssn']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['employee_ssn'] == '756.1234.5678.97'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_null_values(self, mock_anthropic_module):
        """Test handling of null/empty values"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        data = {
            'field1': None,
            'field2': '',
            'field3': 'value'
        }
        expected_fields = ['field1', 'field2', 'field3']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['field1'] is None
        assert result['field2'] is None
        assert result['field3'] == 'value'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_preserves_metadata(self, mock_anthropic_module):
        """Test that metadata fields are preserved"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        data = {
            'field1': 'value',
            '_confidence': 0.88,
            '_notes': 'Some extraction notes'
        }
        expected_fields = ['field1']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['_confidence'] == 0.88
        assert result['_notes'] == 'Some extraction notes'

    # ============================================================================
    # ANALYZE MULTIPLE DOCUMENTS TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_multiple_documents_success(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes,
        sample_extraction_response
    ):
        """Test analyzing multiple documents successfully"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        # Mock responses
        mock_content1 = MagicMock()
        mock_content1.text = "lohnausweis"
        mock_response1 = MagicMock()
        mock_response1.content = [mock_content1]

        mock_content2 = MagicMock()
        mock_content2.text = sample_extraction_response
        mock_response2 = MagicMock()
        mock_response2.content = [mock_content2]

        mock_anthropic_client.messages.create.side_effect = [
            mock_response1, mock_response2,  # Doc 1
            mock_response1, mock_response2   # Doc 2
        ]

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        documents = [
            {'image_bytes': sample_image_bytes},
            {'image_bytes': sample_image_bytes}
        ]

        result = service.analyze_multiple_documents(documents)

        assert result['total_documents'] == 2
        assert result['successful'] == 2
        assert result['failed'] == 0
        assert 'lohnausweis' in result['by_type']
        assert len(result['by_type']['lohnausweis']) == 2
        assert len(result['documents']) == 2

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_multiple_documents_mixed_results(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes,
        sample_extraction_response
    ):
        """Test analyzing multiple documents with some failures"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        # First doc succeeds
        mock_content1 = MagicMock()
        mock_content1.text = "lohnausweis"
        mock_response1 = MagicMock()
        mock_response1.content = [mock_content1]

        mock_content2 = MagicMock()
        mock_content2.text = sample_extraction_response
        mock_response2 = MagicMock()
        mock_response2.content = [mock_content2]

        # Second doc fails
        mock_anthropic_client.messages.create.side_effect = [
            mock_response1, mock_response2,  # Doc 1 succeeds
            Exception("API Error")            # Doc 2 fails
        ]

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        documents = [
            {'image_bytes': sample_image_bytes},
            {'image_bytes': sample_image_bytes}
        ]

        result = service.analyze_multiple_documents(documents)

        assert result['total_documents'] == 2
        assert result['successful'] == 1
        assert result['failed'] == 1
        assert result['documents'][0]['success'] is True
        assert result['documents'][1]['success'] is False
        assert 'error' in result['documents'][1]

    # ============================================================================
    # MAP TO TAX PROFILE TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_lohnausweis(self, mock_anthropic_module):
        """Test mapping lohnausweis to tax profile"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {
            'gross_salary': 85000.00,
            'employer_name': 'Example AG',
            'pension_contributions': 7056.00,
            'unemployment_insurance': 1200.00
        }

        result = service.map_to_tax_profile(extracted_data, 'lohnausweis')

        assert result['employment_income'] == 85000.00
        assert result['employer_name'] == 'Example AG'
        assert result['pension_contributions'] == 7056.00
        assert result['unemployment_insurance'] == 1200.00

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_ahv_statement(self, mock_anthropic_module):
        """Test mapping AHV statement to tax profile"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {
            'annual_pension': 24000.00
        }

        result = service.map_to_tax_profile(extracted_data, 'ahv_statement')

        assert result['pension_income'] == 24000.00

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_pillar_3a(self, mock_anthropic_module):
        """Test mapping pillar 3a statement to tax profile"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {
            'total_contributions': 7056.00
        }

        result = service.map_to_tax_profile(extracted_data, 'pillar_3a_statement')

        assert result['pillar_3a_contributions'] == 7056.00

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_insurance(self, mock_anthropic_module):
        """Test mapping insurance certificate to tax profile"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {
            'annual_premium': 3000.00
        }

        result = service.map_to_tax_profile(extracted_data, 'insurance_certificate')

        assert result['insurance_premiums'] == 3000.00

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_property_tax(self, mock_anthropic_module):
        """Test mapping property tax to tax profile"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {
            'property_value': 500000.00,
            'property_address': 'Zurich'
        }

        result = service.map_to_tax_profile(extracted_data, 'property_tax')

        assert result['property_value'] == 500000.00
        assert result['property_address'] == 'Zurich'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_filters_none_values(self, mock_anthropic_module):
        """Test that None values are filtered from mapping"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {
            'gross_salary': 85000.00,
            'employer_name': None,
            'pension_contributions': None
        }

        result = service.map_to_tax_profile(extracted_data, 'lohnausweis')

        assert 'employment_income' in result
        assert 'employer_name' not in result
        assert 'pension_contributions' not in result

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_unsupported_type(self, mock_anthropic_module):
        """Test mapping unsupported document type returns empty dict"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {'field': 'value'}
        result = service.map_to_tax_profile(extracted_data, 'unsupported_type')

        assert result == {}

    # ============================================================================
    # DOCUMENT TYPES TESTS
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_document_types_structure(self, mock_anthropic_module):
        """Test DOCUMENT_TYPES constant has correct structure"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Check all document types have required structure
        for doc_type, config in service.DOCUMENT_TYPES.items():
            assert 'name' in config
            assert 'keywords' in config
            assert 'fields' in config
            assert isinstance(config['keywords'], list)
            assert isinstance(config['fields'], list)

    # ============================================================================
    # ADDITIONAL EDGE CASES FOR 90% COVERAGE
    # ============================================================================

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_multiple_documents_different_types(
        self,
        mock_anthropic_module,
        sample_image_bytes
    ):
        """Test analyzing multiple documents with different types"""
        mock_anthropic_client = MagicMock()
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        # Mock responses for different document types
        mock_lohn = MagicMock()
        mock_lohn.text = "lohnausweis"
        mock_response_lohn_class = MagicMock()
        mock_response_lohn_class.content = [mock_lohn]

        mock_lohn_extract = MagicMock()
        mock_lohn_extract.text = '{"gross_salary": 85000, "_confidence": 0.9}'
        mock_response_lohn_extract = MagicMock()
        mock_response_lohn_extract.content = [mock_lohn_extract]

        mock_ahv = MagicMock()
        mock_ahv.text = "ahv_statement"
        mock_response_ahv_class = MagicMock()
        mock_response_ahv_class.content = [mock_ahv]

        mock_ahv_extract = MagicMock()
        mock_ahv_extract.text = '{"annual_pension": 24000, "_confidence": 0.85}'
        mock_response_ahv_extract = MagicMock()
        mock_response_ahv_extract.content = [mock_ahv_extract]

        mock_anthropic_client.messages.create.side_effect = [
            mock_response_lohn_class, mock_response_lohn_extract,
            mock_response_ahv_class, mock_response_ahv_extract
        ]

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        documents = [
            {'image_bytes': sample_image_bytes},
            {'image_bytes': sample_image_bytes}
        ]

        result = service.analyze_multiple_documents(documents)

        assert result['total_documents'] == 2
        assert result['successful'] == 2
        assert result['failed'] == 0
        assert 'lohnausweis' in result['by_type']
        assert 'ahv_statement' in result['by_type']

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_detect_image_format_webp(self, mock_anthropic_module):
        """Test WEBP format detection"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Create WEBP image
        img = Image.new('RGB', (10, 10))
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='WEBP')

        result = service._detect_image_format(img_buffer.getvalue())
        assert result == 'webp'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_detect_image_format_gif(self, mock_anthropic_module):
        """Test GIF format detection"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Create GIF image
        img = Image.new('RGB', (10, 10))
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='GIF')

        result = service._detect_image_format(img_buffer.getvalue())
        assert result == 'gif'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_parse_json_response_with_json_keyword_in_markdown(self, mock_anthropic_module):
        """Test parsing JSON with 'json' keyword after code fence"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Response with ```json prefix
        json_str = '```json\n{"field": "value"}\n```'
        result = service._parse_json_response(json_str)

        assert result['field'] == 'value'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_with_value_field(self, mock_anthropic_module):
        """Test validation of fields containing 'value' keyword"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        data = {
            'property_value': '500000',
            'total_value': 250000.75
        }
        expected_fields = ['property_value', 'total_value']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['property_value'] == 500000.0
        assert result['total_value'] == 250000.75

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_with_premium_field(self, mock_anthropic_module):
        """Test validation of premium fields"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        data = {
            'annual_premium': '3000.50',
            'monthly_premium': 250
        }
        expected_fields = ['annual_premium', 'monthly_premium']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['annual_premium'] == 3000.50
        assert result['monthly_premium'] == 250.0

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_with_ahv_field(self, mock_anthropic_module):
        """Test validation of AHV fields"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        data = {
            'ahv_number': '756.1234.5678.97'
        }
        expected_fields = ['ahv_number']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['ahv_number'] == '756.1234.5678.97'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_multiple_documents_empty_list(self, mock_anthropic_module):
        """Test analyzing empty document list"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        result = service.analyze_multiple_documents([])

        assert result['total_documents'] == 0
        assert result['successful'] == 0
        assert result['failed'] == 0
        assert result['by_type'] == {}
        assert result['documents'] == []

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_expense_receipt(self, mock_anthropic_module):
        """Test mapping expense receipt (returns empty as no mapping defined)"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {
            'vendor_name': 'Shop AG',
            'total_amount': 500.00
        }

        result = service.map_to_tax_profile(extracted_data, 'expense_receipt')

        # No mapping defined for expense_receipt
        assert result == {}

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_map_to_tax_profile_bank_statement(self, mock_anthropic_module):
        """Test mapping bank statement (returns empty as no mapping defined)"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        extracted_data = {
            'account_holder': 'John Doe',
            'interest_earned': 150.00
        }

        result = service.map_to_tax_profile(extracted_data, 'bank_statement')

        # No mapping defined for bank_statement
        assert result == {}

    # ============================================================================
    # MAIN FUNCTION TESTS
    # ============================================================================

    def test_main_function_exists(self):
        """Test that main function exists (for CLI)"""
        from services.ai_document_intelligence_service import main
        assert callable(main)

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_all_document_types_coverage(self, mock_anthropic_module):
        """Test that all document types in DOCUMENT_TYPES are properly structured"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Verify all 7 document types exist and are valid
        expected_types = [
            'lohnausweis', 'ahv_statement', 'property_tax',
            'expense_receipt', 'bank_statement', 'insurance_certificate',
            'pillar_3a_statement'
        ]

        for doc_type in expected_types:
            assert doc_type in service.DOCUMENT_TYPES
            config = service.DOCUMENT_TYPES[doc_type]
            assert len(config['keywords']) > 0
            assert len(config['fields']) > 0

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_document_timestamp_generation(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes,
        sample_extraction_response
    ):
        """Test that analyze_document generates timestamp"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        mock_content = MagicMock()
        mock_content.text = sample_extraction_response
        mock_response = MagicMock()
        mock_response.content = [mock_content]
        mock_anthropic_client.messages.create.return_value = mock_response

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        result = service.analyze_document(
            image_bytes=sample_image_bytes,
            document_type='lohnausweis'
        )

        # Verify timestamp exists and is in ISO format
        assert 'timestamp' in result
        assert 'T' in result['timestamp']  # ISO format contains 'T'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_validate_extracted_data_missing_fields(self, mock_anthropic_module):
        """Test validation handles missing fields gracefully"""
        mock_anthropic_module.Anthropic.return_value = MagicMock()

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Data with only some fields
        data = {
            'field1': 'value1',
            'field3': 'value3'
        }
        # Expected fields include missing field2
        expected_fields = ['field1', 'field2', 'field3']

        result = service._validate_extracted_data(data, expected_fields)

        assert result['field1'] == 'value1'
        assert result['field2'] is None  # Missing field becomes None
        assert result['field3'] == 'value3'

    @patch('services.ai_document_intelligence_service.anthropic')
    def test_analyze_multiple_documents_preserves_order(
        self,
        mock_anthropic_module,
        mock_anthropic_client,
        sample_image_bytes,
        sample_extraction_response
    ):
        """Test that document order is preserved in results"""
        mock_anthropic_module.Anthropic.return_value = mock_anthropic_client

        mock_content = MagicMock()
        mock_content.text = "lohnausweis"
        mock_response1 = MagicMock()
        mock_response1.content = [mock_content]

        mock_content2 = MagicMock()
        mock_content2.text = sample_extraction_response
        mock_response2 = MagicMock()
        mock_response2.content = [mock_content2]

        mock_anthropic_client.messages.create.side_effect = [
            mock_response1, mock_response2,
            mock_response1, mock_response2,
            mock_response1, mock_response2
        ]

        service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        documents = [
            {'image_bytes': sample_image_bytes},
            {'image_bytes': sample_image_bytes},
            {'image_bytes': sample_image_bytes}
        ]

        result = service.analyze_multiple_documents(documents)

        # Verify order is preserved
        assert result['documents'][0]['index'] == 0
        assert result['documents'][1]['index'] == 1
        assert result['documents'][2]['index'] == 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
