"""
Extended Integration Tests for Priority Routers
Tests API endpoints to increase coverage from ~50% to 80%

Priority routers tested:
- pdf_generation.py (25% -> 80%+)
- documents.py (43% -> 80%+)
- insights.py (39% -> 80%+)
- user.py (46% -> 80%+)
- multi_canton_filing.py (47% -> 80%+)
"""

import io
import pytest
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch, ANY
from fastapi.testclient import TestClient
from fastapi import UploadFile

from main import app
from models.swisstax import User
from models.tax_filing_session import TaxFilingSession, FilingStatus


# ============================================================================
# PDF GENERATION ROUTER TESTS (routers/pdf_generation.py)
# ============================================================================

class TestPDFGenerationRouter:
    """Tests for PDF generation endpoints"""

    def test_get_pdf_info_success(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/info/{filing_id}"""
        mock_info = {
            'filing_id': 'filing-123',
            'canton': 'ZH',
            'tax_year': 2024,
            'is_primary': True,
            'available_pdfs': {'ech0196': True, 'traditional': True},
            'languages': ['de', 'fr', 'it', 'en'],
            'canton_info': {'name': 'Zurich'}
        }

        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            mock_gen.return_value.get_pdf_info.return_value = mock_info

            response = authenticated_client_no_2fa.get('/api/pdf/info/filing-123')

            assert response.status_code == 200
            data = response.json()
            assert data['filing_id'] == 'filing-123'
            assert data['canton'] == 'ZH'
            assert 'ech0196' in data['available_pdfs']

    def test_get_pdf_info_not_found(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/info/{filing_id} - filing not found"""
        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            mock_gen.return_value.get_pdf_info.side_effect = ValueError("Filing not found")

            response = authenticated_client_no_2fa.get('/api/pdf/info/nonexistent')

            assert response.status_code == 404
            assert 'not found' in response.json()['detail'].lower()

    def test_get_pdf_info_internal_error(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/info/{filing_id} - internal error"""
        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            mock_gen.return_value.get_pdf_info.side_effect = Exception("Internal error")

            response = authenticated_client_no_2fa.get('/api/pdf/info/filing-123')

            assert response.status_code == 500
            assert 'Internal error' in response.json()['detail']

    def test_download_pdf_ech0196_success(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/download/{filing_id} - eCH-0196 format"""
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            status=FilingStatus.COMPLETED
        )

        mock_pdf = io.BytesIO(b'%PDF-1.4 fake pdf content')

        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
                mock_service.return_value.get_filing.return_value = mock_filing
                mock_gen.return_value.generate_ech0196_pdf.return_value = mock_pdf

                response = authenticated_client_no_2fa.get(
                    '/api/pdf/download/filing-123?pdf_type=ech0196&language=de'
                )

                assert response.status_code == 200
                assert response.headers['content-type'] == 'application/pdf'
                assert 'attachment' in response.headers['content-disposition']
                assert 'ech0196' in response.headers['content-disposition']

    def test_download_pdf_traditional_success(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/download/{filing_id} - traditional format"""
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            status=FilingStatus.COMPLETED
        )

        mock_pdf = io.BytesIO(b'%PDF-1.4 fake traditional pdf')

        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
                mock_service.return_value.get_filing.return_value = mock_filing
                mock_gen.return_value.generate_traditional_pdf.return_value = mock_pdf

                response = authenticated_client_no_2fa.get(
                    '/api/pdf/download/filing-123?pdf_type=traditional&language=fr'
                )

                assert response.status_code == 200
                assert response.headers['content-type'] == 'application/pdf'
                assert 'official' in response.headers['content-disposition']

    def test_download_pdf_filing_not_found(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/download/{filing_id} - filing not found"""
        with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_filing.return_value = None

            response = authenticated_client_no_2fa.get('/api/pdf/download/nonexistent')

            assert response.status_code == 404
            assert 'not found' in response.json()['detail'].lower()

    def test_download_pdf_invalid_type(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/download/{filing_id} - invalid PDF type"""
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024,
            canton='ZH'
        )

        with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_filing.return_value = mock_filing

            response = authenticated_client_no_2fa.get(
                '/api/pdf/download/filing-123?pdf_type=invalid'
            )

            assert response.status_code == 400
            assert 'Invalid pdf_type' in response.json()['detail']

    def test_download_both_pdfs_success(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/download-both/{filing_id}"""
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            is_primary=True
        )

        mock_pdfs = {
            'ech0196': io.BytesIO(b'%PDF-1.4 ech'),
            'traditional': io.BytesIO(b'%PDF-1.4 trad')
        }

        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
                mock_service.return_value.get_filing.return_value = mock_filing
                mock_gen.return_value.generate_all_pdfs.return_value = mock_pdfs

                response = authenticated_client_no_2fa.get(
                    '/api/pdf/download-both/filing-123?language=de'
                )

                assert response.status_code == 200
                assert response.headers['content-type'] == 'application/zip'
                assert 'attachment' in response.headers['content-disposition']

    def test_download_all_user_pdfs_success(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/download-all/{user_id}/{tax_year}"""
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024,
            canton='ZH',
            is_primary=True
        )

        mock_all_pdfs = {
            'filing-123': {
                'ech0196': io.BytesIO(b'%PDF-1.4'),
                'traditional': io.BytesIO(b'%PDF-1.4')
            }
        }

        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
                mock_gen.return_value.generate_all_user_pdfs.return_value = mock_all_pdfs
                mock_service.return_value.get_filing.return_value = mock_filing
                mock_service.return_value.get_all_user_filings.return_value = [mock_filing]

                response = authenticated_client_no_2fa.get(
                    '/api/pdf/download-all/user-456/2024?pdf_type=both&language=de'
                )

                assert response.status_code == 200
                assert response.headers['content-type'] == 'application/zip'

    def test_download_all_user_pdfs_no_filings(self, authenticated_client_no_2fa):
        """Test GET /api/pdf/download-all/{user_id}/{tax_year} - no filings"""
        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            mock_gen.return_value.generate_all_user_pdfs.return_value = {}

            response = authenticated_client_no_2fa.get(
                '/api/pdf/download-all/user-456/2024'
            )

            assert response.status_code == 404
            assert 'No filings found' in response.json()['detail']

    def test_generate_pdf_success(self, authenticated_client_no_2fa):
        """Test POST /api/pdf/generate/{filing_id}"""
        mock_pdf = io.BytesIO(b'%PDF-1.4' + b'x' * 1000)

        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            mock_gen.return_value.generate_ech0196_pdf.return_value = mock_pdf

            response = authenticated_client_no_2fa.post(
                '/api/pdf/generate/filing-123?pdf_type=ech0196&language=de'
            )

            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
            assert data['filing_id'] == 'filing-123'
            assert data['pdf_type'] == 'ech0196'
            assert 'bytes' in data['message']

    def test_generate_pdf_invalid_type(self, authenticated_client_no_2fa):
        """Test POST /api/pdf/generate/{filing_id} - invalid type"""
        response = authenticated_client_no_2fa.post(
            '/api/pdf/generate/filing-123?pdf_type=invalid'
        )

        assert response.status_code == 400
        assert 'Invalid pdf_type' in response.json()['detail']

    def test_generate_pdf_error(self, authenticated_client_no_2fa):
        """Test POST /api/pdf/generate/{filing_id} - generation error"""
        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            mock_gen.return_value.generate_ech0196_pdf.side_effect = Exception("Generation failed")

            response = authenticated_client_no_2fa.post(
                '/api/pdf/generate/filing-123?pdf_type=ech0196'
            )

            assert response.status_code == 200  # Returns 200 with error field
            data = response.json()
            assert data['success'] is False
            assert 'Generation failed' in data['error']

    def test_generate_all_user_pdfs_success(self, authenticated_client_no_2fa):
        """Test POST /api/pdf/generate-all/{user_id}/{tax_year}"""
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id='user-456',
            tax_year=2024,
            canton='ZH'
        )

        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
                mock_service.return_value.get_all_user_filings.return_value = [mock_filing]
                mock_gen.return_value.generate_ech0196_pdf.return_value = io.BytesIO(b'%PDF')

                response = authenticated_client_no_2fa.post(
                    '/api/pdf/generate-all/user-456/2024?pdf_type=ech0196'
                )

                assert response.status_code == 200
                data = response.json()
                assert data['user_id'] == 'user-456'
                assert data['tax_year'] == 2024
                assert data['successful'] == 1
                assert data['failed'] == 0

    def test_generate_all_user_pdfs_no_filings(self, authenticated_client_no_2fa):
        """Test POST /api/pdf/generate-all/{user_id}/{tax_year} - no filings"""
        with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_all_user_filings.return_value = []

            response = authenticated_client_no_2fa.post(
                '/api/pdf/generate-all/user-456/2024'
            )

            assert response.status_code == 404
            assert 'No filings found' in response.json()['detail']

    def test_generate_all_user_pdfs_partial_failure(self, authenticated_client_no_2fa):
        """Test POST /api/pdf/generate-all - some PDFs fail"""
        filings = [
            TaxFilingSession(id='filing-1', user_id='user-456', tax_year=2024, canton='ZH'),
            TaxFilingSession(id='filing-2', user_id='user-456', tax_year=2024, canton='BE')
        ]

        with patch('routers.pdf_generation.UnifiedPDFGenerator') as mock_gen:
            with patch('routers.pdf_generation.FilingOrchestrationService') as mock_service:
                mock_service.return_value.get_all_user_filings.return_value = filings

                # First succeeds, second fails
                mock_gen.return_value.generate_ech0196_pdf.side_effect = [
                    io.BytesIO(b'%PDF'),
                    Exception("Failed")
                ]

                response = authenticated_client_no_2fa.post(
                    '/api/pdf/generate-all/user-456/2024?pdf_type=ech0196'
                )

                assert response.status_code == 200
                data = response.json()
                assert data['successful'] == 1
                assert data['failed'] == 1


# ============================================================================
# DOCUMENTS ROUTER TESTS (routers/documents.py)
# ============================================================================

class TestDocumentsRouter:
    """Tests for documents endpoints"""

    def test_get_upload_url_success(self, authenticated_client_no_2fa):
        """Test POST /api/documents/presigned-url"""
        mock_result = {
            'url': 'https://s3.amazonaws.com/upload',
            'fields': {'key': 'session-123/doc.pdf'},
            's3_key': 'session-123/doc.pdf'
        }

        with patch('routers.documents.doc_service.generate_presigned_url') as mock_generate:
            mock_generate.return_value = mock_result

            response = authenticated_client_no_2fa.post(
                '/api/documents/presigned-url',
                json={
                    'session_id': 'session-123',
                    'document_type': 'salary_statement',
                    'file_name': 'doc.pdf',
                    'expires_in': 3600
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert 'url' in data
            assert 's3_key' in data

    def test_get_upload_url_custom_expiry(self, authenticated_client_no_2fa):
        """Test POST /presigned-url with custom expiry"""
        mock_result = {'url': 'https://s3.amazonaws.com/upload', 'fields': {}}

        with patch('routers.documents.doc_service.generate_presigned_url') as mock_generate:
            mock_generate.return_value = mock_result

            response = authenticated_client_no_2fa.post(
                '/api/documents/presigned-url',
                json={
                    'session_id': 'session-123',
                    'document_type': 'tax_form',
                    'file_name': 'form.pdf',
                    'expires_in': 7200
                }
            )

            assert response.status_code == 200
            # Verify expiry was passed
            assert mock_generate.call_args.kwargs['expires_in'] == 7200

    def test_get_upload_url_error(self, authenticated_client_no_2fa):
        """Test POST /presigned-url - error"""
        with patch('routers.documents.doc_service.generate_presigned_url') as mock_generate:
            mock_generate.side_effect = Exception("S3 error")

            response = authenticated_client_no_2fa.post(
                '/api/documents/presigned-url',
                json={
                    'session_id': 'session-123',
                    'document_type': 'doc',
                    'file_name': 'test.pdf'
                }
            )

            assert response.status_code == 500
            assert 'Failed to generate upload URL' in response.json()['detail']

    def test_save_document_success(self, authenticated_client_no_2fa):
        """Test POST /metadata"""
        mock_result = {
            'document_id': 'doc-123',
            'status': 'saved',
            'created_at': '2024-01-01T00:00:00'
        }

        with patch('routers.documents.doc_service.save_document_metadata') as mock_save:
            mock_save.return_value = mock_result

            response = authenticated_client_no_2fa.post(
                '/api/documents/metadata',
                json={
                    'session_id': 'session-123',
                    'document_type_id': 1,
                    'file_name': 'doc.pdf',
                    's3_key': 'session-123/doc.pdf',
                    'file_size': 1024
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data['document_id'] == 'doc-123'
            assert data['status'] == 'saved'

    def test_save_document_without_size(self, authenticated_client_no_2fa):
        """Test POST /metadata without file_size"""
        mock_result = {'document_id': 'doc-123', 'status': 'saved'}

        with patch('routers.documents.doc_service.save_document_metadata') as mock_save:
            mock_save.return_value = mock_result

            response = authenticated_client_no_2fa.post(
                '/api/documents/metadata',
                json={
                    'session_id': 'session-123',
                    'document_type_id': 1,
                    'file_name': 'doc.pdf',
                    's3_key': 'session-123/doc.pdf'
                }
            )

            assert response.status_code == 200

    def test_save_document_error(self, authenticated_client_no_2fa):
        """Test POST /metadata - error"""
        with patch('routers.documents.doc_service.save_document_metadata') as mock_save:
            mock_save.side_effect = Exception("DB error")

            response = authenticated_client_no_2fa.post(
                '/api/documents/metadata',
                json={
                    'session_id': 'session-123',
                    'document_type_id': 1,
                    'file_name': 'doc.pdf',
                    's3_key': 'key'
                }
            )

            assert response.status_code == 500
            assert 'Failed to save document' in response.json()['detail']

    def test_list_documents_success(self, authenticated_client_no_2fa):
        """Test GET /{session_id}"""
        mock_docs = [
            {
                'document_id': 'doc-1',
                'file_name': 'salary.pdf',
                'status': 'uploaded',
                'extraction_status': 'completed'
            },
            {
                'document_id': 'doc-2',
                'file_name': 'tax_form.pdf',
                'status': 'uploaded',
                'extraction_status': 'pending'
            }
        ]

        with patch('routers.documents.doc_service.list_session_documents') as mock_list:
            mock_list.return_value = mock_docs

            response = authenticated_client_no_2fa.get('/api/documents/session-123')

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]['document_id'] == 'doc-1'

    def test_list_documents_empty(self, authenticated_client_no_2fa):
        """Test GET /{session_id} - no documents"""
        with patch('routers.documents.doc_service.list_session_documents') as mock_list:
            mock_list.return_value = []

            response = authenticated_client_no_2fa.get('/api/documents/session-empty')

            assert response.status_code == 200
            assert response.json() == []

    def test_list_documents_error(self, authenticated_client_no_2fa):
        """Test GET /{session_id} - error"""
        with patch('routers.documents.doc_service.list_session_documents') as mock_list:
            mock_list.side_effect = Exception("DB error")

            response = authenticated_client_no_2fa.get('/api/documents/session-123')

            assert response.status_code == 500
            assert 'Failed to list documents' in response.json()['detail']

    def test_get_document_url_success(self, authenticated_client_no_2fa):
        """Test GET /{document_id}/url"""
        mock_url = 'https://s3.amazonaws.com/presigned-download-url'

        with patch('routers.documents.doc_service.get_document_url') as mock_get:
            mock_get.return_value = mock_url

            response = authenticated_client_no_2fa.get('/api/documents/doc-123/url?expires_in=1800')

            assert response.status_code == 200
            data = response.json()
            assert data['url'] == mock_url
            assert data['expires_in'] == 1800

    def test_get_document_url_not_found(self, authenticated_client_no_2fa):
        """Test GET /{document_id}/url - document not found"""
        with patch('routers.documents.doc_service.get_document_url') as mock_get:
            mock_get.return_value = None

            response = authenticated_client_no_2fa.get('/api/documents/nonexistent/url')

            assert response.status_code == 404
            assert 'not found' in response.json()['detail'].lower()

    def test_get_document_url_error(self, authenticated_client_no_2fa):
        """Test GET /{document_id}/url - error"""
        with patch('routers.documents.doc_service.get_document_url') as mock_get:
            mock_get.side_effect = Exception("S3 error")

            response = authenticated_client_no_2fa.get('/api/documents/doc-123/url')

            assert response.status_code == 500
            assert 'Failed to get document URL' in response.json()['detail']

    def test_extract_document_data_success(self, authenticated_client_no_2fa):
        """Test POST /{document_id}/extract"""
        mock_result = {
            'job_id': 'textract-job-123',
            'status': 'IN_PROGRESS',
            'extracted_data': None
        }

        with patch('routers.documents.doc_service.process_document_with_textract') as mock_process:
            mock_process.return_value = mock_result

            response = authenticated_client_no_2fa.post('/api/documents/doc-123/extract')

            assert response.status_code == 200
            data = response.json()
            assert data['job_id'] == 'textract-job-123'
            assert data['status'] == 'IN_PROGRESS'

    def test_extract_document_data_error(self, authenticated_client_no_2fa):
        """Test POST /{document_id}/extract - error"""
        with patch('routers.documents.doc_service.process_document_with_textract') as mock_process:
            mock_process.side_effect = Exception("Textract error")

            response = authenticated_client_no_2fa.post('/api/documents/doc-123/extract')

            assert response.status_code == 500
            assert 'Failed to extract document data' in response.json()['detail']

    def test_check_extraction_status_success(self, authenticated_client_no_2fa):
        """Test GET /{document_id}/extraction-status"""
        mock_result = {
            'status': 'SUCCEEDED',
            'extracted_text': 'Sample extracted text',
            'confidence': 0.95
        }

        with patch('routers.documents.doc_service.check_textract_job') as mock_check:
            mock_check.return_value = mock_result

            response = authenticated_client_no_2fa.get('/api/documents/doc-123/extraction-status')

            assert response.status_code == 200
            data = response.json()
            assert data['status'] == 'SUCCEEDED'
            assert 'extracted_text' in data

    def test_check_extraction_status_error(self, authenticated_client_no_2fa):
        """Test GET /{document_id}/extraction-status - error"""
        with patch('routers.documents.doc_service.check_textract_job') as mock_check:
            mock_check.side_effect = Exception("Check failed")

            response = authenticated_client_no_2fa.get('/api/documents/doc-123/extraction-status')

            assert response.status_code == 500
            assert 'Failed to check extraction status' in response.json()['detail']

    def test_delete_document_success(self, authenticated_client_no_2fa):
        """Test DELETE /{document_id}"""
        with patch('routers.documents.doc_service.delete_document') as mock_delete:
            mock_delete.return_value = True

            response = authenticated_client_no_2fa.delete('/api/documents/doc-123')

            assert response.status_code == 204

    def test_delete_document_not_found(self, authenticated_client_no_2fa):
        """Test DELETE /{document_id} - not found"""
        with patch('routers.documents.doc_service.delete_document') as mock_delete:
            mock_delete.return_value = False

            response = authenticated_client_no_2fa.delete('/api/documents/nonexistent')

            assert response.status_code == 404
            assert 'not found' in response.json()['detail'].lower()

    def test_delete_document_error(self, authenticated_client_no_2fa):
        """Test DELETE /{document_id} - error"""
        with patch('routers.documents.doc_service.delete_document') as mock_delete:
            mock_delete.side_effect = Exception("Delete failed")

            response = authenticated_client_no_2fa.delete('/api/documents/doc-123')

            assert response.status_code == 500
            assert 'Failed to delete document' in response.json()['detail']


# ============================================================================
# INSIGHTS ROUTER TESTS (routers/insights.py)
# ============================================================================

class TestInsightsRouter:
    """Tests for tax insights endpoints"""

    def test_generate_insights_success(self, authenticated_client_no_2fa):
        """Test POST /generate/{filing_id}"""
        mock_insights = [
            Mock(to_dict=lambda: {
                'id': 'insight-1',
                'filing_session_id': 'filing-123',
                'insight_type': 'deduction',
                'priority': 'high',
                'title': 'Pillar 3a Opportunity',
                'description': 'You can save up to 7056 CHF',
                'estimated_savings_chf': 1500,
                'action_items': ['Open Pillar 3a account'],
                'is_acknowledged': False,
                'is_applied': False
            })
        ]

        with patch('routers.insights.TaxInsightService.generate_all_insights') as mock_generate:
            mock_generate.return_value = mock_insights

            response = authenticated_client_no_2fa.post(
                '/api/insights/generate/filing-123',
                json={'force_regenerate': False}
            )

            assert response.status_code == 201
            data = response.json()
            assert len(data) == 1
            assert data[0]['insight_type'] == 'deduction'
            assert data[0]['estimated_savings_chf'] == 1500

    def test_generate_insights_force_regenerate(self, authenticated_client_no_2fa):
        """Test POST /generate/{filing_id} with force_regenerate"""
        with patch('routers.insights.TaxInsightService.generate_all_insights') as mock_generate:
            mock_generate.return_value = []

            response = authenticated_client_no_2fa.post(
                '/api/insights/generate/filing-123',
                json={'force_regenerate': True}
            )

            assert response.status_code == 201
            # Verify force_regenerate was passed
            call_kwargs = mock_generate.call_args.kwargs
            assert call_kwargs['force_regenerate'] is True

    def test_generate_insights_filing_not_found(self, authenticated_client_no_2fa):
        """Test POST /generate/{filing_id} - filing not found"""
        with patch('routers.insights.TaxInsightService.generate_all_insights') as mock_generate:
            mock_generate.side_effect = ValueError("Filing not found")

            response = authenticated_client_no_2fa.post('/api/insights/generate/nonexistent')

            assert response.status_code == 404
            assert 'not found' in response.json()['detail'].lower()

    def test_generate_insights_error(self, authenticated_client_no_2fa):
        """Test POST /generate/{filing_id} - internal error"""
        with patch('routers.insights.TaxInsightService.generate_all_insights') as mock_generate:
            mock_generate.side_effect = Exception("AI service error")

            response = authenticated_client_no_2fa.post('/api/insights/generate/filing-123')

            assert response.status_code == 500
            assert 'Failed to generate insights' in response.json()['detail']

    def test_get_filing_insights_success(self, authenticated_client_no_2fa, mock_user):
        """Test GET /filing/{filing_id}"""
        mock_insights = [
            {
                'id': 'insight-1',
                'filing_session_id': 'filing-123',
                'insight_type': 'deduction',
                'priority': 'high',
                'title': 'Test Insight',
                'estimated_savings_chf': 1000
            }
        ]

        with patch('routers.insights.TaxInsightService.get_filing_insights') as mock_get:
            mock_get.return_value = mock_insights

            response = authenticated_client_no_2fa.get('/api/insights/filing/filing-123')

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]['priority'] == 'high'

    def test_get_filing_insights_empty(self, authenticated_client_no_2fa):
        """Test GET /filing/{filing_id} - no insights"""
        with patch('routers.insights.TaxInsightService.get_filing_insights') as mock_get:
            mock_get.return_value = []

            response = authenticated_client_no_2fa.get('/api/insights/filing/filing-empty')

            assert response.status_code == 200
            assert response.json() == []

    def test_get_filing_insights_not_found(self, authenticated_client_no_2fa):
        """Test GET /filing/{filing_id} - filing not found"""
        with patch('routers.insights.TaxInsightService.get_filing_insights') as mock_get:
            mock_get.side_effect = ValueError("Filing not found")

            response = authenticated_client_no_2fa.get('/api/insights/filing/nonexistent')

            assert response.status_code == 404

    def test_get_filing_insights_error(self, authenticated_client_no_2fa):
        """Test GET /filing/{filing_id} - error"""
        with patch('routers.insights.TaxInsightService.get_filing_insights') as mock_get:
            mock_get.side_effect = Exception("Database error")

            response = authenticated_client_no_2fa.get('/api/insights/filing/filing-123')

            assert response.status_code == 500

    def test_acknowledge_insight_success(self, authenticated_client_no_2fa, mock_user):
        """Test POST /{insight_id}/acknowledge"""
        mock_insight = Mock(to_dict=lambda: {
            'id': 'insight-1',
            'is_acknowledged': True,
            'acknowledged_at': '2024-01-01T00:00:00'
        })

        with patch('routers.insights.TaxInsightService.acknowledge_insight') as mock_ack:
            mock_ack.return_value = mock_insight

            response = authenticated_client_no_2fa.post('/api/insights/insight-1/acknowledge')

            assert response.status_code == 200
            data = response.json()
            assert data['is_acknowledged'] is True

    def test_acknowledge_insight_not_found(self, authenticated_client_no_2fa):
        """Test POST /{insight_id}/acknowledge - not found"""
        with patch('routers.insights.TaxInsightService.acknowledge_insight') as mock_ack:
            mock_ack.side_effect = ValueError("Insight not found")

            response = authenticated_client_no_2fa.post('/api/insights/nonexistent/acknowledge')

            assert response.status_code == 404

    def test_acknowledge_insight_error(self, authenticated_client_no_2fa):
        """Test POST /{insight_id}/acknowledge - error"""
        with patch('routers.insights.TaxInsightService.acknowledge_insight') as mock_ack:
            mock_ack.side_effect = Exception("Update failed")

            response = authenticated_client_no_2fa.post('/api/insights/insight-1/acknowledge')

            assert response.status_code == 500

    def test_mark_insight_applied_success(self, authenticated_client_no_2fa, mock_user):
        """Test POST /{insight_id}/apply"""
        mock_insight = Mock(to_dict=lambda: {
            'id': 'insight-1',
            'is_applied': True
        })

        with patch('routers.insights.TaxInsightService.mark_insight_applied') as mock_apply:
            mock_apply.return_value = mock_insight

            response = authenticated_client_no_2fa.post('/api/insights/insight-1/apply')

            assert response.status_code == 200
            data = response.json()
            assert data['is_applied'] is True

    def test_mark_insight_applied_not_found(self, authenticated_client_no_2fa):
        """Test POST /{insight_id}/apply - not found"""
        with patch('routers.insights.TaxInsightService.mark_insight_applied') as mock_apply:
            mock_apply.side_effect = ValueError("Insight not found")

            response = authenticated_client_no_2fa.post('/api/insights/nonexistent/apply')

            assert response.status_code == 404

    def test_mark_insight_applied_error(self, authenticated_client_no_2fa):
        """Test POST /{insight_id}/apply - error"""
        with patch('routers.insights.TaxInsightService.mark_insight_applied') as mock_apply:
            mock_apply.side_effect = Exception("Update failed")

            response = authenticated_client_no_2fa.post('/api/insights/insight-1/apply')

            assert response.status_code == 500

    def test_get_insights_statistics_success(self, authenticated_client_no_2fa):
        """Test GET /statistics/{filing_id}"""
        mock_insights = [
            {
                'insight_type': 'deduction',
                'priority': 'high',
                'estimated_savings_chf': 1000,
                'is_acknowledged': True,
                'is_applied': False
            },
            {
                'insight_type': 'credit',
                'priority': 'medium',
                'estimated_savings_chf': 500,
                'is_acknowledged': True,
                'is_applied': True
            },
            {
                'insight_type': 'deduction',
                'priority': 'low',
                'estimated_savings_chf': None,
                'is_acknowledged': False,
                'is_applied': False
            }
        ]

        with patch('routers.insights.TaxInsightService.get_filing_insights') as mock_get:
            mock_get.return_value = mock_insights

            response = authenticated_client_no_2fa.get('/api/insights/statistics/filing-123')

            assert response.status_code == 200
            data = response.json()
            assert data['total_insights'] == 3
            assert data['by_priority']['high'] == 1
            assert data['by_priority']['medium'] == 1
            assert data['by_priority']['low'] == 1
            assert data['by_type']['deduction'] == 2
            assert data['by_type']['credit'] == 1
            assert data['total_estimated_savings'] == 1500
            assert data['acknowledged_count'] == 2
            assert data['applied_count'] == 1

    def test_get_insights_statistics_empty(self, authenticated_client_no_2fa):
        """Test GET /statistics/{filing_id} - no insights"""
        with patch('routers.insights.TaxInsightService.get_filing_insights') as mock_get:
            mock_get.return_value = []

            response = authenticated_client_no_2fa.get('/api/insights/statistics/filing-empty')

            assert response.status_code == 200
            data = response.json()
            assert data['total_insights'] == 0
            assert data['total_estimated_savings'] == 0

    def test_get_insights_statistics_not_found(self, authenticated_client_no_2fa):
        """Test GET /statistics/{filing_id} - filing not found"""
        with patch('routers.insights.TaxInsightService.get_filing_insights') as mock_get:
            mock_get.side_effect = ValueError("Filing not found")

            response = authenticated_client_no_2fa.get('/api/insights/statistics/nonexistent')

            assert response.status_code == 404

    def test_get_insights_statistics_error(self, authenticated_client_no_2fa):
        """Test GET /statistics/{filing_id} - error"""
        with patch('routers.insights.TaxInsightService.get_filing_insights') as mock_get:
            mock_get.side_effect = Exception("Database error")

            response = authenticated_client_no_2fa.get('/api/insights/statistics/filing-123')

            assert response.status_code == 500


# ============================================================================
# USER ROUTER TESTS (routers/user.py)
# ============================================================================

class TestUserRouter:
    """Tests for user endpoints"""

    def test_list_of_users_success(self, authenticated_client_no_2fa):
        """Test GET /api/user/list"""
        mock_users = [
            {'id': 1, 'email': 'user1@example.com', 'first_name': 'User', 'last_name': 'One'},
            {'id': 2, 'email': 'user2@example.com', 'first_name': 'User', 'last_name': 'Two'}
        ]

        with patch('routers.user.UserService.get_list_of_users') as mock_list:
            mock_list.return_value = mock_users

            response = authenticated_client_no_2fa.get('/api/user/list')

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2

    def test_list_of_users_unauthorized(self, client):
        """Test GET /api/user/list without auth"""
        response = client.get('/api/user/list')

        # Should fail auth (401 or 403)
        assert response.status_code in [401, 403]

    def test_view_profile_success(self, authenticated_client_no_2fa, mock_user):
        """Test GET /api/user/profile"""
        response = authenticated_client_no_2fa.get('/api/user/profile')

        assert response.status_code == 200
        data = response.json()
        assert data['email'] == mock_user.email

    def test_view_profile_unauthorized(self, client):
        """Test GET /api/user/profile without auth"""
        response = client.get('/api/user/profile')

        assert response.status_code in [401, 403]

    def test_get_session_id_success(self, client):
        """Test GET /api/user/session-id"""
        # Create a valid JWT token
        from jose import jwt
        from config import settings
        import uuid

        payload = {
            'sub': 'user-123',
            'session_id': str(uuid.uuid4()),
            'exp': datetime.utcnow().timestamp() + 3600
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        client.cookies.set('access_token', f'Bearer {token}')

        response = client.get('/api/user/session-id')

        assert response.status_code == 200
        data = response.json()
        assert 'session_id' in data

    def test_get_session_id_no_token(self, client):
        """Test GET /api/user/session-id without token"""
        response = client.get('/api/user/session-id')

        assert response.status_code == 401
        assert 'No valid session' in response.json()['detail']

    def test_get_current_user_profile_success(self, authenticated_client_no_2fa, mock_user):
        """Test GET /api/user/me"""
        response = authenticated_client_no_2fa.get('/api/user/me')

        assert response.status_code == 200
        data = response.json()
        assert data['email'] == mock_user.email

    def test_update_profile_success(self, authenticated_client_no_2fa, mock_user):
        """Test PUT /api/user/profile"""
        updated_user = Mock(spec=User)
        updated_user.id = mock_user.id
        updated_user.email = mock_user.email
        updated_user.first_name = 'Updated'
        updated_user.last_name = 'Name'

        with patch('routers.user.UserService.update_user') as mock_update:
            mock_update.return_value = updated_user

            response = authenticated_client_no_2fa.put(
                '/api/user/profile',
                json={
                    'first_name': 'Updated',
                    'last_name': 'Name'
                }
            )

            assert response.status_code == 200

    def test_update_avatar_success(self, authenticated_client_no_2fa, mock_user):
        """Test PUT /api/user/profile/avatar"""
        mock_result = {'avatar_url': 'https://s3.amazonaws.com/avatar.jpg'}

        with patch('routers.user.UserService.update_avatar') as mock_update:
            mock_update.return_value = mock_result

            # Create a mock file
            file_content = b'fake image content'
            files = {'file': ('avatar.jpg', file_content, 'image/jpeg')}

            response = authenticated_client_no_2fa.put(
                '/api/user/profile/avatar',
                files=files
            )

            assert response.status_code == 200
            data = response.json()
            assert 'avatar_url' in data

    def test_update_password_success(self, authenticated_client_no_2fa, mock_user):
        """Test PUT /api/user/profile/password"""
        with patch('routers.user.verify_password') as mock_verify:
            with patch('routers.user.UserService.update_password') as mock_update:
                mock_verify.return_value = True

                response = authenticated_client_no_2fa.put(
                    '/api/user/profile/password',
                    json={
                        'password': 'old_password',
                        'new_password': 'new_password123'
                    }
                )

                assert response.status_code == 200
                data = response.json()
                assert 'Password updated' in data['message']

    def test_update_password_wrong_current(self, authenticated_client_no_2fa, mock_user):
        """Test PUT /api/user/profile/password - wrong current password"""
        with patch('routers.user.verify_password') as mock_verify:
            mock_verify.return_value = False

            response = authenticated_client_no_2fa.put(
                '/api/user/profile/password',
                json={
                    'password': 'wrong_password',
                    'new_password': 'new_password123'
                }
            )

            assert response.status_code == 400
            assert 'Invalid password' in response.json()['detail']

    def test_update_password_error(self, authenticated_client_no_2fa, mock_user):
        """Test PUT /api/user/profile/password - update error"""
        with patch('routers.user.verify_password') as mock_verify:
            with patch('routers.user.UserService.update_password') as mock_update:
                mock_verify.return_value = True
                mock_update.side_effect = Exception("Update failed")

                response = authenticated_client_no_2fa.put(
                    '/api/user/profile/password',
                    json={
                        'password': 'old_password',
                        'new_password': 'new_password123'
                    }
                )

                assert response.status_code == 400

    def test_deactivate_user_success(self, authenticated_client_no_2fa, mock_user):
        """Test DELETE /api/user/{user_id}"""
        with patch('routers.user.UserService.deactivate_user') as mock_deactivate:
            response = authenticated_client_no_2fa.delete(f'/api/user/{mock_user.id}')

            assert response.status_code == 204

    def test_deactivate_user_forbidden(self, authenticated_client_no_2fa, mock_user):
        """Test DELETE /api/user/{user_id} - different user"""
        response = authenticated_client_no_2fa.delete('/api/user/999')

        assert response.status_code == 403
        assert 'Not authorized' in response.json()['detail']

    def test_upload_pdf_success(self, authenticated_client_no_2fa, mock_user):
        """Test POST /api/user/{user_id}/pdfs/upload"""
        mock_result = {
            'document_id': 'doc-123',
            'file_name': 'test.pdf',
            'status': 'uploaded'
        }

        with patch('routers.user.pdf_service.upload_pdf_background') as mock_upload:
            mock_upload.return_value = mock_result

            file_content = b'%PDF-1.4 fake pdf'
            files = {'file': ('test.pdf', file_content, 'application/pdf')}

            response = authenticated_client_no_2fa.post(
                f'/api/user/{mock_user.id}/pdfs/upload',
                files=files
            )

            assert response.status_code == 202
            data = response.json()
            assert data['document_id'] == 'doc-123'

    def test_upload_pdf_forbidden(self, authenticated_client_no_2fa, mock_user):
        """Test POST /api/user/{user_id}/pdfs/upload - different user"""
        file_content = b'%PDF-1.4 fake pdf'
        files = {'file': ('test.pdf', file_content, 'application/pdf')}

        response = authenticated_client_no_2fa.post(
            '/api/user/999/pdfs/upload',
            files=files
        )

        assert response.status_code == 403


# ============================================================================
# MULTI-CANTON FILING ROUTER TESTS (routers/multi_canton_filing.py)
# ============================================================================

class TestMultiCantonFilingRouter:
    """Tests for multi-canton filing endpoints"""

    def test_create_primary_filing_success(self, authenticated_client_no_2fa, mock_user):
        """Test POST /api/multi-canton/filings/primary"""
        mock_filing = TaxFilingSession(
            id='filing-123',
            user_id=str(mock_user.id),
            tax_year=2024,
            canton='ZH',
            name='My 2024 Tax Return',
            is_primary=True,
            parent_filing_id=None,
            status='draft',
            completion_percentage=0,
            language='en'
        )

        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_primary_filing.return_value = None
            mock_service.return_value.create_primary_filing.return_value = mock_filing

            response = authenticated_client_no_2fa.post(
                '/api/multi-canton/filings/primary',
                json={
                    'tax_year': 2024,
                    'canton': 'ZH',
                    'language': 'en',
                    'name': 'My 2024 Tax Return'
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data['is_primary'] is True
            assert data['canton'] == 'ZH'

    def test_create_primary_filing_already_exists(self, authenticated_client_no_2fa, mock_user):
        """Test POST /api/multi-canton/filings/primary - already exists"""
        existing_filing = TaxFilingSession(
            id='filing-existing',
            user_id=mock_user.id,
            tax_year=2024,
            canton='ZH',
            is_primary=True
        )

        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_primary_filing.return_value = existing_filing

            response = authenticated_client_no_2fa.post(
                '/api/multi-canton/filings/primary',
                json={
                    'tax_year': 2024,
                    'canton': 'ZH'
                }
            )

            assert response.status_code == 409
            assert 'already exists' in response.json()['detail']

    def test_create_secondary_filings_success(self, authenticated_client_no_2fa, mock_user):
        """Test POST /api/multi-canton/filings/secondary"""
        primary_filing = TaxFilingSession(
            id='primary-123',
            user_id=str(mock_user.id),
            tax_year=2024,
            canton='ZH',
            name='Primary Filing',
            is_primary=True,
            status='draft',
            completion_percentage=0,
            language='en'
        )

        secondary_filings = [
            TaxFilingSession(
                id='secondary-1',
                user_id=str(mock_user.id),
                tax_year=2024,
                canton='BE',
                name='Secondary Filing BE',
                is_primary=False,
                parent_filing_id='primary-123',
                status='draft',
                completion_percentage=0,
                language='en'
            ),
            TaxFilingSession(
                id='secondary-2',
                user_id=str(mock_user.id),
                tax_year=2024,
                canton='GE',
                name='Secondary Filing GE',
                is_primary=False,
                parent_filing_id='primary-123',
                status='draft',
                completion_percentage=0,
                language='en'
            )
        ]

        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_filing.return_value = primary_filing
            mock_service.return_value.auto_create_secondary_filings.return_value = secondary_filings

            response = authenticated_client_no_2fa.post(
                '/api/multi-canton/filings/secondary',
                json={
                    'primary_filing_id': 'primary-123',
                    'property_cantons': ['BE', 'GE']
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]['canton'] == 'BE'
            assert data[1]['canton'] == 'GE'

    def test_create_secondary_filings_primary_not_found(self, authenticated_client_no_2fa):
        """Test POST /api/multi-canton/filings/secondary - primary not found"""
        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_filing.return_value = None

            response = authenticated_client_no_2fa.post(
                '/api/multi-canton/filings/secondary',
                json={
                    'primary_filing_id': 'nonexistent',
                    'property_cantons': ['BE']
                }
            )

            assert response.status_code == 404
            assert 'not found' in response.json()['detail']

    def test_create_secondary_filings_forbidden(self, authenticated_client_no_2fa, mock_user):
        """Test POST /api/multi-canton/filings/secondary - wrong user"""
        other_user_filing = TaxFilingSession(
            id='primary-123',
            user_id='other-user-id',
            tax_year=2024,
            canton='ZH',
            is_primary=True
        )

        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_filing.return_value = other_user_filing

            response = authenticated_client_no_2fa.post(
                '/api/multi-canton/filings/secondary',
                json={
                    'primary_filing_id': 'primary-123',
                    'property_cantons': ['BE']
                }
            )

            assert response.status_code == 403
            assert 'permission' in response.json()['detail'].lower()

    def test_get_all_filings_success(self, authenticated_client_no_2fa, mock_user):
        """Test GET /api/multi-canton/filings/{tax_year}"""
        filings = [
            TaxFilingSession(
                id='primary-123',
                user_id=str(mock_user.id),
                tax_year=2024,
                canton='ZH',
                name='Primary',
                is_primary=True,
                parent_filing_id=None,
                status='draft',
                completion_percentage=0,
                language='en'
            ),
            TaxFilingSession(
                id='secondary-1',
                user_id=str(mock_user.id),
                tax_year=2024,
                canton='BE',
                name='Secondary',
                is_primary=False,
                parent_filing_id='primary-123',
                status='draft',
                completion_percentage=0,
                language='en'
            )
        ]

        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_all_user_filings.return_value = filings

            response = authenticated_client_no_2fa.get('/api/multi-canton/filings/2024')

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2

    def test_get_all_filings_include_archived(self, authenticated_client_no_2fa):
        """Test GET /api/multi-canton/filings/{tax_year}?include_archived=true"""
        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_all_user_filings.return_value = []

            response = authenticated_client_no_2fa.get(
                '/api/multi-canton/filings/2024?include_archived=true'
            )

            assert response.status_code == 200
            # Verify include_archived was passed
            call_kwargs = mock_service.return_value.get_all_user_filings.call_args.kwargs
            assert call_kwargs['include_archived'] is True

    def test_get_primary_filing_success(self, authenticated_client_no_2fa, mock_user):
        """Test GET /api/multi-canton/filings/{tax_year}/primary"""
        primary_filing = TaxFilingSession(
            id='primary-123',
            user_id=str(mock_user.id),
            tax_year=2024,
            canton='ZH',
            name='Primary',
            is_primary=True,
            parent_filing_id=None,
            status='draft',
            completion_percentage=0,
            language='en'
        )

        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_primary_filing.return_value = primary_filing

            response = authenticated_client_no_2fa.get('/api/multi-canton/filings/2024/primary')

            assert response.status_code == 200
            data = response.json()
            assert data['is_primary'] is True

    def test_get_primary_filing_not_found(self, authenticated_client_no_2fa):
        """Test GET /api/multi-canton/filings/{tax_year}/primary - not found"""
        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_primary_filing.return_value = None

            response = authenticated_client_no_2fa.get('/api/multi-canton/filings/2024/primary')

            assert response.status_code == 404
            assert 'No primary filing found' in response.json()['detail']

    def test_get_secondary_filings_success(self, authenticated_client_no_2fa, mock_user):
        """Test GET /api/multi-canton/filings/{filing_id}/secondaries"""
        primary_filing = TaxFilingSession(
            id='primary-123',
            user_id=str(mock_user.id),
            tax_year=2024,
            canton='ZH',
            name='Primary',
            is_primary=True,
            status='draft',
            completion_percentage=0,
            language='en'
        )

        secondary_filings = [
            TaxFilingSession(
                id='secondary-1',
                user_id=str(mock_user.id),
                tax_year=2024,
                canton='BE',
                name='Secondary',
                is_primary=False,
                parent_filing_id='primary-123',
                status='draft',
                completion_percentage=0,
                language='en'
            )
        ]

        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_filing.return_value = primary_filing
            mock_service.return_value.get_secondary_filings.return_value = secondary_filings

            response = authenticated_client_no_2fa.get('/api/multi-canton/filings/primary-123/secondaries')

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]['is_primary'] is False

    def test_get_secondary_filings_not_found(self, authenticated_client_no_2fa):
        """Test GET /api/multi-canton/filings/{filing_id}/secondaries - not found"""
        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_filing.return_value = None

            response = authenticated_client_no_2fa.get('/api/multi-canton/filings/nonexistent/secondaries')

            assert response.status_code == 404

    def test_get_secondary_filings_forbidden(self, authenticated_client_no_2fa, mock_user):
        """Test GET /api/multi-canton/filings/{filing_id}/secondaries - wrong user"""
        other_user_filing = TaxFilingSession(
            id='primary-123',
            user_id='other-user-id',
            tax_year=2024,
            canton='ZH',
            is_primary=True
        )

        with patch('routers.multi_canton_filing.FilingOrchestrationService') as mock_service:
            mock_service.return_value.get_filing.return_value = other_user_filing

            response = authenticated_client_no_2fa.get('/api/multi-canton/filings/primary-123/secondaries')

            assert response.status_code == 403


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
