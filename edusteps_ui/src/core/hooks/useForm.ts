/**
 * useForm Hook
 * Manages form state (values, changes, submission, reset)
 * Works seamlessly with useValidation and useApi hooks
 * 
 * Usage:
 * const { values, errors, setValues, handleChange, handleSubmit } = useForm(
 *   { email: '', password: '' },
 *   async (data) => {
 *     await api.login(data);
 *   },
 *   { errors }
 * );
 */

import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

export interface UseFormOptions {
  errors?: Record<string, string>;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export interface UseFormReturn<T> {
  values: T;
  setValues: (values: T) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => (e: FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
  isSubmitting: boolean;
  errors?: Record<string, string>;
}

export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  options: UseFormOptions = {}
): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { errors = {}, onSuccess, onError } = options;

  /**
   * Handle input change for form fields
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      // Handle checkbox and radio separately
      const fieldValue = type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value;

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));
    },
    []
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void>) =>
      async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Don't submit if there are errors
        if (Object.keys(errors).length > 0) {
          return;
        }

        setIsSubmitting(true);
        try {
          await onSubmit(values);
          onSuccess?.();
        } catch (error) {
          onError?.(error);
        } finally {
          setIsSubmitting(false);
        }
      },
    [values, errors, onSuccess, onError]
  );

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return {
    values,
    setValues,
    handleChange,
    handleSubmit,
    reset,
    isSubmitting,
    errors,
  };
};

export default useForm;
