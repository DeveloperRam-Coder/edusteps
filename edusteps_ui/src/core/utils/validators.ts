/**
 * Centralized validation rules
 * All form validation logic in one place
 * Used by useValidation hook
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============ REGEX PATTERNS ============

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+()]+$/;
const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/; // Min 8, 1 upper, 1 lower, 1 digit

// ============ INDIVIDUAL VALIDATORS ============

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }
  return null;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string, fieldName: string = 'Email'): ValidationError | null => {
  if (!email) return null; // Let validateRequired handle empty
  if (!EMAIL_REGEX.test(email)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid email address`,
    };
  }
  return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string, fieldName: string = 'Password'): ValidationError | null => {
  if (!password) return null; // Let validateRequired handle empty
  if (password.length < 8) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least 8 characters`,
    };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      field: fieldName,
      message: `${fieldName} must contain uppercase, lowercase, and numbers`,
    };
  }
  return null;
};

/**
 * Validate passwords match
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string,
  fieldName: string = 'Passwords'
): ValidationError | null => {
  if (password !== confirmPassword) {
    return {
      field: 'confirmPassword',
      message: `${fieldName} do not match`,
    };
  }
  return null;
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string, fieldName: string = 'Phone'): ValidationError | null => {
  if (!phone) return null; // Let validateRequired handle empty
  if (!PHONE_REGEX.test(phone)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid phone number`,
    };
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least 10 digits`,
    };
  }
  return null;
};

/**
 * Validate name (letters and spaces only)
 */
export const validateName = (name: string, fieldName: string = 'Name'): ValidationError | null => {
  if (!name) return null; // Let validateRequired handle empty
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return {
      field: fieldName,
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }
  if (name.trim().length < 2) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least 2 characters`,
    };
  }
  return null;
};

/**
 * Validate URL
 */
export const validateUrl = (url: string, fieldName: string = 'URL'): ValidationError | null => {
  if (!url) return null; // Let validateRequired handle empty
  if (!URL_REGEX.test(url)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid URL`,
    };
  }
  return null;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (
  value: string,
  min: number,
  fieldName: string = 'Field'
): ValidationError | null => {
  if (!value) return null; // Let validateRequired handle empty
  if (value.length < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min} characters`,
    };
  }
  return null;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (
  value: string,
  max: number,
  fieldName: string = 'Field'
): ValidationError | null => {
  if (!value) return null;
  if (value.length > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be no more than ${max} characters`,
    };
  }
  return null;
};

/**
 * Validate number range
 */
export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Field'
): ValidationError | null => {
  if (value == null) return null; // Let validateRequired handle empty
  if (value < min || value > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be between ${min} and ${max}`,
    };
  }
  return null;
};

/**
 * Validate select/choice (not empty)
 */
export const validateSelect = (value: any, fieldName: string = 'Selection'): ValidationError | null => {
  if (!value || value === '' || value === 'null') {
    return {
      field: fieldName,
      message: `Please select a ${fieldName.toLowerCase()}`,
    };
  }
  return null;
};

// ============ FORM-LEVEL VALIDATORS ============

/**
 * Validate login form
 */
export const validateLoginForm = (data: { email: string; password: string }): ValidationResult => {
  const errors: ValidationError[] = [];

  const emailError = validateRequired(data.email, 'Email');
  if (emailError) errors.push(emailError);
  else {
    const emailFormatError = validateEmail(data.email);
    if (emailFormatError) errors.push(emailFormatError);
  }

  const passwordError = validateRequired(data.password, 'Password');
  if (passwordError) errors.push(passwordError);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate register form
 */
export const validateRegisterForm = (data: {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Email
  const emailError = validateRequired(data.email, 'Email');
  if (emailError) errors.push(emailError);
  else {
    const emailFormatError = validateEmail(data.email);
    if (emailFormatError) errors.push(emailFormatError);
  }

  // Name
  const nameError = validateRequired(data.name, 'Name');
  if (nameError) errors.push(nameError);
  else {
    const nameFormatError = validateName(data.name);
    if (nameFormatError) errors.push(nameFormatError);
  }

  // Phone
  const phoneError = validateRequired(data.phone, 'Phone');
  if (phoneError) errors.push(phoneError);
  else {
    const phoneFormatError = validatePhone(data.phone);
    if (phoneFormatError) errors.push(phoneFormatError);
  }

  // Password
  const passwordError = validateRequired(data.password, 'Password');
  if (passwordError) errors.push(passwordError);
  else {
    const passwordStrengthError = validatePassword(data.password);
    if (passwordStrengthError) errors.push(passwordStrengthError);
  }

  // Confirm Password
  const matchError = validatePasswordMatch(data.password, data.confirmPassword);
  if (matchError) errors.push(matchError);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate customer form
 */
export const validateCustomerForm = (data: {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // First name
  const firstNameError = validateRequired(data.first_name, 'First Name');
  if (firstNameError) errors.push(firstNameError);
  else {
    const firstNameFormatError = validateName(data.first_name, 'First Name');
    if (firstNameFormatError) errors.push(firstNameFormatError);
  }

  // Last name (optional but validate if provided)
  if (data.last_name) {
    const lastNameFormatError = validateName(data.last_name, 'Last Name');
    if (lastNameFormatError) errors.push(lastNameFormatError);
  }

  // Email (optional but validate if provided)
  if (data.email) {
    const emailFormatError = validateEmail(data.email);
    if (emailFormatError) errors.push(emailFormatError);
  }

  // Phone
  const phoneError = validateRequired(data.mobile, 'Phone');
  if (phoneError) errors.push(phoneError);
  else {
    const phoneFormatError = validatePhone(data.mobile, 'Phone');
    if (phoneFormatError) errors.push(phoneFormatError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate business details form
 */
export const validateBusinessDetailsForm = (data: {
  name: string;
  industry?: string;
  website?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Business name
  const nameError = validateRequired(data.name, 'Business Name');
  if (nameError) errors.push(nameError);
  else {
    const nameFormatError = validateMinLength(data.name, 2, 'Business Name');
    if (nameFormatError) errors.push(nameFormatError);
  }

  // Website (optional but validate if provided)
  if (data.website) {
    const urlError = validateUrl(data.website);
    if (urlError) errors.push(urlError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get error message for a field
 */
export const getFieldError = (errors: ValidationError[], fieldName: string): string | null => {
  const error = errors.find((e) => e.field === fieldName);
  return error?.message || null;
};

/**
 * Check if field has error
 */
export const hasFieldError = (errors: ValidationError[], fieldName: string): boolean => {
  return errors.some((e) => e.field === fieldName);
};
