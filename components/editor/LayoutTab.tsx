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
  <section className="space-y-4 rounded-2xl border border-border-light/70 bg-surface/70 p-5 shadow-sm backdrop-blur">
    <header className="space-y-1">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {description ? <p className="text-xs text-text-tertiary">{description}</p> : null}
    </header>
    {children}
  </section>
);

export const LayoutTab: React.FC<LayoutTabProps> = ({ style, onUpdate }) => {
  const cornerRadius = style.cardCornerRadius ?? 24;
  const spacing = style.spacing ?? 'comfortable';
  const layoutStyle = style.layoutStyle ?? 'list';

  return (
    <div className="space-y-6">
      <Section title="Corners & Shape" description="Dial in the rounded corners and layout structure of your schedule cards.">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            <span>Corner Radius</span>
            <span>{Math.round(cornerRadius)}px</span>
          </div>
          <Slider min={0} max={40} value={cornerRadius} onChange={(value) => onUpdate({ cardCornerRadius: value })} />
        </div>

        <div className="space-y-3 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Layout Style</p>
          <div className="grid grid-cols-3 gap-2">
            {layoutOptions.map((option) => {
              const selected = layoutStyle === option.id;
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate({ layoutStyle: option.id })}
                  className={cn(
                    'flex h-16 flex-col items-center justify-center gap-2 rounded-xl border border-border-light/60 text-xs font-semibold text-text-secondary transition',
                    selected && 'border-primary bg-primary/10 text-primary-light shadow-[0_0_0_2px_rgba(139,123,216,0.15)]',
                  )}
                >
                  <span className="text-base">{option.icon}</span>
                  <span>{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Spacing & Density" description="Choose how much breathing room each class item has.">
        <div className="grid gap-3">
          {spacingOptions.map((option) => {
            const selected = spacing === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onUpdate({ spacing: option.id })}
                className={cn(
                  'flex w-full flex-col gap-1 rounded-2xl border border-border-light/60 bg-surface/60 px-4 py-3 text-left transition-all duration-200',
                  selected ? 'border-primary bg-primary/10 text-primary-light shadow-[0_0_0_2px_rgba(139,123,216,0.15)]' : 'hover:border-primary hover:text-text-primary',
                )}
              >
                <span className="text-sm font-semibold text-text-primary">{option.label}</span>
                <span className="text-xs text-text-tertiary">{option.description}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Dividers & Accents">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Divider Style</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dividerOptions.map((option) => {
              const selected = style.dividerStyle === option.id;
              return (
                <Button
                  key={option.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate({ dividerStyle: option.id })}
                  className={cn(
                    'rounded-xl border border-border-light/60 px-4 py-2 text-sm font-medium text-text-secondary transition',
                    selected && 'border-primary bg-primary/10 text-primary-light shadow-[0_0_0_2px_rgba(139,123,216,0.15)]',
                  )}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary">Accent Lines</p>
              <p className="text-xs text-text-tertiary">Adds subtle left accents to each schedule item.</p>
            </div>
            <ToggleSwitch
              checked={Boolean(style.accentLines)}
              onChange={(checked) => onUpdate({ accentLines: checked })}
              label="Toggle accent lines"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary">Footer Bar</p>
              <p className="text-xs text-text-tertiary">Displays a colored bar above the footer text.</p>
            </div>
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
