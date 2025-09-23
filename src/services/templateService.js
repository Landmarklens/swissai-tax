import templateContent from '../components/sections/OwnerAccount/Document/templates/templateContent.json';
import parameterStore from './awsParameterStore';
import logger from './loggingService';

class TemplateService {
  constructor() {
    this.templates = templateContent.templates;
    this.s3Config = null;
    this.s3BaseUrl = null;
    this.useS3 = false;
    this.templateCache = new Map();
    this.isInitialized = false;
    
    logger.debug('TEMPLATE', 'Template service constructed', {
      localTemplateCount: Object.keys(this.templates).length
    });
  }

  async initialize() {
    logger.debug('TEMPLATE', 'Initialize called', {
      isInitialized: this.isInitialized
    });
    
    if (this.isInitialized) {
      logger.debug('TEMPLATE', 'Already initialized, skipping');
      return;
    }

    logger.info('TEMPLATE', 'Starting template service initialization');

    try {
      // Get S3 configuration from Parameter Store
      logger.debug('TEMPLATE', 'Fetching S3 configuration from Parameter Store');
      this.s3Config = await parameterStore.getS3Config();
      
      if (this.s3Config.enabled && this.s3Config.bucketName) {
        this.s3BaseUrl = `https://${this.s3Config.bucketName}.s3.${this.s3Config.region}.amazonaws.com`;
        this.useS3 = true;
        logger.info('TEMPLATE', 'Template service configured with S3', {
          s3BaseUrl: this.s3BaseUrl,
          bucketName: this.s3Config.bucketName,
          region: this.s3Config.region
        });
      } else {
        logger.warn('TEMPLATE', 'S3 not configured, using local templates', {
          s3Enabled: this.s3Config.enabled,
          hasBucket: !!this.s3Config.bucketName
        });
        this.useS3 = false;
      }
      
      this.isInitialized = true;
      logger.info('TEMPLATE', 'Template service initialization complete', {
        useS3: this.useS3
      });
    } catch (error) {
      logger.error('TEMPLATE', 'Failed to initialize template service', {
        error: error.message,
        stack: error.stack
      });
      this.useS3 = false;
      this.isInitialized = true;
    }
  }

  async loadTemplateFromS3(templateId, language) {
    logger.debug('TEMPLATE', 'Attempting to load template from S3', {
      templateId,
      language
    });
    
    try {
      // Check cache first
      const cacheKey = `${templateId}-${language}`;
      if (this.templateCache.has(cacheKey)) {
        logger.debug('TEMPLATE', 'Template found in cache', { cacheKey });
        return this.templateCache.get(cacheKey);
      }

      // Try to load from S3 with CORS handling
      const contentUrl = `${this.s3BaseUrl}/templates/content.json`;
      logger.debug('TEMPLATE', 'Loading template from S3', { 
        url: contentUrl,
        templateId,
        language 
      });
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(contentUrl, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.templates && data.templates[templateId]) {
            const template = data.templates[templateId][language] || data.templates[templateId]['en'];
            this.templateCache.set(cacheKey, template);
            logger.info('TEMPLATE', 'Template loaded from S3 successfully', {
              templateId,
              language,
              cacheKey
            });
            return template;
          } else {
            logger.warn('TEMPLATE', 'Template not found in S3 response', {
              templateId,
              language,
              availableTemplates: data.templates ? Object.keys(data.templates) : []
            });
          }
        } else {
          logger.warn('TEMPLATE', 'S3 fetch returned non-OK status', {
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (fetchError) {
        logger.warn('TEMPLATE', 'S3 fetch failed, using local fallback', {
          error: fetchError.message,
          templateId,
          language
        });
      }
      
      return null; // Will fallback to local
    } catch (error) {
      logger.error('TEMPLATE', 'Error loading template from S3', {
        error: error.message,
        templateId,
        language
      });
      return null;
    }
  }

  getLocalTemplate(templateId, language) {
    logger.debug('TEMPLATE', 'Getting local template', {
      templateId,
      language
    });
    
    const template = this.templates[templateId];
    if (!template || !template[language]) {
      logger.warn('TEMPLATE', 'Local template not found, falling back to English', {
        templateId,
        requestedLanguage: language,
        hasTemplate: !!template,
        availableLanguages: template ? Object.keys(template) : []
      });
      // Fallback to English if language not available
      return template?.en || null;
    }
    
    logger.debug('TEMPLATE', 'Local template found', {
      templateId,
      language
    });
    return template[language];
  }

  async getTemplate(templateId, language = 'en') {
    logger.info('TEMPLATE', 'Getting template', {
      templateId,
      language,
      useS3: this.useS3
    });
    
    // Ensure service is initialized
    if (!this.isInitialized) {
      logger.debug('TEMPLATE', 'Service not initialized, initializing now');
      await this.initialize();
    }
    // Try S3 first if enabled
    if (this.useS3) {
      const s3Template = await this.loadTemplateFromS3(templateId, language);
      if (s3Template) {
        logger.info('TEMPLATE', 'Using S3 template', { templateId, language });
        return s3Template;
      }
    }

    // Fallback to local templates
    logger.info('TEMPLATE', 'Using local template', { templateId, language });
    return this.getLocalTemplate(templateId, language);
  }

  generateHtmlFromTemplate(templateData, fieldValues = {}) {
    if (!templateData) return null;

    let html = `
      <div class="document-template" style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="text-align: center; color: #2c3e50; border-bottom: 3px double #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
          ${templateData.title || 'DOCUMENT'}
        </h1>
    `;

    // Add sections if they exist
    if (templateData.sections) {
      Object.entries(templateData.sections).forEach(([key, title]) => {
        html += `
          <section style="margin-bottom: 25px;">
            <h2 style="color: #34495e; font-size: 18px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; margin-bottom: 15px;">
              ${title}
            </h2>
            <div class="section-content" id="${key}-content">
              <!-- Content will be filled based on section -->
            </div>
          </section>
        `;
      });
    }

    // Add main content
    if (templateData.content) {
      html += `
        <div class="document-content" style="line-height: 1.8; color: #2c3e50; text-align: justify; margin: 30px 0;">
          ${this.processContent(templateData.content, fieldValues)}
        </div>
      `;
    }

    // Add signature section
    html += `
      <div class="signature-section" style="margin-top: 60px; display: flex; justify-content: space-between;">
        <div style="width: 45%;">
          <div class="signature-line" style="min-height: 60px; margin-bottom: 10px; display: flex; align-items: flex-end;">
            {{landlord_signature}}
          </div>
          <p style="margin: 0; color: #7f8c8d; border-top: 2px solid #2c3e50; padding-top: 5px;">Landlord Signature</p>
          <p style="margin: 5px 0; color: #7f8c8d;">Date: {{landlord_sign_date}}</p>
        </div>
        <div style="width: 45%;">
          <div class="signature-line" style="min-height: 60px; margin-bottom: 10px; display: flex; align-items: flex-end;">
            {{tenant_signature}}
          </div>
          <p style="margin: 0; color: #7f8c8d; border-top: 2px solid #2c3e50; padding-top: 5px;">Tenant Signature</p>
          <p style="margin: 5px 0; color: #7f8c8d;">Date: {{tenant_sign_date}}</p>
        </div>
      </div>
    `;

    html += '</div>';

    // Replace all field placeholders
    return this.processContent(html, fieldValues);
  }

  processContent(content, fieldValues) {
    let processed = content;
    
    logger.debug('TEMPLATE', 'Processing template content', {
      fieldCount: Object.keys(fieldValues).length,
      hasSignatures: Object.keys(fieldValues).some(k => k.includes('signature'))
    });
    
    // Replace field placeholders with styled spans
    processed = processed.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
      const value = fieldValues[fieldName];
      const hasValue = value && value !== '';
      
      logger.debug('TEMPLATE', 'Processing field placeholder', {
        fieldName,
        hasValue,
        valueType: typeof value
      });
      
      // Special handling for signature fields
      if (fieldName.includes('signature') && value && typeof value === 'object') {
        logger.debug('TEMPLATE', 'Processing signature field', {
          fieldName,
          signatureType: value.type,
          hasData: !!value.data || !!value.text
        });
        if (value.type === 'draw' && value.data) {
          // Display drawn signature as image
          logger.debug('TEMPLATE', 'Rendering drawn signature');
          return `<img 
            src="${value.data}" 
            alt="Signature" 
            style="
              max-width: 200px;
              max-height: 60px;
              border-bottom: 2px solid #000;
              margin: 0 4px;
            "
          />`;
        } else if (value.type === 'type' && value.text) {
          // Display typed signature with the selected font
          console.log('Rendering typed signature with font:', value.font);
          return `<span 
            style="
              font-family: ${value.font || 'Dancing Script'};
              font-size: ${value.fontSize || 48}px;
              color: #000;
              border-bottom: 2px solid #000;
              display: inline-block;
              padding: 0 8px;
              margin: 0 4px;
            "
          >${value.text}</span>`;
        }
      }
      
      return `<span 
        class="field-placeholder" 
        data-field="${fieldName}"
        style="
          display: inline-block;
          padding: 2px 8px;
          margin: 0 4px;
          border-radius: 4px;
          cursor: pointer;
          min-width: ${hasValue ? 'auto' : '100px'};
          background-color: ${hasValue ? '#e8f5e9' : '#fff3e0'};
          border: 2px ${hasValue ? 'solid #4caf50' : 'dashed #ff9800'};
          color: ${hasValue ? '#2e7d32' : '#e65100'};
          font-weight: ${hasValue ? '500' : '400'};
          transition: all 0.3s ease;
        "
        onmouseover="this.style.backgroundColor='#e3f2fd'; this.style.borderColor='#2196f3';"
        onmouseout="this.style.backgroundColor='${hasValue ? '#e8f5e9' : '#fff3e0'}'; this.style.borderColor='${hasValue ? '#4caf50' : '#ff9800'}';"
      >
        ${value || `[${fieldName.replace(/_/g, ' ')}]`}
      </span>`;
    });

    return processed;
  }

  getAllTemplateIds() {
    return Object.keys(this.templates);
  }

  getAvailableLanguages() {
    return ['en', 'de', 'fr', 'it'];
  }
}

export default new TemplateService();