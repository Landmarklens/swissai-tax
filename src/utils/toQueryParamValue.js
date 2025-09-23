/**
 * Converts a string to a safe query parameter value.
 * @param {string} input - The input string to convert.
 * @returns {string} - The encoded string, safe for use in query parameters.
 */
export function toQueryParamValue(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  // Trim, encode URI components, replace spaces with %20 (URL standard for spaces)
  return encodeURIComponent(input.trim());
}
