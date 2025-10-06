"""
Unit tests for Filing Orchestration Service
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4

from services.filing_orchestration_service import FilingOrchestrationService
from models.tax_filing_session import TaxFilingSession, FilingStatus


@pytest.fixture
def mock_db():
    """Mock database session"""
    db = Mock()
    db.add = Mock()
    db.commit = Mock()
    db.refresh = Mock()
    db.query = Mock()
    return db


@pytest.fixture
def filing_service(mock_db):
    """Filing orchestration service with mocked DB"""
    service = FilingOrchestrationService(db=mock_db)
    return service


class TestCreatePrimaryFiling:
    """Tests for create_primary_filing method"""

    def test_create_primary_filing_success(self, filing_service, mock_db):
        """Test successful creation of primary filing"""
        user_id = str(uuid4())
        tax_year = 2024
        canton = 'ZH'
        language = 'en'

        filing = filing_service.create_primary_filing(
            user_id=user_id,
            tax_year=tax_year,
            canton=canton,
            language=language
        )

        # Verify filing was added and committed
        assert mock_db.add.called
        assert mock_db.commit.called
        assert mock_db.refresh.called

        # Verify filing properties
        added_filing = mock_db.add.call_args[0][0]
        assert added_filing.user_id == user_id
        assert added_filing.tax_year == tax_year
        assert added_filing.canton == canton
        assert added_filing.language == language
        assert added_filing.is_primary == True
        assert added_filing.parent_filing_id is None
        assert added_filing.status == FilingStatus.DRAFT

    def test_create_primary_filing_with_custom_name(self, filing_service, mock_db):
        """Test creating primary filing with custom name"""
        custom_name = "My Custom Tax Return 2024"

        filing_service.create_primary_filing(
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            language='en',
            name=custom_name
        )

        added_filing = mock_db.add.call_args[0][0]
        assert added_filing.name == custom_name

    def test_create_primary_filing_generates_default_name(self, filing_service, mock_db):
        """Test that default name is generated when not provided"""
        filing_service.create_primary_filing(
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            language='de'
        )

        added_filing = mock_db.add.call_args[0][0]
        assert 'Steuererklärung 2024' in added_filing.name


class TestAutoCreateSecondaryFilings:
    """Tests for auto_create_secondary_filings method"""

    def test_auto_create_secondary_filings_success(self, filing_service, mock_db):
        """Test successful creation of secondary filings"""
        # Mock primary filing
        primary_filing = TaxFilingSession(
            id=str(uuid4()),
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            language='en',
            is_primary=True,
            profile={'name': 'John Doe', 'ssn': '756.1234.5678.90'}
        )

        # Mock get_filing to return primary
        filing_service.get_filing = Mock(return_value=primary_filing)

        # Mock query to check for existing secondaries (return none)
        mock_db.query.return_value.filter_by.return_value.first.return_value = None

        # Create secondary filings for GE and VS
        property_cantons = ['GE', 'VS']
        secondaries = filing_service.auto_create_secondary_filings(
            primary_filing_id=primary_filing.id,
            property_cantons=property_cantons
        )

        # Verify 2 secondary filings were created
        assert len(secondaries) == 2
        assert mock_db.add.call_count == 2
        assert mock_db.commit.called

        # Verify properties of created filings
        for call in mock_db.add.call_args_list:
            secondary = call[0][0]
            assert secondary.is_primary == False
            assert secondary.parent_filing_id == primary_filing.id
            assert secondary.canton in property_cantons
            assert 'name' in secondary.profile  # Personal data copied

    def test_auto_create_skips_duplicate_canton(self, filing_service, mock_db):
        """Test that secondary filing is not created for primary canton"""
        primary_filing = TaxFilingSession(
            id=str(uuid4()),
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            language='en',
            is_primary=True,
            profile={}
        )

        filing_service.get_filing = Mock(return_value=primary_filing)
        mock_db.query.return_value.filter_by.return_value.first.return_value = None

        # Try to create secondary for same canton as primary
        property_cantons = ['ZH', 'GE']
        secondaries = filing_service.auto_create_secondary_filings(
            primary_filing_id=primary_filing.id,
            property_cantons=property_cantons
        )

        # Should only create 1 secondary (for GE, not ZH)
        assert len(secondaries) == 1
        assert secondaries[0].canton == 'GE'

    def test_auto_create_returns_existing_secondary(self, filing_service, mock_db):
        """Test that existing secondary filing is returned instead of creating duplicate"""
        primary_filing = TaxFilingSession(
            id=str(uuid4()),
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            is_primary=True,
            profile={}
        )

        existing_secondary = TaxFilingSession(
            id=str(uuid4()),
            user_id=primary_filing.user_id,
            tax_year=2024,
            canton='GE',
            is_primary=False,
            parent_filing_id=primary_filing.id,
            profile={}
        )

        filing_service.get_filing = Mock(return_value=primary_filing)
        mock_db.query.return_value.filter_by.return_value.first.return_value = existing_secondary

        secondaries = filing_service.auto_create_secondary_filings(
            primary_filing_id=primary_filing.id,
            property_cantons=['GE']
        )

        # Should return existing, not create new
        assert len(secondaries) == 1
        assert secondaries[0].id == existing_secondary.id
        assert mock_db.add.call_count == 0  # No new filing added

    def test_auto_create_raises_error_for_invalid_primary(self, filing_service, mock_db):
        """Test error handling when primary filing not found"""
        filing_service.get_filing = Mock(return_value=None)

        with pytest.raises(ValueError, match="not found"):
            filing_service.auto_create_secondary_filings(
                primary_filing_id='invalid-id',
                property_cantons=['GE']
            )

    def test_auto_create_raises_error_for_non_primary(self, filing_service, mock_db):
        """Test error handling when filing is not primary"""
        non_primary_filing = TaxFilingSession(
            id=str(uuid4()),
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            is_primary=False,  # Not primary!
            profile={}
        )

        filing_service.get_filing = Mock(return_value=non_primary_filing)

        with pytest.raises(ValueError, match="not a primary filing"):
            filing_service.auto_create_secondary_filings(
                primary_filing_id=non_primary_filing.id,
                property_cantons=['GE']
            )


class TestCopyPersonalData:
    """Tests for _copy_personal_data method"""

    def test_copy_personal_data_includes_correct_fields(self, filing_service):
        """Test that only personal data fields are copied"""
        source_profile = {
            # Should be copied
            'name': 'Doe',
            'firstname': 'John',
            'ssn': '756.1234.5678.90',
            'address': 'Main Street 123',
            'marital_status': 'married',
            'spouse_name': 'Jane',
            'num_children': 2,

            # Should NOT be copied
            'employment_income': 120000,
            'self_employment_income': 50000,
            'rental_income': 24000
        }

        copied = filing_service._copy_personal_data(source_profile)

        # Verify personal fields are copied
        assert copied['name'] == 'Doe'
        assert copied['firstname'] == 'John'
        assert copied['ssn'] == '756.1234.5678.90'
        assert copied['marital_status'] == 'married'

        # Verify income fields are NOT copied
        assert 'employment_income' not in copied
        assert 'self_employment_income' not in copied
        assert 'rental_income' not in copied

    def test_copy_personal_data_handles_missing_fields(self, filing_service):
        """Test that missing fields are handled gracefully"""
        source_profile = {
            'name': 'Doe',
            # Many fields missing
        }

        copied = filing_service._copy_personal_data(source_profile)

        assert copied['name'] == 'Doe'
        assert 'firstname' not in copied  # Not in source, so not copied


class TestSyncPersonalDataToSecondaries:
    """Tests for sync_personal_data_to_secondaries method"""

    def test_sync_updates_all_secondaries(self, filing_service, mock_db):
        """Test that personal data is synced to all secondary filings"""
        primary = TaxFilingSession(
            id=str(uuid4()),
            user_id=str(uuid4()),
            tax_year=2024,
            canton='ZH',
            is_primary=True,
            profile={'name': 'Updated Name', 'address': 'New Address'}
        )

        secondary1 = TaxFilingSession(
            id=str(uuid4()),
            user_id=primary.user_id,
            canton='GE',
            is_primary=False,
            profile={'name': 'Old Name', 'rental_income': 24000}  # Has canton-specific data
        )

        secondary2 = TaxFilingSession(
            id=str(uuid4()),
            user_id=primary.user_id,
            canton='VS',
            is_primary=False,
            profile={}
        )

        filing_service.get_filing = Mock(return_value=primary)
        mock_db.query.return_value.filter_by.return_value.all.return_value = [secondary1, secondary2]

        count = filing_service.sync_personal_data_to_secondaries(primary.id)

        # Verify sync count
        assert count == 2
        assert mock_db.commit.called

        # Verify personal data updated but canton-specific preserved
        assert secondary1.profile['name'] == 'Updated Name'
        assert secondary1.profile['address'] == 'New Address'
        assert secondary1.profile['rental_income'] == 24000  # Preserved


class TestGetFilings:
    """Tests for get_all_user_filings and related methods"""

    def test_get_all_user_filings(self, filing_service, mock_db):
        """Test retrieving all filings for a user"""
        user_id = str(uuid4())
        tax_year = 2024

        primary = TaxFilingSession(user_id=user_id, tax_year=tax_year, canton='ZH', is_primary=True)
        secondary1 = TaxFilingSession(user_id=user_id, tax_year=tax_year, canton='GE', is_primary=False)
        secondary2 = TaxFilingSession(user_id=user_id, tax_year=tax_year, canton='VS', is_primary=False)

        mock_query = Mock()
        mock_query.filter_by.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = [primary, secondary1, secondary2]
        mock_db.query.return_value = mock_query

        filings = filing_service.get_all_user_filings(user_id, tax_year)

        assert len(filings) == 3
        assert filings[0].is_primary == True  # Primary should be first

    def test_get_primary_filing(self, filing_service, mock_db):
        """Test retrieving primary filing"""
        user_id = str(uuid4())
        primary = TaxFilingSession(user_id=user_id, tax_year=2024, is_primary=True)

        mock_db.query.return_value.filter_by.return_value.first.return_value = primary

        result = filing_service.get_primary_filing(user_id, 2024)

        assert result is not None
        assert result.is_primary == True


class TestCantonNames:
    """Tests for canton name translations"""

    def test_get_canton_name_all_languages(self, filing_service):
        """Test canton name translation for all languages"""
        assert filing_service._get_canton_name('ZH', 'en') == 'Zurich'
        assert filing_service._get_canton_name('ZH', 'de') == 'Zürich'
        assert filing_service._get_canton_name('ZH', 'fr') == 'Zurich'
        assert filing_service._get_canton_name('ZH', 'it') == 'Zurigo'

        assert filing_service._get_canton_name('GE', 'en') == 'Geneva'
        assert filing_service._get_canton_name('GE', 'de') == 'Genf'
        assert filing_service._get_canton_name('GE', 'fr') == 'Genève'

    def test_generate_secondary_name_all_languages(self, filing_service):
        """Test secondary filing name generation"""
        name_en = filing_service._generate_secondary_name('Geneva', 2024, 'en')
        assert '2024' in name_en
        assert 'Geneva' in name_en
        assert 'Property' in name_en

        name_de = filing_service._generate_secondary_name('Genf', 2024, 'de')
        assert 'Liegenschaft' in name_de

        name_fr = filing_service._generate_secondary_name('Genève', 2024, 'fr')
        assert 'Propriété' in name_fr
