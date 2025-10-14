import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';
import translationFR from './locales/fr/translation.json';
import translationDE from './locales/de/translation.json';
import cantonsEN from './locales/en/cantons.json';
import cantonsDE from './locales/de/cantons.json';
import cantonsFR from './locales/fr/cantons.json';
import cantonsIT from './locales/it/cantons.json';

const resources = {
  en: {
    translation: { ...translationEN, ...cantonsEN }
  },
  fr: {
    translation: { ...translationFR, ...cantonsFR }
  },
  it: {
    translation: { ...translationIT, ...cantonsIT }
  },
  de: {
    translation: { ...translationDE, ...cantonsDE }
  }
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
