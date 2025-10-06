"""
PDF Generation API Endpoints

Provides REST API for generating tax return PDFs in both formats:
- eCH-0196 (modern, machine-readable with barcode)
- Traditional canton forms (official pre-filled forms)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import logging
import io

from db.session import get_db
from services.pdf_generators.unified_pdf_generator import UnifiedPDFGenerator
from services.filing_orchestration_service import FilingOrchestrationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pdf", tags=["PDF Generation"])


# ============================================================================
# Request/Response Models
# ============================================================================

class PDFInfoResponse(BaseModel):
    """PDF generation information"""
    filing_id: str
    canton: str
    tax_year: int
    is_primary: bool
    available_pdfs: dict
    languages: List[str]
    canton_info: dict


class PDFGenerationResponse(BaseModel):
    """PDF generation result"""
    filing_id: str
    success: bool
    pdf_type: str
    message: Optional[str] = None
    error: Optional[str] = None


class BulkPDFGenerationResponse(BaseModel):
    """Bulk PDF generation result"""
    user_id: str
    tax_year: int
    total_filings: int
    successful: int
    failed: int
    results: List[PDFGenerationResponse]


# ============================================================================
# PDF Generation Endpoints
# ============================================================================

@router.get("/info/{filing_id}", response_model=PDFInfoResponse)
def get_pdf_info(
    filing_id: str,
    db: Session = Depends(get_db)
):
    """
    Get information about available PDF formats for a filing.

    Returns details about:
    - Available PDF types (eCH-0196, traditional)
    - Canton form specifications
    - Supported languages
    - Processing information
    """
    try:
        generator = UnifiedPDFGenerator()
        info = generator.get_pdf_info(filing_id, db)

        return PDFInfoResponse(**info)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting PDF info for {filing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")


@router.get("/download/{filing_id}")
def download_pdf(
    filing_id: str,
    pdf_type: str = Query(
        'ech0196',
        description="PDF type: 'ech0196' or 'traditional'"
    ),
    language: str = Query(
        'de',
        description="Language: de, fr, it, or en"
    ),
    db: Session = Depends(get_db)
):
    """
    Download a PDF for a specific filing.

    Query Parameters:
    - pdf_type: 'ech0196' (default) or 'traditional'
    - language: 'de' (default), 'fr', 'it', or 'en'

    Returns:
    - PDF file as application/pdf
    """
    try:
        generator = UnifiedPDFGenerator()

        # Get filing info for filename
        filing_service = FilingOrchestrationService(db=db)
        filing = filing_service.get_filing(filing_id)

        if not filing:
            raise HTTPException(status_code=404, detail=f"Filing {filing_id} not found")

        # Generate PDF
        if pdf_type == 'ech0196':
            pdf_buffer = generator.generate_ech0196_pdf(filing_id, language, db)
            filename = f"tax_return_{filing.canton}_{filing.tax_year}_ech0196.pdf"
        elif pdf_type == 'traditional':
            pdf_buffer = generator.generate_traditional_pdf(filing_id, language, db)
            filename = f"tax_return_{filing.canton}_{filing.tax_year}_official.pdf"
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid pdf_type: {pdf_type}. Use 'ech0196' or 'traditional'"
            )

        # Return PDF as download
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating PDF for {filing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


@router.get("/download-both/{filing_id}")
def download_both_pdfs(
    filing_id: str,
    language: str = Query('de', description="Language: de, fr, it, or en"),
    db: Session = Depends(get_db)
):
    """
    Generate and return both PDF types as a ZIP archive.

    Returns:
    - ZIP file containing both eCH-0196 and traditional PDFs
    """
    import zipfile

    try:
        generator = UnifiedPDFGenerator()

        # Get filing info
        filing_service = FilingOrchestrationService(db=db)
        filing = filing_service.get_filing(filing_id)

        if not filing:
            raise HTTPException(status_code=404, detail=f"Filing {filing_id} not found")

        # Generate both PDFs
        pdfs = generator.generate_all_pdfs(filing_id, language, db)

        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:

            # Add eCH-0196 PDF
            if pdfs.get('ech0196'):
                ech_filename = f"tax_return_{filing.canton}_{filing.tax_year}_ech0196.pdf"
                zip_file.writestr(ech_filename, pdfs['ech0196'].getvalue())

            # Add traditional PDF
            if pdfs.get('traditional'):
                trad_filename = f"tax_return_{filing.canton}_{filing.tax_year}_official.pdf"
                zip_file.writestr(trad_filename, pdfs['traditional'].getvalue())

            # Add README
            from datetime import datetime as dt
            readme_content = f"""Swiss Tax Return PDFs

Canton: {filing.canton}
Tax Year: {filing.tax_year}
Type: {'Primary Filing' if filing.is_primary else 'Secondary Filing'}
Generated: {dt.now().isoformat()}

Files:
1. tax_return_{filing.canton}_{filing.tax_year}_ech0196.pdf
   - Modern eCH-0196 format with Data Matrix barcode
   - Machine-readable, accepted by all Swiss cantons
   - Recommended for faster processing

2. tax_return_{filing.canton}_{filing.tax_year}_official.pdf
   - Official {filing.canton} canton tax form
   - Pre-filled with your data
   - Traditional format

You can submit either PDF to the tax authority.
The eCH-0196 format is recommended for faster processing.
"""
            zip_file.writestr('README.txt', readme_content)

        zip_buffer.seek(0)

        # Return ZIP as download
        filename = f"tax_return_{filing.canton}_{filing.tax_year}.zip"
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating PDFs for {filing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


@router.get("/download-all/{user_id}/{tax_year}")
def download_all_user_pdfs(
    user_id: str,
    tax_year: int,
    pdf_type: str = Query(
        'both',
        description="PDF type: 'both', 'ech0196', or 'traditional'"
    ),
    language: str = Query('de', description="Language: de, fr, it, or en"),
    db: Session = Depends(get_db)
):
    """
    Download PDFs for all user filings (primary + secondaries) as ZIP.

    This is useful for users with properties in multiple cantons who need
    separate tax filings for each canton.

    Returns:
    - ZIP file containing PDFs for all filings
    """
    import zipfile

    try:
        generator = UnifiedPDFGenerator()

        # Generate all PDFs
        all_pdfs = generator.generate_all_user_pdfs(
            user_id,
            tax_year,
            language,
            pdf_type,
            db
        )

        if not all_pdfs:
            raise HTTPException(
                status_code=404,
                detail=f"No filings found for user {user_id}, tax year {tax_year}"
            )

        # Get filing info for each filing
        filing_service = FilingOrchestrationService(db=db)

        # Create ZIP file
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:

            for filing_id, pdfs in all_pdfs.items():
                filing = filing_service.get_filing(filing_id)
                if not filing:
                    continue

                filing_type = 'primary' if filing.is_primary else 'secondary'
                prefix = f"{filing.canton}_{filing_type}"

                # Add eCH-0196 PDF
                if pdfs.get('ech0196'):
                    filename = f"{prefix}_ech0196.pdf"
                    zip_file.writestr(filename, pdfs['ech0196'].getvalue())

                # Add traditional PDF
                if pdfs.get('traditional'):
                    filename = f"{prefix}_official.pdf"
                    zip_file.writestr(filename, pdfs['traditional'].getvalue())

            # Add summary README
            from datetime import datetime as dt
            filings = filing_service.get_all_user_filings(user_id, tax_year)
            readme = f"""Swiss Tax Returns - Tax Year {tax_year}

Total Filings: {len(filings)}

Filings:
"""
            for filing in filings:
                filing_type = 'Primary' if filing.is_primary else 'Secondary'
                readme += f"\n- {filing.canton} ({filing_type})"

            readme += f"""

Generated: {dt.now().isoformat()}

Note: If you have properties in multiple cantons, you must submit
separate tax returns to each canton.
"""
            zip_file.writestr('README.txt', readme)

        zip_buffer.seek(0)

        # Return ZIP
        filename = f"tax_returns_{tax_year}.zip"
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating all PDFs for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


@router.post("/generate/{filing_id}", response_model=PDFGenerationResponse)
def generate_pdf(
    filing_id: str,
    pdf_type: str = Query(
        'ech0196',
        description="PDF type: 'ech0196' or 'traditional'"
    ),
    language: str = Query('de', description="Language: de, fr, it, or en"),
    db: Session = Depends(get_db)
):
    """
    Generate a PDF (without downloading).

    This endpoint generates the PDF and returns status/metadata.
    Use the /download endpoint to actually download the PDF.

    Useful for:
    - Pre-generating PDFs
    - Checking if PDF generation succeeds
    - Getting PDF metadata
    """
    try:
        generator = UnifiedPDFGenerator()

        # Generate PDF
        if pdf_type == 'ech0196':
            pdf_buffer = generator.generate_ech0196_pdf(filing_id, language, db)
        elif pdf_type == 'traditional':
            pdf_buffer = generator.generate_traditional_pdf(filing_id, language, db)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid pdf_type: {pdf_type}"
            )

        # Get PDF size
        pdf_size = len(pdf_buffer.getvalue())

        return PDFGenerationResponse(
            filing_id=filing_id,
            success=True,
            pdf_type=pdf_type,
            message=f"PDF generated successfully ({pdf_size} bytes)"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating PDF for {filing_id}: {e}")
        return PDFGenerationResponse(
            filing_id=filing_id,
            success=False,
            pdf_type=pdf_type,
            error=str(e)
        )


@router.post("/generate-all/{user_id}/{tax_year}", response_model=BulkPDFGenerationResponse)
def generate_all_user_pdfs(
    user_id: str,
    tax_year: int,
    pdf_type: str = Query('both', description="PDF type: 'both', 'ech0196', or 'traditional'"),
    language: str = Query('de', description="Language: de, fr, it, or en"),
    db: Session = Depends(get_db)
):
    """
    Generate PDFs for all user filings.

    Returns status for each filing.
    Use /download-all to actually download the PDFs.
    """
    try:
        generator = UnifiedPDFGenerator()

        # Get all filings
        filing_service = FilingOrchestrationService(db=db)
        filings = filing_service.get_all_user_filings(user_id, tax_year)

        if not filings:
            raise HTTPException(
                status_code=404,
                detail=f"No filings found for user {user_id}, tax year {tax_year}"
            )

        results = []
        successful = 0
        failed = 0

        for filing in filings:
            try:
                # Generate requested PDF types
                if pdf_type in ('both', 'ech0196'):
                    generator.generate_ech0196_pdf(filing.id, language, db)

                if pdf_type in ('both', 'traditional'):
                    generator.generate_traditional_pdf(filing.id, language, db)

                results.append(PDFGenerationResponse(
                    filing_id=filing.id,
                    success=True,
                    pdf_type=pdf_type,
                    message=f"Generated {pdf_type} PDF for {filing.canton}"
                ))
                successful += 1

            except Exception as e:
                results.append(PDFGenerationResponse(
                    filing_id=filing.id,
                    success=False,
                    pdf_type=pdf_type,
                    error=str(e)
                ))
                failed += 1

        return BulkPDFGenerationResponse(
            user_id=user_id,
            tax_year=tax_year,
            total_filings=len(filings),
            successful=successful,
            failed=failed,
            results=results
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating PDFs for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
