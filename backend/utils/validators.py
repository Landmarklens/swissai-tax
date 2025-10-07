"""
Backend Validation Utilities
Provides server-side validation for all inputs to ensure data integrity
"""

import re
import uuid
from typing import Any, Optional, Tuple
from fastapi import HTTPException

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


# ====================
# Enhanced Validation Functions with Error Messages
# ====================

def validate_email_detailed(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email format with detailed error messages

    Args:
        email: Email address to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email or len(email) > 255:
        return False, "Email must be between 1 and 255 characters"

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"

    return True, None


def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password strength

    Requirements:
    - At least 8 characters
    - Contains lowercase letter
    - Contains uppercase letter
    - Contains number
    - Contains special character

    Args:
        password: Password to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"

    if len(password) < 8:
        return False, "Password must be at least 8 characters"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"

    if not re.search(r'[^a-zA-Z0-9]', password):
        return False, "Password must contain at least one special character"

    return True, None


def validate_ahv(ahv: str) -> Tuple[bool, Optional[str]]:
    """
    Validate Swiss AHV/AVS number (756.XXXX.XXXX.XX)
    Includes EAN-13 checksum validation

    Args:
        ahv: AHV number to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not ahv:
        return False, "AHV number is required"

    # Check format
    pattern = r'^756\.\d{4}\.\d{4}\.\d{2}$'
    if not re.match(pattern, ahv):
        return False, "Invalid AHV format (expected: 756.XXXX.XXXX.XX)"

    # Remove dots and validate checksum
    digits = ahv.replace('.', '')

    if len(digits) != 13:
        return False, "AHV number must contain exactly 13 digits"

    # EAN-13 checksum validation
    try:
        sum_val = 0
        for i in range(12):
            digit = int(digits[i])
            sum_val += digit if i % 2 == 0 else digit * 3

        checksum = (10 - (sum_val % 10)) % 10

        if checksum != int(digits[12]):
            return False, "Invalid AHV checksum"
    except (ValueError, IndexError):
        return False, "Invalid AHV number format"

    return True, None


def validate_swiss_phone(phone: str) -> Tuple[bool, Optional[str]]:
    """
    Validate Swiss phone number
    Supports formats: +41791234567, 0041791234567, 0791234567

    Args:
        phone: Phone number to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not phone:
        return False, "Phone number is required"

    pattern = r'^(\+41|0041|0)[1-9]\d{8}$'
    if not re.match(pattern, phone):
        return False, "Invalid Swiss phone number format"

    return True, None


def validate_swiss_postal_code(postal_code: str) -> Tuple[bool, Optional[str]]:
    """
    Validate Swiss postal code (4 digits)

    Args:
        postal_code: Postal code to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not postal_code:
        return False, "Postal code is required"

    pattern = r'^\d{4}$'
    if not re.match(pattern, postal_code):
        return False, "Postal code must be exactly 4 digits"

    return True, None


def validate_swiss_iban(iban: str) -> Tuple[bool, Optional[str]]:
    """
    Validate Swiss IBAN
    Format: CH## ##### ############ (21 characters)

    Args:
        iban: IBAN to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not iban:
        return False, "IBAN is required"

    # Remove spaces for validation
    iban_clean = iban.replace(' ', '')

    pattern = r'^CH\d{2}[0-9]{5}[A-Z0-9]{12}$'
    if not re.match(pattern, iban_clean):
        return False, "Invalid Swiss IBAN format"

    return True, None


def validate_name(name: str, field_name: str = "Name") -> Tuple[bool, Optional[str]]:
    """
    Validate person name

    Args:
        name: Name to validate
        field_name: Name of the field for error messages

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name:
        return False, f"{field_name} is required"

    name = name.strip()

    if len(name) < 2:
        return False, f"{field_name} must be at least 2 characters"

    if len(name) > 50:
        return False, f"{field_name} cannot exceed 50 characters"

    # Allow letters (including accented), spaces, hyphens, and apostrophes
    pattern = r'^[a-zA-ZÀ-ÿ\s\'-]+$'
    if not re.match(pattern, name):
        return False, f"{field_name} can only contain letters, spaces, hyphens, and apostrophes"

    return True, None


def validate_tax_amount(amount: float, field_name: str = "Amount") -> Tuple[bool, Optional[str]]:
    """
    Validate tax amount

    Args:
        amount: Amount to validate
        field_name: Name of the field for error messages

    Returns:
        Tuple of (is_valid, error_message)
    """
    if amount is None:
        return False, f"{field_name} is required"

    if amount <= 0:
        return False, f"{field_name} must be positive"

    if amount > 10_000_000:
        return False, f"{field_name} cannot exceed 10,000,000"

    return True, None


def validate_or_raise(is_valid: bool, error_message: Optional[str], status_code: int = 400):
    """
    Helper to raise HTTPException if validation fails

    Args:
        is_valid: Validation result
        error_message: Error message if validation failed
        status_code: HTTP status code for the exception

    Raises:
        HTTPException: If validation failed
    """
    if not is_valid:
        raise HTTPException(status_code=status_code, detail=error_message)


# Convenience functions that raise exceptions directly
def validate_email_or_raise(email: str):
    """Validate email and raise exception if invalid"""
    is_valid, error = validate_email_detailed(email)
    validate_or_raise(is_valid, error)


def validate_password_or_raise(password: str):
    """Validate password and raise exception if invalid"""
    is_valid, error = validate_password(password)
    validate_or_raise(is_valid, error)


def validate_ahv_or_raise(ahv: str):
    """Validate AHV and raise exception if invalid"""
    is_valid, error = validate_ahv(ahv)
    validate_or_raise(is_valid, error)


def validate_canton_or_raise(canton: str):
    """Validate canton and raise exception if invalid"""
    if not validate_canton_code(canton):
        raise HTTPException(status_code=400, detail=f"Invalid canton code: {canton}")


def validate_tax_year_or_raise(year: int):
    """Validate tax year and raise exception if invalid"""
    if not validate_tax_year(year):
        raise HTTPException(status_code=400, detail=f"Invalid tax year: {year}")