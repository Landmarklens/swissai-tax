import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export const valueFromUserData = (key) => {
  const { t } = useTranslation();
  const UserData = localStorage.getItem('userData');
  if (UserData !== undefined && UserData !== null) {
    return UserData[key];
  } else {
    return '';
  }
};

export const setLocalData = (key, value) => {
  localStorage.setItem(key, value);
};

export const removeLocalData = (key) => {
  localStorage.removeItem(key);
};

export const errorHandler = (error) => {
  if (error.response) {
    // Server responded with a status code other than 2xx
    const { status, data } = error.response;

    switch (status) {
      case 400:
        toast.error('Bad Request: Please check your input.');
        break;
      case 401:
        toast.error('Unauthorized: Please log in.');
        break;
      case 403:
        toast.error("Forbidden: You don't have permission.");
        break;
      case 404:
        toast.error('Not Found: The resource could not be found.');
        break;
      case 500:
        toast.error('Internal Server Error: Please try again later.');
        break;
      default:
        toast.error(`Error: ${data.message || 'Something went wrong.'}`);
        break;
    }
  } else if (error.request) {
    // Request was made but no response received
    toast.error('No response received from server.');
  } else {
    // Something happened in setting up the request
    toast.error(`Error: ${error.message}`);
  }
};

export const numberFormatter = (price, separator = ',') => {
  if (!price) return null;

  return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};
