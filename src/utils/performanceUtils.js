/**
 * Performance utility functions to replace heavy libraries
 */

/**
 * Debounce function - delays function execution until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
  const { t } = useTranslation();
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits function execution to once per specified time period
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @param {Object} options - Options for throttle behavior
 * @returns {Function} The throttled function with cancel method
 */
export function throttle(func, limit, options = {}) {
  let inThrottle;
  let timeoutId;

  const throttled = function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      timeoutId = setTimeout(() => {
        inThrottle = false;
        timeoutId = null;
      }, limit);
    }
  };

  // Add cancel method to clear the timeout
  throttled.cancel = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      inThrottle = false;
    }
  };

  return throttled;
}

/**
 * Memoize function results for expensive computations
 * @param {Function} fn - The function to memoize
 * @returns {Function} The memoized function
 */
export function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Request Idle Callback wrapper for non-critical tasks
 * @param {Function} callback - The function to execute when idle
 * @param {Object} options - Options for requestIdleCallback
 */
export function whenIdle(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 0);
  }
}

/**
 * Batch DOM updates using requestAnimationFrame
 * @param {Function} callback - The function containing DOM updates
 */
export function batchUpdate(callback) {
  if ('requestAnimationFrame' in window) {
    window.requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 0);
  }
}

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - CSS selector for images to lazy load
 * @param {Object} options - Intersection Observer options
 */
export function lazyLoadImages(selector = 'img[data-lazy]', options = {}) {
  const images = document.querySelectorAll(selector);

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      img.src = img.dataset.src;
      img.classList.remove('lazy');
    });
  }
}