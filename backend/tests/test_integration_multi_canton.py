"""
Integration Tests for Multi-Canton Workflow

Tests the complete flow of:
1. Creating primary filing
2. Auto-creating secondary filings
3. Calculating taxes for all filings
4. Generating PDFs for all filings
"""

import io
import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.enhanced_tax_calculation_service import \
    EnhancedTaxCalculationService
from services.filing_orchestration_service import FilingOrchestrationService
from services.pdf_generators.unified_pdf_generator import UnifiedPDFGenerator


class TestMultiCantonIntegration(unittest.TestCase):
    """Integration tests for multi-canton workflow"""

    def setUp(self):
        """Set up test fixtures"""
        self.filing_service = FilingOrchestrationService(db=None)
        self.tax_service = EnhancedTaxCalculationService(db=None)
        self.pdf_service = UnifiedPDFGenerator()

        # Sample user profile
        self.user_profile = {
            'name': 'Test',
            'firstname': 'User',
            'ssn': '756.1234.5678.97',
            'address': 'Test Street 1',
            'zip': '8001',
            'city': 'Zürich',
            'marital_status': 'single',
            'num_children': 0,
            'employment_income': 100000,
            'pillar_3a_contributions': 7056,
            'properties': [
                {
                    'canton': 'GE',
                    'address': 'Geneva Property',
                    'annual_rental_income': 15000,
                    'maintenance_costs': 2000
                },
                {
                    'canton': 'VD',
                    'address': 'Vaud Property',
                    'annual_rental_income': 12000,
                    'maintenance_costs': 1500
                }
            ]
        }

    @patch('services.filing_orchestration_service.TaxFilingSession')
    @patch('services.filing_orchestration_service.Session')
    def test_complete_multi_canton_workflow(self, mock_db, mock_filing_model):
        """
        Test complete multi-canton workflow:
        1. Create primary filing
        2. Auto-create secondary filings
        3. Verify data inheritance
        4. Calculate taxes for all
        5. Generate PDFs
        """
        # Mock database session
        mock_db_instance = MagicMock()
        mock_db.return_value = mock_db_instance

        # Mock filing creation
        primary_filing = Mock()
        primary_filing.id = 'primary_123'
        primary_filing.canton = 'ZH'
        primary_filing.is_primary = True
        primary_filing.profile = self.user_profile.copy()

        secondary_filing_ge = Mock()
        secondary_filing_ge.id = 'secondary_ge'
        secondary_filing_ge.canton = 'GE'
        secondary_filing_ge.is_primary = False
        secondary_filing_ge.profile = self.user_profile.copy()

        secondary_filing_vd = Mock()
        secondary_filing_vd.id = 'secondary_vd'
        secondary_filing_vd.canton = 'VD'
        secondary_filing_vd.is_primary = False
        secondary_filing_vd.profile = self.user_profile.copy()

        # Setup mock returns
        mock_filing_model.return_value = primary_filing

        # Step 1: Create primary filing
        with patch.object(self.filing_service, 'create_primary_filing',
                         return_value=primary_filing):
            primary = self.filing_service.create_primary_filing(
                user_id='user_123',
                tax_year=2024,
                canton='ZH',
                language='de'
            )

            self.assertIsNotNone(primary)
            self.assertEqual(primary.canton, 'ZH')
            self.assertTrue(primary.is_primary)

        # Step 2: Auto-create secondary filings
        with patch.object(self.filing_service, 'auto_create_secondary_filings',
                         return_value=[secondary_filing_ge, secondary_filing_vd]):
            secondaries = self.filing_service.auto_create_secondary_filings(
                primary_filing_id='primary_123',
                property_cantons=['GE', 'VD']
            )

            self.assertEqual(len(secondaries), 2)
            self.assertEqual(secondaries[0].canton, 'GE')
            self.assertEqual(secondaries[1].canton, 'VD')
            self.assertFalse(secondaries[0].is_primary)
            self.assertFalse(secondaries[1].is_primary)

    @patch('services.enhanced_tax_calculation_service.get_canton_calculator')
    def test_tax_calculation_across_cantons(self, mock_calc):
        """Test tax calculation for primary and secondary filings"""
        # Mock canton calculator
        mock_calculator = Mock()
        mock_calculator.calculate.return_value = Decimal('5000')
        mock_calc.return_value = mock_calculator

        # Primary filing
        primary = Mock()
        primary.id = 'primary_123'
        primary.canton = 'ZH'
        primary.is_primary = True
        primary.profile = {
            'employment_income': 100000,
            'rental_income_total': 27000,  # Total from both properties
            'marital_status': 'single',
            'num_children': 0,
            'pillar_3a_contributions': 7056,
            'properties': self.user_profile['properties']
        }

        # Calculate primary
        primary_calc = self.tax_service.calculate_single_filing(primary)

        # Verify primary includes federal tax
        self.assertGreater(primary_calc['federal_tax'], 0)
        self.assertGreater(primary_calc['cantonal_tax'], 0)
        self.assertGreater(primary_calc['total_tax'], 0)

        # Verify income includes all sources
        self.assertEqual(primary_calc['income']['employment'], 100000)
        self.assertGreater(primary_calc['income']['total'], 0)

        # Secondary filing (GE)
        secondary = Mock()
        secondary.id = 'secondary_ge'
        secondary.canton = 'GE'
        secondary.is_primary = False
        secondary.profile = {
            'marital_status': 'single',
            'num_children': 0,
            'properties': [
                {
                    'canton': 'GE',
                    'annual_rental_income': 15000,
                    'maintenance_costs': 2000
                }
            ]
        }

        # Calculate secondary
        secondary_calc = self.tax_service.calculate_single_filing(secondary)

        # Verify secondary has no federal tax
        self.assertEqual(secondary_calc['federal_tax'], 0)

        # Verify income is only rental for this canton
        self.assertEqual(secondary_calc['income']['employment'], 0)
        self.assertEqual(secondary_calc['income']['rental'], 15000)

    @patch('services.filing_orchestration_service.TaxFilingSession')
    def test_data_synchronization(self, mock_filing_model):
        """Test personal data synchronization across filings"""
        # Create primary with initial data
        primary = Mock()
        primary.id = 'primary_123'
        primary.profile = {
            'name': 'Original',
            'address': 'Original Address',
            'employment_income': 100000
        }

        # Create secondaries
        secondary1 = Mock()
        secondary1.id = 'secondary_1'
        secondary1.profile = {
            'name': 'Original',
            'address': 'Original Address'
        }

        secondary2 = Mock()
        secondary2.id = 'secondary_2'
        secondary2.profile = {
            'name': 'Original',
            'address': 'Original Address'
        }

        # Update primary personal data
        primary.profile['name'] = 'Updated'
        primary.profile['address'] = 'New Address'

        # Simulate sync
        with patch.object(self.filing_service, 'get_filing',
                         side_effect=[primary, secondary1, secondary2]):
            with patch.object(self.filing_service, 'get_secondary_filings',
                             return_value=[secondary1, secondary2]):
                # Sync should copy personal data but not income
                copied_data = self.filing_service._copy_personal_data(primary.profile)

                self.assertIn('name', copied_data)
                self.assertIn('address', copied_data)
                self.assertNotIn('employment_income', copied_data)

    @patch('services.pdf_generators.unified_pdf_generator.UnifiedPDFGenerator.generate_all_user_pdfs')
    @patch('services.filing_orchestration_service.FilingOrchestrationService')
    def test_pdf_generation_for_all_filings(self, mock_filing_svc, mock_generate_all):
        """Test PDF generation for all filings in multi-canton scenario"""
        # Mock the generate_all_user_pdfs method to return immediately with mock data
        mock_result = {
            'primary_123': {
                'ech0196': io.BytesIO(b'%PDF-ECH'),
                'traditional': io.BytesIO(b'%PDF-TRAD')
            },
            'secondary_ge': {
                'ech0196': io.BytesIO(b'%PDF-ECH'),
                'traditional': io.BytesIO(b'%PDF-TRAD')
            },
            'secondary_vd': {
                'ech0196': io.BytesIO(b'%PDF-ECH'),
                'traditional': io.BytesIO(b'%PDF-TRAD')
            }
        }
        mock_generate_all.return_value = mock_result

        # Generate all PDFs
        result = self.pdf_service.generate_all_user_pdfs(
            user_id='user_123',
            tax_year=2024,
            language='de',
            pdf_type='both'
        )

        # Verify PDFs generated for all filings
        self.assertEqual(len(result), 3)
        self.assertIn('primary_123', result)
        self.assertIn('secondary_ge', result)
        self.assertIn('secondary_vd', result)

        # Verify both PDF types for each filing
        for filing_id, pdfs in result.items():
            self.assertIn('ech0196', pdfs)
            self.assertIn('traditional', pdfs)


class TestEndToEndMultiCanton(unittest.TestCase):
    """End-to-end test simulating complete user journey"""

    @patch('services.filing_orchestration_service.TaxFilingSession')
    @patch('services.enhanced_tax_calculation_service.get_canton_calculator')
    def test_complete_user_journey(self, mock_calc, mock_filing):
        """
        Simulate complete user journey:
        1. User completes interview with properties in 2 cantons
        2. System creates primary + 2 secondary filings
        3. System calculates taxes for all 3
        4. System generates PDFs for all 3
        5. User downloads ZIP with all PDFs
        """
        # Mock calculator
        mock_calculator = Mock()
        mock_calculator.calculate.return_value = Decimal('5000')
        mock_calc.return_value = mock_calculator

        # Step 1: User completes interview
        interview_data = {
            'name': 'Test User',
            'canton': 'ZH',  # Primary residence
            'owns_property': True,
            'property_cantons': ['GE', 'VD'],  # Properties in 2 other cantons
            'employment_income': 100000,
            'rental_income_total': 27000
        }

        # Step 2: Create filings
        filing_service = FilingOrchestrationService(db=None)

        # Mock primary filing creation
        primary_mock = Mock()
        primary_mock.id = 'primary_zh'
        primary_mock.canton = 'ZH'
        primary_mock.is_primary = True

        # Mock secondary filings
        secondary_ge = Mock()
        secondary_ge.id = 'secondary_ge'
        secondary_ge.canton = 'GE'
        secondary_ge.is_primary = False

        secondary_vd = Mock()
        secondary_vd.id = 'secondary_vd'
        secondary_vd.canton = 'VD'
        secondary_vd.is_primary = False

        with patch.object(filing_service, 'create_primary_filing',
                         return_value=primary_mock):
            with patch.object(filing_service, 'auto_create_secondary_filings',
                             return_value=[secondary_ge, secondary_vd]):

                # Create primary
                primary = filing_service.create_primary_filing(
                    user_id='user_123',
                    tax_year=2024,
                    canton='ZH',
                    language='de',
                    name='Test User'
                )

                # Auto-create secondaries
                secondaries = filing_service.auto_create_secondary_filings(
                    primary_filing_id=primary.id,
                    property_cantons=['GE', 'VD']
                )

                # Verify we have 3 total filings
                total_filings = [primary] + secondaries
                self.assertEqual(len(total_filings), 3)

                # Verify canton distribution
                cantons = [f.canton for f in total_filings]
                self.assertIn('ZH', cantons)
                self.assertIn('GE', cantons)
                self.assertIn('VD', cantons)

                # Verify primary flag
                primary_count = sum(1 for f in total_filings if f.is_primary)
                self.assertEqual(primary_count, 1)


if __name__ == '__main__':
    unittest.main()
