"""
Unified PDF Generator

This service provides a unified interface for generating both types of tax PDFs:
1. eCH-0196 PDF (modern, machine-readable with barcode)
2. Traditional Canton Form PDF (official form, pre-filled)

Users can download both PDFs or choose their preferred format.
"""

import io
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from .ech0196_pdf_generator import ECH0196PDFGenerator
from .traditional_pdf_filler import TraditionalPDFFiller

logger = logging.getLogger(__name__)


class PDFGenerationError(Exception):
    """Base exception for PDF generation errors"""
    pass


class UnifiedPDFGenerator:
    """
    Unified PDF generator supporting both eCH-0196 and traditional canton forms.

    Usage:
        generator = UnifiedPDFGenerator()

        # Generate both PDFs
        pdfs = generator.generate_all_pdfs(filing_id, language='de')

        # Generate only eCH-0196
        ech_pdf = generator.generate_ech0196_pdf(filing_id, language='de')

        # Generate only traditional form
        trad_pdf = generator.generate_traditional_pdf(filing_id, language='de')
    """

    def __init__(self, forms_dir: str = None):
        """
        Initialize unified generator.

        Args:
            forms_dir: Directory containing canton form templates
        """
        self.ech_generator = ECH0196PDFGenerator()
        self.traditional_filler = TraditionalPDFFiller(forms_dir=forms_dir)

    def generate_all_pdfs(
        self,
        filing_id: str,
        language: str = 'de',
        db = None
    ) -> Dict[str, io.BytesIO]:
        """
        Generate both PDF types for a filing.

        Args:
            filing_id: Tax filing session ID
            language: PDF language
            db: Database session (optional)

        Returns:
            Dict with 'ech0196' and 'traditional' PDF buffers
        """
        results = {}

        # Generate eCH-0196 PDF
        try:
            ech_pdf = self.ech_generator.generate(filing_id, language, db)
            results['ech0196'] = ech_pdf
            logger.info(f"✓ Generated eCH-0196 PDF for filing {filing_id}")
        except Exception as e:
            logger.error(f"✗ Failed to generate eCH-0196 PDF: {e}")
            results['ech0196'] = None
            results['ech0196_error'] = str(e)

        # Generate traditional canton form
        try:
            trad_pdf = self.traditional_filler.fill_canton_form(
                filing_id,
                language,
                db
            )
            results['traditional'] = trad_pdf
            logger.info(f"✓ Generated traditional PDF for filing {filing_id}")
        except Exception as e:
            logger.error(f"✗ Failed to generate traditional PDF: {e}")
            results['traditional'] = None
            results['traditional_error'] = str(e)

        return results

    def generate_ech0196_pdf(
        self,
        filing_id: str,
        language: str = 'de',
        db = None
    ) -> io.BytesIO:
        """
        Generate eCH-0196 PDF only.

        Args:
            filing_id: Filing ID
            language: Language
            db: Database session

        Returns:
            PDF buffer
        """
        return self.ech_generator.generate(filing_id, language, db)

    def generate_traditional_pdf(
        self,
        filing_id: str,
        language: str = 'de',
        db = None
    ) -> io.BytesIO:
        """
        Generate traditional canton form PDF only.

        Args:
            filing_id: Filing ID
            language: Language
            db: Database session

        Returns:
            PDF buffer
        """
        return self.traditional_filler.fill_canton_form(filing_id, language, db)

    def generate_all_user_pdfs(
        self,
        user_id: str,
        tax_year: int,
        language: str = 'de',
        pdf_type: str = 'both',
        db = None
    ) -> Dict[str, Dict[str, io.BytesIO]]:
        """
        Generate PDFs for all user filings (primary + secondaries).

        Args:
            user_id: User ID
            tax_year: Tax year
            language: PDF language
            pdf_type: 'both', 'ech0196', or 'traditional'
            db: Database session

        Returns:
            Dict mapping filing_id to PDF buffers:
            {
                'filing_123': {
                    'ech0196': BytesIO(...),
                    'traditional': BytesIO(...)
                },
                ...
            }
        """
        from services.filing_orchestration_service import \
            FilingOrchestrationService

        filing_service = FilingOrchestrationService(db=db)

        # Get all filings
        filings = filing_service.get_all_user_filings(user_id, tax_year)

        if not filings:
            raise ValueError(f"No filings found for user {user_id}, tax year {tax_year}")

        results = {}

        for filing in filings:
            filing_id = filing.id
            filing_pdfs = {}

            logger.info(
                f"Generating PDFs for {filing.canton} "
                f"({'primary' if filing.is_primary else 'secondary'})"
            )

            # Generate requested PDF types
            if pdf_type in ('both', 'ech0196'):
                try:
                    ech_pdf = self.generate_ech0196_pdf(filing_id, language, db)
                    filing_pdfs['ech0196'] = ech_pdf
                except Exception as e:
                    logger.error(f"Failed to generate eCH-0196 for {filing.canton}: {e}")
                    filing_pdfs['ech0196'] = None
                    filing_pdfs['ech0196_error'] = str(e)

            if pdf_type in ('both', 'traditional'):
                try:
                    trad_pdf = self.generate_traditional_pdf(filing_id, language, db)
                    filing_pdfs['traditional'] = trad_pdf
                except Exception as e:
                    logger.error(f"Failed to generate traditional for {filing.canton}: {e}")
                    filing_pdfs['traditional'] = None
                    filing_pdfs['traditional_error'] = str(e)

            results[filing_id] = filing_pdfs

        return results

    def save_pdfs_to_disk(
        self,
        filing_id: str,
        output_dir: str,
        language: str = 'de',
        pdf_type: str = 'both',
        db = None
    ) -> Dict[str, str]:
        """
        Generate and save PDFs to disk.

        Args:
            filing_id: Filing ID
            output_dir: Output directory
            language: Language
            pdf_type: 'both', 'ech0196', or 'traditional'
            db: Database session

        Returns:
            Dict mapping PDF type to file path
        """
        from services.filing_orchestration_service import \
            FilingOrchestrationService

        filing_service = FilingOrchestrationService(db=db)
        filing = filing_service.get_filing(filing_id)

        if not filing:
            raise ValueError(f"Filing {filing_id} not found")

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        saved_files = {}

        # Filename base
        filing_type = 'primary' if filing.is_primary else 'secondary'
        base_name = f"tax_return_{filing.canton}_{filing.tax_year}_{filing_type}"

        # Generate and save requested types
        if pdf_type in ('both', 'ech0196'):
            try:
                ech_pdf = self.generate_ech0196_pdf(filing_id, language, db)
                ech_path = output_path / f"{base_name}_ech0196.pdf"

                with open(ech_path, 'wb') as f:
                    f.write(ech_pdf.getvalue())

                saved_files['ech0196'] = str(ech_path)
                logger.info(f"✓ Saved eCH-0196 PDF: {ech_path}")

            except Exception as e:
                logger.error(f"✗ Failed to save eCH-0196 PDF: {e}")
                saved_files['ech0196_error'] = str(e)

        if pdf_type in ('both', 'traditional'):
            try:
                trad_pdf = self.generate_traditional_pdf(filing_id, language, db)
                trad_path = output_path / f"{base_name}_official.pdf"

                with open(trad_path, 'wb') as f:
                    f.write(trad_pdf.getvalue())

                saved_files['traditional'] = str(trad_path)
                logger.info(f"✓ Saved traditional PDF: {trad_path}")

            except Exception as e:
                logger.error(f"✗ Failed to save traditional PDF: {e}")
                saved_files['traditional_error'] = str(e)

        return saved_files

    def get_pdf_info(
        self,
        filing_id: str,
        db = None
    ) -> Dict[str, Any]:
        """
        Get information about PDFs that would be generated.

        Args:
            filing_id: Filing ID
            db: Database session

        Returns:
            Dict with PDF generation info
        """
        from data.canton_form_metadata import get_canton_form_metadata
        from services.filing_orchestration_service import \
            FilingOrchestrationService

        filing_service = FilingOrchestrationService(db=db)
        filing = filing_service.get_filing(filing_id)

        if not filing:
            raise ValueError(f"Filing {filing_id} not found")

        canton_metadata = get_canton_form_metadata(filing.canton)

        info = {
            'filing_id': filing_id,
            'canton': filing.canton,
            'tax_year': filing.tax_year,
            'is_primary': filing.is_primary,
            'available_pdfs': {
                'ech0196': {
                    'available': True,
                    'format': 'Modern machine-readable PDF with Data Matrix barcode',
                    'pages': 8,
                    'accepted_by': 'All 26 Swiss cantons',
                    'processing_speed': 'Fast (automated scanning)'
                },
                'traditional': {
                    'available': True,
                    'format': f'Official {filing.canton} canton form',
                    'pages': canton_metadata.total_pages if canton_metadata else 'Unknown',
                    'fields': canton_metadata.total_fields if canton_metadata else 'Unknown',
                    'accepted_by': f'{filing.canton} canton tax authority',
                    'processing_speed': 'Standard (manual processing)'
                }
            },
            'languages': [],
            'canton_info': {}
        }

        if canton_metadata:
            info['languages'] = [lang.value for lang in canton_metadata.languages]
            info['canton_info'] = {
                'form_name': canton_metadata.form_name,
                'complexity': canton_metadata.complexity.value,
                'electronic_submission': canton_metadata.supports_electronic_submission,
                'deadline': canton_metadata.deadline_date
            }

        return info


def main():
    """Command-line interface"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate Swiss tax return PDFs'
    )
    parser.add_argument(
        '--filing-id',
        required=True,
        help='Filing ID'
    )
    parser.add_argument(
        '--language',
        default='de',
        help='Language (de, fr, it, en)'
    )
    parser.add_argument(
        '--type',
        choices=['both', 'ech0196', 'traditional'],
        default='both',
        help='PDF type to generate'
    )
    parser.add_argument(
        '--output-dir',
        default='.',
        help='Output directory'
    )
    parser.add_argument(
        '--info',
        action='store_true',
        help='Show PDF info instead of generating'
    )

    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    generator = UnifiedPDFGenerator()

    if args.info:
        # Show info
        info = generator.get_pdf_info(args.filing_id)

        print(f"\nPDF Generation Info:")
        print(f"  Filing ID: {info['filing_id']}")
        print(f"  Canton: {info['canton']}")
        print(f"  Tax Year: {info['tax_year']}")
        print(f"  Type: {'Primary' if info['is_primary'] else 'Secondary'}")

        print(f"\n  Available PDF Formats:")
        for pdf_type, details in info['available_pdfs'].items():
            print(f"\n    {pdf_type.upper()}:")
            for key, value in details.items():
                print(f"      {key}: {value}")

        if info['canton_info']:
            print(f"\n  Canton Info:")
            for key, value in info['canton_info'].items():
                print(f"    {key}: {value}")

    else:
        # Generate PDFs
        try:
            saved_files = generator.save_pdfs_to_disk(
                args.filing_id,
                args.output_dir,
                args.language,
                args.type
            )

            print(f"\n✓ PDF Generation Complete:")
            for pdf_type, path in saved_files.items():
                if not pdf_type.endswith('_error'):
                    print(f"  {pdf_type}: {path}")

            # Show errors if any
            errors = {k: v for k, v in saved_files.items() if k.endswith('_error')}
            if errors:
                print(f"\n✗ Errors:")
                for error_type, error_msg in errors.items():
                    print(f"  {error_type}: {error_msg}")

        except Exception as e:
            print(f"\n✗ Error: {e}")
            raise


if __name__ == '__main__':
    main()
