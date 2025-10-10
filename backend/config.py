import logging
from functools import lru_cache

import boto3
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)



class Settings(BaseSettings):
    # Stripe settings
    STRIPE_WEBHOOK_SECRET: str | None = Field(None)
    STRIPE_SECRET_KEY: str | None = Field(None)
    STRIPE_PUBLISHABLE_KEY: str | None = Field(None)

    # Stripe Price IDs for subscription plans
    STRIPE_PRICE_ANNUAL_FLEX: str | None = Field(None)  # CHF 129/year - cancel anytime
    STRIPE_PRICE_5_YEAR_LOCK: str | None = Field(None)  # CHF 89/year - 5 year commitment

    # Feature flag for Stripe subscriptions
    ENABLE_SUBSCRIPTIONS: bool = Field(False)

    # JWT settings
    # SECURITY: SECRET_KEY must be loaded from Parameter Store (/swissai/api/jwt-secret)
    # No default value to prevent using weak secrets in production
    SECRET_KEY: str | None = Field(default=None)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(360)  # 6 hours sliding window

    # Database settings
    # SECURITY: All database credentials must be loaded from Parameter Store (/swissai/db/*)
    # No default values to prevent using exposed credentials
    POSTGRES_USER: str | None = Field(default=None)
    POSTGRES_PASSWORD: str | None = Field(default=None)
    POSTGRES_HOST: str | None = Field(default=None)
    POSTGRES_PORT: str = Field("5432")
    POSTGRES_DB: str = Field("swissai_tax")

    # Google OAuth settings (optional for SwissAI Tax)
    GOOGLE_CLIENT_ID: str | None = Field(None)
    GOOGLE_CLIENT_SECRET: str | None = Field(None)
    GOOGLE_REDIRECT_URI: str | None = Field(None)

    # AWS settings
    AWS_ACCESS_KEY_ID: str | None = Field(None)
    AWS_SECRET_ACCESS_KEY: str | None = Field(None)
    AWS_REGION: str = Field("us-east-1")
    AWS_S3_BUCKET_NAME: str = Field("swissai-tax-documents-1758721021")

    # OTHER
    ENVIRONMENT: str = Field("production")  # Added for CORS debug middleware
    FRONTEND_URL: str = Field("https://swissai.tax")
    API_URL: str = Field("https://api.swissai.tax")

    # SENDGRID
    SENDGRID_API_KEY: str | None = Field(None)
    SENDER_EMAIL: str | None = Field(None)
    SENDGRID_TEMPLATE_ID: str | None = Field(None)

    # EMAILJS (deprecated - keeping for backward compatibility)
    EMAILJS_SERVICE_ID: str | None = Field(None)
    EMAILJS_PUBLIC_KEY: str | None = Field(None)
    EMAILJS_TEMPLATE_ID: str | None = Field(None)
    EMAILJS_RESET_TEMPLATE_ID: str | None = Field(None)
    EMAILJS_PRIVATE_KEY: str | None = Field(None)

    # AWS SES settings for email
    SES_SENDER_EMAIL: str | None = Field(None, description="Verified sender email address for SES")

    # Redis settings (optional - will work without Redis)
    REDIS_URL: str | None = Field(None, description="Redis URL for caching enrichments")

    OPENAI_API_KEY: str | None = Field(None)
    GOOGLE_MAPS_API_KEY: str | None = Field(None)

    USER_PDF_BUCKET_NAME: str | None = Field(default="property-app-user-documents")

    MEERSENS_API_KEY: str | None = Field(None)
    
    # Lambda settings for property analysis
    LAMBDA_FUNCTION_NAME: str | None = Field(
        default="homeai-property-matcher",
        description="Lambda function name for property image analysis and embedding generation"
    )
    IMAGE_ANALYSIS_API_KEY: str | None = Field(
        None,
        description="API key for Lambda image analysis authentication"
    )
    
    # AWS RDS settings for property messages
    AWS_RDS_HOST: str | None = Field(None, description="AWS RDS host for property messages")
    AWS_RDS_PORT: str | None = Field(None, description="AWS RDS port")
    AWS_RDS_DATABASE: str | None = Field(None, description="AWS RDS database name")
    AWS_RDS_USER: str | None = Field(None, description="AWS RDS username")
    AWS_RDS_PASSWORD: str | None = Field(None, description="AWS RDS password")

    model_config = SettingsConfigDict(
        case_sensitive=False,
        extra="ignore",
        env_file=".env",
    )
    
    def __init__(self, **kwargs):
        """Initialize settings, try Parameter Store first, fall back to env vars"""
        super().__init__(**kwargs)
        self._load_from_parameter_store()
        self._validate_critical_secrets()
    
    def _load_from_parameter_store(self):
        """Try to load values from AWS Parameter Store"""
        try:
            logger.info("Attempting to load configuration from Parameter Store...")
            ssm = boto3.client('ssm', region_name='us-east-1')

            # Map of Parameter Store paths to attribute names
            # Using /swissai-tax/ paths for SwissAI Tax specific credentials
            param_mappings = {
                '/swissai-tax/db/host': 'POSTGRES_HOST',
                '/swissai-tax/db/port': 'POSTGRES_PORT',
                '/swissai-tax/db/database': 'POSTGRES_DB',
                '/swissai-tax/db/username': 'POSTGRES_USER',
                '/swissai-tax/db/password': 'POSTGRES_PASSWORD',
                '/swissai-tax/api/jwt-secret': 'SECRET_KEY',
                '/swissai-tax/s3/documents-bucket': 'AWS_S3_BUCKET_NAME',
                '/swissai-tax/email/sender': 'SES_SENDER_EMAIL',
                '/swissai-tax/google/client-id': 'GOOGLE_CLIENT_ID',
                '/swissai-tax/google/client-secret': 'GOOGLE_CLIENT_SECRET',
                '/swissai-tax/google/redirect-uri': 'GOOGLE_REDIRECT_URI',
                '/swissai-tax/stripe/secret-key': 'STRIPE_SECRET_KEY',
                '/swissai-tax/stripe/publishable-key': 'STRIPE_PUBLISHABLE_KEY',
                '/swissai-tax/stripe/webhook-secret': 'STRIPE_WEBHOOK_SECRET',
                '/swissai-tax/stripe/price-annual-flex': 'STRIPE_PRICE_ANNUAL_FLEX',
                '/swissai-tax/stripe/price-5-year-lock': 'STRIPE_PRICE_5_YEAR_LOCK',
                '/swissai-tax/features/enable-subscriptions': 'ENABLE_SUBSCRIPTIONS',
                '/homeai/prod/AWS_REGION': 'AWS_REGION',
                '/homeai/prod/AWS_ACCESS_KEY_ID': 'AWS_ACCESS_KEY_ID',
                '/homeai/prod/AWS_SECRET_ACCESS_KEY': 'AWS_SECRET_ACCESS_KEY',
                '/homeai/prod/OPENAI_API_KEY': 'OPENAI_API_KEY',
                '/homeai/prod/SENDGRID_API_KEY': 'SENDGRID_API_KEY',
                '/homeai/prod/GOOGLE_MAPS_API_KEY': 'GOOGLE_MAPS_API_KEY',
            }


            # AWS SSM GetParameters has a limit of 10 parameters per request
            # Split into batches of 10
            param_names = list(param_mappings.keys())
            batch_size = 10
            all_parameters = []

            for i in range(0, len(param_names), batch_size):
                batch = param_names[i:i + batch_size]
                response = ssm.get_parameters(Names=batch, WithDecryption=True)
                all_parameters.extend(response.get('Parameters', []))

                invalid_params = response.get('InvalidParameters', [])
                if invalid_params:
                    logger.warning(f"Invalid parameters in batch: {invalid_params}")

            # Update settings with Parameter Store values
            loaded_params = []
            for param in all_parameters:
                attr_name = param_mappings.get(param['Name'])
                if attr_name:
                    setattr(self, attr_name, param['Value'])
                    loaded_params.append(f"{attr_name} <- {param['Name']}")

            logger.info(f"Successfully loaded {len(all_parameters)} parameters from Parameter Store")
            logger.info(f"Loaded parameters: {', '.join(loaded_params)}")
        except Exception as e:
            logger.error(f"Failed to load from Parameter Store: {e}", exc_info=True)
            logger.info("Falling back to environment variables")

    def _validate_critical_secrets(self):
        """Validate that critical secrets are present and secure"""
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY is required but not set. Configure Parameter Store:\n"
                "  - /swissai/api/jwt-secret\n"
                "Or set SECRET_KEY environment variable"
            )
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters for security")

    @property
    def STRIPE_PLAN_PRICES(self) -> dict[str, str]:
        """Map of plan types to Stripe Price IDs"""
        prices = {}
        if self.STRIPE_PRICE_ANNUAL_FLEX:
            prices['annual_flex'] = self.STRIPE_PRICE_ANNUAL_FLEX
        if self.STRIPE_PRICE_5_YEAR_LOCK:
            prices['5_year_lock'] = self.STRIPE_PRICE_5_YEAR_LOCK
        return prices

    @property
    def STRIPE_PRICE_TO_PLAN(self) -> dict[str, str]:
        """Reverse mapping: Stripe Price ID to plan type"""
        mapping = {}
        if self.STRIPE_PRICE_ANNUAL_FLEX:
            mapping[self.STRIPE_PRICE_ANNUAL_FLEX] = 'annual_flex'
        if self.STRIPE_PRICE_5_YEAR_LOCK:
            mapping[self.STRIPE_PRICE_5_YEAR_LOCK] = '5_year_lock'
        return mapping


settings = Settings()
