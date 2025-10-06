// Environment-specific configuration
const environments = {
  development: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.swissai.tax',
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.swissai.tax/ws',
    SSE_URL: process.env.REACT_APP_SSE_URL || 'https://api.swissai.tax',
    ENABLE_MOCK_DATA: process.env.REACT_APP_ENABLE_MOCK_DATA === 'true',
    ENABLE_DEBUG_LOGGING: true,
    ENABLE_REAL_TIME: process.env.REACT_APP_ENABLE_REAL_TIME !== 'false',
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
    GA_TRACKING_ID: process.env.REACT_APP_GA_TRACKING_ID
  },
  test: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.swissai.tax',
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.swissai.tax/ws',
    SSE_URL: process.env.REACT_APP_SSE_URL || 'https://api.swissai.tax',
    ENABLE_MOCK_DATA: false,
    ENABLE_DEBUG_LOGGING: false,
    ENABLE_REAL_TIME: false,
    SENTRY_DSN: null,
    GA_TRACKING_ID: null
  },
  staging: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://staging-api.swissai.tax',
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://staging-api.swissai.tax/ws',
    SSE_URL: process.env.REACT_APP_SSE_URL || 'https://staging-api.swissai.tax',
    ENABLE_MOCK_DATA: false,
    ENABLE_DEBUG_LOGGING: true,
    ENABLE_REAL_TIME: true,
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
    GA_TRACKING_ID: process.env.REACT_APP_GA_TRACKING_ID
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.swissai.tax',
    WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.swissai.tax/ws',
    SSE_URL: process.env.REACT_APP_SSE_URL || 'https://api.swissai.tax',
    ENABLE_MOCK_DATA: false,
    ENABLE_DEBUG_LOGGING: false,
    ENABLE_REAL_TIME: true,
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
    GA_TRACKING_ID: process.env.REACT_APP_GA_TRACKING_ID
  }
};

// Get current environment
const currentEnvironment = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

// Export configuration for current environment
const config = environments[currentEnvironment] || environments.development;

// Feature flags
export const features = {
  TENANT_SELECTION: process.env.REACT_APP_FEATURE_TENANT_SELECTION !== 'false',
  TENANT_SELECTION_AI: process.env.REACT_APP_FEATURE_TENANT_SELECTION_AI !== 'false',
  BULK_OPERATIONS: process.env.REACT_APP_FEATURE_BULK_OPERATIONS !== 'false',
  ANALYTICS_DASHBOARD: process.env.REACT_APP_FEATURE_ANALYTICS !== 'false',
  COMMUNICATION_HUB: process.env.REACT_APP_FEATURE_COMMUNICATION !== 'false',
  REAL_TIME_UPDATES: process.env.REACT_APP_FEATURE_REAL_TIME !== 'false',
  EXPORT_FUNCTIONALITY: process.env.REACT_APP_FEATURE_EXPORT !== 'false'
};

// AWS Configuration for tenant selection
export const awsConfig = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  sesEndpoint: process.env.REACT_APP_SES_ENDPOINT,
  s3Bucket: process.env.REACT_APP_S3_BUCKET,
  lambdaEndpoint: process.env.REACT_APP_LAMBDA_ENDPOINT
};

// Tenant Selection specific configuration
export const tenantSelectionConfig = {
  emailProcessing: {
    managedEmailDomain: process.env.REACT_APP_MANAGED_EMAIL_DOMAIN || 'applications.swissai.tax',
    maxAttachmentSize: 10 * 1024 * 1024, // 10MB
    supportedPortals: [
      'homegate',
      'flatfox',
      'immoscout24',
      'comparis',
      'newhome',
      'immomailing'
    ]
  },
  scoring: {
    minScore: 0,
    maxScore: 100,
    passingScore: parseInt(process.env.REACT_APP_PASSING_SCORE || '60'),
    weights: {
      income: 30,
      creditScore: 25,
      references: 20,
      employmentHistory: 15,
      otherFactors: 10
    }
  },
  viewing: {
    maxInvitesPerViewing: parseInt(process.env.REACT_APP_MAX_VIEWING_INVITES || '10'),
    defaultDuration: 30, // minutes
    defaultBuffer: 15, // minutes between viewings
    autoScheduleEnabled: process.env.REACT_APP_AUTO_SCHEDULE === 'true'
  },
  notifications: {
    emailEnabled: process.env.REACT_APP_EMAIL_NOTIFICATIONS !== 'false',
    pushEnabled: process.env.REACT_APP_PUSH_NOTIFICATIONS === 'true',
    smsEnabled: process.env.REACT_APP_SMS_NOTIFICATIONS === 'true',
    webhookUrl: process.env.REACT_APP_WEBHOOK_URL
  },
  limits: {
    maxApplicationsPerProperty: 500,
    maxBulkOperations: 50,
    exportBatchSize: 100,
    apiRequestTimeout: 60000, // ms - Increased to 60s for property import
    sseReconnectDelay: 5000 // ms
  }
};

// Monitoring and Analytics
export const monitoring = {
  sentry: {
    dsn: config.SENTRY_DSN,
    environment: currentEnvironment,
    tracesSampleRate: currentEnvironment === 'production' ? 0.1 : 1.0,
    integrations: ['BrowserTracing'],
    beforeSend: (event) => {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      return event;
    }
  },
  googleAnalytics: {
    trackingId: config.GA_TRACKING_ID,
    enabled: !!config.GA_TRACKING_ID && currentEnvironment === 'production'
  },
  customEvents: {
    TENANT_SELECTION_SETUP: 'tenant_selection_setup',
    APPLICATION_RECEIVED: 'application_received',
    APPLICATION_PROCESSED: 'application_processed',
    DECISION_MADE: 'decision_made',
    VIEWING_SCHEDULED: 'viewing_scheduled',
    BULK_ACTION_PERFORMED: 'bulk_action_performed',
    TEMPLATE_CREATED: 'template_created',
    EXPORT_GENERATED: 'export_generated'
  }
};

// Export main configuration
const envConfig = {
  ...config,
  environment: currentEnvironment,
  isDevelopment: currentEnvironment === 'development',
  isTest: currentEnvironment === 'test',
  isStaging: currentEnvironment === 'staging',
  isProduction: currentEnvironment === 'production',
  features,
  awsConfig,
  tenantSelectionConfig,
  monitoring
};

export default envConfig;