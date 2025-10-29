import React from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type CardVariant = 'default' | 'interactive' | 'elevated';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'shadow-sm',
  interactive:
    'transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:-translate-y-1 focus-within:shadow-lg',
  elevated: 'shadow-xl',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className,
  children,
  ...rest
}) => {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border-light bg-surface/80 p-6 sm:p-8 lg:p-10 backdrop-blur-2xl transition-all duration-300 ease-out',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
