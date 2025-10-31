import React from 'react';
import type {
  Schedule,
  Style,
  ScheduleElementId,
  ScheduleElementStyle,
  TemplateId,
} from '../../types';
import { cn } from '../../utils/cn';
import {
  CONTENT_ELEMENT_META,
  DEFAULT_VISIBLE_ELEMENTS,
  getDefaultElementStyle,
  buildInitialElementStyles,
} from './contentElements';
import {
  DEFAULT_SMART_SPACING,
  type SmartSpacingScales,
  type StoryMetrics,
} from './smartTextSizing';
import { getTemplateDefinition } from '../../lib/templates';
import { isTemplateRegistryPreviewEnabled } from '../../lib/templates/featureFlags';
import { DEFAULT_APP_SETTINGS } from '../../constants';

interface SchedulePreviewProps {
  schedule: Schedule;
  templateId?: TemplateId | null;
  style?: Style;
  visibleElements?: ScheduleElementId[];
  elementStyles?: Record<ScheduleElementId, ScheduleElementStyle>;
  spacingScales?: SmartSpacingScales;
  onMetricsChange?: (metrics: StoryMetrics) => void;
}

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  templateId,
  style: styleProp,
  visibleElements: visibleElementsProp,
  elementStyles: elementStylesProp,
  spacingScales: spacingScalesProp,
  onMetricsChange,
}) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const heroRef = React.useRef<HTMLDivElement | null>(null);
  const footerRef = React.useRef<HTMLDivElement | null>(null);
  const scheduleContainerRef = React.useRef<HTMLDivElement | null>(null);
  const metricsRef = React.useRef<StoryMetrics | null>(null);
  const [scheduleHeight, setScheduleHeight] = React.useState(0);
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  const registryDefinition = React.useMemo(() => {
    if (!isTemplateRegistryPreviewEnabled()) {
      return null;
    }
    return getTemplateDefinition(templateId ?? undefined);
  }, [templateId]);

  React.useEffect(() => {
    if (!isTemplateRegistryPreviewEnabled()) {
      return;
    }
    if (templateId && registryDefinition && registryDefinition.id !== templateId && !isTestEnv) {
      console.warn(
        `SchedulePreview: template "${templateId}" is not registered. Falling back to "${registryDefinition.id}".`,
      );
    }
  }, [templateId, registryDefinition, isTestEnv]);

  const defaultStyle = React.useMemo<Style>(() => {
    if (registryDefinition) {
      try {
        return registryDefinition.defaults.createStyle();
      } catch (error) {
        if (!isTestEnv) {
          console.error('SchedulePreview: failed to derive style from template definition.', error);
        }
      }
    }

    const fallbackStyle =
      DEFAULT_APP_SETTINGS.configs[DEFAULT_APP_SETTINGS.activeTemplateId] ||
      Object.values(DEFAULT_APP_SETTINGS.configs)[0];

    if (!fallbackStyle) {
      throw new Error('SchedulePreview: unable to resolve a fallback style.');
    }

    return { ...fallbackStyle };
  }, [registryDefinition]);

  const defaultVisibleElements = React.useMemo<ScheduleElementId[]>(() => {
    if (registryDefinition) {
      try {
        return registryDefinition.defaults.createVisibleElements();
      } catch (error) {
        if (!isTestEnv) {
          console.error('SchedulePreview: failed to derive visible elements from template definition.', error);
        }
      }
    }
    return [...DEFAULT_VISIBLE_ELEMENTS];
  }, [registryDefinition]);

  const defaultElementStyles = React.useMemo(() => {
    if (registryDefinition) {
      try {
        return registryDefinition.defaults.createElementStyles();
      } catch (error) {
        if (!isTestEnv) {
          console.error('SchedulePreview: failed to derive element styles from template definition.', error);
        }
      }
    }
    return buildInitialElementStyles();
  }, [registryDefinition]);

  const defaultSpacing = React.useMemo<SmartSpacingScales>(() => {
    if (registryDefinition) {
      try {
        return registryDefinition.defaults.createSmartSpacing();
      } catch (error) {
        if (!isTestEnv) {
          console.error('SchedulePreview: failed to derive spacing scales from template definition.', error);
        }
      }
    }
    return { ...DEFAULT_SMART_SPACING };
  }, [registryDefinition]);

  const style = styleProp ?? defaultStyle;
  const visibleElements = visibleElementsProp ?? defaultVisibleElements;
  const elementStyles = elementStylesProp ?? defaultElementStyles;
  const spacingScales = spacingScalesProp ?? defaultSpacing;

  const showHeading = style.showHeading !== false;
  const showSubtitle = style.showSubtitle !== false;
  const showSchedule = style.showSchedule !== false;
  const showFooter = style.showFooter !== false;
  const showScheduleDate = style.showScheduleDate !== false;

  React.useLayoutEffect(() => {
    const node = scheduleContainerRef.current;
    if (!node || typeof window === 'undefined') {
      return;
    }

    const updateHeight = () => {
      const nextHeight = node.getBoundingClientRect().height;
      setScheduleHeight((prev) => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
    };

    updateHeight();

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(node);
      return () => observer.disconnect();
    }

    const handle = window.setInterval(updateHeight, 250);
    return () => window.clearInterval(handle);
  }, [schedule.items.length]);

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
  const effectiveClassCount = clamp(classCount || 1, 1, 18);
  const density = (effectiveClassCount - 1) / 14;
  const scheduleAreaPercent = clamp(
    68 - density * 6 + (layoutStyle === 'grid' ? 2 : 0) - (spacingPreset === 'spacious' ? 2 : 0),
    58,
    80,
  );
  const showStripedCards = effectiveClassCount > 6;

  const headingElementStyle = elementStyles.heading ?? getDefaultElementStyle('heading');
  const subtitleElementStyle = elementStyles.subtitle ?? getDefaultElementStyle('subtitle');
  const scheduleDateElementStyle = elementStyles.scheduleDate ?? getDefaultElementStyle('scheduleDate');
  const footerElementStyle = elementStyles.footer ?? getDefaultElementStyle('footer');

  const classStyle = elementStyles.className ?? getDefaultElementStyle('className');
  const timeStyle = elementStyles.time ?? getDefaultElementStyle('time');
  const instructorStyle = elementStyles.instructor ?? getDefaultElementStyle('instructor');
  const locationStyle = elementStyles.location ?? getDefaultElementStyle('location');
  const durationStyle = elementStyles.duration ?? getDefaultElementStyle('duration');
  const descriptionStyle = elementStyles.description ?? getDefaultElementStyle('description');

  const heroGap = Math.max(14, Math.round(22 * spacingScales.heroGap));
  const scheduleGap = Math.max(6, Math.round(spacingConfig.itemGap * spacingScales.scheduleGap));
  const cardPadding = Math.max(12, Math.round(spacingConfig.itemPadding * spacingScales.cardPadding));
  const footerGap = Math.max(12, Math.round(18 * spacingScales.footerGap));
  const timePaddingY = Math.max(6, Math.round(12 * spacingScales.timePadding));
  const timePaddingX = Math.max(10, Math.round(18 * spacingScales.timePadding));
  const timeMinWidth = Math.max(56, Math.round(80 * spacingScales.timePadding));
  const innerColumnGap = Math.max(6, Math.round(16 * spacingScales.scheduleGap));
  const timeStackGap = Math.max(4, Math.round(10 * spacingScales.scheduleGap));
  const textStackGap = Math.max(4, Math.round(11 * spacingScales.scheduleGap));
  const accentVerticalInset = Math.max(4, Math.round(cardPadding * 0.42));
  const accentHorizontalOffset = Math.max(8, Math.round(cardPadding * 0.3));
  const logoGap = Math.max(14, Math.round(24 * spacingScales.logoPadding));
  const logoBottomPadding = Math.max(24, Math.round(36 * spacingScales.logoPadding));

  const backgroundStyles = React.useMemo<React.CSSProperties>(
    () => ({
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
    }),
    [
      style.fontFamily,
      style.textColorPrimary,
      style.backgroundColor,
      style.overlayColor,
      style.bgImage,
      style.bgFit,
      style.bgPosition,
      hasBackgroundImage,
    ],
  );

  const fontVars = React.useMemo<React.CSSProperties>(
    () => ({
      '--font-heading': `${headingElementStyle.fontSize}px`,
      '--font-subtitle': `${subtitleElementStyle.fontSize}px`,
      '--font-date': `${scheduleDateElementStyle.fontSize}px`,
      '--font-class': `${classStyle.fontSize}px`,
      '--font-time': `${timeStyle.fontSize}px`,
      '--font-instructor': `${instructorStyle.fontSize}px`,
      '--font-location': `${locationStyle.fontSize}px`,
      '--font-description': `${descriptionStyle.fontSize}px`,
      '--font-footer': `${footerElementStyle.fontSize}px`,
    }),
    [
      headingElementStyle.fontSize,
      subtitleElementStyle.fontSize,
      scheduleDateElementStyle.fontSize,
      classStyle.fontSize,
      timeStyle.fontSize,
      instructorStyle.fontSize,
      locationStyle.fontSize,
      descriptionStyle.fontSize,
      footerElementStyle.fontSize,
    ],
  );

  const spacingVars = React.useMemo<React.CSSProperties>(
    () => ({
      '--story-hero-gap': `${heroGap}px`,
      '--story-schedule-gap': `${scheduleGap}px`,
      '--story-card-padding': `${cardPadding}px`,
      '--story-footer-gap': `${footerGap}px`,
      '--story-time-padding-y': `${timePaddingY}px`,
      '--story-time-padding-x': `${timePaddingX}px`,
      '--story-time-min-width': `${timeMinWidth}px`,
      '--story-card-accent-inset': `${accentVerticalInset}px`,
      '--story-card-accent-offset': `${accentHorizontalOffset}px`,
      '--story-inner-gap': `${innerColumnGap}px`,
      '--story-text-gap': `${textStackGap}px`,
      '--story-time-gap': `${timeStackGap}px`,
      '--story-logo-gap': `${logoGap}px`,
      '--story-logo-bottom-padding': `${logoBottomPadding}px`,
    }),
    [
      heroGap,
      scheduleGap,
      cardPadding,
      footerGap,
      timePaddingY,
      timePaddingX,
      timeMinWidth,
      accentVerticalInset,
      accentHorizontalOffset,
      innerColumnGap,
      textStackGap,
      timeStackGap,
      logoGap,
      logoBottomPadding,
    ],
  );

  const combinedStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...backgroundStyles,
      ...fontVars,
      ...spacingVars,
    }),
    [backgroundStyles, fontVars, spacingVars],
  );

  const hasLogo = Boolean(style.logoUrl);
  const logoPosition = style.logoPosition ?? 'bottom-center';
  const normalizedLogoPosition =
    logoPosition === 'top-left' || logoPosition === 'top-right'
      ? 'top-center'
      : logoPosition === 'bottom-left' || logoPosition === 'bottom-right'
        ? 'bottom-center'
        : logoPosition;
  const logoSize = Math.min(Math.max(style.logoSize ?? 100, 32), 320);

  const renderLogoBadge = ({ pointerEvents = true }: { pointerEvents?: boolean } = {}) => (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/12 px-6 py-4 text-base shadow-[0_18px_48px_rgba(15,23,42,0.55)] transition-all duration-300',
        !pointerEvents && 'pointer-events-none',
      )}
      style={{
        maxWidth: `${logoSize + 64}px`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <img
        src={style.logoUrl}
        alt={style.heading ? `${style.heading} logo` : 'Brand logo'}
        style={{
          width: `${logoSize}px`,
          maxWidth: '100%',
          maxHeight: `${logoSize}px`,
          objectFit: 'contain',
        }}
        draggable={false}
      />
    </div>
  );

  const topLogo =
    hasLogo && normalizedLogoPosition === 'top-center'
      ? (
        <div className="flex justify-center" style={{ paddingBottom: 'var(--story-logo-gap)' }}>
          {renderLogoBadge()}
        </div>
      )
      : null;

  const bottomLogo =
    hasLogo && normalizedLogoPosition === 'bottom-center'
      ? (
        <div
          className="mt-auto flex justify-center"
          style={{
            paddingTop: 'var(--story-logo-gap)',
            paddingBottom: 'var(--story-logo-bottom-padding)',
          }}
        >
          {renderLogoBadge()}
        </div>
      )
      : null;

  const centerLogo =
    hasLogo && normalizedLogoPosition === 'center'
      ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          {renderLogoBadge({ pointerEvents: false })}
        </div>
      )
      : null;

  React.useLayoutEffect(() => {
    if (!onMetricsChange) return;
    const root = rootRef.current;
    if (!root) return;

    const heroNode = heroRef.current;
    const footerNode = footerRef.current;

    const metrics: StoryMetrics = {
      contentHeight: root.scrollHeight,
      availableHeight: root.getBoundingClientRect().height,
      heroHeight: heroNode?.getBoundingClientRect().height ?? 0,
      scheduleHeight,
      footerHeight: footerNode?.getBoundingClientRect().height ?? 0,
      itemCount: schedule.items.length,
    };

    const prev = metricsRef.current;
    const changed =
      !prev ||
      prev.contentHeight !== metrics.contentHeight ||
      prev.availableHeight !== metrics.availableHeight ||
      prev.heroHeight !== metrics.heroHeight ||
      prev.scheduleHeight !== metrics.scheduleHeight ||
      prev.footerHeight !== metrics.footerHeight ||
      prev.itemCount !== metrics.itemCount;

    if (changed) {
      metricsRef.current = metrics;
      onMetricsChange(metrics);
    }
  }, [
    onMetricsChange,
    scheduleHeight,
    schedule.items.length,
    elementStyles,
    spacingScales,
    style.heading,
    style.subtitle,
    style.footer,
    style.showHeading,
    style.showSubtitle,
    style.showSchedule,
    style.showFooter,
  ]);

  const renderTextStyle = React.useCallback(
    (elementId: ScheduleElementId, fallbackColor: string) => {
      const styleRecord = elementStyles[elementId] ?? getDefaultElementStyle(elementId);
      const fontVarMap: Record<ScheduleElementId, string> = {
        heading: '--font-heading',
        subtitle: '--font-subtitle',
        scheduleDate: '--font-date',
        className: '--font-class',
        time: '--font-time',
        instructor: '--font-instructor',
        location: '--font-location',
        duration: '--font-location',
        description: '--font-description',
        footer: '--font-footer',
      };
      const fontVar = fontVarMap[elementId];
      return {
        color: styleRecord.color ?? fallbackColor,
        fontWeight: styleRecord.fontWeight ?? CONTENT_ELEMENT_META[elementId]?.defaultFontWeight ?? 500,
        letterSpacing: `${(styleRecord.letterSpacing ?? CONTENT_ELEMENT_META[elementId]?.defaultLetterSpacing ?? 0).toFixed(2)}px`,
        lineHeight: styleRecord.lineHeight ?? CONTENT_ELEMENT_META[elementId]?.defaultLineHeight ?? 1.3,
        fontSize: fontVar ? `var(${fontVar})` : undefined,
        transition: 'color 0.3s ease, font-weight 0.3s ease',
      } as React.CSSProperties;
    },
    [elementStyles],
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        'story-canvas relative flex h-full w-full flex-col overflow-hidden rounded-[inherit] px-6 py-10',
      )}
      style={combinedStyle}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_bottom,rgba(139,123,216,0.08),transparent_60%)] opacity-40" />
      {centerLogo}
      <div className="relative z-10 flex h-full flex-col">
        {topLogo}
        <div className="flex flex-1 flex-col" style={{ gap: 'var(--story-hero-gap)' }}>
          {(showHeading || showSubtitle) && (
            <header ref={heroRef} className="flex flex-col items-center text-center" style={{ gap: 'var(--story-hero-gap)' }}>
              {showHeading && (
                <h1
                  className="text-story-heading font-bold tracking-tight text-center"
                  style={{
                    ...renderTextStyle('heading', style.textColorPrimary),
                    fontWeight: headingElementStyle.fontWeight ?? Number(style.headingWeight ?? '700'),
                  }}
                >
                  {style.heading}
                </h1>
              )}
              {showScheduleDate && (
                <p
                  className="text-story-date uppercase"
                  style={renderTextStyle('scheduleDate', style.textColorSecondary)}
                >
                  {schedule.date}
                </p>
              )}
              {showSubtitle && (
                <p className="text-story-subtitle" style={renderTextStyle('subtitle', style.textColorSecondary)}>
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
              ref={scheduleContainerRef}
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
                  style={{ gap: 'var(--story-schedule-gap)' }}
                >
                  {schedule.items.map((item, index) => {
                    const renderedElements = visibleElements.reduce<
                      Array<{ id: ScheduleElementId; node: React.ReactNode }>
                    >((acc, elementId) => {
                      const meta = CONTENT_ELEMENT_META[elementId];
                      if (!meta) return acc;
                      const rawValue = item[meta.field];
                      if (!rawValue) return acc;

                      const styleRecord = elementStyles[elementId] ?? getDefaultElementStyle(elementId);
                      const typography = renderTextStyle(elementId, style.textColorSecondary);

                      let node: React.ReactNode | null = null;

                      switch (elementId) {
                        case 'time':
                          node = (
                            <div
                              className="text-story-time inline-flex items-center justify-center rounded-2xl font-semibold shadow-inner"
                              style={{
                                ...typography,
                                backgroundColor: style.accent,
                                color: styleRecord.color || accentTextColor,
                                padding: 'var(--story-time-padding-y) var(--story-time-padding-x)',
                                minWidth: 'var(--story-time-min-width)',
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
                            <p className="text-story-class font-semibold" style={renderTextStyle('className', style.textColorPrimary)}>
                              {rawValue}
                            </p>
                          );
                          break;
                        case 'instructor':
                          node = (
                            <p className="text-story-instructor" style={renderTextStyle('instructor', style.textColorSecondary)}>
                              with {rawValue}
                            </p>
                          );
                          break;
                        case 'location':
                          node = (
                            <p className="text-story-location" style={renderTextStyle('location', style.textColorSecondary)}>
                              📍 {rawValue}
                            </p>
                          );
                          break;
                        case 'duration':
                          node = (
                            <p className="text-story-location" style={renderTextStyle('duration', style.textColorSecondary)}>
                              ⏱️ {rawValue}
                            </p>
                          );
                          break;
                        case 'description':
                          node = (
                            <p className="text-story-description" style={renderTextStyle('description', style.textColorSecondary)}>
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
                      borderRadius: `${itemCornerRadius}px`,
                      padding: 'var(--story-card-padding)',
                      paddingLeft: style.accentLines
                        ? `calc(var(--story-card-padding) + 6px)`
                        : 'var(--story-card-padding)',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: layoutStyle === 'grid' ? '0 0 auto' : '0 1 auto',
                      minHeight: layoutStyle === 'grid' ? undefined : 0,
                      transition: 'background-color 0.3s ease, border-color 0.3s ease',
                      animation: `slide-up-fade 0.6s ease ${index * 0.08}s both`,
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
                        <div className="flex w-full items-start" style={{ gap: 'var(--story-inner-gap)' }}>
                          {timeNodes.length > 0 ? (
                            <div className="flex flex-col" style={{ gap: 'var(--story-time-gap)' }}>
                              {timeNodes.map((element, idx) => (
                                <React.Fragment key={`${element.id}-${idx}`}>{element.node}</React.Fragment>
                              ))}
                            </div>
                          ) : null}
                          {textNodes.length > 0 ? (
                            <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 'var(--story-text-gap)' }}>
                              {textNodes.map((element, idx) => (
                                <React.Fragment key={`${element.id}-${idx}`}>{element.node}</React.Fragment>
                              ))}
                            </div>
                          ) : null}
                          {style.accentLines ? (
                            <span
                              className="pointer-events-none absolute rounded-full"
                              style={{
                                top: 'var(--story-card-accent-inset)',
                                bottom: 'var(--story-card-accent-inset)',
                                left: 'var(--story-card-accent-offset)',
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
            <footer
              ref={footerRef}
              className="mt-auto flex flex-col text-sm text-text-tertiary"
              style={{ gap: 'var(--story-footer-gap)' }}
            >
              {style.footerBar && (
                <div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: style.accent, transition: 'background-color 0.3s ease' }}
                />
              )}
              <p
                className="text-story-footer"
                style={renderTextStyle('footer', style.textColorSecondary)}
              >
                {style.footer}
              </p>
            </footer>
          )}
        </div>
        {bottomLogo}
      </div>
    </div>
  );
};

export default SchedulePreview;
