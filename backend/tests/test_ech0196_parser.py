"""
Unit tests for eCH-0196 Parser
Tests barcode extraction, XML parsing, and data mapping functionality
"""

import pytest
import xml.etree.ElementTree as ET
from unittest.mock import Mock, patch, MagicMock
from parsers.ech0196_parser import ECH0196Parser


# Sample eCH-0196 XML for testing
SAMPLE_ECH_XML = '''<?xml version="1.0" encoding="UTF-8"?>
<eTaxStatement xmlns="http://www.ech.ch/xmlns/eCH-0196/1">
    <taxYear>2024</taxYear>
    <canton>ZH</canton>
    <taxpayer>
        <ssn>756.1234.5678.90</ssn>
        <firstName>Max</firstName>
        <lastName>Mustermann</lastName>
        <dateOfBirth>1985-03-15</dateOfBirth>
        <maritalStatus>married</maritalStatus>
        <address>
            <street>Bahnhofstrasse 1</street>
            <postalCode>8001</postalCode>
            <city>Zürich</city>
        </address>
        <spouse>
            <firstName>Maria</firstName>
            <lastName>Mustermann</lastName>
            <ssn>756.9876.5432.10</ssn>
        </spouse>
    </taxpayer>
    <income>
        <employment>85000.00</employment>
        <selfEmployment>0.00</selfEmployment>
        <capital>2500.50</capital>
        <rental>0.00</rental>
        <pension>0.00</pension>
        <other>500.00</other>
        <total>88000.50</total>
    </income>
    <deductions>
        <professionalExpenses>3200.00</professionalExpenses>
        <pillar3a>7056.00</pillar3a>
        <insurancePremiums>4800.00</insurancePremiums>
        <medicalExpenses>1200.00</medicalExpenses>
        <childDeduction>6700.00</childDeduction>
        <total>22956.00</total>
    </deductions>
    <assets>
        <bankAccounts>45000.00</bankAccounts>
        <securities>125000.00</securities>
        <realEstate>850000.00</realEstate>
        <otherAssets>0.00</otherAssets>
        <totalAssets>1020000.00</totalAssets>
        <mortgages>420000.00</mortgages>
        <otherDebts>0.00</otherDebts>
        <totalDebts>420000.00</totalDebts>
        <netWealth>600000.00</netWealth>
    </assets>
</eTaxStatement>'''

MINIMAL_ECH_XML = '''<?xml version="1.0" encoding="UTF-8"?>
<eTaxStatement xmlns="http://www.ech.ch/xmlns/eCH-0196/1">
    <taxYear>2024</taxYear>
    <canton>ZH</canton>
    <taxpayer>
        <firstName>Test</firstName>
        <lastName>User</lastName>
    </taxpayer>
    <income>
        <employment>50000.00</employment>
        <total>50000.00</total>
    </income>
</eTaxStatement>'''


class TestECH0196Parser:
    """Test suite for ECH0196Parser"""

    def setup_method(self):
        """Set up test fixtures"""
        self.parser = ECH0196Parser()

    def test_parser_initialization(self):
        """Test parser is initialized with correct version and standard"""
        assert self.parser.version == "2.2.0"
        assert self.parser.standard == "eCH-0196"

    def test_parse_valid_xml(self):
        """Test parsing valid eCH-0196 XML"""
        xml_bytes = SAMPLE_ECH_XML.encode('utf-8')

        with patch.object(self.parser, '_extract_xml_from_pdf', return_value=(SAMPLE_ECH_XML, 'barcode')):
            result = self.parser.parse_document(xml_bytes, 'application/pdf')

        assert result['format'] == 'eCH-0196-2.2.0'
        assert result['confidence'] == 1.0
        assert result['method'] == 'barcode'
        assert 'data' in result
        assert 'raw_xml' in result

    def test_parse_taxpayer_information(self):
        """Test parsing taxpayer personal information"""
        parsed = self.parser._parse_ech_xml(SAMPLE_ECH_XML)

        taxpayer = parsed['taxpayer']
        assert taxpayer['ssn'] == '756.1234.5678.90'
        assert taxpayer['first_name'] == 'Max'
        assert taxpayer['last_name'] == 'Mustermann'
        assert taxpayer['date_of_birth'] == '1985-03-15'
        assert taxpayer['marital_status'] == 'married'

    def test_parse_taxpayer_address(self):
        """Test parsing taxpayer address"""
        parsed = self.parser._parse_ech_xml(SAMPLE_ECH_XML)

        address = parsed['taxpayer']['address']
        assert address['street'] == 'Bahnhofstrasse 1'
        assert address['postal_code'] == '8001'
        assert address['city'] == 'Zürich'

    def test_parse_spouse_information(self):
        """Test parsing spouse information"""
        parsed = self.parser._parse_ech_xml(SAMPLE_ECH_XML)

        spouse = parsed['taxpayer']['spouse']
        assert spouse['first_name'] == 'Maria'
        assert spouse['last_name'] == 'Mustermann'
        assert spouse['ssn'] == '756.9876.5432.10'

    def test_parse_income_data(self):
        """Test parsing income information"""
        parsed = self.parser._parse_ech_xml(SAMPLE_ECH_XML)

        income = parsed['income']
        assert income['employment'] == 85000.00
        assert income['self_employment'] == 0.00
        assert income['capital'] == 2500.50
        assert income['rental'] == 0.00
        assert income['pension'] == 0.00
        assert income['other'] == 500.00
        assert income['total'] == 88000.50

    def test_parse_deductions(self):
        """Test parsing deductions"""
        parsed = self.parser._parse_ech_xml(SAMPLE_ECH_XML)

        deductions = parsed['deductions']
        assert deductions['professional_expenses'] == 3200.00
        assert deductions['pillar_3a'] == 7056.00
        assert deductions['insurance_premiums'] == 4800.00
        assert deductions['medical_expenses'] == 1200.00
        assert deductions['child_deduction'] == 6700.00
        assert deductions['total'] == 22956.00

    def test_parse_assets(self):
        """Test parsing assets and wealth"""
        parsed = self.parser._parse_ech_xml(SAMPLE_ECH_XML)

        assets = parsed['assets']
        assert assets['bank_accounts'] == 45000.00
        assert assets['securities'] == 125000.00
        assert assets['real_estate'] == 850000.00
        assert assets['total_assets'] == 1020000.00
        assert assets['mortgages'] == 420000.00
        assert assets['total_debts'] == 420000.00
        assert assets['net_wealth'] == 600000.00

    def test_parse_minimal_xml(self):
        """Test parsing minimal valid XML with required fields only"""
        parsed = self.parser._parse_ech_xml(MINIMAL_ECH_XML)

        assert parsed['tax_year'] == '2024'
        assert parsed['canton'] == 'ZH'
        assert parsed['taxpayer']['first_name'] == 'Test'
        assert parsed['taxpayer']['last_name'] == 'User'
        assert parsed['income']['employment'] == 50000.00

    def test_map_to_tax_profile(self):
        """Test mapping parsed data to tax profile format"""
        parsed = self.parser._parse_ech_xml(SAMPLE_ECH_XML)
        profile = self.parser.map_to_tax_profile(parsed)

        # Personal information
        assert profile['ahv_number'] == '756.1234.5678.90'
        assert profile['first_name'] == 'Max'
        assert profile['last_name'] == 'Mustermann'
        assert profile['date_of_birth'] == '1985-03-15'
        assert profile['marital_status'] == 'married'

        # Address
        assert profile['street'] == 'Bahnhofstrasse 1'
        assert profile['postal_code'] == '8001'
        assert profile['city'] == 'Zürich'

        # Spouse
        assert profile['spouse_first_name'] == 'Maria'
        assert profile['spouse_last_name'] == 'Mustermann'
        assert profile['spouse_ahv_number'] == '756.9876.5432.10'

        # Income
        assert profile['employment_income'] == 85000.00
        assert profile['capital_income'] == 2500.50
        assert profile['other_income'] == 500.00

        # Assets
        assert profile['bank_account_balance'] == 45000.00
        assert profile['securities_value'] == 125000.00
        assert profile['net_wealth'] == 600000.00

        # Deductions
        assert profile['pillar_3a_contributions'] == 7056.00
        assert profile['insurance_premiums'] == 4800.00

        # Metadata
        assert profile['import_source'] == 'eCH-0196'
        assert profile['import_tax_year'] == '2024'
        assert profile['import_canton'] == 'ZH'

    def test_validate_valid_xml(self):
        """Test validation accepts valid eCH-0196 XML"""
        assert self.parser.validate(SAMPLE_ECH_XML) is True

    def test_validate_minimal_xml(self):
        """Test validation accepts minimal valid XML"""
        assert self.parser.validate(MINIMAL_ECH_XML) is True

    def test_validate_invalid_root(self):
        """Test validation rejects XML with wrong root element"""
        invalid_xml = '<InvalidRoot><taxYear>2024</taxYear></InvalidRoot>'
        assert self.parser.validate(invalid_xml) is False

    def test_validate_missing_required_fields(self):
        """Test validation rejects XML missing required fields"""
        invalid_xml = '''<?xml version="1.0" encoding="UTF-8"?>
        <eTaxStatement xmlns="http://www.ech.ch/xmlns/eCH-0196/1">
            <taxYear>2024</taxYear>
        </eTaxStatement>'''
        assert self.parser.validate(invalid_xml) is False

    def test_validate_malformed_xml(self):
        """Test validation rejects malformed XML"""
        malformed_xml = '<eTaxStatement><taxYear>2024</taxYear'  # Missing closing tag
        assert self.parser.validate(malformed_xml) is False

    def test_find_xml_in_text(self):
        """Test finding XML content in extracted text"""
        text = f"Some PDF text before\n{SAMPLE_ECH_XML}\nSome text after"
        found_xml = self.parser._find_xml_in_text(text)

        assert found_xml is not None
        assert '<eTaxStatement' in found_xml
        assert '</eTaxStatement>' in found_xml

    def test_find_xml_in_text_no_xml(self):
        """Test finding XML when none exists"""
        text = "Just some regular PDF text without any XML"
        found_xml = self.parser._find_xml_in_text(text)

        assert found_xml is None

    @patch('parsers.ech0196_parser.PyPDF2.PdfReader')
    def test_extract_text_from_pdf(self, mock_pdf_reader):
        """Test text extraction from PDF"""
        # Mock PDF pages
        mock_page1 = Mock()
        mock_page1.extract_text.return_value = "Page 1 text\n"
        mock_page2 = Mock()
        mock_page2.extract_text.return_value = "Page 2 text\n"

        mock_reader_instance = Mock()
        mock_reader_instance.pages = [mock_page1, mock_page2]
        mock_pdf_reader.return_value = mock_reader_instance

        pdf_bytes = b'%PDF-1.4 fake pdf content'
        text = self.parser._extract_text_from_pdf(pdf_bytes)

        assert text == "Page 1 text\nPage 2 text\n"
        mock_pdf_reader.assert_called_once()

    def test_parse_missing_spouse(self):
        """Test parsing XML without spouse information"""
        xml_no_spouse = '''<?xml version="1.0" encoding="UTF-8"?>
        <eTaxStatement xmlns="http://www.ech.ch/xmlns/eCH-0196/1">
            <taxYear>2024</taxYear>
            <canton>ZH</canton>
            <taxpayer>
                <firstName>Single</firstName>
                <lastName>Person</lastName>
                <maritalStatus>single</maritalStatus>
            </taxpayer>
            <income><employment>50000.00</employment><total>50000.00</total></income>
        </eTaxStatement>'''

        parsed = self.parser._parse_ech_xml(xml_no_spouse)
        assert 'spouse' not in parsed['taxpayer']

    def test_parse_invalid_xml_raises_error(self):
        """Test that parsing invalid XML raises ValueError"""
        invalid_xml = "Not XML at all"

        with pytest.raises(ValueError, match="Invalid eCH-0196 XML"):
            self.parser._parse_ech_xml(invalid_xml)

    def test_parse_document_no_xml_found(self):
        """Test parse_document raises error when no XML found"""
        pdf_bytes = b'%PDF-1.4 fake pdf without eCH data'

        with patch.object(self.parser, '_extract_xml_from_pdf', return_value=(None, '')):
            with patch.object(self.parser, '_extract_text_from_pdf', return_value='Plain text no XML'):
                with pytest.raises(ValueError, match="No eCH-0196 data found"):
                    self.parser.parse_document(pdf_bytes, 'application/pdf')

    def test_income_parsing_with_missing_fields(self):
        """Test income parsing handles missing optional fields"""
        xml_partial_income = '''<?xml version="1.0" encoding="UTF-8"?>
        <eTaxStatement xmlns="http://www.ech.ch/xmlns/eCH-0196/1">
            <taxYear>2024</taxYear>
            <canton>ZH</canton>
            <taxpayer><firstName>Test</firstName><lastName>User</lastName></taxpayer>
            <income>
                <employment>75000.00</employment>
                <total>75000.00</total>
            </income>
        </eTaxStatement>'''

        parsed = self.parser._parse_ech_xml(xml_partial_income)
        income = parsed['income']

        assert income['employment'] == 75000.00
        assert income['self_employment'] == 0.0
        assert income['capital'] == 0.0
        assert income['rental'] == 0.0

    def test_deductions_parsing_with_invalid_amounts(self):
        """Test deductions parsing handles invalid numeric values"""
        xml_invalid = '''<?xml version="1.0" encoding="UTF-8"?>
        <eTaxStatement xmlns="http://www.ech.ch/xmlns/eCH-0196/1">
            <taxYear>2024</taxYear>
            <canton>ZH</canton>
            <taxpayer><firstName>Test</firstName><lastName>User</lastName></taxpayer>
            <income><employment>50000</employment><total>50000</total></income>
            <deductions>
                <pillar3a>not_a_number</pillar3a>
                <insurancePremiums>5000.00</insurancePremiums>
            </deductions>
        </eTaxStatement>'''

        parsed = self.parser._parse_ech_xml(xml_invalid)
        deductions = parsed['deductions']

        # Invalid value should return 0.0
        assert deductions['pillar_3a'] == 0.0
        # Valid value should parse correctly
        assert deductions['insurance_premiums'] == 5000.00

    def test_namespace_handling(self):
        """Test parser handles namespaced XML (primary use case)"""
        # Test with full namespace (SAMPLE_ECH_XML already tests this)
        parsed_ns = self.parser._parse_ech_xml(SAMPLE_ECH_XML)
        assert parsed_ns['tax_year'] == '2024'
        assert parsed_ns['canton'] == 'ZH'
        assert parsed_ns['taxpayer']['first_name'] == 'Max'
        assert parsed_ns['taxpayer']['last_name'] == 'Mustermann'

        # Minimal XML (without namespace) can parse root-level fields
        parsed_minimal = self.parser._parse_ech_xml(MINIMAL_ECH_XML)
        assert parsed_minimal['tax_year'] == '2024'
        assert parsed_minimal['canton'] == 'ZH'
        # Note: Nested fields without namespace may not parse correctly
        # This is acceptable as eCH-0196 standard requires proper namespacing


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
