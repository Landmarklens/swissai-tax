"""Document service for handling file uploads and S3 operations"""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

from database.connection import execute_insert, execute_one, execute_query

# Get configuration from Parameter Store
ssm_client = boto3.client('ssm', region_name='us-east-1')

def get_s3_config() -> tuple:
    """Get S3 bucket name and region from Parameter Store"""
    try:
        # Get bucket name
        bucket_response = ssm_client.get_parameter(Name='/swissai-tax/s3/documents-bucket')
        bucket_name = bucket_response['Parameter']['Value']
        print(f"[S3 Config] Loaded bucket from Parameter Store: {bucket_name}")

        # Get S3 region
        try:
            region_response = ssm_client.get_parameter(Name='/swissai-tax/s3/region')
            region = region_response['Parameter']['Value']
            print(f"[S3 Config] Loaded region from Parameter Store: {region}")
        except Exception as e:
            region = 'eu-central-2'  # Default to bucket's actual region
            print(f"[S3 Config] Failed to load region from Parameter Store ({e}), using default: {region}")

        return bucket_name, region
    except Exception as e:
        print(f"[S3 Config] Error getting S3 config: {e}")
        return 'swissai-tax-documents', 'eu-central-2'

S3_BUCKET, S3_REGION = get_s3_config()
print(f"[S3 Config] Final config - Bucket: {S3_BUCKET}, Region: {S3_REGION}")

# Initialize AWS clients with correct regions
# Use explicit regional endpoint URL to avoid signature mismatch
endpoint_url = f'https://s3.{S3_REGION}.amazonaws.com'
s3_client = boto3.client('s3', region_name=S3_REGION, endpoint_url=endpoint_url)
print(f"[S3 Config] S3 client initialized with region: {s3_client.meta.region_name}, endpoint: {endpoint_url}")
textract_client = boto3.client('textract', region_name='us-east-1')  # Textract in us-east-1


class DocumentService:
    """Service for managing document uploads and processing"""

    def generate_presigned_url(self, session_id: str, document_type: str,
                              file_name: str, expires_in: int = 3600) -> Dict[str, Any]:
        """Generate a presigned URL for uploading documents"""
        # Generate unique S3 key
        file_extension = file_name.split('.')[-1] if '.' in file_name else 'pdf'
        s3_key = f"documents/{session_id}/{document_type}/{uuid.uuid4()}.{file_extension}"

        try:
            # Generate presigned POST URL
            response = s3_client.generate_presigned_post(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Fields={
                    'Content-Type': self._get_mime_type(file_extension),
                    'x-amz-server-side-encryption': 'AES256'
                },
                Conditions=[
                    {'Content-Type': self._get_mime_type(file_extension)},
                    ['content-length-range', 0, 10485760]  # Max 10MB
                ],
                ExpiresIn=expires_in
            )

            return {
                'url': response['url'],
                'fields': response['fields'],
                's3_key': s3_key,
                'expires_in': expires_in
            }
        except ClientError as e:
            print(f"Error generating presigned URL: {e}")
            raise

    def save_document_metadata(self, session_id: str, document_type_id: int,
                               file_name: str, s3_key: str, file_size: int = None) -> Dict[str, Any]:
        """Save document metadata to database"""
        query = """
            INSERT INTO swisstax.documents (
                session_id, document_type_id, file_name, file_size,
                mime_type, s3_key, s3_bucket, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'uploaded')
            RETURNING id, session_id, document_type_id, file_name, s3_key, status
        """

        file_extension = file_name.split('.')[-1] if '.' in file_name else ''
        mime_type = self._get_mime_type(file_extension)

        return execute_insert(query, (
            session_id, document_type_id, file_name, file_size,
            mime_type, s3_key, S3_BUCKET
        ))

    def get_document_url(self, document_id: str, expires_in: int = 3600) -> Optional[str]:
        """Get a presigned URL for downloading a document"""
        # Get document metadata
        query = """
            SELECT s3_key, s3_bucket, file_name
            FROM swisstax.documents
            WHERE id = %s
        """
        document = execute_one(query, (document_id,))

        if not document:
            return None

        try:
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': document['s3_bucket'],
                    'Key': document['s3_key'],
                    'ResponseContentDisposition': f'attachment; filename="{document["file_name"]}"'
                },
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            print(f"Error generating download URL: {e}")
            return None

    def list_session_documents(self, session_id: str) -> List[Dict[str, Any]]:
        """List all documents for a session"""
        query = """
            SELECT
                id::text as id,
                file_name,
                file_size,
                mime_type,
                ocr_status as status,
                created_at as uploaded_at,
                document_type,
                document_type as document_type_name
            FROM swisstax.documents
            WHERE session_id = %s::uuid
            ORDER BY created_at DESC
        """
        documents = execute_query(query, (session_id,))

        # Convert timestamps
        for doc in documents:
            if doc.get('uploaded_at'):
                doc['uploaded_at'] = doc['uploaded_at'].isoformat() if hasattr(doc['uploaded_at'], 'isoformat') else str(doc['uploaded_at'])

        return documents

    def delete_document(self, document_id: str) -> bool:
        """Soft delete a document"""
        query = """
            UPDATE swisstax.documents
            SET status = 'deleted'
            WHERE id = %s
            RETURNING id
        """
        result = execute_insert(query, (document_id,))
        return result is not None

    def process_document_with_textract(self, document_id: str) -> Dict[str, Any]:
        """Process a document using AWS Textract for OCR"""
        # Get document metadata
        query = """
            SELECT s3_key, s3_bucket, document_type_id
            FROM swisstax.documents
            WHERE id = %s
        """
        document = execute_one(query, (document_id,))

        if not document:
            return {'error': 'Document not found'}

        try:
            # Update status to processing
            self._update_document_status(document_id, 'processing')

            # Start Textract job
            response = textract_client.start_document_text_detection(
                DocumentLocation={
                    'S3Object': {
                        'Bucket': document['s3_bucket'],
                        'Name': document['s3_key']
                    }
                }
            )

            job_id = response['JobId']

            # Store job ID for tracking
            query = """
                UPDATE swisstax.documents
                SET ocr_data = %s
                WHERE id = %s
            """
            execute_query(query, (
                json.dumps({'textract_job_id': job_id}),
                document_id
            ), fetch=False)

            return {
                'document_id': document_id,
                'job_id': job_id,
                'status': 'processing',
                'message': 'Document processing started'
            }

        except ClientError as e:
            print(f"Error processing document with Textract: {e}")
            self._update_document_status(document_id, 'failed')
            return {'error': str(e)}

    def check_textract_job(self, document_id: str) -> Dict[str, Any]:
        """Check the status of a Textract job"""
        # Get job ID from document
        query = """
            SELECT ocr_data
            FROM swisstax.documents
            WHERE id = %s
        """
        document = execute_one(query, (document_id,))

        if not document or not document.get('ocr_data'):
            return {'error': 'No OCR job found'}

        job_id = (document.get('ocr_data') or {}).get('textract_job_id')
        if not job_id:
            return {'error': 'No job ID found'}

        try:
            # Get job status
            response = textract_client.get_document_text_detection(JobId=job_id)

            if response['JobStatus'] == 'SUCCEEDED':
                # Extract text
                extracted_text = self._extract_textract_results(response)

                # Update document with results
                query = """
                    UPDATE swisstax.documents
                    SET status = 'processed',
                        processed_at = CURRENT_TIMESTAMP,
                        extracted_fields = %s
                    WHERE id = %s
                """
                execute_query(query, (
                    json.dumps(extracted_text),
                    document_id
                ), fetch=False)

                return {
                    'document_id': document_id,
                    'status': 'completed',
                    'extracted_text': extracted_text
                }

            elif response['JobStatus'] == 'FAILED':
                self._update_document_status(document_id, 'failed')
                return {
                    'document_id': document_id,
                    'status': 'failed',
                    'error': 'Textract job failed'
                }

            else:
                return {
                    'document_id': document_id,
                    'status': 'processing',
                    'job_status': response['JobStatus']
                }

        except ClientError as e:
            print(f"Error checking Textract job: {e}")
            return {'error': str(e)}

    def _extract_textract_results(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Extract relevant information from Textract results"""
        extracted = {
            'raw_text': '',
            'tables': [],
            'forms': [],
            'confidence': 0
        }

        blocks = response.get('Blocks', [])
        text_blocks = []
        confidence_scores = []

        for block in blocks:
            if block['BlockType'] == 'LINE':
                text_blocks.append(block['Text'])
                confidence_scores.append(block['Confidence'])

            elif block['BlockType'] == 'TABLE':
                # Process table data
                extracted['tables'].append({
                    'confidence': block['Confidence'],
                    'cells': self._extract_table_cells(block, blocks)
                })

        extracted['raw_text'] = '\n'.join(text_blocks)
        if confidence_scores:
            extracted['confidence'] = sum(confidence_scores) / len(confidence_scores)

        # Extract specific fields based on document type (customize as needed)
        extracted['parsed_fields'] = self._parse_document_fields(extracted['raw_text'])

        return extracted

    def _extract_table_cells(self, table_block: Dict, all_blocks: List[Dict]) -> List[Dict]:
        """Extract cells from a table block"""
        cells = []
        # Implementation would extract cell relationships
        # This is simplified for brevity
        return cells

    def _parse_document_fields(self, text: str) -> Dict[str, Any]:
        """Parse specific fields from document text"""
        fields = {}

        # Example: Extract salary from Lohnausweis
        import re
        salary_pattern = r'Bruttolohn.*?(\d+[\d\',\.]*)'
        salary_match = re.search(salary_pattern, text, re.IGNORECASE)
        if salary_match:
            fields['gross_salary'] = salary_match.group(1).replace(',', '').replace("'", '')

        # Add more field extraction patterns as needed

        return fields

    def _get_mime_type(self, file_extension: str) -> str:
        """Get MIME type based on file extension"""
        mime_types = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        return mime_types.get(file_extension.lower(), 'application/octet-stream')

    def _update_document_status(self, document_id: str, status: str):
        """Update document status"""
        query = """
            UPDATE swisstax.documents
            SET status = %s
            WHERE id = %s
        """
        execute_query(query, (status, document_id), fetch=False)

    # ============================================================================
    # USER DOCUMENT MANAGEMENT METHODS
    # ============================================================================

    def get_user_storage_info(self, user_id: str) -> Dict[str, Any]:
        """Get user's storage usage information"""
        query = """
            SELECT
                COUNT(*) as document_count,
                COALESCE(SUM(file_size), 0) as total_bytes
            FROM swisstax.documents
            WHERE user_id = %s
        """
        result = execute_one(query, (user_id,))

        if not result:
            result = {'document_count': 0, 'total_bytes': 0}

        total_mb = (result['total_bytes'] or 0) / (1024 * 1024)  # Convert to MB
        storage_limit_mb = 500  # 500 MB default limit

        return {
            'storage_used_mb': round(total_mb, 2),
            'storage_limit_mb': storage_limit_mb,
            'storage_used_bytes': result['total_bytes'],
            'document_count': result['document_count'],
            'percentage_used': round((total_mb / storage_limit_mb) * 100, 2) if storage_limit_mb > 0 else 0
        }

    def list_all_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """List all documents for a user, organized by year"""
        query = """
            SELECT
                id::text as id,
                file_name,
                file_size,
                mime_type,
                ocr_status as status,
                created_at as uploaded_at,
                document_type,
                document_type as document_type_name,
                EXTRACT(YEAR FROM created_at) as upload_year
            FROM swisstax.documents
            WHERE user_id = %s
            ORDER BY created_at DESC
        """
        documents = execute_query(query, (user_id,))

        # Convert timestamps to ISO format strings for JSON serialization
        for doc in documents:
            if doc.get('uploaded_at'):
                doc['uploaded_at'] = doc['uploaded_at'].isoformat() if hasattr(doc['uploaded_at'], 'isoformat') else str(doc['uploaded_at'])

        return documents

    def create_documents_zip(self, user_id: str) -> Dict[str, Any]:
        """Create a ZIP archive of all user documents"""
        import io
        import zipfile
        from datetime import datetime

        # Get all user documents
        query = """
            SELECT
                id::text as id,
                file_name,
                s3_key,
                EXTRACT(YEAR FROM created_at) as upload_year,
                document_type
            FROM swisstax.documents
            WHERE user_id = %s
            ORDER BY created_at DESC
        """
        documents = execute_query(query, (user_id,))

        if not documents:
            return {
                'error': 'No documents found',
                'document_count': 0
            }

        # Create ZIP file in memory
        zip_buffer = io.BytesIO()

        try:
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                successful_count = 0
                for doc in documents:
                    try:
                        # Download file from S3
                        response = s3_client.get_object(
                            Bucket=S3_BUCKET,
                            Key=doc['s3_key']
                        )
                        file_content = response['Body'].read()

                        # Organize by year and document type
                        year = int(doc['upload_year']) if doc['upload_year'] else 'unknown'
                        doc_type = doc['document_type'] or 'other'
                        zip_path = f"{year}/{doc_type}/{doc['file_name']}"

                        # Add to ZIP
                        zip_file.writestr(zip_path, file_content)
                        successful_count += 1

                    except ClientError as e:
                        print(f"Error downloading document {doc['id']}: {e}")
                        # Continue with other documents
                    except Exception as e:
                        print(f"Unexpected error processing document {doc['id']}: {e}")
                        # Continue with other documents

                if successful_count == 0:
                    return {
                        'error': 'Failed to add any documents to archive',
                        'document_count': 0
                    }

            # Upload ZIP to S3
            zip_buffer.seek(0)
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            zip_key = f"exports/{user_id}/documents_{timestamp}.zip"

            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=zip_key,
                Body=zip_buffer.getvalue(),
                ContentType='application/zip',
                ServerSideEncryption='AES256'
            )

            # Generate presigned download URL (valid for 1 hour)
            download_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': zip_key,
                    'ResponseContentDisposition': f'attachment; filename="swissai_tax_documents_{timestamp}.zip"'
                },
                ExpiresIn=3600
            )

            return {
                'download_url': download_url,
                'document_count': len(documents),
                'file_size_bytes': len(zip_buffer.getvalue()),
                'expires_in': 3600,
                'message': 'Document archive created successfully'
            }

        except Exception as e:
            print(f"Error creating document archive: {e}")
            raise

    def delete_old_documents(self, user_id: str, years: int = 7) -> Dict[str, Any]:
        """Delete documents older than specified years"""
        from datetime import datetime, timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=years * 365)

        # Get documents to delete
        query = """
            SELECT id::text as id, s3_key
            FROM swisstax.documents
            WHERE user_id = %s
                AND created_at < %s
        """
        old_documents = execute_query(query, (user_id, cutoff_date))

        if not old_documents:
            return {
                'deleted_count': 0,
                'message': 'No documents older than 7 years found'
            }

        deleted_count = 0
        failed_count = 0
        for doc in old_documents:
            try:
                # Delete from S3
                s3_client.delete_object(
                    Bucket=S3_BUCKET,
                    Key=doc['s3_key']
                )

                # Hard delete from database for old documents
                delete_query = """
                    DELETE FROM swisstax.documents
                    WHERE id = %s::uuid
                """
                execute_query(delete_query, (doc['id'],), fetch=False)
                deleted_count += 1

            except ClientError as e:
                print(f"Error deleting document {doc['id']} from S3: {e}")
                failed_count += 1
            except Exception as e:
                print(f"Error deleting document {doc['id']} from database: {e}")
                failed_count += 1

        return {
            'deleted_count': deleted_count,
            'failed_count': failed_count,
            'cutoff_date': cutoff_date.isoformat(),
            'message': f'Successfully deleted {deleted_count} document(s) older than {years} years' + (f' ({failed_count} failed)' if failed_count > 0 else '')
        }