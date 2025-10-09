import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook to retrieve the 'token' query parameter from the URL.
 *
 * @returns {string|null} The token if it exists, or null if it doesn't.
 */
export function useTokenFromQuery() {
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  return token;
}
