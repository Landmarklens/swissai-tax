from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import boto3
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)



class Settings(BaseSettings):
    # Stripe settings (optional for SwissAI Tax)
    STRIPE_WEBHOOK_SECRET: str | None = Field(None)
    STRIPE_SECRET_KEY: str | None = Field(None)
    STRIPE_PUBLISHABLE_KEY: str | None = Field(None)
    STRIPE_MONTHLY: str | None = Field(None)

    # JWT settings
    SECRET_KEY: str = Field("your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(30)

    # Database settings
    POSTGRES_USER: str = Field("webscrapinguser")
    POSTGRES_PASSWORD: str = Field("IXq3IC0Uw6StMkBhb4mb")
    POSTGRES_HOST: str = Field("webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com")
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

    # EMAILJS
    EMAILJS_SERVICE_ID: str | None = Field(None)
    EMAILJS_PUBLIC_KEY: str | None = Field(None)
    EMAILJS_TEMPLATE_ID: str | None = Field(None)
    EMAILJS_RESET_TEMPLATE_ID: str | None = Field(None)
    EMAILJS_PRIVATE_KEY: str | None = Field(None)
    
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
    
    def _load_from_parameter_store(self):
        """Try to load values from AWS Parameter Store"""
        try:
            ssm = boto3.client('ssm', region_name='us-east-1')

            # Map of Parameter Store paths to attribute names
            param_mappings = {
                '/homeai/db/host': 'POSTGRES_HOST',
                '/homeai/db/port': 'POSTGRES_PORT',
                '/swissai/db/name': 'POSTGRES_DB',  # Use swissai_tax_db
                '/homeai/db/user': 'POSTGRES_USER',
                '/homeai/db/password': 'POSTGRES_PASSWORD',
                '/homeai/api/jwt-secret': 'SECRET_KEY',
                '/homeai/aws/region': 'AWS_REGION',
                '/homeai/aws/s3-bucket': 'AWS_S3_BUCKET_NAME',
                '/homeai/aws/access-key-id': 'AWS_ACCESS_KEY_ID',
                '/homeai/aws/secret-access-key': 'AWS_SECRET_ACCESS_KEY',
                '/homeai/prod/OPENAI_API_KEY': 'OPENAI_API_KEY',
                '/homeai/sendgrid/api-key': 'SENDGRID_API_KEY',
                '/homeai/prod/GOOGLE_MAPS_API_KEY': 'GOOGLE_MAPS_API_KEY',
            }

            # Since /homeai/db/ parameters point to the RDS database (webscraping-database),
            # we also map them to AWS_RDS_* settings for the property_messages endpoint
            rds_mappings = {
                '/homeai/db/host': 'AWS_RDS_HOST',
                '/homeai/db/port': 'AWS_RDS_PORT',
                '/homeai/db/name': 'AWS_RDS_DATABASE',
                '/homeai/db/user': 'AWS_RDS_USER',
                '/homeai/db/password': 'AWS_RDS_PASSWORD',
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

            # Update settings with Parameter Store values
            for param in all_parameters:
                attr_name = param_mappings.get(param['Name'])
                if attr_name:
                    setattr(self, attr_name, param['Value'])

                # Also set RDS parameters
                rds_attr_name = rds_mappings.get(param['Name'])
                if rds_attr_name:
                    setattr(self, rds_attr_name, param['Value'])

            logger.info(f"Loaded {len(all_parameters)} parameters from Parameter Store")
        except Exception as e:
            logger.info(f"Using environment variables (Parameter Store not available: {e})")

    @property
    def STRIPE_PRODUCT_IDS(self) -> dict[str, str]:
        from schemas.subscription import SubscriptionPlan

        return {
            SubscriptionPlan.FREE: self.STRIPE_MONTHLY,
            SubscriptionPlan.MONTHLY: self.STRIPE_MONTHLY,
        }

    @property
    def STRIPE_PRODUCT_PLANS(self):
        from schemas.subscription import SubscriptionPlan

        plans = {
            self.STRIPE_MONTHLY: SubscriptionPlan.MONTHLY,
        }
        return plans


settings = Settings()
