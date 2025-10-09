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
  .email(t('validation.email_invalid'))
  .required(t('validation.required'))
  .max(255, t('validation.email_too_long'))
  .trim();

/**
 * Password validation schema with strength requirements
 */
export const createPasswordSchema = (t) => Yup.string()
  .required(t('validation.required'))
  .min(8, t('validation.password_min_length'))
  .matches(/[a-z]/, t('validation.password_lowercase'))
  .matches(/[A-Z]/, t('validation.password_uppercase'))
  .matches(/[0-9]/, t('validation.password_number'))
  .matches(/[^a-zA-Z0-9]/, t('validation.password_special'));

/**
 * Name validation schema
 */
export const createNameSchema = (t) => Yup.string()
  .required(t('validation.required'))
  .min(2, t('validation.name_min_length'))
  .max(50, t('validation.name_max_length'))
  .matches(
    /^[a-zA-ZÀ-ÿ\s'-]+$/,
    t('validation.name_invalid_chars')
  )
  .trim();

/**
 * Swiss AHV/AVS number validation
 */
export const createAhvSchema = (t) => Yup.string()
  .matches(/^756\.\d{4}\.\d{4}\.\d{2}$/, t('validation.ahv_format_invalid'))
  .required(t('validation.required'))
  .test('ahv-checksum', t('validation.ahv_number_invalid'), (value) => {
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
    t('validation.phone_format_invalid')
  )
  .required(t('validation.required'));

/**
 * Swiss postal code validation
 */
export const createPostalCodeSchema = (t) => Yup.string()
  .matches(/^\d{4}$/, t('validation.postal_code_format'))
  .required(t('validation.required'));

/**
 * Canton validation
 */
export const createCantonSchema = (t) => Yup.string()
  .required(t('validation.required'))
  .oneOf(
    ['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'],
    t('validation.canton_invalid')
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
    .oneOf([Yup.ref('password')], t('validation.passwords_must_match'))
    .required(t('validation.required')),
  firstName: createNameSchema(t),
  lastName: createNameSchema(t),
  acceptTerms: Yup.boolean()
    .oneOf([true], t('validation.terms_required'))
    .required(t('validation.required'))
});

/**
 * Login form validation schema
 */
export const createLoginSchema = (t) => Yup.object().shape({
  email: createEmailSchema(t),
  password: Yup.string().required(t('validation.required'))
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
    .oneOf([Yup.ref('password')], t('validation.passwords_must_match'))
    .required(t('validation.required'))
});

/**
 * Profile update validation schema
 */
export const createProfileUpdateSchema = (t) => Yup.object().shape({
  firstName: createNameSchema(t),
  lastName: createNameSchema(t),
  phone: createPhoneSchema(t).nullable(),
  address: Yup.string().max(200, t('validation.address_too_long')).nullable(),
  city: Yup.string().max(100, t('validation.city_too_long')).nullable(),
  postalCode: createPostalCodeSchema(t).nullable(),
  canton: createCantonSchema(t).nullable()
});

/**
 * Password change validation schema
 */
export const createPasswordChangeSchema = (t) => Yup.object().shape({
  currentPassword: Yup.string().required(t('validation.required')),
  newPassword: createPasswordSchema(t),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], t('validation.passwords_must_match'))
    .required(t('validation.required'))
});

/**
 * Tax profile validation schema
 */
export const createTaxProfileSchema = (t) => Yup.object().shape({
  ahv: createAhvSchema(t),
  canton: createCantonSchema(t),
  municipality: Yup.string()
    .required(t('validation.required'))
    .min(2, t('validation.municipality_too_short'))
    .max(100, t('validation.municipality_too_long')),
  postalCode: createPostalCodeSchema(t),
  annualIncome: Yup.number()
    .positive(t('validation.amount_positive'))
    .max(10000000, t('validation.amount_too_large'))
    .required(t('validation.required'))
    .typeError(t('validation.amount_invalid')),
  maritalStatus: Yup.string()
    .required(t('validation.required'))
    .oneOf(['single', 'married', 'divorced', 'widowed'], t('validation.marital_status_invalid')),
  numberOfChildren: Yup.number()
    .min(0, t('validation.children_negative'))
    .max(20, t('validation.children_too_many'))
    .integer(t('validation.must_be_integer'))
    .nullable(),
  taxYear: Yup.number()
    .required(t('validation.required'))
    .min(2020, t('validation.tax_year_too_old'))
    .max(new Date().getFullYear(), t('validation.tax_year_future'))
});

/**
 * Contact form validation schema
 */
export const createContactFormSchema = (t) => Yup.object().shape({
  name: createNameSchema(t),
  email: createEmailSchema(t),
  subject: Yup.string()
    .required(t('validation.required'))
    .min(5, t('validation.subject_too_short'))
    .max(100, t('validation.subject_too_long')),
  message: Yup.string()
    .required(t('validation.required'))
    .min(10, t('validation.message_too_short'))
    .max(1000, t('validation.message_too_long'))
});

/**
 * File upload validation schema
 */
export const createFileUploadSchema = (t) => Yup.object().shape({
  file: Yup.mixed()
    .required(t('validation.file_required'))
    .test('fileSize', t('validation.file_too_large'), (value) => {
      if (!value) return false;
      return value.size <= 10 * 1024 * 1024;
    })
    .test('fileType', t('validation.file_type_invalid'), (value) => {
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
