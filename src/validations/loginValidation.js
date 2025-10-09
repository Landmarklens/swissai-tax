import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

export const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required')
    .max(255, 'Email is too long')
    .trim(),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long')
    .required('Password is required')
});
