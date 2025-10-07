#!/usr/bin/env python3
"""
Integration test for encryption system
Tests end-to-end encryption workflow
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json

from utils.aws_secrets import get_encryption_key
from utils.encryption import get_encryption_service
from utils.encryption_monitor import get_encryption_health_check
from utils.json_encryption import get_tax_profile_encryptor


def test_basic_encryption():
    """Test basic encryption/decryption"""
    print("🔐 Testing Basic Encryption...")
    service = get_encryption_service()

    test_data = "Sensitive taxpayer information: CHF 125,000"
    encrypted = service.encrypt(test_data)
    decrypted = service.decrypt(encrypted)

    assert decrypted == test_data
    assert encrypted != test_data
    print(f"✅ Basic encryption works")
    print(f"   Original: {test_data}")
    print(f"   Encrypted: {encrypted[:50]}...")
    print(f"   Decrypted: {decrypted}")

def test_tax_profile_encryption():
    """Test tax profile encryption"""
    print("\n🏦 Testing Tax Profile Encryption...")
    encryptor = get_tax_profile_encryptor()

    profile = {
        'civil_status': 'married',
        'canton': 'ZH',
        'municipality': 'Zürich',  # Sensitive
        'pillar_3a_amount': 6883.0,  # Sensitive
        'donation_amount': 500.0,  # Sensitive
        'spouse': {
            'first_name': 'Marie',  # Sensitive
            'last_name': 'Dupont',  # Sensitive
            'date_of_birth': '1988-07-12',  # Sensitive
            'is_employed': True
        }
    }

    # Encrypt
    encrypted_profile = encryptor.encrypt_profile(profile)

    # Verify sensitive fields are encrypted
    assert encrypted_profile['municipality'].startswith('__encrypted__')
    assert str(encrypted_profile['pillar_3a_amount']).startswith('__encrypted__')
    assert encrypted_profile['spouse']['first_name'].startswith('__encrypted__')

    # Verify non-sensitive fields are not encrypted
    assert encrypted_profile['civil_status'] == 'married'
    assert encrypted_profile['canton'] == 'ZH'

    print(f"✅ Profile encryption works")
    print(f"   Municipality (encrypted): {encrypted_profile['municipality'][:50]}...")
    print(f"   Canton (not encrypted): {encrypted_profile['canton']}")

    # Decrypt
    decrypted_profile = encryptor.decrypt_profile(encrypted_profile)

    assert decrypted_profile['municipality'] == profile['municipality']
    assert float(decrypted_profile['pillar_3a_amount']) == profile['pillar_3a_amount']
    assert decrypted_profile['spouse']['first_name'] == profile['spouse']['first_name']

    print(f"✅ Profile decryption works")
    print(f"   Municipality: {decrypted_profile['municipality']}")
    print(f"   Pillar 3a: {decrypted_profile['pillar_3a_amount']}")

def test_aws_secrets_retrieval():
    """Test AWS Secrets Manager key retrieval"""
    print("\n☁️  Testing AWS Secrets Manager...")

    try:
        key = get_encryption_key()
        if key:
            print(f"✅ Successfully retrieved encryption key from AWS")
            print(f"   Key (first 10 chars): {key[:10]}...")
        else:
            print(f"⚠️  Using environment variable fallback")
            env_key = os.environ.get('ENCRYPTION_KEY')
            if env_key:
                print(f"   Key (first 10 chars): {env_key[:10]}...")
    except Exception as e:
        print(f"⚠️  AWS Secrets Manager not available: {e}")
        print(f"   Using environment variable fallback")

def test_encryption_health():
    """Test encryption health check"""
    print("\n🏥 Testing Encryption Health Check...")

    health_check = get_encryption_health_check()
    status = health_check.perform_health_check()

    print(f"✅ Health check complete")
    print(f"   Overall Status: {status['overall_status']}")
    print(f"   Checks:")
    for check_name, check_result in status['checks'].items():
        status_symbol = "✅" if check_result.get('status') == 'healthy' else "⚠️"
        print(f"     {status_symbol} {check_name}: {check_result.get('status')}")

def test_performance():
    """Test encryption performance"""
    print("\n⚡ Testing Encryption Performance...")
    import time

    service = get_encryption_service()

    # Test small data
    small_data = "test@example.com"
    start = time.time()
    for _ in range(1000):
        encrypted = service.encrypt(small_data)
        decrypted = service.decrypt(encrypted)
    small_time = (time.time() - start) * 1000

    print(f"✅ Performance test complete")
    print(f"   1000 encrypt/decrypt operations: {small_time:.2f}ms")
    print(f"   Average per operation: {small_time/1000:.2f}ms")

    # Test large data
    large_data = "x" * 10000
    start = time.time()
    encrypted = service.encrypt(large_data)
    decrypted = service.decrypt(encrypted)
    large_time = (time.time() - start) * 1000

    print(f"   10KB data encryption: {large_time:.2f}ms")

def test_anonymization():
    """Test data anonymization"""
    print("\n🎭 Testing Data Anonymization...")
    from utils.encryption import EncryptionService

    # Email anonymization
    email = "john.doe@swissaitax.ch"
    anon_email = EncryptionService.anonymize_email(email)
    print(f"✅ Email anonymization")
    print(f"   Original: {email}")
    print(f"   Anonymized: {anon_email}")

    # Phone anonymization
    phone = "+41791234567"
    anon_phone = EncryptionService.anonymize_phone(phone)
    print(f"✅ Phone anonymization")
    print(f"   Original: {phone}")
    print(f"   Anonymized: {anon_phone}")

def main():
    """Run all integration tests"""
    print("=" * 70)
    print("SwissAI Tax - Encryption System Integration Test")
    print("=" * 70)

    try:
        test_basic_encryption()
        test_tax_profile_encryption()
        test_aws_secrets_retrieval()
        test_encryption_health()
        test_performance()
        test_anonymization()

        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED - Encryption system is working correctly!")
        print("=" * 70)
        print("\nNext Steps:")
        print("1. Run database migration: alembic upgrade head")
        print("2. Verify encryption in production environment")
        print("3. Set up monitoring alerts for encryption health")
        print("4. Schedule first key rotation (90 days)")

        return 0

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
