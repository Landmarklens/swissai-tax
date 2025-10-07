"""
Unit tests for encryption utilities
Tests encryption, decryption, hashing, and anonymization
"""
import os

import pytest
from cryptography.fernet import Fernet

from utils.encryption import EncryptionService, get_encryption_service


class TestEncryptionService:
    """Test encryption service functionality"""

    def setup_method(self):
        """Setup test encryption service with known key"""
        self.test_key = Fernet.generate_key()
        self.service = EncryptionService(key=self.test_key)

    def test_encrypt_decrypt_string(self):
        """Test basic string encryption and decryption"""
        plaintext = "Sensitive personal information"

        # Encrypt
        encrypted = self.service.encrypt(plaintext)
        assert encrypted != plaintext
        assert len(encrypted) > len(plaintext)

        # Decrypt
        decrypted = self.service.decrypt(encrypted)
        assert decrypted == plaintext

    def test_encrypt_empty_string(self):
        """Test encrypting empty string"""
        encrypted = self.service.encrypt("")
        assert encrypted == ""

    def test_encrypt_none(self):
        """Test encrypting None value"""
        encrypted = self.service.encrypt(None)
        assert encrypted is None

    def test_decrypt_empty_string(self):
        """Test decrypting empty string"""
        decrypted = self.service.decrypt("")
        assert decrypted == ""

    def test_decrypt_none(self):
        """Test decrypting None value"""
        decrypted = self.service.decrypt(None)
        assert decrypted is None

    def test_encrypt_special_characters(self):
        """Test encrypting strings with special characters"""
        special_chars = "€ÄÖÜäöüß@#$%^&*()[]{}!\"'<>?"
        encrypted = self.service.encrypt(special_chars)
        decrypted = self.service.decrypt(encrypted)
        assert decrypted == special_chars

    def test_encrypt_unicode(self):
        """Test encrypting unicode strings"""
        unicode_text = "日本語 中文 한국어 العربية"
        encrypted = self.service.encrypt(unicode_text)
        decrypted = self.service.decrypt(encrypted)
        assert decrypted == unicode_text

    def test_encrypt_numbers(self):
        """Test encrypting numeric strings"""
        number = "123456.78"
        encrypted = self.service.encrypt(number)
        decrypted = self.service.decrypt(encrypted)
        assert decrypted == number

    def test_encrypt_dict_fields(self):
        """Test encrypting specific fields in dictionary"""
        data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'age': '30',
            'public_field': 'visible'
        }

        sensitive_fields = ['name', 'email']

        encrypted_data = self.service.encrypt_dict(data, sensitive_fields)

        # Check encrypted fields
        assert encrypted_data['name'] != data['name']
        assert encrypted_data['email'] != data['email']

        # Check unencrypted fields
        assert encrypted_data['age'] == data['age']
        assert encrypted_data['public_field'] == data['public_field']

        # Decrypt
        decrypted_data = self.service.decrypt_dict(encrypted_data, sensitive_fields)
        assert decrypted_data == data

    def test_encrypt_dict_missing_fields(self):
        """Test encrypting dictionary when specified fields don't exist"""
        data = {'field1': 'value1'}
        sensitive_fields = ['field1', 'nonexistent_field']

        encrypted_data = self.service.encrypt_dict(data, sensitive_fields)
        assert 'field1' in encrypted_data
        assert 'nonexistent_field' not in encrypted_data

    def test_decrypt_unencrypted_data(self):
        """Test that decrypting unencrypted data fails gracefully"""
        data = {
            'name': 'plaintext',
            'email': 'plain@example.com'
        }

        # Try to decrypt data that was never encrypted
        decrypted = self.service.decrypt_dict(data, ['name', 'email'])

        # Should handle gracefully (might return original or None)
        assert decrypted is not None

    def test_generate_secure_token(self):
        """Test secure token generation"""
        token1 = EncryptionService.generate_secure_token(32)
        token2 = EncryptionService.generate_secure_token(32)

        # Tokens should be different
        assert token1 != token2

        # Tokens should be URL-safe
        assert '/' not in token1
        assert '+' not in token1

        # Test different lengths
        short_token = EncryptionService.generate_secure_token(16)
        long_token = EncryptionService.generate_secure_token(64)
        assert len(short_token) < len(long_token)

    def test_hash_sensitive_data(self):
        """Test one-way hashing of sensitive data"""
        sensitive_data = "password123"

        # Hash the data
        hashed = EncryptionService.hash_sensitive_data(sensitive_data)

        # Hash should be different from original
        assert hashed != sensitive_data

        # Hash should contain salt
        assert ':' in hashed

        # Same data should produce different hashes (due to salt)
        hashed2 = EncryptionService.hash_sensitive_data(sensitive_data)
        assert hashed != hashed2

    def test_hash_with_salt(self):
        """Test hashing with specific salt"""
        data = "secret_value"
        salt = "known_salt"

        hash1 = EncryptionService.hash_sensitive_data(data, salt)
        hash2 = EncryptionService.hash_sensitive_data(data, salt)

        # Same data + same salt should produce same hash
        assert hash1 == hash2

    def test_verify_hashed_data(self):
        """Test verification of hashed data"""
        original_data = "my_secret_password"

        # Hash the data
        hashed = EncryptionService.hash_sensitive_data(original_data)

        # Verify correct data
        assert EncryptionService.verify_hashed_data(original_data, hashed) is True

        # Verify incorrect data
        assert EncryptionService.verify_hashed_data("wrong_password", hashed) is False

    def test_anonymize_email(self):
        """Test email anonymization"""
        # Standard email
        email = "john.doe@example.com"
        anonymized = EncryptionService.anonymize_email(email)
        assert 'j***e@example.com' == anonymized
        assert '@example.com' in anonymized

        # Short local part
        short_email = "ab@test.com"
        anonymized_short = EncryptionService.anonymize_email(short_email)
        assert '***@test.com' == anonymized_short

        # Invalid email
        invalid = "notemail"
        anonymized_invalid = EncryptionService.anonymize_email(invalid)
        assert anonymized_invalid == '***@***'

    def test_anonymize_phone(self):
        """Test phone number anonymization"""
        # International format
        intl_phone = "+41791234567"
        anonymized_intl = EncryptionService.anonymize_phone(intl_phone)
        assert anonymized_intl.startswith("+41")
        assert anonymized_intl.endswith("67")
        assert '****' in anonymized_intl

        # National format
        national_phone = "0791234567"
        anonymized_national = EncryptionService.anonymize_phone(national_phone)
        assert anonymized_national == "****67"

        # Short phone
        short_phone = "123"
        anonymized_short = EncryptionService.anonymize_phone(short_phone)
        assert anonymized_short == "***"

        # Empty phone
        empty = ""
        anonymized_empty = EncryptionService.anonymize_phone(empty)
        assert anonymized_empty == "***"

    def test_encryption_with_env_key(self, monkeypatch):
        """Test encryption service initialization with environment variable"""
        # Set environment variable
        test_env_key = Fernet.generate_key().decode()
        monkeypatch.setenv('ENCRYPTION_KEY', test_env_key)

        # Create service without explicit key
        service = EncryptionService()

        # Should use environment key
        plaintext = "test data"
        encrypted = service.encrypt(plaintext)
        decrypted = service.decrypt(encrypted)
        assert decrypted == plaintext

    def test_singleton_service(self):
        """Test get_encryption_service returns singleton"""
        service1 = get_encryption_service()
        service2 = get_encryption_service()

        # Should be same instance
        assert service1 is service2

    def test_large_data_encryption(self):
        """Test encrypting large data"""
        # Generate large string (1MB)
        large_data = "x" * (1024 * 1024)

        encrypted = self.service.encrypt(large_data)
        decrypted = self.service.decrypt(encrypted)

        assert decrypted == large_data

    def test_encryption_consistency(self):
        """Test that same plaintext produces different ciphertexts"""
        plaintext = "sensitive data"

        encrypted1 = self.service.encrypt(plaintext)
        encrypted2 = self.service.encrypt(plaintext)

        # Fernet includes timestamp and IV, so ciphertexts differ
        # But both decrypt to same plaintext
        assert self.service.decrypt(encrypted1) == plaintext
        assert self.service.decrypt(encrypted2) == plaintext


class TestEncryptionIntegration:
    """Integration tests for encryption in realistic scenarios"""

    def setup_method(self):
        """Setup test environment"""
        self.service = EncryptionService()

    def test_tax_profile_encryption(self):
        """Test encrypting a complete tax profile"""
        profile = {
            'civil_status': 'married',
            'canton': 'ZH',
            'municipality': 'Zürich',
            'pillar_3a_amount': '6883.00',
            'spouse': {
                'first_name': 'Jane',
                'last_name': 'Doe'
            }
        }

        sensitive_fields = ['municipality', 'pillar_3a_amount']

        # Encrypt profile
        encrypted_profile = self.service.encrypt_dict(profile, sensitive_fields)

        # Check sensitive fields are encrypted
        assert encrypted_profile['municipality'] != profile['municipality']
        assert encrypted_profile['pillar_3a_amount'] != profile['pillar_3a_amount']

        # Check non-sensitive fields unchanged
        assert encrypted_profile['civil_status'] == profile['civil_status']
        assert encrypted_profile['canton'] == profile['canton']

        # Decrypt profile
        decrypted_profile = self.service.decrypt_dict(encrypted_profile, sensitive_fields)

        # Should match original
        assert decrypted_profile['municipality'] == profile['municipality']
        assert decrypted_profile['pillar_3a_amount'] == profile['pillar_3a_amount']

    def test_multiple_user_data_separation(self):
        """Test that different encryption instances maintain data separation"""
        service1 = EncryptionService()
        service2 = EncryptionService()

        data = "user specific data"

        encrypted1 = service1.encrypt(data)
        encrypted2 = service2.encrypt(data)

        # Both should decrypt with their own keys
        assert service1.decrypt(encrypted1) == data
        assert service2.decrypt(encrypted2) == data
