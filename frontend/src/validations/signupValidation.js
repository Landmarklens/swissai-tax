import * as Yup from 'yup';

const passwordRules = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
const nameRules = /^[a-zA-Z\s'-]+$/;

export const SignupSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .matches(nameRules, 'First name can only contain letters, spaces, hyphens and apostrophes')
    .required('First name is required')
    .trim(),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .matches(nameRules, 'Last name can only contain letters, spaces, hyphens and apostrophes')
    .required('Last name is required')
    .trim(),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required')
    .max(255, 'Email is too long')
    .trim(),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long')
    .matches(passwordRules, { 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    })
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password')
});
