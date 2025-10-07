"""Unit tests for password reset endpoints in auth router."""

from datetime import datetime, timedelta
from unittest.mock import MagicMock, Mock, patch, AsyncMock, ANY
import pytest
from fastapi.testclient import TestClient

from main import app
from models.swisstax import User
from models.reset_token import ResetToken


class TestPasswordResetEndpoints:
    """Test password reset API endpoints."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_user(self):
        """Create a mock user."""
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        user.password = "$2b$12$hashed_password"
        user.first_name = "Test"
        user.last_name = "User"
        user.preferred_language = "en"
        return user

    @pytest.fixture
    def mock_reset_token(self):
        """Create a mock reset token."""
        token = Mock(spec=ResetToken)
        token.token = "valid_reset_token_123"
        token.email = "test@example.com"
        token.created_at = datetime.utcnow()
        token.expires_at = datetime.utcnow() + timedelta(hours=1)
        return token

    @patch('routers.auth.userService.get_user_by_email')
    @patch('routers.auth.ResetToken.create_reset_token')
    @patch('routers.auth.EmailJSService.send_email')
    @patch('routers.auth.get_db')
    def test_request_password_reset_success(
        self, mock_get_db, mock_send_email, mock_create_token, mock_get_user, client, mock_user
    ):
        """Test successful password reset request."""
        mock_get_user.return_value = mock_user
        mock_create_token.return_value = AsyncMock()
        mock_send_email.return_value = {
            "status": "success",
            "status_code": 200,
            "message_id": "test-message-id"
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/request",
            json={"email": "test@example.com"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["status_code"] == 200
        assert "Password reset email sent successfully" in data["message"]

    @patch('routers.auth.userService.get_user_by_email')
    @patch('routers.auth.get_db')
    def test_request_password_reset_user_not_found(self, mock_get_db, mock_get_user, client):
        """Test password reset request for non-existent user."""
        mock_get_user.return_value = None
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/request",
            json={"email": "nonexistent@example.com"}
        )

        assert response.status_code == 400
        assert "User not found" in response.json()["detail"]

    @patch('routers.auth.userService.get_user_by_email')
    @patch('routers.auth.ResetToken.create_reset_token')
    @patch('routers.auth.get_db')
    def test_request_password_reset_token_creation_fails(
        self, mock_get_db, mock_create_token, mock_get_user, client, mock_user
    ):
        """Test password reset when token creation fails."""
        mock_get_user.return_value = mock_user
        mock_create_token.side_effect = Exception("Database error")
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/request",
            json={"email": "test@example.com"}
        )

        assert response.status_code == 400
        assert "Wrong save token" in response.json()["detail"]

    @patch('routers.auth.userService.get_user_by_email')
    @patch('routers.auth.ResetToken.create_reset_token')
    @patch('routers.auth.EmailJSService.send_email')
    @patch('routers.auth.get_db')
    def test_request_password_reset_email_fails(
        self, mock_get_db, mock_send_email, mock_create_token, mock_get_user, client, mock_user
    ):
        """Test password reset when email sending fails."""
        mock_get_user.return_value = mock_user
        mock_create_token.return_value = AsyncMock()
        mock_send_email.side_effect = Exception("Email service error")
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/request",
            json={"email": "test@example.com"}
        )

        assert response.status_code == 500
        assert "Failed to send password reset email" in response.json()["detail"]

    @patch('routers.auth.ResetToken.get_by_token')
    @patch('routers.auth.ResetPasswordService.verify_password_reset_token')
    @patch('routers.auth.get_db')
    def test_verify_token_success(
        self, mock_get_db, mock_verify_token, mock_get_token, client, mock_reset_token
    ):
        """Test successful token verification."""
        mock_get_token.return_value = mock_reset_token
        mock_verify_token.return_value = True
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/verify",
            json={"token": "valid_reset_token_123"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Token verified"

    @patch('routers.auth.ResetToken.get_by_token')
    @patch('routers.auth.get_db')
    def test_verify_token_not_found(self, mock_get_db, mock_get_token, client):
        """Test token verification with non-existent token."""
        mock_get_token.return_value = None
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/verify",
            json={"token": "invalid_token"}
        )

        assert response.status_code == 400
        assert "Invalid token" in response.json()["detail"]

    @patch('routers.auth.ResetToken.get_by_token')
    @patch('routers.auth.ResetPasswordService.verify_password_reset_token')
    @patch('routers.auth.get_db')
    def test_verify_token_expired(
        self, mock_get_db, mock_verify_token, mock_get_token, client, mock_reset_token
    ):
        """Test token verification with expired token."""
        mock_get_token.return_value = mock_reset_token
        mock_verify_token.return_value = False  # Token expired
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/verify",
            json={"token": "expired_token"}
        )

        assert response.status_code == 400
        assert "Invalid token" in response.json()["detail"]

    @patch('routers.auth.ResetToken.get_by_token')
    @patch('routers.auth.ResetPasswordService.verify_password_reset_token')
    @patch('routers.auth.userService.get_user_by_email')
    @patch('routers.auth.update_password')
    @patch('routers.auth.ResetToken.delete_token')
    @patch('routers.auth.get_db')
    def test_confirm_password_reset_success(
        self, mock_get_db, mock_delete_token, mock_update_password,
        mock_get_user, mock_verify_token, mock_get_token,
        client, mock_reset_token, mock_user
    ):
        """Test successful password reset confirmation."""
        mock_get_token.return_value = mock_reset_token
        mock_verify_token.return_value = True
        mock_get_user.return_value = mock_user
        mock_update_password.return_value = None
        mock_delete_token.return_value = AsyncMock()
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/confirm",
            json={
                "token": "valid_reset_token_123",
                "new_password": "NewSecurePassword123!"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password reset"

        # Verify password was updated and token was deleted
        mock_update_password.assert_called_once()
        mock_delete_token.assert_called_once_with(ANY, "valid_reset_token_123")

    @patch('routers.auth.ResetToken.get_by_token')
    @patch('routers.auth.get_db')
    def test_confirm_password_reset_invalid_token(self, mock_get_db, mock_get_token, client):
        """Test password reset confirmation with invalid token."""
        mock_get_token.return_value = None
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/confirm",
            json={
                "token": "invalid_token",
                "new_password": "NewSecurePassword123!"
            }
        )

        assert response.status_code == 400
        assert "Invalid token" in response.json()["detail"]

    @patch('routers.auth.ResetToken.get_by_token')
    @patch('routers.auth.ResetPasswordService.verify_password_reset_token')
    @patch('routers.auth.userService.get_user_by_email')
    @patch('routers.auth.update_password')
    @patch('routers.auth.get_db')
    def test_confirm_password_reset_update_fails(
        self, mock_get_db, mock_update_password, mock_get_user,
        mock_verify_token, mock_get_token,
        client, mock_reset_token, mock_user
    ):
        """Test password reset when password update fails."""
        mock_get_token.return_value = mock_reset_token
        mock_verify_token.return_value = True
        mock_get_user.return_value = mock_user
        mock_update_password.side_effect = Exception("Database error")
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/confirm",
            json={
                "token": "valid_reset_token_123",
                "new_password": "NewSecurePassword123!"
            }
        )

        assert response.status_code == 400
        assert "Wrong update password" in response.json()["detail"]

    @patch('routers.auth.userService.get_user_by_email')
    @patch('routers.auth.ResetToken.create_reset_token')
    @patch('routers.auth.EmailJSService.send_email')
    @patch('routers.auth.get_db')
    def test_request_password_reset_creates_token(
        self, mock_get_db, mock_send_email, mock_create_token, mock_get_user, client, mock_user
    ):
        """Test that password reset request creates a token."""
        mock_get_user.return_value = mock_user
        mock_create_token.return_value = AsyncMock()
        mock_send_email.return_value = {
            "status": "success",
            "status_code": 200
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/request",
            json={"email": "test@example.com"}
        )

        assert response.status_code == 200
        # Verify token was created with correct email
        assert mock_create_token.called
        create_token_args = mock_create_token.call_args
        assert create_token_args[0][1] == "test@example.com"  # email parameter

    @patch('routers.auth.userService.get_user_by_email')
    @patch('routers.auth.ResetToken.create_reset_token')
    @patch('routers.auth.EmailJSService.send_email')
    @patch('routers.auth.ResetPasswordService.get_reset_link')
    @patch('routers.auth.get_db')
    def test_request_password_reset_sends_correct_link(
        self, mock_get_db, mock_get_reset_link, mock_send_email,
        mock_create_token, mock_get_user, client, mock_user
    ):
        """Test that password reset email contains correct reset link."""
        mock_get_user.return_value = mock_user
        mock_create_token.return_value = AsyncMock()
        mock_get_reset_link.return_value = "https://swissai.tax/reset-password?token=abc123"
        mock_send_email.return_value = {
            "status": "success",
            "status_code": 200
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/reset-password/request",
            json={"email": "test@example.com"}
        )

        assert response.status_code == 200

        # Verify email was sent with correct template data
        assert mock_send_email.called
        email_args = mock_send_email.call_args[0]
        template_data = email_args[1]
        assert template_data["link"] == "https://swissai.tax/reset-password?token=abc123"
