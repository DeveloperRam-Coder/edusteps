import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const getVariantClass = (variant: BadgeProps['variant']) => {
  switch (variant) {
    case 'success':
      return 'bg-successtext-dark-400';
    case 'error':
      return 'bg-dangertext-dark-400';
    case 'warning':
      return 'bg-warningtext-dark-400';
    case 'info':
      return 'bg-infotext-dark-400';
    default:
      return 'bg-primarytext-dark-400';
  }
};

const getSizeClass = (size: BadgeProps['size']) => {
  switch (size) {
    case 'sm':
      return 'px-2 py-1 text-xs';
    case 'lg':
      return 'px-4 py-2 text-sm';
    default:
      return 'px-3 py-1.5 text-xs';
  }
};

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
}) => {
  const variantClass = getVariantClass(variant);
  const sizeClass = getSizeClass(size);

  return (
    <span
      className={`inline-block align-start rounded-full font-semibold ${variantClass} ${sizeClass} border-2 border-white`}
    >
      {label}
    </span>
  );
};

export default Badge;

