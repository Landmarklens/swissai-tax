"""
Unit tests for TaxInsightService
Tests insight generation rules and tracking
"""
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest
from sqlalchemy.orm import Session

from models.tax_answer import TaxAnswer
from models.tax_filing_session import FilingStatus, TaxFilingSession
from models.tax_insight import InsightPriority, InsightType, TaxInsight
from services.tax_insight_service import TaxInsightService


class TestTaxInsightService:
    """Test suite for TaxInsightService"""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session"""
        db = Mock(spec=Session)
        db.query = Mock()
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        return db

    @pytest.fixture
    def sample_filing(self):
        """Create sample filing"""
        return TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            status=FilingStatus.COMPLETED
        )

    def test_check_pillar_3a_opportunity_no_contribution(self, mock_db):
        """Test Pillar 3a insight when user has no contribution"""
        # Setup - user answered NO to Q08
        answer_dict = {
            'Q08': TaxAnswer(
                filing_session_id='filing-123',
                question_id='Q08',
                answer_value='no'
            )
        }

        # Execute
        insight = TaxInsightService._check_pillar_3a_opportunity(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is not None
        assert insight.insight_type == InsightType.DEDUCTION_OPPORTUNITY
        assert insight.priority == InsightPriority.HIGH
        assert 'Pillar 3a' in insight.title
        assert insight.estimated_savings_chf > 0
        assert 'CHF 7,056' in insight.description

    def test_check_pillar_3a_opportunity_partial_contribution(self, mock_db):
        """Test Pillar 3a insight when user has partial contribution"""
        # Setup - user contributed 3000 CHF
        answer_dict = {
            'Q08': TaxAnswer(question_id='Q08', answer_value='yes'),
            'Q08a': TaxAnswer(question_id='Q08a', answer_value='3000')
        }

        # Execute
        insight = TaxInsightService._check_pillar_3a_opportunity(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is not None
        assert 'CHF 4,056' in insight.description  # Remaining amount

    def test_check_pillar_3a_opportunity_max_contribution(self, mock_db):
        """Test no Pillar 3a insight when at maximum"""
        # Setup - user contributed max amount
        answer_dict = {
            'Q08': TaxAnswer(question_id='Q08', answer_value='yes'),
            'Q08a': TaxAnswer(question_id='Q08a', answer_value='7056')
        }

        # Execute
        insight = TaxInsightService._check_pillar_3a_opportunity(
            answer_dict,
            'filing-123'
        )

        # Assert - no insight when already at max
        assert insight is None

    def test_check_multiple_employers(self, mock_db):
        """Test multiple employers insight"""
        # Setup - user has 2 employers
        answer_dict = {
            'Q04': TaxAnswer(question_id='Q04', answer_value='2')
        }

        # Execute
        insight = TaxInsightService._check_multiple_employers(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is not None
        assert insight.insight_type == InsightType.TAX_SAVING_TIP
        assert insight.priority == InsightPriority.MEDIUM
        assert '2 employers' in insight.description
        assert insight.estimated_savings_chf > 0

    def test_check_multiple_employers_single_employer(self, mock_db):
        """Test no insight for single employer"""
        # Setup
        answer_dict = {
            'Q04': TaxAnswer(question_id='Q04', answer_value='1')
        }

        # Execute
        insight = TaxInsightService._check_multiple_employers(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is None

    def test_check_child_tax_credits(self, mock_db):
        """Test child tax credits insight"""
        # Setup - user has 2 children
        answer_dict = {
            'Q06': TaxAnswer(question_id='Q06', answer_value='yes'),
            'Q06a': TaxAnswer(question_id='Q06a', answer_value='2')
        }

        # Execute
        insight = TaxInsightService._check_child_tax_credits(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is not None
        assert insight.insight_type == InsightType.DEDUCTION_OPPORTUNITY
        assert insight.priority == InsightPriority.HIGH
        assert '2 children' in insight.description
        assert insight.estimated_savings_chf > 0
        assert 'CHF 13,400' in insight.description  # 2 * 6700

    def test_check_child_tax_credits_no_children(self, mock_db):
        """Test no insight when no children"""
        # Setup
        answer_dict = {
            'Q06': TaxAnswer(question_id='Q06', answer_value='no')
        }

        # Execute
        insight = TaxInsightService._check_child_tax_credits(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is None

    def test_check_charitable_donations_with_amount(self, mock_db):
        """Test donation insight with amount"""
        # Setup
        answer_dict = {
            'Q11': TaxAnswer(question_id='Q11', answer_value='yes'),
            'Q11a': TaxAnswer(question_id='Q11a', answer_value='1000')
        }

        # Execute
        insight = TaxInsightService._check_charitable_donations(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is not None
        assert insight.insight_type == InsightType.TAX_SAVING_TIP
        assert 'CHF 1,000' in insight.description
        assert insight.estimated_savings_chf == 250  # 25% of 1000

    def test_check_charitable_donations_without_amount(self, mock_db):
        """Test donation insight without amount (missing document)"""
        # Setup
        answer_dict = {
            'Q11': TaxAnswer(question_id='Q11', answer_value='yes')
        }

        # Execute
        insight = TaxInsightService._check_charitable_donations(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is not None
        assert insight.insight_type == InsightType.MISSING_DOCUMENT
        assert 'donation receipts' in insight.description.lower()

    def test_check_property_deductions(self, mock_db):
        """Test property owner deductions insight"""
        # Setup
        answer_dict = {
            'Q10': TaxAnswer(question_id='Q10', answer_value='yes')
        }

        # Execute
        insight = TaxInsightService._check_property_deductions(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is not None
        assert insight.insight_type == InsightType.DEDUCTION_OPPORTUNITY
        assert insight.priority == InsightPriority.HIGH
        assert 'property owner' in insight.description.lower()
        assert insight.estimated_savings_chf == 3000

    def test_check_medical_expenses(self, mock_db):
        """Test medical expenses insight"""
        # Setup
        answer_dict = {
            'Q13': TaxAnswer(question_id='Q13', answer_value='yes'),
            'Q13a': TaxAnswer(question_id='Q13a', answer_value='5000')
        }

        # Execute
        insight = TaxInsightService._check_medical_expenses(
            answer_dict,
            'filing-123'
        )

        # Assert
        assert insight is not None
        assert insight.insight_type == InsightType.DEDUCTION_OPPORTUNITY
        assert 'CHF 5,000' in insight.description
        assert insight.estimated_savings_chf > 0

    def test_generate_all_insights(self, mock_db, sample_filing):
        """Test generating all insights for a filing"""
        # Setup filing
        mock_query_filing = Mock()
        mock_query_filing.filter.return_value = mock_query_filing
        mock_query_filing.first.return_value = sample_filing

        # Setup answers
        answers = [
            TaxAnswer(
                filing_session_id='filing-123',
                question_id='Q08',
                answer_value='no'  # No Pillar 3a -> should generate insight
            ),
            TaxAnswer(
                filing_session_id='filing-123',
                question_id='Q06',
                answer_value='yes'  # Has children -> should generate insight
            ),
            TaxAnswer(
                filing_session_id='filing-123',
                question_id='Q06a',
                answer_value='1'
            )
        ]

        mock_query_answers = Mock()
        mock_query_answers.filter.return_value = mock_query_answers
        mock_query_answers.all.return_value = answers

        def query_side_effect(model):
            if model == TaxFilingSession:
                return mock_query_filing
            elif model == TaxAnswer:
                return mock_query_answers
            return Mock()

        mock_db.query.side_effect = query_side_effect

        # Execute
        insights = TaxInsightService.generate_all_insights(
            db=mock_db,
            filing_session_id='filing-123',
            force_regenerate=False
        )

        # Assert
        assert len(insights) >= 2  # At least Pillar 3a and child credit
        assert mock_db.add.called
        assert mock_db.commit.called

    def test_generate_all_insights_force_regenerate(self, mock_db, sample_filing):
        """Test force regeneration deletes existing insights"""
        # Setup
        mock_query_filing = Mock()
        mock_query_filing.filter.return_value = mock_query_filing
        mock_query_filing.first.return_value = sample_filing

        mock_query_answers = Mock()
        mock_query_answers.filter.return_value = mock_query_answers
        mock_query_answers.all.return_value = []

        mock_query_delete = Mock()
        mock_query_delete.filter.return_value = mock_query_delete
        mock_query_delete.delete.return_value = None

        def query_side_effect(model):
            if model == TaxFilingSession:
                return mock_query_filing
            elif model == TaxAnswer:
                return mock_query_answers
            elif model == TaxInsight:
                return mock_query_delete
            return Mock()

        mock_db.query.side_effect = query_side_effect

        # Execute
        TaxInsightService.generate_all_insights(
            db=mock_db,
            filing_session_id='filing-123',
            force_regenerate=True
        )

        # Assert - delete was called
        assert mock_query_delete.delete.called

    def test_get_filing_insights(self, mock_db, sample_filing):
        """Test getting insights for a filing"""
        # Setup
        insight1 = TaxInsight(
            id='insight-1',
            filing_session_id='filing-123',
            insight_type=InsightType.DEDUCTION_OPPORTUNITY,
            priority=InsightPriority.HIGH,
            title='Test Insight 1',
            description='Description 1'
        )
        insight2 = TaxInsight(
            id='insight-2',
            filing_session_id='filing-123',
            insight_type=InsightType.TAX_SAVING_TIP,
            priority=InsightPriority.MEDIUM,
            title='Test Insight 2',
            description='Description 2'
        )

        mock_query_filing = Mock()
        mock_query_filing.filter.return_value = mock_query_filing
        mock_query_filing.first.return_value = sample_filing

        mock_query_insights = Mock()
        mock_query_insights.filter.return_value = mock_query_insights
        mock_query_insights.order_by.return_value = mock_query_insights
        mock_query_insights.all.return_value = [insight1, insight2]

        def query_side_effect(model):
            if model == TaxFilingSession:
                return mock_query_filing
            elif model == TaxInsight:
                return mock_query_insights
            return Mock()

        mock_db.query.side_effect = query_side_effect

        # Execute
        results = TaxInsightService.get_filing_insights(
            db=mock_db,
            filing_session_id='filing-123',
            user_id='user-456'
        )

        # Assert
        assert len(results) == 2
        assert results[0]['id'] == 'insight-1'
        assert results[1]['id'] == 'insight-2'

    def test_acknowledge_insight(self, mock_db):
        """Test acknowledging an insight"""
        # Setup
        insight = TaxInsight(
            id='insight-1',
            filing_session_id='filing-123',
            insight_type=InsightType.DEDUCTION_OPPORTUNITY,
            priority=InsightPriority.HIGH,
            title='Test',
            description='Test',
            is_acknowledged=0
        )

        filing = TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024
        )

        mock_query = Mock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = insight
        mock_db.query.return_value = mock_query

        # Execute
        result = TaxInsightService.acknowledge_insight(
            db=mock_db,
            insight_id='insight-1',
            user_id='user-456'
        )

        # Assert
        assert result.is_acknowledged == 1
        assert result.acknowledged_at is not None
        assert mock_db.commit.called

    def test_mark_insight_applied(self, mock_db):
        """Test marking insight as applied"""
        # Setup
        insight = TaxInsight(
            id='insight-1',
            filing_session_id='filing-123',
            insight_type=InsightType.DEDUCTION_OPPORTUNITY,
            priority=InsightPriority.HIGH,
            title='Test',
            description='Test',
            is_applied=0
        )

        mock_query = Mock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = insight
        mock_db.query.return_value = mock_query

        # Execute
        result = TaxInsightService.mark_insight_applied(
            db=mock_db,
            insight_id='insight-1',
            user_id='user-456'
        )

        # Assert
        assert result.is_applied == 1
        assert mock_db.commit.called

    def test_get_answer_value_handles_json(self, mock_db):
        """Test _get_answer_value handles JSON strings"""
        # Setup
        answer_dict = {
            'Q01': TaxAnswer(question_id='Q01', answer_value='{"key": "value"}')
        }

        # Execute
        value = TaxInsightService._get_answer_value(answer_dict, 'Q01')

        # Assert - should parse JSON
        assert isinstance(value, dict)
        assert value['key'] == 'value'

    def test_get_answer_value_missing_question(self, mock_db):
        """Test _get_answer_value returns None for missing question"""
        # Setup
        answer_dict = {}

        # Execute
        value = TaxInsightService._get_answer_value(answer_dict, 'Q99')

        # Assert
        assert value is None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
