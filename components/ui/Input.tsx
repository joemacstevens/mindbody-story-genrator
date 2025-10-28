import React from 'react';
import type { InputHTMLAttributes, ReactNode, ForwardedRef } from 'react';
import { cn } from '../../utils/cn';

type InputVariant = 'text' | 'search' | 'url';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  icon?: ReactNode;
  error?: string | null;
  helpText?: string | null;
}

const variantIconDefaults: Partial<Record<InputVariant, ReactNode>> = {
  search: (
    <svg
      className="h-4 w-4 text-text-tertiary"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="9" cy="9" r="5.5" />
      <line x1="13.5" y1="13.5" x2="18" y2="18" strokeLinecap="round" />
    </svg>
  ),
  url: (
    <svg
      className="h-4 w-4 text-text-tertiary"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M7.5 12.5 12.5 7.5" strokeLinecap="round" />
      <path
        d="M5.5 4.5h3a3 3 0 0 1 0 6h-3a3 3 0 0 1 0-6Zm9 5h-3a3 3 0 0 0 0 6h3a3 3 0 0 0 0-6Z"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const InputBase = (
  { variant = 'text', icon, error, helpText, className, value, ...rest }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
) => {
  const resolvedIcon = icon ?? variantIconDefaults[variant];
  const hasValue = value != null && `${value}`.length > 0;
  const showError = Boolean(error);

  return (
    <label className="block w-full space-y-2">
      <div
        className={cn(
          'relative flex items-center rounded-2xl border bg-surface text-text-primary transition-shadow',
          'focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(139,123,216,0.15)]',
          showError ? 'border-accent-red' : hasValue ? 'border-border-primary' : 'border-border-light',
          'disabled:opacity-60 disabled:cursor-not-allowed',
        )}
      >
        {resolvedIcon && (
          <span className="pointer-events-none pl-4">
            {resolvedIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'peer w-full bg-transparent px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none',
            resolvedIcon ? 'pl-3' : 'pl-4',
            className,
          )}
          value={value}
          {...rest}
        />
      </div>
      {showError ? (
        <p className="text-xs font-medium text-accent-red">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-text-tertiary">{helpText}</p>
      ) : null}
    </label>
  );
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(InputBase);

Input.displayName = 'Input';

export default Input;
