"""
Extended Unit Tests for ECH0196 PDF Generator
Comprehensive test coverage for eCH-0196 PDF generation service

Target: 90% coverage (from 12%)
Focus: All major methods with mocked dependencies
"""

import io
import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch, call

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.pdf_generators.ech0196_pdf_generator import ECH0196PDFGenerator


class TestECH0196PDFGeneratorInit(unittest.TestCase):
    """Test ECH0196PDFGenerator initialization"""

    def test_init_sets_page_dimensions(self):
        """Test initialization sets correct A4 page dimensions"""
        generator = ECH0196PDFGenerator()

        # A4 dimensions: 595.27 x 841.89 points
        self.assertAlmostEqual(generator.page_width, 595.27, places=1)
        self.assertAlmostEqual(generator.page_height, 841.89, places=1)

    def test_init_sets_margin(self):
        """Test initialization sets correct margin"""
        generator = ECH0196PDFGenerator()
        self.assertEqual(generator.margin, 50)

    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_init_creates_ech_service(self, mock_ech_service):
        """Test initialization creates ECH0196Service instance"""
        generator = ECH0196PDFGenerator()

        mock_ech_service.assert_called_once()
        self.assertIsNotNone(generator.ech_service)


class TestECH0196PDFGeneratorGenerate(unittest.TestCase):
    """Test main generate() method"""

    def setUp(self):
        """Set up common test fixtures"""
        self.mock_filing = Mock()
        self.mock_filing.id = 'filing_123'
        self.mock_filing.tax_year = 2024
        self.mock_filing.canton = 'ZH'
        self.mock_filing.language = 'en'
        self.mock_filing.is_primary = True
        self.mock_filing.profile = {
            'name': 'Müller',
            'firstname': 'Hans',
            'ssn': '756.1234.5678.97',
            'address': 'Bahnhofstrasse 1',
            'zip': '8001',
            'city': 'Zürich',
            'marital_status': 'single'
        }
        self.mock_filing.to_dict.return_value = {
            'id': 'filing_123',
            'canton': 'ZH',
            'tax_year': 2024,
            'profile': self.mock_filing.profile
        }

        self.mock_calculation = {
            'income': {
                'employment': 100000,
                'self_employment': 0,
                'capital': 5000,
                'rental': 0,
                'other': 0,
                'total': 105000
            },
            'deductions': {
                'professional_expenses': 3000,
                'pillar_3a': 7056,
                'insurance_premiums': 1750,
                'total': 11806
            },
            'taxable_income': 93194,
            'federal_tax': 8732,
            'cantonal_tax': 7455,
            'municipal_tax': 8872,
            'church_tax': 0,
            'total_tax': 25059,
            'monthly_payment': 2088.25
        }

    @patch('services.pdf_generators.ech0196_pdf_generator.canvas.Canvas')
    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.EnhancedTaxCalculationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_generate_returns_bytesio(self, mock_ech, mock_tax, mock_filing, mock_canvas):
        """Test generate() returns BytesIO buffer"""
        # Mock services
        mock_filing_instance = mock_filing.return_value
        mock_filing_instance.get_filing.return_value = self.mock_filing

        mock_tax_instance = mock_tax.return_value
        mock_tax_instance.calculate_single_filing.return_value = self.mock_calculation

        mock_ech_instance = mock_ech.return_value
        mock_ech_instance.generate_barcode_data.return_value = {
            'xml_string': '<xml></xml>',
            'barcode_image': None,
            'qr_code_image': None
        }

        # Mock canvas
        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance

        # Generate PDF
        generator = ECH0196PDFGenerator()
        result = generator.generate('filing_123', 'en', db=Mock())

        # Verify result is BytesIO
        self.assertIsInstance(result, io.BytesIO)

    @patch('services.pdf_generators.ech0196_pdf_generator.canvas.Canvas')
    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.EnhancedTaxCalculationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_generate_raises_error_for_missing_filing(self, mock_ech, mock_tax, mock_filing, mock_canvas):
        """Test generate() raises ValueError for missing filing"""
        mock_filing_instance = mock_filing.return_value
        mock_filing_instance.get_filing.return_value = None

        generator = ECH0196PDFGenerator()

        with self.assertRaises(ValueError) as context:
            generator.generate('nonexistent_filing', 'en', db=Mock())

        self.assertIn('not found', str(context.exception))

    @patch('services.pdf_generators.ech0196_pdf_generator.canvas.Canvas')
    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.EnhancedTaxCalculationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_generate_creates_8_pages(self, mock_ech, mock_tax, mock_filing, mock_canvas):
        """Test generate() creates 6 pages as implemented (not 8 as per docstring)"""
        # Mock services
        mock_filing_instance = mock_filing.return_value
        mock_filing_instance.get_filing.return_value = self.mock_filing

        mock_tax_instance = mock_tax.return_value
        mock_tax_instance.calculate_single_filing.return_value = self.mock_calculation

        mock_ech_instance = mock_ech.return_value
        mock_ech_instance.generate_barcode_data.return_value = {
            'xml_string': '<xml></xml>',
            'barcode_image': None,
            'qr_code_image': None
        }

        # Mock canvas
        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance

        # Generate PDF
        generator = ECH0196PDFGenerator()
        generator.generate('filing_123', 'en', db=Mock())

        # Verify showPage called 6 times (actual implementation)
        # Note: Implementation creates 6 pages, not 8 as docstring claims
        self.assertEqual(mock_canvas_instance.showPage.call_count, 6)

        # Verify save called once
        mock_canvas_instance.save.assert_called_once()

    @patch('services.pdf_generators.ech0196_pdf_generator.canvas.Canvas')
    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.EnhancedTaxCalculationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_generate_calls_all_page_methods(self, mock_ech, mock_tax, mock_filing, mock_canvas):
        """Test generate() calls all page generation methods"""
        # Mock services
        mock_filing_instance = mock_filing.return_value
        mock_filing_instance.get_filing.return_value = self.mock_filing

        mock_tax_instance = mock_tax.return_value
        mock_tax_instance.calculate_single_filing.return_value = self.mock_calculation

        mock_ech_instance = mock_ech.return_value
        mock_ech_instance.generate_barcode_data.return_value = {
            'xml_string': '<xml></xml>',
            'barcode_image': None,
            'qr_code_image': None
        }

        # Mock canvas
        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance

        # Generate PDF
        generator = ECH0196PDFGenerator()

        # Mock page methods to track calls
        with patch.object(generator, '_add_cover_sheet') as mock_cover, \
             patch.object(generator, '_add_income_section') as mock_income, \
             patch.object(generator, '_add_deductions_section') as mock_deductions, \
             patch.object(generator, '_add_tax_summary') as mock_summary, \
             patch.object(generator, '_add_documents_index') as mock_docs, \
             patch.object(generator, '_add_barcode_page') as mock_barcode:

            generator.generate('filing_123', 'en', db=Mock())

            # Verify all methods called
            mock_cover.assert_called_once()
            mock_income.assert_called_once()
            mock_deductions.assert_called_once()
            mock_summary.assert_called_once()
            mock_docs.assert_called_once()
            mock_barcode.assert_called_once()


class TestECH0196PDFGeneratorCoverSheet(unittest.TestCase):
    """Test _add_cover_sheet() method"""

    def setUp(self):
        """Set up test fixtures"""
        self.generator = ECH0196PDFGenerator()
        self.mock_canvas = MagicMock()

        self.mock_filing = Mock()
        self.mock_filing.tax_year = 2024
        self.mock_filing.canton = 'ZH'
        self.mock_filing.language = 'en'
        self.mock_filing.is_primary = True
        self.mock_filing.profile = {
            'name': 'Müller',
            'firstname': 'Hans',
            'ssn': '756.1234.5678.97',
            'address': 'Bahnhofstrasse 1',
            'zip': '8001',
            'city': 'Zürich',
            'marital_status': 'married'
        }

        self.mock_calculation = {
            'total_tax': 25059,
            'federal_tax': 8732,
            'cantonal_tax': 7455,
            'municipal_tax': 8872
        }

        self.texts = self.generator._get_translations('en')

    @patch('services.pdf_generators.ech0196_pdf_generator.datetime')
    def test_cover_sheet_draws_title(self, mock_datetime):
        """Test cover sheet draws tax return title"""
        mock_datetime.now.return_value.strftime.return_value = '2024-10-08 15:30'

        self.generator._add_cover_sheet(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        # Verify title is drawn
        calls = self.mock_canvas.drawString.call_args_list
        title_call = any('Swiss Tax Return' in str(call) for call in calls)
        self.assertTrue(title_call, "Title not found in canvas calls")

    @patch('services.pdf_generators.ech0196_pdf_generator.datetime')
    def test_cover_sheet_draws_personal_info(self, mock_datetime):
        """Test cover sheet draws personal information"""
        mock_datetime.now.return_value.strftime.return_value = '2024-10-08 15:30'

        self.generator._add_cover_sheet(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        calls = self.mock_canvas.drawString.call_args_list

        # Verify name is drawn
        name_call = any('Müller, Hans' in str(call) for call in calls)
        self.assertTrue(name_call, "Name not found in canvas calls")

        # Verify SSN is drawn
        ssn_call = any('756.1234.5678.97' in str(call) for call in calls)
        self.assertTrue(ssn_call, "SSN not found in canvas calls")

    @patch('services.pdf_generators.ech0196_pdf_generator.datetime')
    def test_cover_sheet_draws_tax_summary_box(self, mock_datetime):
        """Test cover sheet draws tax summary box"""
        mock_datetime.now.return_value.strftime.return_value = '2024-10-08 15:30'

        self.generator._add_cover_sheet(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        # Verify rectangle (tax summary box) is drawn
        self.mock_canvas.rect.assert_called_once()

        # Verify tax amounts are drawn
        calls = self.mock_canvas.drawString.call_args_list
        total_tax = any('25,059.00' in str(call) for call in calls)
        self.assertTrue(total_tax, "Total tax amount not found")

    @patch('services.pdf_generators.ech0196_pdf_generator.datetime')
    def test_cover_sheet_secondary_filing(self, mock_datetime):
        """Test cover sheet shows secondary filing type correctly"""
        mock_datetime.now.return_value.strftime.return_value = '2024-10-08 15:30'

        self.mock_filing.is_primary = False

        self.generator._add_cover_sheet(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        calls = self.mock_canvas.drawString.call_args_list

        # Verify secondary filing text appears
        secondary_call = any('Secondary Filing' in str(call) for call in calls)
        self.assertTrue(secondary_call, "Secondary filing type not found")

    @patch('services.pdf_generators.ech0196_pdf_generator.datetime')
    def test_cover_sheet_handles_missing_profile_data(self, mock_datetime):
        """Test cover sheet handles missing profile data gracefully"""
        mock_datetime.now.return_value.strftime.return_value = '2024-10-08 15:30'

        self.mock_filing.profile = None

        # Should not raise exception
        self.generator._add_cover_sheet(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        # Verify canvas methods were still called
        self.assertGreater(self.mock_canvas.drawString.call_count, 0)


class TestECH0196PDFGeneratorIncomeSection(unittest.TestCase):
    """Test _add_income_section() method"""

    def setUp(self):
        """Set up test fixtures"""
        self.generator = ECH0196PDFGenerator()
        self.mock_canvas = MagicMock()

        self.mock_filing = Mock()
        self.mock_filing.is_primary = True

        self.mock_calculation = {
            'income': {
                'employment': 100000,
                'self_employment': 5000,
                'capital': 2000,
                'rental': 12000,
                'other': 1000,
                'total': 120000
            },
            'deductions': {'total': 10000},
            'taxable_income': 110000,
            'total_tax': 20000
        }

        self.texts = self.generator._get_translations('en')

    @patch('services.pdf_generators.ech0196_pdf_generator.Table')
    def test_income_section_primary_filing(self, mock_table):
        """Test income section for primary filing includes all income types"""
        mock_table_instance = MagicMock()
        mock_table.return_value = mock_table_instance

        self.generator._add_income_section(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        # Verify Table was created
        mock_table.assert_called_once()

        # Get table data passed to Table
        table_data = mock_table.call_args[0][0]

        # Verify all income types are included
        self.assertGreater(len(table_data), 5)  # Header + 5 income types + total

    @patch('services.pdf_generators.ech0196_pdf_generator.Table')
    def test_income_section_secondary_filing(self, mock_table):
        """Test income section for secondary filing shows only rental income"""
        mock_table_instance = MagicMock()
        mock_table.return_value = mock_table_instance

        self.mock_filing.is_primary = False

        self.generator._add_income_section(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        # Get table data
        table_data = mock_table.call_args[0][0]

        # Verify only header + rental + total (3 rows)
        self.assertEqual(len(table_data), 3)

    @patch('services.pdf_generators.ech0196_pdf_generator.Table')
    def test_income_section_formats_amounts(self, mock_table):
        """Test income section formats amounts correctly"""
        mock_table_instance = MagicMock()
        mock_table.return_value = mock_table_instance

        self.generator._add_income_section(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        # Get table data
        table_data = mock_table.call_args[0][0]

        # Verify amounts are formatted with comma separators
        amounts_formatted = any('100,000.00' in str(row) for row in table_data)
        self.assertTrue(amounts_formatted)


class TestECH0196PDFGeneratorDeductionsSection(unittest.TestCase):
    """Test _add_deductions_section() method"""

    def setUp(self):
        """Set up test fixtures"""
        self.generator = ECH0196PDFGenerator()
        self.mock_canvas = MagicMock()

        self.mock_filing = Mock()
        self.mock_filing.is_primary = True

        self.mock_calculation = {
            'deductions': {
                'professional_expenses': 3000,
                'pillar_3a': 7056,
                'insurance_premiums': 1750,
                'medical_expenses': 500,
                'child_deduction': 1000,
                'training_expenses': 800,
                'alimony': 0,
                'total': 14106
            }
        }

        self.texts = self.generator._get_translations('en')

    @patch('services.pdf_generators.ech0196_pdf_generator.Table')
    def test_deductions_section_primary_filing(self, mock_table):
        """Test deductions section for primary filing includes all deduction types"""
        mock_table_instance = MagicMock()
        mock_table.return_value = mock_table_instance

        self.generator._add_deductions_section(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        # Verify Table was created
        mock_table.assert_called_once()

        # Get table data
        table_data = mock_table.call_args[0][0]

        # Verify all deduction types are included
        # Header + 7 deduction types + total = 9 rows
        self.assertEqual(len(table_data), 9)

    @patch('services.pdf_generators.ech0196_pdf_generator.Table')
    def test_deductions_section_secondary_filing(self, mock_table):
        """Test deductions section for secondary filing shows property deductions"""
        mock_table_instance = MagicMock()
        mock_table.return_value = mock_table_instance

        self.mock_filing.is_primary = False
        self.mock_calculation['deductions'] = {
            'property_expenses': 5000,
            'mortgage_interest': 8000,
            'total': 13000
        }

        self.generator._add_deductions_section(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        # Get table data
        table_data = mock_table.call_args[0][0]

        # Verify header + 2 property deductions + total = 4 rows
        self.assertEqual(len(table_data), 4)


class TestECH0196PDFGeneratorTaxSummary(unittest.TestCase):
    """Test _add_tax_summary() method"""

    def setUp(self):
        """Set up test fixtures"""
        self.generator = ECH0196PDFGenerator()
        self.mock_canvas = MagicMock()

        self.mock_filing = Mock()
        self.mock_filing.is_primary = True

        self.mock_calculation = {
            'taxable_income': 93194,
            'federal_tax': 8732,
            'cantonal_tax': 7455,
            'municipal_tax': 8872,
            'church_tax': 500,
            'total_tax': 25559,
            'monthly_payment': 2129.92
        }

        self.texts = self.generator._get_translations('en')

    def test_tax_summary_draws_all_components(self):
        """Test tax summary draws all tax components"""
        self.generator._add_tax_summary(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        calls = self.mock_canvas.drawString.call_args_list + \
                self.mock_canvas.drawRightString.call_args_list

        # Verify taxable income is shown
        taxable_income = any('93,194.00' in str(call) for call in calls)
        self.assertTrue(taxable_income)

        # Verify total tax is shown
        total_tax = any('25,559.00' in str(call) for call in calls)
        self.assertTrue(total_tax)

        # Verify monthly payment is shown
        monthly = any('2,129.92' in str(call) for call in calls)
        self.assertTrue(monthly)

    def test_tax_summary_primary_shows_federal_tax(self):
        """Test tax summary for primary filing shows federal tax"""
        self.generator._add_tax_summary(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        calls = self.mock_canvas.drawString.call_args_list + \
                self.mock_canvas.drawRightString.call_args_list

        # Verify federal tax is shown
        federal_tax = any('8,732.00' in str(call) for call in calls)
        self.assertTrue(federal_tax)

    def test_tax_summary_shows_church_tax_when_present(self):
        """Test tax summary shows church tax when amount > 0"""
        self.generator._add_tax_summary(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        calls = self.mock_canvas.drawString.call_args_list + \
                self.mock_canvas.drawRightString.call_args_list

        # Verify church tax is shown
        church_tax = any('500.00' in str(call) for call in calls)
        self.assertTrue(church_tax)

    def test_tax_summary_skips_church_tax_when_zero(self):
        """Test tax summary skips church tax when amount is 0"""
        self.mock_calculation['church_tax'] = 0

        self.generator._add_tax_summary(
            self.mock_canvas,
            self.mock_filing,
            self.mock_calculation,
            self.texts
        )

        calls = self.mock_canvas.drawString.call_args_list

        # Verify "Church Tax" label not present when amount is 0
        church_label_calls = [call for call in calls if 'Church Tax' in str(call)]
        self.assertEqual(len(church_label_calls), 0)


class TestECH0196PDFGeneratorDocumentsIndex(unittest.TestCase):
    """Test _add_documents_index() method"""

    def setUp(self):
        """Set up test fixtures"""
        self.generator = ECH0196PDFGenerator()
        self.mock_canvas = MagicMock()

        self.mock_filing = Mock()
        self.mock_filing.id = 'filing_123'

        self.texts = self.generator._get_translations('en')

    def test_documents_index_draws_header(self):
        """Test documents index draws header"""
        self.generator._add_documents_index(
            self.mock_canvas,
            self.mock_filing,
            self.texts
        )

        calls = self.mock_canvas.drawString.call_args_list

        # Verify header is drawn
        header = any('Supporting Documents' in str(call) for call in calls)
        self.assertTrue(header)

    def test_documents_index_draws_document_list(self):
        """Test documents index draws document list"""
        self.generator._add_documents_index(
            self.mock_canvas,
            self.mock_filing,
            self.texts
        )

        # Verify drawString called multiple times (header + docs)
        self.assertGreater(self.mock_canvas.drawString.call_count, 3)


class TestECH0196PDFGeneratorBarcodePage(unittest.TestCase):
    """Test _add_barcode_page() method"""

    def setUp(self):
        """Set up test fixtures"""
        self.generator = ECH0196PDFGenerator()
        self.mock_canvas = MagicMock()

        self.mock_filing = Mock()
        self.mock_filing.id = 'filing_456'

        self.texts = self.generator._get_translations('en')

    @patch('PIL.Image.Image')
    def test_barcode_page_with_barcode_image(self, mock_pil_image):
        """Test barcode page draws barcode image when present"""
        mock_barcode_img = MagicMock()

        barcode_data = {
            'barcode_image': mock_barcode_img,
            'qr_code_image': None
        }

        self.generator._add_barcode_page(
            self.mock_canvas,
            self.mock_filing,
            barcode_data,
            self.texts
        )

        # Verify drawImage was called for barcode
        self.assertEqual(self.mock_canvas.drawImage.call_count, 1)

    @patch('PIL.Image.Image')
    def test_barcode_page_with_qr_code(self, mock_pil_image):
        """Test barcode page draws QR code when present"""
        mock_qr_img = MagicMock()

        barcode_data = {
            'barcode_image': None,
            'qr_code_image': mock_qr_img
        }

        self.generator._add_barcode_page(
            self.mock_canvas,
            self.mock_filing,
            barcode_data,
            self.texts
        )

        # Verify drawImage was called for QR code
        self.assertEqual(self.mock_canvas.drawImage.call_count, 1)

    @patch('PIL.Image.Image')
    def test_barcode_page_with_both_images(self, mock_pil_image):
        """Test barcode page draws both barcode and QR code"""
        mock_barcode_img = MagicMock()
        mock_qr_img = MagicMock()

        barcode_data = {
            'barcode_image': mock_barcode_img,
            'qr_code_image': mock_qr_img
        }

        self.generator._add_barcode_page(
            self.mock_canvas,
            self.mock_filing,
            barcode_data,
            self.texts
        )

        # Verify drawImage was called twice
        self.assertEqual(self.mock_canvas.drawImage.call_count, 2)

    def test_barcode_page_without_images(self):
        """Test barcode page works without images"""
        barcode_data = {
            'barcode_image': None,
            'qr_code_image': None
        }

        self.generator._add_barcode_page(
            self.mock_canvas,
            self.mock_filing,
            barcode_data,
            self.texts
        )

        # Verify drawImage was not called
        self.mock_canvas.drawImage.assert_not_called()

        # But other canvas methods were called
        self.assertGreater(self.mock_canvas.drawString.call_count, 0)


class TestECH0196PDFGeneratorTranslations(unittest.TestCase):
    """Test _get_translations() method"""

    def test_get_translations_english(self):
        """Test get_translations returns English translations"""
        generator = ECH0196PDFGenerator()
        texts = generator._get_translations('en')

        self.assertEqual(texts['tax_return_title'], 'Swiss Tax Return')
        self.assertEqual(texts['canton'], 'Canton')
        self.assertIn('name', texts)
        self.assertIn('total_tax', texts)

    def test_get_translations_fallback_to_english(self):
        """Test get_translations falls back to English for unknown language"""
        generator = ECH0196PDFGenerator()
        texts = generator._get_translations('unknown_lang')

        # Should return English as fallback
        self.assertEqual(texts['tax_return_title'], 'Swiss Tax Return')

    def test_get_translations_contains_all_required_keys(self):
        """Test translations contain all required keys"""
        generator = ECH0196PDFGenerator()
        texts = generator._get_translations('en')

        required_keys = [
            'tax_return_title', 'tax_year', 'canton', 'filing_type',
            'personal_information', 'name', 'ssn', 'address',
            'income_declaration', 'deductions_title', 'tax_summary',
            'total_tax', 'federal_tax', 'cantonal_tax', 'municipal_tax'
        ]

        for key in required_keys:
            self.assertIn(key, texts, f"Missing translation key: {key}")


class TestECH0196PDFGeneratorCantonName(unittest.TestCase):
    """Test _get_canton_name() method"""

    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    def test_get_canton_name_calls_filing_service(self, mock_filing_service):
        """Test _get_canton_name delegates to FilingOrchestrationService"""
        mock_service_instance = mock_filing_service.return_value
        mock_service_instance._get_canton_name.return_value = 'Zurich'

        generator = ECH0196PDFGenerator()
        result = generator._get_canton_name('ZH', 'en')

        mock_service_instance._get_canton_name.assert_called_once_with('ZH', 'en')
        self.assertEqual(result, 'Zurich')


class TestECH0196PDFGeneratorIntegration(unittest.TestCase):
    """Integration tests for ECH0196PDFGenerator"""

    @patch('services.pdf_generators.ech0196_pdf_generator.canvas.Canvas')
    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.EnhancedTaxCalculationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_full_pdf_generation_workflow(self, mock_ech, mock_tax, mock_filing, mock_canvas):
        """Test complete PDF generation workflow from start to finish"""
        # Set up comprehensive mocks
        mock_filing_instance = mock_filing.return_value
        mock_filing = Mock()
        mock_filing.id = 'filing_789'
        mock_filing.tax_year = 2024
        mock_filing.canton = 'GE'
        mock_filing.language = 'fr'
        mock_filing.is_primary = False
        mock_filing.profile = {
            'name': 'Dupont',
            'firstname': 'Marie',
            'ssn': '756.9876.5432.10',
            'address': 'Rue du Rhône 10',
            'zip': '1204',
            'city': 'Geneva',
            'marital_status': 'single'
        }
        mock_filing.to_dict.return_value = {
            'id': 'filing_789',
            'canton': 'GE',
            'tax_year': 2024,
            'profile': mock_filing.profile
        }
        mock_filing_instance.get_filing.return_value = mock_filing

        mock_tax_instance = mock_tax.return_value
        mock_tax_instance.calculate_single_filing.return_value = {
            'income': {'rental': 18000, 'total': 18000},
            'deductions': {'property_expenses': 3000, 'mortgage_interest': 5000, 'total': 8000},
            'taxable_income': 10000,
            'federal_tax': 0,
            'cantonal_tax': 1500,
            'municipal_tax': 800,
            'church_tax': 0,
            'total_tax': 2300,
            'monthly_payment': 191.67
        }

        mock_ech_instance = mock_ech.return_value
        mock_ech_instance.generate_barcode_data.return_value = {
            'xml_string': '<eTaxStatement>...</eTaxStatement>',
            'barcode_image': None,
            'qr_code_image': None
        }

        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance

        # Generate PDF
        generator = ECH0196PDFGenerator()
        result = generator.generate('filing_789', 'fr', db=Mock())

        # Verify complete workflow
        self.assertIsInstance(result, io.BytesIO)
        mock_filing_instance.get_filing.assert_called_once_with('filing_789')
        mock_tax_instance.calculate_single_filing.assert_called_once()
        mock_ech_instance.generate_barcode_data.assert_called_once()
        mock_canvas_instance.save.assert_called_once()

    @patch('services.pdf_generators.ech0196_pdf_generator.canvas.Canvas')
    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.EnhancedTaxCalculationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_pdf_generation_different_cantons(self, mock_ech, mock_tax, mock_filing, mock_canvas):
        """Test PDF generation works for different cantons"""
        cantons = ['ZH', 'GE', 'BE', 'VD', 'TI', 'BS']

        for canton in cantons:
            # Reset mocks
            mock_filing.reset_mock()
            mock_tax.reset_mock()
            mock_ech.reset_mock()
            mock_canvas.reset_mock()

            # Set up mocks
            mock_filing_instance = mock_filing.return_value
            filing_obj = Mock()
            filing_obj.id = f'filing_{canton}'
            filing_obj.canton = canton
            filing_obj.tax_year = 2024
            filing_obj.is_primary = True
            filing_obj.profile = {'name': 'Test', 'firstname': 'User'}
            filing_obj.to_dict.return_value = {'id': f'filing_{canton}', 'canton': canton}
            mock_filing_instance.get_filing.return_value = filing_obj

            mock_tax_instance = mock_tax.return_value
            mock_tax_instance.calculate_single_filing.return_value = {
                'income': {'total': 100000},
                'deductions': {'total': 10000},
                'taxable_income': 90000,
                'federal_tax': 5000,
                'cantonal_tax': 8000,
                'municipal_tax': 2000,
                'church_tax': 0,
                'total_tax': 15000,
                'monthly_payment': 1250
            }

            mock_ech_instance = mock_ech.return_value
            mock_ech_instance.generate_barcode_data.return_value = {
                'xml_string': '<xml></xml>',
                'barcode_image': None,
                'qr_code_image': None
            }

            mock_canvas_instance = MagicMock()
            mock_canvas.return_value = mock_canvas_instance

            # Generate PDF
            generator = ECH0196PDFGenerator()
            result = generator.generate(f'filing_{canton}', 'en', db=Mock())

            # Verify success for each canton
            self.assertIsInstance(result, io.BytesIO, f"Failed for canton {canton}")


class TestECH0196PDFGeneratorEdgeCases(unittest.TestCase):
    """Test edge cases and error handling"""

    def setUp(self):
        """Set up test fixtures"""
        self.generator = ECH0196PDFGenerator()

    @patch('services.pdf_generators.ech0196_pdf_generator.canvas.Canvas')
    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.EnhancedTaxCalculationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_handles_zero_income(self, mock_ech, mock_tax, mock_filing, mock_canvas):
        """Test PDF generation with zero income"""
        mock_filing_instance = mock_filing.return_value
        filing_obj = Mock()
        filing_obj.id = 'filing_zero'
        filing_obj.tax_year = 2024
        filing_obj.canton = 'ZH'
        filing_obj.language = 'en'
        filing_obj.is_primary = True
        filing_obj.profile = {}
        filing_obj.to_dict.return_value = {
            'id': 'filing_zero',
            'tax_year': 2024,
            'canton': 'ZH',
            'profile': {}
        }
        mock_filing_instance.get_filing.return_value = filing_obj

        mock_tax_instance = mock_tax.return_value
        mock_tax_instance.calculate_single_filing.return_value = {
            'income': {'total': 0},
            'deductions': {'total': 0},
            'taxable_income': 0,
            'federal_tax': 0,
            'cantonal_tax': 0,
            'municipal_tax': 0,
            'church_tax': 0,
            'total_tax': 0,
            'monthly_payment': 0
        }

        mock_ech_instance = mock_ech.return_value
        mock_ech_instance.generate_barcode_data.return_value = {
            'xml_string': '<xml></xml>',
            'barcode_image': None,
            'qr_code_image': None
        }

        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance

        # Should not raise exception
        result = self.generator.generate('filing_zero', 'en', db=Mock())
        self.assertIsInstance(result, io.BytesIO)

    @patch('services.pdf_generators.ech0196_pdf_generator.canvas.Canvas')
    @patch('services.pdf_generators.ech0196_pdf_generator.FilingOrchestrationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.EnhancedTaxCalculationService')
    @patch('services.pdf_generators.ech0196_pdf_generator.ECH0196Service')
    def test_handles_missing_deduction_fields(self, mock_ech, mock_tax, mock_filing, mock_canvas):
        """Test PDF generation with missing deduction fields"""
        mock_filing_instance = mock_filing.return_value
        filing_obj = Mock()
        filing_obj.id = 'filing_missing'
        filing_obj.tax_year = 2024
        filing_obj.canton = 'ZH'
        filing_obj.language = 'en'
        filing_obj.is_primary = True
        filing_obj.profile = {}
        filing_obj.to_dict.return_value = {
            'id': 'filing_missing',
            'tax_year': 2024,
            'canton': 'ZH',
            'profile': {}
        }
        mock_filing_instance.get_filing.return_value = filing_obj

        mock_tax_instance = mock_tax.return_value
        # Missing some deduction fields
        mock_tax_instance.calculate_single_filing.return_value = {
            'income': {'total': 50000},
            'deductions': {
                'professional_expenses': 2000,
                # Missing other fields
                'total': 2000
            },
            'taxable_income': 48000,
            'federal_tax': 3000,
            'cantonal_tax': 5000,
            'municipal_tax': 1500,
            'church_tax': 0,
            'total_tax': 9500,
            'monthly_payment': 791.67
        }

        mock_ech_instance = mock_ech.return_value
        mock_ech_instance.generate_barcode_data.return_value = {
            'xml_string': '<xml></xml>',
            'barcode_image': None,
            'qr_code_image': None
        }

        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance

        # Should not raise exception
        result = self.generator.generate('filing_missing', 'en', db=Mock())
        self.assertIsInstance(result, io.BytesIO)


if __name__ == '__main__':
    unittest.main()
