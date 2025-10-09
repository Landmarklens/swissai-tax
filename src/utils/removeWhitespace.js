export function removeWhitespace(str) {
  const { t } = useTranslation();
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/\s+/g, '');
}
