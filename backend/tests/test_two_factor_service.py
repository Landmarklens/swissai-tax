"""Unit tests for Two-Factor Authentication service."""

import json
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pyotp
import pytest

from models.swisstax import User
from services.two_factor_service import TwoFactorService, two_factor_service


class TestTwoFactorService:
    """Test the TwoFactorService class."""

    @pytest.fixture
    def service(self):
        """Create a TwoFactorService instance for testing."""
        return TwoFactorService()

    @pytest.fixture
    def mock_user(self):
        """Create a mock user for testing."""
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.two_factor_backup_codes = None
        user.two_factor_verified_at = None
        return user

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        db = MagicMock()
        return db

    def test_generate_secret(self, service):
        """Test TOTP secret generation."""
        secret = service.generate_secret()

        assert secret is not None
        assert isinstance(secret, str)
        assert len(secret) == 32  # pyotp base32 secrets are 32 chars
        # Verify it's a valid base32 string
        assert all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' for c in secret)

    def test_generate_qr_code(self, service):
        """Test QR code generation."""
        secret = pyotp.random_base32()
        email = "test@example.com"

        qr_code = service.generate_qr_code(secret, email)

        assert qr_code is not None
        assert isinstance(qr_code, str)
        assert qr_code.startswith("data:image/png;base64,")
        # Verify base64 encoding
        base64_data = qr_code.split(',')[1]
        assert len(base64_data) > 0

    def test_generate_qr_code_custom_issuer(self, service):
        """Test QR code generation with custom issuer."""
        secret = pyotp.random_base32()
        email = "test@example.com"
        issuer = "Custom Issuer"

        qr_code = service.generate_qr_code(secret, email, issuer_name=issuer)

        assert qr_code is not None
        assert qr_code.startswith("data:image/png;base64,")

    def test_generate_backup_codes_default_count(self, service):
        """Test backup code generation with default count."""
        codes = service.generate_backup_codes()

        assert len(codes) == 10
        for code in codes:
            assert isinstance(code, str)
            assert len(code) == 9  # XXXX-XXXX format (8 chars + 1 dash)
            assert '-' in code
            parts = code.split('-')
            assert len(parts) == 2
            assert len(parts[0]) == 4
            assert len(parts[1]) == 4

    def test_generate_backup_codes_custom_count(self, service):
        """Test backup code generation with custom count."""
        codes = service.generate_backup_codes(count=5)

        assert len(codes) == 5

    def test_generate_backup_codes_uniqueness(self, service):
        """Test that backup codes are unique."""
        codes = service.generate_backup_codes(count=20)

        assert len(codes) == len(set(codes))  # All codes should be unique

    def test_verify_totp_valid_code(self, service):
        """Test TOTP verification with valid code."""
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        result = service.verify_totp(secret, valid_code)

        assert result is True

    def test_verify_totp_invalid_code(self, service):
        """Test TOTP verification with invalid code."""
        secret = pyotp.random_base32()

        result = service.verify_totp(secret, "000000")

        assert result is False

    def test_verify_totp_invalid_format(self, service):
        """Test TOTP verification with invalid format."""
        secret = pyotp.random_base32()

        # Test with non-digit code
        result = service.verify_totp(secret, "abcdef")
        assert result is False

        # Test with wrong length
        result = service.verify_totp(secret, "12345")
        assert result is False

    def test_verify_totp_with_spaces(self, service):
        """Test TOTP verification removes spaces."""
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()
        code_with_spaces = f"{valid_code[:3]} {valid_code[3:]}"

        result = service.verify_totp(secret, code_with_spaces)

        assert result is True

    def test_verify_backup_code_valid(self, service, mock_user, mock_db):
        """Test backup code verification with valid code."""
        # Setup
        backup_codes = ["ABCD-1234", "EFGH-5678"]
        encrypted_codes = service.encrypt_backup_codes(backup_codes)
        mock_user.two_factor_backup_codes = encrypted_codes
        mock_db.merge.return_value = mock_user

        # Test
        result = service.verify_backup_code(mock_user, "ABCD-1234", mock_db)

        assert result is True
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_user, with_for_update=True)

    def test_verify_backup_code_case_insensitive(self, service, mock_user, mock_db):
        """Test backup code verification is case insensitive."""
        backup_codes = ["ABCD-1234"]
        encrypted_codes = service.encrypt_backup_codes(backup_codes)
        mock_user.two_factor_backup_codes = encrypted_codes
        mock_db.merge.return_value = mock_user

        result = service.verify_backup_code(mock_user, "abcd-1234", mock_db)

        assert result is True

    def test_verify_backup_code_without_dash(self, service, mock_user, mock_db):
        """Test backup code verification accepts code without dash."""
        backup_codes = ["ABCD-1234"]
        encrypted_codes = service.encrypt_backup_codes(backup_codes)
        mock_user.two_factor_backup_codes = encrypted_codes
        mock_db.merge.return_value = mock_user

        result = service.verify_backup_code(mock_user, "ABCD1234", mock_db)

        assert result is True

    def test_verify_backup_code_invalid_length(self, service, mock_user, mock_db):
        """Test backup code verification rejects invalid length."""
        backup_codes = ["ABCD-1234"]
        encrypted_codes = service.encrypt_backup_codes(backup_codes)
        mock_user.two_factor_backup_codes = encrypted_codes

        # Test with too short
        result = service.verify_backup_code(mock_user, "ABC123", mock_db)
        assert result is False

        # Test with too long
        result = service.verify_backup_code(mock_user, "ABCD12345", mock_db)
        assert result is False

    def test_verify_backup_code_removes_used_code(self, service, mock_user, mock_db):
        """Test that verified backup code is removed from list."""
        backup_codes = ["ABCD-1234", "EFGH-5678"]
        encrypted_codes = service.encrypt_backup_codes(backup_codes)
        mock_user.two_factor_backup_codes = encrypted_codes

        service.verify_backup_code(mock_user, "ABCD-1234", mock_db)

        # Verify the code was removed
        remaining_codes = service.decrypt_backup_codes(mock_user.two_factor_backup_codes)
        assert len(remaining_codes) == 1
        assert "ABCD-1234" not in remaining_codes
        assert "EFGH-5678" in remaining_codes

    def test_verify_backup_code_last_code_sets_null(self, service, mock_user, mock_db):
        """Test that using last backup code sets field to None."""
        backup_codes = ["ABCD-1234"]
        encrypted_codes = service.encrypt_backup_codes(backup_codes)
        mock_user.two_factor_backup_codes = encrypted_codes

        service.verify_backup_code(mock_user, "ABCD-1234", mock_db)

        # Verify backup codes set to None
        assert mock_user.two_factor_backup_codes is None

    def test_verify_backup_code_invalid(self, service, mock_user, mock_db):
        """Test backup code verification with invalid code."""
        backup_codes = ["ABCD-1234"]
        encrypted_codes = service.encrypt_backup_codes(backup_codes)
        mock_user.two_factor_backup_codes = encrypted_codes

        result = service.verify_backup_code(mock_user, "ZZZZ-9999", mock_db)

        assert result is False
        # Verify no changes made
        remaining_codes = service.decrypt_backup_codes(mock_user.two_factor_backup_codes)
        assert len(remaining_codes) == 1

    def test_verify_backup_code_no_codes(self, service, mock_user, mock_db):
        """Test backup code verification when user has no codes."""
        mock_user.two_factor_backup_codes = None

        result = service.verify_backup_code(mock_user, "ABCD-1234", mock_db)

        assert result is False

    def test_encrypt_decrypt_secret(self, service):
        """Test secret encryption and decryption."""
        secret = pyotp.random_base32()

        encrypted = service.encrypt_secret(secret)
        decrypted = service.decrypt_secret(encrypted)

        assert encrypted != secret
        assert decrypted == secret

    def test_encrypt_decrypt_backup_codes(self, service):
        """Test backup codes encryption and decryption."""
        codes = ["ABCD-1234", "EFGH-5678", "IJKL-9012"]

        encrypted = service.encrypt_backup_codes(codes)
        decrypted = service.decrypt_backup_codes(encrypted)

        assert encrypted != json.dumps(codes)
        assert decrypted == codes

    def test_enable_two_factor(self, service, mock_user, mock_db):
        """Test enabling two-factor authentication."""
        secret = pyotp.random_base32()
        backup_codes = ["ABCD-1234", "EFGH-5678"]
        mock_db.merge.return_value = mock_user

        result = service.enable_two_factor(mock_user, secret, backup_codes, mock_db)

        assert result is True
        assert mock_user.two_factor_enabled is True
        assert mock_user.two_factor_secret is not None
        assert mock_user.two_factor_backup_codes is not None
        assert isinstance(mock_user.two_factor_verified_at, datetime)
        mock_db.commit.assert_called_once()

    def test_enable_two_factor_db_error(self, service, mock_user, mock_db):
        """Test enabling two-factor with database error."""
        secret = pyotp.random_base32()
        backup_codes = ["ABCD-1234"]
        mock_db.commit.side_effect = Exception("Database error")

        result = service.enable_two_factor(mock_user, secret, backup_codes, mock_db)

        assert result is False
        mock_db.rollback.assert_called_once()

    def test_disable_two_factor(self, service, mock_user, mock_db):
        """Test disabling two-factor authentication."""
        # Setup enabled 2FA
        mock_user.two_factor_enabled = True
        mock_user.two_factor_secret = "encrypted_secret"
        mock_user.two_factor_backup_codes = "encrypted_codes"
        mock_user.two_factor_verified_at = datetime.utcnow()
        mock_db.merge.return_value = mock_user

        result = service.disable_two_factor(mock_user, mock_db)

        assert result is True
        assert mock_user.two_factor_enabled is False
        assert mock_user.two_factor_secret is None
        assert mock_user.two_factor_backup_codes is None
        assert mock_user.two_factor_verified_at is None
        mock_db.commit.assert_called_once()

    def test_disable_two_factor_db_error(self, service, mock_user, mock_db):
        """Test disabling two-factor with database error."""
        mock_user.two_factor_enabled = True
        mock_db.commit.side_effect = Exception("Database error")

        result = service.disable_two_factor(mock_user, mock_db)

        assert result is False
        mock_db.rollback.assert_called_once()

    def test_regenerate_backup_codes(self, service, mock_user, mock_db):
        """Test regenerating backup codes."""
        mock_user.two_factor_enabled = True
        mock_db.merge.return_value = mock_user

        new_codes = service.regenerate_backup_codes(mock_user, mock_db)

        assert new_codes is not None
        assert len(new_codes) == 10
        assert mock_user.two_factor_backup_codes is not None
        mock_db.commit.assert_called_once()

    def test_regenerate_backup_codes_not_enabled(self, service, mock_user, mock_db):
        """Test regenerating codes when 2FA not enabled."""
        mock_user.two_factor_enabled = False

        new_codes = service.regenerate_backup_codes(mock_user, mock_db)

        assert new_codes is None
        mock_db.commit.assert_not_called()

    def test_regenerate_backup_codes_db_error(self, service, mock_user, mock_db):
        """Test regenerating codes with database error."""
        mock_user.two_factor_enabled = True
        mock_db.commit.side_effect = Exception("Database error")

        new_codes = service.regenerate_backup_codes(mock_user, mock_db)

        assert new_codes is None
        mock_db.rollback.assert_called_once()

    def test_get_remaining_backup_codes_count(self, service, mock_user):
        """Test getting remaining backup codes count."""
        backup_codes = ["ABCD-1234", "EFGH-5678", "IJKL-9012"]
        encrypted_codes = service.encrypt_backup_codes(backup_codes)
        mock_user.two_factor_backup_codes = encrypted_codes

        count = service.get_remaining_backup_codes_count(mock_user)

        assert count == 3

    def test_get_remaining_backup_codes_count_no_codes(self, service, mock_user):
        """Test getting count when no codes exist."""
        mock_user.two_factor_backup_codes = None

        count = service.get_remaining_backup_codes_count(mock_user)

        assert count == 0

    def test_singleton_instance(self):
        """Test that two_factor_service is a singleton."""
        from services.two_factor_service import two_factor_service

        assert isinstance(two_factor_service, TwoFactorService)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
