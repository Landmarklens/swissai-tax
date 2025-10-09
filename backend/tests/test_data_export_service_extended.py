"""
Comprehensive unit tests for data_export_service.py
Target: 90% coverage from 17% baseline
Tests all major methods, edge cases, and error handling
"""
import json
import unittest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, Mock, patch, call
from uuid import uuid4

from services.data_export_service import DataExportService
from models.swisstax import (
    DataExport,
    Filing,
    InterviewAnswer,
    Payment,
    Subscription,
    User,
    UserSettings
)


class TestDataExportServiceExtended(unittest.TestCase):
    """Comprehensive tests for DataExportService"""

    def setUp(self):
        """Set up test fixtures"""
        self.mock_db = MagicMock()
        self.mock_s3_service = MagicMock()
        self.mock_email_service = MagicMock()

        self.service = DataExportService(
            db=self.mock_db,
            s3_service=self.mock_s3_service,
            email_service=self.mock_email_service
        )

        # Create test user
        self.test_user_id = uuid4()
        self.test_user = Mock(spec=User)
        self.test_user.id = self.test_user_id
        self.test_user.email = "test@example.com"
        self.test_user.first_name = "Test"
        self.test_user.last_name = "User"
        self.test_user.phone = "+41791234567"
        self.test_user.preferred_language = "en"
        self.test_user.canton = "ZH"
        self.test_user.municipality = "Zurich"
        self.test_user.provider = "email"
        self.test_user.avatar_url = None
        self.test_user.created_at = datetime(2024, 1, 1)
        self.test_user.updated_at = datetime(2024, 6, 1)
        self.test_user.last_login = datetime(2024, 6, 15)
        self.test_user.is_active = True
        self.test_user.is_grandfathered = False
        self.test_user.is_test_user = False
        self.test_user.two_factor_enabled = True

    # =========================================================================
    # Tests for request_export
    # =========================================================================

    def test_request_export_json_success(self):
        """Test successful JSON export request"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.user_id = self.test_user_id
        mock_export.status = 'pending'
        mock_export.format = 'json'

        self.mock_db.add = MagicMock()
        self.mock_db.commit = MagicMock()
        self.mock_db.refresh = MagicMock(side_effect=lambda x: x)

        with patch('services.data_export_service.DataExport', return_value=mock_export):
            with patch('services.data_export_service.AuditLogService.log_event'):
                result = self.service.request_export(
                    user_id=self.test_user_id,
                    format='json',
                    ip_address='192.168.1.1',
                    user_agent='TestAgent/1.0'
                )

        self.assertEqual(result.id, export_id)
        self.assertEqual(result.format, 'json')
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()

    def test_request_export_csv_success(self):
        """Test successful CSV export request"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.format = 'csv'

        self.mock_db.add = MagicMock()
        self.mock_db.commit = MagicMock()
        self.mock_db.refresh = MagicMock()

        with patch('services.data_export_service.DataExport', return_value=mock_export):
            with patch('services.data_export_service.AuditLogService.log_event'):
                result = self.service.request_export(
                    user_id=self.test_user_id,
                    format='csv',
                    ip_address='10.0.0.1',
                    user_agent='Browser/2.0'
                )

        self.assertEqual(result.format, 'csv')

    def test_request_export_invalid_format(self):
        """Test export request with invalid format"""
        with self.assertRaises(ValueError) as context:
            self.service.request_export(
                user_id=self.test_user_id,
                format='xml',  # Invalid format
                ip_address='192.168.1.1',
                user_agent='TestAgent/1.0'
            )

        self.assertIn("Format must be 'json' or 'csv'", str(context.exception))

    def test_request_export_invalid_format_pdf(self):
        """Test export request with PDF format (not supported)"""
        with self.assertRaises(ValueError) as context:
            self.service.request_export(
                user_id=self.test_user_id,
                format='pdf',
                ip_address='192.168.1.1',
                user_agent='TestAgent/1.0'
            )

        self.assertIn("Format must be 'json' or 'csv'", str(context.exception))

    # =========================================================================
    # Tests for collect_user_data
    # =========================================================================

    def test_collect_user_data_full_profile(self):
        """Test collecting complete user data"""
        # Mock user query
        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = self.test_user

        # Mock settings
        mock_settings = Mock(spec=UserSettings)
        mock_settings.language = 'en'
        mock_settings.date_format = 'DD/MM/YYYY'
        mock_settings.currency = 'CHF'
        mock_settings.default_canton = 'ZH'
        mock_settings.theme = 'light'
        mock_settings.auto_save_enabled = True
        mock_settings.auto_save_interval = 300
        mock_settings.show_tax_tips = True
        mock_settings.enable_ocr = True
        mock_settings.email_notifications = True
        mock_settings.sms_notifications = False
        mock_settings.ocr_enabled = True
        mock_settings.compress_documents = True
        mock_settings.retention_years = 10
        mock_settings.created_at = datetime(2024, 1, 1)
        mock_settings.updated_at = datetime(2024, 6, 1)

        settings_query = MagicMock()
        settings_query.filter.return_value.first.return_value = mock_settings

        # Mock filings
        mock_filing = Mock(spec=Filing)
        mock_filing.id = uuid4()
        mock_filing.tax_year = 2023
        mock_filing.status = 'completed'
        mock_filing.submission_method = 'electronic'
        mock_filing.submitted_at = datetime(2024, 3, 15)
        mock_filing.confirmation_number = 'CONF123'
        mock_filing.refund_amount = Decimal('500.00')
        mock_filing.payment_amount = None
        mock_filing.created_at = datetime(2024, 1, 10)
        mock_filing.updated_at = datetime(2024, 3, 15)

        filings_query = MagicMock()
        filings_query.filter.return_value.all.return_value = [mock_filing]

        # Mock subscriptions
        mock_subscription = Mock(spec=Subscription)
        mock_subscription.id = uuid4()
        mock_subscription.plan_type = 'premium'
        mock_subscription.status = 'active'
        mock_subscription.current_period_start = datetime(2024, 1, 1)
        mock_subscription.current_period_end = datetime(2024, 12, 31)
        mock_subscription.cancel_at_period_end = False
        mock_subscription.canceled_at = None
        mock_subscription.price_chf = Decimal('99.00')
        mock_subscription.currency = 'CHF'
        mock_subscription.created_at = datetime(2024, 1, 1)
        mock_subscription.updated_at = datetime(2024, 1, 1)

        subscriptions_query = MagicMock()
        subscriptions_query.filter.return_value.all.return_value = [mock_subscription]

        # Mock payments
        mock_payment = Mock(spec=Payment)
        mock_payment.id = uuid4()
        mock_payment.amount_chf = Decimal('99.00')
        mock_payment.currency = 'CHF'
        mock_payment.status = 'succeeded'
        mock_payment.payment_method = 'card'
        mock_payment.card_brand = 'visa'
        mock_payment.card_last4 = '4242'
        mock_payment.description = 'Annual subscription'
        mock_payment.created_at = datetime(2024, 1, 1)
        mock_payment.paid_at = datetime(2024, 1, 1)

        payments_query = MagicMock()
        payments_query.filter.return_value.all.return_value = [mock_payment]

        # Configure mock_db.query to return appropriate query objects
        def query_side_effect(model):
            if model == User:
                return user_query
            elif model == UserSettings:
                return settings_query
            elif model == Filing:
                return filings_query
            elif model == Subscription:
                return subscriptions_query
            elif model == Payment:
                return payments_query
            return MagicMock()

        self.mock_db.query.side_effect = query_side_effect

        # Collect data
        data = self.service.collect_user_data(self.test_user_id)

        # Verify structure
        self.assertIn('export_metadata', data)
        self.assertIn('profile', data)
        self.assertIn('settings', data)
        self.assertIn('filings', data)
        self.assertIn('subscriptions', data)
        self.assertIn('payments', data)

        # Verify profile
        self.assertEqual(data['profile']['email'], 'test@example.com')
        self.assertEqual(data['profile']['first_name'], 'Test')
        self.assertEqual(data['profile']['canton'], 'ZH')

        # Verify settings
        self.assertEqual(data['settings']['language'], 'en')
        self.assertEqual(data['settings']['currency'], 'CHF')

        # Verify filings
        self.assertEqual(len(data['filings']), 1)
        self.assertEqual(data['filings'][0]['tax_year'], 2023)

        # Verify subscriptions
        self.assertEqual(len(data['subscriptions']), 1)
        self.assertEqual(data['subscriptions'][0]['plan_type'], 'premium')

        # Verify payments
        self.assertEqual(len(data['payments']), 1)
        self.assertEqual(data['payments'][0]['card_last4'], '4242')

    def test_collect_user_data_user_not_found(self):
        """Test collecting data for non-existent user"""
        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = None
        self.mock_db.query.return_value = user_query

        with self.assertRaises(ValueError) as context:
            self.service.collect_user_data(uuid4())

        self.assertIn("User not found", str(context.exception))

    def test_collect_user_data_no_settings(self):
        """Test collecting data when user has no settings"""
        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = self.test_user

        settings_query = MagicMock()
        settings_query.filter.return_value.first.return_value = None

        def query_side_effect(model):
            if model == User:
                return user_query
            elif model == UserSettings:
                return settings_query
            query = MagicMock()
            query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        data = self.service.collect_user_data(self.test_user_id)

        self.assertIsNone(data['settings'])
        self.assertEqual(len(data['filings']), 0)

    def test_collect_user_data_multiple_filings(self):
        """Test collecting data with multiple filings"""
        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = self.test_user

        # Create multiple filings
        filings = []
        for year in [2021, 2022, 2023]:
            filing = Mock(spec=Filing)
            filing.id = uuid4()
            filing.tax_year = year
            filing.status = 'completed'
            filing.submission_method = 'electronic'
            filing.submitted_at = datetime(year + 1, 3, 15)
            filing.confirmation_number = f'CONF{year}'
            filing.refund_amount = Decimal('100.00')
            filing.payment_amount = None
            filing.created_at = datetime(year + 1, 1, 1)
            filing.updated_at = datetime(year + 1, 3, 15)
            filings.append(filing)

        filings_query = MagicMock()
        filings_query.filter.return_value.all.return_value = filings

        def query_side_effect(model):
            if model == User:
                return user_query
            elif model == Filing:
                return filings_query
            query = MagicMock()
            if model == UserSettings:
                query.filter.return_value.first.return_value = None
            else:
                query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        data = self.service.collect_user_data(self.test_user_id)

        self.assertEqual(len(data['filings']), 3)
        years = [f['tax_year'] for f in data['filings']]
        self.assertEqual(years, [2021, 2022, 2023])

    # =========================================================================
    # Tests for serialization methods
    # =========================================================================

    def test_serialize_settings(self):
        """Test settings serialization"""
        mock_settings = Mock(spec=UserSettings)
        mock_settings.language = 'de'
        mock_settings.date_format = 'DD.MM.YYYY'
        mock_settings.currency = 'EUR'
        mock_settings.default_canton = 'BE'
        mock_settings.theme = 'dark'
        mock_settings.auto_save_enabled = False
        mock_settings.auto_save_interval = 600
        mock_settings.show_tax_tips = False
        mock_settings.enable_ocr = False
        mock_settings.email_notifications = False
        mock_settings.sms_notifications = True
        mock_settings.ocr_enabled = False
        mock_settings.compress_documents = False
        mock_settings.retention_years = 7
        mock_settings.created_at = datetime(2024, 1, 1)
        mock_settings.updated_at = datetime(2024, 6, 1)

        result = self.service._serialize_settings(mock_settings)

        self.assertEqual(result['language'], 'de')
        self.assertEqual(result['currency'], 'EUR')
        self.assertEqual(result['theme'], 'dark')
        self.assertEqual(result['retention_years'], 7)
        self.assertFalse(result['auto_save_enabled'])

    def test_serialize_filing(self):
        """Test filing serialization"""
        filing = Mock(spec=Filing)
        filing.id = uuid4()
        filing.tax_year = 2024
        filing.status = 'draft'
        filing.submission_method = None
        filing.submitted_at = None
        filing.confirmation_number = None
        filing.refund_amount = None
        filing.payment_amount = Decimal('1500.50')
        filing.created_at = datetime(2024, 1, 15)
        filing.updated_at = datetime(2024, 6, 20)

        result = self.service._serialize_filing(filing)

        self.assertEqual(result['tax_year'], 2024)
        self.assertEqual(result['status'], 'draft')
        self.assertIsNone(result['submitted_at'])
        self.assertEqual(result['payment_amount'], 1500.50)

    def test_serialize_subscription_canceled(self):
        """Test subscription serialization for canceled subscription"""
        subscription = Mock(spec=Subscription)
        subscription.id = uuid4()
        subscription.plan_type = 'basic'
        subscription.status = 'canceled'
        subscription.current_period_start = datetime(2024, 1, 1)
        subscription.current_period_end = datetime(2024, 6, 30)
        subscription.cancel_at_period_end = True
        subscription.canceled_at = datetime(2024, 5, 15)
        subscription.price_chf = Decimal('49.00')
        subscription.currency = 'CHF'
        subscription.created_at = datetime(2024, 1, 1)
        subscription.updated_at = datetime(2024, 5, 15)

        result = self.service._serialize_subscription(subscription)

        self.assertEqual(result['status'], 'canceled')
        self.assertTrue(result['cancel_at_period_end'])
        self.assertIsNotNone(result['canceled_at'])

    def test_serialize_payment_with_all_fields(self):
        """Test payment serialization with all fields populated"""
        payment = Mock(spec=Payment)
        payment.id = uuid4()
        payment.amount_chf = Decimal('149.99')
        payment.currency = 'CHF'
        payment.status = 'succeeded'
        payment.payment_method = 'card'
        payment.card_brand = 'mastercard'
        payment.card_last4 = '1234'
        payment.description = 'Premium plan upgrade'
        payment.created_at = datetime(2024, 2, 1)
        payment.paid_at = datetime(2024, 2, 1, 10, 30)

        result = self.service._serialize_payment(payment)

        self.assertEqual(result['amount_chf'], 149.99)
        self.assertEqual(result['card_brand'], 'mastercard')
        self.assertEqual(result['description'], 'Premium plan upgrade')

    # =========================================================================
    # Tests for generate_json_export
    # =========================================================================

    def test_generate_json_export(self):
        """Test JSON export generation"""
        data = {
            'export_metadata': {
                'generated_at': '2024-06-01T10:00:00',
                'user_id': str(self.test_user_id),
                'format_version': '1.0'
            },
            'profile': {
                'email': 'test@example.com',
                'first_name': 'Test'
            }
        }

        result = self.service.generate_json_export(data)

        self.assertIsInstance(result, str)
        parsed = json.loads(result)
        self.assertEqual(parsed['profile']['email'], 'test@example.com')

    def test_generate_json_export_empty_data(self):
        """Test JSON export with empty data"""
        data = {}

        result = self.service.generate_json_export(data)

        self.assertEqual(result, '{}')

    # =========================================================================
    # Tests for generate_csv_export
    # =========================================================================

    def test_generate_csv_export_full_data(self):
        """Test CSV export generation with all sections"""
        data = {
            'profile': {
                'email': 'test@example.com',
                'first_name': 'Test',
                'canton': 'ZH'
            },
            'settings': {
                'language': 'en',
                'currency': 'CHF'
            },
            'filings': [
                {
                    'id': str(uuid4()),
                    'tax_year': 2023,
                    'status': 'completed',
                    'submission_method': 'electronic',
                    'submitted_at': '2024-03-15',
                    'refund_amount': 500.0,
                    'payment_amount': None,
                    'created_at': '2024-01-01'
                }
            ],
            'subscriptions': [
                {
                    'id': str(uuid4()),
                    'plan_type': 'premium',
                    'status': 'active',
                    'price_chf': 99.0,
                    'currency': 'CHF',
                    'current_period_start': '2024-01-01',
                    'current_period_end': '2024-12-31',
                    'created_at': '2024-01-01'
                }
            ],
            'payments': [
                {
                    'id': str(uuid4()),
                    'amount_chf': 99.0,
                    'currency': 'CHF',
                    'status': 'succeeded',
                    'payment_method': 'card',
                    'card_brand': 'visa',
                    'card_last4': '4242',
                    'created_at': '2024-01-01',
                    'paid_at': '2024-01-01'
                }
            ]
        }

        result = self.service.generate_csv_export(data)

        self.assertIn('=== PROFILE ===', result)
        self.assertIn('=== SETTINGS ===', result)
        self.assertIn('=== TAX FILINGS ===', result)
        self.assertIn('=== SUBSCRIPTIONS ===', result)
        self.assertIn('=== PAYMENTS ===', result)
        self.assertIn('test@example.com', result)

    def test_generate_csv_export_empty_sections(self):
        """Test CSV export with some empty sections"""
        data = {
            'profile': {'email': 'test@example.com'},
            'settings': None,
            'filings': [],
            'subscriptions': [],
            'payments': []
        }

        result = self.service.generate_csv_export(data)

        self.assertIn('=== PROFILE ===', result)
        self.assertIn('test@example.com', result)

    # =========================================================================
    # Tests for generate_export
    # =========================================================================

    def test_generate_export_json_success(self):
        """Test successful export generation in JSON format"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.user_id = self.test_user_id
        mock_export.format = 'json'
        mock_export.status = 'pending'

        # Mock export query
        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export

        # Mock user query
        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = self.test_user

        def query_side_effect(model):
            if model == DataExport:
                return export_query
            elif model == User:
                return user_query
            query = MagicMock()
            query.filter.return_value.first.return_value = None
            query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        # Mock S3 operations
        self.mock_s3_service.upload_export_data.return_value = 'exports/user123/export.json'
        self.mock_s3_service.generate_download_url.return_value = 'https://s3.example.com/download'

        # Mock email service
        self.mock_email_service.send_export_ready_email.return_value = {'status': 'success'}

        result = self.service.generate_export(export_id)

        self.assertEqual(result.status, 'completed')
        self.assertIsNotNone(result.completed_at)
        self.mock_s3_service.upload_export_data.assert_called_once()
        self.mock_db.commit.assert_called()

    def test_generate_export_csv_success(self):
        """Test successful export generation in CSV format"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.user_id = self.test_user_id
        mock_export.format = 'csv'
        mock_export.status = 'pending'

        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export

        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = self.test_user

        def query_side_effect(model):
            if model == DataExport:
                return export_query
            elif model == User:
                return user_query
            query = MagicMock()
            query.filter.return_value.first.return_value = None
            query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        self.mock_s3_service.upload_export_data.return_value = 'exports/user123/export.csv'
        self.mock_s3_service.generate_download_url.return_value = 'https://s3.example.com/download'
        self.mock_email_service.send_export_ready_email.return_value = {'status': 'success'}

        result = self.service.generate_export(export_id)

        self.assertEqual(result.status, 'completed')

    def test_generate_export_not_found(self):
        """Test export generation when export doesn't exist"""
        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = None
        self.mock_db.query.return_value = export_query

        with self.assertRaises(ValueError) as context:
            self.service.generate_export(uuid4())

        self.assertIn("Export not found", str(context.exception))

    def test_generate_export_invalid_status_completed(self):
        """Test export generation when export is already completed"""
        mock_export = Mock(spec=DataExport)
        mock_export.status = 'completed'

        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export
        self.mock_db.query.return_value = export_query

        with self.assertRaises(ValueError) as context:
            self.service.generate_export(uuid4())

        self.assertIn("cannot generate", str(context.exception))

    def test_generate_export_invalid_status_failed(self):
        """Test export generation when export has failed"""
        mock_export = Mock(spec=DataExport)
        mock_export.status = 'failed'

        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export
        self.mock_db.query.return_value = export_query

        with self.assertRaises(ValueError) as context:
            self.service.generate_export(uuid4())

        self.assertIn("cannot generate", str(context.exception))

    def test_generate_export_s3_upload_failure(self):
        """Test export generation when S3 upload fails"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.user_id = self.test_user_id
        mock_export.format = 'json'
        mock_export.status = 'pending'

        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export

        def query_side_effect(model):
            if model == DataExport:
                return export_query
            query = MagicMock()
            if model == User:
                query.filter.return_value.first.return_value = self.test_user
            else:
                query.filter.return_value.first.return_value = None
                query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        # S3 upload returns None (failure)
        self.mock_s3_service.upload_export_data.return_value = None

        with self.assertRaises(Exception) as context:
            self.service.generate_export(export_id)

        self.assertIn("Failed to upload export to S3", str(context.exception))
        self.assertEqual(mock_export.status, 'failed')

    def test_generate_export_url_generation_failure(self):
        """Test export generation when URL generation fails"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.user_id = self.test_user_id
        mock_export.format = 'json'
        mock_export.status = 'pending'

        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export

        def query_side_effect(model):
            if model == DataExport:
                return export_query
            query = MagicMock()
            if model == User:
                query.filter.return_value.first.return_value = self.test_user
            else:
                query.filter.return_value.first.return_value = None
                query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        # S3 upload succeeds but URL generation fails
        self.mock_s3_service.upload_export_data.return_value = 'exports/key.json'
        self.mock_s3_service.generate_download_url.return_value = None

        with self.assertRaises(Exception) as context:
            self.service.generate_export(export_id)

        self.assertIn("Failed to generate download URL", str(context.exception))

    def test_generate_export_unsupported_format(self):
        """Test export generation with unsupported format"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.user_id = self.test_user_id
        mock_export.format = 'xml'  # Unsupported
        mock_export.status = 'pending'

        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export

        def query_side_effect(model):
            if model == DataExport:
                return export_query
            query = MagicMock()
            if model == User:
                query.filter.return_value.first.return_value = self.test_user
            else:
                query.filter.return_value.first.return_value = None
                query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        with self.assertRaises(ValueError) as context:
            self.service.generate_export(export_id)

        self.assertIn("Unsupported format", str(context.exception))

    def test_generate_export_email_failure_continues(self):
        """Test that export completes even if email fails"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.user_id = self.test_user_id
        mock_export.format = 'json'
        mock_export.status = 'pending'
        mock_export.file_size_mb = 1.5
        mock_export.completed_at = datetime.utcnow()
        mock_export.expires_at = datetime.utcnow() + timedelta(hours=48)

        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export

        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = self.test_user

        def query_side_effect(model):
            if model == DataExport:
                return export_query
            elif model == User:
                return user_query
            query = MagicMock()
            query.filter.return_value.first.return_value = None
            query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        self.mock_s3_service.upload_export_data.return_value = 'exports/key.json'
        self.mock_s3_service.generate_download_url.return_value = 'https://s3.example.com/download'

        # Email fails
        self.mock_email_service.send_export_ready_email.return_value = {
            'status': 'error',
            'message': 'Email service unavailable'
        }

        result = self.service.generate_export(export_id)

        # Export should still complete successfully
        self.assertEqual(result.status, 'completed')

    def test_generate_export_email_exception_continues(self):
        """Test that export completes even if email raises exception"""
        export_id = uuid4()
        mock_export = Mock(spec=DataExport)
        mock_export.id = export_id
        mock_export.user_id = self.test_user_id
        mock_export.format = 'json'
        mock_export.status = 'pending'
        mock_export.file_size_mb = 1.5
        mock_export.completed_at = datetime.utcnow()
        mock_export.expires_at = datetime.utcnow() + timedelta(hours=48)

        export_query = MagicMock()
        export_query.filter.return_value.first.return_value = mock_export

        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = self.test_user

        def query_side_effect(model):
            if model == DataExport:
                return export_query
            elif model == User:
                return user_query
            query = MagicMock()
            query.filter.return_value.first.return_value = None
            query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        self.mock_s3_service.upload_export_data.return_value = 'exports/key.json'
        self.mock_s3_service.generate_download_url.return_value = 'https://s3.example.com/download'

        # Email raises exception
        self.mock_email_service.send_export_ready_email.side_effect = Exception("SMTP error")

        result = self.service.generate_export(export_id)

        # Export should still complete
        self.assertEqual(result.status, 'completed')

    # =========================================================================
    # Tests for get_user_exports
    # =========================================================================

    def test_get_user_exports_exclude_expired(self):
        """Test getting user exports excluding expired ones"""
        now = datetime.utcnow()

        export1 = Mock(spec=DataExport)
        export1.id = uuid4()
        export1.expires_at = now + timedelta(hours=24)  # Valid
        export1.created_at = now - timedelta(days=1)

        export2 = Mock(spec=DataExport)
        export2.id = uuid4()
        export2.expires_at = now + timedelta(hours=12)  # Valid
        export2.created_at = now - timedelta(hours=12)

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.all.return_value = [export2, export1]

        self.mock_db.query.return_value = mock_query

        with patch('services.data_export_service.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = now
            result = self.service.get_user_exports(self.test_user_id, include_expired=False)

        self.assertEqual(len(result), 2)
        # Check that filter was called to exclude expired
        self.assertTrue(mock_query.filter.called)

    def test_get_user_exports_include_expired(self):
        """Test getting all user exports including expired ones"""
        export1 = Mock(spec=DataExport)
        export1.id = uuid4()

        export2 = Mock(spec=DataExport)
        export2.id = uuid4()

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.all.return_value = [export1, export2]

        self.mock_db.query.return_value = mock_query

        result = self.service.get_user_exports(self.test_user_id, include_expired=True)

        self.assertEqual(len(result), 2)

    def test_get_user_exports_empty(self):
        """Test getting exports when user has none"""
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.all.return_value = []

        self.mock_db.query.return_value = mock_query

        result = self.service.get_user_exports(self.test_user_id)

        self.assertEqual(len(result), 0)

    # =========================================================================
    # Tests for cleanup_expired_exports
    # =========================================================================

    def test_cleanup_expired_exports_success(self):
        """Test cleaning up expired exports"""
        now = datetime.utcnow()

        expired1 = Mock(spec=DataExport)
        expired1.s3_key = 'exports/user1/export1.json'
        expired1.expires_at = now - timedelta(hours=1)
        expired1.status = 'completed'

        expired2 = Mock(spec=DataExport)
        expired2.s3_key = 'exports/user2/export2.csv'
        expired2.expires_at = now - timedelta(days=1)
        expired2.status = 'completed'

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [expired1, expired2]

        self.mock_db.query.return_value = mock_query
        self.mock_s3_service.delete_export.return_value = True

        with patch('services.data_export_service.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = now
            count = self.service.cleanup_expired_exports()

        self.assertEqual(count, 2)
        self.assertEqual(self.mock_db.delete.call_count, 2)
        self.mock_db.commit.assert_called_once()

    def test_cleanup_expired_exports_no_s3_key(self):
        """Test cleanup when export has no S3 key"""
        now = datetime.utcnow()

        expired = Mock(spec=DataExport)
        expired.s3_key = None
        expired.expires_at = now - timedelta(hours=1)
        expired.status = 'completed'

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [expired]

        self.mock_db.query.return_value = mock_query

        with patch('services.data_export_service.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = now
            count = self.service.cleanup_expired_exports()

        self.assertEqual(count, 1)
        self.mock_s3_service.delete_export.assert_not_called()

    def test_cleanup_expired_exports_s3_delete_failure(self):
        """Test cleanup continues even if S3 delete fails"""
        now = datetime.utcnow()

        expired = Mock(spec=DataExport)
        expired.s3_key = 'exports/user1/export1.json'
        expired.expires_at = now - timedelta(hours=1)
        expired.status = 'completed'

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [expired]

        self.mock_db.query.return_value = mock_query
        self.mock_s3_service.delete_export.return_value = False  # Failure

        with patch('services.data_export_service.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = now
            count = self.service.cleanup_expired_exports()

        # Should still delete DB record
        self.assertEqual(count, 1)
        self.mock_db.delete.assert_called_once()

    def test_cleanup_expired_exports_none_expired(self):
        """Test cleanup when no exports are expired"""
        now = datetime.utcnow()

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = []

        self.mock_db.query.return_value = mock_query

        with patch('services.data_export_service.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = now
            count = self.service.cleanup_expired_exports()

        self.assertEqual(count, 0)
        self.mock_db.delete.assert_not_called()

    # =========================================================================
    # Tests for initialization with dependencies
    # =========================================================================

    def test_service_initialization_with_defaults(self):
        """Test service initialization with default S3 and email services"""
        with patch('services.data_export_service.get_storage_service') as mock_get_s3:
            with patch('services.data_export_service.get_gdpr_email_service') as mock_get_email:
                mock_get_s3.return_value = MagicMock()
                mock_get_email.return_value = MagicMock()

                service = DataExportService(db=self.mock_db)

                self.assertIsNotNone(service.s3)
                self.assertIsNotNone(service.email)
                mock_get_s3.assert_called_once()
                mock_get_email.assert_called_once()

    # =========================================================================
    # Edge cases and error handling
    # =========================================================================

    def test_collect_user_data_with_none_timestamps(self):
        """Test collecting data when timestamps are None"""
        user = Mock(spec=User)
        user.id = self.test_user_id
        user.email = "test@example.com"
        user.first_name = None
        user.last_name = None
        user.phone = None
        user.preferred_language = None
        user.canton = None
        user.municipality = None
        user.provider = None
        user.avatar_url = None
        user.created_at = None
        user.updated_at = None
        user.last_login = None
        user.is_active = True
        user.is_grandfathered = False
        user.is_test_user = False
        user.two_factor_enabled = False

        user_query = MagicMock()
        user_query.filter.return_value.first.return_value = user

        def query_side_effect(model):
            if model == User:
                return user_query
            query = MagicMock()
            query.filter.return_value.first.return_value = None
            query.filter.return_value.all.return_value = []
            return query

        self.mock_db.query.side_effect = query_side_effect

        data = self.service.collect_user_data(self.test_user_id)

        self.assertIsNone(data['profile']['created_at'])
        self.assertIsNone(data['profile']['updated_at'])
        self.assertIsNone(data['profile']['last_login'])

    def test_serialize_filing_with_none_amounts(self):
        """Test filing serialization when amounts are None"""
        filing = Mock(spec=Filing)
        filing.id = uuid4()
        filing.tax_year = 2024
        filing.status = 'draft'
        filing.submission_method = None
        filing.submitted_at = None
        filing.confirmation_number = None
        filing.refund_amount = None
        filing.payment_amount = None
        filing.created_at = None
        filing.updated_at = None

        result = self.service._serialize_filing(filing)

        self.assertIsNone(result['refund_amount'])
        self.assertIsNone(result['payment_amount'])


if __name__ == '__main__':
    unittest.main()
