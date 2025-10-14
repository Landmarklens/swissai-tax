"""File validation service with magic byte checking and security scanning"""

import os
import hashlib
import mimetypes
from pathlib import Path
from typing import BinaryIO, Optional, Tuple, Dict, List
import magic
from PIL import Image
import PyPDF2
import zipfile
import io
import logging

logger = logging.getLogger(__name__)


class FileValidationService:
    """Comprehensive file validation with security checks"""

    # Magic bytes for common file types
    MAGIC_BYTES = {
        'pdf': [b'%PDF'],
        'png': [b'\x89PNG\r\n\x1a\n'],
        'jpg': [b'\xff\xd8\xff'],
        'jpeg': [b'\xff\xd8\xff'],
        'gif': [b'GIF87a', b'GIF89a'],
        'bmp': [b'BM'],
        'docx': [b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'],
        'xlsx': [b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'],
        'zip': [b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08']
    }

    # Allowed MIME types for tax documents
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/bmp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    # Maximum file sizes by type (in bytes)
    MAX_FILE_SIZES = {
        'pdf': 10 * 1024 * 1024,      # 10MB
        'image': 5 * 1024 * 1024,      # 5MB
        'document': 10 * 1024 * 1024,  # 10MB
        'default': 10 * 1024 * 1024    # 10MB
    }

    # Dangerous file extensions that should never be allowed
    DANGEROUS_EXTENSIONS = {
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
        '.jar', '.app', '.deb', '.rpm', '.dmg', '.pkg', '.msi',
        '.sh', '.bash', '.ps1', '.psm1', '.dll', '.so', '.dylib',
        '.php', '.py', '.rb', '.pl', '.asp', '.aspx', '.jsp'
    }

    def __init__(self):
        """Initialize the file validation service"""
        try:
            # Initialize python-magic for MIME type detection
            self.magic = magic.Magic(mime=True)
            self.magic_buffer = magic.Magic()
        except Exception as e:
            logger.warning(f"python-magic not available, falling back to basic validation: {e}")
            self.magic = None
            self.magic_buffer = None

    async def validate_file(
        self,
        file_content: bytes,
        filename: str,
        expected_type: Optional[str] = None
    ) -> Tuple[bool, Optional[str], Dict]:
        """
        Comprehensive file validation

        Args:
            file_content: File content as bytes
            filename: Original filename
            expected_type: Expected file type (optional)

        Returns:
            Tuple of (is_valid, error_message, metadata)
        """
        metadata = {
            'filename': filename,
            'size': len(file_content),
            'hash': hashlib.sha256(file_content).hexdigest()
        }

        # Check file size
        is_valid, error = self._check_file_size(file_content, filename)
        if not is_valid:
            return False, error, metadata

        # Check dangerous extensions
        is_valid, error = self._check_dangerous_extension(filename)
        if not is_valid:
            return False, error, metadata

        # Check magic bytes
        is_valid, error, detected_type = self._check_magic_bytes(file_content, filename)
        if not is_valid:
            return False, error, metadata

        metadata['detected_type'] = detected_type

        # Check MIME type
        is_valid, error, mime_type = self._check_mime_type(file_content, filename)
        if not is_valid:
            return False, error, metadata

        metadata['mime_type'] = mime_type

        # Validate specific file types
        if detected_type == 'pdf':
            is_valid, error = await self._validate_pdf(file_content)
            if not is_valid:
                return False, error, metadata
        elif detected_type in ['png', 'jpg', 'jpeg', 'gif', 'bmp']:
            is_valid, error = await self._validate_image(file_content)
            if not is_valid:
                return False, error, metadata
        elif detected_type in ['docx', 'xlsx']:
            is_valid, error = await self._validate_office_document(file_content)
            if not is_valid:
                return False, error, metadata

        # Check for embedded executables or scripts
        is_valid, error = self._check_for_malicious_content(file_content)
        if not is_valid:
            return False, error, metadata

        # Check expected type if provided
        if expected_type and detected_type != expected_type:
            return False, f"Expected {expected_type} but got {detected_type}", metadata

        return True, None, metadata

    def _check_file_size(self, content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
        """Check if file size is within limits"""
        size = len(content)
        extension = Path(filename).suffix.lower()

        # Determine max size based on file type
        if extension == '.pdf':
            max_size = self.MAX_FILE_SIZES['pdf']
        elif extension in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']:
            max_size = self.MAX_FILE_SIZES['image']
        elif extension in ['.docx', '.xlsx']:
            max_size = self.MAX_FILE_SIZES['document']
        else:
            max_size = self.MAX_FILE_SIZES['default']

        if size > max_size:
            return False, f"File too large. Maximum size is {max_size / 1024 / 1024:.1f}MB"

        if size == 0:
            return False, "File is empty"

        return True, None

    def _check_dangerous_extension(self, filename: str) -> Tuple[bool, Optional[str]]:
        """Check for dangerous file extensions"""
        extension = Path(filename).suffix.lower()

        if extension in self.DANGEROUS_EXTENSIONS:
            return False, f"File type {extension} is not allowed for security reasons"

        return True, None

    def _check_magic_bytes(self, content: bytes, filename: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Check file magic bytes to verify actual file type"""
        if len(content) < 8:
            return False, "File too small to validate", None

        # Get expected type from extension
        extension = Path(filename).suffix.lower()[1:]  # Remove the dot

        # Check magic bytes
        detected_type = None
        for file_type, magic_list in self.MAGIC_BYTES.items():
            for magic_bytes in magic_list:
                if content.startswith(magic_bytes):
                    detected_type = file_type
                    break
            if detected_type:
                break

        if not detected_type:
            return False, "Unknown file type or corrupted file", None

        # For Office documents, both docx and xlsx start with PK (ZIP)
        if detected_type == 'zip' and extension in ['docx', 'xlsx']:
            detected_type = extension

        # Verify extension matches detected type
        if extension and extension != detected_type:
            # Allow jpg/jpeg interchangeability
            if not (extension in ['jpg', 'jpeg'] and detected_type in ['jpg', 'jpeg']):
                return False, f"File extension ({extension}) doesn't match actual type ({detected_type})", None

        return True, None, detected_type

    def _check_mime_type(self, content: bytes, filename: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Check MIME type using python-magic"""
        mime_type = None

        if self.magic:
            try:
                mime_type = self.magic.from_buffer(content)

                if mime_type not in self.ALLOWED_MIME_TYPES:
                    # Special case for Office documents
                    if mime_type == 'application/zip' and filename.endswith(('.docx', '.xlsx')):
                        mime_type = mimetypes.guess_type(filename)[0]
                    else:
                        return False, f"File type {mime_type} is not allowed", mime_type
            except Exception as e:
                logger.warning(f"MIME type detection failed: {e}")

        # Fallback to extension-based detection
        if not mime_type:
            mime_type = mimetypes.guess_type(filename)[0]

        return True, None, mime_type

    async def _validate_pdf(self, content: bytes) -> Tuple[bool, Optional[str]]:
        """Validate PDF file structure and content"""
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            # Check if PDF is encrypted (we don't want encrypted PDFs for processing)
            if pdf_reader.is_encrypted:
                return False, "Encrypted PDFs are not supported"

            # Check for suspicious JavaScript or embedded files
            if pdf_reader.metadata:
                # Check for JavaScript
                for page in pdf_reader.pages:
                    if '/JS' in str(page) or '/JavaScript' in str(page):
                        return False, "PDF contains JavaScript which is not allowed"

            # Check page count (reasonable limit)
            if len(pdf_reader.pages) > 100:
                return False, "PDF has too many pages (maximum 100)"

            return True, None

        except Exception as e:
            logger.error(f"PDF validation failed: {e}")
            return False, "Invalid or corrupted PDF file"

    async def _validate_image(self, content: bytes) -> Tuple[bool, Optional[str]]:
        """Validate image file"""
        try:
            img = Image.open(io.BytesIO(content))

            # Check image dimensions
            width, height = img.size
            if width > 10000 or height > 10000:
                return False, "Image dimensions too large (maximum 10000x10000)"

            # Check for reasonable aspect ratio
            if width > 0 and height > 0:
                aspect_ratio = max(width, height) / min(width, height)
                if aspect_ratio > 50:
                    return False, "Image has unusual aspect ratio"

            # Verify image can be loaded (checks for corruption)
            img.verify()

            return True, None

        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            return False, "Invalid or corrupted image file"

    async def _validate_office_document(self, content: bytes) -> Tuple[bool, Optional[str]]:
        """Validate Office documents (docx, xlsx)"""
        try:
            # Office documents are ZIP files
            zip_file = io.BytesIO(content)

            with zipfile.ZipFile(zip_file, 'r') as z:
                # Check for suspicious files
                for filename in z.namelist():
                    # Check for executable files
                    if any(filename.endswith(ext) for ext in self.DANGEROUS_EXTENSIONS):
                        return False, "Document contains executable files"

                    # Check for files outside expected structure
                    if filename.startswith('/') or '..' in filename:
                        return False, "Document contains suspicious file paths"

                # Check file count (prevent zip bombs)
                if len(z.namelist()) > 1000:
                    return False, "Document contains too many files"

                # Check compression ratio (prevent zip bombs)
                compressed_size = sum(info.compress_size for info in z.filelist)
                uncompressed_size = sum(info.file_size for info in z.filelist)

                if uncompressed_size > 0:
                    ratio = uncompressed_size / compressed_size
                    if ratio > 100:
                        return False, "Document has suspicious compression ratio"

            return True, None

        except zipfile.BadZipFile:
            return False, "Invalid Office document format"
        except Exception as e:
            logger.error(f"Office document validation failed: {e}")
            return False, "Invalid or corrupted Office document"

    def _check_for_malicious_content(self, content: bytes) -> Tuple[bool, Optional[str]]:
        """Check for embedded malicious content patterns"""

        # Convert to string for pattern matching
        try:
            content_str = content.decode('utf-8', errors='ignore').lower()
        except:
            # Binary file, check raw bytes
            content_str = str(content).lower()

        # Check for suspicious patterns
        suspicious_patterns = [
            b'<script',
            b'javascript:',
            b'vbscript:',
            b'onload=',
            b'onerror=',
            b'onclick=',
            b'<iframe',
            b'<embed',
            b'<object',
            b'eval(',
            b'exec(',
            b'system(',
            b'shell_exec(',
            b'passthru(',
            b'base64_decode(',
            b'cmd.exe',
            b'powershell',
            b'/bin/sh',
            b'/bin/bash'
        ]

        for pattern in suspicious_patterns:
            if pattern in content[:100000]:  # Check first 100KB
                return False, f"File contains suspicious content pattern"

        return True, None

    def calculate_file_hash(self, content: bytes) -> str:
        """Calculate SHA-256 hash of file content"""
        return hashlib.sha256(content).hexdigest()

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal and other attacks"""

        # Remove path components
        filename = os.path.basename(filename)

        # Remove potentially dangerous characters
        dangerous_chars = ['/', '\\', '..', '~', '$', '`', '|', '>', '<', '&', ';', ':', '*', '?', '"', "'"]
        for char in dangerous_chars:
            filename = filename.replace(char, '_')

        # Limit filename length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]

        # Ensure extension is lowercase
        ext = ext.lower()

        return f"{name}{ext}"