import React from 'react';
import type { Schedule, Style, ScheduleElementId, ScheduleElementStyle } from '../../types';
import { cn } from '../../utils/cn';
import { CONTENT_ELEMENT_META, getDefaultElementStyle } from './contentElements';

type DeviceOption = 'mobile' | 'tablet' | 'desktop';

interface SchedulePreviewProps {
  schedule: Schedule;
  style: Style;
  device: DeviceOption;
  visibleElements: ScheduleElementId[];
  elementStyles: Record<ScheduleElementId, ScheduleElementStyle>;
}

const devicePadding: Record<DeviceOption, string> = {
  mobile: 'px-8 py-10',
  tablet: 'px-12 py-12',
  desktop: 'px-16 py-14',
};

const dividerClass: Record<NonNullable<Style['dividerStyle']>, string> = {
  none: 'border-none',
  thin: 'border-t border-border-light/40',
  thick: 'border-t-2 border-border-light/60',
  dotted: 'border-t border-dotted border-border-light/40',
};

const getReadableTextColor = (color: string, fallback: string): string => {
  if (!color || !color.startsWith('#')) return fallback;
  const hex = color.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex.padEnd(6, '0');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return fallback;

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#F8FAFC';
};

export const SchedulePreview: React.FC<SchedulePreviewProps> = ({
  schedule,
  style,
  device,
  visibleElements,
  elementStyles,
}) => {
  const showHeading = style.showHeading !== false;
  const showSubtitle = style.showSubtitle !== false;
  const showSchedule = style.showSchedule !== false;
  const showFooter = style.showFooter !== false;

  const hasBackgroundImage = Boolean(style.bgImage);
  const accentTextColor = getReadableTextColor(style.accent, style.backgroundColor);

  const backgroundStyles: React.CSSProperties = {
    fontFamily: style.fontFamily,
    color: style.textColorPrimary,
    backgroundColor: style.backgroundColor,
    backgroundImage: hasBackgroundImage
      ? style.overlayColor && style.overlayColor !== 'rgba(0, 0, 0, 0)'
        ? `linear-gradient(${style.overlayColor}, ${style.overlayColor}), url(${style.bgImage})`
        : `url(${style.bgImage})`
      : undefined,
    backgroundSize: style.bgFit ?? 'cover',
    backgroundPosition: style.bgPosition ?? '50% 50%',
    backgroundRepeat: 'no-repeat',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  };

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-[inherit]',
        devicePadding[device],
      )}
      style={backgroundStyles}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_bottom,rgba(139,123,216,0.08),transparent_60%)] opacity-40" />
      <div className="relative z-10 flex h-full flex-col gap-6">
        {(showHeading || showSubtitle) && (
          <header className="space-y-2 text-center" style={{ color: style.textColorPrimary }}>
            {showHeading && (
              <h1
                className="text-4xl font-bold tracking-tight sm:text-5xl"
                style={{ color: style.textColorPrimary, fontWeight: style.headingWeight ?? '700', transition: 'color 0.3s ease' }}
              >
                {style.heading}
              </h1>
            )}
            <p className="text-sm uppercase tracking-[0.4em] text-text-tertiary">{schedule.date}</p>
            {showSubtitle && (
              <p
                className="text-base text-text-secondary"
                style={{ color: style.textColorSecondary, transition: 'color 0.3s ease' }}
              >
                {style.subtitle}
              </p>
            )}
          </header>
        )}

        {style.dividerStyle && style.dividerStyle !== 'none' && (
          <div
            className={cn('opacity-80', dividerClass[style.dividerStyle])}
            style={{ borderColor: style.textColorSecondary }}
          />
        )}

        {showSchedule && (
          <main className="flex-1 space-y-6 overflow-hidden">
            {schedule.items.length === 0 ? (
              <div
                className="flex h-full flex-col items-center justify-center rounded-3xl border border-border-light/40 p-8 text-sm text-text-tertiary"
                style={{ backgroundColor: style.cardBackgroundColor }}
              >
                Add classes on the right to see them previewed here.
              </div>
            ) : (
              <ul className="grid gap-4">
                {schedule.items.map((item, index) => {
                  const renderedElements = visibleElements.reduce<
                    Array<{ id: ScheduleElementId; node: React.ReactNode }>
                  >((acc, elementId) => {
                    const meta = CONTENT_ELEMENT_META[elementId];
                    if (!meta) return acc;
                    const rawValue = item[meta.field];
                    if (!rawValue) return acc;

                    const elementStyle = elementStyles[elementId] ?? getDefaultElementStyle(elementId);
                    const fontSizePx = elementStyle.fontSize ?? meta.defaultFontSize ?? 16;
                    const fontWeight = elementStyle.fontWeight ?? meta.defaultFontWeight ?? 500;
                    const letterSpacingValue = `${(
                      elementStyle.letterSpacing ?? meta.defaultLetterSpacing ?? 0
                    ).toFixed(2)}px`;
                    const lineHeightValue = elementStyle.lineHeight ?? meta.defaultLineHeight ?? 1.3;
                    const textColor = elementStyle.color ?? meta.defaultColor ?? style.textColorSecondary;

                    let node: React.ReactNode | null = null;

                    switch (elementId) {
                      case 'time':
                        node = (
                          <div
                            className="inline-flex min-w-[88px] items-center justify-center rounded-2xl px-4 py-3 font-semibold shadow-inner"
                            style={{
                              backgroundColor: style.accent,
                              color: elementStyle.color || accentTextColor,
                              fontSize: `${fontSizePx}px`,
                              fontWeight,
                              letterSpacing: letterSpacingValue,
                              lineHeight: lineHeightValue,
                              transition:
                                'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
                            }}
                          >
                            {rawValue}
                          </div>
                        );
                        break;
                      case 'className':
                        node = (
                          <p
                            className="font-semibold"
                            style={{
                              fontSize: `${fontSizePx}px`,
                              fontWeight,
                              letterSpacing: letterSpacingValue,
                              lineHeight: lineHeightValue,
                              color: textColor ?? style.textColorPrimary,
                              transition: 'color 0.3s ease',
                            }}
                          >
                            {rawValue}
                          </p>
                        );
                        break;
                      case 'instructor':
                        node = (
                          <p
                            style={{
                              fontSize: `${fontSizePx}px`,
                              fontWeight,
                              letterSpacing: letterSpacingValue,
                              lineHeight: lineHeightValue,
                              color: textColor ?? style.textColorSecondary,
                              transition: 'color 0.3s ease',
                            }}
                          >
                            with {rawValue}
                          </p>
                        );
                        break;
                      case 'location':
                        node = (
                          <p
                            style={{
                              fontSize: `${fontSizePx}px`,
                              fontWeight,
                              letterSpacing: letterSpacingValue,
                              lineHeight: lineHeightValue,
                              color: textColor ?? style.textColorSecondary,
                              transition: 'color 0.3s ease',
                            }}
                          >
                            📍 {rawValue}
                          </p>
                        );
                        break;
                      case 'duration':
                        node = (
                          <p
                            style={{
                              fontSize: `${fontSizePx}px`,
                              fontWeight,
                              letterSpacing: letterSpacingValue,
                              lineHeight: lineHeightValue,
                              color: textColor ?? style.textColorSecondary,
                              transition: 'color 0.3s ease',
                            }}
                          >
                            ⏱️ {rawValue}
                          </p>
                        );
                        break;
                      case 'description':
                        node = (
                          <p
                            style={{
                              fontSize: `${fontSizePx}px`,
                              fontWeight,
                              letterSpacing: letterSpacingValue,
                              lineHeight: lineHeightValue,
                              color: textColor ?? style.textColorSecondary,
                              transition: 'color 0.3s ease',
                            }}
                          >
                            {rawValue}
                          </p>
                        );
                        break;
                      default:
                        break;
                    }

                    if (node) {
                      acc.push({ id: elementId, node });
                    }

                    return acc;
                  }, []);

                  const timeNodes = renderedElements.filter((element) => element.id === 'time');
                  const textNodes = renderedElements.filter((element) => element.id !== 'time');

                  return (
                    <li
                      key={`${item.time}-${index}`}
                      className="group flex rounded-3xl border p-5 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                      style={{
                        backgroundColor: style.cardBackgroundColor,
                        borderColor: 'rgba(255,255,255,0.08)',
                        animation: `slide-up-fade 0.6s ease ${index * 0.08}s both`,
                        transition: 'background-color 0.3s ease, border-color 0.3s ease',
                      }}
                    >
                      <div className="flex w-full items-start gap-4">
                        {timeNodes.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {timeNodes.map((element, idx) => (
                              <React.Fragment key={`${element.id}-${idx}`}>{element.node}</React.Fragment>
                            ))}
                          </div>
                        ) : null}
                        {textNodes.length > 0 ? (
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            {textNodes.map((element, idx) => (
                              <React.Fragment key={`${element.id}-${idx}`}>{element.node}</React.Fragment>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </main>
        )}

        {showFooter && (
          <footer className="mt-auto flex flex-col gap-3 text-sm text-text-tertiary">
            {style.footerBar && (
              <div
                className="h-2 rounded-full"
                style={{ backgroundColor: style.accent, transition: 'background-color 0.3s ease' }}
              />
            )}
            <p style={{ color: style.textColorSecondary, transition: 'color 0.3s ease' }}>{style.footer}</p>
          </footer>
        )}
      </div>
    </div>
  );
};

export default SchedulePreview;
