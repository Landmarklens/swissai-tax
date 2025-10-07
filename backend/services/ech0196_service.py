"""
eCH-0196 Service - Swiss E-Tax Statement Standard

This service generates eCH-0196 compliant e-tax statements with embedded
Data Matrix barcodes. The standard is accepted by all 26 Swiss cantons.

Reference: https://www.ech.ch/de/ech/ech-0196
"""

import io
import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from xml.dom import minidom

from PIL import Image

logger = logging.getLogger(__name__)


class ECH0196Service:
    """
    Service for generating eCH-0196 compliant e-tax statements.

    eCH-0196 is the Swiss e-government standard for electronic tax statements.
    It defines a structured format (XML) that can be embedded in PDFs as
    Data Matrix barcodes for automatic processing by cantonal tax authorities.
    """

    def __init__(self):
        self.version = "1.0"
        self.standard = "eCH-0196"

    def generate_barcode_data(
        self,
        filing_data: Dict[str, Any],
        calculation_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate eCH-0196 compliant barcode data from filing and calculation.

        Args:
            filing_data: Tax filing session data (from TaxFilingSession.to_dict())
            calculation_data: Tax calculation results

        Returns:
            Dict with:
                - xml_string: eCH-0196 XML as string
                - barcode_image: PIL Image object with Data Matrix barcode
                - qr_code_image: PIL Image object with QR code reference
        """
        # Create eCH-0196 XML structure
        xml_string = self._create_ech_xml(filing_data, calculation_data)

        # Generate Data Matrix barcode
        barcode_image = self._create_datamatrix_barcode(xml_string)

        # Generate QR code with filing reference
        qr_code_image = self._create_qr_code(filing_data['id'])

        return {
            'xml_string': xml_string,
            'barcode_image': barcode_image,
            'qr_code_image': qr_code_image,
            'barcode_data_length': len(xml_string)
        }

    def _create_ech_xml(
        self,
        filing_data: Dict[str, Any],
        calculation_data: Dict[str, Any]
    ) -> str:
        """
        Create eCH-0196 compliant XML structure.

        Args:
            filing_data: Filing session data
            calculation_data: Tax calculation data

        Returns:
            XML string
        """
        profile = filing_data.get('profile', {})

        # Create root element
        root = ET.Element('eTaxStatement', {
            'xmlns': 'http://www.ech.ch/xmlns/eCH-0196/1',
            'version': self.version
        })

        # Header
        header = ET.SubElement(root, 'header')
        ET.SubElement(header, 'messageId').text = filing_data['id']
        ET.SubElement(header, 'creationDate').text = datetime.utcnow().isoformat()
        ET.SubElement(header, 'standard').text = self.standard
        ET.SubElement(header, 'standardVersion').text = self.version

        # Tax year
        ET.SubElement(root, 'taxYear').text = str(filing_data['tax_year'])

        # Canton
        ET.SubElement(root, 'canton').text = filing_data['canton']

        # Taxpayer information
        taxpayer = ET.SubElement(root, 'taxpayer')
        ET.SubElement(taxpayer, 'ssn').text = profile.get('ssn', '')
        ET.SubElement(taxpayer, 'lastName').text = profile.get('name', '')
        ET.SubElement(taxpayer, 'firstName').text = profile.get('firstname', '')
        ET.SubElement(taxpayer, 'dateOfBirth').text = profile.get('birthdate', '')

        # Address
        address = ET.SubElement(taxpayer, 'address')
        ET.SubElement(address, 'street').text = profile.get('address', '')
        ET.SubElement(address, 'postalCode').text = profile.get('zip', '')
        ET.SubElement(address, 'city').text = profile.get('city', '')

        # Marital status
        ET.SubElement(taxpayer, 'maritalStatus').text = profile.get('marital_status', 'single')

        # Spouse (if married)
        if profile.get('marital_status') == 'married':
            spouse = ET.SubElement(taxpayer, 'spouse')
            ET.SubElement(spouse, 'lastName').text = profile.get('spouse_name', '')
            ET.SubElement(spouse, 'firstName').text = profile.get('spouse_firstname', '')
            ET.SubElement(spouse, 'ssn').text = profile.get('spouse_ssn', '')

        # Income
        income = ET.SubElement(root, 'income')
        income_data = calculation_data.get('income', {})
        ET.SubElement(income, 'employment').text = self._format_amount(income_data.get('employment', 0))
        ET.SubElement(income, 'selfEmployment').text = self._format_amount(income_data.get('self_employment', 0))
        ET.SubElement(income, 'capital').text = self._format_amount(income_data.get('capital', 0))
        ET.SubElement(income, 'rental').text = self._format_amount(income_data.get('rental', 0))
        ET.SubElement(income, 'other').text = self._format_amount(income_data.get('other', 0))
        ET.SubElement(income, 'total').text = self._format_amount(income_data.get('total', 0))

        # Deductions
        deductions = ET.SubElement(root, 'deductions')
        ded_data = calculation_data.get('deductions', {})
        ET.SubElement(deductions, 'professionalExpenses').text = self._format_amount(ded_data.get('professional_expenses', 0))
        ET.SubElement(deductions, 'pillar3a').text = self._format_amount(ded_data.get('pillar_3a', 0))
        ET.SubElement(deductions, 'insurancePremiums').text = self._format_amount(ded_data.get('insurance_premiums', 0))
        ET.SubElement(deductions, 'medicalExpenses').text = self._format_amount(ded_data.get('medical_expenses', 0))
        ET.SubElement(deductions, 'childDeduction').text = self._format_amount(ded_data.get('child_deduction', 0))
        ET.SubElement(deductions, 'total').text = self._format_amount(ded_data.get('total', 0))

        # Tax calculation
        taxes = ET.SubElement(root, 'taxes')
        ET.SubElement(taxes, 'taxableIncome').text = self._format_amount(calculation_data.get('taxable_income', 0))
        ET.SubElement(taxes, 'federalTax').text = self._format_amount(calculation_data.get('federal_tax', 0))
        ET.SubElement(taxes, 'cantonalTax').text = self._format_amount(calculation_data.get('cantonal_tax', 0))
        ET.SubElement(taxes, 'municipalTax').text = self._format_amount(calculation_data.get('municipal_tax', 0))
        ET.SubElement(taxes, 'churchTax').text = self._format_amount(calculation_data.get('church_tax', 0))
        ET.SubElement(taxes, 'totalTax').text = self._format_amount(calculation_data.get('total_tax', 0))

        # Filing type (primary/secondary)
        filing_type = 'primary' if filing_data.get('is_primary') else 'secondary'
        ET.SubElement(root, 'filingType').text = filing_type

        # Convert to pretty XML string
        xml_string = self._prettify_xml(root)

        return xml_string

    def _format_amount(self, amount: float) -> str:
        """Format amount as string with 2 decimal places"""
        return f"{float(amount):.2f}"

    def _prettify_xml(self, elem: ET.Element) -> str:
        """
        Return a pretty-printed XML string.

        Args:
            elem: XML Element

        Returns:
            Formatted XML string
        """
        rough_string = ET.tostring(elem, encoding='utf-8')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ", encoding='utf-8').decode('utf-8')

    def _create_datamatrix_barcode(self, data: str) -> Optional[Image.Image]:
        """
        Create Data Matrix barcode from XML data.

        Data Matrix is a 2D barcode that can encode large amounts of data.
        It's the standard for eCH-0196.

        Args:
            data: XML string to encode

        Returns:
            PIL Image with barcode, or None if encoding fails
        """
        try:
            # Try to use pylibdmtx for real Data Matrix encoding
            from pylibdmtx.pylibdmtx import encode

            encoded = encode(data.encode('utf-8'))

            # Convert to PIL Image
            img = Image.frombytes('RGB', (encoded.width, encoded.height), encoded.pixels)

            # Scale up for better scanning (300x300 minimum)
            scale_factor = max(1, 300 // max(encoded.width, encoded.height))
            new_size = (encoded.width * scale_factor, encoded.height * scale_factor)
            img = img.resize(new_size, Image.NEAREST)

            logger.info(f"Created Data Matrix barcode: {img.size}")
            return img

        except ImportError:
            logger.warning("pylibdmtx not available, using QR code fallback")
            # Fallback to QR code if Data Matrix library not available
            return self._create_qr_code_fallback(data)

        except Exception as e:
            logger.error(f"Failed to create Data Matrix barcode: {e}")
            return self._create_qr_code_fallback(data)

    def _create_qr_code(self, filing_id: str) -> Image.Image:
        """
        Create QR code with filing reference.

        This QR code contains a URL to access the filing online.

        Args:
            filing_id: Filing ID

        Returns:
            PIL Image with QR code
        """
        import qrcode

        # Create QR code with filing reference URL
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )

        url = f"https://swissai.tax/filing/{filing_id}"
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        logger.info(f"Created QR code for filing {filing_id}")
        return img

    def _create_qr_code_fallback(self, data: str) -> Image.Image:
        """
        Create QR code as fallback when Data Matrix encoding fails.

        Args:
            data: Data to encode

        Returns:
            PIL Image with QR code
        """
        import qrcode

        # QR codes can't handle as much data as Data Matrix
        # Truncate if necessary
        max_qr_length = 2000
        if len(data) > max_qr_length:
            logger.warning(f"Data too long for QR code ({len(data)} chars), truncating")
            data = data[:max_qr_length]

        qr = qrcode.QRCode(
            version=None,  # Auto-size
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )

        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        return img

    def validate_xml(self, xml_string: str) -> bool:
        """
        Validate eCH-0196 XML structure.

        Args:
            xml_string: XML string to validate

        Returns:
            True if valid, False otherwise
        """
        try:
            root = ET.fromstring(xml_string)

            # Define namespace for eCH-0196
            namespace = {'ech': 'http://www.ech.ch/xmlns/eCH-0196/1'}

            # Check required elements (with namespace)
            required_elements = [
                'header', 'taxYear', 'canton', 'taxpayer',
                'income', 'deductions', 'taxes'
            ]

            for elem_name in required_elements:
                # Try with namespace first, then without
                elem = root.find(f'ech:{elem_name}', namespace)
                if elem is None:
                    # Try without namespace (for testing/flexibility)
                    elem = root.find(elem_name)
                if elem is None:
                    logger.error(f"Missing required element: {elem_name}")
                    return False

            logger.info("eCH-0196 XML validation passed")
            return True

        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
            return False
