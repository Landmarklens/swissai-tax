"""Unit tests for EmailService (AWS SES integration)."""

from unittest.mock import MagicMock, patch, Mock
import pytest
from botocore.exceptions import ClientError

from services.ses_emailjs_replacement import EmailService


class TestEmailService:
    """Test EmailService SES integration."""

    @pytest.fixture
    def mock_boto3_client(self):
        """Create a mock boto3 SES client."""
        mock_client = MagicMock()
        mock_client.send_email.return_value = {
            'MessageId': 'test-message-id-12345'
        }
        return mock_client

    @pytest.fixture
    def email_service(self, mock_boto3_client):
        """Create EmailService instance with mocked SES client."""
        with patch('services.ses_emailjs_replacement.boto3.client') as mock_boto:
            mock_boto.return_value = mock_boto3_client
            service = EmailService()
            return service

    @pytest.mark.asyncio
    async def test_send_password_reset_email_success(self, email_service, mock_boto3_client):
        """Test successful password reset email sending."""
        to_email = "test@example.com"
        reset_link = "https://swissai.tax/reset-password?token=abc123"

        result = await email_service.send_password_reset_email(to_email, reset_link)

        # Verify SES send_email was called
        mock_boto3_client.send_email.assert_called_once()
        call_args = mock_boto3_client.send_email.call_args[1]

        # Verify email structure
        assert call_args['Destination']['ToAddresses'] == [to_email]
        assert 'SwissAI Tax' in call_args['Message']['Subject']['Data']
        assert reset_link in call_args['Message']['Body']['Html']['Data']
        assert reset_link in call_args['Message']['Body']['Text']['Data']

        # Verify response
        assert result['status'] == 'success'
        assert result['status_code'] == 200
        assert result['message_id'] == 'test-message-id-12345'

    @pytest.mark.asyncio
    async def test_send_password_reset_email_client_error(self, email_service, mock_boto3_client):
        """Test password reset email sending with SES ClientError."""
        to_email = "test@example.com"
        reset_link = "https://swissai.tax/reset-password?token=abc123"

        # Mock ClientError
        error_response = {
            'Error': {
                'Code': 'MessageRejected',
                'Message': 'Email address is not verified'
            }
        }
        mock_boto3_client.send_email.side_effect = ClientError(error_response, 'SendEmail')

        result = await email_service.send_password_reset_email(to_email, reset_link)

        # Verify error response
        assert result['status'] == 'error'
        assert result['status_code'] == 500
        assert 'MessageRejected' in result['message']

    @pytest.mark.asyncio
    async def test_send_password_reset_email_uninitialized_client(self):
        """Test email sending when SES client is not initialized."""
        with patch('services.ses_emailjs_replacement.boto3.client') as mock_boto:
            mock_boto.side_effect = Exception("AWS credentials not found")
            service = EmailService()

        to_email = "test@example.com"
        reset_link = "https://swissai.tax/reset-password?token=abc123"

        result = await service.send_password_reset_email(to_email, reset_link)

        # Verify error response
        assert result['status'] == 'error'
        assert result['status_code'] == 500
        assert 'Email service not configured' in result['message']

    @pytest.mark.asyncio
    async def test_send_password_reset_email_unexpected_error(self, email_service, mock_boto3_client):
        """Test password reset email sending with unexpected error."""
        to_email = "test@example.com"
        reset_link = "https://swissai.tax/reset-password?token=abc123"

        # Mock unexpected error
        mock_boto3_client.send_email.side_effect = Exception("Unexpected error occurred")

        result = await email_service.send_password_reset_email(to_email, reset_link)

        # Verify error response
        assert result['status'] == 'error'
        assert result['status_code'] == 500
        assert result['message'] == 'Failed to send email'

    @pytest.mark.asyncio
    async def test_send_email_backward_compatibility(self, email_service, mock_boto3_client):
        """Test backward compatible send_email method."""
        to_email = "test@example.com"
        reset_link = "https://swissai.tax/reset-password?token=abc123"
        template_data = {'link': reset_link}

        result = await email_service.send_email(to_email, template_data, template_id='some_template_id')

        # Verify SES send_email was called
        mock_boto3_client.send_email.assert_called_once()

        # Verify response
        assert result['status'] == 'success'
        assert result['status_code'] == 200

    @pytest.mark.asyncio
    async def test_send_email_missing_reset_link(self, email_service):
        """Test send_email without reset link in template_data."""
        to_email = "test@example.com"
        template_data = {}  # Missing 'link' key

        result = await email_service.send_email(to_email, template_data)

        # Verify error response
        assert result['status'] == 'error'
        assert result['status_code'] == 400
        assert 'Missing reset link' in result['message']

    @pytest.mark.asyncio
    async def test_email_content_includes_branding(self, email_service, mock_boto3_client):
        """Test that email includes SwissAI Tax branding."""
        to_email = "test@example.com"
        reset_link = "https://swissai.tax/reset-password?token=abc123"

        await email_service.send_password_reset_email(to_email, reset_link)

        call_args = mock_boto3_client.send_email.call_args[1]
        html_body = call_args['Message']['Body']['Html']['Data']
        text_body = call_args['Message']['Body']['Text']['Data']

        # Verify branding in both HTML and text versions
        assert 'SwissAI Tax' in html_body
        assert 'SwissAI Tax' in text_body

        # Verify reset link is included
        assert reset_link in html_body
        assert reset_link in text_body

        # Verify security notice is included
        assert "didn't request" in html_body.lower()
        assert "didn't request" in text_body.lower()

    @pytest.mark.asyncio
    async def test_email_includes_expiration_notice(self, email_service, mock_boto3_client):
        """Test that email mentions 1 hour expiration."""
        to_email = "test@example.com"
        reset_link = "https://swissai.tax/reset-password?token=abc123"

        await email_service.send_password_reset_email(to_email, reset_link)

        call_args = mock_boto3_client.send_email.call_args[1]
        html_body = call_args['Message']['Body']['Html']['Data']
        text_body = call_args['Message']['Body']['Text']['Data']

        # Verify expiration notice
        assert '1 hour' in html_body
        assert '1 hour' in text_body

    def test_email_service_initialization(self):
        """Test EmailService initialization with valid settings."""
        with patch('services.ses_emailjs_replacement.boto3.client') as mock_boto:
            mock_client = MagicMock()
            mock_boto.return_value = mock_client

            service = EmailService()

            # Verify boto3 client was created
            mock_boto.assert_called_once()
            assert service.ses_client == mock_client

    def test_email_service_initialization_failure(self):
        """Test EmailService initialization when boto3 fails."""
        with patch('services.ses_emailjs_replacement.boto3.client') as mock_boto:
            mock_boto.side_effect = Exception("AWS credentials not configured")

            service = EmailService()

            # Verify client is None when initialization fails
            assert service.ses_client is None
