"""
Tests for Documents Router
Tests API endpoints for document management
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def mock_current_user():
    """Mock current user"""
    user = Mock()
    user.id = "test-user-123"
    user.email = "test@example.com"
    return user


@pytest.fixture
def mock_doc_service():
    """Mock document service"""
    with patch('routers.documents.doc_service') as mock:
        yield mock


class TestGetUserStorage:
    """Tests for GET /api/documents/user/storage endpoint"""

    def test_get_storage_success(self, client, mock_current_user, mock_doc_service):
        """Test getting user storage info successfully"""
        mock_doc_service.get_user_storage_info.return_value = {
            'storage_used_mb': 125.5,
            'storage_limit_mb': 500,
            'storage_used_bytes': 131621232,
            'document_count': 10,
            'percentage_used': 25.1
        }

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.get('/api/documents/user/storage')

        assert response.status_code == 200
        data = response.json()
        assert data['storage_used_mb'] == 125.5
        assert data['document_count'] == 10
        mock_doc_service.get_user_storage_info.assert_called_once_with(mock_current_user.id)

    def test_get_storage_unauthorized(self, client):
        """Test getting storage without authentication"""
        response = client.get('/api/documents/user/storage')
        assert response.status_code == 401

    def test_get_storage_service_error(self, client, mock_current_user, mock_doc_service):
        """Test handling service errors"""
        mock_doc_service.get_user_storage_info.side_effect = Exception("Database error")

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.get('/api/documents/user/storage')

        assert response.status_code == 500


class TestGetAllUserDocuments:
    """Tests for GET /api/documents/user/all endpoint"""

    def test_get_all_documents_success(self, client, mock_current_user, mock_doc_service):
        """Test getting all user documents successfully"""
        mock_docs = [
            {
                'id': 'doc-1',
                'file_name': 'tax_2024.pdf',
                'file_size': 1048576,
                'mime_type': 'application/pdf',
                'status': 'pending',
                'uploaded_at': '2024-01-15T10:00:00',
                'document_type': 'lohnausweis',
                'document_type_name': 'Lohnausweis',
                'upload_year': 2024
            }
        ]
        mock_doc_service.list_all_user_documents.return_value = mock_docs

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.get('/api/documents/user/all')

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['file_name'] == 'tax_2024.pdf'

    def test_get_all_documents_empty(self, client, mock_current_user, mock_doc_service):
        """Test getting documents when user has none"""
        mock_doc_service.list_all_user_documents.return_value = []

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.get('/api/documents/user/all')

        assert response.status_code == 200
        assert response.json() == []


class TestDownloadAllDocuments:
    """Tests for POST /api/documents/user/download-all endpoint"""

    def test_download_all_success(self, client, mock_current_user, mock_doc_service):
        """Test downloading all documents successfully"""
        mock_doc_service.create_documents_zip.return_value = {
            'download_url': 'https://s3.aws.com/download-url',
            'document_count': 5,
            'file_size_bytes': 5242880,
            'expires_in': 3600,
            'message': 'Document archive created successfully'
        }

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.post('/api/documents/user/download-all')

        assert response.status_code == 200
        data = response.json()
        assert 'download_url' in data
        assert data['document_count'] == 5

    def test_download_all_no_documents(self, client, mock_current_user, mock_doc_service):
        """Test downloading when user has no documents"""
        mock_doc_service.create_documents_zip.return_value = {
            'error': 'No documents found',
            'document_count': 0
        }

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.post('/api/documents/user/download-all')

        assert response.status_code == 200
        data = response.json()
        assert 'error' in data

    def test_download_all_s3_error(self, client, mock_current_user, mock_doc_service):
        """Test handling S3 errors during ZIP creation"""
        mock_doc_service.create_documents_zip.side_effect = Exception("S3 error")

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.post('/api/documents/user/download-all')

        assert response.status_code == 500


class TestDeleteOldDocuments:
    """Tests for DELETE /api/documents/user/old endpoint"""

    def test_delete_old_success(self, client, mock_current_user, mock_doc_service):
        """Test deleting old documents successfully"""
        mock_doc_service.delete_old_documents.return_value = {
            'deleted_count': 3,
            'failed_count': 0,
            'cutoff_date': '2017-01-15T10:00:00',
            'message': 'Successfully deleted 3 document(s) older than 7 years'
        }

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.delete('/api/documents/user/old')

        assert response.status_code == 200
        data = response.json()
        assert data['deleted_count'] == 3
        assert data['failed_count'] == 0

    def test_delete_old_none_found(self, client, mock_current_user, mock_doc_service):
        """Test deleting when no old documents exist"""
        mock_doc_service.delete_old_documents.return_value = {
            'deleted_count': 0,
            'message': 'No documents older than 7 years found'
        }

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.delete('/api/documents/user/old')

        assert response.status_code == 200
        data = response.json()
        assert data['deleted_count'] == 0

    def test_delete_old_partial_failure(self, client, mock_current_user, mock_doc_service):
        """Test deleting with some failures"""
        mock_doc_service.delete_old_documents.return_value = {
            'deleted_count': 2,
            'failed_count': 1,
            'cutoff_date': '2017-01-15T10:00:00',
            'message': 'Successfully deleted 2 document(s) older than 7 years (1 failed)'
        }

        with patch('routers.documents.get_current_user', return_value=mock_current_user):
            response = client.delete('/api/documents/user/old')

        assert response.status_code == 200
        data = response.json()
        assert data['deleted_count'] == 2
        assert data['failed_count'] == 1


# Pytest configuration
@pytest.fixture
def client():
    """Create a test client"""
    from fastapi import FastAPI
    from routers import documents

    app = FastAPI()
    app.include_router(documents.router, prefix="/api/documents")

    from fastapi.testclient import TestClient
    return TestClient(app)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
