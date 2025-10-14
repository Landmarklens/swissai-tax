"""Pending Document Service for managing documents marked as 'bring later'"""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from models.pending_document import PendingDocument, DocumentStatus

logger = logging.getLogger(__name__)


class PendingDocumentService:
    """Service for managing pending documents in tax filing"""

    def __init__(self, db: Session):
        self.db = db

    def get_pending_documents(self, filing_session_id: str) -> List[PendingDocument]:
        """
        Get all pending documents for a filing session

        Args:
            filing_session_id: The filing session ID

        Returns:
            List of pending documents
        """
        try:
            pending_docs = self.db.query(PendingDocument).filter(
                PendingDocument.filing_session_id == filing_session_id,
                PendingDocument.status == DocumentStatus.PENDING
            ).all()

            logger.info(f"Found {len(pending_docs)} pending documents for filing {filing_session_id}")
            return pending_docs

        except Exception as e:
            logger.error(f"Error fetching pending documents: {e}")
            return []

    def get_all_documents(self, filing_session_id: str) -> List[PendingDocument]:
        """
        Get all documents (pending, uploaded, verified) for a filing session

        Args:
            filing_session_id: The filing session ID

        Returns:
            List of all documents
        """
        try:
            docs = self.db.query(PendingDocument).filter(
                PendingDocument.filing_session_id == filing_session_id
            ).all()

            logger.info(f"Found {len(docs)} total documents for filing {filing_session_id}")
            return docs

        except Exception as e:
            logger.error(f"Error fetching documents: {e}")
            return []

    def get_document_by_id(self, document_id: UUID) -> Optional[PendingDocument]:
        """
        Get a pending document by ID

        Args:
            document_id: The document UUID

        Returns:
            PendingDocument or None
        """
        try:
            doc = self.db.query(PendingDocument).filter(
                PendingDocument.id == document_id
            ).first()

            return doc

        except Exception as e:
            logger.error(f"Error fetching document {document_id}: {e}")
            return None

    def mark_as_uploaded(self, document_id: UUID, uploaded_document_id: str) -> Optional[PendingDocument]:
        """
        Mark a pending document as uploaded

        Args:
            document_id: The pending document UUID
            uploaded_document_id: The ID of the uploaded document in the documents table

        Returns:
            Updated PendingDocument or None
        """
        try:
            doc = self.get_document_by_id(document_id)
            if not doc:
                logger.warning(f"Document {document_id} not found")
                return None

            doc.mark_uploaded(uploaded_document_id)
            self.db.commit()

            logger.info(f"Marked document {document_id} as uploaded")
            return doc

        except Exception as e:
            logger.error(f"Error marking document as uploaded: {e}")
            self.db.rollback()
            return None

    def mark_as_verified(self, document_id: UUID) -> Optional[PendingDocument]:
        """
        Mark a document as verified (AI extraction successful)

        Args:
            document_id: The pending document UUID

        Returns:
            Updated PendingDocument or None
        """
        try:
            doc = self.get_document_by_id(document_id)
            if not doc:
                logger.warning(f"Document {document_id} not found")
                return None

            doc.mark_verified()
            self.db.commit()

            logger.info(f"Marked document {document_id} as verified")
            return doc

        except Exception as e:
            logger.error(f"Error marking document as verified: {e}")
            self.db.rollback()
            return None

    def mark_as_failed(self, document_id: UUID) -> Optional[PendingDocument]:
        """
        Mark a document processing as failed

        Args:
            document_id: The pending document UUID

        Returns:
            Updated PendingDocument or None
        """
        try:
            doc = self.get_document_by_id(document_id)
            if not doc:
                logger.warning(f"Document {document_id} not found")
                return None

            doc.mark_failed()
            self.db.commit()

            logger.info(f"Marked document {document_id} as failed")
            return doc

        except Exception as e:
            logger.error(f"Error marking document as failed: {e}")
            self.db.rollback()
            return None

    def delete_pending_document(self, document_id: UUID) -> bool:
        """
        Delete a pending document (when user marks as "not needed")

        Args:
            document_id: The pending document UUID

        Returns:
            True if deleted, False otherwise
        """
        try:
            doc = self.get_document_by_id(document_id)
            if not doc:
                logger.warning(f"Document {document_id} not found")
                return False

            self.db.delete(doc)
            self.db.commit()

            logger.info(f"Deleted pending document {document_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            self.db.rollback()
            return False

    def has_pending_documents(self, filing_session_id: str) -> bool:
        """
        Check if filing session has any pending documents

        Args:
            filing_session_id: The filing session ID

        Returns:
            True if there are pending documents, False otherwise
        """
        try:
            count = self.db.query(PendingDocument).filter(
                PendingDocument.filing_session_id == filing_session_id,
                PendingDocument.status == DocumentStatus.PENDING
            ).count()

            return count > 0

        except Exception as e:
            logger.error(f"Error checking pending documents: {e}")
            return False

    def get_pending_count(self, filing_session_id: str) -> int:
        """
        Get count of pending documents

        Args:
            filing_session_id: The filing session ID

        Returns:
            Number of pending documents
        """
        try:
            count = self.db.query(PendingDocument).filter(
                PendingDocument.filing_session_id == filing_session_id,
                PendingDocument.status == DocumentStatus.PENDING
            ).count()

            return count

        except Exception as e:
            logger.error(f"Error counting pending documents: {e}")
            return 0
