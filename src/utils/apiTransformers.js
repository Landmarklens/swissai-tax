/**
 * Transforms JavaScript object keys from camelCase to snake_case
 * @param {Object} obj - Object to transform
 * @returns {Object} Transformed object with snake_case keys
 */
export const toSnakeCase = (obj) => {
  const { t } = useTranslation();
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const snakeCaseObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseObj[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return snakeCaseObj;
};

/**
 * Transforms object keys from snake_case to camelCase
 * @param {Object} obj - Object to transform
 * @returns {Object} Transformed object with camelCase keys
 */
export const toCamelCase = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const camelCaseObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      camelCaseObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return camelCaseObj;
};

/**
 * Wrapper for API requests that handles case transformation
 * @param {Function} apiCall - The API call function
 * @param {Object} data - Data to send (will be converted to snake_case)
 * @returns {Promise} Response data (converted to camelCase)
 */
export const apiRequest = async (apiCall, data) => {
  const transformedData = toSnakeCase(data);
  const response = await apiCall(transformedData);
  return {
    ...response,
    data: toCamelCase(response.data)
  };
};