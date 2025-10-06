"""
Traditional PDF Form Filler

This service fills official canton tax forms with user data. It uses the canton
form mappings to populate the correct fields in each canton's official PDF.

This is the second PDF generation method (alongside eCH-0196). Users receive:
1. eCH-0196 PDF (modern, machine-readable with barcode)
2. Traditional Canton PDF (official form, pre-filled)

Both PDFs contain the same data but in different formats.
"""

import logging
import io
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    raise ImportError("pypdf not installed. Run: pip install pypdf")

from data.canton_form_mappings import (
    get_canton_mapping,
    map_filing_data_to_canton_form,
    get_field_type,
    FormFieldType
)
from data.canton_form_metadata import (
    get_canton_form_metadata
)

logger = logging.getLogger(__name__)


class TraditionalPDFFillerError(Exception):
    """Base exception for PDF filler errors"""
    pass


class FormTemplateNotFoundError(TraditionalPDFFillerError):
    """Raised when canton form template not found"""
    pass


class FieldMappingError(TraditionalPDFFillerError):
    """Raised when field mapping fails"""
    pass


class TraditionalPDFFiller:
    """
    Fills official canton PDF forms with tax data.

    Usage:
        filler = TraditionalPDFFiller()
        pdf_buffer = filler.fill_canton_form(filing_id, language='de')
    """

    def __init__(self, forms_dir: str = None):
        """
        Initialize PDF filler.

        Args:
            forms_dir: Directory containing canton PDF forms
        """
        if forms_dir is None:
            forms_dir = Path(__file__).parent.parent.parent / 'data' / 'canton_forms'
        self.forms_dir = Path(forms_dir)

    def fill_canton_form(
        self,
        filing_id: str,
        language: str = 'de',
        db = None
    ) -> io.BytesIO:
        """
        Fill canton form with filing data.

        Args:
            filing_id: Tax filing session ID
            language: Form language ('de', 'fr', 'it', 'en')
            db: Database session (optional)

        Returns:
            BytesIO buffer with filled PDF

        Raises:
            FormTemplateNotFoundError: If form template not found
            FieldMappingError: If field mapping fails
        """
        # Import here to avoid circular imports
        from services.filing_orchestration_service import FilingOrchestrationService
        from services.enhanced_tax_calculation_service import EnhancedTaxCalculationService

        filing_service = FilingOrchestrationService(db=db)
        tax_service = EnhancedTaxCalculationService(db=db)

        # Get filing data
        filing = filing_service.get_filing(filing_id)
        if not filing:
            raise ValueError(f"Filing {filing_id} not found")

        # Get tax calculation
        calculation = tax_service.calculate_single_filing(filing)

        # Get canton form template
        template_path = self._get_form_template_path(
            filing.canton,
            language,
            filing.tax_year
        )

        if not template_path.exists():
            raise FormTemplateNotFoundError(
                f"Form template not found: {template_path}. "
                f"Run download_canton_forms.py to download official forms."
            )

        # Map data to canton form fields
        filing_dict = filing.to_dict()
        mapped_data = map_filing_data_to_canton_form(
            filing_dict,
            calculation,
            filing.canton
        )

        if not mapped_data:
            raise FieldMappingError(
                f"No field mapping available for canton {filing.canton}"
            )

        # Fill PDF form
        pdf_buffer = self._fill_pdf_fields(
            template_path,
            mapped_data,
            filing.canton
        )

        logger.info(
            f"Filled {filing.canton} form for filing {filing_id} "
            f"({len(mapped_data)} fields)"
        )

        return pdf_buffer

    def _get_form_template_path(
        self,
        canton: str,
        language: str,
        tax_year: int
    ) -> Path:
        """
        Get path to canton form template.

        Args:
            canton: Canton code
            language: Language code
            tax_year: Tax year

        Returns:
            Path to PDF template
        """
        canton_dir = self.forms_dir / canton
        filename = f"{canton}_{tax_year}_{language}.pdf"
        return canton_dir / filename

    def _fill_pdf_fields(
        self,
        template_path: Path,
        field_data: Dict[str, Any],
        canton: str
    ) -> io.BytesIO:
        """
        Fill PDF form fields with data.

        Args:
            template_path: Path to PDF template
            field_data: Dict mapping field names to values
            canton: Canton code

        Returns:
            BytesIO buffer with filled PDF
        """
        try:
            # Read template PDF
            reader = PdfReader(str(template_path))
            writer = PdfWriter()

            # Clone all pages
            for page in reader.pages:
                writer.add_page(page)

            # Get form fields
            if reader.get_fields() is None:
                logger.warning(f"PDF {template_path} has no fillable fields")
                # Return original PDF if no fields
                with open(template_path, 'rb') as f:
                    return io.BytesIO(f.read())

            # Fill fields
            filled_count = 0
            for field_name, value in field_data.items():
                try:
                    # Format value based on field type
                    formatted_value = self._format_field_value(
                        value,
                        self._get_field_type_from_name(field_name)
                    )

                    # Update field
                    writer.update_page_form_field_values(
                        writer.pages[0],  # Most forms have fields on first page
                        {field_name: formatted_value}
                    )

                    filled_count += 1

                except Exception as e:
                    logger.warning(
                        f"Failed to fill field {field_name} in {canton}: {e}"
                    )

            logger.info(f"Filled {filled_count}/{len(field_data)} fields")

            # Write to buffer
            pdf_buffer = io.BytesIO()
            writer.write(pdf_buffer)
            pdf_buffer.seek(0)

            return pdf_buffer

        except Exception as e:
            logger.error(f"Error filling PDF {template_path}: {e}")
            raise FieldMappingError(f"Failed to fill PDF: {e}")

    def _format_field_value(
        self,
        value: Any,
        field_type: FormFieldType
    ) -> str:
        """
        Format value for PDF field based on field type.

        Args:
            value: Raw value
            field_type: Field type

        Returns:
            Formatted string value
        """
        if value is None or value == '':
            return ''

        if field_type == FormFieldType.CURRENCY:
            # Format as Swiss currency
            try:
                amount = float(value)
                return f"{amount:,.2f}".replace(',', "'")  # Swiss thousands separator
            except (ValueError, TypeError):
                return str(value)

        elif field_type == FormFieldType.NUMBER:
            # Format as number
            try:
                num = int(value)
                return str(num)
            except (ValueError, TypeError):
                return str(value)

        elif field_type == FormFieldType.DATE:
            # Format as date (DD.MM.YYYY Swiss format)
            if isinstance(value, datetime):
                return value.strftime('%d.%m.%Y')
            elif isinstance(value, str):
                # Try to parse and reformat
                try:
                    dt = datetime.fromisoformat(value)
                    return dt.strftime('%d.%m.%Y')
                except:
                    return value
            return str(value)

        elif field_type == FormFieldType.CHECKBOX:
            # Convert to checkbox value
            if isinstance(value, bool):
                return 'Yes' if value else 'No'
            elif str(value).lower() in ('yes', 'true', '1', 'ja', 'oui', 'si'):
                return 'Yes'
            else:
                return 'No'

        else:
            # TEXT or unknown - just convert to string
            return str(value)

    def _get_field_type_from_name(self, field_name: str) -> FormFieldType:
        """
        Infer field type from field name.

        Args:
            field_name: Field name

        Returns:
            FormFieldType
        """
        # Try to get from mapping
        # In practice, we'd need to reverse-lookup the internal field name
        # For now, use simple heuristics

        field_lower = field_name.lower()

        if any(keyword in field_lower for keyword in [
            'betrag', 'amount', 'einkommen', 'income', 'revenus',
            'abzug', 'deduction', 'vermoegen', 'fortune',
            'steuer', 'tax', 'impot', 'chf'
        ]):
            return FormFieldType.CURRENCY

        elif any(keyword in field_lower for keyword in [
            'anzahl', 'number', 'nombre', 'kinder', 'children', 'enfants'
        ]):
            return FormFieldType.NUMBER

        elif any(keyword in field_lower for keyword in [
            'datum', 'date', 'geburtsdatum', 'birthdate', 'naissance'
        ]):
            return FormFieldType.DATE

        elif any(keyword in field_lower for keyword in [
            'checkbox', 'check', 'ja_nein', 'yes_no', 'oui_non'
        ]):
            return FormFieldType.CHECKBOX

        else:
            return FormFieldType.TEXT

    def fill_all_user_forms(
        self,
        user_id: str,
        tax_year: int,
        language: str = 'de',
        db = None
    ) -> Dict[str, io.BytesIO]:
        """
        Fill forms for all user filings (primary + secondaries).

        Args:
            user_id: User ID
            tax_year: Tax year
            language: Form language
            db: Database session

        Returns:
            Dict mapping filing_id to PDF buffer
        """
        from services.filing_orchestration_service import FilingOrchestrationService

        filing_service = FilingOrchestrationService(db=db)

        # Get all filings
        filings = filing_service.get_all_user_filings(user_id, tax_year)

        results = {}
        for filing in filings:
            try:
                pdf_buffer = self.fill_canton_form(
                    filing.id,
                    language,
                    db
                )
                results[filing.id] = pdf_buffer
                logger.info(f"✓ Filled form for {filing.canton}")

            except Exception as e:
                logger.error(f"✗ Failed to fill form for {filing.canton}: {e}")
                results[filing.id] = None

        return results

    def preview_field_mapping(
        self,
        canton: str,
        filing_data: Dict[str, Any],
        calculation_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Preview how data will be mapped to canton form fields.

        Useful for debugging field mappings.

        Args:
            canton: Canton code
            filing_data: Filing session data
            calculation_data: Tax calculation data

        Returns:
            Dict with mapping preview
        """
        mapping = get_canton_mapping(canton)
        if not mapping:
            return {
                'error': f'No mapping found for canton {canton}'
            }

        mapped_data = map_filing_data_to_canton_form(
            filing_data,
            calculation_data,
            canton
        )

        return {
            'canton': canton,
            'form_name': mapping.form_name,
            'total_fields': len(mapping.field_mappings),
            'mapped_fields': len(mapped_data) if mapped_data else 0,
            'field_mapping': mapped_data,
            'unmapped_fields': [
                field for field in mapping.field_mappings.keys()
                if field not in (filing_data.get('profile', {}) or {})
            ]
        }

    def validate_form_template(
        self,
        canton: str,
        language: str = 'de',
        tax_year: int = 2024
    ) -> Dict[str, Any]:
        """
        Validate that form template exists and is fillable.

        Args:
            canton: Canton code
            language: Language code
            tax_year: Tax year

        Returns:
            Validation report
        """
        template_path = self._get_form_template_path(canton, language, tax_year)

        report = {
            'canton': canton,
            'language': language,
            'tax_year': tax_year,
            'template_path': str(template_path),
            'exists': template_path.exists(),
            'is_fillable': False,
            'total_fields': 0,
            'field_names': []
        }

        if not template_path.exists():
            report['error'] = 'Template file not found'
            return report

        try:
            reader = PdfReader(str(template_path))
            fields = reader.get_fields()

            if fields:
                report['is_fillable'] = True
                report['total_fields'] = len(fields)
                report['field_names'] = list(fields.keys())
            else:
                report['error'] = 'PDF has no fillable fields'

        except Exception as e:
            report['error'] = f'Failed to read PDF: {e}'

        return report


def main():
    """Command-line interface for testing"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Fill Swiss canton tax forms'
    )
    parser.add_argument(
        '--filing-id',
        required=True,
        help='Filing ID to fill'
    )
    parser.add_argument(
        '--language',
        default='de',
        help='Form language (default: de)'
    )
    parser.add_argument(
        '--output',
        help='Output PDF file path'
    )
    parser.add_argument(
        '--validate',
        action='store_true',
        help='Validate form template only'
    )

    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    filler = TraditionalPDFFiller()

    if args.validate:
        # Get filing to determine canton
        from services.filing_orchestration_service import FilingOrchestrationService
        filing_service = FilingOrchestrationService()
        filing = filing_service.get_filing(args.filing_id)

        if filing:
            report = filler.validate_form_template(
                filing.canton,
                args.language,
                filing.tax_year
            )
            print(f"\nValidation Report:")
            print(f"  Canton: {report['canton']}")
            print(f"  Template exists: {report['exists']}")
            print(f"  Is fillable: {report['is_fillable']}")
            print(f"  Total fields: {report['total_fields']}")

            if 'error' in report:
                print(f"  Error: {report['error']}")
    else:
        # Fill form
        try:
            pdf_buffer = filler.fill_canton_form(
                args.filing_id,
                args.language
            )

            # Save to file
            output_path = args.output or f'filled_form_{args.filing_id}.pdf'
            with open(output_path, 'wb') as f:
                f.write(pdf_buffer.getvalue())

            print(f"✓ Form filled successfully: {output_path}")

        except Exception as e:
            print(f"✗ Error filling form: {e}")
            raise


if __name__ == '__main__':
    main()
