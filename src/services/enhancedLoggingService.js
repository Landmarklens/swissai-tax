/**
 * Comprehensive Logging Service for Tenant Selection System
 * Provides detailed logging with different levels and persistence
 */

import config from '../config/environments';

const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.swissai.tax';

class LoggingService {
  constructor() {
    // Log levels - define first before using
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };

    this.logs = [];
    this.maxLogs = 1000;
    this.enableConsole = process.env.NODE_ENV === 'development';  // Only enable console logging in development
    this.enablePersistence = true;
    this.sessionId = this.generateSessionId();
    this.logLevel = this.getLogLevel();

    // Colors for console output
    this.colors = {
      DEBUG: '#888',
      INFO: '#0066cc',
      WARN: '#ff9900',
      ERROR: '#cc0000',
      CRITICAL: '#ff0000'
    };

    this.initializeLogging();
  }

  initializeLogging() {
    // Load previous logs from sessionStorage if available
    try {
      const storedLogs = sessionStorage.getItem('tenantSelectionLogs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs).slice(-500); // Keep last 500 logs
      }
    } catch (error) {
      console.error('Failed to load previous logs:', error);
    }

    // Set up global error handler
    window.addEventListener('error', (event) => {
      this.critical('Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.critical('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    this.info('Logging service initialized', {
      sessionId: this.sessionId,
      logLevel: this.getLogLevelName(),
      maxLogs: this.maxLogs
    });
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getLogLevel() {
    // Check localStorage for saved log level
    const savedLevel = localStorage.getItem('logLevel');
    if (savedLevel && this.levels[savedLevel] !== undefined) {
      return this.levels[savedLevel];
    }

    // Default to INFO in production, DEBUG in development
    return process.env.NODE_ENV === 'production' ? this.levels.INFO : this.levels.DEBUG;
  }

  setLogLevel(levelName) {
    if (this.levels[levelName] !== undefined) {
      this.logLevel = this.levels[levelName];
      localStorage.setItem('logLevel', levelName);
      this.info(`Log level changed to ${levelName}`);
    }
  }

  getLogLevelName(level = this.logLevel) {
    return Object.keys(this.levels).find(key => this.levels[key] === level) || 'UNKNOWN';
  }

  log(level, category, message, data = {}) {
    // Check if this log level should be recorded
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      sessionId: this.sessionId,
      level: this.getLogLevelName(level),
      category,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add to logs array
    this.logs.push(logEntry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    if (this.enableConsole) {
      this.consoleOutput(logEntry);
    }

    // Persist to sessionStorage
    if (this.enablePersistence) {
      this.persistLogs();
    }

    // Send critical errors to backend
    if (level >= this.levels.ERROR) {
      this.sendToBackend(logEntry);
    }

    return logEntry;
  }

  consoleOutput(logEntry) {
    const color = this.colors[logEntry.level];
    const style = `color: ${color}; font-weight: bold;`;
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    console.log(
      `%c[${timestamp}] [${logEntry.category}] ${logEntry.message}`,
      style,
      logEntry.data
    );
  }

  persistLogs() {
    try {
      sessionStorage.setItem('tenantSelectionLogs', JSON.stringify(this.logs));
    } catch (error) {
      // SessionStorage might be full
      console.error('Failed to persist logs:', error);
      // Clear old logs and try again
      this.logs = this.logs.slice(-100);
      try {
        sessionStorage.setItem('tenantSelectionLogs', JSON.stringify(this.logs));
      } catch (e) {
        // Give up
      }
    }
  }

  async sendToBackend(logEntry) {
    try {
      // Only send critical errors to avoid flooding
      if (logEntry.level !== 'CRITICAL') {
        return;
      }

      const response = await fetch(`${API_URL}/api/logs/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        console.error('Failed to send log to backend:', response.status);
      }
    } catch (error) {
      // Silently fail - don't want logging to break the app
      console.error('Failed to send log to backend:', error);
    }
  }

  // Convenience methods
  debug(category, message, data) {
    return this.log(this.levels.DEBUG, category, message, data);
  }

  info(category, message, data) {
    return this.log(this.levels.INFO, category, message, data);
  }

  warn(category, message, data) {
    return this.log(this.levels.WARN, category, message, data);
  }

  error(category, message, data) {
    return this.log(this.levels.ERROR, category, message, data);
  }

  critical(category, message, data) {
    return this.log(this.levels.CRITICAL, category, message, data);
  }

  // API call logging
  logApiCall(method, url, data, response, duration) {
    const status = response?.status || 'error';
    const level = status >= 400 ? this.levels.ERROR : this.levels.INFO;

    this.log(level, 'API', `${method} ${url} - ${status}`, {
      method,
      url,
      requestData: data,
      responseStatus: status,
      responseData: response?.data,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }

  // Component lifecycle logging
  logComponentMount(componentName, props) {
    this.debug('COMPONENT', `${componentName} mounted`, { props });
  }

  logComponentUnmount(componentName) {
    this.debug('COMPONENT', `${componentName} unmounted`, {});
  }

  logComponentError(componentName, error, errorInfo) {
    this.error('COMPONENT', `Error in ${componentName}`, {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    });
  }

  // State management logging
  logStateChange(slice, action, previousState, newState) {
    this.debug('STATE', `${slice}/${action}`, {
      action,
      previousState,
      newState,
      diff: this.getStateDiff(previousState, newState)
    });
  }

  getStateDiff(prev, next) {
    const diff = {};

    // Find changed fields
    for (const key in next) {
      if (prev[key] !== next[key]) {
        diff[key] = {
          old: prev[key],
          new: next[key]
        };
      }
    }

    return diff;
  }

  // Performance logging
  logPerformance(operation, duration, metadata = {}) {
    const level = duration > 3000 ? this.levels.WARN : this.levels.INFO;

    this.log(level, 'PERFORMANCE', `${operation} took ${duration}ms`, {
      operation,
      duration,
      ...metadata,
      slow: duration > 1000
    });
  }

  // Navigation logging
  logNavigation(from, to, context) {
    this.info('NAVIGATION', `Navigate from ${from} to ${to}`, {
      from,
      to,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // User action logging
  logUserAction(action, target, data = {}) {
    this.info('USER_ACTION', `${action} on ${target}`, {
      action,
      target,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Export logs
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenant-selection-logs-${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    sessionStorage.removeItem('tenantSelectionLogs');
    this.info('SYSTEM', 'Logs cleared');
  }

  // Get logs summary
  getLogsSummary() {
    const summary = {
      total: this.logs.length,
      byLevel: {},
      byCategory: {},
      errors: [],
      recentLogs: this.logs.slice(-10)
    };

    this.logs.forEach(log => {
      // Count by level
      summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;

      // Count by category
      summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;

      // Collect errors
      if (log.level === 'ERROR' || log.level === 'CRITICAL') {
        summary.errors.push(log);
      }
    });

    return summary;
  }
}

// Create singleton instance
const logger = new LoggingService();

// Export for use in components
export default logger;

// Also export as window.logger for debugging in console
if (typeof window !== 'undefined') {
  window.logger = logger;

  // Add console helpers
  window.showLogs = () => {
    console.table(logger.logs.slice(-20));
  };

  window.clearLogs = () => {
    logger.clearLogs();
    console.log('Logs cleared');
  };

  window.exportLogs = () => {
    logger.exportLogs();
    console.log('Logs exported');
  };

  window.setLogLevel = (level) => {
    logger.setLogLevel(level);
  };

  console.log(`
📊 Logging Service Initialized
Commands available in console:
- logger.debug(category, message, data)
- logger.info(category, message, data)
- logger.warn(category, message, data)
- logger.error(category, message, data)
- showLogs() - Display logs summary
- clearLogs() - Clear all logs
- exportLogs() - Download logs as JSON
- setLogLevel('DEBUG'|'INFO'|'WARN'|'ERROR'|'CRITICAL')
  `);
}