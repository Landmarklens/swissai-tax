/**
 * Decodes a query parameter value back to a normal string.
 * @param {string} encodedValue - The encoded query parameter value to decode.
 * @returns {string} - The decoded string in its original form.
 */
export function fromQueryParamValue(encodedValue) {
  const { t } = useTranslation();
  if (typeof encodedValue !== 'string') {
    return;
  }

  return decodeURIComponent(encodedValue);
}
