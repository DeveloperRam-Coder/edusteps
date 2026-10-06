import React from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

const variantClasses = {
  primary: 'bg-primary text-white shadow-md hover:bg-primary-dark hover:shadow-lg active:scale-98',
  secondary: 'bg-secondary text-white shadow-md hover:bg-secondary-dark hover:shadow-lg active:scale-98',
  outline: 'bg-white border-2 border-primary text-primary hover:bg-gray-50 hover:border-primary-dark hover:text-primary-dark hover:shadow-sm active:bg-gray-100 active:scale-98',
  ghost: 'bg-transparent text-primary hover:bg-gray-50 hover:text-primary-dark active:bg-gray-100 active:scale-98',
  danger: 'bg-danger text-white shadow-md hover:bg-danger-dark hover:shadow-lg active:scale-98',
};

const sizeClasses = {
  sm: 'px-2.5 py-1 text-xs rounded-md h-7 font-medium',
  md: 'px-3.5 py-1.5 text-xs rounded-lg h-8 font-semibold',
  lg: 'px-4 py-2 text-sm rounded-lg h-9 font-semibold',
};

const Button = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = true,
  disabled,
  ...props
}: Props) => {
  const isDisabled = disabled || loading;

  const baseClasses = 'relative rounded font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 overflow-hidden flex items-center justify-center gap-1.5 letter-spacing-0.3px font-family-inter border-2 border-transparent';
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass}`.trim()}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="flex items-center text-base">{icon}</span>}
          {title}
        </>
      )}
    </button>
  );
};

export default Button;
