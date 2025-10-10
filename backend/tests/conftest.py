"""
Pytest configuration and fixtures for backend tests.
Provides mocked database, common test fixtures, and utilities.
"""
import pytest
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch
from fastapi.testclient import TestClient

# Import main app
from main import app

# Import models for mocking
from models.swisstax import User


# ============================================================================
# DATABASE MOCKING FIXTURES
# ============================================================================

@pytest.fixture
def mock_db_session():
    """
    Create a mocked database session.
    Use this instead of real database connections.
    """
    mock_session = MagicMock()
    mock_session.query = MagicMock()
    mock_session.add = MagicMock()
    mock_session.commit = MagicMock()
    mock_session.rollback = MagicMock()
    mock_session.close = MagicMock()
    mock_session.refresh = MagicMock()
    mock_session.delete = MagicMock()
    mock_session.flush = MagicMock()
    mock_session.execute = MagicMock()
    mock_session.scalar = MagicMock()
    return mock_session


@pytest.fixture
def mock_get_db(mock_db_session):
    """
    Mock the get_db dependency.
    Returns a function that yields the mocked session.
    """
    def _mock_get_db():
        yield mock_db_session
    return _mock_get_db


# ============================================================================
# USER FIXTURES
# ============================================================================

@pytest.fixture
def mock_user():
    """Create a basic mock user without 2FA."""
    import uuid
    user = Mock(spec=User)
    user.id = uuid.uuid4()  # UUID object, not string
    user.email = "test@example.com"
    user.password = "$2b$12$hashed_password"
    user.first_name = "Test"
    user.last_name = "User"
    user.phone = "+41791234567"
    user.address = "Test Street 1"
    user.postal_code = "8001"
    user.canton = "ZH"
    user.municipality = "Zürich"
    user.preferred_language = "en"
    user.avatar_url = None
    user.is_active = True
    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.two_factor_backup_codes = None
    user.two_factor_verified_at = None
    user.last_login = None
    user.created_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    return user


@pytest.fixture
def mock_user_with_2fa():
    """Create a mock user with 2FA enabled."""
    import uuid
    user = Mock(spec=User)
    user.id = uuid.uuid4()  # UUID object, not string
    user.email = "2fa@example.com"
    user.password = "$2b$12$hashed_password"
    user.first_name = "TwoFactor"
    user.last_name = "User"
    user.phone = "+41791234568"
    user.address = "Test Street 2"
    user.postal_code = "8002"
    user.canton = "ZH"
    user.municipality = "Zürich"
    user.preferred_language = "en"
    user.avatar_url = None
    user.is_active = True
    user.two_factor_enabled = True
    user.two_factor_secret = "encrypted_secret_data"
    user.two_factor_backup_codes = "encrypted_backup_codes"
    user.two_factor_verified_at = datetime.utcnow()
    user.last_login = None
    user.created_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    return user


@pytest.fixture
def mock_admin_user():
    """Create a mock admin user."""
    import uuid
    user = Mock(spec=User)
    user.id = uuid.uuid4()  # UUID object, not string
    user.email = "admin@example.com"
    user.password = "$2b$12$hashed_password"
    user.first_name = "Admin"
    user.last_name = "User"
    user.phone = "+41791234569"
    user.address = "Admin Street 1"
    user.postal_code = "8003"
    user.canton = "ZH"
    user.municipality = "Zürich"
    user.preferred_language = "en"
    user.avatar_url = None
    user.is_active = True
    user.two_factor_enabled = True
    user.two_factor_secret = "encrypted_secret"
    user.two_factor_backup_codes = "encrypted_codes"
    user.two_factor_verified_at = datetime.utcnow()
    user.last_login = datetime.utcnow()
    user.is_admin = True
    user.created_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    return user


# ============================================================================
# TEST CLIENT FIXTURES
# ============================================================================

@pytest.fixture
def client():
    """
    Create a test client for the FastAPI app.
    NOTE: This uses the real app but should have DB dependencies mocked.
    """
    return TestClient(app)


@pytest.fixture
def authenticated_client(client, mock_user):
    """
    Create a test client with authentication headers.
    """
    # Create a mock JWT token
    token = "mock_jwt_token_for_testing"
    client.headers = {
        "Authorization": f"Bearer {token}"
    }
    return client


@pytest.fixture
def authenticated_client_no_2fa(client, mock_user):
    """
    Create a test client with authentication for a user without 2FA enabled.
    Overrides get_current_user to return the mock_user.
    """
    from core.security import get_current_user

    def mock_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = mock_get_current_user
    return client


@pytest.fixture
def authenticated_client_with_2fa(client, mock_user_with_2fa):
    """
    Create a test client with authentication for a user with 2FA enabled.
    Overrides get_current_user to return the mock_user_with_2fa.
    """
    from core.security import get_current_user

    def mock_get_current_user():
        return mock_user_with_2fa

    app.dependency_overrides[get_current_user] = mock_get_current_user
    return client


# ============================================================================
# COMMON MOCKING FIXTURES
# ============================================================================

@pytest.fixture
def mock_get_current_user(mock_user):
    """
    Mock the get_current_user dependency.
    Returns a function that returns the mock user.
    """
    def _mock_get_current_user():
        return mock_user
    return _mock_get_current_user


@pytest.fixture
def mock_encryption_service():
    """Mock the encryption service."""
    mock_service = MagicMock()
    mock_service.encrypt.return_value = "encrypted_data"
    mock_service.decrypt.return_value = "decrypted_data"
    mock_service.hash_sensitive_data.return_value = "hashed_data"
    mock_service.verify_hashed_data.return_value = True
    mock_service.generate_secure_token.return_value = "secure_token"
    return mock_service


@pytest.fixture
def mock_two_factor_service():
    """Mock the two-factor authentication service."""
    mock_service = MagicMock()
    mock_service.generate_secret.return_value = "JBSWY3DPEHPK3PXP"
    mock_service.encrypt_secret.return_value = "encrypted_secret"
    mock_service.decrypt_secret.return_value = "JBSWY3DPEHPK3PXP"
    mock_service.generate_qr_code.return_value = "data:image/png;base64,..."
    mock_service.verify_totp.return_value = True
    mock_service.generate_backup_codes.return_value = ["CODE1", "CODE2", "CODE3"]
    mock_service.encrypt_backup_codes.return_value = "encrypted_codes"
    mock_service.verify_backup_code.return_value = True
    mock_service.get_remaining_backup_codes_count.return_value = 5
    return mock_service


@pytest.fixture
def mock_email_service():
    """Mock the email service."""
    mock_service = MagicMock()
    mock_service.send_email.return_value = True
    mock_service.send_password_reset_email.return_value = True
    mock_service.send_verification_email.return_value = True
    return mock_service


@pytest.fixture
def mock_s3_service():
    """Mock the S3 storage service."""
    mock_service = MagicMock()
    mock_service.upload_file.return_value = "https://s3.amazonaws.com/bucket/file.pdf"
    mock_service.download_file.return_value = b"file_contents"
    mock_service.delete_file.return_value = True
    mock_service.generate_presigned_url.return_value = "https://presigned-url.com"
    return mock_service


@pytest.fixture
def mock_stripe_service():
    """Mock the Stripe payment service."""
    mock_service = MagicMock()
    mock_service.create_customer.return_value = {"id": "cus_123"}
    mock_service.create_subscription.return_value = {"id": "sub_123", "status": "active"}
    mock_service.cancel_subscription.return_value = {"status": "canceled"}
    return mock_service


# ============================================================================
# TAX FILING FIXTURES
# ============================================================================

@pytest.fixture
def sample_tax_filing_data():
    """Sample tax filing data for testing."""
    return {
        "user_id": 1,
        "tax_year": 2024,
        "canton": "ZH",
        "municipality": "Zurich",
        "income_employment": 100000,
        "income_self_employment": 0,
        "income_investment": 5000,
        "income_rental": 0,
        "income_other": 0,
        "deductions_professional": 2000,
        "deductions_insurance": 3000,
        "deductions_pillar3a": 7056,
        "deductions_other": 0,
        "marital_status": "single",
        "num_children": 0,
        "church_member": False
    }


@pytest.fixture
def sample_tax_calculation_result():
    """Sample tax calculation result."""
    return {
        "gross_income": 105000,
        "total_deductions": 12056,
        "taxable_income": 92944,
        "federal_tax": 3500,
        "cantonal_tax": 8000,
        "municipal_tax": 2000,
        "church_tax": 0,
        "total_tax": 13500,
        "effective_rate": 12.86
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_mock_query_result(return_value):
    """
    Helper to create a mock query that returns a specific value.

    Usage:
        mock_db.query.return_value = create_mock_query_result(mock_user)
    """
    mock_query = MagicMock()
    mock_query.filter.return_value = mock_query
    mock_query.filter_by.return_value = mock_query
    mock_query.first.return_value = return_value
    mock_query.all.return_value = [return_value] if return_value else []
    mock_query.one.return_value = return_value
    mock_query.one_or_none.return_value = return_value
    mock_query.count.return_value = 1 if return_value else 0
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.offset.return_value = mock_query
    return mock_query


def override_get_current_user(user):
    """
    Helper to override get_current_user dependency with a specific user.

    Usage in tests:
        override_get_current_user(mock_user)
        response = client.post("/api/2fa/setup/init")
    """
    from core.security import get_current_user

    def mock_get_current_user_func():
        return user

    app.dependency_overrides[get_current_user] = mock_get_current_user_func
    return mock_get_current_user_func


# ============================================================================
# AUTO-USE FIXTURES (Applied to all tests)
# ============================================================================

@pytest.fixture(autouse=True)
def reset_app_dependency_overrides():
    """
    Reset FastAPI dependency overrides after each test.
    This ensures tests don't interfere with each other.
    """
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def mock_database_for_all_tests(mock_db_session, monkeypatch):
    """
    Automatically mock database for ALL tests to prevent real DB connections.
    This fixture is applied to every test automatically.
    """
    from db.session import get_db

    def mock_get_db_generator():
        yield mock_db_session

    # Override the get_db dependency
    app.dependency_overrides[get_db] = mock_get_db_generator

    yield

    # Cleanup
    if get_db in app.dependency_overrides:
        del app.dependency_overrides[get_db]


# ============================================================================
# PYTEST CONFIGURATION
# ============================================================================

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "auth: authentication related tests"
    )
    config.addinivalue_line(
        "markers", "tax: tax calculation related tests"
    )
    config.addinivalue_line(
        "markers", "pdf: PDF generation related tests"
    )
    config.addinivalue_line(
        "markers", "2fa: two-factor authentication tests"
    )
