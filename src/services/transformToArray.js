export const transformToArray = (obj) => {
  const { t } = useTranslation();
  if (!obj) {
    return [];
  }
  return Object.entries(obj).map(([title, value]) => {
    return { title, value };
  });
};
