"""
S3 document storage with encryption (SSE-S3 and SSE-KMS)
Handles secure document upload/download with server-side encryption
"""
import logging
import os
from typing import Any, BinaryIO, Dict, Optional

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class S3EncryptedStorage:
    """
    S3 storage manager with encryption support
    Supports both SSE-S3 (S3-managed keys) and SSE-KMS (customer-managed keys)
    """

    def __init__(
        self,
        bucket_name: str = None,
        region_name: str = None,
        encryption_type: str = "SSE-KMS",
        kms_key_id: str = None
    ):
        """
        Initialize S3 encrypted storage

        Args:
            bucket_name: S3 bucket name (defaults to TAX_DOCUMENTS_BUCKET env var)
            region_name: AWS region (defaults to AWS_REGION env var)
            encryption_type: "SSE-S3" or "SSE-KMS" (default: SSE-KMS)
            kms_key_id: KMS key ID/ARN for SSE-KMS (defaults to TAX_KMS_KEY_ID env var)
        """
        self.bucket_name = bucket_name or os.environ.get('TAX_DOCUMENTS_BUCKET', 'swissai-tax-documents')
        self.region_name = region_name or os.environ.get('AWS_REGION', 'us-east-1')
        self.encryption_type = encryption_type
        self.kms_key_id = kms_key_id or os.environ.get('TAX_KMS_KEY_ID')

        # Validate encryption type
        if encryption_type not in ['SSE-S3', 'SSE-KMS']:
            raise ValueError(f"Invalid encryption type: {encryption_type}. Must be SSE-S3 or SSE-KMS")

        # KMS key required for SSE-KMS
        if encryption_type == 'SSE-KMS' and not self.kms_key_id:
            logger.warning("SSE-KMS encryption selected but no KMS key ID provided. Falling back to SSE-S3")
            self.encryption_type = 'SSE-S3'

        self.s3_client = boto3.client('s3', region_name=self.region_name)

    def upload_document(
        self,
        file_path: str,
        object_key: str,
        metadata: Optional[Dict[str, str]] = None,
        content_type: str = 'application/pdf'
    ) -> bool:
        """
        Upload a document to S3 with encryption

        Args:
            file_path: Local file path to upload
            object_key: S3 object key (path in bucket)
            metadata: Optional metadata dictionary
            content_type: MIME type of the file

        Returns:
            True if successful, False otherwise
        """
        try:
            extra_args = {
                'ContentType': content_type,
                'Metadata': metadata or {}
            }

            # Add encryption parameters
            if self.encryption_type == 'SSE-KMS':
                extra_args['ServerSideEncryption'] = 'aws:kms'
                extra_args['SSEKMSKeyId'] = self.kms_key_id
            else:
                extra_args['ServerSideEncryption'] = 'AES256'

            self.s3_client.upload_file(
                file_path,
                self.bucket_name,
                object_key,
                ExtraArgs=extra_args
            )

            logger.info(f"Uploaded document to s3://{self.bucket_name}/{object_key} with {self.encryption_type}")
            return True

        except ClientError as e:
            logger.error(f"Failed to upload document: {e}")
            return False

    def upload_fileobj(
        self,
        file_obj: BinaryIO,
        object_key: str,
        metadata: Optional[Dict[str, str]] = None,
        content_type: str = 'application/pdf'
    ) -> bool:
        """
        Upload a file object to S3 with encryption

        Args:
            file_obj: File-like object to upload
            object_key: S3 object key (path in bucket)
            metadata: Optional metadata dictionary
            content_type: MIME type of the file

        Returns:
            True if successful, False otherwise
        """
        try:
            extra_args = {
                'ContentType': content_type,
                'Metadata': metadata or {}
            }

            # Add encryption parameters
            if self.encryption_type == 'SSE-KMS':
                extra_args['ServerSideEncryption'] = 'aws:kms'
                extra_args['SSEKMSKeyId'] = self.kms_key_id
            else:
                extra_args['ServerSideEncryption'] = 'AES256'

            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                object_key,
                ExtraArgs=extra_args
            )

            logger.info(f"Uploaded file object to s3://{self.bucket_name}/{object_key} with {self.encryption_type}")
            return True

        except ClientError as e:
            logger.error(f"Failed to upload file object: {e}")
            return False

    def download_document(self, object_key: str, local_path: str) -> bool:
        """
        Download an encrypted document from S3

        Args:
            object_key: S3 object key
            local_path: Local path to save file

        Returns:
            True if successful, False otherwise
        """
        try:
            self.s3_client.download_file(
                self.bucket_name,
                object_key,
                local_path
            )

            logger.info(f"Downloaded document from s3://{self.bucket_name}/{object_key}")
            return True

        except ClientError as e:
            logger.error(f"Failed to download document: {e}")
            return False

    def get_document_url(self, object_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for temporary access to encrypted document

        Args:
            object_key: S3 object key
            expiration: URL expiration time in seconds (default: 1 hour)

        Returns:
            Presigned URL string or None on error
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': object_key
                },
                ExpiresIn=expiration
            )

            logger.info(f"Generated presigned URL for {object_key}, expires in {expiration}s")
            return url

        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None

    def delete_document(self, object_key: str) -> bool:
        """
        Delete a document from S3

        Args:
            object_key: S3 object key

        Returns:
            True if successful, False otherwise
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=object_key
            )

            logger.info(f"Deleted document s3://{self.bucket_name}/{object_key}")
            return True

        except ClientError as e:
            logger.error(f"Failed to delete document: {e}")
            return False

    def get_document_metadata(self, object_key: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a document

        Args:
            object_key: S3 object key

        Returns:
            Dictionary with metadata or None on error
        """
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=object_key
            )

            metadata = {
                'size': response.get('ContentLength'),
                'content_type': response.get('ContentType'),
                'last_modified': response.get('LastModified'),
                'encryption': response.get('ServerSideEncryption'),
                'kms_key_id': response.get('SSEKMSKeyId'),
                'metadata': response.get('Metadata', {})
            }

            return metadata

        except ClientError as e:
            logger.error(f"Failed to get document metadata: {e}")
            return None

    def list_documents(self, prefix: str = '') -> list:
        """
        List documents in bucket with optional prefix filter

        Args:
            prefix: Prefix to filter objects (e.g., "user_123/")

        Returns:
            List of object keys
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )

            if 'Contents' not in response:
                return []

            return [obj['Key'] for obj in response['Contents']]

        except ClientError as e:
            logger.error(f"Failed to list documents: {e}")
            return []

    def ensure_bucket_encryption(self) -> bool:
        """
        Ensure bucket has default encryption enabled

        Returns:
            True if encryption is enabled, False otherwise
        """
        try:
            # Get current encryption configuration
            try:
                response = self.s3_client.get_bucket_encryption(Bucket=self.bucket_name)
                logger.info(f"Bucket {self.bucket_name} already has encryption enabled")
                return True
            except ClientError as e:
                if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                    raise

            # Set encryption if not already configured
            encryption_config = {
                'Rules': [
                    {
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'aws:kms' if self.encryption_type == 'SSE-KMS' else 'AES256'
                        },
                        'BucketKeyEnabled': True
                    }
                ]
            }

            if self.encryption_type == 'SSE-KMS' and self.kms_key_id:
                encryption_config['Rules'][0]['ApplyServerSideEncryptionByDefault']['KMSMasterKeyID'] = self.kms_key_id

            self.s3_client.put_bucket_encryption(
                Bucket=self.bucket_name,
                ServerSideEncryptionConfiguration=encryption_config
            )

            logger.info(f"Enabled {self.encryption_type} encryption for bucket {self.bucket_name}")
            return True

        except ClientError as e:
            logger.error(f"Failed to configure bucket encryption: {e}")
            return False


# Singleton instance
_s3_storage = None


def get_s3_storage() -> S3EncryptedStorage:
    """Get or create S3 encrypted storage instance"""
    global _s3_storage
    if _s3_storage is None:
        _s3_storage = S3EncryptedStorage()
    return _s3_storage
