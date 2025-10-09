"""Unit tests for Two-Factor Authentication router."""

import json
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pyotp
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from main import app
from models.swisstax import User


class TestTwoFactorRouter:
    """Test the Two-Factor Authentication API endpoints."""

    @patch('routers.two_factor.two_factor_service')
    def test_initialize_setup_success(self, mock_service, authenticated_client_no_2fa):
        """Test successful 2FA setup initialization."""
        secret = pyotp.random_base32()
        qr_code = "data:image/png;base64,fake_qr_code"
        backup_codes = [f"CODE{i:04d}-{i*111:04d}" for i in range(1, 11)]  # 10 codes

        mock_service.generate_secret.return_value = secret
        mock_service.generate_qr_code.return_value = qr_code
        mock_service.generate_backup_codes.return_value = backup_codes

        response = authenticated_client_no_2fa.post("/api/2fa/setup/init")

        assert response.status_code == 200
        data = response.json()
        assert data["secret"] == secret
        assert data["qr_code"] == qr_code
        assert data["backup_codes"] == backup_codes

    def test_initialize_setup_already_enabled(self, authenticated_client_with_2fa):
        """Test initialization when 2FA already enabled."""
        response = authenticated_client_with_2fa.post("/api/2fa/setup/init")

        assert response.status_code == 400
        assert "already enabled" in response.json()["detail"].lower()

    @patch('routers.two_factor.two_factor_service')
    @patch('routers.two_factor.get_db')
    def test_verify_and_enable_success(self, mock_get_db, mock_service, authenticated_client_no_2fa):
        """Test successful 2FA verification and enablement."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()
        backup_codes = [f"CODE{i:04d}-{i*111:04d}" for i in range(1, 11)]  # 10 codes

        mock_service.verify_totp.return_value = True
        mock_service.enable_two_factor.return_value = True

        response = authenticated_client_no_2fa.post(
            "/api/2fa/setup/verify",
            json={"code": valid_code, "secret": secret, "backup_codes": backup_codes}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "enabled successfully" in data["message"].lower()

    @patch('routers.two_factor.two_factor_service')
    def test_verify_and_enable_invalid_code(self, mock_service, authenticated_client_no_2fa):
        """Test verification with invalid code."""
        secret = pyotp.random_base32()
        backup_codes = [f"CODE{i:04d}-{i*111:04d}" for i in range(1, 11)]  # 10 codes

        mock_service.verify_totp.return_value = False

        response = authenticated_client_no_2fa.post(
            "/api/2fa/setup/verify",
            json={"code": "000000", "secret": secret, "backup_codes": backup_codes}
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()

    def test_verify_and_enable_already_enabled(self, authenticated_client_with_2fa):
        """Test verification when 2FA already enabled."""
        secret = pyotp.random_base32()
        backup_codes = [f"CODE{i:04d}-{i*111:04d}" for i in range(1, 11)]  # 10 codes

        response = authenticated_client_with_2fa.post(
            "/api/2fa/setup/verify",
            json={"code": "123456", "secret": secret, "backup_codes": backup_codes}
        )

        assert response.status_code == 400
        assert "already enabled" in response.json()["detail"].lower()

    @patch('routers.two_factor.verify_password')
    @patch('routers.two_factor.two_factor_service')
    @patch('routers.two_factor.get_db')
    def test_disable_2fa_success(self, mock_get_db, mock_service, mock_verify_password, authenticated_client_with_2fa):
        """Test successful 2FA disablement."""
        mock_verify_password.return_value = True
        mock_service.disable_two_factor.return_value = True
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = authenticated_client_with_2fa.post(
            "/api/2fa/disable",
            json={"password": "correct_password"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "disabled" in data["message"].lower()

    def test_disable_2fa_not_enabled(self, authenticated_client_no_2fa):
        """Test disabling when 2FA not enabled."""
        response = authenticated_client_no_2fa.post(
            "/api/2fa/disable",
            json={"password": "password"}
        )

        assert response.status_code == 400
        assert "not enabled" in response.json()["detail"].lower()

    @patch('routers.two_factor.verify_password')
    def test_disable_2fa_wrong_password(self, mock_verify_password, authenticated_client_with_2fa):
        """Test disabling with wrong password."""
        mock_verify_password.return_value = False

        response = authenticated_client_with_2fa.post(
            "/api/2fa/disable",
            json={"password": "wrong_password"}
        )

        assert response.status_code == 401
        assert "invalid password" in response.json()["detail"].lower()

    @patch('routers.two_factor.verify_password')
    @patch('routers.two_factor.two_factor_service')
    @patch('routers.two_factor.get_db')
    def test_regenerate_backup_codes_success(self, mock_get_db, mock_service, mock_verify_password, authenticated_client_with_2fa):
        """Test successful backup codes regeneration."""
        mock_verify_password.return_value = True
        new_codes = ["NEW1-1111", "NEW2-2222"]
        mock_service.regenerate_backup_codes.return_value = new_codes
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        response = authenticated_client_with_2fa.post(
            "/api/2fa/backup-codes/regenerate",
            json={"password": "correct_password"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["backup_codes"] == new_codes

    def test_regenerate_codes_not_enabled(self, authenticated_client_no_2fa):
        """Test regenerating codes when 2FA not enabled."""
        response = authenticated_client_no_2fa.post(
            "/api/2fa/backup-codes/regenerate",
            json={"password": "password"}
        )

        assert response.status_code == 400
        assert "not enabled" in response.json()["detail"].lower()

    @patch('routers.two_factor.verify_password')
    def test_regenerate_codes_wrong_password(self, mock_verify_password, authenticated_client_with_2fa):
        """Test regenerating codes with wrong password."""
        mock_verify_password.return_value = False

        response = authenticated_client_with_2fa.post(
            "/api/2fa/backup-codes/regenerate",
            json={"password": "wrong_password"}
        )

        assert response.status_code == 401
        assert "invalid password" in response.json()["detail"].lower()

    @patch('routers.two_factor.two_factor_service')
    def test_get_status_enabled(self, mock_service, authenticated_client_with_2fa):
        """Test getting 2FA status when enabled."""
        mock_service.get_remaining_backup_codes_count.return_value = 7

        response = authenticated_client_with_2fa.get("/api/2fa/status")

        assert response.status_code == 200
        data = response.json()
        assert data["enabled"] is True
        assert data["backup_codes_remaining"] == 7
        assert data["verified_at"] is not None

    def test_get_status_disabled(self, authenticated_client_no_2fa):
        """Test getting 2FA status when disabled."""
        response = authenticated_client_no_2fa.get("/api/2fa/status")

        assert response.status_code == 200
        data = response.json()
        assert data["enabled"] is False
        assert data["backup_codes_remaining"] == 0
        assert data["verified_at"] is None

    def test_deprecated_verify_endpoint(self, client):
        """Test that deprecated /api/2fa/verify endpoint returns 410."""
        response = client.post(
            "/api/2fa/verify",
            json={"code": "123456", "temp_token": "fake_token"}
        )

        assert response.status_code == 410
        assert "deprecated" in response.json()["detail"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
