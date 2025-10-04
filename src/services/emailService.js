// AWS SES Email Service
// This service handles sending emails via Amazon SES
import parameterStore from './awsParameterStore';
import logger from './loggingService';

class EmailService {
  constructor() {
    // Configuration will be loaded from Parameter Store
    this.config = null;
    this.isInitialized = false;
    
    // For development/demo, we'll simulate email sending
    this.isDevelopment = true;
  }

  // Initialize with Parameter Store configuration
  async initialize() {
    logger.debug('EMAIL', 'Initialize called', { 
      isInitialized: this.isInitialized 
    });
    
    if (this.isInitialized) {
      logger.debug('EMAIL', 'Already initialized, skipping');
      return;
    }

    logger.info('EMAIL', 'Starting email service initialization');

    try {
      // Get SES configuration from Parameter Store
      logger.debug('EMAIL', 'Fetching SES configuration from Parameter Store');
      this.config = await parameterStore.getSESConfig();
      
      this.AWS_REGION = this.config.region;
      this.FROM_EMAIL = this.config.fromEmail;
      this.isDevelopment = !this.config.enabled;
      
      logger.info('EMAIL', 'SES configuration loaded', {
        region: this.AWS_REGION,
        fromEmail: this.FROM_EMAIL,
        isDevelopment: this.isDevelopment,
        sesEnabled: this.config.enabled,
        hasCredentials: !!this.config.credentials.accessKeyId
      });
      
      if (this.config.enabled && this.config.credentials.accessKeyId) {
        logger.info('EMAIL', 'Email service configured with AWS SES', {
          region: this.config.region
        });
        // In production with aws-sdk:
        // import AWS from 'aws-sdk';
        // AWS.config.update({
        //   region: this.config.region,
        //   accessKeyId: this.config.credentials.accessKeyId,
        //   secretAccessKey: this.config.credentials.secretAccessKey
        // });
        // this.ses = new AWS.SES({ apiVersion: '2010-12-01' });
      } else {
        logger.warn('EMAIL', 'Email service running in development mode', {
          reason: this.config.enabled ? 'No credentials' : 'SES disabled'
        });
      }
      
      this.isInitialized = true;
      logger.info('EMAIL', 'Email service initialization complete');
    } catch (error) {
      logger.error('EMAIL', 'Failed to initialize email service', {
        error: error.message,
        stack: error.stack
      });
      // Fallback to development mode
      this.isDevelopment = true;
      this.FROM_EMAIL = 'noreply@swissai.tax';
      this.isInitialized = true;
      
      logger.warn('EMAIL', 'Using fallback configuration', {
        isDevelopment: this.isDevelopment,
        fromEmail: this.FROM_EMAIL
      });
    }
  }

  // Initialize AWS SES (would need aws-sdk package in production)
  async initializeSES() {
    if (this.isDevelopment) {
      console.log('Email service running in development mode - emails will be simulated');
      return;
    }

    // In production, you would initialize AWS SDK here:
    // import AWS from 'aws-sdk';
    // AWS.config.update({
    //   region: this.AWS_REGION,
    //   accessKeyId: this.AWS_ACCESS_KEY_ID,
    //   secretAccessKey: this.AWS_SECRET_ACCESS_KEY
    // });
    // this.ses = new AWS.SES({ apiVersion: '2010-12-01' });
  }

  // Send document signature request email
  async sendSignatureRequestEmail(recipientEmail, documentData) {
    logger.info('EMAIL', 'Sending signature request email', {
      recipientEmail,
      documentName: documentData.documentName,
      documentId: documentData.documentId
    });
    
    // Ensure service is initialized
    if (!this.isInitialized) {
      logger.debug('EMAIL', 'Service not initialized, initializing now');
      await this.initialize();
    }
    const {
      documentName,
      landlordName,
      signingLink,
      expiresIn = '7 days',
      documentId
    } = documentData;

    const subject = `Action Required: Please sign ${documentName}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(90deg, #2196f3 0%, #4caf50 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background: #45a049; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { color: #ff9800; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Document Signature Request</h1>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>${landlordName} has sent you a document that requires your signature.</p>
            
            <div class="info-box">
              <strong>Document:</strong> ${documentName}<br>
              <strong>From:</strong> ${landlordName}<br>
              <strong>Expires:</strong> ${expiresIn}
            </div>
            
            <p>Please review and sign the document by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${signingLink}" class="button">Review & Sign Document</a>
            </div>
            
            <p class="warning">⚠️ This link will expire in ${expiresIn}</p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">
              ${signingLink}
            </p>
            
            <div class="footer">
              <p>This is an automated message from SwissAI Tax Filing System.</p>
              <p>Please do not reply to this email. If you have questions, contact ${landlordName} directly.</p>
              <p>Document ID: ${documentId}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Document Signature Request

${landlordName} has sent you a document that requires your signature.

Document: ${documentName}
From: ${landlordName}
Expires: ${expiresIn}

Please review and sign the document by visiting:
${signingLink}

This link will expire in ${expiresIn}.

Document ID: ${documentId}

This is an automated message from SwissAI Tax Filing System.
    `.trim();

    return this.sendEmail(recipientEmail, subject, htmlBody, textBody);
  }

  // Send document signed notification email
  async sendDocumentSignedNotification(recipientEmail, documentData) {
    logger.info('EMAIL', 'Sending document signed notification', {
      recipientEmail,
      documentName: documentData.documentName,
      tenantName: documentData.tenantName
    });
    
    const {
      documentName,
      tenantName,
      signedDate,
      documentLink
    } = documentData;

    const subject = `Document Signed: ${documentName}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Document Successfully Signed</h1>
          </div>
          <div class="content">
            <h2>Great news!</h2>
            <p>${tenantName} has successfully signed the document.</p>
            
            <div class="info-box">
              <strong>Document:</strong> ${documentName}<br>
              <strong>Signed by:</strong> ${tenantName}<br>
              <strong>Date signed:</strong> ${signedDate}
            </div>
            
            <p>You can view the fully executed document here:</p>
            
            <div style="text-align: center;">
              <a href="${documentLink}" class="button">View Signed Document</a>
            </div>
            
            <p>A copy of the signed document has been saved to your account for your records.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Document Successfully Signed

${tenantName} has successfully signed the document.

Document: ${documentName}
Signed by: ${tenantName}
Date signed: ${signedDate}

View the signed document: ${documentLink}
    `.trim();

    return this.sendEmail(recipientEmail, subject, htmlBody, textBody);
  }

  // Core email sending function
  async sendEmail(to, subject, htmlBody, textBody) {
    logger.debug('EMAIL', 'sendEmail called', {
      to,
      subject,
      isDevelopment: this.isDevelopment
    });
    
    if (this.isDevelopment) {
      logger.info('EMAIL', 'Using development mode for email sending');
      // In development, simulate email sending
      return this.simulateEmailSend(to, subject, htmlBody, textBody);
    }

    logger.info('EMAIL', 'Attempting to send email via AWS SES', {
      to,
      subject,
      fromEmail: this.FROM_EMAIL
    });

    // Production AWS SES implementation
    const params = {
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: htmlBody
          },
          Text: {
            Charset: "UTF-8",
            Data: textBody
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: this.FROM_EMAIL,
      ReplyToAddresses: [this.FROM_EMAIL]
    };

    try {
      logger.debug('EMAIL', 'SES send params prepared', { 
        destination: params.Destination.ToAddresses 
      });
      
      // In production with aws-sdk:
      // const result = await this.ses.sendEmail(params).promise();
      // logger.info('EMAIL', 'Email sent successfully via SES', { 
      //   messageId: result.MessageId 
      // });
      // return { success: true, messageId: result.MessageId };
      
      // For now, simulate the response
      logger.warn('EMAIL', 'AWS SDK not available, falling back to simulation');
      return this.simulateEmailSend(to, subject, htmlBody, textBody);
    } catch (error) {
      logger.error('EMAIL', 'Error sending email via SES', {
        error: error.message,
        to,
        subject
      });
      throw error;
    }
  }

  // Simulate email sending for development/demo
  simulateEmailSend(to, subject, htmlBody, textBody) {
    logger.info('EMAIL', 'Simulating email send', {
      to,
      subject,
      mode: 'development'
    });
    
    // Store in localStorage for demo purposes
    const emailLog = {
      id: `email_${Date.now()}`,
      to,
      subject,
      htmlBody,
      textBody,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    
    this.logEmail(emailLog);
    
    // Simulate email sent successfully
    return {
      success: true,
      messageId: emailLog.id,
      message: 'Email simulated successfully (development mode)',
      previewUrl: this.generatePreviewUrl(emailLog.id)
    };
  }

  // Log emails to localStorage for demo/testing
  logEmail(emailData) {
    try {
      const emails = JSON.parse(localStorage.getItem('swissai_email_log') || '[]');
      emails.unshift(emailData); // Add to beginning

      // Keep only last 50 emails
      if (emails.length > 50) {
        emails.splice(50);
      }

      localStorage.setItem('swissai_email_log', JSON.stringify(emails));
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  // Get email logs (for testing/demo)
  getEmailLogs() {
    try {
      return JSON.parse(localStorage.getItem('swissai_email_log') || '[]');
    } catch (error) {
      console.error('Error getting email logs:', error);
      return [];
    }
  }

  // Generate a preview URL for development
  generatePreviewUrl(emailId) {
    // In development, create a data URL to preview the email
    const email = this.getEmailLogs().find(e => e.id === emailId);
    if (email) {
      const blob = new Blob([email.htmlBody], { type: 'text/html' });
      return URL.createObjectURL(blob);
    }
    return null;
  }

  // Verify email configuration
  async verifyConfiguration() {
    if (this.isDevelopment) {
      return {
        configured: false,
        mode: 'development',
        message: 'Email service running in development mode - emails will be simulated'
      };
    }

    try {
      // In production, verify SES configuration
      // const result = await this.ses.getAccountSendingEnabled().promise();
      // return {
      //   configured: true,
      //   mode: 'production',
      //   enabled: result.Enabled
      // };
      
      return {
        configured: false,
        mode: 'development',
        message: 'AWS SES not configured - using simulation mode'
      };
    } catch (error) {
      return {
        configured: false,
        mode: 'error',
        message: error.message
      };
    }
  }

  // Generate signing link
  generateSigningLink(documentId, token) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/sign/${documentId}?token=${token}`;
  }

  // Generate secure token for signing
  generateSigningToken() {
    // Generate a random token for document signing
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

export default new EmailService();