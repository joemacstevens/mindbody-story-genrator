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

const SPACING_PRESETS: Record<NonNullable<Style['spacing']>, { itemGap: number; itemPadding: number }> = {
  compact: { itemGap: 8, itemPadding: 14 },
  comfortable: { itemGap: 12, itemPadding: 18 },
  spacious: { itemGap: 18, itemPadding: 24 },
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
  const showScheduleDate = style.showScheduleDate !== false;

  const hasBackgroundImage = Boolean(style.bgImage);
  const accentTextColor = getReadableTextColor(style.accent, style.backgroundColor);
  const cardColorHex = style.cardBackgroundColor ?? '';
  const cardIsLight =
    typeof cardColorHex === 'string' && cardColorHex.startsWith('#')
      ? getReadableTextColor(cardColorHex, '#111827') === '#111827'
      : false;
  const cardBorderColor = cardIsLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.14)';
  const stripeOverlayColor = cardIsLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)';
  const spacingPreset = style.spacing ?? 'comfortable';
  const spacingConfig = SPACING_PRESETS[spacingPreset] ?? SPACING_PRESETS.comfortable;
  const layoutStyle = style.layoutStyle ?? 'list';
  const itemCornerRadius = style.cardCornerRadius ?? 24;

  const classCount = schedule.items.length;
  const clampedClassCount = Math.min(Math.max(classCount || 1, 1), 10);
  const density = (clampedClassCount - 1) / 9;

  const scheduleAreaPercent = 75 + density * 5; // 75% for a single class → 80% for ten classes
  const gapScale = 1.15 - density * 0.45; // generous gaps for few classes, tighter for dense schedules
  const paddingScale = 1.2 - density * 0.35;
  const timeFontScale = 1.08 - density * 0.28;
  const classFontScale = 1.02 - density * 0.24;
  const instructorFontScale = 0.98 - density * 0.2;
  const secondaryFontScale = 0.96 - density * 0.16;
  const lineHeightScale = 1 - density * 0.08;
  const headingElementStyle = elementStyles.heading ?? getDefaultElementStyle('heading');
  const subtitleElementStyle = elementStyles.subtitle ?? getDefaultElementStyle('subtitle');
  const scheduleDateElementStyle =
    elementStyles.scheduleDate ?? getDefaultElementStyle('scheduleDate');
  const footerElementStyle = elementStyles.footer ?? getDefaultElementStyle('footer');

  const scaledItemGap = Math.max(6, Math.round(spacingConfig.itemGap * gapScale));
  const scaledItemPadding = Math.max(12, Math.round(spacingConfig.itemPadding * paddingScale));
  const timePaddingY = Math.max(8, Math.round(14 * paddingScale));
  const timePaddingX = Math.max(12, Math.round(18 * paddingScale));
  const timeMinWidth = Math.max(64, Math.round(88 * paddingScale));
  const innerColumnGap = Math.max(8, Math.round(16 * gapScale));
  const timeStackGap = Math.max(6, Math.round(12 * gapScale));
  const textStackGap = Math.max(6, Math.round(12 * gapScale));
  const accentVerticalInset = Math.max(6, Math.round(scaledItemPadding * 0.45));
  const accentHorizontalOffset = Math.max(10, Math.round(scaledItemPadding * 0.35));

  const showStripedCards = clampedClassCount > 6;

  const getScaledFontSize = (value: number, scale: number, minimum: number) => {
    const scaled = value * scale;
    return Math.max(minimum, Math.round(scaled * 10) / 10);
  };

  const getScaledLineHeight = (value: number | string | undefined) => {
    if (typeof value === 'number') {
      return Math.max(1.1, Number((value * lineHeightScale).toFixed(2)));
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed)) {
        return Math.max(1.1, Number((parsed * lineHeightScale).toFixed(2)));
      }
    }

    return Math.max(1.2, Number((1.3 * lineHeightScale).toFixed(2)));
  };

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
                style={{
                  color: headingElementStyle.color ?? style.textColorPrimary,
                  fontWeight: headingElementStyle.fontWeight ?? Number(style.headingWeight ?? '700'),
                  fontSize: `${headingElementStyle.fontSize}px`,
                  letterSpacing: `${(headingElementStyle.letterSpacing ?? 0).toFixed(2)}px`,
                  lineHeight: headingElementStyle.lineHeight ?? 1.1,
                  transition: 'color 0.3s ease, font-size 0.3s ease',
                }}
              >
                {style.heading}
              </h1>
            )}
            {showScheduleDate && (
              <p
                className="text-sm uppercase"
                style={{
                  color: scheduleDateElementStyle.color ?? style.textColorSecondary,
                  fontSize: `${scheduleDateElementStyle.fontSize}px`,
                  fontWeight: scheduleDateElementStyle.fontWeight ?? 600,
                  letterSpacing: `${(scheduleDateElementStyle.letterSpacing ?? 0).toFixed(2)}px`,
                  lineHeight: scheduleDateElementStyle.lineHeight ?? 1.2,
                  transition: 'color 0.3s ease',
                }}
              >
                {schedule.date}
              </p>
            )}
            {showSubtitle && (
              <p
                className="text-base"
                style={{
                  color: subtitleElementStyle.color ?? style.textColorSecondary,
                  fontSize: `${subtitleElementStyle.fontSize}px`,
                  fontWeight: subtitleElementStyle.fontWeight ?? 500,
                  letterSpacing: `${(subtitleElementStyle.letterSpacing ?? 0).toFixed(2)}px`,
                  lineHeight: subtitleElementStyle.lineHeight ?? 1.3,
                  transition: 'color 0.3s ease',
                }}
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
          <main
            className="relative flex flex-col overflow-hidden"
            style={{
              flex: '0 0 auto',
              height: `${scheduleAreaPercent}%`,
              minHeight: `${scheduleAreaPercent}%`,
              maxHeight: `${scheduleAreaPercent}%`,
            }}
          >
            {schedule.items.length === 0 ? (
              <div
                className="flex h-full flex-col items-center justify-center rounded-3xl border border-border-light/40 p-8 text-sm text-text-tertiary"
                style={{ backgroundColor: style.cardBackgroundColor }}
              >
                Add classes on the right to see them previewed here.
              </div>
            ) : (
              <ul
                className={cn(
                  layoutStyle === 'grid'
                    ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'
                    : 'flex h-full flex-1 flex-col',
                )}
                style={{ gap: `${scaledItemGap}px` }}
              >
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

                    const numericFontSize =
                      typeof fontSizePx === 'number' ? fontSizePx : parseFloat(String(fontSizePx));
                    const resolvedFontSize =
                      !Number.isNaN(numericFontSize) && Number.isFinite(numericFontSize)
                        ? numericFontSize
                        : typeof meta.defaultFontSize === 'number'
                          ? meta.defaultFontSize
                          : 16;
                    const scaledLineHeight = getScaledLineHeight(lineHeightValue);

                    const createTextStyle = (
                      scale: number,
                      minimum: number,
                      colorValue: string | undefined,
                      extra?: React.CSSProperties,
                    ): React.CSSProperties => ({
                      fontSize: `${getScaledFontSize(resolvedFontSize, scale, minimum)}px`,
                      fontWeight,
                      letterSpacing: letterSpacingValue,
                      lineHeight: scaledLineHeight,
                      color: colorValue,
                      transition: 'color 0.3s ease',
                      ...extra,
                    });

                    let node: React.ReactNode | null = null;

                    switch (elementId) {
                      case 'time':
                        node = (
                          <div
                            className="inline-flex items-center justify-center rounded-2xl font-semibold shadow-inner"
                            style={{
                              backgroundColor: style.accent,
                              color: elementStyle.color || accentTextColor,
                              fontSize: `${getScaledFontSize(resolvedFontSize, timeFontScale, 18)}px`,
                              fontWeight,
                              letterSpacing: letterSpacingValue,
                              lineHeight: scaledLineHeight,
                              padding: `${timePaddingY}px ${timePaddingX}px`,
                              minWidth: `${timeMinWidth}px`,
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
                            style={createTextStyle(classFontScale, 16, textColor ?? style.textColorPrimary)}
                          >
                            {rawValue}
                          </p>
                        );
                        break;
                      case 'instructor':
                        node = (
                          <p style={createTextStyle(instructorFontScale, 14, textColor ?? style.textColorSecondary)}>
                            with {rawValue}
                          </p>
                        );
                        break;
                      case 'location':
                        node = (
                          <p style={createTextStyle(secondaryFontScale, 13, textColor ?? style.textColorSecondary)}>
                            📍 {rawValue}
                          </p>
                        );
                        break;
                      case 'duration':
                        node = (
                          <p style={createTextStyle(secondaryFontScale, 13, textColor ?? style.textColorSecondary)}>
                            ⏱️ {rawValue}
                          </p>
                        );
                        break;
                      case 'description':
                        node = (
                          <p style={createTextStyle(secondaryFontScale, 13, textColor ?? style.textColorSecondary)}>
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

                  const cardStyles: React.CSSProperties = {
                    backgroundColor: style.cardBackgroundColor,
                    borderColor: cardBorderColor,
                    animation: `slide-up-fade 0.6s ease ${index * 0.08}s both`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease',
                    borderRadius: `${itemCornerRadius}px`,
                    padding: `${scaledItemPadding}px`,
                    paddingLeft: `${scaledItemPadding + (style.accentLines ? 6 : 0)}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: layoutStyle === 'grid' ? '0 0 auto' : '1 1 0%',
                    minHeight: layoutStyle === 'grid' ? undefined : 0,
                  };

                  if (showStripedCards && index % 2 === 1) {
                    cardStyles.backgroundImage = `linear-gradient(${stripeOverlayColor}, ${stripeOverlayColor})`;
                    cardStyles.backgroundBlendMode = 'overlay';
                  }

                  if (showStripedCards && index !== 0) {
                    cardStyles.borderTop = `1px solid ${cardBorderColor}`;
                  }

                  return (
                    <li
                      key={`${item.time}-${index}`}
                      className={cn(
                        'group relative flex min-h-0 flex-col border transition hover:border-primary/40 hover:bg-primary/5',
                        layoutStyle !== 'grid' && 'flex-1',
                        layoutStyle === 'grid' && 'h-full',
                        layoutStyle === 'card' ? 'shadow-lg' : 'shadow-sm',
                      )}
                      style={cardStyles}
                    >
                      <div className="flex w-full items-start" style={{ gap: `${innerColumnGap}px` }}>
                        {timeNodes.length > 0 ? (
                          <div className="flex flex-col" style={{ gap: `${timeStackGap}px` }}>
                            {timeNodes.map((element, idx) => (
                              <React.Fragment key={`${element.id}-${idx}`}>{element.node}</React.Fragment>
                            ))}
                          </div>
                        ) : null}
                        {textNodes.length > 0 ? (
                          <div className="flex min-w-0 flex-1 flex-col" style={{ gap: `${textStackGap}px` }}>
                            {textNodes.map((element, idx) => (
                              <React.Fragment key={`${element.id}-${idx}`}>{element.node}</React.Fragment>
                            ))}
                          </div>
                        ) : null}
                        {style.accentLines ? (
                          <span
                            className="pointer-events-none absolute rounded-full"
                            style={{
                              top: `${accentVerticalInset}px`,
                              bottom: `${accentVerticalInset}px`,
                              left: `${accentHorizontalOffset}px`,
                              width: '3px',
                              backgroundColor: style.accent,
                              opacity: 0.6,
                            }}
                          />
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
            <p
              style={{
                color: footerElementStyle.color ?? style.textColorSecondary,
                fontSize: `${footerElementStyle.fontSize}px`,
                fontWeight: footerElementStyle.fontWeight ?? 500,
                letterSpacing: `${(footerElementStyle.letterSpacing ?? 0).toFixed(2)}px`,
                lineHeight: footerElementStyle.lineHeight ?? 1.4,
                transition: 'color 0.3s ease',
              }}
            >
              {style.footer}
            </p>
          </footer>
        )}
      </div>
    </div>
  );
};

export default SchedulePreview;
