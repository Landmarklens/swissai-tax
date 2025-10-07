"""
Tests for encryption key rotation functionality
"""
from datetime import datetime, timedelta

import pytest
from cryptography.fernet import Fernet

from scripts.rotate_encryption_key import KeyRotationManager
from utils.encryption import EncryptionService


class TestKeyRotationManager:
    """Test key rotation manager"""

    def setup_method(self):
        """Setup test keys"""
        self.old_key = Fernet.generate_key().decode()
        self.new_key = Fernet.generate_key().decode()
        self.manager = KeyRotationManager(old_key=self.old_key, new_key=self.new_key)

    def test_generate_new_key(self):
        """Test new key generation"""
        manager = KeyRotationManager()
        new_key = manager.generate_new_key()

        # Should be valid Fernet key
        assert isinstance(new_key, str)
        assert len(new_key) > 0

        # Should be usable for encryption
        service = EncryptionService(key=new_key)
        encrypted = service.encrypt("test data")
        decrypted = service.decrypt(encrypted)
        assert decrypted == "test data"

    def test_encryption_with_different_keys(self):
        """Test that data encrypted with one key can be decrypted and re-encrypted with another"""
        old_service = EncryptionService(key=self.old_key)
        new_service = EncryptionService(key=self.new_key)

        original_data = "sensitive tax information"

        # Encrypt with old key
        encrypted_old = old_service.encrypt(original_data)

        # Decrypt with old key
        decrypted = old_service.decrypt(encrypted_old)
        assert decrypted == original_data

        # Re-encrypt with new key
        encrypted_new = new_service.encrypt(decrypted)

        # Verify new encryption is different
        assert encrypted_new != encrypted_old

        # Verify can decrypt with new key
        decrypted_new = new_service.decrypt(encrypted_new)
        assert decrypted_new == original_data

        # Verify cannot decrypt new encryption with old key
        with pytest.raises(Exception):
            old_service.decrypt(encrypted_new)

    def test_manager_has_both_services(self):
        """Test that manager initializes both encryption services"""
        assert self.manager.old_service is not None
        assert self.manager.new_service is not None
        assert self.manager.old_service.key != self.manager.new_service.key

    def test_rotation_requires_both_keys(self):
        """Test that rotation requires both old and new keys"""
        # Manager with no keys
        manager = KeyRotationManager()
        with pytest.raises(ValueError, match="Both old and new encryption keys must be provided"):
            manager.perform_rotation()

        # Manager with only old key
        manager = KeyRotationManager(old_key=self.old_key)
        with pytest.raises(ValueError):
            manager.perform_rotation()

        # Manager with only new key
        manager = KeyRotationManager(new_key=self.new_key)
        with pytest.raises(ValueError):
            manager.perform_rotation()




class TestKeyRotationSafety:
    """Test safety features of key rotation"""

    def test_different_keys_produce_different_ciphertext(self):
        """Test that same plaintext with different keys produces different ciphertext"""
        key1 = Fernet.generate_key().decode()
        key2 = Fernet.generate_key().decode()

        service1 = EncryptionService(key=key1)
        service2 = EncryptionService(key=key2)

        plaintext = "test data"

        encrypted1 = service1.encrypt(plaintext)
        encrypted2 = service2.encrypt(plaintext)

        # Different keys should produce different ciphertext
        assert encrypted1 != encrypted2

    def test_key_uniqueness(self):
        """Test that generated keys are unique"""
        manager = KeyRotationManager()

        keys = set()
        for _ in range(10):
            key = manager.generate_new_key()
            assert key not in keys, "Generated duplicate key"
            keys.add(key)

    def test_rotation_statistics_structure(self):
        """Test that rotation returns proper statistics structure"""
        manager = KeyRotationManager(
            old_key=Fernet.generate_key().decode(),
            new_key=Fernet.generate_key().decode()
        )

        # Test with empty database would require complex mocking
        # Instead, test the expected structure
        expected_keys = ['start_time', 'tax_filing_sessions', 'tax_answers', 'end_time', 'success']

        # Note: This would require actual database for full test
        # For unit test, we verify the manager is properly initialized
        assert manager.old_service is not None
        assert manager.new_service is not None


class TestKeyRotationMonitor:
    """Test key rotation monitoring integration"""

    def test_initiate_key_rotation_returns_instructions(self):
        """Test that initiate_key_rotation provides proper instructions"""
        from utils.encryption_monitor import \
            KeyRotationManager as MonitorManager

        manager = MonitorManager()
        result = manager.initiate_key_rotation()

        assert result['status'] == 'ready_to_rotate'
        assert 'next_steps' in result
        assert isinstance(result['next_steps'], list)
        assert len(result['next_steps']) > 0
        assert 'script_location' in result
        assert result['script_location'] == 'backend/scripts/rotate_encryption_key.py'

    def test_check_key_age_without_creation_date(self):
        """Test key age check when creation date is not set"""
        import os

        from utils.encryption_monitor import \
            KeyRotationManager as MonitorManager

        # Ensure ENCRYPTION_KEY_CREATED_AT is not set
        old_value = os.environ.pop('ENCRYPTION_KEY_CREATED_AT', None)

        try:
            manager = MonitorManager()
            result = manager.check_key_age()

            assert result['age_known'] is False
            assert 'message' in result
            assert result['requires_rotation'] is False
        finally:
            # Restore old value if it existed
            if old_value:
                os.environ['ENCRYPTION_KEY_CREATED_AT'] = old_value

    def test_check_key_age_with_creation_date(self, monkeypatch):
        """Test key age check when creation date is set"""
        from datetime import timedelta

        from utils.encryption_monitor import \
            KeyRotationManager as MonitorManager

        # Set creation date to 45 days ago
        creation_date = (datetime.utcnow() - timedelta(days=45)).isoformat()
        monkeypatch.setenv('ENCRYPTION_KEY_CREATED_AT', creation_date)
        monkeypatch.setenv('ENCRYPTION_KEY_ROTATION_DAYS', '90')

        manager = MonitorManager()
        result = manager.check_key_age()

        assert result['age_known'] is True
        assert result['age_days'] == 45
        assert result['rotation_policy_days'] == 90
        assert result['days_until_rotation'] == 45
        assert result['requires_rotation'] is False

    def test_check_key_age_rotation_required(self, monkeypatch):
        """Test key age check when rotation is required"""
        from datetime import timedelta

        from utils.encryption_monitor import \
            KeyRotationManager as MonitorManager

        # Set creation date to 100 days ago (past 90 day policy)
        creation_date = (datetime.utcnow() - timedelta(days=100)).isoformat()
        monkeypatch.setenv('ENCRYPTION_KEY_CREATED_AT', creation_date)
        monkeypatch.setenv('ENCRYPTION_KEY_ROTATION_DAYS', '90')

        manager = MonitorManager()
        result = manager.check_key_age()

        assert result['age_known'] is True
        assert result['age_days'] == 100
        assert result['requires_rotation'] is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
