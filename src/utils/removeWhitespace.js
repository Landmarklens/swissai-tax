export function removeWhitespace(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/\s+/g, '');
}
