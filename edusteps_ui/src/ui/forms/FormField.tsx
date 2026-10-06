/**
 * FormField Component - Unified Form Field
 * Combines FormInput + FormField into single, flexible component
 * Supports standard inputs with validation, icons, helper text, and custom controls
 * 
 * Usage:
 * <FormField
 *   id="email"
 *   label="Email"
 *   type="email"
 *   value={values.email}
 *   onChange={(e) => handleChange(e)}
 *   error={errors.email}
 *   helperText="We'll never share your email"
 *   iconLeft={<Mail />}
 *   required
 * />
 */

import React from "react"
import { Label } from "@/ui/primitives/shadcn"
import { Input } from "@/ui/primitives/shadcn"
import { Spinner } from "@/ui/primitives/shadcn"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string

  // Field metadata
  label?: string
  helperText?: string
  error?: string
  
  // Icons and visual indicators
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  isLoading?: boolean
  
  // Event handlers
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (value: string) => void
  
  // Styling
  inputClassName?: string
  containerClassName?: string
  labelClassName?: string
  
  // Custom rendering
  renderControl?: (props: {
    id: string
    value?: string
    onChange?: (value: string) => void
    onBlur?: React.FocusEventHandler<HTMLInputElement>
    required?: boolean
    disabled?: boolean
    placeholder?: string
    type?: React.InputHTMLAttributes<HTMLInputElement>["type"]
    "aria-invalid"?: boolean
    "aria-describedby"?: string
    className?: string
    autoComplete?: string
  }) => React.ReactNode
  
  // Accessibility
  ariaLabel?: string
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    id,
    label,
    helperText,
    error,
    value,
    onChange,
    onValueChange,
    onBlur,
    type = "text",
    placeholder,
    required,
    disabled,
    autoComplete,
    iconLeft,
    iconRight,
    isLoading,
    ariaLabel,
    renderControl,
    inputClassName,
    containerClassName,
    labelClassName,
    className,
    ...props
  }, ref) => {
    const errorId = error ? `${id}-error` : undefined
    const helperId = helperText ? `${id}-helper` : undefined
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined
    const invalid = Boolean(error)

    const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(ev)
      onValueChange?.(ev.target.value)
    }

    const control = renderControl ? (
      renderControl({
        id,
        value: typeof value === 'string' ? value : value === undefined || value === null ? undefined : String(value),
        onChange: (v) => onValueChange?.(v),
        onBlur,
        required,
        disabled,
        placeholder,
        type,
        "aria-invalid": invalid || undefined,
        "aria-describedby": describedBy,
        className: cn(
          "h-10 w-full",
          invalid ? "border-destructive focus:ring-destructive" : "",
          inputClassName
        ),
        autoComplete,
      })
    ) : (
      <div className="relative">
        {iconLeft && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {iconLeft}
          </div>
        )}
        <Input
          ref={ref}
          id={id}
          value={value ?? ""}
          onChange={handleChange}
          onBlur={onBlur}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            iconLeft ? "pl-10" : "",
            iconRight || isLoading ? "pr-10" : "",
            invalid ? "border-destructive focus:ring-destructive" : "",
            inputClassName,
            className
          )}
          {...props}
        />
        {(isLoading || iconRight) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Spinner size="sm" className="border-2" aria-label="Loading" />
            ) : (
              iconRight
            )}
          </div>
        )}
      </div>
    )

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label
            htmlFor={id}
            className={cn("text-sm font-medium", labelClassName)}
          >
            {label}{" "}
            {required && (
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </Label>
        )}
        {control}
        {helperText && !error && (
          <p
            id={helperId}
            className="text-xs text-muted-foreground flex items-center gap-2"
            aria-live="polite"
          >
            <Info className="h-3.5 w-3.5" />
            <span>{helperText}</span>
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="text-xs text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"

export default FormField
