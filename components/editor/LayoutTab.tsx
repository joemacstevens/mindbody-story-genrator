import React from 'react';
import { Slider, ToggleSwitch, Button } from '../ui';
import type { Style } from '../../types';
import { cn } from '../../utils/cn';

interface LayoutTabProps {
  style: Style;
  onUpdate: (updates: Partial<Style>) => void;
}

const spacingOptions: Array<{ id: NonNullable<Style['spacing']>; label: string; description: string }> = [
  { id: 'compact', label: 'Compact', description: 'Tighter spacing for dense schedules' },
  { id: 'comfortable', label: 'Comfortable', description: 'Balanced spacing for most templates' },
  { id: 'spacious', label: 'Spacious', description: 'Generous spacing with more breathing room' },
];

const layoutOptions: Array<{ id: NonNullable<Style['layoutStyle']>; label: string; icon: string }> = [
  { id: 'grid', label: 'Grid', icon: '▦' },
  { id: 'list', label: 'List', icon: '☰' },
  { id: 'card', label: 'Card', icon: '▢' },
];

const dividerOptions: Array<{ id: NonNullable<Style['dividerStyle']>; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'thin', label: 'Thin' },
  { id: 'thick', label: 'Thick' },
  { id: 'dotted', label: 'Dotted' },
];

const Section: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({
  title,
  description,
  children,
}) => (
  <section className="mb-7">
    <div className="mb-3.5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</h3>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
    </div>
    {children}
  </section>
);

export const LayoutTab: React.FC<LayoutTabProps> = ({ style, onUpdate }) => {
  const cornerRadius = style.cardCornerRadius ?? 24;
  const spacing = style.spacing ?? 'comfortable';
  const layoutStyle = style.layoutStyle ?? 'list';

  return (
    <div className="space-y-7">
      <Section title="Corners & Shape">
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm text-slate-300 mb-3">
            <span>Corner Radius</span>
            <span className="text-purple-400 font-medium">{Math.round(cornerRadius)}px</span>
          </div>
          <Slider min={0} max={40} value={cornerRadius} onChange={(value) => onUpdate({ cardCornerRadius: value })} />
        </div>

        <div className="mb-5">
          <p className="text-sm text-slate-300 mb-3">Spacing & Density</p>
          <div className="grid grid-cols-3 gap-2">
            {spacingOptions.map((option) => {
              const selected = spacing === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onUpdate({ spacing: option.id })}
                  className={cn(
                    'rounded-lg border-2 px-3 py-3 text-center text-sm transition-all duration-200',
                    'hover:border-purple-500/50 hover:text-slate-50',
                    selected 
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                      : 'border-white/10 bg-white/5 text-slate-400',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm text-slate-300 mb-3">Layout Style</p>
          <div className="grid grid-cols-3 gap-2">
            {layoutOptions.map((option) => {
              const selected = layoutStyle === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onUpdate({ layoutStyle: option.id })}
                  className={cn(
                    'rounded-lg border-2 px-3 py-3 text-center text-sm transition-all duration-200',
                    'hover:border-purple-500/50 hover:text-slate-50',
                    selected 
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                      : 'border-white/10 bg-white/5 text-slate-400',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm text-slate-300 mb-3">Divider Style</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dividerOptions.map((option) => {
              const selected = style.dividerStyle === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onUpdate({ dividerStyle: option.id })}
                  className={cn(
                    'rounded-lg border-2 px-3 py-3 text-center text-sm transition-all duration-200',
                    'hover:border-purple-500/50 hover:text-slate-50',
                    selected 
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                      : 'border-white/10 bg-white/5 text-slate-400',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Accent Lines</span>
            <ToggleSwitch
              checked={Boolean(style.accentLines)}
              onChange={(checked) => onUpdate({ accentLines: checked })}
              label="Toggle accent lines"
            />
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Footer Bar</span>
            <ToggleSwitch
              checked={Boolean(style.footerBar)}
              onChange={(checked) => onUpdate({ footerBar: checked })}
              label="Toggle footer bar"
            />
          </div>
        </div>
      </Section>
    </div>
  );
};

export default LayoutTab;
