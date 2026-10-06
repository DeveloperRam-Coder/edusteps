/**
 * useValidation Hook
 * Manages form field validation state
 * 
 * Usage:
 * const { errors, validate, clearError, getFieldError, hasError } = useValidation();
 * 
 * // On blur: validate single field
 * const handleBlur = (e) => {
 *   validate('email', validateEmail(e.target.value));
 * }
 * 
 * // On submit: validate entire form
 * const handleSubmit = (data) => {
 *   const result = validateRegisterForm(data);
 *   if (!result.isValid) {
 *     setErrors(result.errors);
 *     return;
 *   }
 *   // Submit...
 * }
 */

import { useState } from 'react';
import { ValidationError } from '../utils/validators';

export interface UseValidationReturn {
  errors: Record<string, string>;
  setErrors: (errors: ValidationError[]) => void;
  addError: (fieldName: string, message: string) => void;
  clearError: (fieldName: string) => void;
  clearErrors: () => void;
  getFieldError: (fieldName: string) => string | null;
  hasError: (fieldName: string) => boolean;
  hasErrors: () => boolean;
}

export const useValidation = (): UseValidationReturn => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Convert array to object for easy field access
  const errorsObject: Record<string, string> = {};
  errors.forEach((err) => {
    errorsObject[err.field] = err.message;
  });

  /**
   * Add a single field error
   */
  const addError = (fieldName: string, message: string): void => {
    setErrors((prevErrors) => {
      // Remove existing error for this field
      const filtered = prevErrors.filter((e) => e.field !== fieldName);
      return [...filtered, { field: fieldName, message }];
    });
  };

  /**
   * Clear error for a specific field
   */
  const clearError = (fieldName: string): void => {
    setErrors((prevErrors) => prevErrors.filter((e) => e.field !== fieldName));
  };

  /**
   * Clear all errors
   */
  const clearErrors = (): void => {
    setErrors([]);
  };

  /**
   * Get error message for a field
   */
  const getFieldError = (fieldName: string): string | null => {
    const error = errors.find((e) => e.field === fieldName);
    return error?.message || null;
  };

  /**
   * Check if a field has an error
   */
  const hasError = (fieldName: string): boolean => {
    return errors.some((e) => e.field === fieldName);
  };

  /**
   * Check if any errors exist
   */
  const hasErrors = (): boolean => {
    return errors.length > 0;
  };

  return {
    errors: errorsObject,
    setErrors,
    addError,
    clearError,
    clearErrors,
    getFieldError,
    hasError,
    hasErrors: hasErrors,
  };
};

export default useValidation;
