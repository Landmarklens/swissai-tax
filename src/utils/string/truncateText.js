export const truncateText = (text, maxLength) => {
  const { t } = useTranslation();
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
};
