// Field validation utilities

export const validateEmail = (email) => {
  const { t } = useTranslation();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Allow various phone formats
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateCurrency = (value) => {
  // Check if it's a valid currency format (e.g., 1234.56 or 1,234.56)
  const currencyRegex = /^\d{1,3}(,?\d{3})*(\.\d{2})?$/;
  return currencyRegex.test(value.toString().replace(/[$€£¥]/g, ''));
};

export const validateDate = (date) => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime()) && parsedDate > new Date('1900-01-01');
};

export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') {
    // For signature objects
    if (value.type === 'draw') return !!value.data;
    if (value.type === 'type') return !!value.text;
  }
  return true;
};

export const getFieldType = (fieldName) => {
  // Determine field type based on field name
  const fieldNameLower = fieldName.toLowerCase();
  
  if (fieldNameLower.includes('email')) return 'email';
  if (fieldNameLower.includes('phone') || fieldNameLower.includes('tel')) return 'phone';
  if (fieldNameLower.includes('date') || fieldNameLower.includes('day')) return 'date';
  if (fieldNameLower.includes('amount') || fieldNameLower.includes('price') || 
      fieldNameLower.includes('rent') || fieldNameLower.includes('deposit') ||
      fieldNameLower.includes('fee') || fieldNameLower.includes('cost')) return 'currency';
  if (fieldNameLower.includes('signature')) return 'signature';
  
  return 'text';
};

export const validateField = (fieldName, value, isRequired = false) => {
  const errors = [];
  
  // Check if required
  if (isRequired && !validateRequired(value)) {
    errors.push(`${fieldName.replace(/_/g, ' ')} is required`);
    return errors; // Return early if required field is empty
  }
  
  // Skip type validation if field is empty and not required
  if (!value || value === '') return errors;
  
  const fieldType = getFieldType(fieldName);
  
  switch (fieldType) {
    case 'email':
      if (!validateEmail(value)) {
        errors.push('Please enter a valid email address');
      }
      break;
      
    case 'phone':
      if (!validatePhone(value)) {
        errors.push('Please enter a valid phone number');
      }
      break;
      
    case 'currency':
      if (!validateCurrency(value)) {
        errors.push('Please enter a valid amount (e.g., 1234.56)');
      }
      break;
      
    case 'date':
      if (!validateDate(value)) {
        errors.push('Please enter a valid date');
      }
      break;
      
    case 'signature':
      if (!validateRequired(value)) {
        errors.push('Signature is required');
      }
      break;
  }
  
  return errors;
};

export const validateAllFields = (fields, values) => {
  const allErrors = {};
  let hasErrors = false;
  
  fields.forEach(field => {
    const errors = validateField(field.name, values[field.name], field.required);
    if (errors.length > 0) {
      allErrors[field.name] = errors;
      hasErrors = true;
    }
  });
  
  return { errors: allErrors, isValid: !hasErrors };
};

export const formatCurrency = (value) => {
  // Remove non-numeric characters except decimal point
  const numericValue = value.toString().replace(/[^0-9.]/g, '');
  
  // Format with commas
  const parts = numericValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Limit to 2 decimal places
  if (parts[1]) {
    parts[1] = parts[1].substring(0, 2);
  }
  
  return parts.join('.');
};

export const formatPhone = (value) => {
  // Remove all non-numeric characters
  const phone = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  
  return value;
};

export const formatDate = (value) => {
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }
  return value;
};