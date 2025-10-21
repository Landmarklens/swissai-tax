"""
Swissdec ELM Parser - Swiss Electronic Salary Certificate

This parser extracts data from Swissdec ELM compliant salary certificates (Lohnausweis).
Supports ELM versions 5.0, 5.4, and 5.5.

Reference: https://www.swissdec.ch/
"""

import io
import logging
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

import PyPDF2

logger = logging.getLogger(__name__)


class SwissdecParser:
    """
    Parser for Swissdec ELM compliant salary certificates.

    Swissdec ELM (Employer-Employee-Municipality-Lohnmeldeverfahren) is the Swiss standard
    for electronic salary certificates. Employers issue XML-based certificates that can be
    read automatically for tax filing.

    Supports versions: 5.0, 5.4, 5.5
    """

    def __init__(self):
        self.supported_versions = ['5.0', '5.4', '5.5']
        self.standard = "Swissdec-ELM"

    def parse_document(self, file_bytes: bytes, mime_type: str = 'application/xml') -> Dict[str, Any]:
        """
        Parse a Swissdec ELM document and extract structured data.

        Args:
            file_bytes: Document file as bytes (XML or PDF with embedded XML)
            mime_type: MIME type of the document

        Returns:
            Dict with:
                - format: 'Swissdec-ELM-X.X'
                - data: Extracted structured data
                - confidence: Confidence score (1.0 for valid XML)
                - method: 'xml' or 'pdf_embedded'
        """
        try:
            xml_content = None
            method = 'xml'

            # If PDF, try to extract embedded XML
            if mime_type == 'application/pdf' or file_bytes.startswith(b'%PDF'):
                xml_content = self._extract_xml_from_pdf(file_bytes)
                method = 'pdf_embedded'

            # If XML or extraction failed, treat as direct XML
            if not xml_content:
                try:
                    xml_content = file_bytes.decode('utf-8')
                    method = 'xml'
                except UnicodeDecodeError:
                    raise ValueError("Unable to decode document as XML")

            # Parse the XML
            version = self._detect_version(xml_content)
            parsed_data = self._parse_elm_xml(xml_content, version)

            return {
                'format': f'Swissdec-ELM-{version}',
                'data': parsed_data,
                'confidence': 1.0,
                'method': method,
                'raw_xml': xml_content,
                'version': version
            }

        except Exception as e:
            logger.error(f"Failed to parse Swissdec document: {e}")
            raise

    def _extract_xml_from_pdf(self, pdf_bytes: bytes) -> Optional[str]:
        """
        Extract embedded XML from PDF attachment or text.

        Args:
            pdf_bytes: PDF file as bytes

        Returns:
            XML string or None
        """
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))

            # Method 1: Check for file attachments
            if hasattr(pdf_reader, 'attachments') and pdf_reader.attachments:
                for filename, file_data in pdf_reader.attachments.items():
                    if filename.endswith('.xml'):
                        return file_data.decode('utf-8')

            # Method 2: Extract text and look for XML
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()

            # Look for Swissdec XML in text
            xml_match = re.search(r'<\?xml.*?<SalaryDeclaration.*?</SalaryDeclaration>', text, re.DOTALL)
            if xml_match:
                return xml_match.group(0)

            # Method 3: Check metadata for XML
            if pdf_reader.metadata and '/EmbeddedFiles' in pdf_reader.metadata:
                logger.info("Found embedded files in PDF metadata")
                # This would require more advanced PDF parsing

            return None

        except Exception as e:
            logger.error(f"XML extraction from PDF failed: {e}")
            return None

    def _detect_version(self, xml_string: str) -> str:
        """
        Detect Swissdec ELM version from XML.

        Args:
            xml_string: XML content

        Returns:
            Version string (e.g., '5.0')
        """
        try:
            # Look for version in XML declaration or root element
            version_patterns = [
                r'version="ELM-([0-9.]+)"',
                r'elm:version="([0-9.]+)"',
                r'<SalaryDeclaration.*?version="([0-9.]+)"',
            ]

            for pattern in version_patterns:
                match = re.search(pattern, xml_string)
                if match:
                    version = match.group(1)
                    if version in self.supported_versions:
                        return version

            # Default to 5.0 if not found
            logger.warning("Could not detect ELM version, defaulting to 5.0")
            return '5.0'

        except Exception as e:
            logger.error(f"Version detection failed: {e}")
            return '5.0'

    def _parse_elm_xml(self, xml_string: str, version: str) -> Dict[str, Any]:
        """
        Parse Swissdec ELM XML and extract all data.

        Args:
            xml_string: Swissdec ELM XML content
            version: ELM version

        Returns:
            Dict with extracted data
        """
        try:
            root = ET.fromstring(xml_string)

            # Swissdec uses multiple namespaces
            ns = {
                'elm': 'http://www.swissdec.ch/schema/elm/5.0',
                'sd': 'http://www.swissdec.ch/schema/sd/20200220',
                'xsi': 'http://www.w3.org/2001/XMLSchema-instance'
            }

            # Helper to get text with namespace fallback
            def get_text(elem, *paths):
                for path in paths:
                    # Try with namespace
                    found = elem.find(path, ns)
                    if found is not None:
                        return found.text
                    # Try without namespace
                    found = elem.find(path.split(':')[-1]) if ':' in path else elem.find(path)
                    if found is not None:
                        return found.text
                return None

            # Extract employer information
            employer_elem = root.find('.//elm:Employer', ns) or root.find('.//Employer')

            # Extract employee information
            employee_elem = root.find('.//elm:Employee', ns) or root.find('.//Employee')

            # Extract salary information
            salary_elem = root.find('.//elm:Salary', ns) or root.find('.//Salary')

            # Extract deductions and contributions
            deductions_elem = root.find('.//elm:Deductions', ns) or root.find('.//Deductions')
            social_sec_elem = root.find('.//elm:SocialSecurity', ns) or root.find('.//SocialSecurity')

            # Build structured data
            data = {
                'document_type': 'Swissdec-ELM-salary-certificate',
                'tax_year': self._extract_tax_year(root, ns),

                # Employer information
                'employer': self._parse_employer(employer_elem, ns) if employer_elem is not None else {},

                # Employee information
                'employee': self._parse_employee(employee_elem, ns) if employee_elem is not None else {},

                # Salary data
                'salary': self._parse_salary(salary_elem, ns) if salary_elem is not None else {},

                # Deductions and social security
                'deductions': self._parse_deductions(deductions_elem, ns) if deductions_elem is not None else {},
                'social_security': self._parse_social_security(social_sec_elem, ns) if social_sec_elem is not None else {},
            }

            return data

        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
            raise ValueError(f"Invalid Swissdec ELM XML: {e}")

    def _extract_tax_year(self, root: ET.Element, ns: dict) -> Optional[str]:
        """Extract tax year from XML."""
        # Look for period or year fields
        paths = [
            './/elm:Period/elm:From',
            './/Period/From',
            './/elm:TaxYear',
            './/TaxYear',
            './/elm:Year',
            './/Year'
        ]

        for path in paths:
            elem = root.find(path, ns) or root.find(path.split('/')[-1])
            if elem is not None and elem.text:
                # Extract year from date (YYYY-MM-DD) or year directly
                year_match = re.match(r'(\d{4})', elem.text)
                if year_match:
                    return year_match.group(1)

        return None

    def _parse_employer(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse employer information from XML."""
        def get_text(*paths):
            for path in paths:
                found = elem.find(path, ns)
                if found is not None:
                    return found.text
                # Try without namespace
                simple_path = path.split(':')[-1]
                found = elem.find(simple_path)
                if found is not None:
                    return found.text
            return None

        return {
            'name': get_text('elm:Name', 'Name', 'elm:CompanyName', 'CompanyName'),
            'uid': get_text('elm:UID', 'UID', 'elm:CompanyID', 'CompanyID'),
            'address': {
                'street': get_text('elm:Address/elm:Street', 'Address/Street'),
                'postal_code': get_text('elm:Address/elm:PostalCode', 'Address/PostalCode'),
                'city': get_text('elm:Address/elm:City', 'Address/City'),
            }
        }

    def _parse_employee(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse employee information from XML."""
        def get_text(*paths):
            for path in paths:
                found = elem.find(path, ns)
                if found is not None:
                    return found.text
                simple_path = path.split(':')[-1]
                found = elem.find(simple_path)
                if found is not None:
                    return found.text
            return None

        return {
            'ssn': get_text('elm:SSN', 'SSN', 'elm:AHVNumber', 'AHVNumber'),
            'first_name': get_text('elm:FirstName', 'FirstName', 'elm:GivenName', 'GivenName'),
            'last_name': get_text('elm:LastName', 'LastName', 'elm:FamilyName', 'FamilyName'),
            'date_of_birth': get_text('elm:DateOfBirth', 'DateOfBirth', 'elm:BirthDate', 'BirthDate'),
            'marital_status': get_text('elm:MaritalStatus', 'MaritalStatus'),
            'address': {
                'street': get_text('elm:Address/elm:Street', 'Address/Street'),
                'postal_code': get_text('elm:Address/elm:PostalCode', 'Address/PostalCode'),
                'city': get_text('elm:Address/elm:City', 'Address/City'),
            }
        }

    def _parse_salary(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse salary information from XML."""
        def get_amount(*paths):
            for path in paths:
                found = elem.find(path, ns)
                if found is not None and found.text:
                    try:
                        return float(found.text)
                    except ValueError:
                        pass
                simple_path = path.split(':')[-1]
                found = elem.find(simple_path)
                if found is not None and found.text:
                    try:
                        return float(found.text)
                    except ValueError:
                        pass
            return 0.0

        return {
            'gross_salary': get_amount('elm:GrossSalary', 'GrossSalary', 'elm:TotalGross', 'TotalGross'),
            'net_salary': get_amount('elm:NetSalary', 'NetSalary', 'elm:NetPay', 'NetPay'),
            'bonuses': get_amount('elm:Bonuses', 'Bonuses', 'elm:BonusPayments', 'BonusPayments'),
            'overtime_pay': get_amount('elm:OvertimePay', 'OvertimePay'),
            'expenses_allowance': get_amount('elm:ExpensesAllowance', 'ExpensesAllowance'),
            'car_allowance': get_amount('elm:CarAllowance', 'CarAllowance'),
            'other_allowances': get_amount('elm:OtherAllowances', 'OtherAllowances'),

            # Taxable amounts
            'taxable_salary': get_amount('elm:TaxableSalary', 'TaxableSalary', 'elm:TaxableIncome', 'TaxableIncome'),
        }

    def _parse_deductions(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse deductions from XML."""
        def get_amount(*paths):
            for path in paths:
                found = elem.find(path, ns)
                if found is not None and found.text:
                    try:
                        return float(found.text)
                    except ValueError:
                        pass
                simple_path = path.split(':')[-1]
                found = elem.find(simple_path)
                if found is not None and found.text:
                    try:
                        return float(found.text)
                    except ValueError:
                        pass
            return 0.0

        return {
            'professional_expenses': get_amount('elm:ProfessionalExpenses', 'ProfessionalExpenses'),
            'meal_deductions': get_amount('elm:MealDeductions', 'MealDeductions'),
            'transport_deductions': get_amount('elm:TransportDeductions', 'TransportDeductions'),
        }

    def _parse_social_security(self, elem: ET.Element, ns: dict) -> Dict[str, Any]:
        """Parse social security contributions from XML."""
        def get_amount(*paths):
            for path in paths:
                found = elem.find(path, ns)
                if found is not None and found.text:
                    try:
                        return float(found.text)
                    except ValueError:
                        pass
                simple_path = path.split(':')[-1]
                found = elem.find(simple_path)
                if found is not None and found.text:
                    try:
                        return float(found.text)
                    except ValueError:
                        pass
            return 0.0

        return {
            'ahv_contribution': get_amount('elm:AHV', 'AHV', 'elm:AVS', 'AVS'),
            'alv_contribution': get_amount('elm:ALV', 'ALV', 'elm:AC', 'AC'),
            'pension_contribution': get_amount('elm:Pension', 'Pension', 'elm:BVG', 'BVG'),
            'accident_insurance': get_amount('elm:AccidentInsurance', 'AccidentInsurance', 'elm:UVG', 'UVG'),
            'total_contributions': get_amount('elm:TotalContributions', 'TotalContributions'),
        }

    def map_to_tax_profile(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map parsed Swissdec data to tax profile fields.

        Args:
            parsed_data: Data from _parse_elm_xml()

        Returns:
            Dict with tax profile field mappings
        """
        profile_data = {}

        # Employee personal information
        if 'employee' in parsed_data:
            employee = parsed_data['employee']
            profile_data['ahv_number'] = employee.get('ssn')
            profile_data['first_name'] = employee.get('first_name')
            profile_data['last_name'] = employee.get('last_name')
            profile_data['date_of_birth'] = employee.get('date_of_birth')
            profile_data['marital_status'] = employee.get('marital_status')

            if 'address' in employee:
                addr = employee['address']
                profile_data['street'] = addr.get('street')
                profile_data['postal_code'] = addr.get('postal_code')
                profile_data['city'] = addr.get('city')

        # Employer information
        if 'employer' in parsed_data:
            employer = parsed_data['employer']
            profile_data['employer_name'] = employer.get('name')
            profile_data['employer_uid'] = employer.get('uid')

        # Salary and income
        if 'salary' in parsed_data:
            salary = parsed_data['salary']
            profile_data['gross_salary'] = salary.get('gross_salary')
            profile_data['net_salary'] = salary.get('net_salary')
            profile_data['taxable_salary'] = salary.get('taxable_salary')
            profile_data['bonuses'] = salary.get('bonuses')
            profile_data['expenses_allowance'] = salary.get('expenses_allowance')
            profile_data['car_allowance'] = salary.get('car_allowance')

            # For tax filing, use taxable_salary as employment income
            profile_data['employment_income'] = salary.get('taxable_salary') or salary.get('gross_salary')

        # Social security contributions (potential deductions)
        if 'social_security' in parsed_data:
            social_sec = parsed_data['social_security']
            profile_data['ahv_contribution'] = social_sec.get('ahv_contribution')
            profile_data['pension_contribution'] = social_sec.get('pension_contribution')
            profile_data['accident_insurance'] = social_sec.get('accident_insurance')

        # Deductions
        if 'deductions' in parsed_data:
            deductions = parsed_data['deductions']
            profile_data['professional_expenses'] = deductions.get('professional_expenses')

        # Metadata
        profile_data['import_source'] = 'Swissdec-ELM'
        profile_data['import_tax_year'] = parsed_data.get('tax_year')

        return profile_data

    def validate(self, xml_string: str) -> bool:
        """
        Validate if XML conforms to Swissdec ELM standard.

        Args:
            xml_string: XML string to validate

        Returns:
            True if valid, False otherwise
        """
        try:
            root = ET.fromstring(xml_string)

            # Check for Swissdec-specific elements
            if 'SalaryDeclaration' not in root.tag and 'Salary' not in root.tag:
                logger.error("Root element is not SalaryDeclaration or Salary")
                return False

            # Define namespace
            ns = {'elm': 'http://www.swissdec.ch/schema/elm/5.0'}

            # Check for key elements (flexible for different versions)
            has_employer = root.find('.//elm:Employer', ns) is not None or root.find('.//Employer') is not None
            has_employee = root.find('.//elm:Employee', ns) is not None or root.find('.//Employee') is not None
            has_salary = root.find('.//elm:Salary', ns) is not None or root.find('.//Salary') is not None

            if not (has_employer or has_employee or has_salary):
                logger.error("Missing critical Swissdec elements (Employer, Employee, or Salary)")
                return False

            logger.info("Swissdec ELM validation passed")
            return True

        except ET.ParseError as e:
            logger.error(f"XML parsing error during validation: {e}")
            return False
