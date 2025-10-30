import React, { useEffect, useState } from 'react';
import type { ScheduleElementId, ScheduleElementMeta, ScheduleElementStyle } from '../../types';
import { Button, Slider } from '../ui';
import { cn } from '../../utils/cn';

interface FontSettingsProps {
  elementId: ScheduleElementId;
  meta: ScheduleElementMeta;
  value: ScheduleElementStyle;
  defaults: ScheduleElementStyle;
  onChange: (value: ScheduleElementStyle) => void;
  onDone: () => void;
  onReset: () => void;
}

const fontWeightOptions = [
  { label: 'Normal', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
];

export const FontSettings: React.FC<FontSettingsProps> = ({
  elementId,
  meta,
  value,
  defaults,
  onChange,
  onDone,
  onReset,
}) => {
  const [fontSize, setFontSize] = useState<number>(value.fontSize);
  const [fontWeight, setFontWeight] = useState<number>(value.fontWeight);
  const [letterSpacing, setLetterSpacing] = useState<number>(value.letterSpacing ?? 0);
  const [lineHeight, setLineHeight] = useState<number>(value.lineHeight ?? 1.3);
  const baseFontSize = defaults.fontSize ?? value.fontSize ?? 16;
  const fontSizeMin = Math.max(10, Math.floor(baseFontSize * 0.5));
  const fontSizeMax = Math.max(42, Math.round(baseFontSize + 28));

  useEffect(() => {
    setFontSize(value.fontSize);
    setFontWeight(value.fontWeight);
    setLetterSpacing(value.letterSpacing ?? defaults.letterSpacing);
    setLineHeight(value.lineHeight ?? defaults.lineHeight);
  }, [elementId, value, defaults]);

  useEffect(() => {
    onChange({
      ...value,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, fontWeight, letterSpacing, lineHeight]);

  const handleReset = () => {
    setFontSize(defaults.fontSize);
    setFontWeight(defaults.fontWeight);
    setLetterSpacing(defaults.letterSpacing);
    setLineHeight(defaults.lineHeight);
    onReset();
  };

  return (
    <div className="space-y-6">
      {meta.description ? (
        <p className="text-xs text-text-tertiary">{meta.description}</p>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          <span>Font Size</span>
          <span>{fontSize}px</span>
        </div>
        <Slider min={fontSizeMin} max={fontSizeMax} value={fontSize} onChange={setFontSize} />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Font Weight</p>
        <div className="grid grid-cols-2 gap-2">
          {fontWeightOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFontWeight(option.value)}
              className={cn(
                'rounded-xl border border-border-light/60 px-4 py-3 text-left text-sm font-medium text-text-secondary transition',
                fontWeight === option.value
                  ? 'border-primary bg-primary/10 text-primary-light shadow-[0_0_0_2px_rgba(139,123,216,0.2)]'
                  : 'hover:border-primary hover:text-text-primary',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          <span>Letter Spacing</span>
          <span>{letterSpacing.toFixed(1)}px</span>
        </div>
        <Slider min={-2} max={6} step={0.5} value={letterSpacing} onChange={setLetterSpacing} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          <span>Line Height</span>
          <span>{lineHeight.toFixed(1)}</span>
        </div>
        <Slider min={1} max={2.5} step={0.1} value={lineHeight} onChange={setLineHeight} />
      </div>

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

export default FontSettings;
