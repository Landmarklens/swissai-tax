"""
Filing Router - Tax filing management endpoints
Handles creating, listing, copying, and deleting tax filings
"""
import logging
import secrets
from collections import defaultdict
from datetime import datetime
from typing import Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models import InterviewSession
from models.swisstax import Filing, User
from models.tax_filing_session import TaxFilingSession, FilingStatus
from services.tax_filing_service import TaxFilingService
from schemas.swisstax.filing import (
    FilingCopy,
    FilingCreate,
    FilingCreateNew,
    FilingListItem,
    FilingResponse,
    FilingsListResponse,
    PostalCodeLookup,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Swiss canton mapping
CANTONS = {
    'ZH': 'Zürich', 'BE': 'Bern', 'LU': 'Luzern', 'UR': 'Uri',
    'SZ': 'Schwyz', 'OW': 'Obwalden', 'NW': 'Nidwalden', 'GL': 'Glarus',
    'ZG': 'Zug', 'FR': 'Fribourg', 'SO': 'Solothurn', 'BS': 'Basel-Stadt',
    'BL': 'Basel-Landschaft', 'SH': 'Schaffhausen', 'AR': 'Appenzell Ausserrhoden',
    'AI': 'Appenzell Innerrhoden', 'SG': 'St. Gallen', 'GR': 'Graubünden',
    'AG': 'Aargau', 'TG': 'Thurgau', 'TI': 'Ticino', 'VD': 'Vaud',
    'VS': 'Valais', 'NE': 'Neuchâtel', 'GE': 'Geneva', 'JU': 'Jura'
}

# Swiss postal code to canton/municipality mapping (expanded data)
# In production, this should be replaced with a complete database table with all Swiss postal codes
# or use the official Swiss Post API
POSTAL_CODE_MAP = {
    # Zürich (ZH)
    '8000': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8001': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8002': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8003': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8004': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8005': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8006': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8008': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8032': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8050': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8092': {'municipality': 'Zürich', 'canton': 'ZH'},
    '8102': {'municipality': 'Oberengstringen', 'canton': 'ZH'},
    '8134': {'municipality': 'Adliswil', 'canton': 'ZH'},
    '8152': {'municipality': 'Glattbrugg', 'canton': 'ZH'},
    '8400': {'municipality': 'Winterthur', 'canton': 'ZH'},
    '8610': {'municipality': 'Uster', 'canton': 'ZH'},

    # Bern (BE)
    '3000': {'municipality': 'Bern', 'canton': 'BE'},
    '3001': {'municipality': 'Bern', 'canton': 'BE'},
    '3002': {'municipality': 'Bern', 'canton': 'BE'},
    '3003': {'municipality': 'Bern', 'canton': 'BE'},
    '3004': {'municipality': 'Bern', 'canton': 'BE'},
    '3005': {'municipality': 'Bern', 'canton': 'BE'},
    '3006': {'municipality': 'Bern', 'canton': 'BE'},
    '3007': {'municipality': 'Bern', 'canton': 'BE'},
    '3008': {'municipality': 'Bern', 'canton': 'BE'},
    '3010': {'municipality': 'Bern', 'canton': 'BE'},
    '3011': {'municipality': 'Bern', 'canton': 'BE'},
    '3012': {'municipality': 'Bern', 'canton': 'BE'},
    '3013': {'municipality': 'Bern', 'canton': 'BE'},
    '3014': {'municipality': 'Bern', 'canton': 'BE'},
    '3015': {'municipality': 'Bern', 'canton': 'BE'},
    '3027': {'municipality': 'Bern', 'canton': 'BE'},
    '3032': {'municipality': 'Hinterkappelen', 'canton': 'BE'},
    '3600': {'municipality': 'Thun', 'canton': 'BE'},
    '2500': {'municipality': 'Biel', 'canton': 'BE'},

    # Geneva (GE)
    '1200': {'municipality': 'Geneva', 'canton': 'GE'},
    '1201': {'municipality': 'Geneva', 'canton': 'GE'},
    '1202': {'municipality': 'Geneva', 'canton': 'GE'},
    '1203': {'municipality': 'Geneva', 'canton': 'GE'},
    '1204': {'municipality': 'Geneva', 'canton': 'GE'},
    '1205': {'municipality': 'Geneva', 'canton': 'GE'},
    '1206': {'municipality': 'Geneva', 'canton': 'GE'},
    '1207': {'municipality': 'Geneva', 'canton': 'GE'},
    '1208': {'municipality': 'Geneva', 'canton': 'GE'},
    '1209': {'municipality': 'Geneva', 'canton': 'GE'},
    '1212': {'municipality': 'Grand-Lancy', 'canton': 'GE'},
    '1227': {'municipality': 'Carouge', 'canton': 'GE'},

    # Vaud (VD)
    '1000': {'municipality': 'Lausanne', 'canton': 'VD'},
    '1003': {'municipality': 'Lausanne', 'canton': 'VD'},
    '1004': {'municipality': 'Lausanne', 'canton': 'VD'},
    '1005': {'municipality': 'Lausanne', 'canton': 'VD'},
    '1006': {'municipality': 'Lausanne', 'canton': 'VD'},
    '1007': {'municipality': 'Lausanne', 'canton': 'VD'},
    '1010': {'municipality': 'Lausanne', 'canton': 'VD'},
    '1020': {'municipality': 'Renens', 'canton': 'VD'},
    '1110': {'municipality': 'Morges', 'canton': 'VD'},
    '1800': {'municipality': 'Vevey', 'canton': 'VD'},
    '1820': {'municipality': 'Montreux', 'canton': 'VD'},
    '1400': {'municipality': 'Yverdon-les-Bains', 'canton': 'VD'},

    # Basel-Stadt (BS)
    '4000': {'municipality': 'Basel', 'canton': 'BS'},
    '4001': {'municipality': 'Basel', 'canton': 'BS'},
    '4002': {'municipality': 'Basel', 'canton': 'BS'},
    '4003': {'municipality': 'Basel', 'canton': 'BS'},
    '4051': {'municipality': 'Basel', 'canton': 'BS'},
    '4052': {'municipality': 'Basel', 'canton': 'BS'},
    '4053': {'municipality': 'Basel', 'canton': 'BS'},
    '4054': {'municipality': 'Basel', 'canton': 'BS'},
    '4055': {'municipality': 'Basel', 'canton': 'BS'},
    '4056': {'municipality': 'Basel', 'canton': 'BS'},
    '4057': {'municipality': 'Basel', 'canton': 'BS'},
    '4058': {'municipality': 'Basel', 'canton': 'BS'},

    # Ticino (TI)
    '6900': {'municipality': 'Lugano', 'canton': 'TI'},
    '6901': {'municipality': 'Lugano', 'canton': 'TI'},
    '6902': {'municipality': 'Lugano', 'canton': 'TI'},
    '6903': {'municipality': 'Lugano', 'canton': 'TI'},
    '6500': {'municipality': 'Bellinzona', 'canton': 'TI'},
    '6600': {'municipality': 'Locarno', 'canton': 'TI'},

    # Lucerne (LU)
    '6000': {'municipality': 'Luzern', 'canton': 'LU'},
    '6003': {'municipality': 'Luzern', 'canton': 'LU'},
    '6004': {'municipality': 'Luzern', 'canton': 'LU'},
    '6005': {'municipality': 'Luzern', 'canton': 'LU'},

    # St. Gallen (SG)
    '9000': {'municipality': 'St. Gallen', 'canton': 'SG'},
    '9001': {'municipality': 'St. Gallen', 'canton': 'SG'},
    '9004': {'municipality': 'St. Gallen', 'canton': 'SG'},
    '9500': {'municipality': 'Wil', 'canton': 'SG'},

    # Aargau (AG)
    '5000': {'municipality': 'Aarau', 'canton': 'AG'},
    '5001': {'municipality': 'Aarau', 'canton': 'AG'},
    '5400': {'municipality': 'Baden', 'canton': 'AG'},
    '5425': {'municipality': 'Schneisingen', 'canton': 'AG'},

    # Zug (ZG)
    '6300': {'municipality': 'Zug', 'canton': 'ZG'},
    '6301': {'municipality': 'Zug', 'canton': 'ZG'},
    '6340': {'municipality': 'Baar', 'canton': 'ZG'},

    # Neuchâtel (NE)
    '2000': {'municipality': 'Neuchâtel', 'canton': 'NE'},
    '2001': {'municipality': 'Neuchâtel', 'canton': 'NE'},
    '2300': {'municipality': 'La Chaux-de-Fonds', 'canton': 'NE'},

    # Fribourg (FR)
    '1700': {'municipality': 'Fribourg', 'canton': 'FR'},
    '1701': {'municipality': 'Fribourg', 'canton': 'FR'},

    # Valais (VS)
    '1950': {'municipality': 'Sion', 'canton': 'VS'},
    '3900': {'municipality': 'Brig', 'canton': 'VS'},

    # Thurgau (TG)
    '8500': {'municipality': 'Frauenfeld', 'canton': 'TG'},
    '8280': {'municipality': 'Kreuzlingen', 'canton': 'TG'},

    # Schaffhausen (SH)
    '8200': {'municipality': 'Schaffhausen', 'canton': 'SH'},

    # Graubünden (GR)
    '7000': {'municipality': 'Chur', 'canton': 'GR'},
    '7500': {'municipality': 'St. Moritz', 'canton': 'GR'},

    # Basel-Landschaft (BL)
    '4410': {'municipality': 'Liestal', 'canton': 'BL'},
    '4132': {'municipality': 'Muttenz', 'canton': 'BL'},
}


@router.get("/filings")
async def list_filings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> FilingsListResponse:
    """
    List all tax filings for the current user, grouped by year
    Returns statistics and filings organized by tax year
    """
    try:
        # Use TaxFilingService to get all filings
        # Get filings grouped by year
        filings_by_year = TaxFilingService.list_user_filings(
            db=db,
            user_id=str(current_user.id)
        )

        if not filings_by_year:
            return FilingsListResponse(
                filings={},
                statistics={
                    'total_filings': 0,
                    'completed_filings': 0,
                    'in_progress_filings': 0,
                    'draft_filings': 0
                }
            )

        # Convert to FilingListItem format and calculate statistics
        formatted_filings = defaultdict(list)
        total = 0
        completed = 0
        in_progress = 0
        draft = 0

        for year, filings_list in filings_by_year.items():
            for filing_dict in filings_list:
                # Count statistics
                total += 1
                status = filing_dict.get('status', 'draft')
                if status in ['completed', 'submitted']:
                    completed += 1
                elif status == 'in_progress':
                    in_progress += 1
                else:
                    draft += 1

                # Create FilingListItem
                filing_item = FilingListItem(
                    id=filing_dict['id'],
                    name=filing_dict.get('name', f"{year} Tax Return"),
                    tax_year=filing_dict['tax_year'],
                    canton=filing_dict.get('canton'),
                    municipality=filing_dict.get('municipality'),
                    status=status,
                    completion_percentage=filing_dict.get('completion_percentage', 0),
                    is_primary=filing_dict.get('is_primary', True),
                    created_at=filing_dict.get('created_at'),
                    updated_at=filing_dict.get('updated_at')
                )

                formatted_filings[str(year)].append(filing_item)

        return FilingsListResponse(
            filings=dict(formatted_filings),
            statistics={
                'total_filings': total,
                'completed_filings': completed,
                'in_progress_filings': in_progress,
                'draft_filings': draft
            }
        )

    except Exception as e:
        logger.error(f"Error listing filings for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list filings: {str(e)}")


@router.post("/filings")
async def create_filing(
    data: FilingCreateNew,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Create a new tax filing with an interview session
    Returns the created session ID for starting the interview
    """
    try:
        # Check if user already has a filing for this year
        existing = db.query(TaxFilingSession).filter(
            TaxFilingSession.user_id == current_user.id,
            TaxFilingSession.tax_year == data.tax_year
        ).first()

        if existing:
            # Return existing session if user wants to create duplicate year
            # Frontend can decide whether to continue with existing or create new
            logger.warning(f"User {current_user.id} already has filing for year {data.tax_year}")
            # For now, return the existing session
            return {
                'id': str(existing.id),
                'tax_year': existing.tax_year,
                'status': existing.status.value if isinstance(existing.status, FilingStatus) else existing.status,
                'message': 'Filing for this year already exists'
            }

        # Create new TaxFilingSession (not InterviewSession)
        # Generate default name
        filing_name = TaxFilingSession.generate_default_name(data.tax_year, data.language)
        if data.municipality and data.canton:
            filing_name = f"{data.tax_year} - {data.municipality}, {data.canton}"

        new_filing = TaxFilingSession(
            user_id=current_user.id,
            name=filing_name,
            tax_year=data.tax_year,
            language=data.language,
            status=FilingStatus.DRAFT,
            canton=data.canton,
            municipality=data.municipality,
            is_primary=data.is_primary,
            profile={
                'canton': data.canton,
                'municipality': data.municipality,
                'postal_code': data.postal_code
            },
            completion_percentage=0,
            current_question_id=None,
            completed_questions=[],
            question_count=0
        )

        db.add(new_filing)
        db.commit()
        db.refresh(new_filing)

        logger.info(f"Created new filing session {new_filing.id} for user {current_user.id}, year {data.tax_year}")

        return {
            'id': str(new_filing.id),
            'tax_year': new_filing.tax_year,
            'canton': data.canton,
            'municipality': data.municipality,
            'status': new_filing.status.value if isinstance(new_filing.status, FilingStatus) else new_filing.status,
            'message': 'Filing created successfully'
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating filing for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create filing: {str(e)}")


@router.post("/filings/copy")
async def copy_filing(
    data: FilingCopy,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Copy an existing filing to a new tax year
    Copies answers and context but resets progress
    """
    try:
        # Get source session
        source_session = db.query(InterviewSession).filter(
            InterviewSession.id == UUID(data.source_filing_id),
            InterviewSession.user_id == current_user.id
        ).first()

        if not source_session:
            raise HTTPException(status_code=404, detail="Source filing not found")

        # Check if target year already exists
        existing = db.query(InterviewSession).filter(
            InterviewSession.user_id == current_user.id,
            InterviewSession.tax_year == data.new_year
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Filing for year {data.new_year} already exists"
            )

        # Create new session with copied data
        new_session = InterviewSession(
            user_id=current_user.id,
            tax_year=data.new_year,
            language=source_session.language,
            status='draft',
            answers=source_session.answers.copy() if source_session.answers else {},
            session_context=source_session.session_context.copy() if source_session.session_context else {},
            current_question_id=None,
            completed_questions=[],
            pending_questions=[],
            progress=0,
            completion_percentage=0
        )

        # Update year in answers if present
        if new_session.answers:
            new_session.answers['tax_year'] = data.new_year

        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        logger.info(f"Copied filing from {source_session.id} to {new_session.id} for year {data.new_year}")

        return {
            'id': str(new_session.id),
            'tax_year': new_session.tax_year,
            'status': new_session.status,
            'message': f'Filing copied from {source_session.tax_year} to {data.new_year}'
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error copying filing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to copy filing: {str(e)}")


@router.delete("/filings/{filing_id}")
async def delete_filing(
    filing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Delete a tax filing
    This will cascade delete all associated data (answers, documents, calculations)
    """
    try:
        # Use TaxFilingService to delete the filing properly
        # This will handle proper deletion including related records
        deleted = TaxFilingService.delete_filing(
            db=db,
            filing_id=filing_id,
            user_id=str(current_user.id),
            hard_delete=True  # Always hard delete
        )

        if deleted:
            logger.info(f"Successfully deleted filing {filing_id} for user {current_user.id}")
            return {
                'success': True,
                'message': 'Filing deleted successfully'
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete filing")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting filing {filing_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete filing: {str(e)}")


@router.get("/postal-code/{postal_code}")
async def lookup_postal_code(
    postal_code: str,
    db: Session = Depends(get_db)
) -> PostalCodeLookup:
    """
    Look up canton and municipality by postal code
    Returns municipality and canton information
    """
    try:
        # Validate postal code format
        if not postal_code.isdigit() or len(postal_code) != 4:
            raise HTTPException(
                status_code=400,
                detail="Postal code must be exactly 4 digits"
            )

        # Look up in our mapping
        # TODO: Replace with database lookup or external API
        if postal_code not in POSTAL_CODE_MAP:
            raise HTTPException(
                status_code=404,
                detail=f"Postal code {postal_code} not found. Please enter municipality and canton manually."
            )

        data = POSTAL_CODE_MAP[postal_code]
        canton_code = data['canton']
        canton_name = CANTONS.get(canton_code, canton_code)

        return PostalCodeLookup(
            postal_code=postal_code,
            municipality=data['municipality'],
            canton=canton_code,
            canton_name=canton_name
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error looking up postal code {postal_code}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to lookup postal code: {str(e)}")


# Keep original endpoints for backward compatibility
@router.post("/submit", response_model=FilingResponse)
async def submit_filing(
    data: FilingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a tax filing"""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == UUID(data.session_id)
    ).first()

    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Generate confirmation number
    confirmation_number = f"CH-{session.tax_year}-{secrets.token_hex(4).upper()}"

    filing = Filing(
        user_id=current_user.id,
        session_id=session.id,
        tax_year=session.tax_year,
        status="submitted" if data.submission_method == "efile" else "completed",
        submission_method=data.submission_method,
        submitted_at=datetime.utcnow(),
        confirmation_number=confirmation_number
    )
    db.add(filing)

    # Update session status
    session.status = 'submitted'
    session.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(filing)

    return filing


@router.get("/{filing_id}", response_model=FilingResponse)
async def get_filing(
    filing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get filing details"""
    filing = db.query(Filing).filter(
        Filing.id == UUID(filing_id),
        Filing.user_id == current_user.id
    ).first()

    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")

    return filing
