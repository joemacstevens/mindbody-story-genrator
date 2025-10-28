import React from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'py-[10px] px-4 text-[14px]',
  md: 'py-3 px-5 text-[15px]',
  lg: 'py-[14px] px-6 text-[16px]',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-primary-dark text-text-primary shadow-primary hover:-translate-y-[2px] hover:shadow-xl',
  secondary:
    'bg-surface text-text-primary border border-border-light hover:bg-surface-hover hover:-translate-y-[1px] hover:shadow-md',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary hover:-translate-y-[1px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className,
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={rest.type ?? 'button'}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-3xl font-semibold transition-all duration-200 ease-out will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"
          aria-hidden="true"
        />
      )}
      {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
      <span className={loading ? 'opacity-0' : undefined}>{children}</span>
    </button>
  );
};

export default Button;
