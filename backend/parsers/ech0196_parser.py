"""
eCH-0196 Parser - Swiss E-Tax Statement Standard

This parser extracts data from eCH-0196 compliant e-tax statements.
It can read Data Matrix barcodes from PDFs and parse the embedded XML.

Reference: https://www.ech.ch/de/ech/ech-0196
"""

import io
import logging
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

from PIL import Image
import PyPDF2

logger = logging.getLogger(__name__)


class ECH0196Parser:
    """
    Parser for eCH-0196 compliant e-tax statements from Swiss banks.

    eCH-0196 is the Swiss e-government standard for electronic tax statements.
    Bank statements contain Data Matrix barcodes or PDF417 codes with embedded XML data.
    """

    def __init__(self):
        self.version = "2.2.0"  # Latest eCH-0196 version
        self.standard = "eCH-0196"

    def parse_document(self, file_bytes: bytes, mime_type: str = 'application/pdf') -> Dict[str, Any]:
        """
        Parse an eCH-0196 document and extract structured data.

        Args:
            file_bytes: Document file as bytes
            mime_type: MIME type of the document

        Returns:
            Dict with:
                - format: 'eCH-0196-X.X'
                - data: Extracted structured data
                - confidence: Confidence score (1.0 for structured, lower for fallback)
                - method: 'barcode', 'xml', or 'fallback'
        """
        try:
            # Try to extract from Data Matrix barcode first
            xml_content, method = self._extract_xml_from_pdf(file_bytes)

            if xml_content:
                parsed_data = self._parse_ech_xml(xml_content)
                return {
                    'format': f'eCH-0196-{self.version}',
                    'data': parsed_data,
                    'confidence': 1.0,
                    'method': method,
                    'raw_xml': xml_content
                }
            else:
                # Fallback: Look for plain XML in PDF text
                logger.warning("No barcode found, attempting text extraction")
                text = self._extract_text_from_pdf(file_bytes)
                xml_content = self._find_xml_in_text(text)

                if xml_content:
                    parsed_data = self._parse_ech_xml(xml_content)
                    return {
                        'format': f'eCH-0196-{self.version}',
                        'data': parsed_data,
                        'confidence': 0.8,
                        'method': 'text_extraction',
                        'raw_xml': xml_content
                    }
                else:
                    raise ValueError("No eCH-0196 data found in document")

        except Exception as e:
            logger.error(f"Failed to parse eCH-0196 document: {e}")
            raise

    def _extract_xml_from_pdf(self, pdf_bytes: bytes) -> Tuple[Optional[str], str]:
        """
        Extract XML from Data Matrix or PDF417 barcode in PDF.

        Args:
            pdf_bytes: PDF file as bytes

        Returns:
            Tuple of (XML string, extraction method) or (None, '')
        """
        try:
            # Try to use pyzbar for barcode detection
            try:
                from pyzbar.pyzbar import decode as barcode_decode
                from pdf2image import convert_from_bytes

                # Convert PDF pages to images
                images = convert_from_bytes(pdf_bytes, dpi=300, fmt='png')

                for page_num, image in enumerate(images):
                    # Decode barcodes from image
                    barcodes = barcode_decode(image)

                    for barcode in barcodes:
                        if barcode.type in ['DATAMATRIX', 'PDF417']:
                            xml_data = barcode.data.decode('utf-8')

                            # Validate it's XML
                            if xml_data.strip().startswith('<?xml') or '<eTaxStatement' in xml_data:
                                logger.info(f"Found {barcode.type} barcode on page {page_num + 1}")
                                return xml_data, 'barcode'

            except ImportError:
                logger.warning("pyzbar or pdf2image not available, skipping barcode extraction")

            return None, ''

        except Exception as e:
            logger.error(f"Barcode extraction failed: {e}")
            return None, ''

    def _extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """
        Extract all text from PDF.

        Args:
            pdf_bytes: PDF file as bytes

        Returns:
            Extracted text
        """
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text = ""

            for page in pdf_reader.pages:
                text += page.extract_text()

            return text

        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return ""

    def _find_xml_in_text(self, text: str) -> Optional[str]:
        """
        Find XML content in extracted text.

        Args:
            text: Extracted text from PDF

        Returns:
            XML string or None
        """
        # Look for XML declaration or eTaxStatement tag
        xml_patterns = [
            r'<\?xml.*?<eTaxStatement.*?</eTaxStatement>',
            r'<eTaxStatement.*?</eTaxStatement>'
        ]

        for pattern in xml_patterns:
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(0)

        return None

    def _parse_ech_xml(self, xml_string: str) -> Dict[str, Any]:
        """
        Parse eCH-0196 XML and extract all data.

        Args:
            xml_string: eCH-0196 XML content

        Returns:
            Dict with extracted data
        """
        try:
            root = ET.fromstring(xml_string)

            # Define namespace (eCH-0196 uses specific namespace)
            ns = {'ech': 'http://www.ech.ch/xmlns/eCH-0196/1'}

            # Helper function to get text with fallback
            def get_text(elem, path, namespaces=None):
                found = elem.find(path, namespaces) if namespaces else elem.find(path)
                return found.text if found is not None else None

            # Extract header information
            header = root.find('header') or root.find('ech:header', ns)

            # Extract taxpayer information
            taxpayer_elem = root.find('taxpayer') or root.find('ech:taxpayer', ns)

            # Extract income data
            income_elem = root.find('income') or root.find('ech:income', ns)

            # Extract deductions
            deductions_elem = root.find('deductions') or root.find('ech:deductions', ns)

            # Extract assets (if present in bank statements)
            assets_elem = root.find('assets') or root.find('ech:assets', ns)

            # Build structured data
            data = {
                'document_type': 'eCH-0196-bank-statement',
                'tax_year': get_text(root, 'taxYear') or get_text(root, 'ech:taxYear', ns),
                'canton': get_text(root, 'canton') or get_text(root, 'ech:canton', ns),

                # Taxpayer information
                'taxpayer': self._parse_taxpayer(taxpayer_elem, ns) if taxpayer_elem is not None else {},

                # Financial data
                'income': self._parse_income(income_elem, ns) if income_elem is not None else {},
                'deductions': self._parse_deductions(deductions_elem, ns) if deductions_elem is not None else {},
                'assets': self._parse_assets(assets_elem, ns) if assets_elem is not None else {},
            }

            return data

        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
            raise ValueError(f"Invalid eCH-0196 XML: {e}")

    def _parse_taxpayer(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse taxpayer information from XML."""
        def get_text(path):
            found = elem.find(path) or elem.find(f'ech:{path}', ns)
            return found.text if found is not None else None

        data = {
            'ssn': get_text('ssn') or get_text('ahvNumber'),
            'last_name': get_text('lastName'),
            'first_name': get_text('firstName'),
            'date_of_birth': get_text('dateOfBirth'),
            'marital_status': get_text('maritalStatus'),
        }

        # Address
        address_elem = elem.find('address') or elem.find('ech:address', ns)
        if address_elem is not None:
            street_elem = address_elem.find('street') or address_elem.find('ech:street', ns)
            postal_elem = address_elem.find('postalCode') or address_elem.find('ech:postalCode', ns)
            city_elem = address_elem.find('city') or address_elem.find('ech:city', ns)

            data['address'] = {
                'street': street_elem.text if street_elem is not None else None,
                'postal_code': postal_elem.text if postal_elem is not None else None,
                'city': city_elem.text if city_elem is not None else None,
            }

        # Spouse (if married)
        spouse_elem = elem.find('spouse') or elem.find('ech:spouse', ns)
        if spouse_elem is not None:
            spouse_last_elem = spouse_elem.find('lastName') or spouse_elem.find('ech:lastName', ns)
            spouse_first_elem = spouse_elem.find('firstName') or spouse_elem.find('ech:firstName', ns)
            spouse_ssn_elem = spouse_elem.find('ssn') or spouse_elem.find('ech:ssn', ns)

            data['spouse'] = {
                'last_name': spouse_last_elem.text if spouse_last_elem is not None else None,
                'first_name': spouse_first_elem.text if spouse_first_elem is not None else None,
                'ssn': spouse_ssn_elem.text if spouse_ssn_elem is not None else None,
            }

        return data

    def _parse_income(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse income data from XML."""
        def get_amount(path):
            found = elem.find(path) or elem.find(f'ech:{path}', ns)
            if found is not None and found.text:
                try:
                    return float(found.text)
                except ValueError:
                    return 0.0
            return 0.0

        return {
            'employment': get_amount('employment'),
            'self_employment': get_amount('selfEmployment'),
            'capital': get_amount('capital'),
            'rental': get_amount('rental'),
            'pension': get_amount('pension'),
            'other': get_amount('other'),
            'total': get_amount('total'),
        }

    def _parse_deductions(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse deductions from XML."""
        def get_amount(path):
            found = elem.find(path) or elem.find(f'ech:{path}', ns)
            if found is not None and found.text:
                try:
                    return float(found.text)
                except ValueError:
                    return 0.0
            return 0.0

        return {
            'professional_expenses': get_amount('professionalExpenses'),
            'pillar_3a': get_amount('pillar3a'),
            'insurance_premiums': get_amount('insurancePremiums'),
            'medical_expenses': get_amount('medicalExpenses'),
            'child_deduction': get_amount('childDeduction'),
            'total': get_amount('total'),
        }

    def _parse_assets(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse assets/wealth data from XML (bank statements)."""
        def get_amount(path):
            found = elem.find(path) or elem.find(f'ech:{path}', ns)
            if found is not None and found.text:
                try:
                    return float(found.text)
                except ValueError:
                    return 0.0
            return 0.0

        return {
            'bank_accounts': get_amount('bankAccounts') or get_amount('cashAssets'),
            'securities': get_amount('securities') or get_amount('securitiesValue'),
            'real_estate': get_amount('realEstate') or get_amount('propertyValue'),
            'other_assets': get_amount('otherAssets'),
            'total_assets': get_amount('totalAssets') or get_amount('total'),

            # Debts
            'mortgages': get_amount('mortgages'),
            'other_debts': get_amount('otherDebts'),
            'total_debts': get_amount('totalDebts'),

            # Net wealth
            'net_wealth': get_amount('netWealth'),
        }

    def map_to_tax_profile(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map parsed eCH-0196 data to tax profile fields.

        Args:
            parsed_data: Data from _parse_ech_xml()

        Returns:
            Dict with tax profile field mappings
        """
        profile_data = {}

        # Personal information
        if 'taxpayer' in parsed_data:
            taxpayer = parsed_data['taxpayer']
            profile_data['ahv_number'] = taxpayer.get('ssn')
            profile_data['first_name'] = taxpayer.get('first_name')
            profile_data['last_name'] = taxpayer.get('last_name')
            profile_data['date_of_birth'] = taxpayer.get('date_of_birth')
            profile_data['marital_status'] = taxpayer.get('marital_status')

            if 'address' in taxpayer:
                addr = taxpayer['address']
                profile_data['street'] = addr.get('street')
                profile_data['postal_code'] = addr.get('postal_code')
                profile_data['city'] = addr.get('city')

            if 'spouse' in taxpayer:
                spouse = taxpayer['spouse']
                profile_data['spouse_first_name'] = spouse.get('first_name')
                profile_data['spouse_last_name'] = spouse.get('last_name')
                profile_data['spouse_ahv_number'] = spouse.get('ssn')

        # Income data
        if 'income' in parsed_data:
            income = parsed_data['income']
            profile_data['employment_income'] = income.get('employment')
            profile_data['self_employment_income'] = income.get('self_employment')
            profile_data['capital_income'] = income.get('capital')
            profile_data['rental_income'] = income.get('rental')
            profile_data['pension_income'] = income.get('pension')
            profile_data['other_income'] = income.get('other')

        # Assets (bank statement data)
        if 'assets' in parsed_data:
            assets = parsed_data['assets']
            profile_data['bank_account_balance'] = assets.get('bank_accounts')
            profile_data['securities_value'] = assets.get('securities')
            profile_data['real_estate_value'] = assets.get('real_estate')
            profile_data['total_assets'] = assets.get('total_assets')
            profile_data['mortgage_debt'] = assets.get('mortgages')
            profile_data['other_debts'] = assets.get('other_debts')
            profile_data['net_wealth'] = assets.get('net_wealth')

        # Deductions
        if 'deductions' in parsed_data:
            deductions = parsed_data['deductions']
            profile_data['pillar_3a_contributions'] = deductions.get('pillar_3a')
            profile_data['insurance_premiums'] = deductions.get('insurance_premiums')
            profile_data['medical_expenses'] = deductions.get('medical_expenses')

        # Metadata
        profile_data['import_source'] = 'eCH-0196'
        profile_data['import_tax_year'] = parsed_data.get('tax_year')
        profile_data['import_canton'] = parsed_data.get('canton')

        return profile_data

    def validate(self, xml_string: str) -> bool:
        """
        Validate if XML conforms to eCH-0196 standard.

        Args:
            xml_string: XML string to validate

        Returns:
            True if valid, False otherwise
        """
        try:
            root = ET.fromstring(xml_string)

            # Check root element
            if 'eTaxStatement' not in root.tag:
                logger.error("Root element is not eTaxStatement")
                return False

            # Define namespace
            ns = {'ech': 'http://www.ech.ch/xmlns/eCH-0196/1'}

            # Check required elements
            required_elements = ['taxYear', 'canton', 'taxpayer', 'income']

            for elem_name in required_elements:
                elem = root.find(elem_name) or root.find(f'ech:{elem_name}', ns)
                if elem is None:
                    logger.error(f"Missing required element: {elem_name}")
                    return False

            logger.info("eCH-0196 validation passed")
            return True

        except ET.ParseError as e:
            logger.error(f"XML parsing error during validation: {e}")
            return False
