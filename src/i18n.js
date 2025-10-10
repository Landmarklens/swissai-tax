import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';
import translationFR from './locales/fr/translation.json';
import translationDE from './locales/de/translation.json';

const resources = {
  en: { translation: translationEN },
  fr: { translation: translationFR },
  it: { translation: translationIT },
  de: { translation: translationDE }
};

const lng = localStorage.getItem('i18nextLng') || 'de';

i18n.use(initReactI18next).init({
  resources,
  lng,
  fallbackLng: 'de',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
