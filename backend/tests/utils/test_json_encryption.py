"""
Unit tests for JSON field-level encryption
"""
import pytest

from utils.json_encryption import (JSONFieldEncryptor, TaxProfileEncryptor,
                                   get_tax_profile_encryptor)


class TestJSONFieldEncryptor:
    """Test JSON field encryption functionality"""

    def setup_method(self):
        """Setup test encryptor"""
        self.encryptor = JSONFieldEncryptor()

    def test_encrypt_single_field(self):
        """Test encrypting a single field"""
        data = {
            'name': 'John Doe',
            'age': 30,
            'city': 'Zurich'
        }

        encrypted = self.encryptor.encrypt_fields(data, {'name'})

        # Name should be encrypted
        assert encrypted['name'] != data['name']
        assert encrypted['name'].startswith('__encrypted__')

        # Other fields unchanged
        assert encrypted['age'] == data['age']
        assert encrypted['city'] == data['city']

    def test_decrypt_single_field(self):
        """Test decrypting a single field"""
        data = {
            'name': 'John Doe',
            'age': 30
        }

        # Encrypt then decrypt
        encrypted = self.encryptor.encrypt_fields(data, {'name'})
        decrypted = self.encryptor.decrypt_fields(encrypted, {'name'})

        assert decrypted == data

    def test_encrypt_multiple_fields(self):
        """Test encrypting multiple fields"""
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'public_info': 'visible'
        }

        sensitive_fields = {'first_name', 'last_name', 'email'}
        encrypted = self.encryptor.encrypt_fields(data, sensitive_fields)

        # Check all sensitive fields encrypted
        for field in sensitive_fields:
            assert encrypted[field].startswith('__encrypted__')

        # Public field unchanged
        assert encrypted['public_info'] == data['public_info']

        # Decrypt and verify
        decrypted = self.encryptor.decrypt_fields(encrypted, sensitive_fields)
        assert decrypted == data

    def test_encrypt_nested_fields(self):
        """Test encrypting nested fields using dot notation"""
        data = {
            'user': {
                'name': 'John Doe',
                'contact': {
                    'email': 'john@example.com'
                }
            },
            'public': 'data'
        }

        field_paths = {'user.name', 'user.contact.email'}
        encrypted = self.encryptor.encrypt_nested(data, field_paths)

        # Check nested fields encrypted
        assert encrypted['user']['name'].startswith('__encrypted__')
        assert encrypted['user']['contact']['email'].startswith('__encrypted__')

        # Public field unchanged
        assert encrypted['public'] == data['public']

        # Decrypt and verify
        decrypted = self.encryptor.decrypt_nested(encrypted, field_paths)
        assert decrypted == data

    def test_encrypt_none_values(self):
        """Test handling None values in fields"""
        data = {
            'field1': None,
            'field2': 'value'
        }

        encrypted = self.encryptor.encrypt_fields(data, {'field1', 'field2'})

        # None should remain None
        assert encrypted['field1'] is None

        # Regular field should be encrypted
        assert encrypted['field2'].startswith('__encrypted__')

    def test_empty_data(self):
        """Test encrypting empty dictionary"""
        data = {}
        encrypted = self.encryptor.encrypt_fields(data, {'field1'})
        assert encrypted == {}

    def test_missing_nested_path(self):
        """Test encrypting when nested path doesn't exist"""
        data = {
            'user': {
                'name': 'John'
            }
        }

        # Try to encrypt non-existent path
        encrypted = self.encryptor.encrypt_nested(data, {'user.email'})

        # Should not raise error, just skip
        assert encrypted == data


class TestTaxProfileEncryptor:
    """Test tax-specific profile encryption"""

    def setup_method(self):
        """Setup test encryptor"""
        self.encryptor = TaxProfileEncryptor()

    def test_encrypt_tax_profile(self):
        """Test encrypting complete tax profile"""
        profile = {
            'civil_status': 'married',
            'canton': 'ZH',
            'municipality': 'Zürich',
            'pillar_3a_amount': 6883.0,
            'donation_amount': 500.0,
            'spouse': {
                'first_name': 'Jane',
                'last_name': 'Doe',
                'date_of_birth': '1990-01-15'
            }
        }

        encrypted = self.encryptor.encrypt_profile(profile)

        # Check sensitive top-level fields encrypted
        assert encrypted['municipality'].startswith('__encrypted__')
        assert str(encrypted['pillar_3a_amount']).startswith('__encrypted__')
        assert str(encrypted['donation_amount']).startswith('__encrypted__')

        # Check sensitive nested fields encrypted
        assert encrypted['spouse']['first_name'].startswith('__encrypted__')
        assert encrypted['spouse']['last_name'].startswith('__encrypted__')
        assert encrypted['spouse']['date_of_birth'].startswith('__encrypted__')

        # Check non-sensitive fields unchanged
        assert encrypted['civil_status'] == profile['civil_status']
        assert encrypted['canton'] == profile['canton']

    def test_decrypt_tax_profile(self):
        """Test decrypting complete tax profile"""
        profile = {
            'civil_status': 'single',
            'municipality': 'Geneva',
            'pillar_3a_amount': 7056.0,
            'donation_amount': 1000.0
        }

        # Encrypt then decrypt
        encrypted = self.encryptor.encrypt_profile(profile)
        decrypted = self.encryptor.decrypt_profile(encrypted)

        # Should match original
        assert decrypted['municipality'] == profile['municipality']
        assert float(decrypted['pillar_3a_amount']) == profile['pillar_3a_amount']
        assert float(decrypted['donation_amount']) == profile['donation_amount']

    def test_encrypt_profile_with_spouse(self):
        """Test encrypting profile with spouse information"""
        profile = {
            'civil_status': 'married',
            'spouse': {
                'first_name': 'Marie',
                'last_name': 'Dupont',
                'date_of_birth': '1985-03-20',
                'is_employed': True
            },
            'pillar_3a_amount': 6883.0
        }

        encrypted = self.encryptor.encrypt_profile(profile)

        # Spouse sensitive fields should be encrypted
        assert encrypted['spouse']['first_name'].startswith('__encrypted__')
        assert encrypted['spouse']['last_name'].startswith('__encrypted__')
        assert encrypted['spouse']['date_of_birth'].startswith('__encrypted__')

        # Non-sensitive spouse field unchanged
        assert encrypted['spouse']['is_employed'] == True

        # Decrypt and verify
        decrypted = self.encryptor.decrypt_profile(encrypted)
        assert decrypted['spouse']['first_name'] == profile['spouse']['first_name']
        assert decrypted['spouse']['last_name'] == profile['spouse']['last_name']

    def test_encrypt_profile_without_spouse(self):
        """Test encrypting profile without spouse"""
        profile = {
            'civil_status': 'single',
            'municipality': 'Basel',
            'pillar_3a_amount': 5000.0
        }

        encrypted = self.encryptor.encrypt_profile(profile)
        decrypted = self.encryptor.decrypt_profile(encrypted)

        # Should handle missing spouse gracefully
        assert 'spouse' not in decrypted
        assert decrypted['municipality'] == profile['municipality']

    def test_singleton_tax_encryptor(self):
        """Test get_tax_profile_encryptor returns singleton"""
        encryptor1 = get_tax_profile_encryptor()
        encryptor2 = get_tax_profile_encryptor()

        assert encryptor1 is encryptor2

    def test_all_financial_fields_encrypted(self):
        """Test that all financial amounts are encrypted"""
        profile = {
            'pillar_3a_amount': 6883.0,
            'donation_amount': 500.0,
            'alimony_amount': 2000.0,
            'medical_expense_amount': 1500.0
        }

        encrypted = self.encryptor.encrypt_profile(profile)

        # All financial fields should be encrypted
        for field in ['pillar_3a_amount', 'donation_amount', 'alimony_amount', 'medical_expense_amount']:
            assert str(encrypted[field]).startswith('__encrypted__')

        # Decrypt and verify all amounts
        decrypted = self.encryptor.decrypt_profile(encrypted)
        for field in profile:
            assert float(decrypted[field]) == profile[field]


class TestIntegrationScenarios:
    """Integration tests for realistic usage scenarios"""

    def setup_method(self):
        """Setup test environment"""
        self.encryptor = TaxProfileEncryptor()

    def test_complete_tax_filing_workflow(self):
        """Test complete workflow: create, encrypt, store, retrieve, decrypt"""
        # User completes tax interview
        original_profile = {
            'civil_status': 'married',
            'canton': 'ZH',
            'municipality': 'Winterthur',
            'spouse': {
                'first_name': 'Anna',
                'last_name': 'Schmidt',
                'date_of_birth': '1988-07-12',
                'is_employed': True
            },
            'pillar_3a_amount': 6883.0,
            'donation_amount': 750.0,
            'has_children': True,
            'num_children': 2
        }

        # 1. Encrypt before storing
        encrypted_profile = self.encryptor.encrypt_profile(original_profile)

        # Simulate storing to database (profile would be JSON serialized)
        stored_profile = encrypted_profile.copy()

        # 2. Retrieve from database
        retrieved_profile = stored_profile.copy()

        # 3. Decrypt for use
        decrypted_profile = self.encryptor.decrypt_profile(retrieved_profile)

        # 4. Verify all sensitive data matches
        assert decrypted_profile['municipality'] == original_profile['municipality']
        assert float(decrypted_profile['pillar_3a_amount']) == original_profile['pillar_3a_amount']
        assert float(decrypted_profile['donation_amount']) == original_profile['donation_amount']
        assert decrypted_profile['spouse']['first_name'] == original_profile['spouse']['first_name']
        assert decrypted_profile['spouse']['last_name'] == original_profile['spouse']['last_name']
        assert decrypted_profile['spouse']['date_of_birth'] == original_profile['spouse']['date_of_birth']

        # 5. Verify non-sensitive data unchanged throughout
        assert decrypted_profile['civil_status'] == original_profile['civil_status']
        assert decrypted_profile['canton'] == original_profile['canton']
        assert decrypted_profile['has_children'] == original_profile['has_children']

    def test_profile_update_workflow(self):
        """Test updating encrypted profile"""
        # Original profile
        profile = {
            'municipality': 'Bern',
            'pillar_3a_amount': 5000.0
        }

        # Encrypt and "store"
        encrypted = self.encryptor.encrypt_profile(profile)

        # "Retrieve" and decrypt for editing
        decrypted = self.encryptor.decrypt_profile(encrypted)

        # User updates amount
        decrypted['pillar_3a_amount'] = 6883.0

        # Re-encrypt for storage
        re_encrypted = self.encryptor.encrypt_profile(decrypted)

        # Verify update persists
        final = self.encryptor.decrypt_profile(re_encrypted)
        assert float(final['pillar_3a_amount']) == 6883.0
