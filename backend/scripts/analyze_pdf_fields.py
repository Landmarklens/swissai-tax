#!/usr/bin/env python3
"""
PDF Form Field Analysis Script

Analyzes fillable fields in canton PDF forms and generates field mapping data.
This helps understand the structure of official canton forms before implementing
the PDF filler.

Usage:
    python analyze_pdf_fields.py --canton ZH
    python analyze_pdf_fields.py --canton ZH --language de
    python analyze_pdf_fields.py --all
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from data.canton_form_metadata import (
    get_canton_form_metadata,
    list_all_cantons
)

try:
    from pypdf import PdfReader
except ImportError:
    logger = logging.getLogger(__name__)
    logger.error("pypdf not installed. Run: pip install pypdf")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PDFFieldAnalyzer:
    """Analyzes fillable fields in PDF forms"""

    def __init__(self, forms_dir: str = None):
        if forms_dir is None:
            forms_dir = Path(__file__).parent.parent / 'data' / 'canton_forms'
        self.forms_dir = Path(forms_dir)

    def analyze_pdf_fields(
        self,
        pdf_path: Path
    ) -> Dict[str, Any]:
        """
        Extract and analyze all fillable fields from a PDF.

        Args:
            pdf_path: Path to PDF file

        Returns:
            Dict with field analysis
        """
        if not pdf_path.exists():
            logger.error(f"PDF not found: {pdf_path}")
            return None

        try:
            reader = PdfReader(str(pdf_path))

            # Get form fields
            fields = {}
            if reader.get_fields():
                for field_name, field_obj in reader.get_fields().items():
                    fields[field_name] = self._analyze_field(field_name, field_obj)

            analysis = {
                'pdf_path': str(pdf_path),
                'total_pages': len(reader.pages),
                'total_fields': len(fields),
                'is_fillable': len(fields) > 0,
                'fields': fields,
                'field_summary': self._summarize_fields(fields)
            }

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing PDF {pdf_path}: {e}")
            return None

    def _analyze_field(self, field_name: str, field_obj: Any) -> Dict[str, Any]:
        """
        Analyze a single form field.

        Args:
            field_name: Field name
            field_obj: Field object from pypdf

        Returns:
            Field analysis dict
        """
        field_info = {
            'name': field_name,
            'type': self._get_field_type(field_obj),
            'value': field_obj.get('/V', ''),
            'default_value': field_obj.get('/DV', ''),
            'flags': field_obj.get('/Ff', 0),
            'max_length': field_obj.get('/MaxLen', None),
            'options': field_obj.get('/Opt', []),
        }

        # Determine if required
        flags = field_info['flags']
        field_info['required'] = bool(flags & 2)  # Bit 1 = Required
        field_info['read_only'] = bool(flags & 1)  # Bit 0 = ReadOnly
        field_info['multiline'] = bool(flags & 4096)  # Bit 12 = Multiline

        return field_info

    def _get_field_type(self, field_obj: Any) -> str:
        """
        Determine field type from PDF field object.

        Args:
            field_obj: Field object

        Returns:
            Field type string
        """
        field_type = field_obj.get('/FT', '')

        type_mapping = {
            '/Tx': 'text',
            '/Btn': 'button',
            '/Ch': 'choice',
            '/Sig': 'signature'
        }

        return type_mapping.get(field_type, 'unknown')

    def _summarize_fields(self, fields: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create summary statistics of fields.

        Args:
            fields: Dict of field analyses

        Returns:
            Summary dict
        """
        if not fields:
            return {}

        type_counts = {}
        required_count = 0
        read_only_count = 0

        for field_info in fields.values():
            # Count by type
            field_type = field_info['type']
            type_counts[field_type] = type_counts.get(field_type, 0) + 1

            # Count required/read-only
            if field_info.get('required'):
                required_count += 1
            if field_info.get('read_only'):
                read_only_count += 1

        return {
            'total_fields': len(fields),
            'by_type': type_counts,
            'required_fields': required_count,
            'read_only_fields': read_only_count,
        }

    def analyze_canton(
        self,
        canton_code: str,
        language: str = 'de',
        tax_year: int = 2024
    ) -> Dict[str, Any]:
        """
        Analyze canton form and save analysis.

        Args:
            canton_code: Canton code
            language: Form language
            tax_year: Tax year

        Returns:
            Analysis dict
        """
        metadata = get_canton_form_metadata(canton_code)
        if not metadata:
            logger.error(f"Canton {canton_code} not found")
            return None

        # Find PDF file
        canton_dir = self.forms_dir / canton_code
        pdf_filename = f"{canton_code}_{tax_year}_{language}.pdf"
        pdf_path = canton_dir / pdf_filename

        if not pdf_path.exists():
            logger.error(f"PDF not found: {pdf_path}")
            logger.info(f"Run download_canton_forms.py first to download forms")
            return None

        logger.info(f"Analyzing {canton_code} form ({language})...")

        # Analyze PDF
        analysis = self.analyze_pdf_fields(pdf_path)

        if analysis:
            # Save analysis to JSON
            output_file = canton_dir / f'field_analysis_{language}.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(analysis, f, indent=2, ensure_ascii=False)

            logger.info(f"✓ Analysis saved to {output_file}")
            logger.info(f"  Total fields: {analysis['total_fields']}")
            logger.info(f"  Field types: {analysis['field_summary'].get('by_type', {})}")

        return analysis

    def analyze_all_cantons(
        self,
        language: str = 'de',
        tax_year: int = 2024
    ) -> Dict[str, Any]:
        """
        Analyze all canton forms.

        Args:
            language: Form language
            tax_year: Tax year

        Returns:
            Summary of all analyses
        """
        cantons = list_all_cantons()
        summary = {
            'total_cantons': len(cantons),
            'analyzed': 0,
            'failed': 0,
            'results': []
        }

        logger.info(f"Analyzing forms for {len(cantons)} cantons...")

        for canton_code in cantons:
            try:
                analysis = self.analyze_canton(canton_code, language, tax_year)
                if analysis:
                    summary['analyzed'] += 1
                    summary['results'].append({
                        'canton': canton_code,
                        'success': True,
                        'fields': analysis['total_fields'],
                        'fillable': analysis['is_fillable']
                    })
                else:
                    summary['failed'] += 1
                    summary['results'].append({
                        'canton': canton_code,
                        'success': False,
                        'error': 'Analysis failed'
                    })
            except Exception as e:
                logger.error(f"Error analyzing {canton_code}: {e}")
                summary['failed'] += 1
                summary['results'].append({
                    'canton': canton_code,
                    'success': False,
                    'error': str(e)
                })

        logger.info(f"\n{'='*60}")
        logger.info(f"Analysis Summary:")
        logger.info(f"  Total cantons: {summary['total_cantons']}")
        logger.info(f"  Analyzed: {summary['analyzed']}")
        logger.info(f"  Failed: {summary['failed']}")
        logger.info(f"{'='*60}")

        return summary

    def generate_field_mapping_template(
        self,
        canton_code: str,
        language: str = 'de'
    ) -> str:
        """
        Generate Python code template for field mapping.

        Args:
            canton_code: Canton code
            language: Form language

        Returns:
            Python code string
        """
        canton_dir = self.forms_dir / canton_code
        analysis_file = canton_dir / f'field_analysis_{language}.json'

        if not analysis_file.exists():
            logger.error(f"Analysis file not found: {analysis_file}")
            return None

        with open(analysis_file, 'r', encoding='utf-8') as f:
            analysis = json.load(f)

        fields = analysis.get('fields', {})

        # Generate mapping template
        code = f"# {canton_code} Field Mapping Template\n"
        code += f"# Generated from PDF field analysis\n"
        code += f"# Total fields: {len(fields)}\n\n"

        code += f"{canton_code}_MAPPING = {{\n"

        for field_name in sorted(fields.keys()):
            field_info = fields[field_name]
            code += f"    # {field_info['type']}"
            if field_info.get('required'):
                code += " (required)"
            code += f"\n    'internal_field_name': '{field_name}',\n"

        code += "}\n"

        return code


def main():
    parser = argparse.ArgumentParser(
        description='Analyze PDF form fields in canton tax forms'
    )
    parser.add_argument(
        '--canton',
        type=str,
        help='Canton code (e.g., ZH)'
    )
    parser.add_argument(
        '--language',
        type=str,
        default='de',
        help='Form language (default: de)'
    )
    parser.add_argument(
        '--year',
        type=int,
        default=2024,
        help='Tax year (default: 2024)'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Analyze all cantons'
    )
    parser.add_argument(
        '--generate-template',
        action='store_true',
        help='Generate field mapping template code'
    )

    args = parser.parse_args()

    analyzer = PDFFieldAnalyzer()

    if args.all:
        summary = analyzer.analyze_all_cantons(args.language, args.year)
        if summary['failed'] > 0:
            sys.exit(1)

    elif args.canton:
        analysis = analyzer.analyze_canton(
            args.canton.upper(),
            args.language,
            args.year
        )

        if not analysis:
            sys.exit(1)

        # Generate template if requested
        if args.generate_template:
            template = analyzer.generate_field_mapping_template(
                args.canton.upper(),
                args.language
            )
            if template:
                print("\n" + "="*60)
                print("Field Mapping Template:")
                print("="*60)
                print(template)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
