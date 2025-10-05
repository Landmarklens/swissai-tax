const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const getCounter = `${BASE_URL}/counter`;
export const getTestimonilsRoute = `${BASE_URL}/testimonials`;
export const getPlanRoute = `${BASE_URL}/plan`;
export const getTeamRoute = `${BASE_URL}/team`;
export const stepperRoute = `${BASE_URL}/stepper`;
export const getQuestionRoute = `${BASE_URL}/question`;
export const getInsightsRoute = `${BASE_URL}/insights`;
