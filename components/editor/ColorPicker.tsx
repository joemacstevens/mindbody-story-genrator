import React, { useState, useEffect } from 'react';
import type { ScheduleElementId, ScheduleElementMeta } from '../../types';
import { Button } from '../ui';
import { cn } from '../../utils/cn';

interface ColorPickerProps {
  elementId: ScheduleElementId;
  meta: ScheduleElementMeta;
  color: string;
  defaultColor: string;
  onChange: (color: string) => void;
  onDone: () => void;
  onReset: () => void;
}

const PRESET_COLORS = [
  '#8B7BD8', '#A78BFA', '#6B5BB8',
  '#F8FAFC', '#CBD5E1', '#94A3B8',
  '#FF6B6B', '#EF4444', '#DC2626',
  '#10B981', '#34D399', '#6EE7B7',
  '#3B82F6', '#60A5FA', '#93C5FD',
  '#F59E0B', '#FBBF24', '#FCD34D',
];

const isValidHex = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

export const ColorPicker: React.FC<ColorPickerProps> = ({
  meta,
  color,
  defaultColor,
  onChange,
  onDone,
  onReset,
}) => {
  const [currentColor, setCurrentColor] = useState(color);
  const [textValue, setTextValue] = useState(color.toUpperCase());

  useEffect(() => {
    setCurrentColor(color);
    setTextValue(color.toUpperCase());
  }, [color, meta.id]);

  useEffect(() => {
    if (isValidHex(currentColor)) {
      onChange(currentColor);
    }
  }, [currentColor, onChange]);

  const handlePresetSelect = (preset: string) => {
    setCurrentColor(preset);
    setTextValue(preset.toUpperCase());
  };

  const handleColorInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setCurrentColor(next);
    setTextValue(next.toUpperCase());
  };

  const handleTextInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.toUpperCase();
    setTextValue(next);
    if (isValidHex(next)) {
      setCurrentColor(next);
    }
  };

  const handleReset = () => {
    setCurrentColor(defaultColor);
    setTextValue(defaultColor.toUpperCase());
    onReset();
  };

  return (
    <div className="space-y-6">
      {meta.description ? (
        <p className="text-xs text-text-tertiary">{meta.description}</p>
      ) : null}

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-light/60 bg-surface/70 p-6 text-center">
        <div
          className="h-20 w-20 rounded-2xl border-2 border-border-light/70 shadow-lg"
          style={{ backgroundColor: currentColor }}
        />
        <div className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          Current Color
        </div>
        <div className="font-mono text-sm font-semibold text-text-secondary">
          {textValue}
        </div>
      </div>

      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          Quick Colors
        </div>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((preset) => {
            const selected = preset.toUpperCase() === textValue;
            return (
              <button
                key={preset}
                type="button"
                className={cn(
                  'relative aspect-square rounded-xl border-2 transition-all duration-200',
                  'hover:scale-110 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  selected
                    ? 'border-text-primary shadow-[0_0_0_2px_rgba(248,250,252,0.35)]'
                    : 'border-border-light/80',
                )}
                style={{ backgroundColor: preset }}
                onClick={() => handlePresetSelect(preset)}
              >
                {selected ? (
                  <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-white drop-shadow">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          Custom Color
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={currentColor}
            onChange={handleColorInput}
            className="h-12 w-16 cursor-pointer rounded-xl border-2 border-border-light/70 bg-transparent p-1 transition hover:border-primary"
          />
          <input
            type="text"
            value={textValue}
            onChange={handleTextInput}
            spellCheck={false}
            className="flex-1 rounded-xl border border-border-light/60 bg-surface/70 px-3 py-2 font-mono text-sm uppercase text-text-primary transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/60"
            placeholder="#000000"
          />
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 border-t border-border-light/60 pt-4">
        <Button variant="secondary" size="sm" onClick={handleReset}>
          Reset to Default
        </Button>
        <Button size="sm" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
};

export default ColorPicker;
