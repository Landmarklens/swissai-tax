import { getApiUrl } from '../utils/api/getApiUrl';
import { useTranslation } from 'react-i18next';

const BASE_URL = getApiUrl();

export const getCounter = `${BASE_URL}/counter`;
export const getTestimonilsRoute = `${BASE_URL}/testimonials`;
export const getPlanRoute = `${BASE_URL}/plan`;
export const getTeamRoute = `${BASE_URL}/team`;
export const stepperRoute = `${BASE_URL}/stepper`;
export const getQuestionRoute = `${BASE_URL}/question`;
export const getInsightsRoute = `${BASE_URL}/insights`;
