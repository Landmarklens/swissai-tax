"""
Comprehensive unit tests for utility modules to increase coverage from 40-55% to 80%+
Tests: auth.py, aws_secrets.py, validators.py, encrypted_types.py,
       encryption_monitor.py, s3_encryption.py, password.py
"""
import json
import os
import time
import unittest
from datetime import datetime, timedelta
from io import BytesIO
from unittest.mock import MagicMock, Mock, PropertyMock, call, patch

import pytest
from botocore.exceptions import ClientError
from cryptography.fernet import Fernet
from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy import String, Text

# Import modules under test
from utils import auth, aws_secrets, password, validators
from utils.encrypted_types import (EncryptedJSON, EncryptedString,
                                    EncryptedText, HashedString)
from utils.encryption_monitor import (EncryptionHealthCheck,
                                       EncryptionMetrics, EncryptionMonitor,
                                       KeyRotationManager)
from utils.s3_encryption import S3EncryptedStorage


# ============================================================================
# TEST PASSWORD UTILITY (18% -> 95%+)
# ============================================================================

class TestPasswordUtils(unittest.TestCase):
    """Test password hashing and verification utilities"""

    def test_get_password_hash_creates_valid_hash(self):
        """Test password hashing produces valid bcrypt hash"""
        plain_password = "SecureP@ssw0rd"
        hashed = password.get_password_hash(plain_password)

        # Check it's a bcrypt hash
        self.assertTrue(hashed.startswith(('$2a$', '$2b$', '$2y$')))
        self.assertGreater(len(hashed), 50)

    def test_get_password_hash_different_each_time(self):
        """Test password hashing produces different results (salt)"""
        plain_password = "SecureP@ssw0rd"
        hash1 = password.get_password_hash(plain_password)
        hash2 = password.get_password_hash(plain_password)

        self.assertNotEqual(hash1, hash2)

    def test_verify_password_correct_password(self):
        """Test password verification with correct password"""
        plain = "MyS3cureP@ss"
        hashed = password.get_password_hash(plain)

        self.assertTrue(password.verify_password(plain, hashed))

    def test_verify_password_incorrect_password(self):
        """Test password verification with incorrect password"""
        plain = "MyS3cureP@ss"
        hashed = password.get_password_hash(plain)

        self.assertFalse(password.verify_password("WrongPassword", hashed))

    def test_verify_password_invalid_hash(self):
        """Test password verification with invalid hash format"""
        self.assertFalse(password.verify_password("password", "not_a_bcrypt_hash"))
        self.assertFalse(password.verify_password("password", "$1$invalid"))

    def test_verify_password_empty_inputs(self):
        """Test password verification with empty/None inputs"""
        hashed = password.get_password_hash("password")

        self.assertFalse(password.verify_password("", hashed))
        self.assertFalse(password.verify_password(None, hashed))

    def test_verify_password_non_string_inputs(self):
        """Test password verification with non-string inputs"""
        self.assertFalse(password.verify_password(12345, "hash"))
        self.assertFalse(password.verify_password("password", 12345))


# ============================================================================
# TEST AUTH UTILITIES (40% -> 85%+)
# ============================================================================

class TestAuthUtils(unittest.TestCase):
    """Test authentication and JWT utilities"""

    def setUp(self):
        """Set up test environment"""
        self.test_email = "test@example.com"
        self.test_password = "password123"

    @patch('utils.auth.settings')
    def test_token_response_format(self, mock_settings):
        """Test token response format"""
        token = "sample_jwt_token"
        response = auth.token_response(token)

        self.assertEqual(response['access_token'], token)
        self.assertEqual(response['token_type'], 'bearer')

    @patch('utils.auth.settings')
    def test_token_response_custom_type(self, mock_settings):
        """Test token response with custom type"""
        token = "sample_jwt_token"
        response = auth.token_response(token, token_type="custom")

        self.assertEqual(response['token_type'], 'custom')

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.encode')
    def test_sign_jwt_basic(self, mock_encode, mock_settings):
        """Test JWT signing with basic parameters"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_encode.return_value = "encoded_token"

        result = auth.sign_jwt(self.test_email)

        self.assertEqual(result['access_token'], "encoded_token")
        self.assertEqual(result['token_type'], "bearer")
        mock_encode.assert_called_once()

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.encode')
    def test_sign_jwt_with_user_type(self, mock_encode, mock_settings):
        """Test JWT signing with user type"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_encode.return_value = "encoded_token"

        auth.sign_jwt(self.test_email, user_type="admin")

        # Check that user_type was included in payload
        call_args = mock_encode.call_args[0][0]
        self.assertEqual(call_args['user_type'], 'admin')

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.encode')
    def test_sign_jwt_with_session_id(self, mock_encode, mock_settings):
        """Test JWT signing with custom session ID"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        mock_encode.return_value = "encoded_token"
        session_id = "custom_session_123"

        auth.sign_jwt(self.test_email, session_id=session_id)

        call_args = mock_encode.call_args[0][0]
        self.assertEqual(call_args['session_id'], session_id)

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.encode')
    def test_sign_temp_2fa_jwt(self, mock_encode, mock_settings):
        """Test temporary 2FA JWT creation"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_encode.return_value = "temp_token"

        result = auth.sign_temp_2fa_jwt(self.test_email, "user_123")

        self.assertEqual(result['temp_token'], "temp_token")
        self.assertEqual(result['token_type'], "bearer")

        call_args = mock_encode.call_args[0][0]
        self.assertEqual(call_args['requires_2fa'], True)
        self.assertEqual(call_args['user_id'], "user_123")

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.decode')
    def test_verify_temp_2fa_jwt_valid(self, mock_decode, mock_settings):
        """Test verification of valid 2FA temp token"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_decode.return_value = {
            "email": self.test_email,
            "user_id": "user_123",
            "requires_2fa": True
        }

        result = auth.verify_temp_2fa_jwt("valid_token")

        self.assertIsNotNone(result)
        self.assertEqual(result['requires_2fa'], True)

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.decode')
    def test_verify_temp_2fa_jwt_missing_flag(self, mock_decode, mock_settings):
        """Test verification fails when requires_2fa is missing"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_decode.return_value = {
            "email": self.test_email,
            "user_id": "user_123"
        }

        result = auth.verify_temp_2fa_jwt("token_without_2fa_flag")

        self.assertIsNone(result)

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.decode')
    def test_verify_temp_2fa_jwt_invalid(self, mock_decode, mock_settings):
        """Test verification of invalid token"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_decode.side_effect = JWTError("Invalid token")

        result = auth.verify_temp_2fa_jwt("invalid_token")

        self.assertIsNone(result)

    @patch('utils.auth.settings')
    def test_get_google_flow_success(self, mock_settings):
        """Test Google OAuth flow creation with valid settings"""
        mock_settings.GOOGLE_CLIENT_ID = "test_client_id"
        mock_settings.GOOGLE_CLIENT_SECRET = "test_secret"
        mock_settings.GOOGLE_REDIRECT_URI = "http://localhost/callback"

        with patch('utils.auth.Flow.from_client_config') as mock_flow:
            mock_flow.return_value = MagicMock()
            flow = auth.get_google_flow()

            self.assertIsNotNone(flow)
            mock_flow.assert_called_once()

    @patch('utils.auth.settings')
    def test_get_google_flow_missing_config(self, mock_settings):
        """Test Google OAuth flow raises error when config is missing"""
        mock_settings.GOOGLE_CLIENT_ID = None
        mock_settings.GOOGLE_CLIENT_SECRET = None
        mock_settings.GOOGLE_REDIRECT_URI = None

        with self.assertRaises(ValueError) as context:
            auth.get_google_flow()

        self.assertIn("not configured", str(context.exception))

    @patch('utils.auth.get_user_by_email')
    @patch('utils.auth.verify_password')
    def test_check_user_valid_credentials(self, mock_verify, mock_get_user):
        """Test check_user with valid credentials"""
        mock_user = Mock()
        mock_user.email = self.test_email
        mock_user.password = "hashed_password"

        mock_get_user.return_value = mock_user
        mock_verify.return_value = True

        mock_data = Mock()
        mock_data.email = self.test_email
        mock_data.password = self.test_password
        mock_db = Mock()

        result = auth.check_user(mock_data, mock_db)

        self.assertTrue(result)

    @patch('utils.auth.get_user_by_email')
    def test_check_user_user_not_found(self, mock_get_user):
        """Test check_user when user doesn't exist"""
        mock_get_user.return_value = None

        mock_data = Mock()
        mock_data.email = self.test_email
        mock_data.password = self.test_password
        mock_db = Mock()

        result = auth.check_user(mock_data, mock_db)

        self.assertFalse(result)

    @patch('utils.auth.get_user_by_email')
    @patch('utils.auth.verify_password')
    def test_check_user_wrong_password(self, mock_verify, mock_get_user):
        """Test check_user with wrong password"""
        mock_user = Mock()
        mock_user.email = self.test_email
        mock_user.password = "hashed_password"

        mock_get_user.return_value = mock_user
        mock_verify.return_value = False

        mock_data = Mock()
        mock_data.email = self.test_email
        mock_data.password = "wrong_password"
        mock_db = Mock()

        result = auth.check_user(mock_data, mock_db)

        self.assertFalse(result)


class TestJWTHandler(unittest.TestCase):
    """Test JWTHandler class"""

    @patch('utils.auth.settings')
    def test_jwt_handler_init(self, mock_settings):
        """Test JWTHandler initialization"""
        handler = auth.JWTHandler()

        self.assertIsNone(handler.token)
        self.assertIsNone(handler.payload)

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.decode')
    def test_verify_jwt_valid_token(self, mock_decode, mock_settings):
        """Test JWT verification with valid token"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_decode.return_value = {"email": "test@example.com"}

        handler = auth.JWTHandler()
        result = handler.verify_jwt("valid_token")

        self.assertTrue(result)
        self.assertIsNotNone(handler.payload)

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.decode')
    def test_verify_jwt_invalid_token(self, mock_decode, mock_settings):
        """Test JWT verification with invalid token"""
        mock_settings.SECRET_KEY = "test_secret"
        mock_decode.side_effect = JWTError("Invalid")

        handler = auth.JWTHandler()
        result = handler.verify_jwt("invalid_token")

        self.assertFalse(result)
        self.assertIsNone(handler.payload)

    def test_get_payload_empty(self):
        """Test get_payload when no payload is set"""
        handler = auth.JWTHandler()
        payload = handler.get_payload()

        self.assertEqual(payload, {})

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.decode')
    def test_get_payload_with_data(self, mock_decode, mock_settings):
        """Test get_payload with actual payload"""
        mock_settings.SECRET_KEY = "test_secret"
        expected_payload = {"email": "test@example.com", "exp": 123456}
        mock_decode.return_value = expected_payload

        handler = auth.JWTHandler()
        handler.verify_jwt("token")
        payload = handler.get_payload()

        self.assertEqual(payload, expected_payload)

    @patch('utils.auth.settings')
    @patch('utils.auth.jwt.decode')
    def test_get_user_with_valid_payload(self, mock_decode, mock_settings):
        """Test get_user with valid payload"""
        from models.swisstax import User

        mock_settings.SECRET_KEY = "test_secret"
        mock_decode.return_value = {"email": "test@example.com"}

        mock_db = Mock()
        mock_user = Mock(spec=User)
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_user
        mock_db.query.return_value = mock_query

        handler = auth.JWTHandler()
        handler.verify_jwt("token")
        user = handler.get_user(mock_db)

        self.assertEqual(user, mock_user)

    def test_get_user_no_payload(self):
        """Test get_user when no payload is set"""
        handler = auth.JWTHandler()
        mock_db = Mock()

        user = handler.get_user(mock_db)

        self.assertIsNone(user)


# ============================================================================
# TEST AWS SECRETS MANAGER (40% -> 85%+)
# ============================================================================

class TestSecretsManager(unittest.TestCase):
    """Test AWS Secrets Manager integration"""

    def setUp(self):
        """Set up test environment"""
        self.secret_name = "test/secret"

    @patch('utils.aws_secrets.boto3.client')
    def test_init_default_region(self, mock_boto_client):
        """Test initialization with default region"""
        os.environ['AWS_REGION'] = 'eu-west-1'
        manager = aws_secrets.SecretsManager()

        self.assertEqual(manager.region_name, 'eu-west-1')
        mock_boto_client.assert_called_once_with('secretsmanager', region_name='eu-west-1')

    @patch('utils.aws_secrets.boto3.client')
    def test_init_custom_region(self, mock_boto_client):
        """Test initialization with custom region"""
        manager = aws_secrets.SecretsManager(region_name='us-west-2')

        self.assertEqual(manager.region_name, 'us-west-2')

    @patch('utils.aws_secrets.boto3.client')
    def test_get_secret_json_format(self, mock_boto_client):
        """Test retrieving secret in JSON format"""
        mock_client = Mock()
        mock_client.get_secret_value.return_value = {
            'SecretString': '{"key": "value", "number": 42}'
        }
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        secret = manager.get_secret(self.secret_name)

        self.assertEqual(secret['key'], 'value')
        self.assertEqual(secret['number'], 42)

    @patch('utils.aws_secrets.boto3.client')
    def test_get_secret_plain_string(self, mock_boto_client):
        """Test retrieving secret as plain string"""
        mock_client = Mock()
        mock_client.get_secret_value.return_value = {
            'SecretString': 'plain_text_secret'
        }
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        secret = manager.get_secret(self.secret_name)

        self.assertEqual(secret['value'], 'plain_text_secret')

    @patch('utils.aws_secrets.boto3.client')
    def test_get_secret_binary(self, mock_boto_client):
        """Test retrieving binary secret"""
        mock_client = Mock()
        mock_client.get_secret_value.return_value = {
            'SecretBinary': b'binary_data'
        }
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        secret = manager.get_secret(self.secret_name)

        self.assertEqual(secret['value'], b'binary_data')

    @patch('utils.aws_secrets.boto3.client')
    def test_get_secret_not_found(self, mock_boto_client):
        """Test handling of non-existent secret"""
        mock_client = Mock()
        error_response = {'Error': {'Code': 'ResourceNotFoundException'}}
        mock_client.get_secret_value.side_effect = ClientError(error_response, 'GetSecretValue')
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        secret = manager.get_secret(self.secret_name)

        self.assertIsNone(secret)

    @patch('utils.aws_secrets.boto3.client')
    def test_get_secret_invalid_request(self, mock_boto_client):
        """Test handling of invalid request"""
        mock_client = Mock()
        error_response = {'Error': {'Code': 'InvalidRequestException'}}
        mock_client.get_secret_value.side_effect = ClientError(error_response, 'GetSecretValue')
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        secret = manager.get_secret(self.secret_name)

        self.assertIsNone(secret)

    @patch('utils.aws_secrets.boto3.client')
    def test_create_secret_success(self, mock_boto_client):
        """Test successful secret creation"""
        mock_client = Mock()
        mock_client.create_secret.return_value = {'ARN': 'arn:aws:secretsmanager:...'}
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        result = manager.create_secret(self.secret_name, {"key": "value"}, "Test description")

        self.assertTrue(result)
        mock_client.create_secret.assert_called_once()

    @patch('utils.aws_secrets.boto3.client')
    def test_create_secret_already_exists(self, mock_boto_client):
        """Test creating secret that already exists"""
        mock_client = Mock()
        error_response = {'Error': {'Code': 'ResourceExistsException'}}
        mock_client.create_secret.side_effect = ClientError(error_response, 'CreateSecret')
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        result = manager.create_secret(self.secret_name, {"key": "value"})

        self.assertFalse(result)

    @patch('utils.aws_secrets.boto3.client')
    def test_update_secret_success(self, mock_boto_client):
        """Test successful secret update"""
        mock_client = Mock()
        mock_client.update_secret.return_value = {'ARN': 'arn:aws:secretsmanager:...'}
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        result = manager.update_secret(self.secret_name, {"new_key": "new_value"})

        self.assertTrue(result)

    @patch('utils.aws_secrets.boto3.client')
    def test_update_secret_error(self, mock_boto_client):
        """Test secret update error"""
        mock_client = Mock()
        error_response = {'Error': {'Code': 'InternalServiceError'}}
        mock_client.update_secret.side_effect = ClientError(error_response, 'UpdateSecret')
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        result = manager.update_secret(self.secret_name, {"key": "value"})

        self.assertFalse(result)

    @patch('utils.aws_secrets.boto3.client')
    def test_delete_secret_scheduled(self, mock_boto_client):
        """Test scheduled secret deletion"""
        mock_client = Mock()
        mock_client.delete_secret.return_value = {'DeletionDate': datetime.utcnow()}
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        result = manager.delete_secret(self.secret_name, force_delete=False)

        self.assertTrue(result)
        call_args = mock_client.delete_secret.call_args
        self.assertEqual(call_args[1]['RecoveryWindowInDays'], 30)

    @patch('utils.aws_secrets.boto3.client')
    def test_delete_secret_force(self, mock_boto_client):
        """Test force secret deletion"""
        mock_client = Mock()
        mock_client.delete_secret.return_value = {}
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        result = manager.delete_secret(self.secret_name, force_delete=True)

        self.assertTrue(result)
        call_args = mock_client.delete_secret.call_args
        self.assertTrue(call_args[1]['ForceDeleteWithoutRecovery'])

    @patch('utils.aws_secrets.boto3.client')
    def test_rotate_secret_success(self, mock_boto_client):
        """Test secret rotation setup"""
        mock_client = Mock()
        mock_client.rotate_secret.return_value = {}
        mock_boto_client.return_value = mock_client

        manager = aws_secrets.SecretsManager()
        result = manager.rotate_secret(self.secret_name, "arn:aws:lambda:...")

        self.assertTrue(result)

    @patch('utils.aws_secrets.boto3.client')
    def test_get_secrets_manager_singleton(self, mock_boto_client):
        """Test singleton pattern for secrets manager"""
        # Reset singleton
        aws_secrets._secrets_manager = None

        manager1 = aws_secrets.get_secrets_manager()
        manager2 = aws_secrets.get_secrets_manager()

        self.assertIs(manager1, manager2)

    @patch('utils.aws_secrets.get_secrets_manager')
    def test_get_encryption_key_from_env(self, mock_get_manager):
        """Test encryption key retrieval from environment"""
        os.environ['ENCRYPTION_KEY'] = 'test_key_from_env'

        key = aws_secrets.get_encryption_key()

        self.assertEqual(key, 'test_key_from_env')
        mock_get_manager.assert_not_called()

        # Cleanup
        del os.environ['ENCRYPTION_KEY']

    @patch('utils.aws_secrets.get_secrets_manager')
    def test_get_encryption_key_from_secrets_manager(self, mock_get_manager):
        """Test encryption key retrieval from Secrets Manager"""
        if 'ENCRYPTION_KEY' in os.environ:
            del os.environ['ENCRYPTION_KEY']

        mock_manager = Mock()
        mock_manager.get_secret.return_value = {'encryption_key': 'key_from_aws'}
        mock_get_manager.return_value = mock_manager

        key = aws_secrets.get_encryption_key()

        self.assertEqual(key, 'key_from_aws')

    @patch('utils.aws_secrets.get_secrets_manager')
    def test_create_encryption_key_secret_success(self, mock_get_manager):
        """Test creating encryption key secret"""
        mock_manager = Mock()
        mock_manager.create_secret.return_value = True
        mock_get_manager.return_value = mock_manager

        result = aws_secrets.create_encryption_key_secret("test_encryption_key")

        self.assertTrue(result)


# ============================================================================
# TEST VALIDATORS EXTENDED (37% -> 85%+)
# ============================================================================

class TestValidatorsExtended(unittest.TestCase):
    """Extended tests for validators module"""

    def test_validate_email_detailed_valid(self):
        """Test detailed email validation with valid emails"""
        is_valid, error = validators.validate_email_detailed("user@example.com")
        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_validate_email_detailed_too_long(self):
        """Test email validation with too long email"""
        long_email = "a" * 256 + "@example.com"
        is_valid, error = validators.validate_email_detailed(long_email)
        self.assertFalse(is_valid)
        self.assertIn("255 characters", error)

    def test_validate_email_detailed_empty(self):
        """Test email validation with empty email"""
        is_valid, error = validators.validate_email_detailed("")
        self.assertFalse(is_valid)

    def test_validate_password_valid(self):
        """Test password validation with valid password"""
        is_valid, error = validators.validate_password("Secure@Pass123")
        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_validate_password_too_short(self):
        """Test password validation with short password"""
        is_valid, error = validators.validate_password("Short1!")
        self.assertFalse(is_valid)
        self.assertIn("8 characters", error)

    def test_validate_password_missing_lowercase(self):
        """Test password validation missing lowercase"""
        is_valid, error = validators.validate_password("NOLOWER123!")
        self.assertFalse(is_valid)
        self.assertIn("lowercase", error)

    def test_validate_password_missing_uppercase(self):
        """Test password validation missing uppercase"""
        is_valid, error = validators.validate_password("noupper123!")
        self.assertFalse(is_valid)
        self.assertIn("uppercase", error)

    def test_validate_password_missing_number(self):
        """Test password validation missing number"""
        is_valid, error = validators.validate_password("NoNumber!@#")
        self.assertFalse(is_valid)
        self.assertIn("number", error)

    def test_validate_password_missing_special(self):
        """Test password validation missing special character"""
        is_valid, error = validators.validate_password("NoSpecial123")
        self.assertFalse(is_valid)
        self.assertIn("special character", error)

    def test_validate_ahv_valid(self):
        """Test AHV validation with valid number"""
        # Valid AHV with correct checksum
        is_valid, error = validators.validate_ahv("756.1234.5678.97")
        self.assertTrue(is_valid)

    def test_validate_ahv_invalid_format(self):
        """Test AHV validation with invalid format"""
        is_valid, error = validators.validate_ahv("123.4567.8901.23")
        self.assertFalse(is_valid)
        self.assertIn("format", error)

    def test_validate_ahv_invalid_checksum(self):
        """Test AHV validation with invalid checksum"""
        is_valid, error = validators.validate_ahv("756.1234.5678.90")
        self.assertFalse(is_valid)
        self.assertIn("checksum", error)

    def test_validate_swiss_phone_valid_formats(self):
        """Test Swiss phone validation with valid formats"""
        valid_phones = ["+41791234567", "0041791234567", "0791234567"]
        for phone in valid_phones:
            is_valid, error = validators.validate_swiss_phone(phone)
            self.assertTrue(is_valid, f"Failed for {phone}")

    def test_validate_swiss_phone_invalid(self):
        """Test Swiss phone validation with invalid number"""
        is_valid, error = validators.validate_swiss_phone("1234567890")
        self.assertFalse(is_valid)

    def test_validate_swiss_postal_code_valid(self):
        """Test Swiss postal code validation"""
        is_valid, error = validators.validate_swiss_postal_code("8000")
        self.assertTrue(is_valid)

    def test_validate_swiss_postal_code_invalid(self):
        """Test Swiss postal code with invalid format"""
        is_valid, error = validators.validate_swiss_postal_code("123")
        self.assertFalse(is_valid)

    def test_validate_swiss_iban_valid(self):
        """Test Swiss IBAN validation"""
        is_valid, error = validators.validate_swiss_iban("CH93 0076 2011 6238 5295 7")
        self.assertTrue(is_valid)

    def test_validate_swiss_iban_invalid(self):
        """Test Swiss IBAN with invalid format"""
        is_valid, error = validators.validate_swiss_iban("DE89370400440532013000")
        self.assertFalse(is_valid)

    def test_validate_name_valid(self):
        """Test name validation with valid names"""
        valid_names = ["John", "Marie-Claire", "O'Brien", "José García"]
        for name in valid_names:
            is_valid, error = validators.validate_name(name)
            self.assertTrue(is_valid, f"Failed for {name}")

    def test_validate_name_too_short(self):
        """Test name validation with too short name"""
        is_valid, error = validators.validate_name("A")
        self.assertFalse(is_valid)

    def test_validate_name_too_long(self):
        """Test name validation with too long name"""
        is_valid, error = validators.validate_name("A" * 51)
        self.assertFalse(is_valid)

    def test_validate_tax_amount_valid(self):
        """Test tax amount validation with valid amount"""
        is_valid, error = validators.validate_tax_amount(1000.50)
        self.assertTrue(is_valid)

    def test_validate_tax_amount_negative(self):
        """Test tax amount validation with negative amount"""
        is_valid, error = validators.validate_tax_amount(-100)
        self.assertFalse(is_valid)

    def test_validate_tax_amount_too_large(self):
        """Test tax amount validation with too large amount"""
        is_valid, error = validators.validate_tax_amount(20000000)
        self.assertFalse(is_valid)

    def test_validate_or_raise_success(self):
        """Test validate_or_raise with valid data"""
        # Should not raise
        validators.validate_or_raise(True, None)

    def test_validate_or_raise_failure(self):
        """Test validate_or_raise with invalid data"""
        with self.assertRaises(HTTPException) as context:
            validators.validate_or_raise(False, "Validation failed")
        self.assertEqual(context.exception.status_code, 400)

    def test_validate_email_or_raise_success(self):
        """Test validate_email_or_raise with valid email"""
        validators.validate_email_or_raise("test@example.com")

    def test_validate_email_or_raise_failure(self):
        """Test validate_email_or_raise with invalid email"""
        with self.assertRaises(HTTPException):
            validators.validate_email_or_raise("invalid")

    def test_validate_password_or_raise(self):
        """Test validate_password_or_raise"""
        with self.assertRaises(HTTPException):
            validators.validate_password_or_raise("weak")

    def test_validate_ahv_or_raise(self):
        """Test validate_ahv_or_raise"""
        with self.assertRaises(HTTPException):
            validators.validate_ahv_or_raise("invalid")

    def test_validate_canton_or_raise(self):
        """Test validate_canton_or_raise"""
        with self.assertRaises(HTTPException):
            validators.validate_canton_or_raise("XX")

    def test_validate_tax_year_or_raise(self):
        """Test validate_tax_year_or_raise"""
        with self.assertRaises(HTTPException):
            validators.validate_tax_year_or_raise(1999)

    def test_validate_file_extension_valid(self):
        """Test file extension validation with valid files"""
        self.assertTrue(validators.validate_file_extension("doc.pdf", ["pdf", "doc"]))

    def test_validate_file_extension_invalid(self):
        """Test file extension validation with invalid file"""
        self.assertFalse(validators.validate_file_extension("doc.exe", ["pdf", "doc"]))

    def test_validate_file_extension_no_extension(self):
        """Test file extension validation with no extension"""
        self.assertFalse(validators.validate_file_extension("noextension", ["pdf"]))


# ============================================================================
# TEST ENCRYPTED TYPES (55% -> 85%+)
# ============================================================================

class TestEncryptedTypes(unittest.TestCase):
    """Test SQLAlchemy encrypted type decorators"""

    @patch('utils.encrypted_types.get_encryption_service')
    def test_encrypted_string_encrypt(self, mock_get_service):
        """Test EncryptedString encryption on bind"""
        mock_service = Mock()
        mock_service.encrypt.return_value = "encrypted_value"
        mock_get_service.return_value = mock_service

        encrypted_type = EncryptedString()
        result = encrypted_type.process_bind_param("plain_text", None)

        self.assertEqual(result, "encrypted_value")
        mock_service.encrypt.assert_called_once_with("plain_text")

    @patch('utils.encrypted_types.get_encryption_service')
    def test_encrypted_string_decrypt(self, mock_get_service):
        """Test EncryptedString decryption on result"""
        mock_service = Mock()
        mock_service.decrypt.return_value = "decrypted_value"
        mock_get_service.return_value = mock_service

        encrypted_type = EncryptedString()
        result = encrypted_type.process_result_value("encrypted_value", None)

        self.assertEqual(result, "decrypted_value")

    @patch('utils.encrypted_types.get_encryption_service')
    def test_encrypted_string_null_handling(self, mock_get_service):
        """Test EncryptedString handles None values"""
        encrypted_type = EncryptedString()

        self.assertIsNone(encrypted_type.process_bind_param(None, None))
        self.assertIsNone(encrypted_type.process_result_value(None, None))

    @patch('utils.encrypted_types.get_encryption_service')
    def test_encrypted_string_decryption_error(self, mock_get_service):
        """Test EncryptedString raises on decryption error"""
        mock_service = Mock()
        mock_service.decrypt.side_effect = Exception("Decryption failed")
        mock_get_service.return_value = mock_service

        encrypted_type = EncryptedString()

        with self.assertRaises(ValueError) as context:
            encrypted_type.process_result_value("bad_data", None)

        self.assertIn("Failed to decrypt", str(context.exception))

    def test_encrypted_string_with_length(self):
        """Test EncryptedString with length parameter"""
        encrypted_type = EncryptedString(length=255)
        self.assertEqual(encrypted_type.length, 255)

    @patch('utils.encrypted_types.get_encryption_service')
    def test_encrypted_text_operations(self, mock_get_service):
        """Test EncryptedText encrypt/decrypt"""
        mock_service = Mock()
        mock_service.encrypt.return_value = "encrypted_text"
        mock_service.decrypt.return_value = "decrypted_text"
        mock_get_service.return_value = mock_service

        encrypted_type = EncryptedText()

        encrypted = encrypted_type.process_bind_param("plain_text", None)
        self.assertEqual(encrypted, "encrypted_text")

        decrypted = encrypted_type.process_result_value("encrypted_text", None)
        self.assertEqual(decrypted, "decrypted_text")

    @patch('utils.encrypted_types.get_encryption_service')
    def test_encrypted_json_operations(self, mock_get_service):
        """Test EncryptedJSON encrypt/decrypt"""
        mock_service = Mock()
        mock_service.encrypt.return_value = "encrypted_json"
        mock_service.decrypt.return_value = '{"key": "value", "number": 42}'
        mock_get_service.return_value = mock_service

        encrypted_type = EncryptedJSON()

        # Encrypt
        encrypted = encrypted_type.process_bind_param({"key": "value", "number": 42}, None)
        self.assertEqual(encrypted, "encrypted_json")

        # Decrypt
        decrypted = encrypted_type.process_result_value("encrypted_json", None)
        self.assertEqual(decrypted['key'], 'value')
        self.assertEqual(decrypted['number'], 42)

    @patch('utils.encrypted_types.get_encryption_service')
    def test_encrypted_json_with_datetime(self, mock_get_service):
        """Test EncryptedJSON handles datetime objects"""
        mock_service = Mock()
        mock_service.encrypt.return_value = "encrypted"
        mock_get_service.return_value = mock_service

        encrypted_type = EncryptedJSON()
        data = {"date": datetime.now(), "text": "value"}

        # Should not raise error
        result = encrypted_type.process_bind_param(data, None)
        self.assertIsNotNone(result)

    @patch('utils.encrypted_types.get_encryption_service')
    def test_encrypted_json_parse_error(self, mock_get_service):
        """Test EncryptedJSON handles JSON parse errors"""
        mock_service = Mock()
        mock_service.decrypt.return_value = "not_json_data"
        mock_get_service.return_value = mock_service

        encrypted_type = EncryptedJSON()
        result = encrypted_type.process_result_value("encrypted", None)

        # Should return empty dict instead of raising
        self.assertEqual(result, {})

    def test_hashed_string_operations(self):
        """Test HashedString hashing"""
        with patch('utils.encryption.EncryptionService.hash_sensitive_data') as mock_hash:
            mock_hash.return_value = "hashed_value"

            hashed_type = HashedString()
            result = hashed_type.process_bind_param("plain_text", None)

            self.assertEqual(result, "hashed_value")

    def test_hashed_string_result(self):
        """Test HashedString returns hash as-is"""
        hashed_type = HashedString()
        result = hashed_type.process_result_value("hashed_value", None)

        self.assertEqual(result, "hashed_value")

    def test_hashed_string_verify(self):
        """Test HashedString verify method"""
        with patch('utils.encryption.EncryptionService.verify_hashed_data') as mock_verify:
            mock_verify.return_value = True

            result = HashedString.verify("plain", "hashed")

            self.assertTrue(result)


# ============================================================================
# TEST ENCRYPTION MONITOR (45% -> 85%+)
# ============================================================================

class TestEncryptionMonitor(unittest.TestCase):
    """Test encryption monitoring functionality"""

    def test_encryption_metrics_creation(self):
        """Test EncryptionMetrics creation"""
        metric = EncryptionMetrics(
            operation="encrypt",
            duration_ms=10.5,
            data_size_bytes=1024,
            success=True
        )

        self.assertEqual(metric.operation, "encrypt")
        self.assertEqual(metric.duration_ms, 10.5)
        self.assertTrue(metric.success)
        self.assertIsNotNone(metric.timestamp)

    def test_monitor_record_operation(self):
        """Test recording encryption operations"""
        monitor = EncryptionMonitor()

        monitor.record_operation("encrypt", 50.0, 2048, True)

        self.assertEqual(len(monitor.metrics), 1)
        self.assertEqual(monitor.metrics[0].operation, "encrypt")

    def test_monitor_max_metrics_limit(self):
        """Test metrics are trimmed at max limit"""
        monitor = EncryptionMonitor()
        monitor.max_metrics = 10

        # Add 15 metrics
        for i in range(15):
            monitor.record_operation("encrypt", 10.0, 1024, True)

        # Should only keep last 10
        self.assertEqual(len(monitor.metrics), 10)

    def test_monitor_get_metrics_summary_empty(self):
        """Test metrics summary with no data"""
        monitor = EncryptionMonitor()
        summary = monitor.get_metrics_summary(hours=24)

        self.assertEqual(summary['total_operations'], 0)
        self.assertEqual(summary['encrypt_count'], 0)

    def test_monitor_get_metrics_summary_with_data(self):
        """Test metrics summary with data"""
        monitor = EncryptionMonitor()

        monitor.record_operation("encrypt", 100.0, 1024, True)
        monitor.record_operation("decrypt", 50.0, 1024, True)
        monitor.record_operation("encrypt", 200.0, 2048, False)

        summary = monitor.get_metrics_summary(hours=24)

        self.assertEqual(summary['total_operations'], 3)
        self.assertEqual(summary['encrypt_count'], 2)
        self.assertEqual(summary['decrypt_count'], 1)
        self.assertEqual(summary['success_count'], 2)
        self.assertEqual(summary['failure_count'], 1)

    def test_monitor_detect_anomalies_high_failure(self):
        """Test anomaly detection for high failure rate"""
        monitor = EncryptionMonitor()

        # Add mostly failures
        for i in range(20):
            monitor.record_operation("encrypt", 10.0, 1024, i % 5 == 0)

        anomalies = monitor.detect_anomalies()

        # Should detect high failure rate
        self.assertTrue(any(a['type'] == 'high_failure_rate' for a in anomalies))

    def test_monitor_export_metrics(self):
        """Test exporting metrics to file"""
        import tempfile

        monitor = EncryptionMonitor()
        monitor.record_operation("encrypt", 10.0, 1024, True)

        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            filepath = f.name

        try:
            monitor.export_metrics(filepath)

            with open(filepath, 'r') as f:
                data = json.load(f)

            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]['operation'], 'encrypt')
        finally:
            os.unlink(filepath)

    def test_monitor_clear_metrics(self):
        """Test clearing metrics"""
        monitor = EncryptionMonitor()
        monitor.record_operation("encrypt", 10.0, 1024, True)

        monitor.clear_metrics()

        self.assertEqual(len(monitor.metrics), 0)


class TestKeyRotationManager(unittest.TestCase):
    """Test key rotation management"""

    def test_check_key_age_no_date(self):
        """Test check_key_age when creation date not set"""
        if 'ENCRYPTION_KEY_CREATED_AT' in os.environ:
            del os.environ['ENCRYPTION_KEY_CREATED_AT']

        manager = KeyRotationManager()
        result = manager.check_key_age()

        self.assertFalse(result['age_known'])
        self.assertFalse(result['requires_rotation'])

    def test_check_key_age_recent_key(self):
        """Test check_key_age with recent key"""
        created_at = (datetime.utcnow() - timedelta(days=30)).isoformat()
        os.environ['ENCRYPTION_KEY_CREATED_AT'] = created_at

        manager = KeyRotationManager()
        result = manager.check_key_age()

        self.assertTrue(result['age_known'])
        self.assertFalse(result['requires_rotation'])
        self.assertEqual(result['age_days'], 30)

        del os.environ['ENCRYPTION_KEY_CREATED_AT']

    def test_check_key_age_old_key(self):
        """Test check_key_age with old key requiring rotation"""
        created_at = (datetime.utcnow() - timedelta(days=100)).isoformat()
        os.environ['ENCRYPTION_KEY_CREATED_AT'] = created_at
        os.environ['ENCRYPTION_KEY_ROTATION_DAYS'] = '90'

        manager = KeyRotationManager()
        result = manager.check_key_age()

        self.assertTrue(result['requires_rotation'])

        del os.environ['ENCRYPTION_KEY_CREATED_AT']
        del os.environ['ENCRYPTION_KEY_ROTATION_DAYS']

    def test_initiate_key_rotation(self):
        """Test initiating key rotation"""
        manager = KeyRotationManager()
        result = manager.initiate_key_rotation()

        self.assertEqual(result['status'], 'ready_to_rotate')
        self.assertTrue(result['new_key_generated'])
        self.assertIn('next_steps', result)
        self.assertTrue(len(result['next_steps']) > 0)


class TestEncryptionHealthCheck(unittest.TestCase):
    """Test encryption health check"""

    @patch('utils.encryption.get_encryption_service')
    def test_health_check_healthy(self, mock_get_service):
        """Test health check when everything is healthy"""
        mock_service = Mock()
        mock_service.encrypt.return_value = "encrypted"
        mock_service.decrypt.return_value = "health_check_test"
        mock_get_service.return_value = mock_service

        monitor = EncryptionMonitor()
        key_manager = KeyRotationManager()
        health_check = EncryptionHealthCheck(monitor, key_manager)

        result = health_check.perform_health_check()

        self.assertEqual(result['overall_status'], 'healthy')
        self.assertEqual(result['checks']['encryption_service']['status'], 'healthy')

    @patch('utils.encryption.get_encryption_service')
    def test_health_check_encryption_failure(self, mock_get_service):
        """Test health check when encryption fails"""
        mock_get_service.side_effect = Exception("Service unavailable")

        monitor = EncryptionMonitor()
        key_manager = KeyRotationManager()
        health_check = EncryptionHealthCheck(monitor, key_manager)

        result = health_check.perform_health_check()

        self.assertEqual(result['overall_status'], 'unhealthy')
        self.assertEqual(result['checks']['encryption_service']['status'], 'unhealthy')


# ============================================================================
# TEST S3 ENCRYPTION (28% -> 85%+)
# ============================================================================

class TestS3EncryptedStorage(unittest.TestCase):
    """Test S3 encrypted storage functionality"""

    @patch('utils.s3_encryption.boto3.client')
    def test_init_default_config(self, mock_boto_client):
        """Test initialization with default configuration"""
        # SSE-KMS falls back to SSE-S3 if no KMS key is provided
        storage = S3EncryptedStorage()

        # Will be SSE-S3 because no KMS key is configured
        self.assertIn(storage.encryption_type, ['SSE-KMS', 'SSE-S3'])
        mock_boto_client.assert_called_once()

    @patch('utils.s3_encryption.boto3.client')
    def test_init_sse_s3(self, mock_boto_client):
        """Test initialization with SSE-S3 encryption"""
        storage = S3EncryptedStorage(encryption_type='SSE-S3')

        self.assertEqual(storage.encryption_type, 'SSE-S3')

    @patch('utils.s3_encryption.boto3.client')
    def test_init_invalid_encryption_type(self, mock_boto_client):
        """Test initialization with invalid encryption type"""
        with self.assertRaises(ValueError):
            S3EncryptedStorage(encryption_type='INVALID')

    @patch('utils.s3_encryption.boto3.client')
    def test_init_sse_kms_without_key(self, mock_boto_client):
        """Test SSE-KMS falls back to SSE-S3 when no key provided"""
        storage = S3EncryptedStorage(encryption_type='SSE-KMS', kms_key_id=None)

        # Should fall back to SSE-S3
        self.assertEqual(storage.encryption_type, 'SSE-S3')

    @patch('utils.s3_encryption.boto3.client')
    def test_upload_document_sse_kms(self, mock_boto_client):
        """Test document upload with SSE-KMS encryption"""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage(
            encryption_type='SSE-KMS',
            kms_key_id='arn:aws:kms:us-east-1:123456789:key/abc'
        )

        with patch('builtins.open', create=True):
            result = storage.upload_document('/tmp/test.pdf', 'test.pdf')

        self.assertTrue(result)
        call_args = mock_client.upload_file.call_args[1]['ExtraArgs']
        self.assertEqual(call_args['ServerSideEncryption'], 'aws:kms')

    @patch('utils.s3_encryption.boto3.client')
    def test_upload_document_sse_s3(self, mock_boto_client):
        """Test document upload with SSE-S3 encryption"""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage(encryption_type='SSE-S3')

        with patch('builtins.open', create=True):
            result = storage.upload_document('/tmp/test.pdf', 'test.pdf')

        call_args = mock_client.upload_file.call_args[1]['ExtraArgs']
        self.assertEqual(call_args['ServerSideEncryption'], 'AES256')

    @patch('utils.s3_encryption.boto3.client')
    def test_upload_document_error(self, mock_boto_client):
        """Test document upload error handling"""
        mock_client = Mock()
        error_response = {'Error': {'Code': 'AccessDenied'}}
        mock_client.upload_file.side_effect = ClientError(error_response, 'UploadFile')
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        result = storage.upload_document('/tmp/test.pdf', 'test.pdf')

        self.assertFalse(result)

    @patch('utils.s3_encryption.boto3.client')
    def test_upload_fileobj_success(self, mock_boto_client):
        """Test file object upload"""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        file_obj = BytesIO(b"test data")

        result = storage.upload_fileobj(file_obj, 'test.pdf')

        self.assertTrue(result)

    @patch('utils.s3_encryption.boto3.client')
    def test_download_document_success(self, mock_boto_client):
        """Test document download"""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        result = storage.download_document('test.pdf', '/tmp/downloaded.pdf')

        self.assertTrue(result)

    @patch('utils.s3_encryption.boto3.client')
    def test_get_document_url(self, mock_boto_client):
        """Test presigned URL generation"""
        mock_client = Mock()
        mock_client.generate_presigned_url.return_value = "https://presigned-url.com"
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        url = storage.get_document_url('test.pdf', expiration=7200)

        self.assertEqual(url, "https://presigned-url.com")

    @patch('utils.s3_encryption.boto3.client')
    def test_delete_document(self, mock_boto_client):
        """Test document deletion"""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        result = storage.delete_document('test.pdf')

        self.assertTrue(result)

    @patch('utils.s3_encryption.boto3.client')
    def test_get_document_metadata(self, mock_boto_client):
        """Test retrieving document metadata"""
        mock_client = Mock()
        mock_client.head_object.return_value = {
            'ContentLength': 1024,
            'ContentType': 'application/pdf',
            'ServerSideEncryption': 'aws:kms',
            'SSEKMSKeyId': 'arn:aws:kms:...',
            'Metadata': {'user_id': '123'}
        }
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        metadata = storage.get_document_metadata('test.pdf')

        self.assertEqual(metadata['size'], 1024)
        self.assertEqual(metadata['encryption'], 'aws:kms')

    @patch('utils.s3_encryption.boto3.client')
    def test_list_documents(self, mock_boto_client):
        """Test listing documents"""
        mock_client = Mock()
        mock_client.list_objects_v2.return_value = {
            'Contents': [
                {'Key': 'doc1.pdf'},
                {'Key': 'doc2.pdf'}
            ]
        }
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        docs = storage.list_documents(prefix='user_123/')

        self.assertEqual(len(docs), 2)
        self.assertIn('doc1.pdf', docs)

    @patch('utils.s3_encryption.boto3.client')
    def test_list_documents_empty(self, mock_boto_client):
        """Test listing documents with no results"""
        mock_client = Mock()
        mock_client.list_objects_v2.return_value = {}
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        docs = storage.list_documents()

        self.assertEqual(len(docs), 0)

    @patch('utils.s3_encryption.boto3.client')
    def test_ensure_bucket_encryption_already_enabled(self, mock_boto_client):
        """Test bucket encryption check when already enabled"""
        mock_client = Mock()
        mock_client.get_bucket_encryption.return_value = {'Rules': []}
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        result = storage.ensure_bucket_encryption()

        self.assertTrue(result)

    @patch('utils.s3_encryption.boto3.client')
    def test_ensure_bucket_encryption_enable(self, mock_boto_client):
        """Test enabling bucket encryption"""
        mock_client = Mock()
        error_response = {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFoundError'}}
        mock_client.get_bucket_encryption.side_effect = ClientError(error_response, 'GetBucketEncryption')
        mock_boto_client.return_value = mock_client

        storage = S3EncryptedStorage()
        result = storage.ensure_bucket_encryption()

        self.assertTrue(result)
        mock_client.put_bucket_encryption.assert_called_once()


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == '__main__':
    unittest.main(verbosity=2)
