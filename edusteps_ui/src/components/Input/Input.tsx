import React, { useState } from 'react';
import { LuTriangle } from 'react-icons/lu';

type Props = (React.InputHTMLAttributes<HTMLInputElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement>) & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
};

const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>((
  { label, error, icon, rightIcon, onRightIconPress, multiline, numberOfLines, ...props },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e as any);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e as any);
    }
  };

  return (
    <div className="my-1.5 w-full">
      {label && <label className="text-[11px] font-bold text-foreground/80 mb-1 block tracking-tight">{label}</label>}
      <div
        className={`relative flex flex-row items-center bg-background border rounded-lg px-2.5 transition-all duration-150 box-border h-8 ${
          error
            ? 'border-destructive ring-1 ring-destructive/20'
            : isFocused
            ? 'border-primary ring-1 ring-primary/20'
            : 'border-input hover:border-muted-foreground/40'
        }`}
      >
        {icon && <div className="mr-2 flex items-center text-xs text-muted-foreground flex-shrink-0">{icon}</div>}
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className="flex-1 px-0 py-1.5 text-xs text-foreground border-none bg-transparent outline-none resize-vertical placeholder:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            onFocus={handleFocus}
            onBlur={handleBlur}
            rows={numberOfLines || 3}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className="flex-1 px-0 py-1 text-xs text-foreground border-none bg-transparent outline-none placeholder:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {rightIcon && (
          <button
            type="button"
            className="ml-2 md:ml-2.5 lg:ml-3 px-1.5 py-1.5 flex items-center bg-transparent border-none cursor-pointer text-gray-300 transition-all duration-200 rounded hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
            onClick={onRightIconPress}
          >
            {rightIcon}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger mt-1 font-semibold flex items-center gap-0.75 animate-slideDown md:text-xs md:mt-1.25 lg:text-xs lg:mt-1.5"><LuTriangle className="w-3 h-3 text-danger mr-1" />{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
