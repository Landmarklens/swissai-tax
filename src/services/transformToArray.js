export const transformToArray = (obj) => {
  if (!obj) {
    return [];
  }
  return Object.entries(obj).map(([title, value]) => {
    return { title, value };
  });
};
