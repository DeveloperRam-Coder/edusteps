import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  padding?: boolean;
  gradient?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  padding = true,
  gradient = false,
  className,
  ...props
}) => {
  return (
    <div
      className={`
        bg-card rounded-xl my-1.5 sm:my-2
        border border-border
        shadow-sm hover:border-primary/50 hover:shadow transition-all duration-150
        overflow-hidden
        relative
        ${gradient ? 'bg-muted/40' : ''}
        ${padding ? 'p-3 sm:p-4' : ''}
        ${className || ''}
      `.trim()}
      {...props}
    >
      {title && <h2 className="text-xs sm:text-sm font-bold text-foreground mb-2.5 tracking-tight">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
