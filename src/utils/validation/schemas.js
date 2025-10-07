/**
 * Validation Schemas using Yup
 * Provides comprehensive input validation for all forms
 */

import * as Yup from 'yup';

// ====================
// Basic Field Schemas
// ====================

/**
 * Email validation
 */
export const emailSchema = Yup.string()
  .email('validation.email.invalid')
  .required('validation.email.required')
  .max(255, 'validation.email.tooLong')
  .trim();

/**
 * Password validation with strength requirements
 */
export const passwordSchema = Yup.string()
  .required('validation.password.required')
  .min(8, 'validation.password.tooShort')
  .matches(/[a-z]/, 'validation.password.lowercase')
  .matches(/[A-Z]/, 'validation.password.uppercase')
  .matches(/[0-9]/, 'validation.password.number')
  .matches(/[^a-zA-Z0-9]/, 'validation.password.special');

/**
 * Swiss AHV/AVS number validation (756.XXXX.XXXX.XX)
 * Format: 756.1234.5678.90
 */
export const ahvSchema = Yup.string()
  .matches(/^756\.\d{4}\.\d{4}\.\d{2}$/, 'validation.ahv.invalid')
  .required('validation.ahv.required')
  .test('ahv-checksum', 'validation.ahv.invalid', (value) => {
    if (!value) return false;
    // Remove dots and validate checksum
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
 * Supports formats: +41791234567, 0041791234567, 0791234567
 */
export const phoneSchema = Yup.string()
  .matches(
    /^(\+41|0041|0)[1-9]\d{8}$/,
    'validation.phone.invalid'
  )
  .required('validation.phone.required');

/**
 * Swiss postal code validation (4 digits)
 */
export const postalCodeSchema = Yup.string()
  .matches(/^\d{4}$/, 'validation.postalCode.invalid')
  .required('validation.postalCode.required');

/**
 * Swiss IBAN validation
 */
export const ibanSchema = Yup.string()
  .matches(/^CH\d{2}[0-9]{5}[A-Z0-9]{12}$/, 'validation.iban.invalid')
  .required('validation.iban.required');

/**
 * Tax amount validation
 */
export const taxAmountSchema = Yup.number()
  .positive('validation.amount.positive')
  .max(10000000, 'validation.amount.tooLarge')
  .required('validation.amount.required')
  .typeError('validation.amount.invalid');

/**
 * Canton validation
 */
export const cantonSchema = Yup.string()
  .required('validation.canton.required')
  .oneOf(
    ['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'],
    'validation.canton.invalid'
  );

/**
 * Name validation
 */
export const nameSchema = Yup.string()
  .required('validation.name.required')
  .min(2, 'validation.name.tooShort')
  .max(50, 'validation.name.tooLong')
  .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'validation.name.invalid')
  .trim();

/**
 * Date validation
 */
export const dateSchema = Yup.date()
  .required('validation.date.required')
  .max(new Date(), 'validation.date.future')
  .typeError('validation.date.invalid');

// ====================
// Form Schemas
// ====================

/**
 * Registration form validation
 */
export const registrationSchema = Yup.object().shape({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'validation.password.match')
    .required('validation.confirmPassword.required'),
  firstName: nameSchema,
  lastName: nameSchema,
  acceptTerms: Yup.boolean()
    .oneOf([true], 'validation.terms.required')
    .required('validation.terms.required')
});

/**
 * Login form validation
 */
export const loginSchema = Yup.object().shape({
  email: emailSchema,
  password: Yup.string().required('validation.password.required')
  // Don't validate password strength on login
});

/**
 * Password reset request validation
 */
export const passwordResetRequestSchema = Yup.object().shape({
  email: emailSchema
});

/**
 * Password reset confirmation validation
 */
export const passwordResetConfirmSchema = Yup.object().shape({
  password: passwordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'validation.password.match')
    .required('validation.confirmPassword.required')
});

/**
 * Profile update validation
 */
export const profileUpdateSchema = Yup.object().shape({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.nullable(),
  address: Yup.string().max(200, 'validation.address.tooLong').nullable(),
  city: Yup.string().max(100, 'validation.city.tooLong').nullable(),
  postalCode: postalCodeSchema.nullable(),
  canton: cantonSchema.nullable()
});

/**
 * Password change validation
 */
export const passwordChangeSchema = Yup.object().shape({
  currentPassword: Yup.string().required('validation.currentPassword.required'),
  newPassword: passwordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'validation.password.match')
    .required('validation.confirmPassword.required')
});

/**
 * Tax profile validation
 */
export const taxProfileSchema = Yup.object().shape({
  ahv: ahvSchema,
  canton: cantonSchema,
  municipality: Yup.string()
    .required('validation.municipality.required')
    .min(2, 'validation.municipality.tooShort')
    .max(100, 'validation.municipality.tooLong'),
  postalCode: postalCodeSchema,
  annualIncome: taxAmountSchema,
  maritalStatus: Yup.string()
    .required('validation.maritalStatus.required')
    .oneOf(['single', 'married', 'divorced', 'widowed'], 'validation.maritalStatus.invalid'),
  numberOfChildren: Yup.number()
    .min(0, 'validation.children.min')
    .max(20, 'validation.children.max')
    .integer('validation.children.integer')
    .nullable(),
  taxYear: Yup.number()
    .required('validation.taxYear.required')
    .min(2020, 'validation.taxYear.min')
    .max(new Date().getFullYear(), 'validation.taxYear.max')
});

/**
 * Bank account validation (for refunds)
 */
export const bankAccountSchema = Yup.object().shape({
  iban: ibanSchema,
  accountHolder: nameSchema,
  bankName: Yup.string()
    .required('validation.bankName.required')
    .max(100, 'validation.bankName.tooLong')
});

/**
 * Contact form validation
 */
export const contactFormSchema = Yup.object().shape({
  name: nameSchema,
  email: emailSchema,
  subject: Yup.string()
    .required('validation.subject.required')
    .min(5, 'validation.subject.tooShort')
    .max(100, 'validation.subject.tooLong'),
  message: Yup.string()
    .required('validation.message.required')
    .min(10, 'validation.message.tooShort')
    .max(1000, 'validation.message.tooLong')
});

/**
 * File upload validation
 */
export const fileUploadSchema = Yup.object().shape({
  file: Yup.mixed()
    .required('validation.file.required')
    .test('fileSize', 'validation.file.tooLarge', (value) => {
      if (!value) return false;
      return value.size <= 10 * 1024 * 1024; // 10MB
    })
    .test('fileType', 'validation.file.invalidType', (value) => {
      if (!value) return false;
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'application/vnd.ms-excel' // xls
      ];
      return allowedTypes.includes(value.type);
    })
});

/**
 * Tax deduction validation
 */
export const taxDeductionSchema = Yup.object().shape({
  type: Yup.string()
    .required('validation.deductionType.required')
    .oneOf(['medical', 'education', 'charity', 'professional', 'other'], 'validation.deductionType.invalid'),
  amount: taxAmountSchema,
  description: Yup.string()
    .required('validation.description.required')
    .min(10, 'validation.description.tooShort')
    .max(500, 'validation.description.tooLong'),
  date: dateSchema
});

/**
 * Search query validation
 */
export const searchQuerySchema = Yup.object().shape({
  query: Yup.string()
    .required('validation.search.required')
    .min(2, 'validation.search.tooShort')
    .max(100, 'validation.search.tooLong')
    .trim()
});

// ====================
// Partial Schemas for Dynamic Fields
// ====================

/**
 * Validate single field
 * Usage: await validateField(emailSchema, 'test@example.com')
 */
export const validateField = async (schema, value) => {
  try {
    await schema.validate(value);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Validate form object
 * Usage: await validateForm(loginSchema, formData)
 */
export const validateForm = async (schema, data) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { valid: true, errors: {} };
  } catch (error) {
    const errors = {};
    error.inner.forEach((err) => {
      if (err.path) {
        errors[err.path] = err.message;
      }
    });
    return { valid: false, errors };
  }
};

export default {
  // Basic fields
  emailSchema,
  passwordSchema,
  ahvSchema,
  phoneSchema,
  postalCodeSchema,
  ibanSchema,
  taxAmountSchema,
  cantonSchema,
  nameSchema,
  dateSchema,

  // Forms
  registrationSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  taxProfileSchema,
  bankAccountSchema,
  contactFormSchema,
  fileUploadSchema,
  taxDeductionSchema,
  searchQuerySchema,

  // Utilities
  validateField,
  validateForm
};
