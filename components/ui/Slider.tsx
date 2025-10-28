import React from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

export const Slider: React.FC<SliderProps> = ({ value, onChange, min, max, step = 1, className, ...rest }) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className={cn(
        'slider w-full appearance-none rounded-full bg-white/10',
        'h-[6px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...rest}
    />
  );
};

export default Slider;
