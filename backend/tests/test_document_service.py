"""
Tests for Document Service
Tests document management functionality including storage, download, and deletion
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
import io
import zipfile

from services.document_service import DocumentService


@pytest.fixture
def document_service():
    """Create a DocumentService instance for testing"""
    return DocumentService()


@pytest.fixture
def mock_user_id():
    """Mock user ID for testing"""
    return "test-user-123"


@pytest.fixture
def mock_documents():
    """Mock document data"""
    return [
        {
            'id': 'doc-1',
            'file_name': 'tax_doc_2024.pdf',
            'file_size': 1048576,  # 1 MB
            'mime_type': 'application/pdf',
            'status': 'pending',
            'uploaded_at': datetime(2024, 1, 15),
            'document_type': 'lohnausweis',
            'document_type_name': 'Lohnausweis',
            'upload_year': 2024,
            's3_key': 'documents/session-1/lohnausweis/doc-1.pdf'
        },
        {
            'id': 'doc-2',
            'file_name': 'tax_doc_2023.pdf',
            'file_size': 2097152,  # 2 MB
            'mime_type': 'application/pdf',
            'status': 'completed',
            'uploaded_at': datetime(2023, 3, 20),
            'document_type': 'pillar_3a',
            'document_type_name': 'Pillar 3a Certificate',
            'upload_year': 2023,
            's3_key': 'documents/session-2/pillar_3a/doc-2.pdf'
        }
    ]


class TestGetUserStorageInfo:
    """Tests for get_user_storage_info method"""

    @patch('services.document_service.execute_one')
    def test_get_storage_info_success(self, mock_execute_one, document_service, mock_user_id):
        """Test getting storage info successfully"""
        mock_execute_one.return_value = {
            'document_count': 5,
            'total_bytes': 10485760  # 10 MB
        }

        result = document_service.get_user_storage_info(mock_user_id)

        assert result['document_count'] == 5
        assert result['storage_used_mb'] == 10.0
        assert result['storage_limit_mb'] == 500
        assert result['percentage_used'] == 2.0
        mock_execute_one.assert_called_once()

    @patch('services.document_service.execute_one')
    def test_get_storage_info_no_documents(self, mock_execute_one, document_service, mock_user_id):
        """Test getting storage info when user has no documents"""
        mock_execute_one.return_value = None

        result = document_service.get_user_storage_info(mock_user_id)

        assert result['document_count'] == 0
        assert result['storage_used_mb'] == 0.0
        assert result['percentage_used'] == 0.0

    @patch('services.document_service.execute_one')
    def test_get_storage_info_zero_bytes(self, mock_execute_one, document_service, mock_user_id):
        """Test getting storage info when total bytes is 0"""
        mock_execute_one.return_value = {
            'document_count': 3,
            'total_bytes': 0
        }

        result = document_service.get_user_storage_info(mock_user_id)

        assert result['document_count'] == 3
        assert result['storage_used_mb'] == 0.0
        assert result['percentage_used'] == 0.0


class TestListAllUserDocuments:
    """Tests for list_all_user_documents method"""

    @patch('services.document_service.execute_query')
    def test_list_documents_success(self, mock_execute_query, document_service, mock_user_id, mock_documents):
        """Test listing user documents successfully"""
        mock_execute_query.return_value = mock_documents

        result = document_service.list_all_user_documents(mock_user_id)

        assert len(result) == 2
        assert result[0]['file_name'] == 'tax_doc_2024.pdf'
        assert result[1]['file_name'] == 'tax_doc_2023.pdf'
        # Check timestamps were converted to ISO format
        assert isinstance(result[0]['uploaded_at'], str)

    @patch('services.document_service.execute_query')
    def test_list_documents_empty(self, mock_execute_query, document_service, mock_user_id):
        """Test listing documents when user has none"""
        mock_execute_query.return_value = []

        result = document_service.list_all_user_documents(mock_user_id)

        assert result == []


class TestCreateDocumentsZip:
    """Tests for create_documents_zip method"""

    @patch('services.document_service.s3_client')
    @patch('services.document_service.execute_query')
    def test_create_zip_success(self, mock_execute_query, mock_s3_client, document_service, mock_user_id, mock_documents):
        """Test creating ZIP archive successfully"""
        mock_execute_query.return_value = mock_documents

        # Mock S3 get_object responses
        mock_s3_client.get_object.side_effect = [
            {'Body': io.BytesIO(b'PDF content 1')},
            {'Body': io.BytesIO(b'PDF content 2')}
        ]

        # Mock S3 put_object
        mock_s3_client.put_object.return_value = {}

        # Mock presigned URL
        mock_s3_client.generate_presigned_url.return_value = 'https://s3.aws.com/download-url'

        result = document_service.create_documents_zip(mock_user_id)

        assert 'download_url' in result
        assert result['document_count'] == 2
        assert 'file_size_bytes' in result
        assert mock_s3_client.get_object.call_count == 2
        mock_s3_client.put_object.assert_called_once()

    @patch('services.document_service.execute_query')
    def test_create_zip_no_documents(self, mock_execute_query, document_service, mock_user_id):
        """Test creating ZIP when user has no documents"""
        mock_execute_query.return_value = []

        result = document_service.create_documents_zip(mock_user_id)

        assert 'error' in result
        assert result['document_count'] == 0

    @patch('services.document_service.s3_client')
    @patch('services.document_service.execute_query')
    def test_create_zip_partial_failure(self, mock_execute_query, mock_s3_client, document_service, mock_user_id, mock_documents):
        """Test creating ZIP when some S3 downloads fail"""
        mock_execute_query.return_value = mock_documents

        # First succeeds, second fails
        mock_s3_client.get_object.side_effect = [
            {'Body': io.BytesIO(b'PDF content 1')},
            ClientError({'Error': {'Code': 'NoSuchKey', 'Message': 'Not found'}}, 'GetObject')
        ]

        mock_s3_client.put_object.return_value = {}
        mock_s3_client.generate_presigned_url.return_value = 'https://s3.aws.com/download-url'

        result = document_service.create_documents_zip(mock_user_id)

        # Should still create ZIP with successful document
        assert 'download_url' in result
        assert result['document_count'] == 2  # Total requested

    @patch('services.document_service.s3_client')
    @patch('services.document_service.execute_query')
    def test_create_zip_all_downloads_fail(self, mock_execute_query, mock_s3_client, document_service, mock_user_id, mock_documents):
        """Test creating ZIP when all S3 downloads fail"""
        mock_execute_query.return_value = mock_documents

        # All downloads fail
        mock_s3_client.get_object.side_effect = ClientError(
            {'Error': {'Code': 'NoSuchKey', 'Message': 'Not found'}}, 'GetObject'
        )

        result = document_service.create_documents_zip(mock_user_id)

        assert 'error' in result
        assert result['document_count'] == 0


class TestDeleteOldDocuments:
    """Tests for delete_old_documents method"""

    @patch('services.document_service.s3_client')
    @patch('services.document_service.execute_query')
    def test_delete_old_documents_success(self, mock_execute_query, mock_s3_client, document_service, mock_user_id):
        """Test deleting old documents successfully"""
        old_docs = [
            {'id': 'old-doc-1', 's3_key': 'documents/old1.pdf'},
            {'id': 'old-doc-2', 's3_key': 'documents/old2.pdf'}
        ]
        mock_execute_query.side_effect = [old_docs, None, None]

        mock_s3_client.delete_object.return_value = {}

        result = document_service.delete_old_documents(mock_user_id, years=7)

        assert result['deleted_count'] == 2
        assert result['failed_count'] == 0
        assert 'cutoff_date' in result
        assert mock_s3_client.delete_object.call_count == 2

    @patch('services.document_service.execute_query')
    def test_delete_old_documents_none_found(self, mock_execute_query, document_service, mock_user_id):
        """Test deleting old documents when none exist"""
        mock_execute_query.return_value = []

        result = document_service.delete_old_documents(mock_user_id, years=7)

        assert result['deleted_count'] == 0
        assert 'No documents older than 7 years found' in result['message']

    @patch('services.document_service.s3_client')
    @patch('services.document_service.execute_query')
    def test_delete_old_documents_s3_failure(self, mock_execute_query, mock_s3_client, document_service, mock_user_id):
        """Test deleting old documents when S3 deletion fails"""
        old_docs = [
            {'id': 'old-doc-1', 's3_key': 'documents/old1.pdf'}
        ]
        mock_execute_query.return_value = old_docs

        mock_s3_client.delete_object.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'DeleteObject'
        )

        result = document_service.delete_old_documents(mock_user_id, years=7)

        assert result['deleted_count'] == 0
        assert result['failed_count'] == 1

    @patch('services.document_service.s3_client')
    @patch('services.document_service.execute_query')
    def test_delete_old_documents_custom_years(self, mock_execute_query, mock_s3_client, document_service, mock_user_id):
        """Test deleting documents with custom year threshold"""
        old_docs = [{'id': 'old-doc-1', 's3_key': 'documents/old1.pdf'}]
        mock_execute_query.side_effect = [old_docs, None]
        mock_s3_client.delete_object.return_value = {}

        result = document_service.delete_old_documents(mock_user_id, years=5)

        assert result['deleted_count'] == 1
        # Verify cutoff date calculation
        cutoff = datetime.fromisoformat(result['cutoff_date'])
        expected_cutoff = datetime.utcnow() - timedelta(days=5 * 365)
        assert abs((cutoff - expected_cutoff).total_seconds()) < 5  # Within 5 seconds


class TestListSessionDocuments:
    """Tests for list_session_documents method"""

    @patch('services.document_service.execute_query')
    def test_list_session_documents(self, mock_execute_query, document_service):
        """Test listing documents for a specific session"""
        session_id = "session-123"
        mock_docs = [
            {
                'id': 'doc-1',
                'file_name': 'doc1.pdf',
                'file_size': 1024,
                'mime_type': 'application/pdf',
                'status': 'pending',
                'uploaded_at': datetime(2024, 1, 15),
                'document_type': 'lohnausweis',
                'document_type_name': 'Lohnausweis'
            }
        ]
        mock_execute_query.return_value = mock_docs

        result = document_service.list_session_documents(session_id)

        assert len(result) == 1
        assert result[0]['file_name'] == 'doc1.pdf'
        assert isinstance(result[0]['uploaded_at'], str)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
