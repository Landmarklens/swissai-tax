"""Input validation utilities"""

import re
import uuid
from typing import Any, Optional

def validate_uuid(value: str) -> bool:
    """Validate if a string is a valid UUID"""
    try:
        uuid.UUID(value)
        return True
    except (ValueError, TypeError, AttributeError):
        return False

def validate_session_id(session_id: str) -> bool:
    """Validate session ID format"""
    if not session_id:
        return False
    return validate_uuid(session_id)

def sanitize_string(value: str, max_length: int = 255) -> str:
    """Sanitize string input to prevent injection attacks"""
    if not value:
        return ""

    # Remove any potential SQL injection characters
    sanitized = re.sub(r'[;\'"\\]', '', str(value))

    # Truncate to max length
    return sanitized[:max_length]

def validate_numeric(value: Any, min_val: Optional[float] = None,
                    max_val: Optional[float] = None) -> tuple[bool, Optional[float]]:
    """Validate and convert numeric input"""
    try:
        num_value = float(value)

        if min_val is not None and num_value < min_val:
            return False, None

        if max_val is not None and num_value > max_val:
            return False, None

        return True, num_value
    except (ValueError, TypeError):
        return False, None

def validate_tax_year(year: Any) -> bool:
    """Validate tax year"""
    try:
        year_int = int(year)
        return 2000 <= year_int <= 2030
    except (ValueError, TypeError):
        return False

def validate_canton_code(canton: str) -> bool:
    """Validate Swiss canton code"""
    valid_cantons = [
        'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
        'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
        'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'
    ]
    return canton in valid_cantons

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_file_extension(filename: str, allowed_extensions: list) -> bool:
    """Validate file extension"""
    if not filename:
        return False

    extension = filename.split('.')[-1].lower() if '.' in filename else ''
    return extension in allowed_extensions