"""
Filing Orchestration Service - Manages multi-canton tax filings

This service handles the creation and coordination of multiple tax filing sessions
for users who need to file in multiple cantons (e.g., primary residence + properties
in other cantons).

Key responsibilities:
- Create primary (main) tax filings
- Auto-create secondary filings when properties detected in other cantons
- Manage data inheritance between primary and secondary filings
- Sync personal data changes from primary to all secondary filings
- Retrieve all filings for a user
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from models.tax_filing_session import TaxFilingSession, FilingStatus
from db.session import get_db

logger = logging.getLogger(__name__)


class FilingOrchestrationService:
    """Service for managing multi-canton tax filing sessions"""

    def __init__(self, db: Session = None):
        self.db = db or next(get_db())

    def create_primary_filing(
        self,
        user_id: str,
        tax_year: int,
        canton: str,
        language: str = 'en',
        name: str = None
    ) -> TaxFilingSession:
        """
        Create a primary (main) tax filing session for a user.

        Args:
            user_id: User ID
            tax_year: Tax year (e.g., 2024)
            canton: Primary residence canton (e.g., 'ZH', 'BE', 'GE')
            language: User's language preference ('en', 'de', 'fr', 'it')
            name: Optional custom name for the filing

        Returns:
            Created TaxFilingSession instance
        """
        # Generate default name if not provided
        if not name:
            name = TaxFilingSession.generate_default_name(tax_year, language)

        filing = TaxFilingSession(
            id=str(uuid4()),
            user_id=user_id,
            tax_year=tax_year,
            canton=canton,
            language=language,
            name=name,
            is_primary=True,
            parent_filing_id=None,
            source_filing_id=None,
            status=FilingStatus.DRAFT,
            profile={},  # Will be populated during interview
            completion_percentage=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.db.add(filing)
        self.db.commit()
        self.db.refresh(filing)

        logger.info(
            f"Created primary filing {filing.id} for user {user_id} "
            f"in canton {canton}, tax year {tax_year}"
        )

        return filing

    def auto_create_secondary_filings(
        self,
        primary_filing_id: str,
        property_cantons: List[str]
    ) -> List[TaxFilingSession]:
        """
        Auto-create secondary filings when user owns properties in other cantons.

        This is triggered when user answers Q06a (property canton selection).

        Args:
            primary_filing_id: ID of primary filing session
            property_cantons: List of canton codes where user owns property (e.g., ['GE', 'VS'])

        Returns:
            List of created secondary TaxFilingSession instances
        """
        # Get primary filing
        primary = self.get_filing(primary_filing_id)
        if not primary:
            raise ValueError(f"Primary filing {primary_filing_id} not found")

        if not primary.is_primary:
            raise ValueError(f"Filing {primary_filing_id} is not a primary filing")

        secondary_filings = []

        for canton in property_cantons:
            # Skip if canton is same as primary
            if canton == primary.canton:
                logger.info(
                    f"Skipping secondary filing creation for {canton} "
                    f"(same as primary canton)"
                )
                continue

            # Check if secondary filing already exists for this canton
            existing = self.db.query(TaxFilingSession).filter_by(
                user_id=primary.user_id,
                tax_year=primary.tax_year,
                canton=canton,
                is_primary=False,
                parent_filing_id=primary.id,
                deleted_at=None
            ).first()

            if existing:
                logger.info(
                    f"Secondary filing already exists for user {primary.user_id} "
                    f"in canton {canton}, tax year {primary.tax_year}"
                )
                secondary_filings.append(existing)
                continue

            # Create new secondary filing
            canton_name = self._get_canton_name(canton, primary.language)
            secondary_name = self._generate_secondary_name(
                canton_name,
                primary.tax_year,
                primary.language
            )

            secondary = TaxFilingSession(
                id=str(uuid4()),
                user_id=primary.user_id,
                tax_year=primary.tax_year,
                canton=canton,
                language=primary.language,
                name=secondary_name,
                is_primary=False,
                parent_filing_id=primary.id,
                source_filing_id=primary.id,
                status=FilingStatus.DRAFT,
                # Copy personal data from primary filing
                profile=self._copy_personal_data(primary.profile),
                completion_percentage=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            self.db.add(secondary)
            secondary_filings.append(secondary)

            logger.info(
                f"Created secondary filing {secondary.id} for user {primary.user_id} "
                f"in canton {canton}, tax year {primary.tax_year}"
            )

        self.db.commit()

        # Refresh all secondary filings
        for filing in secondary_filings:
            self.db.refresh(filing)

        return secondary_filings

    def _copy_personal_data(self, source_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Copy only relevant personal data from primary to secondary filing.

        Personal data that applies to all filings:
        - Name, address, SSN (identify the person)
        - Marital status, spouse details (affects tax calculation in all cantons)
        - Children (affects deductions in all cantons)
        - Bank accounts (might be relevant for all filings)

        Data that does NOT get copied:
        - Employment income (only in primary)
        - Self-employment income (only in primary)
        - Property income (canton-specific)

        Args:
            source_profile: Profile dictionary from primary filing

        Returns:
            Filtered dictionary with only personal data
        """
        copied_fields = [
            # Personal identification
            'name',
            'firstname',
            'address',
            'zip',
            'city',
            'ssn',
            'birthdate',
            'nationality',
            'phone',
            'email',

            # Marital status & family
            'marital_status',
            'spouse_name',
            'spouse_firstname',
            'spouse_ssn',
            'spouse_birthdate',
            'spouse_income',  # Might affect joint filing

            # Children
            'has_children',
            'children',
            'num_children',

            # Bank accounts (might be relevant for all cantons)
            'bank_accounts',
            'iban',

            # Church membership (affects church tax in all cantons)
            'church_member',
            'religion'
        ]

        copied_profile = {}
        for field in copied_fields:
            if field in source_profile:
                copied_profile[field] = source_profile[field]

        return copied_profile

    def sync_personal_data_to_secondaries(self, primary_filing_id: str) -> int:
        """
        Sync personal data from primary filing to all secondary filings.

        This should be called whenever personal data changes in the primary filing
        (e.g., user updates their address during interview).

        Args:
            primary_filing_id: ID of primary filing

        Returns:
            Number of secondary filings updated
        """
        # Get primary filing
        primary = self.get_filing(primary_filing_id)
        if not primary or not primary.is_primary:
            raise ValueError(f"Invalid primary filing {primary_filing_id}")

        # Get all secondary filings
        secondaries = self.db.query(TaxFilingSession).filter_by(
            parent_filing_id=primary_filing_id,
            deleted_at=None
        ).all()

        if not secondaries:
            logger.info(f"No secondary filings found for primary {primary_filing_id}")
            return 0

        # Update each secondary filing
        updated_count = 0
        personal_data = self._copy_personal_data(primary.profile)

        for secondary in secondaries:
            # Update personal data fields while preserving canton-specific data
            secondary.profile.update(personal_data)
            secondary.updated_at = datetime.utcnow()
            updated_count += 1

        self.db.commit()

        logger.info(
            f"Synced personal data from primary {primary_filing_id} "
            f"to {updated_count} secondary filings"
        )

        return updated_count

    def get_filing(self, filing_id: str) -> Optional[TaxFilingSession]:
        """
        Get a single filing by ID.

        Args:
            filing_id: Filing session ID

        Returns:
            TaxFilingSession or None if not found
        """
        return self.db.query(TaxFilingSession).filter_by(
            id=filing_id,
            deleted_at=None
        ).first()

    def get_all_user_filings(
        self,
        user_id: str,
        tax_year: int,
        include_archived: bool = False
    ) -> List[TaxFilingSession]:
        """
        Get all filings for a user (primary + secondary).

        Args:
            user_id: User ID
            tax_year: Tax year
            include_archived: Whether to include archived filings

        Returns:
            List of TaxFilingSession instances, ordered by is_primary DESC
        """
        query = self.db.query(TaxFilingSession).filter_by(
            user_id=user_id,
            tax_year=tax_year,
            deleted_at=None
        )

        if not include_archived:
            query = query.filter_by(is_archived=False)

        filings = query.order_by(
            TaxFilingSession.is_primary.desc(),
            TaxFilingSession.canton
        ).all()

        logger.info(
            f"Retrieved {len(filings)} filings for user {user_id}, "
            f"tax year {tax_year}"
        )

        return filings

    def get_primary_filing(
        self,
        user_id: str,
        tax_year: int
    ) -> Optional[TaxFilingSession]:
        """
        Get the primary filing for a user and tax year.

        Args:
            user_id: User ID
            tax_year: Tax year

        Returns:
            Primary TaxFilingSession or None
        """
        return self.db.query(TaxFilingSession).filter_by(
            user_id=user_id,
            tax_year=tax_year,
            is_primary=True,
            deleted_at=None
        ).first()

    def get_secondary_filings(
        self,
        primary_filing_id: str
    ) -> List[TaxFilingSession]:
        """
        Get all secondary filings linked to a primary filing.

        Args:
            primary_filing_id: ID of primary filing

        Returns:
            List of secondary TaxFilingSession instances
        """
        return self.db.query(TaxFilingSession).filter_by(
            parent_filing_id=primary_filing_id,
            deleted_at=None
        ).order_by(TaxFilingSession.canton).all()

    def delete_secondary_filing(self, filing_id: str) -> bool:
        """
        Soft delete a secondary filing.

        Args:
            filing_id: ID of secondary filing to delete

        Returns:
            True if deleted, False if not found or is primary filing
        """
        filing = self.get_filing(filing_id)

        if not filing:
            logger.warning(f"Filing {filing_id} not found")
            return False

        if filing.is_primary:
            logger.warning(f"Cannot delete primary filing {filing_id}")
            return False

        # Soft delete
        filing.deleted_at = datetime.utcnow()
        filing.updated_at = datetime.utcnow()

        self.db.commit()

        logger.info(f"Soft deleted secondary filing {filing_id}")
        return True

    def _get_canton_name(self, canton_code: str, language: str) -> str:
        """
        Get canton name in specified language.

        Args:
            canton_code: Canton code (e.g., 'ZH', 'GE')
            language: Language code ('en', 'de', 'fr', 'it')

        Returns:
            Canton name in specified language
        """
        canton_names = {
            'ZH': {'en': 'Zurich', 'de': 'Zürich', 'fr': 'Zurich', 'it': 'Zurigo'},
            'BE': {'en': 'Bern', 'de': 'Bern', 'fr': 'Berne', 'it': 'Berna'},
            'LU': {'en': 'Lucerne', 'de': 'Luzern', 'fr': 'Lucerne', 'it': 'Lucerna'},
            'UR': {'en': 'Uri', 'de': 'Uri', 'fr': 'Uri', 'it': 'Uri'},
            'SZ': {'en': 'Schwyz', 'de': 'Schwyz', 'fr': 'Schwytz', 'it': 'Svitto'},
            'OW': {'en': 'Obwalden', 'de': 'Obwalden', 'fr': 'Obwald', 'it': 'Obvaldo'},
            'NW': {'en': 'Nidwalden', 'de': 'Nidwalden', 'fr': 'Nidwald', 'it': 'Nidvaldo'},
            'GL': {'en': 'Glarus', 'de': 'Glarus', 'fr': 'Glaris', 'it': 'Glarona'},
            'ZG': {'en': 'Zug', 'de': 'Zug', 'fr': 'Zoug', 'it': 'Zugo'},
            'FR': {'en': 'Fribourg', 'de': 'Freiburg', 'fr': 'Fribourg', 'it': 'Friburgo'},
            'SO': {'en': 'Solothurn', 'de': 'Solothurn', 'fr': 'Soleure', 'it': 'Soletta'},
            'BS': {'en': 'Basel-Stadt', 'de': 'Basel-Stadt', 'fr': 'Bâle-Ville', 'it': 'Basilea Città'},
            'BL': {'en': 'Basel-Landschaft', 'de': 'Basel-Landschaft', 'fr': 'Bâle-Campagne', 'it': 'Basilea Campagna'},
            'SH': {'en': 'Schaffhausen', 'de': 'Schaffhausen', 'fr': 'Schaffhouse', 'it': 'Sciaffusa'},
            'AR': {'en': 'Appenzell Ausserrhoden', 'de': 'Appenzell Ausserrhoden', 'fr': 'Appenzell Rhodes-Extérieures', 'it': 'Appenzello Esterno'},
            'AI': {'en': 'Appenzell Innerrhoden', 'de': 'Appenzell Innerrhoden', 'fr': 'Appenzell Rhodes-Intérieures', 'it': 'Appenzello Interno'},
            'SG': {'en': 'St. Gallen', 'de': 'St. Gallen', 'fr': 'Saint-Gall', 'it': 'San Gallo'},
            'GR': {'en': 'Graubünden', 'de': 'Graubünden', 'fr': 'Grisons', 'it': 'Grigioni'},
            'AG': {'en': 'Aargau', 'de': 'Aargau', 'fr': 'Argovie', 'it': 'Argovia'},
            'TG': {'en': 'Thurgau', 'de': 'Thurgau', 'fr': 'Thurgovie', 'it': 'Turgovia'},
            'TI': {'en': 'Ticino', 'de': 'Tessin', 'fr': 'Tessin', 'it': 'Ticino'},
            'VD': {'en': 'Vaud', 'de': 'Waadt', 'fr': 'Vaud', 'it': 'Vaud'},
            'VS': {'en': 'Valais', 'de': 'Wallis', 'fr': 'Valais', 'it': 'Vallese'},
            'NE': {'en': 'Neuchâtel', 'de': 'Neuenburg', 'fr': 'Neuchâtel', 'it': 'Neuchâtel'},
            'GE': {'en': 'Geneva', 'de': 'Genf', 'fr': 'Genève', 'it': 'Ginevra'},
            'JU': {'en': 'Jura', 'de': 'Jura', 'fr': 'Jura', 'it': 'Giura'}
        }

        return canton_names.get(canton_code, {}).get(language, canton_code)

    def _generate_secondary_name(
        self,
        canton_name: str,
        tax_year: int,
        language: str
    ) -> str:
        """
        Generate name for secondary filing.

        Args:
            canton_name: Canton name in user's language
            tax_year: Tax year
            language: Language code

        Returns:
            Generated name string
        """
        templates = {
            'en': f'{tax_year} Tax Return - {canton_name} (Property)',
            'de': f'Steuererklärung {tax_year} - {canton_name} (Liegenschaft)',
            'fr': f'Déclaration fiscale {tax_year} - {canton_name} (Propriété)',
            'it': f'Dichiarazione fiscale {tax_year} - {canton_name} (Proprietà)'
        }

        return templates.get(language, templates['en'])
