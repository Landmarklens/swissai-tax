"""
Unit tests for TaxFilingService
Tests CRUD operations, copy functionality, and statistics
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from sqlalchemy.orm import Session

from services.tax_filing_service import TaxFilingService
from models.tax_filing_session import TaxFilingSession, FilingStatus
from models.tax_answer import TaxAnswer


class TestTaxFilingService:
    """Test suite for TaxFilingService"""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session"""
        db = Mock(spec=Session)
        db.query = Mock()
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        db.delete = Mock()
        return db

    @pytest.fixture
    def sample_filing(self):
        """Create sample filing object"""
        return TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            municipality='Zurich',
            name='2024 Tax Return',
            language='en',
            status=FilingStatus.DRAFT,
            is_primary=True,
            completion_percentage=0,
            question_count=0,
            profile={},
            completed_questions=[]
        )

    def test_list_user_filings_grouped_by_year(self, mock_db, sample_filing):
        """Test listing filings grouped by year"""
        # Setup
        filing_2024 = sample_filing
        filing_2023 = TaxFilingSession(
            id='filing-789',
            user_id='user-456',
            tax_year=2023,
            canton='ZH',
            name='2023 Tax Return',
            status=FilingStatus.COMPLETED
        )

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = [filing_2024, filing_2023]
        mock_db.query.return_value = mock_query

        # Execute
        result = TaxFilingService.list_user_filings(
            db=mock_db,
            user_id='user-456'
        )

        # Assert
        assert 2024 in result
        assert 2023 in result
        assert len(result[2024]) == 1
        assert len(result[2023]) == 1
        assert result[2024][0]['id'] == 'filing-123'
        assert result[2023][0]['id'] == 'filing-789'

    def test_list_user_filings_filters_by_year(self, mock_db, sample_filing):
        """Test filtering filings by year"""
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = [sample_filing]
        mock_db.query.return_value = mock_query

        # Execute
        result = TaxFilingService.list_user_filings(
            db=mock_db,
            user_id='user-456',
            year=2024
        )

        # Assert - should have called filter with year
        assert mock_query.filter.called

    def test_create_filing_success(self, mock_db):
        """Test successful filing creation"""
        # Setup - no existing filing
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        # Execute
        filing = TaxFilingService.create_filing(
            db=mock_db,
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            language='en'
        )

        # Assert
        assert mock_db.add.called
        assert mock_db.commit.called
        assert filing.user_id == 'user-456'
        assert filing.tax_year == 2024
        assert filing.canton == 'ZH'
        assert filing.status == FilingStatus.DRAFT

    def test_create_filing_duplicate_raises_error(self, mock_db, sample_filing):
        """Test that creating duplicate filing raises ValueError"""
        # Setup - existing filing
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = sample_filing
        mock_db.query.return_value = mock_query

        # Execute & Assert
        with pytest.raises(ValueError, match="Filing already exists"):
            TaxFilingService.create_filing(
                db=mock_db,
                user_id='user-456',
                tax_year=2024,
                canton='ZH'
            )

    def test_create_filing_generates_default_name(self, mock_db):
        """Test that default name is generated if not provided"""
        # Setup
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        # Execute
        filing = TaxFilingService.create_filing(
            db=mock_db,
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            language='en'
        )

        # Assert
        assert '2024' in filing.name
        assert filing.name == '2024 Tax Return'

    def test_copy_from_previous_year_success(self, mock_db, sample_filing):
        """Test copying filing from previous year"""
        # Setup source filing
        source_filing = sample_filing
        source_filing.profile = {'civil_status': 'married', 'canton': 'ZH'}

        # Setup answers
        answer1 = TaxAnswer(
            filing_session_id=source_filing.id,
            question_id='Q01',
            answer_value='married',
            is_sensitive=False
        )
        answer2 = TaxAnswer(
            filing_session_id=source_filing.id,
            question_id='Q08a',  # Financial - should be excluded
            answer_value='5000',
            is_sensitive=True
        )

        # Mock queries
        def query_side_effect(model):
            mock_query = Mock()
            mock_query.filter.return_value = mock_query

            if model == TaxFilingSession:
                # First call returns source, second returns None (no existing)
                mock_query.first.side_effect = [source_filing, None]
            elif model == TaxAnswer:
                mock_query.all.return_value = [answer1, answer2]

            return mock_query

        mock_db.query.side_effect = query_side_effect

        # Execute
        new_filing = TaxFilingService.copy_from_previous_year(
            db=mock_db,
            source_filing_id='filing-123',
            new_year=2025,
            user_id='user-456'
        )

        # Assert
        assert mock_db.add.called
        assert mock_db.commit.called
        assert new_filing.tax_year == 2025
        assert new_filing.source_filing_id == 'filing-123'
        # Should copy profile
        assert new_filing.profile == source_filing.profile

    def test_copy_from_previous_year_source_not_found(self, mock_db):
        """Test copying raises error if source not found"""
        # Setup
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        # Execute & Assert
        with pytest.raises(ValueError, match="Source filing not found"):
            TaxFilingService.copy_from_previous_year(
                db=mock_db,
                source_filing_id='nonexistent',
                new_year=2025,
                user_id='user-456'
            )

    def test_copy_from_previous_year_duplicate_exists(self, mock_db, sample_filing):
        """Test copying raises error if target year filing exists"""
        # Setup
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        # First call returns source, second returns existing filing
        mock_query.first.side_effect = [sample_filing, sample_filing]
        mock_db.query.return_value = mock_query

        # Execute & Assert
        with pytest.raises(ValueError, match="Filing already exists"):
            TaxFilingService.copy_from_previous_year(
                db=mock_db,
                source_filing_id='filing-123',
                new_year=2025,
                user_id='user-456'
            )

    def test_get_filing_success(self, mock_db, sample_filing):
        """Test getting filing by ID"""
        # Setup
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = sample_filing
        mock_db.query.return_value = mock_query

        # Execute
        result = TaxFilingService.get_filing(
            db=mock_db,
            filing_id='filing-123',
            user_id='user-456'
        )

        # Assert
        assert result.id == 'filing-123'
        assert result.user_id == 'user-456'

    def test_get_filing_not_found(self, mock_db):
        """Test getting non-existent filing raises error"""
        # Setup
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        # Execute & Assert
        with pytest.raises(ValueError, match="Filing not found"):
            TaxFilingService.get_filing(
                db=mock_db,
                filing_id='nonexistent',
                user_id='user-456'
            )

    def test_update_filing_success(self, mock_db, sample_filing):
        """Test updating filing fields"""
        # Setup
        with patch.object(TaxFilingService, 'get_filing', return_value=sample_filing):
            # Execute
            result = TaxFilingService.update_filing(
                db=mock_db,
                filing_id='filing-123',
                user_id='user-456',
                name='Updated Name',
                completion_percentage=50
            )

            # Assert
            assert mock_db.commit.called
            assert sample_filing.name == 'Updated Name'
            assert sample_filing.completion_percentage == 50

    def test_delete_filing_soft_delete(self, mock_db, sample_filing):
        """Test soft delete sets deleted_at timestamp"""
        # Setup
        with patch.object(TaxFilingService, 'get_filing', return_value=sample_filing):
            # Execute
            result = TaxFilingService.delete_filing(
                db=mock_db,
                filing_id='filing-123',
                user_id='user-456',
                hard_delete=False
            )

            # Assert
            assert result is True
            assert sample_filing.deleted_at is not None
            assert mock_db.commit.called
            assert not mock_db.delete.called

    def test_delete_filing_hard_delete(self, mock_db, sample_filing):
        """Test hard delete removes from database"""
        # Setup
        with patch.object(TaxFilingService, 'get_filing', return_value=sample_filing):
            # Execute
            result = TaxFilingService.delete_filing(
                db=mock_db,
                filing_id='filing-123',
                user_id='user-456',
                hard_delete=True
            )

            # Assert
            assert result is True
            assert mock_db.delete.called
            assert mock_db.commit.called

    def test_delete_filing_submitted_raises_error(self, mock_db, sample_filing):
        """Test deleting submitted filing raises error"""
        # Setup
        sample_filing.status = FilingStatus.SUBMITTED
        with patch.object(TaxFilingService, 'get_filing', return_value=sample_filing):
            # Execute & Assert
            with pytest.raises(ValueError, match="Cannot delete submitted filing"):
                TaxFilingService.delete_filing(
                    db=mock_db,
                    filing_id='filing-123',
                    user_id='user-456'
                )

    def test_restore_filing_success(self, mock_db, sample_filing):
        """Test restoring soft-deleted filing"""
        # Setup - deleted filing
        sample_filing.deleted_at = datetime.utcnow()
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = sample_filing
        mock_db.query.return_value = mock_query

        # Execute
        result = TaxFilingService.restore_filing(
            db=mock_db,
            filing_id='filing-123',
            user_id='user-456'
        )

        # Assert
        assert result.deleted_at is None
        assert mock_db.commit.called

    def test_get_filing_statistics(self, mock_db):
        """Test calculating filing statistics"""
        # Setup
        filing1 = TaxFilingSession(
            id='f1',
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            status=FilingStatus.COMPLETED
        )
        filing2 = TaxFilingSession(
            id='f2',
            user_id='user-456',
            tax_year=2024,
            canton='GE',
            status=FilingStatus.IN_PROGRESS
        )
        filing3 = TaxFilingSession(
            id='f3',
            user_id='user-456',
            tax_year=2023,
            canton='ZH',
            status=FilingStatus.COMPLETED
        )

        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [filing1, filing2, filing3]
        mock_db.query.return_value = mock_query

        # Execute
        stats = TaxFilingService.get_filing_statistics(
            db=mock_db,
            user_id='user-456'
        )

        # Assert
        assert stats['total_filings'] == 3
        assert stats['by_year'][2024] == 2
        assert stats['by_year'][2023] == 1
        assert stats['by_canton']['ZH'] == 2
        assert stats['by_canton']['GE'] == 1
        assert stats['completed_filings'] == 2
        assert stats['in_progress_filings'] == 1
        assert stats['multi_canton_years'] == 1  # 2024 has multiple cantons


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
