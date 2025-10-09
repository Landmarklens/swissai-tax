export function getLocalStorageUser() {
  const { t } = useTranslation();
  const storedData = localStorage.getItem('persist:root');

  const userObject = JSON.parse(storedData);

  return JSON.parse(userObject.account);
}
