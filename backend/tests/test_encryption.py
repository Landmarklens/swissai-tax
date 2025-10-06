"""Unit tests for encryption utilities."""

import pytest
import os
import base64
from unittest.mock import patch, MagicMock
from cryptography.fernet import Fernet, InvalidToken

from utils.encryption import EncryptionService, get_encryption_service


class TestEncryptionService:
    """Test the EncryptionService class."""

    def test_init_with_key(self):
        """Test initialization with provided key."""
        key = Fernet.generate_key()
        service = EncryptionService(key=key)
        assert service.key == key
        assert isinstance(service.cipher, Fernet)

    def test_init_with_string_key(self):
        """Test initialization with string key."""
        key_str = base64.urlsafe_b64encode(b'x' * 32).decode()
        service = EncryptionService(key=key_str)
        assert service.key == key_str.encode()

    @patch.dict('os.environ', {'ENCRYPTION_KEY': 'xCra4cshSeJY3UXfcjh3JA0N9qxv3BOzbkX-KVpygLo='})
    def test_init_with_env_key(self):
        """Test initialization with environment key."""
        service = EncryptionService()
        assert service.key == b'xCra4cshSeJY3UXfcjh3JA0N9qxv3BOzbkX-KVpygLo='

    @patch.dict('os.environ', {}, clear=True)
    @patch('utils.encryption.logger')
    def test_init_generates_new_key(self, mock_logger):
        """Test initialization generates new key when none provided."""
        service = EncryptionService()
        assert len(service.key) == 44  # Fernet key length
        mock_logger.warning.assert_called_once()

    def test_encrypt_valid_string(self):
        """Test encryption of valid string."""
        service = EncryptionService()
        plaintext = "Hello, World!"
        encrypted = service.encrypt(plaintext)

        assert encrypted != plaintext
        assert isinstance(encrypted, str)
        assert len(encrypted) > 0

    def test_encrypt_empty_string(self):
        """Test encryption of empty string."""
        service = EncryptionService()
        result = service.encrypt("")
        assert result == ""

    def test_encrypt_none(self):
        """Test encryption of None."""
        service = EncryptionService()
        result = service.encrypt(None)
        assert result is None

    def test_encrypt_unicode_string(self):
        """Test encryption of unicode string."""
        service = EncryptionService()
        plaintext = "Hello 世界 🌍"
        encrypted = service.encrypt(plaintext)
        assert encrypted != plaintext
        assert isinstance(encrypted, str)

    def test_encrypt_long_string(self):
        """Test encryption of long string."""
        service = EncryptionService()
        plaintext = "A" * 10000
        encrypted = service.encrypt(plaintext)
        assert encrypted != plaintext
        assert len(encrypted) > 0

    def test_decrypt_valid_data(self):
        """Test decryption of valid encrypted data."""
        service = EncryptionService()
        plaintext = "Hello, World!"
        encrypted = service.encrypt(plaintext)
        decrypted = service.decrypt(encrypted)

        assert decrypted == plaintext

    def test_decrypt_empty_string(self):
        """Test decryption of empty string."""
        service = EncryptionService()
        result = service.decrypt("")
        assert result == ""

    def test_decrypt_none(self):
        """Test decryption of None."""
        service = EncryptionService()
        result = service.decrypt(None)
        assert result is None

    def test_decrypt_invalid_data(self):
        """Test decryption of invalid data."""
        service = EncryptionService()
        with pytest.raises(Exception):
            service.decrypt("invalid_encrypted_data")

    def test_decrypt_with_wrong_key(self):
        """Test decryption with wrong key."""
        service1 = EncryptionService()
        service2 = EncryptionService()

        plaintext = "Secret message"
        encrypted = service1.encrypt(plaintext)

        with pytest.raises(Exception):
            service2.decrypt(encrypted)

    def test_round_trip_encryption(self):
        """Test encrypt-decrypt round trip."""
        service = EncryptionService()
        test_cases = [
            "Simple text",
            "Text with numbers 123",
            "Special chars !@#$%^&*()",
            "Unicode: 你好世界",
            "Long text: " + "A" * 1000,
            "JSON-like: {\"key\": \"value\", \"num\": 42}",
            "Multi-line\ntext\nwith\nnewlines"
        ]

        for plaintext in test_cases:
            encrypted = service.encrypt(plaintext)
            decrypted = service.decrypt(encrypted)
            assert decrypted == plaintext

    def test_encrypt_dict_valid_fields(self):
        """Test encrypting specific fields in dictionary."""
        service = EncryptionService()
        data = {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "public_info": "Not encrypted"
        }
        fields = ["name", "email"]

        encrypted_data = service.encrypt_dict(data, fields)

        assert encrypted_data["id"] == 1
        assert encrypted_data["public_info"] == "Not encrypted"
        assert encrypted_data["name"] != "John Doe"
        assert encrypted_data["email"] != "john@example.com"
        assert len(encrypted_data["name"]) > 0
        assert len(encrypted_data["email"]) > 0

    def test_encrypt_dict_missing_fields(self):
        """Test encrypting non-existent fields in dictionary."""
        service = EncryptionService()
        data = {"id": 1, "name": "John"}
        fields = ["name", "missing_field"]

        encrypted_data = service.encrypt_dict(data, fields)

        assert encrypted_data["id"] == 1
        assert encrypted_data["name"] != "John"
        assert "missing_field" not in encrypted_data

    def test_encrypt_dict_empty_values(self):
        """Test encrypting fields with empty values."""
        service = EncryptionService()
        data = {"name": "", "email": None, "phone": "123-456-7890"}
        fields = ["name", "email", "phone"]

        encrypted_data = service.encrypt_dict(data, fields)

        assert encrypted_data["name"] == ""  # Empty string not encrypted
        assert encrypted_data["email"] is None  # None not encrypted
        assert encrypted_data["phone"] != "123-456-7890"

    def test_decrypt_dict_valid_fields(self):
        """Test decrypting specific fields in dictionary."""
        service = EncryptionService()
        data = {"name": "John Doe", "email": "john@example.com", "id": 1}
        fields = ["name", "email"]

        encrypted_data = service.encrypt_dict(data, fields)
        decrypted_data = service.decrypt_dict(encrypted_data, fields)

        assert decrypted_data == data

    def test_decrypt_dict_invalid_encrypted_data(self):
        """Test decrypting dict with invalid encrypted data."""
        service = EncryptionService()
        data = {"name": "invalid_encrypted_data", "email": "also_invalid"}
        fields = ["name", "email"]

        # Should not raise exception, just leave data as-is
        result = service.decrypt_dict(data, fields)
        assert result == data

    def test_decrypt_dict_mixed_encrypted_unencrypted(self):
        """Test decrypting dict with mix of encrypted and unencrypted data."""
        service = EncryptionService()
        original_data = {"name": "John", "email": "john@test.com"}
        encrypted_data = service.encrypt_dict(original_data, ["name"])

        # Mix encrypted and unencrypted
        mixed_data = encrypted_data.copy()
        mixed_data["email"] = "plain_text_email@test.com"

        decrypted_data = service.decrypt_dict(mixed_data, ["name", "email"])

        assert decrypted_data["name"] == "John"
        assert decrypted_data["email"] == "plain_text_email@test.com"


class TestEncryptionServiceStaticMethods:
    """Test static methods of EncryptionService."""

    def test_generate_secure_token_default_length(self):
        """Test generating secure token with default length."""
        token = EncryptionService.generate_secure_token()
        assert isinstance(token, str)
        assert len(token) > 40  # URL-safe base64 encoding of 32 bytes

    def test_generate_secure_token_custom_length(self):
        """Test generating secure token with custom length."""
        for length in [16, 64, 128]:
            token = EncryptionService.generate_secure_token(length)
            assert isinstance(token, str)
            assert len(token) > length  # Base64 encoding is longer

    def test_generate_secure_token_uniqueness(self):
        """Test that generated tokens are unique."""
        tokens = set()
        for _ in range(100):
            token = EncryptionService.generate_secure_token()
            tokens.add(token)

        assert len(tokens) == 100  # All tokens should be unique

    def test_hash_sensitive_data_basic(self):
        """Test basic hashing of sensitive data."""
        data = "sensitive_password"
        hashed = EncryptionService.hash_sensitive_data(data)

        assert isinstance(hashed, str)
        assert ":" in hashed  # salt:hash format
        salt, hash_part = hashed.split(":")
        assert len(salt) == 32  # 16 bytes hex = 32 chars
        assert len(hash_part) > 0

    def test_hash_sensitive_data_with_salt(self):
        """Test hashing with provided salt."""
        data = "sensitive_password"
        salt = "custom_salt_16b"
        hashed = EncryptionService.hash_sensitive_data(data, salt)

        assert hashed.startswith(f"{salt}:")

    def test_hash_sensitive_data_different_inputs(self):
        """Test that different inputs produce different hashes."""
        data1 = "password1"
        data2 = "password2"

        hash1 = EncryptionService.hash_sensitive_data(data1)
        hash2 = EncryptionService.hash_sensitive_data(data2)

        assert hash1 != hash2

    def test_hash_sensitive_data_same_input_different_salts(self):
        """Test that same input with different salts produces different hashes."""
        data = "same_password"

        hash1 = EncryptionService.hash_sensitive_data(data)
        hash2 = EncryptionService.hash_sensitive_data(data)

        assert hash1 != hash2  # Different random salts

    def test_verify_hashed_data_correct(self):
        """Test verifying correct data against hash."""
        data = "correct_password"
        hashed = EncryptionService.hash_sensitive_data(data)

        assert EncryptionService.verify_hashed_data(data, hashed) is True

    def test_verify_hashed_data_incorrect(self):
        """Test verifying incorrect data against hash."""
        original_data = "correct_password"
        wrong_data = "wrong_password"
        hashed = EncryptionService.hash_sensitive_data(original_data)

        assert EncryptionService.verify_hashed_data(wrong_data, hashed) is False

    def test_verify_hashed_data_invalid_hash_format(self):
        """Test verifying data against invalid hash format."""
        data = "password"
        invalid_hash = "invalid_hash_format"

        assert EncryptionService.verify_hashed_data(data, invalid_hash) is False

    def test_anonymize_email_standard(self):
        """Test anonymizing standard email addresses."""
        test_cases = [
            ("john.doe@example.com", "j***e@example.com"),
            ("a@test.com", "***@test.com"),
            ("ab@test.com", "***@test.com"),
            ("user123@company.org", "u***3@company.org")
        ]

        for email, expected in test_cases:
            result = EncryptionService.anonymize_email(email)
            assert result == expected

    def test_anonymize_email_edge_cases(self):
        """Test anonymizing email edge cases."""
        # No @ symbol
        result = EncryptionService.anonymize_email("notanemail")
        assert result == "***@***"

        # Empty string
        result = EncryptionService.anonymize_email("")
        assert result == "***@***"

        # Multiple @ symbols (take first split)
        result = EncryptionService.anonymize_email("user@domain@extra.com")
        assert result == "u***r@domain@extra.com"

    def test_anonymize_phone_standard_formats(self):
        """Test anonymizing standard phone formats."""
        test_cases = [
            ("1234567890", "****90"),
            ("+41791234567", "+41****67"),
            ("+1234567890123", "+12****23"),
            ("123", "***"),  # Too short
            ("", "***"),  # Empty
        ]

        for phone, expected in test_cases:
            result = EncryptionService.anonymize_phone(phone)
            assert result == expected

    def test_anonymize_phone_edge_cases(self):
        """Test anonymizing phone edge cases."""
        # Very short numbers
        result = EncryptionService.anonymize_phone("12")
        assert result == "***"

        result = EncryptionService.anonymize_phone("1")
        assert result == "***"

        # None input
        result = EncryptionService.anonymize_phone(None)
        assert result == "***"

        # International format but short
        result = EncryptionService.anonymize_phone("+123")
        assert result == "****23"


class TestGetEncryptionService:
    """Test the singleton encryption service function."""

    def test_get_encryption_service_singleton(self):
        """Test that get_encryption_service returns singleton instance."""
        service1 = get_encryption_service()
        service2 = get_encryption_service()

        assert service1 is service2
        assert isinstance(service1, EncryptionService)

    def test_get_encryption_service_functionality(self):
        """Test that singleton service works correctly."""
        service = get_encryption_service()

        plaintext = "test message"
        encrypted = service.encrypt(plaintext)
        decrypted = service.decrypt(encrypted)

        assert decrypted == plaintext


class TestEncryptionServiceIntegration:
    """Integration tests for encryption service."""

    def test_full_workflow_personal_data(self):
        """Test full workflow with personal data encryption."""
        service = EncryptionService()

        # Simulate user data
        user_data = {
            "id": 12345,
            "username": "john_doe",
            "email": "john.doe@example.com",
            "full_name": "John Doe",
            "phone": "+41791234567",
            "created_at": "2023-01-01T00:00:00Z",
            "is_active": True
        }

        # Encrypt sensitive fields
        sensitive_fields = ["email", "full_name", "phone"]
        encrypted_data = service.encrypt_dict(user_data, sensitive_fields)

        # Verify non-sensitive data unchanged
        assert encrypted_data["id"] == user_data["id"]
        assert encrypted_data["username"] == user_data["username"]
        assert encrypted_data["created_at"] == user_data["created_at"]
        assert encrypted_data["is_active"] == user_data["is_active"]

        # Verify sensitive data encrypted
        for field in sensitive_fields:
            assert encrypted_data[field] != user_data[field]

        # Decrypt and verify
        decrypted_data = service.decrypt_dict(encrypted_data, sensitive_fields)
        assert decrypted_data == user_data

    def test_password_hashing_workflow(self):
        """Test password hashing and verification workflow."""
        # Simulate user registration
        password = "MySecurePassword123!"
        hashed_password = EncryptionService.hash_sensitive_data(password)

        # Simulate login verification
        assert EncryptionService.verify_hashed_data(password, hashed_password)
        assert not EncryptionService.verify_hashed_data("WrongPassword", hashed_password)

        # Simulate password change
        new_password = "NewSecurePassword456!"
        new_hashed_password = EncryptionService.hash_sensitive_data(new_password)

        # Old password should not work with new hash
        assert not EncryptionService.verify_hashed_data(password, new_hashed_password)
        assert EncryptionService.verify_hashed_data(new_password, new_hashed_password)

    def test_token_generation_for_session_management(self):
        """Test secure token generation for session management."""
        # Generate session tokens
        session_tokens = []
        for _ in range(10):
            token = EncryptionService.generate_secure_token(32)
            session_tokens.append(token)

        # All tokens should be unique
        assert len(set(session_tokens)) == 10

        # All tokens should be valid base64 URL-safe strings
        for token in session_tokens:
            assert isinstance(token, str)
            assert len(token) > 40  # 32 bytes encoded
            # Should not contain unsafe characters
            assert not any(c in token for c in ['+', '/', '='])

    def test_privacy_anonymization_workflow(self):
        """Test data anonymization for privacy compliance."""
        # Simulate GDPR data anonymization
        personal_data = [
            "john.doe@company.com",
            "jane.smith@example.org",
            "user@domain.co.uk",
            "+41791234567",
            "+33123456789",
            "555-123-4567"
        ]

        anonymized_emails = []
        anonymized_phones = []

        for item in personal_data:
            if "@" in item:
                anonymized_emails.append(EncryptionService.anonymize_email(item))
            else:
                anonymized_phones.append(EncryptionService.anonymize_phone(item))

        # Verify anonymization preserves format but hides details
        assert "j***e@company.com" in anonymized_emails
        assert "j***h@example.org" in anonymized_emails
        assert "u***r@domain.co.uk" in anonymized_emails

        # Verify phone anonymization
        assert any("****67" in phone for phone in anonymized_phones)
        assert any("****89" in phone for phone in anonymized_phones)
        assert any("****67" in phone for phone in anonymized_phones)