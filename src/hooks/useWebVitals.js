import { useEffect } from 'react';
import { getCLS, getFID, getLCP, getTTFB, getFCP } from 'web-vitals';

/**
 * Custom hook to measure and report Core Web Vitals
 * @param {Function} onReport - Callback function to handle metrics
 * @param {boolean} logToConsole - Whether to log metrics to console
 */
export const useWebVitals = (onReport, logToConsole = true) => {
  useEffect(() => {
    const handleReport = (metric) => {
      // Log to console if enabled
      if (logToConsole) {
        const rating = metric.rating || (metric.value < metric.entries[0]?.target ? 'good' : 'needs-improvement');
        console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${rating})`, {
          metric: metric.name,
          value: metric.value,
          rating,
          entries: metric.entries
        });
      }

      // Call custom report handler if provided
      if (onReport) {
        onReport(metric);
      }

      // Send to analytics if available
      if (window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }
    };

    // Measure all Core Web Vitals
    getCLS(handleReport);  // Cumulative Layout Shift
    getFID(handleReport);  // First Input Delay
    getLCP(handleReport);  // Largest Contentful Paint
    getFCP(handleReport);  // First Contentful Paint
    getTTFB(handleReport); // Time to First Byte
  }, [onReport, logToConsole]);
};

/**
 * Get current performance metrics
 */
export const getPerformanceMetrics = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.fetchStart,

    // Paint timing
    fp: paint?.find(entry => entry.name === 'first-paint')?.startTime,
    fcp: paint?.find(entry => entry.name === 'first-contentful-paint')?.startTime,

    // DOM timing
    domInteractive: navigation?.domInteractive - navigation?.fetchStart,
    domComplete: navigation?.domComplete - navigation?.fetchStart,
    loadComplete: navigation?.loadEventEnd - navigation?.fetchStart,

    // Resource timing
    resources: performance.getEntriesByType('resource').length,

    // Memory (if available)
    memory: performance.memory ? {
      usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
    } : null
  };
};

/**
 * Format performance metrics for display
 */
export const formatMetrics = (metrics) => {
  if (!metrics) return 'No metrics available';

  return {
    'DNS Lookup': `${metrics.dns?.toFixed(2)}ms`,
    'TCP Connection': `${metrics.tcp?.toFixed(2)}ms`,
    'Time to First Byte': `${metrics.ttfb?.toFixed(2)}ms`,
    'First Paint': `${metrics.fp?.toFixed(2)}ms`,
    'First Contentful Paint': `${metrics.fcp?.toFixed(2)}ms`,
    'DOM Interactive': `${metrics.domInteractive?.toFixed(2)}ms`,
    'DOM Complete': `${metrics.domComplete?.toFixed(2)}ms`,
    'Page Load Complete': `${metrics.loadComplete?.toFixed(2)}ms`,
    'Total Resources': metrics.resources,
    'Memory Usage': metrics.memory ? `${metrics.memory.usedJSHeapSize}MB / ${metrics.memory.jsHeapSizeLimit}MB` : 'N/A'
  };
};

export default useWebVitals;