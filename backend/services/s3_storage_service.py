"""
S3 Storage Service for Data Exports and User Documents
Provides high-level interface for storing/retrieving data exports and managing user document deletion
"""
import logging
import json
import csv
import io
import os
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime

from utils.s3_encryption import S3EncryptedStorage, get_s3_storage

logger = logging.getLogger(__name__)


class S3StorageService:
    """
    Service for managing data exports and user documents in S3
    Handles export file uploads, presigned URL generation, and bulk document deletion
    """

    EXPORTS_PREFIX = "exports/"
    DOCUMENTS_PREFIX = "documents/user_{user_id}/"
    EXPORT_EXPIRY_HOURS = 48

    def __init__(self, s3_storage: Optional[S3EncryptedStorage] = None):
        """
        Initialize S3 storage service

        Args:
            s3_storage: S3EncryptedStorage instance (defaults to singleton)
        """
        self.s3 = s3_storage or get_s3_storage()

    def upload_export_data(
        self,
        user_id: UUID,
        export_id: UUID,
        data: Dict,
        format: str = 'json'
    ) -> Optional[str]:
        """
        Upload data export to S3

        Args:
            user_id: User ID
            export_id: Export ID
            data: Data dictionary to export
            format: Export format ('json' or 'csv')

        Returns:
            S3 object key if successful, None otherwise
        """
        try:
            # Generate S3 key
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            object_key = f"{self.EXPORTS_PREFIX}{user_id}/{export_id}_{timestamp}.{format}"

            # Convert data to appropriate format
            if format == 'json':
                file_content = json.dumps(data, indent=2, default=str)
                content_type = 'application/json'
            elif format == 'csv':
                file_content = self._convert_to_csv(data)
                content_type = 'text/csv'
            else:
                logger.error(f"Unsupported export format: {format}")
                return None

            # Upload to S3
            file_obj = io.BytesIO(file_content.encode('utf-8'))

            metadata = {
                'user_id': str(user_id),
                'export_id': str(export_id),
                'export_format': format,
                'created_at': datetime.utcnow().isoformat()
            }

            success = self.s3.upload_fileobj(
                file_obj=file_obj,
                object_key=object_key,
                metadata=metadata,
                content_type=content_type
            )

            if success:
                logger.info(f"Uploaded export {export_id} for user {user_id} to {object_key}")
                return object_key
            else:
                logger.error(f"Failed to upload export {export_id}")
                return None

        except Exception as e:
            logger.error(f"Error uploading export data: {e}")
            return None

    def generate_download_url(self, object_key: str, expiry_hours: int = None) -> Optional[str]:
        """
        Generate presigned URL for downloading export

        Args:
            object_key: S3 object key
            expiry_hours: URL expiration in hours (default: 48)

        Returns:
            Presigned URL or None on error
        """
        try:
            expiry_seconds = (expiry_hours or self.EXPORT_EXPIRY_HOURS) * 3600
            url = self.s3.get_document_url(object_key, expiration=expiry_seconds)

            if url:
                logger.info(f"Generated download URL for {object_key}, expires in {expiry_hours or self.EXPORT_EXPIRY_HOURS}h")

            return url

        except Exception as e:
            logger.error(f"Error generating download URL: {e}")
            return None

    def delete_export(self, object_key: str) -> bool:
        """
        Delete an export file from S3

        Args:
            object_key: S3 object key

        Returns:
            True if successful, False otherwise
        """
        try:
            success = self.s3.delete_document(object_key)

            if success:
                logger.info(f"Deleted export file: {object_key}")

            return success

        except Exception as e:
            logger.error(f"Error deleting export: {e}")
            return False

    def delete_user_documents(self, user_id: UUID) -> Dict[str, int]:
        """
        Delete all documents for a user (called during account deletion)

        Args:
            user_id: User ID

        Returns:
            Dictionary with deletion statistics {'deleted': int, 'failed': int}
        """
        try:
            # List all user documents
            prefix = self.DOCUMENTS_PREFIX.format(user_id=user_id)
            document_keys = self.s3.list_documents(prefix=prefix)

            if not document_keys:
                logger.info(f"No documents found for user {user_id}")
                return {'deleted': 0, 'failed': 0}

            logger.info(f"Found {len(document_keys)} documents for user {user_id}")

            # Delete each document
            deleted = 0
            failed = 0

            for key in document_keys:
                if self.s3.delete_document(key):
                    deleted += 1
                else:
                    failed += 1
                    logger.warning(f"Failed to delete document: {key}")

            logger.info(f"User {user_id} documents deletion: {deleted} deleted, {failed} failed")

            return {'deleted': deleted, 'failed': failed}

        except Exception as e:
            logger.error(f"Error deleting user documents: {e}")
            return {'deleted': 0, 'failed': 0}

    def delete_user_exports(self, user_id: UUID) -> Dict[str, int]:
        """
        Delete all export files for a user

        Args:
            user_id: User ID

        Returns:
            Dictionary with deletion statistics {'deleted': int, 'failed': int}
        """
        try:
            # List all user exports
            prefix = f"{self.EXPORTS_PREFIX}{user_id}/"
            export_keys = self.s3.list_documents(prefix=prefix)

            if not export_keys:
                logger.info(f"No exports found for user {user_id}")
                return {'deleted': 0, 'failed': 0}

            logger.info(f"Found {len(export_keys)} exports for user {user_id}")

            # Delete each export
            deleted = 0
            failed = 0

            for key in export_keys:
                if self.s3.delete_document(key):
                    deleted += 1
                else:
                    failed += 1
                    logger.warning(f"Failed to delete export: {key}")

            logger.info(f"User {user_id} exports deletion: {deleted} deleted, {failed} failed")

            return {'deleted': deleted, 'failed': failed}

        except Exception as e:
            logger.error(f"Error deleting user exports: {e}")
            return {'deleted': 0, 'failed': 0}

    def get_file_size(self, object_key: str) -> Optional[int]:
        """
        Get file size in bytes

        Args:
            object_key: S3 object key

        Returns:
            File size in bytes or None on error
        """
        try:
            metadata = self.s3.get_document_metadata(object_key)
            if metadata:
                return metadata.get('size')
            return None

        except Exception as e:
            logger.error(f"Error getting file size: {e}")
            return None

    def _convert_to_csv(self, data: Dict) -> str:
        """
        Convert data dictionary to CSV format

        Args:
            data: Data dictionary

        Returns:
            CSV string
        """
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(['Section', 'Field', 'Value'])

        # Flatten and write data
        for section, content in data.items():
            if isinstance(content, dict):
                for key, value in content.items():
                    writer.writerow([section, key, str(value)])
            elif isinstance(content, list):
                for i, item in enumerate(content):
                    if isinstance(item, dict):
                        for key, value in item.items():
                            writer.writerow([f"{section}[{i}]", key, str(value)])
                    else:
                        writer.writerow([section, str(i), str(item)])
            else:
                writer.writerow([section, '', str(content)])

        return output.getvalue()


# Singleton instance
_storage_service = None


def get_storage_service() -> S3StorageService:
    """Get or create S3 storage service instance"""
    global _storage_service
    if _storage_service is None:
        _storage_service = S3StorageService()
    return _storage_service
