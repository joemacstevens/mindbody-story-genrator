import type { Schedule, ScheduleElementId, ScheduleElementStyle, Style } from '../../types';
import {
  CONTENT_ELEMENT_META,
  FOOTER_ELEMENT_IDS,
  HERO_ELEMENT_IDS,
  SCHEDULE_ELEMENT_IDS,
  getDefaultElementStyle,
} from './contentElements';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type StoryMetrics = {
  contentHeight: number;
  availableHeight: number;
  heroHeight: number;
  scheduleHeight: number;
  footerHeight: number;
  itemCount: number;
};

export type SmartSpacingScales = {
  heroGap: number;
  scheduleGap: number;
  cardPadding: number;
  footerGap: number;
  timePadding: number;
  logoPadding: number;
};

export const DEFAULT_SMART_SPACING: SmartSpacingScales = {
  heroGap: 1,
  scheduleGap: 1,
  cardPadding: 1,
  footerGap: 1,
  timePadding: 1,
  logoPadding: 1,
};

const ELEMENT_SIZE_LIMITS: Partial<Record<ScheduleElementId, { min: number; max: number }>> = {
  heading: { min: 34, max: 76 },
  subtitle: { min: 20, max: 44 },
  scheduleDate: { min: 16, max: 30 },
  footer: { min: 16, max: 28 },
  className: { min: 20, max: 34 },
  time: { min: 18, max: 30 },
  instructor: { min: 16, max: 26 },
  location: { min: 15, max: 24 },
  duration: { min: 15, max: 24 },
  description: { min: 15, max: 24 },
};

type SmartSizingParams = {
  currentStyles: Record<ScheduleElementId, ScheduleElementStyle>;
  style: Style;
  visibleElements: ScheduleElementId[];
  schedule: Schedule | null;
  metrics?: StoryMetrics | null;
};

export type SmartSizingResult = {
  elementStyles: Record<ScheduleElementId, ScheduleElementStyle>;
  spacing: SmartSpacingScales;
  scaleFactor: number;
  density: number;
};

const averageLength = (values: Array<string | undefined | null>): number => {
  const lengths = values
    .map((value) => (value ? value.trim().length : 0))
    .filter((length) => length > 0);
  if (!lengths.length) {
    return 0;
  }
  return lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
};

const getScheduleDensity = (
  schedule: Schedule | null,
  visibleScheduleElements: number,
  layoutStyle: NonNullable<Style['layoutStyle']>,
  spacing: NonNullable<Style['spacing']>,
  averageBodyTextLength: number,
): number => {
  const itemCount = clamp(schedule?.items?.length ?? 0, 3, 14);
  const elementCount = clamp(visibleScheduleElements || 1, 1, SCHEDULE_ELEMENT_IDS.length);
  const baseLines = itemCount * elementCount;

  let densityMultiplier = 1;
  if (layoutStyle === 'grid') {
    densityMultiplier += 0.18;
  } else if (layoutStyle === 'card') {
    densityMultiplier += 0.08;
  }

  if (spacing === 'compact') {
    densityMultiplier += 0.12;
  } else if (spacing === 'spacious') {
    densityMultiplier -= 0.08;
  }

  if (averageBodyTextLength > 26) {
    densityMultiplier += 0.12;
  } else if (averageBodyTextLength > 18) {
    densityMultiplier += 0.06;
  } else if (averageBodyTextLength < 10) {
    densityMultiplier -= 0.04;
  }

  const rawDensity = (baseLines * densityMultiplier) / 24;
  return clamp(rawDensity, 0, 1.7);
};

const resolveStyle = (
  styles: Record<ScheduleElementId, ScheduleElementStyle>,
  elementId: ScheduleElementId,
): ScheduleElementStyle => {
  const existing = styles[elementId];
  if (existing) {
    return existing;
  }
  return getDefaultElementStyle(elementId);
};

const applyFontSize = (
  styles: Record<ScheduleElementId, ScheduleElementStyle>,
  elementId: ScheduleElementId,
  scale: number,
  options: { min?: number; max?: number; lineHeightRange?: [number, number]; preserveLineHeight?: boolean } = {},
) => {
  const existing = resolveStyle(styles, elementId);
  const meta = CONTENT_ELEMENT_META[elementId];
  const baseSize = existing.fontSize ?? meta?.defaultFontSize ?? 16;
  const min = options.min ?? (meta?.defaultFontSize ? Math.max(10, Math.floor(meta.defaultFontSize * 0.55)) : 10);
  const max = options.max ?? (meta?.defaultFontSize ? Math.max(meta.defaultFontSize + 12, 28) : 64);
  const nextFontSize = clamp(Math.round(baseSize * scale), min, max);

  let nextLineHeight = existing.lineHeight;
  if (!options.preserveLineHeight && options.lineHeightRange) {
    const [minLH, maxLH] = options.lineHeightRange;
    const baseLine = typeof existing.lineHeight === 'number' ? existing.lineHeight : meta?.defaultLineHeight ?? 1.3;
    const delta = scale - 1;
    const factor = delta >= 0 ? 1 + delta * 0.12 : 1 + delta * 0.45;
    nextLineHeight = clamp(Number((baseLine * factor).toFixed(2)), minLH, maxLH);
  }

  styles[elementId] = {
    ...existing,
    fontSize: nextFontSize,
    lineHeight: options.preserveLineHeight ? existing.lineHeight : nextLineHeight,
  };
};

const HERO_LINE_HEIGHT_RANGE: [number, number] = [1.05, 1.4];
const SCHEDULE_LINE_HEIGHT_RANGE: [number, number] = [1.1, 1.6];
const FOOTER_LINE_HEIGHT_RANGE: [number, number] = [1.1, 1.5];

export const computeSmartSizing = ({
  currentStyles,
  style,
  visibleElements,
  schedule,
  metrics = null,
}: SmartSizingParams): SmartSizingResult => {
  const nextStyles: Record<ScheduleElementId, ScheduleElementStyle> = { ...currentStyles };

  const scheduleItems = schedule?.items ?? [];
  const heroEnabled = {
    heading: style.showHeading !== false,
    subtitle: style.showSubtitle !== false,
    scheduleDate: style.showScheduleDate !== false,
  };
  const heroCount = HERO_ELEMENT_IDS.filter((id) => heroEnabled[id]).length;
  const footerEnabled = style.showFooter !== false;

  const scheduleElementSet = new Set(
    visibleElements.filter((elementId) => SCHEDULE_ELEMENT_IDS.includes(elementId)),
  );
  const scheduleElementsActive = scheduleElementSet.size > 0 ? scheduleElementSet.size : 3;

  const layoutStyle = style.layoutStyle ?? 'list';
  const spacing = style.spacing ?? 'comfortable';

  const classLengths = scheduleItems.map((item) => item.class);
  const instructorLengths = scheduleItems.map((item) => item.coach);
  const locationLengths = scheduleItems.map((item) => item.location);
  const descriptionLengths = scheduleItems.map((item) => item.description);
  const averageBodyLength = averageLength([
    ...classLengths,
    ...instructorLengths,
    ...locationLengths,
    ...descriptionLengths,
  ]);

  const scheduleDensity = getScheduleDensity(
    schedule,
    scheduleElementsActive,
    layoutStyle,
    spacing,
    averageBodyLength,
  );

  const metricPressure =
    metrics && metrics.availableHeight > 0
      ? clamp(metrics.contentHeight / metrics.availableHeight, 0.7, 1.8)
      : 1;
  const overflowPressure = Math.max(0, metricPressure - 1);
  const breathingRoom = Math.max(0, 1 - metricPressure);

  const spacingCompression =
    overflowPressure > 0
      ? clamp(1 - overflowPressure * 0.35, 0.68, 1)
      : clamp(1 + breathingRoom * 0.12, 1, 1.08);
  const heroGapScale =
    overflowPressure > 0
      ? clamp(1 - overflowPressure * 0.3, 0.74, 1.05)
      : clamp(1 + breathingRoom * 0.08, 1, 1.1);
  const footerGapScale =
    overflowPressure > 0
      ? clamp(1 - overflowPressure * 0.25, 0.76, 1.05)
      : clamp(1 + breathingRoom * 0.06, 1, 1.08);
  const timePaddingScale =
    overflowPressure > 0
      ? clamp(1 - overflowPressure * 0.28, 0.7, 1)
      : clamp(1 + breathingRoom * 0.05, 1, 1.05);
  const logoPaddingScale =
    overflowPressure > 0
      ? clamp(1 - overflowPressure * 0.22, 0.75, 1.06)
      : clamp(1 + breathingRoom * 0.04, 1, 1.06);

  const spacingScales: SmartSpacingScales = {
    heroGap: heroGapScale,
    scheduleGap: spacingCompression,
    cardPadding: spacingCompression,
    footerGap: footerGapScale,
    timePadding: timePaddingScale,
    logoPadding: logoPaddingScale,
  };

  const headingLength = style.heading?.trim().length ?? 0;
  const subtitleLength = style.subtitle?.trim().length ?? 0;

  let heroScaleBase = heroCount <= 1 ? 1.04 : heroCount === 2 ? 0.99 : 0.94;
  heroScaleBase -= scheduleDensity * 0.06;
  heroScaleBase *= overflowPressure > 0 ? clamp(1 - overflowPressure * 0.08, 0.8, 1) : 1 + breathingRoom * 0.05;

  if (spacing === 'spacious') {
    heroScaleBase += 0.02;
  } else if (spacing === 'compact') {
    heroScaleBase -= 0.03;
  }
  if (layoutStyle === 'grid') {
    heroScaleBase -= 0.02;
  }

  const headingLengthAdjustment =
    headingLength > 36 ? -0.1 : headingLength > 28 ? -0.06 : headingLength > 18 ? -0.03 : headingLength < 12 ? 0.03 : 0;
  const subtitleLengthAdjustment =
    subtitleLength > 42 ? -0.1 : subtitleLength > 30 ? -0.06 : subtitleLength > 18 ? -0.03 : subtitleLength < 10 ? 0.04 : 0;

  const heroScale = clamp(heroScaleBase, 0.82, 1.12);
  const headingScale = clamp(heroScale + headingLengthAdjustment, 0.8, 1.16);
  const subtitleScale = clamp(heroScale + subtitleLengthAdjustment, 0.78, 1.08);
  const dateScale = clamp(heroScale - 0.05, 0.7, 1.02);

  let scheduleScale = 1.02 - scheduleDensity * 0.16;
  if (spacing === 'spacious') {
    scheduleScale += 0.04;
  } else if (spacing === 'compact') {
    scheduleScale -= 0.05;
  }
  if (layoutStyle === 'grid') {
    scheduleScale -= 0.05;
  } else if (layoutStyle === 'card') {
    scheduleScale -= 0.02;
  }
  if (averageBodyLength > 28) {
    scheduleScale -= 0.07;
  } else if (averageBodyLength > 20) {
    scheduleScale -= 0.04;
  } else if (averageBodyLength < 12) {
    scheduleScale += 0.04;
  }

  scheduleScale *= overflowPressure > 0 ? clamp(1 - overflowPressure * 0.14, 0.76, 1) : 1 + breathingRoom * 0.04;
  scheduleScale = clamp(scheduleScale, 0.78, 1.08);

  let footerScale = 0.96 - scheduleDensity * 0.05;
  footerScale += spacing === 'spacious' ? 0.03 : 0;
  footerScale *= overflowPressure > 0 ? clamp(1 - overflowPressure * 0.1, 0.8, 1.02) : 1 + breathingRoom * 0.04;
  footerScale = clamp(footerScale, 0.82, 1.05);

  HERO_ELEMENT_IDS.forEach((elementId) => {
    const enabled = heroEnabled[elementId];
    const scale =
      elementId === 'heading' ? headingScale : elementId === 'subtitle' ? subtitleScale : dateScale;
    const limits = ELEMENT_SIZE_LIMITS[elementId];
    applyFontSize(nextStyles, elementId, scale, {
      min: limits?.min ?? (elementId === 'heading' ? 28 : 12),
      max: limits?.max ?? (elementId === 'heading' ? 68 : elementId === 'subtitle' ? 40 : 26),
      lineHeightRange: HERO_LINE_HEIGHT_RANGE,
      preserveLineHeight: !enabled,
    });
  });

  SCHEDULE_ELEMENT_IDS.forEach((elementId) => {
    const limits = ELEMENT_SIZE_LIMITS[elementId];
    applyFontSize(nextStyles, elementId, scheduleScale, {
      min: limits?.min ?? (elementId === 'className' ? 16 : 11),
      max: limits?.max ?? (elementId === 'className' ? 30 : elementId === 'time' ? 26 : 22),
      lineHeightRange: SCHEDULE_LINE_HEIGHT_RANGE,
    });
  });

  FOOTER_ELEMENT_IDS.forEach((elementId) => {
    const limits = ELEMENT_SIZE_LIMITS[elementId];
    applyFontSize(nextStyles, elementId, footerScale, {
      min: limits?.min ?? 12,
      max: limits?.max ?? 26,
      lineHeightRange: FOOTER_LINE_HEIGHT_RANGE,
      preserveLineHeight: !footerEnabled,
    });
  });

  const availableHeight = metrics?.availableHeight ?? 1920;
  const contentHeight = metrics?.contentHeight ?? 1920;
  const scaleFactor = clamp(availableHeight / Math.max(contentHeight, 1), 0.72, 1.12);

  return {
    elementStyles: nextStyles,
    spacing: spacingScales,
    scaleFactor,
    density: scheduleDensity,
  };
};
