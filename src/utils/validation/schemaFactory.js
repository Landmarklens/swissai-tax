/**
 * Validation Schema Factory
 * Creates Yup validation schemas with translated error messages
 *
 * Usage:
 * const schema = createRegistrationSchema(t);
 */

import * as Yup from 'yup';

// ====================
// Basic Field Schema Factories
// ====================

/**
 * Email validation schema with translations
 */
export const createEmailSchema = (t) => Yup.string()
  .email(t('Invalid email address'))
  .required(t('Required'))
  .max(255, t('Email is too long'))
  .trim();

/**
 * Password validation schema with strength requirements
 */
export const createPasswordSchema = (t) => Yup.string()
  .required(t('Required'))
  .min(8, t('Must be at least 8 characters'))
  .matches(/[a-z]/, t('Password must contain at least one lowercase letter'))
  .matches(/[A-Z]/, t('Password must contain at least one uppercase letter'))
  .matches(/[0-9]/, t('Password must contain at least one number'))
  .matches(/[^a-zA-Z0-9]/, t('Password must contain at least one special character'));

/**
 * Name validation schema
 */
export const createNameSchema = (t) => Yup.string()
  .required(t('Required'))
  .min(2, t('Name must be at least 2 characters long'))
  .max(50, t('Name cannot be more than 50 characters'))
  .matches(
    /^[a-zA-ZÀ-ÿ\s'-]+$/,
    t('Name can only contain letters, spaces, hyphens, and apostrophes')
  )
  .trim();

/**
 * Swiss AHV/AVS number validation
 */
export const createAhvSchema = (t) => Yup.string()
  .matches(/^756\.\d{4}\.\d{4}\.\d{2}$/, t('Invalid AHV format'))
  .required(t('Required'))
  .test('ahv-checksum', t('Invalid AHV number'), (value) => {
    if (!value) return false;
    const digits = value.replace(/\./g, '');
    if (digits.length !== 13) return false;

    // EAN-13 checksum validation
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(digits[i]);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum === parseInt(digits[12]);
  });

/**
 * Swiss phone number validation
 */
export const createPhoneSchema = (t) => Yup.string()
  .matches(
    /^(\+41|0041|0)[1-9]\d{8}$/,
    t('Invalid phone number format')
  )
  .required(t('Required'));

/**
 * Swiss postal code validation
 */
export const createPostalCodeSchema = (t) => Yup.string()
  .matches(/^\d{4}$/, t('Postal code must be 4 digits'))
  .required(t('Required'));

/**
 * Canton validation
 */
export const createCantonSchema = (t) => Yup.string()
  .required(t('Required'))
  .oneOf(
    ['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'],
    t('Invalid canton')
  );

// ====================
// Form Schema Factories
// ====================

/**
 * Registration form validation schema
 */
export const createRegistrationSchema = (t) => Yup.object().shape({
  email: createEmailSchema(t),
  password: createPasswordSchema(t),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], t('Passwords must match'))
    .required(t('Required')),
  firstName: createNameSchema(t),
  lastName: createNameSchema(t),
  acceptTerms: Yup.boolean()
    .oneOf([true], t('You must accept the terms'))
    .required(t('Required'))
});

/**
 * Login form validation schema
 */
export const createLoginSchema = (t) => Yup.object().shape({
  email: createEmailSchema(t),
  password: Yup.string().required(t('Required'))
});

/**
 * Password reset request validation schema
 */
export const createPasswordResetRequestSchema = (t) => Yup.object().shape({
  email: createEmailSchema(t)
});

/**
 * Password reset confirmation validation schema
 */
export const createPasswordResetConfirmSchema = (t) => Yup.object().shape({
  password: createPasswordSchema(t),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], t('Passwords must match'))
    .required(t('Required'))
});

/**
 * Profile update validation schema
 */
export const createProfileUpdateSchema = (t) => Yup.object().shape({
  firstName: createNameSchema(t),
  lastName: createNameSchema(t),
  phone: createPhoneSchema(t).nullable(),
  address: Yup.string().max(200, t('Address is too long')).nullable(),
  city: Yup.string().max(100, t('City name is too long')).nullable(),
  postalCode: createPostalCodeSchema(t).nullable(),
  canton: createCantonSchema(t).nullable()
});

/**
 * Password change validation schema
 */
export const createPasswordChangeSchema = (t) => Yup.object().shape({
  currentPassword: Yup.string().required(t('Required')),
  newPassword: createPasswordSchema(t),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], t('Passwords must match'))
    .required(t('Required'))
});

/**
 * Tax profile validation schema
 */
export const createTaxProfileSchema = (t) => Yup.object().shape({
  ahv: createAhvSchema(t),
  canton: createCantonSchema(t),
  municipality: Yup.string()
    .required(t('Required'))
    .min(2, t('Municipality name is too short'))
    .max(100, t('Municipality name is too long')),
  postalCode: createPostalCodeSchema(t),
  annualIncome: Yup.number()
    .positive(t('Amount must be positive'))
    .max(10000000, t('Amount is too large'))
    .required(t('Required'))
    .typeError(t('Invalid amount')),
  maritalStatus: Yup.string()
    .required(t('Required'))
    .oneOf(['single', 'married', 'divorced', 'widowed'], t('Invalid marital status')),
  numberOfChildren: Yup.number()
    .min(0, t('Number of children cannot be negative'))
    .max(20, t('Number of children is too large'))
    .integer(t('Must be a whole number'))
    .nullable(),
  taxYear: Yup.number()
    .required(t('Required'))
    .min(2020, t('Tax year is too old'))
    .max(new Date().getFullYear(), t('Tax year cannot be in the future'))
});

/**
 * Contact form validation schema
 */
export const createContactFormSchema = (t) => Yup.object().shape({
  name: createNameSchema(t),
  email: createEmailSchema(t),
  subject: Yup.string()
    .required(t('Required'))
    .min(5, t('Subject is too short'))
    .max(100, t('Subject is too long')),
  message: Yup.string()
    .required(t('Required'))
    .min(10, t('Message is too short'))
    .max(1000, t('Message is too long'))
});

/**
 * File upload validation schema
 */
export const createFileUploadSchema = (t) => Yup.object().shape({
  file: Yup.mixed()
    .required(t('File is required'))
    .test('fileSize', t('File is too large (max 10MB)'), (value) => {
      if (!value) return false;
      return value.size <= 10 * 1024 * 1024;
    })
    .test('fileType', t('Invalid file type'), (value) => {
      if (!value) return false;
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      return allowedTypes.includes(value.type);
    })
});

export default {
  // Basic field factories
  createEmailSchema,
  createPasswordSchema,
  createNameSchema,
  createAhvSchema,
  createPhoneSchema,
  createPostalCodeSchema,
  createCantonSchema,

  // Form factories
  createRegistrationSchema,
  createLoginSchema,
  createPasswordResetRequestSchema,
  createPasswordResetConfirmSchema,
  createProfileUpdateSchema,
  createPasswordChangeSchema,
  createTaxProfileSchema,
  createContactFormSchema,
  createFileUploadSchema
};
