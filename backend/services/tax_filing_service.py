"""
Tax Filing Management Service
Handles CRUD operations for multiple tax filings per user
Supports multi-year and multi-canton filing scenarios
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session

from models.tax_answer import TaxAnswer
from models.tax_calculation import TaxCalculation
from models.tax_filing_session import FilingStatus, TaxFilingSession
from models.tax_insight import TaxInsight

logger = logging.getLogger(__name__)


class TaxFilingService:
    """Service for managing multiple tax filings per user"""

    @staticmethod
    def list_user_filings(
        db: Session,
        user_id: str,
        year: Optional[int] = None,
        canton: Optional[str] = None,
        include_deleted: bool = False  # Kept for compatibility but ignored
    ) -> Dict[int, List[Dict]]:
        """
        Get all filings for a user, optionally filtered by year or canton
        Returns dictionary grouped by year

        Args:
            db: Database session
            user_id: User ID
            year: Optional filter by tax year
            canton: Optional filter by canton
            include_deleted: Ignored (no soft delete anymore)

        Returns:
            Dictionary with year as key, list of filings as value
            Example: {2024: [...], 2023: [...]}
        """
        query = db.query(TaxFilingSession).filter(
            TaxFilingSession.user_id == user_id
        )

        # No soft delete check needed anymore

        if year:
            query = query.filter(TaxFilingSession.tax_year == year)

        if canton:
            query = query.filter(TaxFilingSession.canton == canton)

        filings = query.order_by(
            desc(TaxFilingSession.tax_year),
            desc(TaxFilingSession.is_primary),
            TaxFilingSession.canton
        ).all()

        # Group by year
        grouped = {}
        for filing in filings:
            year_key = filing.tax_year
            if year_key not in grouped:
                grouped[year_key] = []
            grouped[year_key].append(filing.to_dict(include_relationships=False))

        logger.info(f"Listed {len(filings)} filings for user {user_id}")
        return grouped

    @staticmethod
    def create_filing(
        db: Session,
        user_id: str,
        tax_year: int,
        canton: str,
        language: str = 'en',
        municipality: Optional[str] = None,
        is_primary: bool = True,
        parent_filing_id: Optional[str] = None,
        name: Optional[str] = None
    ) -> TaxFilingSession:
        """
        Create a new tax filing session

        Args:
            db: Database session
            user_id: User ID
            tax_year: Tax year (2024, 2023, etc.)
            canton: Canton code (ZH, GE, BE, etc.)
            language: UI language (en, de, fr, it)
            municipality: Municipality name (optional)
            is_primary: True for main residence filing, False for additional canton
            parent_filing_id: ID of parent filing (for multi-canton scenarios)
            name: Custom filing name (auto-generated if None)

        Returns:
            Created TaxFilingSession object

        Raises:
            ValueError: If filing already exists for this user/year/canton
        """
        # Check if filing already exists (no soft delete check needed)
        existing = db.query(TaxFilingSession).filter(
            and_(
                TaxFilingSession.user_id == user_id,
                TaxFilingSession.tax_year == tax_year,
                TaxFilingSession.canton == canton
            )
        ).first()

        if existing:
            raise ValueError(f"Filing already exists for {canton} {tax_year}")

        # Generate default name if not provided
        if not name:
            name = TaxFilingSession.generate_default_name(tax_year, language)
            if not is_primary:
                name += f" - {canton}"

        # Create filing
        filing = TaxFilingSession(
            id=str(uuid4()),
            user_id=user_id,
            tax_year=tax_year,
            canton=canton,
            municipality=municipality,
            name=name,
            language=language,
            status=FilingStatus.DRAFT,
            is_primary=is_primary,
            parent_filing_id=parent_filing_id,
            profile={},
            completed_questions=[],
            completion_percentage=0,
            question_count=0,
            is_pinned=False,
            is_archived=False
        )

        db.add(filing)
        db.commit()
        db.refresh(filing)

        logger.info(f"Created filing {filing.id} for user {user_id}, year {tax_year}, canton {canton}")
        return filing

    @staticmethod
    def copy_from_previous_year(
        db: Session,
        source_filing_id: str,
        new_year: int,
        user_id: str
    ) -> TaxFilingSession:
        """
        Copy a filing from previous year to new year
        Copies profile data and non-year-specific answers
        Does NOT copy financial amounts (as they change yearly)

        Args:
            db: Database session
            source_filing_id: ID of filing to copy from
            new_year: New tax year
            user_id: User ID (for security verification)

        Returns:
            New TaxFilingSession object

        Raises:
            ValueError: If source filing not found or doesn't belong to user
        """
        # Get source filing
        source = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == source_filing_id,
            TaxFilingSession.user_id == user_id
        ).first()

        if not source:
            raise ValueError("Source filing not found or access denied")

        # Check if filing already exists for new year (no soft delete check)
        existing = db.query(TaxFilingSession).filter(
            and_(
                TaxFilingSession.user_id == user_id,
                TaxFilingSession.tax_year == new_year,
                TaxFilingSession.canton == source.canton
            )
        ).first()

        if existing:
            raise ValueError(f"Filing already exists for {source.canton} {new_year}")

        # Create new filing
        new_filing = TaxFilingService.create_filing(
            db=db,
            user_id=user_id,
            tax_year=new_year,
            canton=source.canton,
            language=source.language,
            municipality=source.municipality,
            is_primary=source.is_primary
        )

        # Copy profile (encrypted JSON)
        # This includes non-financial personal info (civil status, canton, etc.)
        new_filing.profile = source.profile
        new_filing.source_filing_id = source_filing_id

        # Copy non-year-specific answers
        # Exclude financial amounts that change yearly
        EXCLUDE_QUESTIONS = [
            'Q04',   # Number of employers (may change)
            'Q08a',  # Pillar 3a amount
            'Q11a',  # Donation amount
            'Q12a',  # Alimony amount
            'Q13a',  # Medical expense amount
        ]

        source_answers = db.query(TaxAnswer).filter(
            TaxAnswer.filing_session_id == source_filing_id
        ).all()

        copied_count = 0
        for source_answer in source_answers:
            # Only copy non-financial answers
            if source_answer.question_id not in EXCLUDE_QUESTIONS:
                new_answer = TaxAnswer(
                    filing_session_id=new_filing.id,
                    question_id=source_answer.question_id,
                    answer_value=source_answer.answer_value,  # Already encrypted
                    question_text=source_answer.question_text,
                    question_type=source_answer.question_type,
                    is_sensitive=source_answer.is_sensitive
                )
                db.add(new_answer)
                copied_count += 1

        new_filing.question_count = copied_count
        new_filing.completion_percentage = int((copied_count / 14) * 100)  # Estimate

        db.commit()
        db.refresh(new_filing)

        logger.info(f"Copied filing {source_filing_id} to {new_filing.id}, copied {copied_count} answers")
        return new_filing

    @staticmethod
    def get_filing(
        db: Session,
        filing_id: str,
        user_id: str,
        include_relationships: bool = True
    ) -> TaxFilingSession:
        """
        Get a specific filing (with ownership verification)

        Args:
            db: Database session
            filing_id: Filing ID
            user_id: User ID (for security)
            include_relationships: Include answers, insights, calculations

        Returns:
            TaxFilingSession object

        Raises:
            ValueError: If filing not found or access denied
        """
        filing = db.query(TaxFilingSession).filter(
            and_(
                TaxFilingSession.id == filing_id,
                TaxFilingSession.user_id == user_id
            )
        ).first()

        if not filing:
            raise ValueError("Filing not found or access denied")

        return filing

    @staticmethod
    def update_filing(
        db: Session,
        filing_id: str,
        user_id: str,
        **updates
    ) -> TaxFilingSession:
        """
        Update filing fields

        Args:
            db: Database session
            filing_id: Filing ID
            user_id: User ID (for security)
            **updates: Fields to update (name, status, completion_percentage, etc.)

        Returns:
            Updated TaxFilingSession

        Raises:
            ValueError: If filing not found
        """
        filing = TaxFilingService.get_filing(db, filing_id, user_id, include_relationships=False)

        # Update allowed fields
        allowed_fields = [
            'name', 'status', 'completion_percentage', 'current_question_id',
            'completed_questions', 'profile', 'summarized_description',
            'is_pinned', 'is_archived', 'municipality', 'question_count'
        ]

        for key, value in updates.items():
            if key in allowed_fields:
                setattr(filing, key, value)

        filing.updated_at = datetime.utcnow()
        filing.last_activity = datetime.utcnow()

        db.commit()
        db.refresh(filing)

        logger.info(f"Updated filing {filing_id}")
        return filing

    @staticmethod
    def delete_filing(
        db: Session,
        filing_id: str,
        user_id: str,
        hard_delete: bool = True  # Changed default to True - always hard delete
    ) -> bool:
        """
        Delete a filing (ALWAYS hard delete - permanent removal)
        Cannot delete if already submitted

        Args:
            db: Database session
            filing_id: Filing ID
            user_id: User ID (for security)
            hard_delete: Always True - permanently deletes filing

        Returns:
            True if deleted

        Raises:
            ValueError: If filing not found or cannot be deleted
        """
        # Get filing without checking deleted_at since we're doing hard delete
        filing = db.query(TaxFilingSession).filter(
            and_(
                TaxFilingSession.id == filing_id,
                TaxFilingSession.user_id == user_id
            )
        ).first()

        if not filing:
            raise ValueError("Filing not found or access denied")

        if filing.status == FilingStatus.SUBMITTED:
            raise ValueError("Cannot delete submitted filing")

        # ALWAYS do permanent deletion
        # Delete related data first (cascade should handle this, but being explicit)
        answers_deleted = db.query(TaxAnswer).filter(TaxAnswer.filing_session_id == filing_id).delete()
        insights_deleted = db.query(TaxInsight).filter(TaxInsight.filing_session_id == filing_id).delete()
        calculations_deleted = db.query(TaxCalculation).filter(TaxCalculation.filing_session_id == filing_id).delete()

        logger.info(f"Deleted {answers_deleted} answers, {insights_deleted} insights, {calculations_deleted} calculations for filing {filing_id}")

        # Delete the filing itself
        db.delete(filing)

        # Flush to ensure deletions are executed before commit
        db.flush()

        logger.warning(f"Hard deleted filing {filing_id} and all related data")

        db.commit()

        # Verify answers are actually deleted (only in production, not in mocked tests)
        try:
            remaining_answers = db.query(TaxAnswer).filter(TaxAnswer.filing_session_id == filing_id).count()
            if remaining_answers > 0:
                logger.error(f"ERROR: {remaining_answers} answers still exist after deletion of filing {filing_id}!")
        except (TypeError, AttributeError):
            # In tests with mocked db, count() might return Mock - skip verification
            pass

        return True

    @staticmethod
    def restore_filing(
        db: Session,
        filing_id: str,
        user_id: str
    ) -> TaxFilingSession:
        """
        Restore a soft-deleted filing

        Args:
            db: Database session
            filing_id: Filing ID
            user_id: User ID (for security)

        Returns:
            Restored TaxFilingSession

        Raises:
            ValueError: If filing not found
        """
        filing = db.query(TaxFilingSession).filter(
            and_(
                TaxFilingSession.id == filing_id,
                TaxFilingSession.user_id == user_id,
                TaxFilingSession.deleted_at.is_not(None)
            )
        ).first()

        if not filing:
            raise ValueError("Deleted filing not found")

        filing.deleted_at = None
        db.commit()
        db.refresh(filing)

        logger.info(f"Restored filing {filing_id}")
        return filing

    @staticmethod
    def get_filing_statistics(
        db: Session,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get statistics about user's filings

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Dictionary with stats (total filings, by year, by status, etc.)
        """
        filings = db.query(TaxFilingSession).filter(
            TaxFilingSession.user_id == user_id
        ).all()

        stats = {
            'total_filings': len(filings),
            'by_year': {},
            'by_status': {},
            'by_canton': {},
            'multi_canton_years': 0,
            'completed_filings': 0,
            'in_progress_filings': 0
        }

        years_with_multiple_cantons = set()

        for filing in filings:
            # By year
            year = filing.tax_year
            stats['by_year'][year] = stats['by_year'].get(year, 0) + 1

            # By status
            status = filing.status.value if hasattr(filing.status, 'value') else filing.status
            stats['by_status'][status] = stats['by_status'].get(status, 0) + 1

            # By canton
            canton = filing.canton
            stats['by_canton'][canton] = stats['by_canton'].get(canton, 0) + 1

            # Track multi-canton years
            if stats['by_year'][year] > 1:
                years_with_multiple_cantons.add(year)

            # Completion status
            if filing.status == FilingStatus.COMPLETED or filing.status == FilingStatus.SUBMITTED:
                stats['completed_filings'] += 1
            elif filing.status == FilingStatus.IN_PROGRESS:
                stats['in_progress_filings'] += 1

        stats['multi_canton_years'] = len(years_with_multiple_cantons)

        return stats
