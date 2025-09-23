/**
 * Enhanced Debug Logger for Frontend
 * Provides extensive logging capabilities with different log levels,
 * performance tracking, and remote logging support
 */

class DebugLogger {
  constructor() {
    this.logLevels = {
      TRACE: 0,
      DEBUG: 1,
      INFO: 2,
      WARN: 3,
      ERROR: 4,
      CRITICAL: 5
    };

    this.currentLevel = this.logLevels.DEBUG;
    this.logBuffer = [];
    this.maxBufferSize = 1000;
    this.performanceMetrics = new Map();
    this.requestCounter = 0;
    this.enableConsoleLog = true;
    this.enableRemoteLog = false;
    this.sessionId = this.generateSessionId();

    // Color codes for console
    this.colors = {
      TRACE: '#888',
      DEBUG: '#666',
      INFO: '#0066cc',
      WARN: '#ff9900',
      ERROR: '#cc0000',
      CRITICAL: '#ff0066'
    };

    // Initialize
    this.init();
  }

  init() {
    // Store logger instance globally for debugging
    if (typeof window !== 'undefined') {
      window.__debugLogger = this;
      console.log('%c🔍 Debug Logger Initialized', 'color: #0066cc; font-weight: bold');
      console.log('Access logger via: window.__debugLogger');
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setLogLevel(level) {
    if (typeof level === 'string' && this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level];
      this.info('LOGGER', `Log level set to ${level}`);
    }
  }

  shouldLog(level) {
    return this.logLevels[level] >= this.currentLevel;
  }

  formatMessage(level, category, message, data) {
    const timestamp = new Date().toISOString();
    const requestId = this.requestCounter;

    return {
      timestamp,
      sessionId: this.sessionId,
      requestId,
      level,
      category,
      message,
      data: data || {},
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  log(level, category, message, data) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, category, message, data);

    // Add to buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console output
    if (this.enableConsoleLog) {
      const color = this.colors[level] || '#000';
      const prefix = `[${new Date().toLocaleTimeString()}] [${level}] [${category}]`;

      console.log(
        `%c${prefix} ${message}`,
        `color: ${color}; font-weight: ${level === 'ERROR' || level === 'CRITICAL' ? 'bold' : 'normal'}`
      );

      if (data && Object.keys(data).length > 0) {
        console.log('Data:', data);
      }
    }

    // Send to remote if enabled and it's an error
    if (this.enableRemoteLog && (level === 'ERROR' || level === 'CRITICAL')) {
      this.sendToRemote(logEntry);
    }
  }

  trace(category, message, data) {
    this.log('TRACE', category, message, data);
  }

  debug(category, message, data) {
    this.log('DEBUG', category, message, data);
  }

  info(category, message, data) {
    this.log('INFO', category, message, data);
  }

  warn(category, message, data) {
    this.log('WARN', category, message, data);
  }

  error(category, message, data) {
    this.log('ERROR', category, message, data);
  }

  critical(category, message, data) {
    this.log('CRITICAL', category, message, data);
  }

  // API Request/Response logging
  logApiRequest(config) {
    this.requestCounter++;
    const requestId = this.requestCounter;

    const logData = {
      requestId,
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
      headers: this.sanitizeHeaders(config.headers),
      timestamp: Date.now()
    };

    this.debug('API_REQUEST', `${config.method?.toUpperCase()} ${config.url}`, logData);

    // Store request start time for performance tracking
    this.performanceMetrics.set(`request_${requestId}`, Date.now());

    return requestId;
  }

  logApiResponse(response, requestId) {
    const startTime = this.performanceMetrics.get(`request_${requestId}`);
    const duration = startTime ? Date.now() - startTime : 0;

    const logData = {
      requestId,
      status: response.status,
      statusText: response.statusText,
      url: response.config?.url,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(response.data || {}).length,
      headers: this.sanitizeHeaders(response.headers)
    };

    const level = response.status >= 400 ? 'ERROR' : 'INFO';
    this.log(level, 'API_RESPONSE',
      `${response.config?.method?.toUpperCase()} ${response.config?.url} - ${response.status}`,
      logData
    );

    // Log response data if in DEBUG mode
    if (this.currentLevel <= this.logLevels.DEBUG) {
      this.debug('API_RESPONSE_DATA', `Response data for request ${requestId}`, {
        data: response.data
      });
    }

    // Clean up performance metric
    this.performanceMetrics.delete(`request_${requestId}`);

    // Log slow requests
    if (duration > 3000) {
      this.warn('PERFORMANCE', `Slow API call detected: ${duration}ms`, logData);
    }
  }

  logApiError(error, requestId) {
    const startTime = this.performanceMetrics.get(`request_${requestId}`);
    const duration = startTime ? Date.now() - startTime : 0;

    const logData = {
      requestId,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      duration: `${duration}ms`,
      responseData: error.response?.data,
      stack: error.stack
    };

    this.error('API_ERROR',
      `${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.message}`,
      logData
    );

    // Clean up performance metric
    this.performanceMetrics.delete(`request_${requestId}`);
  }

  // Component lifecycle logging
  logComponentMount(componentName, props) {
    this.debug('COMPONENT', `${componentName} mounted`, { props });
  }

  logComponentUpdate(componentName, prevProps, newProps) {
    this.debug('COMPONENT', `${componentName} updated`, {
      prevProps,
      newProps,
      changes: this.getObjectDiff(prevProps, newProps)
    });
  }

  logComponentUnmount(componentName) {
    this.debug('COMPONENT', `${componentName} unmounted`);
  }

  logComponentError(componentName, error, errorInfo) {
    this.error('COMPONENT_ERROR', `Error in ${componentName}`, {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    });
  }

  // State management logging
  logStateChange(storeName, action, prevState, newState) {
    this.debug('STATE', `${storeName} - ${action.type || action}`, {
      action,
      prevState,
      newState,
      changes: this.getObjectDiff(prevState, newState)
    });
  }

  // Performance logging
  startPerformanceTimer(label) {
    this.performanceMetrics.set(label, Date.now());
    this.trace('PERFORMANCE', `Timer started: ${label}`);
  }

  endPerformanceTimer(label, threshold = 1000) {
    const startTime = this.performanceMetrics.get(label);
    if (!startTime) {
      this.warn('PERFORMANCE', `No timer found for label: ${label}`);
      return;
    }

    const duration = Date.now() - startTime;
    const level = duration > threshold ? 'WARN' : 'DEBUG';

    this.log(level, 'PERFORMANCE', `${label} completed`, {
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      exceeded: duration > threshold
    });

    this.performanceMetrics.delete(label);
    return duration;
  }

  // User action logging
  logUserAction(action, details) {
    this.info('USER_ACTION', action, details);
  }

  // Feature flag logging
  logFeatureFlag(flagName, value, context) {
    this.debug('FEATURE_FLAG', `${flagName}: ${value}`, context);
  }

  // Analytics logging
  logAnalyticsEvent(eventName, properties) {
    this.info('ANALYTICS', eventName, properties);
  }

  // Utility methods
  sanitizeHeaders(headers) {
    if (!headers) return {};

    const sanitized = { ...headers };
    // Hide sensitive headers
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer [REDACTED]';
    }
    if (sanitized.Cookie) {
      sanitized.Cookie = '[REDACTED]';
    }
    if (sanitized['X-API-Key']) {
      sanitized['X-API-Key'] = '[REDACTED]';
    }

    return sanitized;
  }

  getObjectDiff(obj1, obj2) {
    const diff = {};

    // Check for added or modified keys
    for (const key in obj2) {
      if (obj1[key] !== obj2[key]) {
        diff[key] = {
          old: obj1[key],
          new: obj2[key]
        };
      }
    }

    // Check for removed keys
    for (const key in obj1) {
      if (!(key in obj2)) {
        diff[key] = {
          old: obj1[key],
          new: undefined
        };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }

  // Export logs for debugging
  exportLogs(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logBuffer, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['timestamp', 'level', 'category', 'message', 'data'];
      const rows = this.logBuffer.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.message,
        JSON.stringify(log.data)
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return this.logBuffer;
  }

  downloadLogs(filename = `debug_logs_${Date.now()}.json`) {
    const data = this.exportLogs('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    this.info('LOGGER', `Logs downloaded as ${filename}`);
  }

  clearLogs() {
    this.logBuffer = [];
    this.performanceMetrics.clear();
    this.requestCounter = 0;
    this.info('LOGGER', 'Logs cleared');
  }

  getLogSummary() {
    const summary = {
      total: this.logBuffer.length,
      byLevel: {},
      byCategory: {},
      errors: [],
      slowRequests: []
    };

    this.logBuffer.forEach(log => {
      // Count by level
      summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;

      // Count by category
      summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;

      // Collect errors
      if (log.level === 'ERROR' || log.level === 'CRITICAL') {
        summary.errors.push({
          timestamp: log.timestamp,
          message: log.message,
          data: log.data
        });
      }

      // Collect slow requests
      if (log.category === 'PERFORMANCE' && log.data?.exceeded) {
        summary.slowRequests.push({
          timestamp: log.timestamp,
          message: log.message,
          duration: log.data.duration
        });
      }
    });

    return summary;
  }

  displaySummary() {
    const summary = this.getLogSummary();

    console.group('%c📊 Debug Log Summary', 'color: #0066cc; font-weight: bold');
    console.log('Total logs:', summary.total);
    console.log('Session ID:', this.sessionId);
    console.table(summary.byLevel);
    console.table(summary.byCategory);

    if (summary.errors.length > 0) {
      console.group('%c❌ Errors', 'color: #cc0000; font-weight: bold');
      console.table(summary.errors);
      console.groupEnd();
    }

    if (summary.slowRequests.length > 0) {
      console.group('%c⚠️ Slow Requests', 'color: #ff9900; font-weight: bold');
      console.table(summary.slowRequests);
      console.groupEnd();
    }

    console.groupEnd();
  }

  // Remote logging (optional)
  async sendToRemote(logEntry) {
    try {
      // Implement remote logging endpoint if needed
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });
    } catch (error) {
      // Silently fail remote logging
      console.error('Failed to send log to remote:', error);
    }
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Export for use in application
export default debugLogger;

// Also export class for testing
export { DebugLogger };