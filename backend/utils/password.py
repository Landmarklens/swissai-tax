import bcrypt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The bcrypt hashed password to check against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    # Ensure inputs are strings
    if not isinstance(plain_password, str) or not isinstance(hashed_password, str):
        return False
    
    try:
        # Convert to bytes for bcrypt
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # Check if this is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
        if not hashed_password.startswith(('$2a$', '$2b$', '$2y$')):
            return False
            
        # Verify the password
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        # Handle any bcrypt errors (invalid hash format, etc.)
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        str: The bcrypt hashed password
    """
    # Convert to bytes
    password_bytes = password.encode('utf-8')
    
    # Generate salt and hash password
    # Using 12 rounds (default) for good security/performance balance
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Return as string
    return hashed.decode('utf-8')
