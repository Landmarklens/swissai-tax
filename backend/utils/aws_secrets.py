"""
AWS Secrets Manager integration for encryption key management
"""
import json
import logging
import os
from datetime import datetime
from typing import Optional

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class SecretsManager:
    """Manage secrets from AWS Secrets Manager"""

    def __init__(self, region_name: str = None):
        """
        Initialize Secrets Manager client

        Args:
            region_name: AWS region (defaults to AWS_REGION env var or us-east-1)
        """
        self.region_name = region_name or os.environ.get('AWS_REGION', 'us-east-1')
        self.client = boto3.client('secretsmanager', region_name=self.region_name)

    def get_secret(self, secret_name: str) -> Optional[dict]:
        """
        Get secret from AWS Secrets Manager

        Args:
            secret_name: Name of the secret

        Returns:
            Dictionary containing secret data or None if not found
        """
        try:
            response = self.client.get_secret_value(SecretId=secret_name)

            # Secrets can be stored as string or binary
            if 'SecretString' in response:
                secret = response['SecretString']
                # Try to parse as JSON
                try:
                    return json.loads(secret)
                except json.JSONDecodeError:
                    return {'value': secret}
            else:
                # Binary secret
                return {'value': response['SecretBinary']}

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.error(f"Secret {secret_name} not found")
            elif error_code == 'InvalidRequestException':
                logger.error(f"Invalid request for secret {secret_name}")
            elif error_code == 'InvalidParameterException':
                logger.error(f"Invalid parameter for secret {secret_name}")
            else:
                logger.error(f"Error retrieving secret {secret_name}: {e}")
            return None

    def create_secret(self, secret_name: str, secret_value: dict, description: str = None) -> bool:
        """
        Create a new secret in AWS Secrets Manager

        Args:
            secret_name: Name for the secret
            secret_value: Dictionary containing secret data
            description: Optional description

        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.create_secret(
                Name=secret_name,
                SecretString=json.dumps(secret_value),
                Description=description or f"Secret for {secret_name}"
            )
            logger.info(f"Successfully created secret {secret_name}")
            return True

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceExistsException':
                logger.warning(f"Secret {secret_name} already exists")
            else:
                logger.error(f"Error creating secret {secret_name}: {e}")
            return False

    def update_secret(self, secret_name: str, secret_value: dict) -> bool:
        """
        Update an existing secret

        Args:
            secret_name: Name of the secret
            secret_value: New secret data

        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.update_secret(
                SecretId=secret_name,
                SecretString=json.dumps(secret_value)
            )
            logger.info(f"Successfully updated secret {secret_name}")
            return True

        except ClientError as e:
            logger.error(f"Error updating secret {secret_name}: {e}")
            return False

    def delete_secret(self, secret_name: str, force_delete: bool = False) -> bool:
        """
        Delete a secret

        Args:
            secret_name: Name of the secret
            force_delete: If True, deletes immediately. Otherwise schedules deletion

        Returns:
            True if successful, False otherwise
        """
        try:
            if force_delete:
                self.client.delete_secret(
                    SecretId=secret_name,
                    ForceDeleteWithoutRecovery=True
                )
            else:
                # Schedule deletion for 30 days (AWS default recovery window)
                self.client.delete_secret(
                    SecretId=secret_name,
                    RecoveryWindowInDays=30
                )
            logger.info(f"Successfully deleted secret {secret_name}")
            return True

        except ClientError as e:
            logger.error(f"Error deleting secret {secret_name}: {e}")
            return False

    def rotate_secret(self, secret_name: str, rotation_lambda_arn: str) -> bool:
        """
        Enable automatic rotation for a secret

        Args:
            secret_name: Name of the secret
            rotation_lambda_arn: ARN of the Lambda function that handles rotation

        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.rotate_secret(
                SecretId=secret_name,
                RotationLambdaARN=rotation_lambda_arn,
                RotationRules={
                    'AutomaticallyAfterDays': 90
                }
            )
            logger.info(f"Successfully enabled rotation for secret {secret_name}")
            return True

        except ClientError as e:
            logger.error(f"Error enabling rotation for secret {secret_name}: {e}")
            return False


# Singleton instance
_secrets_manager = None


def get_secrets_manager() -> SecretsManager:
    """Get or create Secrets Manager instance"""
    global _secrets_manager
    if _secrets_manager is None:
        _secrets_manager = SecretsManager()
    return _secrets_manager


def get_encryption_key() -> Optional[str]:
    """
    Get encryption key from AWS Secrets Manager

    Returns:
        Encryption key string or None if not found
    """
    secret_name = os.environ.get('ENCRYPTION_SECRET_NAME', 'swissai-tax/encryption-key')

    # Try environment variable first (for local development)
    env_key = os.environ.get('ENCRYPTION_KEY')
    if env_key:
        logger.info("Using encryption key from environment variable")
        return env_key

    # Try AWS Secrets Manager
    try:
        manager = get_secrets_manager()
        secret = manager.get_secret(secret_name)

        if secret and 'encryption_key' in secret:
            logger.info("Using encryption key from AWS Secrets Manager")
            return secret['encryption_key']
        elif secret and 'value' in secret:
            logger.info("Using encryption key from AWS Secrets Manager")
            return secret['value']
        else:
            logger.warning(f"Encryption key not found in secret {secret_name}")
            return None

    except Exception as e:
        logger.error(f"Error retrieving encryption key from AWS: {e}")
        return None


def create_encryption_key_secret(encryption_key: str) -> bool:
    """
    Store encryption key in AWS Secrets Manager

    Args:
        encryption_key: The encryption key to store

    Returns:
        True if successful, False otherwise
    """
    secret_name = os.environ.get('ENCRYPTION_SECRET_NAME', 'swissai-tax/encryption-key')

    try:
        manager = get_secrets_manager()
        secret_data = {
            'encryption_key': encryption_key,
            'created_at': str(datetime.utcnow()),
            'environment': os.environ.get('ENVIRONMENT', 'development')
        }

        return manager.create_secret(
            secret_name,
            secret_data,
            description="Encryption key for SwissAI Tax sensitive data"
        )

    except Exception as e:
        logger.error(f"Error creating encryption key secret: {e}")
        return False
