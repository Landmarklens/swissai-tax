"""PDF Generation Service for Swiss Tax Declarations"""

import io
import json
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import black, blue, red
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from PyPDF2 import PdfWriter, PdfReader
import pdfplumber

from sqlalchemy.orm import Session
from ..models.swisstax.ai_extraction import (
    TaxProfile,
    CantonFormMapping,
    ExtractionSession
)
from ..models.document import Document
from ..utils.logger import get_logger

logger = get_logger(__name__)


class PDFGenerationService:
    """Service for generating Swiss tax declaration PDFs"""

    def __init__(self, db: Session):
        self.db = db
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self):
        """Initialize custom styles for PDF generation"""
        self.styles.add(ParagraphStyle(
            name='SwissTitle',
            parent=self.styles['Title'],
            fontSize=16,
            textColor=blue,
            alignment=TA_CENTER
        ))

        self.styles.add(ParagraphStyle(
            name='SwissHeader',
            parent=self.styles['Heading2'],
            fontSize=12,
            textColor=black,
            spaceAfter=6
        ))

        self.styles.add(ParagraphStyle(
            name='SwissNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=12
        ))

    async def generate_tax_pdf(
        self,
        user_id: str,
        canton: str,
        tax_year: int,
        format: str = 'official'
    ) -> bytes:
        """
        Generate tax declaration PDF

        Args:
            user_id: User ID
            canton: Canton code (e.g., 'ZH', 'AG')
            tax_year: Tax year
            format: PDF format ('official' for canton form, 'summary' for overview)

        Returns:
            PDF bytes
        """
        try:
            # Fetch user's tax profile and data
            tax_profile = self.db.query(TaxProfile).filter_by(user_id=user_id).first()
            if not tax_profile:
                raise ValueError("Tax profile not found")

            # Get canton form mapping
            form_mapping = self.db.query(CantonFormMapping).filter_by(
                canton=canton,
                tax_year=tax_year,
                is_active=True
            ).first()

            if format == 'official' and form_mapping:
                return await self._generate_official_form(
                    tax_profile,
                    form_mapping,
                    canton,
                    tax_year
                )
            else:
                return await self._generate_summary_pdf(
                    tax_profile,
                    canton,
                    tax_year
                )

        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            raise

    async def _generate_official_form(
        self,
        tax_profile: TaxProfile,
        form_mapping: CantonFormMapping,
        canton: str,
        tax_year: int
    ) -> bytes:
        """Generate official canton tax form with filled data"""

        # Get validated data from tax profile
        data = tax_profile.validated_data or tax_profile.extracted_data

        # Map data to canton form fields
        field_mappings = form_mapping.field_mappings or {}

        if canton == 'ZH':
            return await self._generate_zurich_form(data, field_mappings, tax_year)
        elif canton == 'AG':
            return await self._generate_aargau_form(data, field_mappings, tax_year)
        else:
            # Fallback to summary format
            return await self._generate_summary_pdf(tax_profile, canton, tax_year)

    async def _generate_zurich_form(
        self,
        data: Dict[str, Any],
        field_mappings: Dict[str, str],
        tax_year: int
    ) -> bytes:
        """Generate Zurich canton tax form"""

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)

        # Page 1: Personal Information
        self._draw_zurich_header(pdf, tax_year)

        # Personal details section
        y_position = 750
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(50, y_position, "1. Personalien")

        y_position -= 25
        pdf.setFont("Helvetica", 10)

        # Map and fill personal information
        personal_fields = [
            ("Name:", data.get('last_name', '')),
            ("Vorname:", data.get('first_name', '')),
            ("Geburtsdatum:", data.get('birth_date', '')),
            ("AHV-Nummer:", data.get('ahv_number', '')),
            ("Zivilstand:", data.get('civil_status', '')),
            ("Strasse/Nr:", f"{data.get('street', '')} {data.get('house_number', '')}"),
            ("PLZ/Ort:", f"{data.get('postal_code', '')} {data.get('city', '')}"),
        ]

        for label, value in personal_fields:
            pdf.drawString(60, y_position, label)
            pdf.drawString(180, y_position, str(value))
            y_position -= 20

        # Income section
        y_position -= 20
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(50, y_position, "2. Einkommen")

        y_position -= 25
        pdf.setFont("Helvetica", 10)

        income_fields = [
            ("Lohn (brutto):", self._format_currency(data.get('gross_salary', 0))),
            ("Nebeneinkünfte:", self._format_currency(data.get('side_income', 0))),
            ("Kapitalerträge:", self._format_currency(data.get('capital_income', 0))),
        ]

        for label, value in income_fields:
            pdf.drawString(60, y_position, label)
            pdf.drawString(300, y_position, value)
            y_position -= 20

        # Deductions section
        y_position -= 20
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(50, y_position, "3. Abzüge")

        y_position -= 25
        pdf.setFont("Helvetica", 10)

        deduction_fields = [
            ("Berufsauslagen:", self._format_currency(data.get('professional_expenses', 0))),
            ("Versicherungsprämien:", self._format_currency(data.get('insurance_premiums', 0))),
            ("Säule 3a:", self._format_currency(data.get('pillar_3a', 0))),
            ("Spenden:", self._format_currency(data.get('donations', 0))),
        ]

        for label, value in deduction_fields:
            pdf.drawString(60, y_position, label)
            pdf.drawString(300, y_position, value)
            y_position -= 20

        # Add footer
        self._draw_zurich_footer(pdf)

        pdf.save()
        buffer.seek(0)
        return buffer.read()

    async def _generate_aargau_form(
        self,
        data: Dict[str, Any],
        field_mappings: Dict[str, str],
        tax_year: int
    ) -> bytes:
        """Generate Aargau canton tax form"""

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)

        # Similar structure to Zurich but with Aargau-specific fields
        self._draw_aargau_header(pdf, tax_year)

        # Implementation similar to Zurich form but with canton-specific requirements
        # This would include Aargau-specific sections and calculations

        pdf.save()
        buffer.seek(0)
        return buffer.read()

    async def _generate_summary_pdf(
        self,
        tax_profile: TaxProfile,
        canton: str,
        tax_year: int
    ) -> bytes:
        """Generate summary PDF with all tax information"""

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        # Title
        title = Paragraph(
            f"Tax Declaration Summary {tax_year}",
            self.styles['SwissTitle']
        )
        story.append(title)
        story.append(Spacer(1, 20))

        # Personal Information
        story.append(Paragraph("Personal Information", self.styles['SwissHeader']))

        data = tax_profile.validated_data or tax_profile.extracted_data

        personal_data = [
            ["Name:", f"{data.get('first_name', '')} {data.get('last_name', '')}"],
            ["Date of Birth:", data.get('birth_date', '')],
            ["AHV Number:", data.get('ahv_number', '')],
            ["Address:", f"{data.get('street', '')} {data.get('house_number', '')}"],
            ["City:", f"{data.get('postal_code', '')} {data.get('city', '')}"],
            ["Canton:", canton],
        ]

        personal_table = Table(personal_data, colWidths=[100, 300])
        personal_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(personal_table)
        story.append(Spacer(1, 20))

        # Income Summary
        story.append(Paragraph("Income", self.styles['SwissHeader']))

        income_data = [
            ["Gross Salary:", self._format_currency(data.get('gross_salary', 0))],
            ["Bonuses:", self._format_currency(data.get('bonuses', 0))],
            ["Other Income:", self._format_currency(data.get('other_income', 0))],
            ["", ""],
            ["Total Income:", self._format_currency(
                data.get('gross_salary', 0) +
                data.get('bonuses', 0) +
                data.get('other_income', 0)
            )],
        ]

        income_table = Table(income_data, colWidths=[200, 100])
        income_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 11),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('LINEABOVE', (0, -1), (-1, -1), 1, black),
        ]))
        story.append(income_table)
        story.append(Spacer(1, 20))

        # Deductions Summary
        story.append(Paragraph("Deductions", self.styles['SwissHeader']))

        deduction_data = [
            ["Professional Expenses:", self._format_currency(data.get('professional_expenses', 0))],
            ["Insurance Premiums:", self._format_currency(data.get('insurance_premiums', 0))],
            ["Pillar 3a:", self._format_currency(data.get('pillar_3a', 0))],
            ["Donations:", self._format_currency(data.get('donations', 0))],
            ["Childcare:", self._format_currency(data.get('childcare', 0))],
            ["", ""],
            ["Total Deductions:", self._format_currency(
                data.get('professional_expenses', 0) +
                data.get('insurance_premiums', 0) +
                data.get('pillar_3a', 0) +
                data.get('donations', 0) +
                data.get('childcare', 0)
            )],
        ]

        deduction_table = Table(deduction_data, colWidths=[200, 100])
        deduction_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 11),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('LINEABOVE', (0, -1), (-1, -1), 1, black),
        ]))
        story.append(deduction_table)
        story.append(Spacer(1, 20))

        # Tax Calculation
        story.append(Paragraph("Tax Calculation", self.styles['SwissHeader']))

        total_income = (
            data.get('gross_salary', 0) +
            data.get('bonuses', 0) +
            data.get('other_income', 0)
        )

        total_deductions = (
            data.get('professional_expenses', 0) +
            data.get('insurance_premiums', 0) +
            data.get('pillar_3a', 0) +
            data.get('donations', 0) +
            data.get('childcare', 0)
        )

        taxable_income = max(0, total_income - total_deductions)

        tax_data = [
            ["Total Income:", self._format_currency(total_income)],
            ["Total Deductions:", self._format_currency(total_deductions)],
            ["", ""],
            ["Taxable Income:", self._format_currency(taxable_income)],
        ]

        tax_table = Table(tax_data, colWidths=[200, 100])
        tax_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 11),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('LINEABOVE', (0, -1), (-1, -1), 1, black),
        ]))
        story.append(tax_table)
        story.append(Spacer(1, 30))

        # Footer
        story.append(Paragraph(
            f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            self.styles['SwissNormal']
        ))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.read()

    def _draw_zurich_header(self, pdf: canvas.Canvas, tax_year: int):
        """Draw Zurich canton header"""
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(50, 800, f"Steuererklärung {tax_year}")
        pdf.drawString(50, 780, "Kanton Zürich")

        # Add canton logo placeholder
        pdf.setStrokeColor(blue)
        pdf.rect(450, 770, 100, 50)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(470, 790, "Kanton Zürich")

    def _draw_aargau_header(self, pdf: canvas.Canvas, tax_year: int):
        """Draw Aargau canton header"""
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(50, 800, f"Steuererklärung {tax_year}")
        pdf.drawString(50, 780, "Kanton Aargau")

        # Add canton logo placeholder
        pdf.setStrokeColor(red)
        pdf.rect(450, 770, 100, 50)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(470, 790, "Kanton Aargau")

    def _draw_zurich_footer(self, pdf: canvas.Canvas):
        """Draw Zurich canton footer"""
        pdf.setFont("Helvetica", 8)
        pdf.drawString(50, 30, f"Seite 1 - Generiert am {datetime.now().strftime('%d.%m.%Y')}")
        pdf.drawString(450, 30, "www.zh.ch/steuern")

    def _format_currency(self, amount: float) -> str:
        """Format amount as Swiss Francs"""
        return f"CHF {amount:,.2f}"

    async def fill_official_form(
        self,
        user_id: str,
        canton: str,
        tax_year: int,
        template_pdf_path: str
    ) -> bytes:
        """
        Fill an official PDF form template with user data

        Args:
            user_id: User ID
            canton: Canton code
            tax_year: Tax year
            template_pdf_path: Path to the official PDF template

        Returns:
            Filled PDF bytes
        """
        try:
            # Fetch user's tax profile
            tax_profile = self.db.query(TaxProfile).filter_by(user_id=user_id).first()
            if not tax_profile:
                raise ValueError("Tax profile not found")

            # Get canton form mapping
            form_mapping = self.db.query(CantonFormMapping).filter_by(
                canton=canton,
                tax_year=tax_year,
                is_active=True
            ).first()

            if not form_mapping:
                raise ValueError(f"No form mapping found for {canton} {tax_year}")

            # Validate and sanitize template path
            import os

            # Define safe base directory for templates
            SAFE_TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "tax_forms"

            # Resolve and validate path
            template_path = Path(template_pdf_path).resolve()
            safe_dir = SAFE_TEMPLATE_DIR.resolve()

            # Ensure the template path is within the safe directory
            try:
                template_path.relative_to(safe_dir)
            except ValueError:
                raise ValueError("Invalid template path - access denied")

            if not template_path.exists():
                raise FileNotFoundError("Template PDF not found")

            # Extract field mappings
            field_mappings = form_mapping.field_mappings or {}
            data = tax_profile.validated_data or tax_profile.extracted_data

            # Create output buffer
            output_buffer = io.BytesIO()

            # Read the template
            with open(template_path, 'rb') as template_file:
                reader = PdfReader(template_file)
                writer = PdfWriter()

                # Fill form fields if the PDF has them
                if '/AcroForm' in reader.trailer['/Root']:
                    writer.append_pages_from_reader(reader)

                    # Map our data to PDF form fields
                    for our_field, pdf_field in field_mappings.items():
                        if our_field in data and pdf_field in writer.get_fields():
                            writer.update_page_form_field_values(
                                writer.pages[0],
                                {pdf_field: str(data[our_field])}
                            )
                else:
                    # If no form fields, overlay text on PDF
                    for page_num, page in enumerate(reader.pages):
                        # Create overlay with our data
                        packet = io.BytesIO()
                        can = canvas.Canvas(packet, pagesize=A4)

                        # Position text based on field mappings
                        # This would need specific coordinates for each canton's form
                        self._overlay_text_on_page(can, data, field_mappings, canton, page_num)

                        can.save()
                        packet.seek(0)

                        # Merge overlay with template page
                        overlay_pdf = PdfReader(packet)
                        page.merge_page(overlay_pdf.pages[0])
                        writer.add_page(page)

                # Write to output buffer
                writer.write(output_buffer)

            output_buffer.seek(0)
            return output_buffer.read()

        except Exception as e:
            logger.error(f"Failed to fill official form: {e}")
            raise

    def _overlay_text_on_page(
        self,
        canvas: canvas.Canvas,
        data: Dict[str, Any],
        field_mappings: Dict[str, Any],
        canton: str,
        page_num: int
    ):
        """Overlay text on specific positions for each canton's form"""

        # Canton-specific coordinate mappings
        # These would need to be defined based on actual form analysis
        if canton == 'ZH':
            if page_num == 0:
                # Personal information on first page
                canvas.drawString(150, 700, data.get('first_name', ''))
                canvas.drawString(300, 700, data.get('last_name', ''))
                canvas.drawString(150, 670, data.get('birth_date', ''))
                canvas.drawString(300, 670, data.get('ahv_number', ''))
                # Add more fields...
        elif canton == 'AG':
            if page_num == 0:
                # Aargau-specific positions
                canvas.drawString(140, 710, data.get('first_name', ''))
                canvas.drawString(290, 710, data.get('last_name', ''))
                # Add more fields...

    async def validate_pdf_completeness(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Validate that all required fields in the PDF are filled

        Args:
            pdf_bytes: Generated PDF bytes

        Returns:
            Validation results with missing fields
        """
        missing_fields = []
        warnings = []

        try:
            # Use pdfplumber to extract text and check for empty fields
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()

                    # Check for common indicators of missing data
                    if '___' in text or '...' in text:
                        warnings.append(f"Potential missing data on page {page_num + 1}")

                    # Check for required fields
                    required_patterns = [
                        'AHV',
                        'Name',
                        'Vorname',
                        'Geburtsdatum',
                        'Einkommen',
                        'Abzüge'
                    ]

                    for pattern in required_patterns:
                        if pattern not in text:
                            missing_fields.append(pattern)

            return {
                'is_complete': len(missing_fields) == 0,
                'missing_fields': list(set(missing_fields)),
                'warnings': warnings,
                'pages': len(pdf.pages) if 'pdf' in locals() else 0
            }

        except Exception as e:
            logger.error(f"PDF validation failed: {e}")
            return {
                'is_complete': False,
                'error': str(e)
            }