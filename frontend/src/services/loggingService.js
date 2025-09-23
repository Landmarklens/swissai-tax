// Comprehensive Logging Service for Debugging
// Provides detailed logging with categories, levels, and persistence

class LoggingService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    this.logLevel = this.getLogLevel();
    this.enableConsole = true;
    this.enableLocalStorage = true;
    this.categories = new Set();
    
    // Log levels
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };
    
    // Color codes for console
    this.colors = {
      DEBUG: '#888',
      INFO: '#2196f3',
      WARN: '#ff9800',
      ERROR: '#f44336',
      CRITICAL: '#d32f2f'
    };
    
    // Initialize
    this.loadFromLocalStorage();
    this.setupGlobalErrorHandler();
  }
  
  // Get log level from environment or localStorage
  getLogLevel() {
    const stored = localStorage.getItem('homeai_log_level');
    if (stored) return stored;
    
    return process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO';
  }
  
  // Set log level
  setLogLevel(level) {
    this.logLevel = level;
    localStorage.setItem('homeai_log_level', level);
    this.info('LOGGING', `Log level changed to ${level}`);
  }
  
  // Core logging method
  log(level, category, message, data = null) {
    // Check if should log based on level
    if (this.levels[level] < this.levels[this.logLevel]) {
      return;
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      stack: level === 'ERROR' || level === 'CRITICAL' ? new Error().stack : null
    };
    
    // Add to memory
    this.logs.push(logEntry);
    this.categories.add(category);
    
    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Console output
    if (this.enableConsole) {
      this.consoleLog(logEntry);
    }
    
    // Save to localStorage
    if (this.enableLocalStorage) {
      this.saveToLocalStorage();
    }
    
    // Send critical errors to backend (if available)
    if (level === 'CRITICAL') {
      this.reportCriticalError(logEntry);
    }
  }
  
  // Console logging with formatting
  consoleLog(entry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.category}]`;
    const color = this.colors[entry.level];
    
    const style = `color: ${color}; font-weight: ${entry.level === 'ERROR' || entry.level === 'CRITICAL' ? 'bold' : 'normal'}`;
    
    if (entry.data) {
      console.group(`%c${prefix} ${entry.message}`, style);
      console.log('Data:', entry.data);
      if (entry.stack) {
        console.log('Stack:', entry.stack);
      }
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${entry.message}`, style);
    }
  }
  
  // Convenience methods for different levels
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
  
  // Save logs to localStorage
  saveToLocalStorage() {
    try {
      // Keep only last 100 logs in localStorage
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem('homeai_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }
  
  // Load logs from localStorage
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('homeai_logs');
      if (stored) {
        const logs = JSON.parse(stored);
        this.logs = logs;
        logs.forEach(log => this.categories.add(log.category));
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
    }
  }
  
  // Get logs by category
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }
  
  // Get logs by level
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }
  
  // Get recent logs
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }
  
  // Search logs
  searchLogs(query) {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowerQuery) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(lowerQuery))
    );
  }
  
  // Clear logs
  clearLogs() {
    this.logs = [];
    this.categories.clear();
    localStorage.removeItem('homeai_logs');
    this.info('LOGGING', 'Logs cleared');
  }
  
  // Export logs
  exportLogs() {
    const data = {
      exportDate: new Date().toISOString(),
      logLevel: this.logLevel,
      totalLogs: this.logs.length,
      categories: Array.from(this.categories),
      logs: this.logs
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homeai_logs_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.info('LOGGING', 'Logs exported');
  }
  
  // Get statistics
  getStatistics() {
    const stats = {
      totalLogs: this.logs.length,
      categories: Array.from(this.categories),
      byLevel: {},
      byCategory: {},
      recentErrors: []
    };
    
    // Count by level
    Object.keys(this.levels).forEach(level => {
      stats.byLevel[level] = this.logs.filter(log => log.level === level).length;
    });
    
    // Count by category
    this.categories.forEach(category => {
      stats.byCategory[category] = this.logs.filter(log => log.category === category).length;
    });
    
    // Recent errors
    stats.recentErrors = this.logs
      .filter(log => log.level === 'ERROR' || log.level === 'CRITICAL')
      .slice(-10);
    
    return stats;
  }
  
  // Setup global error handler
  setupGlobalErrorHandler() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('GLOBAL_ERROR', event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error ? event.error.toString() : null
        });
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.error('UNHANDLED_PROMISE', 'Unhandled promise rejection', {
          reason: event.reason,
          promise: event.promise
        });
      });
    }
  }
  
  // Report critical errors to backend
  async reportCriticalError(logEntry) {
    try {
      // In production, send to backend
      const response = await fetch('/api/logs/critical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
      
      if (!response.ok) {
        console.error('Failed to report critical error to backend');
      }
    } catch (error) {
      // Silently fail - don't want logging to break the app
      console.error('Failed to report critical error:', error);
    }
  }
  
  // Display logs in console (for debugging)
  displayLogs() {
    console.group('📊 HomeAI Logs Summary');
    const stats = this.getStatistics();
    console.table(stats.byLevel);
    console.log('Categories:', stats.categories);
    console.log('Recent Errors:', stats.recentErrors);
    console.groupEnd();
  }
}

// Create singleton instance
const logger = new LoggingService();

// Add to window for debugging
if (typeof window !== 'undefined') {
  window.logger = logger;
  
  // Add convenience methods
  window.showLogs = () => logger.displayLogs();
  window.clearLogs = () => logger.clearLogs();
  window.exportLogs = () => logger.exportLogs();
  window.setLogLevel = (level) => logger.setLogLevel(level);
  
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

export default logger;