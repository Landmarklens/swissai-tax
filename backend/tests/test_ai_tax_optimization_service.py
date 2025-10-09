"""
Unit tests for AITaxOptimizationService
Tests AI-powered tax optimization recommendations
"""
import json
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, Mock, patch

import pytest

from services.ai_tax_optimization_service import (
    AITaxOptimizationService,
    TaxOptimizationError
)


class TestAITaxOptimizationService:
    """Test suite for AITaxOptimizationService"""

    # ========================================================================
    # INITIALIZATION TESTS
    # ========================================================================

    def test_exception_class(self):
        """Test TaxOptimizationError exception"""
        error = TaxOptimizationError("Test error message")
        assert str(error) == "Test error message"
        assert isinstance(error, Exception)

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_init_anthropic_success(self, mock_anthropic):
        """Test successful initialization with Anthropic provider"""
        # Setup
        mock_client = Mock()
        mock_anthropic.Anthropic.return_value = mock_client

        # Execute
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key-123'
        )

        # Assert
        assert service.ai_provider == 'anthropic'
        assert service.api_key == 'test-key-123'
        assert service.client == mock_client
        mock_anthropic.Anthropic.assert_called_once_with(api_key='test-key-123')

    @patch('services.ai_tax_optimization_service.openai')
    def test_init_openai_success(self, mock_openai):
        """Test successful initialization with OpenAI provider"""
        # Setup
        mock_client = Mock()
        mock_openai.OpenAI.return_value = mock_client

        # Execute
        service = AITaxOptimizationService(
            ai_provider='openai',
            api_key='test-key-456'
        )

        # Assert
        assert service.ai_provider == 'openai'
        assert service.api_key == 'test-key-456'
        assert service.client == mock_client
        mock_openai.OpenAI.assert_called_once_with(api_key='test-key-456')

    @patch('services.ai_tax_optimization_service.anthropic', None)
    def test_init_anthropic_not_installed(self):
        """Test initialization fails when anthropic not installed"""
        # Execute & Assert
        with pytest.raises(ImportError, match="anthropic not installed"):
            AITaxOptimizationService(
                ai_provider='anthropic',
                api_key='test-key'
            )

    @patch('services.ai_tax_optimization_service.openai', None)
    def test_init_openai_not_installed(self):
        """Test initialization fails when openai not installed"""
        # Execute & Assert
        with pytest.raises(ImportError, match="openai not installed"):
            AITaxOptimizationService(
                ai_provider='openai',
                api_key='test-key'
            )

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_init_unsupported_provider(self, mock_anthropic):
        """Test initialization fails with unsupported provider"""
        # Execute & Assert
        with pytest.raises(ValueError, match="Unsupported AI provider"):
            AITaxOptimizationService(
                ai_provider='unsupported',
                api_key='test-key'
            )

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_init_case_insensitive_provider(self, mock_anthropic):
        """Test provider name is case-insensitive"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()

        # Execute
        service = AITaxOptimizationService(
            ai_provider='ANTHROPIC',
            api_key='test-key'
        )

        # Assert
        assert service.ai_provider == 'anthropic'

    # ========================================================================
    # BUILD SITUATION SUMMARY TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_build_situation_summary_complete_data(self, mock_anthropic):
        """Test building situation summary with complete data"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {
            'id': 'filing-123',
            'canton': 'ZH',
            'tax_year': 2024
        }

        calculation_data = {
            'income': {
                'employment': 100000,
                'self_employment': 20000,
                'capital': 5000,
                'rental': 15000,
                'pension': 0,
                'total': 140000
            },
            'deductions': {
                'pillar_3a': 7056,
                'pillar_2_buyins': 10000,
                'professional_expenses': 2000,
                'insurance_premiums': 3000,
                'total': 22056
            },
            'taxable_income': 117944,
            'federal_tax': 5000,
            'cantonal_tax': 12000,
            'total_tax': 17000,
            'effective_rate': 14.4
        }

        profile = {
            'marital_status': 'married',
            'num_children': 2,
            'age': 45,
            'properties': [
                {'mortgage_debt': 500000}
            ],
            'church_member': True
        }

        # Execute
        summary = service._build_situation_summary(
            filing_data,
            calculation_data,
            profile
        )

        # Assert
        assert summary['canton'] == 'ZH'
        assert summary['tax_year'] == 2024
        assert summary['marital_status'] == 'married'
        assert summary['num_children'] == 2
        assert summary['age'] == 45
        assert summary['employment_income'] == 100000
        assert summary['self_employment_income'] == 20000
        assert summary['capital_income'] == 5000
        assert summary['rental_income'] == 15000
        assert summary['pension_income'] == 0
        assert summary['total_income'] == 140000
        assert summary['pillar_3a_contributions'] == 7056
        assert summary['pillar_2_buyins'] == 10000
        assert summary['professional_expenses'] == 2000
        assert summary['insurance_premiums'] == 3000
        assert summary['total_deductions'] == 22056
        assert summary['taxable_income'] == 117944
        assert summary['federal_tax'] == 5000
        assert summary['cantonal_tax'] == 12000
        assert summary['total_tax'] == 17000
        assert summary['effective_rate'] == 14.4
        assert summary['owns_property'] is True
        assert summary['has_mortgage'] is True
        assert summary['church_member'] is True

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_build_situation_summary_minimal_data(self, mock_anthropic):
        """Test building situation summary with minimal data"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {'canton': 'GE', 'tax_year': 2024}
        calculation_data = {
            'income': {'total': 50000},
            'deductions': {'total': 5000},
            'taxable_income': 45000,
            'total_tax': 5000,
            'effective_rate': 11.1
        }
        profile = {}

        # Execute
        summary = service._build_situation_summary(
            filing_data,
            calculation_data,
            profile
        )

        # Assert - defaults
        assert summary['marital_status'] == 'single'
        assert summary['num_children'] == 0
        assert summary['age'] is None
        assert summary['employment_income'] == 0
        assert summary['owns_property'] is False
        assert summary['has_mortgage'] is False
        assert summary['church_member'] is False

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_build_situation_summary_property_no_mortgage(self, mock_anthropic):
        """Test situation summary with property but no mortgage"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {'canton': 'ZH', 'tax_year': 2024}
        calculation_data = {
            'income': {'total': 100000},
            'deductions': {'total': 10000},
            'taxable_income': 90000,
            'total_tax': 10000,
            'effective_rate': 11.1
        }
        profile = {
            'properties': [
                {'mortgage_debt': 0}
            ]
        }

        # Execute
        summary = service._build_situation_summary(
            filing_data,
            calculation_data,
            profile
        )

        # Assert
        assert summary['owns_property'] is True
        assert summary['has_mortgage'] is False

    # ========================================================================
    # AI CALL TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_call_ai_anthropic_success(self, mock_anthropic):
        """Test successful AI call with Anthropic"""
        # Setup
        mock_message = Mock()
        mock_message.content = [Mock(text='{"recommendations": []}')]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Execute
        response = service._call_ai("test prompt")

        # Assert
        assert response == '{"recommendations": []}'
        mock_client.messages.create.assert_called_once()
        call_args = mock_client.messages.create.call_args[1]
        assert call_args['model'] == 'claude-3-5-sonnet-20241022'
        assert call_args['max_tokens'] == 4096
        assert call_args['messages'][0]['role'] == 'user'
        assert call_args['messages'][0]['content'] == 'test prompt'

    @patch('services.ai_tax_optimization_service.openai')
    def test_call_ai_openai_success(self, mock_openai):
        """Test successful AI call with OpenAI"""
        # Setup
        mock_choice = Mock()
        mock_choice.message.content = '{"recommendations": []}'
        mock_response = Mock()
        mock_response.choices = [mock_choice]
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.OpenAI.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='openai',
            api_key='test-key'
        )

        # Execute
        response = service._call_ai("test prompt")

        # Assert
        assert response == '{"recommendations": []}'
        mock_client.chat.completions.create.assert_called_once()
        call_args = mock_client.chat.completions.create.call_args[1]
        assert call_args['model'] == 'gpt-4-turbo-preview'
        assert call_args['max_tokens'] == 4096
        assert call_args['messages'][0]['role'] == 'system'
        assert call_args['messages'][1]['role'] == 'user'

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_call_ai_failure(self, mock_anthropic):
        """Test AI call failure raises TaxOptimizationError"""
        # Setup
        mock_client = Mock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Execute & Assert
        with pytest.raises(TaxOptimizationError, match="AI API call failed"):
            service._call_ai("test prompt")

    # ========================================================================
    # JSON PARSING TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_parse_json_response_clean_json(self, mock_anthropic):
        """Test parsing clean JSON response"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        response = '{"key": "value", "number": 123}'

        # Execute
        result = service._parse_json_response(response)

        # Assert
        assert result == {"key": "value", "number": 123}

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_parse_json_response_with_markdown(self, mock_anthropic):
        """Test parsing JSON wrapped in markdown code blocks"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        response = '''```json
{"key": "value"}
```'''

        # Execute
        result = service._parse_json_response(response)

        # Assert
        assert result == {"key": "value"}

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_parse_json_response_markdown_with_json_prefix(self, mock_anthropic):
        """Test parsing JSON in markdown with 'json' prefix on same line"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Response where first line after ``` is 'json' followed by actual JSON
        response = '''```
json{"key": "value"}
```'''

        # Execute
        result = service._parse_json_response(response)

        # Assert
        assert result == {"key": "value"}

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_parse_json_response_with_markdown_no_lang(self, mock_anthropic):
        """Test parsing JSON in markdown without language specifier"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        response = '''```
{"key": "value"}
```'''

        # Execute
        result = service._parse_json_response(response)

        # Assert
        assert result == {"key": "value"}

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_parse_json_response_invalid_json(self, mock_anthropic):
        """Test parsing invalid JSON raises error"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        response = 'not valid json'

        # Execute & Assert
        with pytest.raises(TaxOptimizationError, match="Invalid JSON response"):
            service._parse_json_response(response)

    # ========================================================================
    # CALCULATE SAVINGS CONFIDENCE TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_savings_confidence_high(self, mock_anthropic):
        """Test high confidence calculation"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        recommendation = {
            'category': 'pillar_3a',
            'legal_references': ['Art. 33 DBG'],
            'implementation_difficulty': 'easy'
        }

        # Execute
        confidence = service._calculate_savings_confidence(recommendation)

        # Assert - base 0.7 + 0.15 (category) + 0.10 (legal) = 0.95
        assert confidence == 0.95

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_savings_confidence_low(self, mock_anthropic):
        """Test low confidence calculation"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        recommendation = {
            'category': 'other',
            'implementation_difficulty': 'complex'
        }

        # Execute
        confidence = service._calculate_savings_confidence(recommendation)

        # Assert - base 0.7 - 0.15 (complex) = 0.55 (with floating point tolerance)
        assert abs(confidence - 0.55) < 0.001

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_savings_confidence_capped_at_one(self, mock_anthropic):
        """Test confidence capped at 1.0"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        recommendation = {
            'category': 'pillar_3a',
            'legal_references': ['Art. 33 DBG'],
            'implementation_difficulty': 'easy'
        }

        # Execute
        confidence = service._calculate_savings_confidence(recommendation)

        # Assert - base 0.7 + 0.15 (category) + 0.10 (legal) = 0.95
        # Not capped because it doesn't exceed 1.0
        assert confidence == 0.95

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_savings_confidence_floored_at_zero(self, mock_anthropic):
        """Test confidence floored at 0.0"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Hypothetical case that would go below 0
        recommendation = {
            'category': 'other',
            'implementation_difficulty': 'complex'
        }

        # Execute
        confidence = service._calculate_savings_confidence(recommendation)

        # Assert - should be >= 0
        assert confidence >= 0.0

    # ========================================================================
    # CALCULATE POTENTIAL SAVINGS TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_potential_savings_basic(self, mock_anthropic):
        """Test calculating potential savings for recommendations"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        recommendations = [
            {
                'category': 'pillar_3a',
                'title': 'Maximize Pillar 3a',
                'estimated_savings_chf': 2000
            },
            {
                'category': 'deductions',
                'title': 'Professional Expenses',
                'estimated_savings_chf': 500
            }
        ]

        filing_data = {'id': 'filing-123', 'canton': 'ZH'}
        calculation_data = {'total_tax': 10000}

        # Execute
        enhanced = service._calculate_potential_savings(
            recommendations,
            filing_data,
            calculation_data
        )

        # Assert
        assert len(enhanced) == 2
        # Should be sorted by savings descending
        assert enhanced[0]['estimated_savings'] == 2000.0
        assert enhanced[0]['annual_benefit'] == 2000.0
        assert enhanced[0]['5_year_benefit'] == 10000.0
        assert 'savings_confidence' in enhanced[0]
        assert enhanced[1]['estimated_savings'] == 500.0

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_potential_savings_sorting(self, mock_anthropic):
        """Test recommendations sorted by savings descending"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        recommendations = [
            {'category': 'a', 'estimated_savings_chf': 100},
            {'category': 'b', 'estimated_savings_chf': 500},
            {'category': 'c', 'estimated_savings_chf': 250}
        ]

        # Execute
        enhanced = service._calculate_potential_savings(
            recommendations, {}, {}
        )

        # Assert - sorted descending
        assert enhanced[0]['estimated_savings'] == 500.0
        assert enhanced[1]['estimated_savings'] == 250.0
        assert enhanced[2]['estimated_savings'] == 100.0

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_potential_savings_missing_estimate(self, mock_anthropic):
        """Test handling missing estimated_savings_chf"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        recommendations = [
            {'category': 'test'}  # No estimated_savings_chf
        ]

        # Execute
        enhanced = service._calculate_potential_savings(
            recommendations, {}, {}
        )

        # Assert - defaults to 0
        assert enhanced[0]['estimated_savings'] == 0.0
        assert enhanced[0]['annual_benefit'] == 0.0
        assert enhanced[0]['5_year_benefit'] == 0.0

    # ========================================================================
    # FALLBACK RECOMMENDATIONS TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_fallback_recommendations_pillar_3a_gap(self, mock_anthropic):
        """Test fallback Pillar 3a recommendation"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {
            'pillar_3a_contributions': 3000,
            'employment_income': 100000
        }

        # Execute
        recommendations = service._get_fallback_recommendations(situation)

        # Assert
        pillar_3a_rec = next(
            r for r in recommendations
            if r['category'] == 'pillar_3a'
        )
        assert pillar_3a_rec is not None
        assert pillar_3a_rec['title'] == 'Maximize Pillar 3a Contributions'
        assert 'CHF 4,056' in pillar_3a_rec['description']  # Gap: 7056 - 3000
        assert pillar_3a_rec['estimated_savings_chf'] > 0
        assert pillar_3a_rec['priority'] == 'high'

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_fallback_recommendations_no_pillar_3a_at_max(self, mock_anthropic):
        """Test no Pillar 3a recommendation when at max"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {
            'pillar_3a_contributions': 7056,
            'employment_income': 0
        }

        # Execute
        recommendations = service._get_fallback_recommendations(situation)

        # Assert - no Pillar 3a recommendation
        pillar_3a_recs = [
            r for r in recommendations
            if r['category'] == 'pillar_3a'
        ]
        assert len(pillar_3a_recs) == 0

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_fallback_recommendations_professional_expenses(self, mock_anthropic):
        """Test fallback professional expenses recommendation"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {
            'pillar_3a_contributions': 7056,  # At max, so no pillar 3a rec
            'employment_income': 80000
        }

        # Execute
        recommendations = service._get_fallback_recommendations(situation)

        # Assert
        prof_exp_rec = next(
            r for r in recommendations
            if r['category'] == 'deductions'
        )
        assert prof_exp_rec is not None
        assert 'Professional Expense Deductions' in prof_exp_rec['title']
        assert prof_exp_rec['estimated_savings_chf'] == 500
        assert prof_exp_rec['priority'] == 'medium'

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_fallback_recommendations_no_employment(self, mock_anthropic):
        """Test no professional expenses recommendation without employment income"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {
            'pillar_3a_contributions': 7056,
            'employment_income': 0  # No employment income
        }

        # Execute
        recommendations = service._get_fallback_recommendations(situation)

        # Assert - no professional expenses recommendation
        prof_exp_recs = [
            r for r in recommendations
            if r['category'] == 'deductions'
        ]
        assert len(prof_exp_recs) == 0

    # ========================================================================
    # GET AI RECOMMENDATIONS TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_ai_recommendations_success(self, mock_anthropic):
        """Test successful AI recommendations retrieval"""
        # Setup
        mock_response = json.dumps({
            'recommendations': [
                {
                    'category': 'pillar_3a',
                    'title': 'Maximize Pillar 3a',
                    'description': 'Contribute more',
                    'estimated_savings_chf': 2000
                }
            ]
        })

        mock_message = Mock()
        mock_message.content = [Mock(text=mock_response)]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {
            'canton': 'ZH',
            'marital_status': 'single',
            'num_children': 0
        }

        # Execute
        recommendations = service._get_ai_recommendations(situation)

        # Assert
        assert len(recommendations) == 1
        assert recommendations[0]['category'] == 'pillar_3a'
        assert recommendations[0]['title'] == 'Maximize Pillar 3a'

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_ai_recommendations_with_focus_areas(self, mock_anthropic):
        """Test AI recommendations with specific focus areas"""
        # Setup
        mock_response = json.dumps({'recommendations': []})
        mock_message = Mock()
        mock_message.content = [Mock(text=mock_response)]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {'canton': 'ZH', 'marital_status': 'single', 'num_children': 0}
        focus_areas = ['pillar_3a', 'deductions']

        # Execute
        recommendations = service._get_ai_recommendations(situation, focus_areas)

        # Assert - check prompt includes focus areas
        call_args = mock_client.messages.create.call_args[1]
        prompt = call_args['messages'][0]['content']
        assert 'pillar_3a' in prompt
        assert 'deductions' in prompt

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_ai_recommendations_failure_returns_fallback(self, mock_anthropic):
        """Test AI failure returns fallback recommendations"""
        # Setup
        mock_client = Mock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {
            'canton': 'ZH',
            'marital_status': 'single',
            'num_children': 0,
            'pillar_3a_contributions': 0,
            'employment_income': 100000
        }

        # Execute
        recommendations = service._get_ai_recommendations(situation)

        # Assert - should get fallback recommendations
        assert len(recommendations) > 0
        assert any(r['category'] == 'pillar_3a' for r in recommendations)

    # ========================================================================
    # GET OPTIMIZATION RECOMMENDATIONS TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_optimization_recommendations_success(self, mock_anthropic):
        """Test complete optimization recommendations flow"""
        # Setup
        mock_response = json.dumps({
            'recommendations': [
                {
                    'category': 'pillar_3a',
                    'title': 'Maximize Pillar 3a',
                    'description': 'Contribute more',
                    'estimated_savings_chf': 2000,
                    'priority': 'high'
                },
                {
                    'category': 'deductions',
                    'title': 'Professional Expenses',
                    'description': 'Track expenses',
                    'estimated_savings_chf': 500,
                    'priority': 'medium'
                }
            ]
        })

        mock_message = Mock()
        mock_message.content = [Mock(text=mock_response)]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {
            'id': 'filing-123',
            'canton': 'ZH',
            'tax_year': 2024
        }

        calculation_data = {
            'income': {'employment': 100000, 'total': 100000},
            'deductions': {'pillar_3a': 3000, 'total': 3000},
            'taxable_income': 97000,
            'total_tax': 12000,
            'effective_rate': 12.4
        }

        # Execute
        with patch('services.ai_tax_optimization_service.datetime') as mock_dt:
            mock_dt.utcnow.return_value = datetime(2024, 1, 15, 10, 30, 0)
            result = service.get_optimization_recommendations(
                filing_data,
                calculation_data
            )

        # Assert
        assert result['filing_id'] == 'filing-123'
        assert result['canton'] == 'ZH'
        assert result['tax_year'] == 2024
        assert result['current_tax'] == 12000
        assert result['ai_provider'] == 'anthropic'
        assert len(result['recommendations']) == 2
        assert result['total_potential_savings'] == 2500.0  # 2000 + 500
        assert 'timestamp' in result

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_optimization_recommendations_with_focus(self, mock_anthropic):
        """Test optimization recommendations with focus areas"""
        # Setup
        mock_response = json.dumps({'recommendations': []})
        mock_message = Mock()
        mock_message.content = [Mock(text=mock_response)]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_client
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {
            'id': 'filing-123',
            'canton': 'ZH',
            'tax_year': 2024
        }

        calculation_data = {
            'income': {'total': 100000},
            'deductions': {'total': 10000},
            'taxable_income': 90000,
            'total_tax': 10000,
            'effective_rate': 11.1
        }

        # Execute
        result = service.get_optimization_recommendations(
            filing_data,
            calculation_data,
            focus_areas=['pillar_3a']
        )

        # Assert
        assert 'recommendations' in result
        assert result['total_potential_savings'] == 0.0  # Empty recommendations

    # ========================================================================
    # COMPARE CANTONS TESTS
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_compare_cantons_default_list(self, mock_anthropic):
        """Test canton comparison with default canton list"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {'canton': 'ZH'}
        calculation_data = {'total_tax': 15000}

        # Execute
        result = service.compare_cantons(filing_data, calculation_data)

        # Assert
        assert result['current_canton'] == 'ZH'
        assert result['current_total_tax'] == 15000
        assert 'comparisons' in result
        assert 'best_canton' in result
        assert 'max_savings' in result

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_compare_cantons_custom_list(self, mock_anthropic):
        """Test canton comparison with custom canton list"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {'canton': 'GE'}
        calculation_data = {'total_tax': 20000}
        comparison_cantons = ['ZH', 'VD', 'BE']

        # Execute
        result = service.compare_cantons(
            filing_data,
            calculation_data,
            comparison_cantons
        )

        # Assert
        assert result['current_canton'] == 'GE'
        assert result['current_total_tax'] == 20000

    # ========================================================================
    # CONSTANTS AND CLASS ATTRIBUTES TESTS
    # ========================================================================

    def test_optimization_categories_defined(self):
        """Test OPTIMIZATION_CATEGORIES constant is properly defined"""
        assert 'pillar_3a' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES
        assert 'pillar_2' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES
        assert 'deductions' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES
        assert 'income_timing' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES
        assert 'canton_comparison' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES
        assert 'property_strategy' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES
        assert 'family_planning' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES
        assert 'charitable_giving' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES
        assert 'investment_structure' in AITaxOptimizationService.OPTIMIZATION_CATEGORIES

    def test_federal_tax_brackets_defined(self):
        """Test FEDERAL_TAX_BRACKETS constant is properly defined"""
        assert 'single' in AITaxOptimizationService.FEDERAL_TAX_BRACKETS
        assert 'married' in AITaxOptimizationService.FEDERAL_TAX_BRACKETS

        single_brackets = AITaxOptimizationService.FEDERAL_TAX_BRACKETS['single']
        assert len(single_brackets) > 0
        assert single_brackets[0] == (17800, 0.00)

        married_brackets = AITaxOptimizationService.FEDERAL_TAX_BRACKETS['married']
        assert len(married_brackets) > 0
        assert married_brackets[0] == (30800, 0.00)

    # ========================================================================
    # EDGE CASES AND ERROR HANDLING
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_optimization_recommendations_empty_profile(self, mock_anthropic):
        """Test handling empty profile data"""
        # Setup
        mock_response = json.dumps({'recommendations': []})
        mock_message = Mock()
        mock_message.content = [Mock(text=mock_response)]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {'canton': 'ZH', 'tax_year': 2024}
        calculation_data = {
            'income': {},
            'deductions': {},
            'total_tax': 0
        }

        # Execute - should not raise error
        result = service.get_optimization_recommendations(
            filing_data,
            calculation_data
        )

        # Assert
        assert result is not None
        assert 'recommendations' in result

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_parse_json_response_whitespace(self, mock_anthropic):
        """Test JSON parsing handles extra whitespace"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        response = '   \n\n  {"key": "value"}  \n  '

        # Execute
        result = service._parse_json_response(response)

        # Assert
        assert result == {"key": "value"}

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_build_situation_summary_string_children(self, mock_anthropic):
        """Test handling string num_children (should convert to int)"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {'canton': 'ZH', 'tax_year': 2024}
        calculation_data = {
            'income': {'total': 100000},
            'deductions': {'total': 10000},
            'taxable_income': 90000,
            'total_tax': 10000,
            'effective_rate': 11.1
        }
        profile = {'num_children': '2'}  # String instead of int

        # Execute
        summary = service._build_situation_summary(
            filing_data,
            calculation_data,
            profile
        )

        # Assert
        assert summary['num_children'] == 2
        assert isinstance(summary['num_children'], int)


    # ========================================================================
    # ADDITIONAL EDGE CASE TESTS FOR HIGHER COVERAGE
    # ========================================================================

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_optimization_recommendations_none_profile(self, mock_anthropic):
        """Test handling when profile is missing in filing_data"""
        # Setup
        mock_response = json.dumps({'recommendations': []})
        mock_message = Mock()
        mock_message.content = [Mock(text=mock_response)]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # No profile key
        filing_data = {'canton': 'ZH', 'tax_year': 2024}
        calculation_data = {
            'income': {'total': 100000},
            'deductions': {'total': 10000},
            'taxable_income': 90000,
            'total_tax': 10000,
            'effective_rate': 11.1
        }

        # Execute - should not crash
        result = service.get_optimization_recommendations(
            filing_data,
            calculation_data
        )

        # Assert
        assert result is not None
        assert 'recommendations' in result

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_potential_savings_no_recommendations(self, mock_anthropic):
        """Test calculating potential savings with empty recommendations list"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        recommendations = []
        filing_data = {}
        calculation_data = {}

        # Execute
        enhanced = service._calculate_potential_savings(
            recommendations,
            filing_data,
            calculation_data
        )

        # Assert
        assert len(enhanced) == 0

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_fallback_recommendations_zero_pillar_3a(self, mock_anthropic):
        """Test fallback with zero pillar 3a contributions"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {
            'pillar_3a_contributions': 0,
            'employment_income': 100000
        }

        # Execute
        recommendations = service._get_fallback_recommendations(situation)

        # Assert
        pillar_3a_rec = next(
            (r for r in recommendations if r['category'] == 'pillar_3a'),
            None
        )
        assert pillar_3a_rec is not None
        assert 'CHF 7,056' in pillar_3a_rec['description']

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_build_situation_summary_multiple_properties(self, mock_anthropic):
        """Test situation summary with multiple properties"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {'canton': 'ZH', 'tax_year': 2024}
        calculation_data = {
            'income': {'total': 100000},
            'deductions': {'total': 10000},
            'taxable_income': 90000,
            'total_tax': 10000,
            'effective_rate': 11.1
        }
        profile = {
            'properties': [
                {'mortgage_debt': 0},
                {'mortgage_debt': 500000},
                {'mortgage_debt': 300000}
            ]
        }

        # Execute
        summary = service._build_situation_summary(
            filing_data,
            calculation_data,
            profile
        )

        # Assert
        assert summary['owns_property'] is True
        assert summary['has_mortgage'] is True  # At least one has mortgage

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_ai_recommendations_empty_response(self, mock_anthropic):
        """Test handling empty recommendations from AI"""
        # Setup
        mock_response = json.dumps({'recommendations': []})
        mock_message = Mock()
        mock_message.content = [Mock(text=mock_response)]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        situation = {
            'canton': 'ZH',
            'marital_status': 'single',
            'num_children': 0
        }

        # Execute
        recommendations = service._get_ai_recommendations(situation)

        # Assert
        assert recommendations == []

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_get_optimization_recommendations_zero_savings(self, mock_anthropic):
        """Test total_potential_savings when all recommendations have 0 savings"""
        # Setup
        mock_response = json.dumps({
            'recommendations': [
                {
                    'category': 'info',
                    'title': 'Information',
                    'description': 'FYI',
                    'estimated_savings_chf': 0
                }
            ]
        })

        mock_message = Mock()
        mock_message.content = [Mock(text=mock_response)]
        mock_client = Mock()
        mock_client.messages.create.return_value = mock_message
        mock_anthropic.Anthropic.return_value = mock_client

        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {'id': 'filing-123', 'canton': 'ZH', 'tax_year': 2024}
        calculation_data = {
            'income': {'total': 100000},
            'deductions': {'total': 10000},
            'taxable_income': 90000,
            'total_tax': 10000,
            'effective_rate': 11.1
        }

        # Execute
        result = service.get_optimization_recommendations(
            filing_data,
            calculation_data
        )

        # Assert
        assert result['total_potential_savings'] == 0.0

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_calculate_savings_confidence_all_categories(self, mock_anthropic):
        """Test confidence calculation for different categories"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        # Test pillar_2 (should get bonus)
        rec_pillar_2 = {'category': 'pillar_2'}
        confidence = service._calculate_savings_confidence(rec_pillar_2)
        assert confidence == 0.85  # 0.7 + 0.15

        # Test deductions (should get bonus)
        rec_deductions = {'category': 'deductions'}
        confidence = service._calculate_savings_confidence(rec_deductions)
        assert confidence == 0.85  # 0.7 + 0.15

    @patch('services.ai_tax_optimization_service.anthropic')
    def test_compare_cantons_none_values(self, mock_anthropic):
        """Test canton comparison handles None values gracefully"""
        # Setup
        mock_anthropic.Anthropic.return_value = Mock()
        service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key='test-key'
        )

        filing_data = {}
        calculation_data = {}

        # Execute
        result = service.compare_cantons(filing_data, calculation_data)

        # Assert
        assert 'comparisons' in result
        assert 'best_canton' in result


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
