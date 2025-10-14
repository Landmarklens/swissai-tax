"""
AHV Number Validator

Swiss AHV (Alters- und Hinterlassenenversicherung) number validation.
Format: 756.XXXX.XXXX.XX (13 digits with dots)

The AHV number uses EAN-13 check digit algorithm for validation.
"""

import re
from typing import Tuple


class AHVValidationError(Exception):
    """Custom exception for AHV validation errors"""
    pass


def format_ahv_number(ahv: str) -> str:
    """
    Format AHV number with dots

    Args:
        ahv: AHV number with or without dots

    Returns:
        Formatted AHV number: 756.XXXX.XXXX.XX

    Example:
        >>> format_ahv_number("7561234567890")
        "756.1234.5678.90"
    """
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', ahv)

    if len(digits) != 13:
        raise AHVValidationError(f"AHV number must have exactly 13 digits, got {len(digits)}")

    # Format with dots: 756.XXXX.XXXX.XX
    return f"{digits[0:3]}.{digits[3:7]}.{digits[7:11]}.{digits[11:13]}"


def calculate_ean13_check_digit(digits: str) -> int:
    """
    Calculate EAN-13 check digit

    Algorithm:
    1. Multiply digits in odd positions (1st, 3rd, 5th...) by 1
    2. Multiply digits in even positions (2nd, 4th, 6th...) by 3
    3. Sum all results
    4. Check digit = 10 - (sum modulo 10), if result is 10 then 0

    Args:
        digits: First 12 digits of AHV number (without check digit)

    Returns:
        Check digit (0-9)

    Example:
        >>> calculate_ean13_check_digit("756123456789")
        0
    """
    if len(digits) != 12:
        raise ValueError("Need exactly 12 digits for check digit calculation")

    # Convert to list of integers
    digit_list = [int(d) for d in digits]

    # EAN-13: multiply odd positions (1-indexed) by 1, even by 3
    # In 0-indexed: even positions by 1, odd positions by 3
    total = sum(
        digit * (3 if i % 2 == 1 else 1)
        for i, digit in enumerate(digit_list)
    )

    # Calculate check digit
    check_digit = (10 - (total % 10)) % 10

    return check_digit


def validate_ahv_number(ahv: str, strict: bool = True) -> Tuple[bool, str]:
    """
    Validate Swiss AHV number

    Args:
        ahv: AHV number (with or without dots)
        strict: If True, raise exception on invalid. If False, return (False, error_message)

    Returns:
        Tuple of (is_valid, formatted_ahv_or_error_message)

    Raises:
        AHVValidationError: If strict=True and validation fails

    Example:
        >>> validate_ahv_number("756.1234.5678.97")
        (True, "756.1234.5678.97")

        >>> validate_ahv_number("756.1234.5678.90", strict=False)
        (False, "Invalid check digit: expected 7, got 0")
    """
    try:
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', ahv)

        # Check length
        if len(digits) != 13:
            error_msg = f"AHV number must have exactly 13 digits, got {len(digits)}"
            if strict:
                raise AHVValidationError(error_msg)
            return False, error_msg

        # Check country code (must be 756 for Switzerland)
        if not digits.startswith('756'):
            error_msg = f"AHV number must start with 756 (Switzerland), got {digits[0:3]}"
            if strict:
                raise AHVValidationError(error_msg)
            return False, error_msg

        # Validate check digit
        first_12_digits = digits[0:12]
        provided_check_digit = int(digits[12])
        expected_check_digit = calculate_ean13_check_digit(first_12_digits)

        if provided_check_digit != expected_check_digit:
            error_msg = f"Invalid check digit: expected {expected_check_digit}, got {provided_check_digit}"
            if strict:
                raise AHVValidationError(error_msg)
            return False, error_msg

        # Format and return
        formatted = format_ahv_number(digits)
        return True, formatted

    except AHVValidationError:
        raise
    except Exception as e:
        error_msg = f"Error validating AHV number: {str(e)}"
        if strict:
            raise AHVValidationError(error_msg)
        return False, error_msg


def is_valid_ahv_number(ahv: str) -> bool:
    """
    Check if AHV number is valid (convenience function)

    Args:
        ahv: AHV number (with or without dots)

    Returns:
        True if valid, False otherwise

    Example:
        >>> is_valid_ahv_number("756.1234.5678.97")
        True

        >>> is_valid_ahv_number("756.1234.5678.90")
        False
    """
    is_valid, _ = validate_ahv_number(ahv, strict=False)
    return is_valid


def generate_ahv_check_digit(ahv_without_check: str) -> str:
    """
    Generate complete AHV number with check digit

    Args:
        ahv_without_check: First 12 digits of AHV number (756.XXXX.XXXX or 756XXXXXXXX)

    Returns:
        Complete AHV number with check digit: 756.XXXX.XXXX.XX

    Example:
        >>> generate_ahv_check_digit("756.1234.5678")
        "756.1234.5678.97"

        >>> generate_ahv_check_digit("756123456789")
        "756.1234.5678.97"
    """
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', ahv_without_check)

    if len(digits) != 12:
        raise ValueError(f"Need exactly 12 digits, got {len(digits)}")

    if not digits.startswith('756'):
        raise ValueError(f"AHV number must start with 756 (Switzerland), got {digits[0:3]}")

    # Calculate check digit
    check_digit = calculate_ean13_check_digit(digits)

    # Format and return
    complete = digits + str(check_digit)
    return format_ahv_number(complete)


# Example valid AHV numbers for testing (with correct check digits)
VALID_TEST_AHV_NUMBERS = [
    "756.1234.5678.97",
    "756.9999.9999.91",
    "756.0000.0000.02",
    "756.1111.1111.13",
]


if __name__ == "__main__":
    # Test the validator
    print("Testing AHV Validator\n")

    # Test valid numbers
    print("Testing valid AHV numbers:")
    for ahv in VALID_TEST_AHV_NUMBERS:
        is_valid, result = validate_ahv_number(ahv, strict=False)
        print(f"  {ahv}: {is_valid} -> {result}")

    print("\nTesting invalid AHV numbers:")
    invalid_numbers = [
        ("756.1234.5678.90", "Wrong check digit"),
        ("755.1234.5678.97", "Wrong country code"),
        ("756.1234.567", "Too short"),
        ("756.1234.5678.900", "Too long"),
    ]

    for ahv, reason in invalid_numbers:
        is_valid, result = validate_ahv_number(ahv, strict=False)
        print(f"  {ahv} ({reason}): {is_valid} -> {result}")

    print("\nTesting check digit generation:")
    test_base = "756123456789"  # Fixed: need 12 digits
    generated = generate_ahv_check_digit(test_base)
    print(f"  {test_base} -> {generated}")

    print("\nTesting formatting:")
    test_inputs = [
        "7561234567897",
        "756-1234-5678-97",
        "756 1234 5678 97",
    ]
    for test_input in test_inputs:
        formatted = format_ahv_number(test_input)
        print(f"  {test_input} -> {formatted}")
