/**
 * What-If Analysis Debug Logger
 * Specialized debugging for what-if analysis feature
 * Disabled by default - enable only when debugging is needed
 */

class WhatIfDebugger {
  constructor() {
    this.enabled = false; // Disabled by default
    this.logs = [];
    this.sessionId = this.generateSessionId();
    this.currentAnalysis = null;
    this.performanceMarks = new Map();

    // Initialize
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      window.__whatIfDebugger = this;
      // Removed console logs for debugger initialization
    }
  }

  generateSessionId() {
    return `whatif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startAnalysis(propertyId, params) {
    const analysisId = `analysis_${Date.now()}_${propertyId}`;
    this.currentAnalysis = {
      id: analysisId,
      propertyId,
      params,
      startTime: Date.now(),
      steps: []
    };

    this.log('ANALYSIS_START', {
      analysisId,
      propertyId,
      sessionId: this.sessionId,
      params,
      timestamp: new Date().toISOString()
    });

    // Mark performance start
    performance.mark(`whatif-start-${analysisId}`);

    return analysisId;
  }

  log(type, data) {
    if (!this.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      data,
      analysisId: this.currentAnalysis?.id,
      sessionId: this.sessionId
    };

    this.logs.push(logEntry);

    // Console output with styling
    const styles = {
      'ANALYSIS_START': 'color: #4CAF50; font-weight: bold',
      'REQUEST': 'color: #2196F3',
      'RESPONSE': 'color: #00BCD4',
      'ERROR': 'color: #F44336; font-weight: bold',
      'WARNING': 'color: #FF9800',
      'VALIDATION': 'color: #9C27B0',
      'PERFORMANCE': 'color: #795548',
      'ANALYSIS_END': 'color: #4CAF50; font-weight: bold'
    };

    const style = styles[type] || 'color: #666';

    console.group(`%c[What-If ${type}] ${new Date().toLocaleTimeString()}`, style);
    console.log('Data:', data);

    // Add detailed logging for specific types
    if (type === 'REQUEST') {
      console.log('Payload:', JSON.stringify(data.payload, null, 2));
      console.log('Headers:', data.headers);
    } else if (type === 'RESPONSE') {
      console.log('Status:', data.status);
      console.log('Duration:', data.duration);
      if (data.response) {
        console.log('Response Data:', data.response);
      }
    } else if (type === 'ERROR') {
      console.error('Error Details:', data.error);
      if (data.stack) {
        console.error('Stack Trace:', data.stack);
      }
    }

    console.groupEnd();
  }

  logRequest(url, method, payload, headers) {
    this.log('REQUEST', {
      url,
      method,
      payload,
      headers: this.sanitizeHeaders(headers),
      timestamp: Date.now()
    });

    if (this.currentAnalysis) {
      this.currentAnalysis.steps.push({
        type: 'request',
        timestamp: Date.now(),
        data: { url, method, payload }
      });
    }
  }

  logResponse(status, data, duration) {
    this.log('RESPONSE', {
      status,
      response: data,
      duration: `${duration}ms`,
      timestamp: Date.now()
    });

    if (this.currentAnalysis) {
      this.currentAnalysis.steps.push({
        type: 'response',
        timestamp: Date.now(),
        data: { status, response: data, duration }
      });
    }
  }

  logError(error, context) {
    this.log('ERROR', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      responseData: error.response?.data,
      context,
      stack: error.stack,
      timestamp: Date.now()
    });

    if (this.currentAnalysis) {
      this.currentAnalysis.steps.push({
        type: 'error',
        timestamp: Date.now(),
        data: { error: error.message, context }
      });
    }
  }

  logValidation(field, value, isValid, message) {
    this.log('VALIDATION', {
      field,
      value,
      isValid,
      message,
      timestamp: Date.now()
    });
  }

  logPerformance(label, duration) {
    this.log('PERFORMANCE', {
      label,
      duration: `${duration}ms`,
      slow: duration > 3000,
      timestamp: Date.now()
    });
  }

  endAnalysis(result) {
    if (!this.currentAnalysis) return;

    const duration = Date.now() - this.currentAnalysis.startTime;
    const analysisId = this.currentAnalysis.id;

    // Mark performance end
    performance.mark(`whatif-end-${analysisId}`);
    performance.measure(
      `whatif-analysis-${analysisId}`,
      `whatif-start-${analysisId}`,
      `whatif-end-${analysisId}`
    );

    this.log('ANALYSIS_END', {
      analysisId,
      duration: `${duration}ms`,
      result,
      steps: this.currentAnalysis.steps.length,
      timestamp: new Date().toISOString()
    });

    // Generate analysis report
    this.generateReport();

    this.currentAnalysis = null;
  }

  generateReport() {
    if (!this.currentAnalysis) return;

    const report = {
      analysisId: this.currentAnalysis.id,
      propertyId: this.currentAnalysis.propertyId,
      duration: Date.now() - this.currentAnalysis.startTime,
      steps: this.currentAnalysis.steps,
      params: this.currentAnalysis.params
    };

    console.group(
      '%c📊 What-If Analysis Report',
      'color: #8DA4EF; font-weight: bold; font-size: 16px; padding: 10px'
    );

    console.log('%cAnalysis ID:', 'font-weight: bold', report.analysisId);
    console.log('%cProperty ID:', 'font-weight: bold', report.propertyId);
    console.log('%cTotal Duration:', 'font-weight: bold', `${report.duration}ms`);
    console.log('%cSteps:', 'font-weight: bold', report.steps.length);

    console.group('%c📝 Parameters', 'color: #666; font-weight: bold');
    console.table(report.params);
    console.groupEnd();

    console.group('%c🔄 Execution Steps', 'color: #666; font-weight: bold');
    report.steps.forEach((step, index) => {
      const elapsed = step.timestamp - this.currentAnalysis.startTime;
      console.log(`${index + 1}. [${elapsed}ms] ${step.type}:`, step.data);
    });
    console.groupEnd();

    // Performance metrics
    const perfEntries = performance.getEntriesByName(`whatif-analysis-${report.analysisId}`);
    if (perfEntries.length > 0) {
      console.group('%c⚡ Performance Metrics', 'color: #666; font-weight: bold');
      console.log('Total Time:', perfEntries[0].duration.toFixed(2), 'ms');
      console.groupEnd();
    }

    console.groupEnd();

    return report;
  }

  sanitizeHeaders(headers) {
    if (!headers) return {};
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer [REDACTED]';
    }
    return sanitized;
  }

  exportLogs() {
    const exportData = {
      sessionId: this.sessionId,
      enabled: this.enabled,
      totalLogs: this.logs.length,
      logs: this.logs,
      currentAnalysis: this.currentAnalysis,
      exportTime: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  downloadLogs() {
    const data = this.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatif_debug_${this.sessionId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log(
      '%c📥 What-If Debug Logs Downloaded',
      'color: #4CAF50; font-weight: bold'
    );
  }

  clearLogs() {
    this.logs = [];
    this.currentAnalysis = null;
    console.log('%c🧹 What-If Debug Logs Cleared', 'color: #FF9800');
  }

  disable() {
    this.enabled = false;
    console.log('%c❌ What-If Debugger Disabled', 'color: #F44336');
  }

  enable() {
    this.enabled = true;
    console.log('%c✅ What-If Debugger Enabled', 'color: #4CAF50');
  }

  getStats() {
    const errorCount = this.logs.filter(l => l.type === 'ERROR').length;
    const requestCount = this.logs.filter(l => l.type === 'REQUEST').length;
    const responseCount = this.logs.filter(l => l.type === 'RESPONSE').length;

    const stats = {
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      errors: errorCount,
      requests: requestCount,
      responses: responseCount,
      currentAnalysis: this.currentAnalysis ? this.currentAnalysis.id : null
    };

    console.table(stats);
    return stats;
  }
}

// Create singleton instance
const whatIfDebugger = new WhatIfDebugger();

// Export
export default whatIfDebugger;