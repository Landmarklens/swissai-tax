/**
 * Safely parse JSON from localStorage
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - The default value to return if parsing fails
 * @returns {*} The parsed value or default value
 */
export function safeJSONParse(key, defaultValue = null) {
  const { t } = useTranslation();
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse JSON from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely get user object from localStorage
 * @returns {Object|null} The user object or null if not found or invalid
 */
export function getSafeUser() {
  return safeJSONParse('user', {});
}