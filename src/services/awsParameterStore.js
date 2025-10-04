// AWS Parameter Store Service
// Fetches configuration and secrets from AWS Systems Manager Parameter Store
import logger from './loggingService';

class AWSParameterStoreService {
  constructor() {
    this.parameters = {};
    this.initialized = false;
    this.initPromise = null;
    
    // Parameter Store configuration
    this.PARAMETER_NAMESPACE = '/swissai/';
    this.API_ENDPOINT = process.env.REACT_APP_PARAMETER_STORE_API || 'https://api.swissai.tax/api/config';
    
    // Cache duration (5 minutes)
    this.CACHE_DURATION = 5 * 60 * 1000;
    this.lastFetch = null;
  }

  // Initialize and load all parameters
  async initialize() {
    logger.debug('PARAM_STORE', 'Initialize called');
    
    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      logger.debug('PARAM_STORE', 'Returning existing initialization promise');
      return this.initPromise;
    }

    // Return cached if still valid
    if (this.initialized && this.lastFetch && 
        (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
      const cacheAge = Math.round((Date.now() - this.lastFetch) / 1000);
      logger.debug('PARAM_STORE', `Returning cached parameters (age: ${cacheAge}s)`);
      return this.parameters;
    }

    logger.info('PARAM_STORE', 'Loading parameters from store');
    this.initPromise = this._loadParameters();
    
    try {
      await this.initPromise;
      this.initialized = true;
      this.lastFetch = Date.now();
      logger.info('PARAM_STORE', 'Parameters loaded successfully', {
        paramCount: Object.keys(this.parameters).length,
        hasAWSCreds: !!this.parameters.AWS_ACCESS_KEY_ID,
        sesEnabled: this.parameters.ENABLE_SES,
        s3Enabled: this.parameters.ENABLE_S3
      });
    } catch (error) {
      logger.error('PARAM_STORE', 'Failed to initialize parameters', error);
      throw error;
    } finally {
      this.initPromise = null;
    }

    return this.parameters;
  }

  // Load parameters from backend API
  async _loadParameters() {
    try {
      // Skip parameter loading if endpoint doesn't exist (405 error)
      // The backend /api/config endpoint is not implemented yet
      // Using fallback values instead
      
      // Try to fetch, but handle 405 gracefully
      const response = await fetch(this.API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (response.status === 405) {
        // Endpoint not implemented, use fallback values
        logger.info('PARAM_STORE', 'API endpoint not implemented (405), using fallback values');
        this.parameters = this.getDefaultParameters();
        return this.parameters;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch parameters: ${response.status}`);
      }

      const data = await response.json();
      
      // Store parameters
      this.parameters = {
        // AWS Configuration
        AWS_REGION: data.aws_region || data['/swissai/aws/region'] || 'us-east-1',
        AWS_ACCESS_KEY_ID: data.aws_access_key_id || data['/swissai/aws/access_key_id'],
        AWS_SECRET_ACCESS_KEY: data.aws_secret_access_key || data['/swissai/aws/secret_access_key'],

        // SES Configuration
        SES_FROM_EMAIL: data.ses_from_email || data['/swissai/ses/from_email'] || 'noreply@swissai.tax',
        SES_REGION: data.ses_region || data['/swissai/ses/region'] || 'us-east-1',

        // S3 Configuration
        S3_BUCKET_NAME: data.s3_bucket_name || data['/swissai/s3/bucket_name'] || 'swissai-tax-documents',
        S3_REGION: data.s3_region || data['/swissai/s3/region'] || 'us-east-1',
        S3_TEMPLATE_PATH: data.s3_template_path || data['/swissai/s3/template_path'] || 'templates/',

        // API Configuration
        API_BASE_URL: data.api_base_url || data['/swissai/api/base_url'] || 'https://api.swissai.tax',

        // Feature Flags
        ENABLE_SES: data.enable_ses || data['/swissai/features/enable_ses'] || false,
        ENABLE_S3: data.enable_s3 || data['/swissai/features/enable_s3'] || false,

        // Security
        JWT_SECRET: data.jwt_secret || data['/swissai/security/jwt_secret'],
        ENCRYPTION_KEY: data.encryption_key || data['/swissai/security/encryption_key']
      };

      console.log('Parameters loaded from Parameter Store');
      return this.parameters;
      
    } catch (error) {
      console.error('Failed to load parameters from Parameter Store:', error);
      
      // Fallback to environment variables or defaults
      this.parameters = this.getDefaultParameters();
      return this.parameters;
    }
  }

  // Get auth token for API calls
  getAuthToken() {
    // Get token from auth service or localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.access_token || '';
  }

  // Default parameters for development/fallback
  getDefaultParameters() {
    return {
      // Use environment variables as fallback
      AWS_REGION: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      AWS_ACCESS_KEY_ID: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
      AWS_SECRET_ACCESS_KEY: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
      
      SES_FROM_EMAIL: process.env.REACT_APP_SES_FROM_EMAIL || 'noreply@swissai.tax',
      SES_REGION: process.env.REACT_APP_SES_REGION || 'us-east-1',

      S3_BUCKET_NAME: process.env.REACT_APP_S3_BUCKET || 'swissai-tax-documents',
      S3_REGION: process.env.REACT_APP_S3_REGION || 'us-east-1',
      S3_TEMPLATE_PATH: 'templates/',

      API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.swissai.tax',
      
      ENABLE_SES: false,
      ENABLE_S3: false,
      
      JWT_SECRET: '',
      ENCRYPTION_KEY: ''
    };
  }

  // Get a specific parameter
  async getParameter(key) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.parameters[key];
  }

  // Get multiple parameters
  async getParameters(keys) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const result = {};
    for (const key of keys) {
      result[key] = this.parameters[key];
    }
    return result;
  }

  // Get all parameters
  async getAllParameters() {
    if (!this.initialized) {
      await this.initialize();
    }
    return { ...this.parameters };
  }

  // Refresh parameters (force reload)
  async refresh() {
    this.initialized = false;
    this.lastFetch = null;
    return this.initialize();
  }

  // Check if using production configuration
  isProduction() {
    return this.parameters.ENABLE_SES && this.parameters.ENABLE_S3;
  }

  // Get AWS credentials for SDK
  async getAWSCredentials() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return {
      accessKeyId: this.parameters.AWS_ACCESS_KEY_ID,
      secretAccessKey: this.parameters.AWS_SECRET_ACCESS_KEY,
      region: this.parameters.AWS_REGION
    };
  }

  // Get SES configuration
  async getSESConfig() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return {
      fromEmail: this.parameters.SES_FROM_EMAIL,
      region: this.parameters.SES_REGION,
      enabled: this.parameters.ENABLE_SES,
      credentials: {
        accessKeyId: this.parameters.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.parameters.AWS_SECRET_ACCESS_KEY
      }
    };
  }

  // Get S3 configuration
  async getS3Config() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return {
      bucketName: this.parameters.S3_BUCKET_NAME,
      region: this.parameters.S3_REGION,
      templatePath: this.parameters.S3_TEMPLATE_PATH,
      enabled: this.parameters.ENABLE_S3,
      credentials: {
        accessKeyId: this.parameters.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.parameters.AWS_SECRET_ACCESS_KEY
      }
    };
  }

  // Clear cache
  clearCache() {
    this.parameters = {};
    this.initialized = false;
    this.lastFetch = null;
  }
}

// Export singleton instance
const parameterStore = new AWSParameterStoreService();

// Auto-initialize on first import (optional)
if (typeof window !== 'undefined') {
  // Initialize in the background without blocking
  parameterStore.initialize().catch(error => {
    console.warn('Failed to initialize Parameter Store:', error);
  });
}

export default parameterStore;