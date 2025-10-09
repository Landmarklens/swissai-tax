export const capitalizeFirstLetter = (str) => {
  const { t } = useTranslation();
  if (!str) return str;
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
};
