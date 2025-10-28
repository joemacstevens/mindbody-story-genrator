import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ToggleSwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className,
  ...rest
}) => {
  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        'group relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-primary shadow-[0_4px_12px_rgba(139,123,216,0.35)]' : 'bg-white/10',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          'absolute left-1 h-[18px] w-[18px] rounded-full bg-text-primary shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]',
          checked && 'translate-x-6',
        )}
      />
    </button>
  );
};

export default ToggleSwitch;
