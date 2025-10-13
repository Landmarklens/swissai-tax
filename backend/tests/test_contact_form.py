"""
Tests for contact form functionality
Tests API endpoint, validation, rate limiting, and email sending
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

# Import main app
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app
from routers.contact import rate_limit_store, check_rate_limit


client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_rate_limit_store():
    """Fixture to clear rate limit store before each test"""
    rate_limit_store.clear()
    yield
    rate_limit_store.clear()


class TestContactFormValidation:
    """Test Pydantic validation for contact form"""

    def test_valid_contact_form(self):
        """Test valid contact form submission"""
        valid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "phone": "+41 79 123 45 67",
            "subject": "Test inquiry",
            "message": "This is a test message that is long enough to pass validation.",
            "inquiry": "general"
        }

        with patch('routers.contact.email_service.send_contact_form_email') as mock_send:
            mock_send.return_value = {"status": "success", "message_id": "test-12345"}
            response = client.post("/api/contact", json=valid_data)

        assert response.status_code == 200
        assert response.json()["success"] is True
        assert "Thank you" in response.json()["message"]

    def test_missing_required_fields(self):
        """Test validation fails when required fields are missing"""
        invalid_data = {
            "firstName": "John",
            # Missing lastName
            "email": "john@example.com",
            "subject": "Test",
            "message": "Test message"
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_invalid_email(self):
        """Test validation fails with invalid email"""
        invalid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "not-an-email",  # Invalid email
            "subject": "Test",
            "message": "This is a test message."
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_name_too_short(self):
        """Test validation fails when name is too short"""
        invalid_data = {
            "firstName": "J",  # Too short (min 2 chars)
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "This is a test message."
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_name_too_long(self):
        """Test validation fails when name is too long"""
        invalid_data = {
            "firstName": "A" * 51,  # Too long (max 50 chars)
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "This is a test message."
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_message_too_short(self):
        """Test validation fails when message is too short"""
        invalid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "Short"  # Too short (min 10 chars)
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_message_too_long(self):
        """Test validation fails when message is too long"""
        invalid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "A" * 2001  # Too long (max 2000 chars)
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_html_injection_in_message(self):
        """Test validation prevents HTML in message"""
        invalid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "This has <script>alert('xss')</script> in it"
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_html_injection_in_subject(self):
        """Test validation prevents HTML in subject"""
        invalid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test <b>bold</b>",
            "message": "This is a test message."
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_valid_phone_formats(self):
        """Test various valid phone number formats"""
        valid_phones = [
            "+41 79 123 45 67",
            "+1-555-123-4567",
            "0791234567",
            "+33 1 23 45 67 89",
            "123-456-7890"
        ]

        for phone in valid_phones:
            valid_data = {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john@example.com",
                "phone": phone,
                "subject": "Test",
                "message": "This is a test message."
            }

            with patch('routers.contact.email_service.send_contact_form_email') as mock_send:
                mock_send.return_value = {"status": "success", "message_id": "test-12345"}
                response = client.post("/api/contact", json=valid_data)

            assert response.status_code == 200, f"Phone format failed: {phone}"

    def test_invalid_phone_with_letters(self):
        """Test validation fails with letters in phone"""
        invalid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "+41 ABC 123",  # Letters not allowed
            "subject": "Test",
            "message": "This is a test message."
        }

        response = client.post("/api/contact", json=invalid_data)
        assert response.status_code == 422

    def test_optional_phone_field(self):
        """Test phone field is optional"""
        valid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "This is a test message."
            # No phone field
        }

        with patch('routers.contact.email_service.send_contact_form_email') as mock_send:
            mock_send.return_value = {"status": "success", "message_id": "test-12345"}
            response = client.post("/api/contact", json=valid_data)

        assert response.status_code == 200


class TestRateLimiting:
    """Test rate limiting functionality"""

    def setUp(self):
        """Clear rate limit store before each test"""
        rate_limit_store.clear()

    def test_rate_limit_function_allows_first_request(self):
        """Test first request is allowed"""
        self.setUp()
        result = check_rate_limit("192.168.1.1", max_requests=3, window_minutes=60)
        assert result is True

    def test_rate_limit_function_allows_within_limit(self):
        """Test requests within limit are allowed"""
        self.setUp()
        ip = "192.168.1.1"

        # First 3 requests should be allowed
        assert check_rate_limit(ip, max_requests=3, window_minutes=60) is True
        assert check_rate_limit(ip, max_requests=3, window_minutes=60) is True
        assert check_rate_limit(ip, max_requests=3, window_minutes=60) is True

    def test_rate_limit_function_blocks_exceeded(self):
        """Test requests exceeding limit are blocked"""
        self.setUp()
        ip = "192.168.1.1"

        # First 3 requests allowed
        check_rate_limit(ip, max_requests=3, window_minutes=60)
        check_rate_limit(ip, max_requests=3, window_minutes=60)
        check_rate_limit(ip, max_requests=3, window_minutes=60)

        # 4th request should be blocked
        assert check_rate_limit(ip, max_requests=3, window_minutes=60) is False

    def test_rate_limit_function_cleans_old_entries(self):
        """Test old entries are cleaned up"""
        self.setUp()
        ip = "192.168.1.1"

        # Add old timestamps (2 hours ago)
        old_time = datetime.now() - timedelta(hours=2)
        rate_limit_store[ip] = [old_time, old_time, old_time]

        # New request should be allowed (old entries cleaned up)
        assert check_rate_limit(ip, max_requests=3, window_minutes=60) is True
        assert len(rate_limit_store[ip]) == 1  # Only new entry remains

    def test_rate_limit_per_ip(self):
        """Test rate limiting is per IP address"""
        self.setUp()

        ip1 = "192.168.1.1"
        ip2 = "192.168.1.2"

        # IP1 uses all 3 requests
        check_rate_limit(ip1, max_requests=3, window_minutes=60)
        check_rate_limit(ip1, max_requests=3, window_minutes=60)
        check_rate_limit(ip1, max_requests=3, window_minutes=60)

        # IP1 blocked
        assert check_rate_limit(ip1, max_requests=3, window_minutes=60) is False

        # IP2 still allowed
        assert check_rate_limit(ip2, max_requests=3, window_minutes=60) is True

    def test_api_rate_limit_enforcement(self):
        """Test API enforces rate limiting"""
        self.setUp()

        valid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "This is a test message."
        }

        with patch('routers.contact.email_service.send_contact_form_email') as mock_send:
            mock_send.return_value = {"status": "success", "message_id": "test-12345"}

            # First 3 requests should succeed
            for i in range(3):
                response = client.post("/api/contact", json=valid_data)
                assert response.status_code == 200, f"Request {i+1} failed"

            # 4th request should be rate limited
            response = client.post("/api/contact", json=valid_data)
            assert response.status_code == 429
            assert "Too many requests" in response.json()["detail"]


class TestEmailSending:
    """Test email sending functionality"""

    def test_successful_email_send(self):
        """Test successful email sending returns success"""
        valid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "This is a test message."
        }

        with patch('routers.contact.email_service.send_contact_form_email') as mock_send:
            mock_send.return_value = {
                "status": "success",
                "message_id": "test-message-id-12345"
            }

            response = client.post("/api/contact", json=valid_data)

            assert response.status_code == 200
            assert response.json()["success"] is True
            mock_send.assert_called_once()

    def test_email_send_failure(self):
        """Test email sending failure returns error"""
        valid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "This is a test message."
        }

        with patch('routers.contact.email_service.send_contact_form_email') as mock_send:
            mock_send.return_value = {
                "status": "error",
                "message": "Email service unavailable"
            }

            response = client.post("/api/contact", json=valid_data)

            assert response.status_code == 500
            assert "Failed to send message" in response.json()["detail"]

    def test_email_service_exception(self):
        """Test exception handling in email service"""
        valid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "This is a test message."
        }

        with patch('routers.contact.email_service.send_contact_form_email') as mock_send:
            mock_send.side_effect = Exception("Unexpected error")

            response = client.post("/api/contact", json=valid_data)

            assert response.status_code == 500
            assert "error occurred" in response.json()["detail"]

    def test_email_contains_all_fields(self):
        """Test email service receives all form fields"""
        valid_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "+41 79 123 45 67",
            "subject": "Test Subject",
            "message": "This is a test message.",
            "inquiry": "support"
        }

        with patch('routers.contact.email_service.send_contact_form_email') as mock_send:
            mock_send.return_value = {"status": "success", "message_id": "test-12345"}

            response = client.post("/api/contact", json=valid_data)

            assert response.status_code == 200

            # Verify email service was called with correct data
            call_args = mock_send.call_args[0][0]
            assert call_args["firstName"] == "John"
            assert call_args["lastName"] == "Doe"
            assert call_args["email"] == "john@example.com"
            assert call_args["phone"] == "+41 79 123 45 67"
            assert call_args["subject"] == "Test Subject"
            assert call_args["message"] == "This is a test message."
            assert call_args["inquiry"] == "support"


class TestEmailService:
    """Test EmailService class directly"""

    @pytest.mark.asyncio
    async def test_send_contact_form_email_structure(self):
        """Test contact form email has correct structure"""
        from services.ses_emailjs_replacement import EmailService

        email_service = EmailService()

        form_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "+41 79 123 45 67",
            "subject": "Test Subject",
            "message": "This is a test message.",
            "inquiry": "general"
        }

        with patch.object(email_service, 'ses_client') as mock_ses:
            mock_ses.send_email.return_value = {"MessageId": "test-12345"}

            result = await email_service.send_contact_form_email(form_data)

            assert result["status"] == "success"
            assert result["message_id"] == "test-12345"

            # Verify SES was called correctly
            mock_ses.send_email.assert_called_once()
            call_kwargs = mock_ses.send_email.call_args[1]

            # Check sender email
            assert call_kwargs["Source"] == "noreply@swissai.tax"

            # Check recipient email (contact inbox)
            assert "contact@swissai.tax" in call_kwargs["Destination"]["ToAddresses"]

            # Check Reply-To is set to user's email
            assert form_data["email"] in call_kwargs["ReplyToAddresses"]

            # Check email content
            message = call_kwargs["Message"]
            assert "Contact Form: Test Subject" == message["Subject"]["Data"]
            assert "john@example.com" in message["Body"]["Html"]["Data"]
            assert "This is a test message" in message["Body"]["Html"]["Data"]


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
