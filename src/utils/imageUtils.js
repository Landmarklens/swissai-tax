/**
 * Utility functions for image optimization
 */

/**
 * Check if browser supports WebP format
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
};

/**
 * Generate WebP URL from regular image URL
 * Assumes backend serves WebP versions with .webp extension
 */
export const getWebPUrl = (originalUrl) => {
  if (!originalUrl || !supportsWebP()) return originalUrl;

  // Skip SVG files
  if (originalUrl.endsWith('.svg')) return originalUrl;

  // Replace extension with .webp
  const webpUrl = originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  return webpUrl;
};

/**
 * Generate responsive image srcSet
 * @param {string} baseUrl - Base image URL
 * @param {number[]} widths - Array of widths to generate
 * @returns {string} srcSet string for responsive images
 */
export const generateSrcSet = (baseUrl, widths = [320, 640, 960, 1280, 1920]) => {
  if (!baseUrl) return '';

  return widths
    .map(width => {
      // Assume backend can serve different sizes with query params
      // or path modification like image_320w.jpg
      const url = baseUrl.includes('?')
        ? `${baseUrl}&w=${width}`
        : `${baseUrl}?w=${width}`;
      return `${url} ${width}w`;
    })
    .join(', ');
};

/**
 * Generate sizes attribute for responsive images
 * @param {Object} breakpoints - Object with breakpoint configurations
 * @returns {string} sizes attribute value
 */
export const generateSizes = (breakpoints = {}) => {
  const defaultBreakpoints = {
    xs: '100vw',
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
    xl: '25vw',
  };

  const merged = { ...defaultBreakpoints, ...breakpoints };

  return Object.entries(merged)
    .map(([breakpoint, size]) => {
      const width = getBreakpointWidth(breakpoint);
      return width ? `(max-width: ${width}px) ${size}` : size;
    })
    .filter(Boolean)
    .join(', ');
};

/**
 * Get pixel width for breakpoint name
 */
const getBreakpointWidth = (breakpoint) => {
  const widths = {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  };
  return widths[breakpoint];
};

/**
 * Preload critical images
 * @param {string[]} imageUrls - Array of image URLs to preload
 */
export const preloadImages = (imageUrls) => {
  if (typeof window === 'undefined') return;

  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;

    // Add WebP preload if supported
    if (supportsWebP() && !url.endsWith('.svg')) {
      const webpLink = document.createElement('link');
      webpLink.rel = 'preload';
      webpLink.as = 'image';
      webpLink.type = 'image/webp';
      webpLink.href = getWebPUrl(url);
      document.head.appendChild(webpLink);
    }

    document.head.appendChild(link);
  });
};

/**
 * Optimize image loading based on priority
 * @param {string} priority - 'high', 'low', or 'auto'
 */
export const getLoadingStrategy = (priority) => {
  switch(priority) {
    case 'high':
      return { loading: 'eager', fetchPriority: 'high' };
    case 'low':
      return { loading: 'lazy', fetchPriority: 'low' };
    default:
      return { loading: 'lazy', fetchPriority: 'auto' };
  }
};

/**
 * Get optimal image format based on browser support
 */
export const getOptimalFormat = (originalFormat) => {
  if (supportsWebP() && !['svg', 'gif'].includes(originalFormat)) {
    return 'webp';
  }
  return originalFormat;
};