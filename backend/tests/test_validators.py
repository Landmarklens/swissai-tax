"""Tests for input validators"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.validators import (
    validate_uuid,
    validate_session_id,
    sanitize_string,
    validate_numeric,
    validate_tax_year,
    validate_canton_code,
    validate_email
)

def test_validate_uuid():
    """Test UUID validation"""
    # Valid UUIDs
    assert validate_uuid('550e8400-e29b-41d4-a716-446655440000') == True
    assert validate_uuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8') == True

    # Invalid UUIDs
    assert validate_uuid('not-a-uuid') == False
    assert validate_uuid('') == False
    assert validate_uuid(None) == False
    assert validate_uuid(12345) == False

def test_validate_session_id():
    """Test session ID validation"""
    assert validate_session_id('550e8400-e29b-41d4-a716-446655440000') == True
    assert validate_session_id('invalid') == False
    assert validate_session_id('') == False

def test_sanitize_string():
    """Test string sanitization"""
    assert sanitize_string("normal text") == "normal text"
    assert sanitize_string("text; DROP TABLE users;") == "text DROP TABLE users"
    assert sanitize_string("text' OR '1'='1") == "text OR 11"
    assert sanitize_string("a" * 300) == "a" * 255  # Max length
    assert sanitize_string(None) == ""

def test_validate_numeric():
    """Test numeric validation"""
    # Valid numbers
    valid, num = validate_numeric(42)
    assert valid == True and num == 42.0

    valid, num = validate_numeric("3.14")
    assert valid == True and num == 3.14

    # With bounds
    valid, num = validate_numeric(50, min_val=0, max_val=100)
    assert valid == True and num == 50.0

    valid, num = validate_numeric(150, min_val=0, max_val=100)
    assert valid == False

    # Invalid inputs
    valid, num = validate_numeric("not a number")
    assert valid == False

def test_validate_tax_year():
    """Test tax year validation"""
    assert validate_tax_year(2024) == True
    assert validate_tax_year("2023") == True
    assert validate_tax_year(1999) == False
    assert validate_tax_year(2031) == False
    assert validate_tax_year("invalid") == False

def test_validate_canton_code():
    """Test canton code validation"""
    # Valid canton codes
    assert validate_canton_code('ZH') == True
    assert validate_canton_code('GE') == True
    assert validate_canton_code('TI') == True

    # Invalid codes
    assert validate_canton_code('XX') == False
    assert validate_canton_code('') == False
    assert validate_canton_code('zurich') == False

def test_validate_email():
    """Test email validation"""
    assert validate_email('user@example.com') == True
    assert validate_email('test.user+tag@domain.co.uk') == True
    assert validate_email('invalid@') == False
    assert validate_email('@invalid.com') == False
    assert validate_email('no-at-sign') == False

if __name__ == '__main__':
    # Run all tests
    test_validate_uuid()
    test_validate_session_id()
    test_sanitize_string()
    test_validate_numeric()
    test_validate_tax_year()
    test_validate_canton_code()
    test_validate_email()
    print("✅ All validator tests passed!")