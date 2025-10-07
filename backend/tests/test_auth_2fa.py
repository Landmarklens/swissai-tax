"""Unit tests for Two-Factor Authentication in auth router."""

from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pyotp
import pytest
from fastapi.testclient import TestClient

from main import app
from models.swisstax import User


class TestAuth2FA:
    """Test 2FA integration in auth endpoints."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_2fa_user(self):
        """Create a mock user with 2FA enabled."""
        user = Mock(spec=User)
        user.id = 1
        user.email = "2fa@example.com"
        user.password = "$2b$12$hashed_password"
        user.first_name = "Test"
        user.last_name = "User"
        user.preferred_language = "en"
        user.avatar_url = None
        user.two_factor_enabled = True
        user.two_factor_secret = "encrypted_secret"
        user.two_factor_backup_codes = "encrypted_codes"
        user.two_factor_verified_at = datetime.utcnow()
        user.last_login = None
        return user

    @pytest.fixture
    def mock_no_2fa_user(self):
        """Create a mock user without 2FA."""
        user = Mock(spec=User)
        user.id = 2
        user.email = "no2fa@example.com"
        user.password = "$2b$12$hashed_password"
        user.first_name = "Normal"
        user.last_name = "User"
        user.preferred_language = "en"
        user.avatar_url = None
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.two_factor_backup_codes = None
        user.two_factor_verified_at = None
        user.last_login = None
        return user

    @patch('routers.auth.get_user_by_email')
    @patch('routers.auth.check_user')
    @patch('routers.auth.sign_temp_2fa_jwt')
    @patch('routers.auth.get_db')
    def test_login_requires_2fa(self, mock_get_db, mock_sign_temp, mock_check, mock_get_user, client, mock_2fa_user):
        """Test login returns requires_2fa when user has 2FA enabled."""
        mock_get_user.return_value = mock_2fa_user
        mock_check.return_value = True
        mock_sign_temp.return_value = {
            "temp_token": "temporary_jwt_token",
            "token_type": "bearer"
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/login",
            json={"email": "2fa@example.com", "password": "password"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["requires_2fa"] is True
        assert "temp_token" in data
        assert data["temp_token"] == "temporary_jwt_token"
        mock_sign_temp.assert_called_once_with("2fa@example.com", str(mock_2fa_user.id))

    @patch('routers.auth.get_user_by_email')
    @patch('routers.auth.check_user')
    @patch('routers.auth.sign_jwt')
    @patch('routers.auth.get_db')
    def test_login_without_2fa(self, mock_get_db, mock_sign_jwt, mock_check, mock_get_user, client, mock_no_2fa_user):
        """Test normal login when user doesn't have 2FA."""
        mock_get_user.return_value = mock_no_2fa_user
        mock_check.return_value = True
        mock_sign_jwt.return_value = {
            "access_token": "jwt_token",
            "token_type": "bearer"
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/login",
            json={"email": "no2fa@example.com", "password": "password"}
        )

        assert response.status_code == 200
        data = response.json()
        # Should get normal token response, not requires_2fa
        assert "access_token" in data or "success" in data
        # Should not have requires_2fa flag or it should be False
        if "requires_2fa" in data:
            assert data["requires_2fa"] is False

    @patch('routers.auth.verify_temp_2fa_jwt')
    @patch('routers.auth.get_user_by_email')
    @patch('routers.auth.two_factor_service')
    @patch('routers.auth.sign_jwt')
    @patch('routers.auth.get_db')
    def test_verify_2fa_with_totp(self, mock_get_db, mock_sign_jwt, mock_2fa_service, mock_get_user, mock_verify_temp, client, mock_2fa_user):
        """Test 2FA verification with TOTP code."""
        # Setup mocks
        mock_verify_temp.return_value = {
            "email": "2fa@example.com",
            "user_id": "1",
            "requires_2fa": True
        }
        mock_get_user.return_value = mock_2fa_user
        mock_2fa_service.decrypt_secret.return_value = "decrypted_secret"
        mock_2fa_service.verify_totp.return_value = True
        mock_sign_jwt.return_value = {
            "access_token": "full_jwt_token",
            "token_type": "bearer"
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/login/verify-2fa?use_cookie=false",
            json={"temp_token": "temp_token", "code": "123456"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        mock_2fa_service.verify_totp.assert_called_once()

    @patch('routers.auth.verify_temp_2fa_jwt')
    @patch('routers.auth.get_user_by_email')
    @patch('routers.auth.two_factor_service')
    @patch('routers.auth.get_db')
    def test_verify_2fa_with_backup_code(self, mock_get_db, mock_2fa_service, mock_get_user, mock_verify_temp, client, mock_2fa_user):
        """Test 2FA verification with backup code."""
        mock_verify_temp.return_value = {
            "email": "2fa@example.com",
            "user_id": "1",
            "requires_2fa": True
        }
        mock_get_user.return_value = mock_2fa_user
        mock_2fa_service.decrypt_secret.return_value = "decrypted_secret"
        mock_2fa_service.verify_totp.return_value = False
        mock_2fa_service.verify_backup_code.return_value = True
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/login/verify-2fa?use_cookie=true",
            json={"temp_token": "temp_token", "code": "ABCD1234"}
        )

        assert response.status_code == 200
        mock_2fa_service.verify_backup_code.assert_called_once()

    @patch('routers.auth.verify_temp_2fa_jwt')
    @patch('routers.auth.get_user_by_email')
    @patch('routers.auth.two_factor_service')
    @patch('routers.auth.get_db')
    def test_verify_2fa_invalid_code(self, mock_get_db, mock_2fa_service, mock_get_user, mock_verify_temp, client, mock_2fa_user):
        """Test 2FA verification with invalid code."""
        mock_verify_temp.return_value = {
            "email": "2fa@example.com",
            "user_id": "1",
            "requires_2fa": True
        }
        mock_get_user.return_value = mock_2fa_user
        mock_2fa_service.decrypt_secret.return_value = "decrypted_secret"
        mock_2fa_service.verify_totp.return_value = False
        mock_2fa_service.verify_backup_code.return_value = False
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/login/verify-2fa",
            json={"temp_token": "temp_token", "code": "000000"}
        )

        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    @patch('routers.auth.verify_temp_2fa_jwt')
    def test_verify_2fa_invalid_temp_token(self, mock_verify_temp, client):
        """Test 2FA verification with invalid temp token."""
        mock_verify_temp.return_value = None

        response = client.post(
            "/api/auth/login/verify-2fa",
            json={"temp_token": "invalid_token", "code": "123456"}
        )

        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    @patch('routers.auth.verify_temp_2fa_jwt')
    @patch('routers.auth.get_user_by_email')
    @patch('routers.auth.get_db')
    def test_verify_2fa_user_disabled_2fa(self, mock_get_db, mock_get_user, mock_verify_temp, client, mock_no_2fa_user):
        """Test verification when user disabled 2FA after getting temp token."""
        mock_verify_temp.return_value = {
            "email": "no2fa@example.com",
            "user_id": "2",
            "requires_2fa": True
        }
        mock_get_user.return_value = mock_no_2fa_user
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/login/verify-2fa",
            json={"temp_token": "temp_token", "code": "123456"}
        )

        assert response.status_code == 400
        assert "not enabled" in response.json()["detail"].lower()

    @patch('routers.auth.verify_temp_2fa_jwt')
    @patch('routers.auth.get_user_by_email')
    @patch('routers.auth.two_factor_service')
    @patch('routers.auth.sign_jwt')
    @patch('routers.auth.get_db')
    def test_verify_2fa_with_cookie(self, mock_get_db, mock_sign_jwt, mock_2fa_service, mock_get_user, mock_verify_temp, client, mock_2fa_user):
        """Test 2FA verification sets httpOnly cookie."""
        mock_verify_temp.return_value = {
            "email": "2fa@example.com",
            "user_id": "1",
            "requires_2fa": True
        }
        mock_get_user.return_value = mock_2fa_user
        mock_2fa_service.decrypt_secret.return_value = "decrypted_secret"
        mock_2fa_service.verify_totp.return_value = True
        mock_sign_jwt.return_value = {
            "access_token": "full_jwt_token",
            "token_type": "bearer"
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/auth/login/verify-2fa?use_cookie=true",
            json={"temp_token": "temp_token", "code": "123456"}
        )

        assert response.status_code == 200
        # Check that cookie was set
        assert "set-cookie" in response.headers or "Set-Cookie" in response.headers

    @patch('routers.auth.verify_temp_2fa_jwt')
    @patch('routers.auth.get_user_by_email')
    @patch('routers.auth.two_factor_service')
    @patch('routers.auth.sign_jwt')
    @patch('routers.auth.get_db')
    def test_verify_2fa_updates_last_login(self, mock_get_db, mock_sign_jwt, mock_2fa_service, mock_get_user, mock_verify_temp, client, mock_2fa_user):
        """Test that 2FA verification updates last_login timestamp."""
        mock_verify_temp.return_value = {
            "email": "2fa@example.com",
            "user_id": "1",
            "requires_2fa": True
        }
        mock_get_user.return_value = mock_2fa_user
        mock_2fa_service.decrypt_secret.return_value = "decrypted_secret"
        mock_2fa_service.verify_totp.return_value = True
        mock_sign_jwt.return_value = {
            "access_token": "full_jwt_token",
            "token_type": "bearer"
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        initial_last_login = mock_2fa_user.last_login

        response = client.post(
            "/api/auth/login/verify-2fa",
            json={"temp_token": "temp_token", "code": "123456"}
        )

        assert response.status_code == 200
        # Verify last_login was updated
        assert mock_2fa_user.last_login != initial_last_login
        assert isinstance(mock_2fa_user.last_login, datetime)
        mock_db.commit.assert_called()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
