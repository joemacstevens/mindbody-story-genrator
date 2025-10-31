import type { EditorColorPalette, LogoPosition, ScheduleElementId, ScheduleElementMeta } from '../../types';
import { STYLE_COLOR_PALETTES } from '../../components/editor/stylePalettes';
import {
  CONTENT_ELEMENT_META,
  FOOTER_ELEMENT_IDS,
  HERO_ELEMENT_IDS,
  SCHEDULE_ELEMENT_IDS,
} from '../../components/editor/contentElements';
import {
  DEFAULT_CORNER_RADIUS_RANGE,
  DEFAULT_DIVIDER_OPTIONS,
  DEFAULT_LAYOUT_OPTIONS,
  DEFAULT_SPACING_OPTIONS,
  type LayoutDividerOption,
  type LayoutSpacingOption,
  type LayoutStyleOption,
} from '../../components/editor/layoutOptions';

export interface TemplateStyleTabControls {
  readonly showPaletteSection?: boolean;
  readonly palettes?: ReadonlyArray<EditorColorPalette>;
  readonly showBackgroundSection?: boolean;
  readonly showLogoSection?: boolean;
  readonly logoPositions?: ReadonlyArray<LogoPosition>;
}

export interface TemplateContentTabControls {
  readonly elementsMeta?: Partial<Record<ScheduleElementId, ScheduleElementMeta>>;
  readonly heroElementIds?: ReadonlyArray<ScheduleElementId>;
  readonly footerElementIds?: ReadonlyArray<ScheduleElementId>;
  readonly scheduleElementIds?: ReadonlyArray<ScheduleElementId>;
  readonly showSmartTextSizing?: boolean;
  readonly allowReorder?: boolean;
  readonly allowVisibilityToggles?: boolean;
  readonly allowStaticVisibilityToggles?: boolean;
}

export interface TemplateLayoutTabControls {
  readonly showCornerRadius?: boolean;
  readonly cornerRadiusRange?: { min: number; max: number };
  readonly spacingOptions?: ReadonlyArray<LayoutSpacingOption>;
  readonly layoutOptions?: ReadonlyArray<LayoutStyleOption>;
  readonly dividerOptions?: ReadonlyArray<LayoutDividerOption>;
  readonly showAccentLinesToggle?: boolean;
  readonly showFooterBarToggle?: boolean;
}

export interface TemplateEditorControls {
  readonly styleTab?: TemplateStyleTabControls;
  readonly contentTab?: TemplateContentTabControls;
  readonly layoutTab?: TemplateLayoutTabControls;
}

export interface ResolvedStyleTabControls {
  readonly showPaletteSection: boolean;
  readonly palettes: EditorColorPalette[];
  readonly showBackgroundSection: boolean;
  readonly showLogoSection: boolean;
  readonly logoPositions: LogoPosition[];
}

export interface ResolvedContentTabControls {
  readonly elementsMeta: Record<ScheduleElementId, ScheduleElementMeta>;
  readonly heroElementIds: ScheduleElementId[];
  readonly footerElementIds: ScheduleElementId[];
  readonly scheduleElementIds: ScheduleElementId[];
  readonly showSmartTextSizing: boolean;
  readonly allowReorder: boolean;
  readonly allowVisibilityToggles: boolean;
  readonly allowStaticVisibilityToggles: boolean;
}

export interface ResolvedLayoutTabControls {
  readonly showCornerRadius: boolean;
  readonly cornerRadiusRange: { min: number; max: number };
  readonly spacingOptions: LayoutSpacingOption[];
  readonly layoutOptions: LayoutStyleOption[];
  readonly dividerOptions: LayoutDividerOption[];
  readonly showAccentLinesToggle: boolean;
  readonly showFooterBarToggle: boolean;
}

const clonePalette = (palette: EditorColorPalette): EditorColorPalette => ({
  ...palette,
  colors: { ...palette.colors },
  preview: [...palette.preview],
});

const cloneMetaRecord = (
  meta: Record<ScheduleElementId, ScheduleElementMeta>,
): Record<ScheduleElementId, ScheduleElementMeta> =>
  Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [key as ScheduleElementId, { ...value }]),
  ) as Record<ScheduleElementId, ScheduleElementMeta>;

const cloneSpacingOptions = (options: ReadonlyArray<LayoutSpacingOption>): LayoutSpacingOption[] =>
  options.map((option) => ({ ...option }));

const cloneLayoutOptions = (options: ReadonlyArray<LayoutStyleOption>): LayoutStyleOption[] =>
  options.map((option) => ({ ...option }));

const cloneDividerOptions = (options: ReadonlyArray<LayoutDividerOption>): LayoutDividerOption[] =>
  options.map((option) => ({ ...option }));

const BASE_STYLE_TAB_CONTROLS: ResolvedStyleTabControls = {
  showPaletteSection: true,
  palettes: STYLE_COLOR_PALETTES.map(clonePalette),
  showBackgroundSection: true,
  showLogoSection: true,
  logoPositions: ['top-center', 'center', 'bottom-center'],
};

const BASE_CONTENT_TAB_CONTROLS: ResolvedContentTabControls = {
  elementsMeta: cloneMetaRecord(CONTENT_ELEMENT_META),
  heroElementIds: [...HERO_ELEMENT_IDS],
  footerElementIds: [...FOOTER_ELEMENT_IDS],
  scheduleElementIds: [...SCHEDULE_ELEMENT_IDS],
  showSmartTextSizing: true,
  allowReorder: true,
  allowVisibilityToggles: true,
  allowStaticVisibilityToggles: true,
};

const BASE_LAYOUT_TAB_CONTROLS: ResolvedLayoutTabControls = {
  showCornerRadius: true,
  cornerRadiusRange: { ...DEFAULT_CORNER_RADIUS_RANGE },
  spacingOptions: cloneSpacingOptions(DEFAULT_SPACING_OPTIONS),
  layoutOptions: cloneLayoutOptions(DEFAULT_LAYOUT_OPTIONS),
  dividerOptions: cloneDividerOptions(DEFAULT_DIVIDER_OPTIONS),
  showAccentLinesToggle: true,
  showFooterBarToggle: true,
};

export const resolveStyleTabControls = (
  controls?: TemplateStyleTabControls | null,
): ResolvedStyleTabControls => {
  const palettes = controls?.palettes ?? BASE_STYLE_TAB_CONTROLS.palettes;
  const logoPositions = controls?.logoPositions ?? BASE_STYLE_TAB_CONTROLS.logoPositions;

  return {
    showPaletteSection: controls?.showPaletteSection ?? BASE_STYLE_TAB_CONTROLS.showPaletteSection,
    palettes: palettes.map(clonePalette),
    showBackgroundSection: controls?.showBackgroundSection ?? BASE_STYLE_TAB_CONTROLS.showBackgroundSection,
    showLogoSection: controls?.showLogoSection ?? BASE_STYLE_TAB_CONTROLS.showLogoSection,
    logoPositions: [...logoPositions],
  };
};

export const resolveContentTabControls = (
  controls?: TemplateContentTabControls | null,
): ResolvedContentTabControls => {
  const baseMeta = BASE_CONTENT_TAB_CONTROLS.elementsMeta;
  const providedMetaEntries = controls?.elementsMeta
    ? Object.entries(controls.elementsMeta).reduce<Record<ScheduleElementId, ScheduleElementMeta>>(
        (acc, [key, value]) => {
          if (value) {
            acc[key as ScheduleElementId] = { ...value };
          }
          return acc;
        },
        {},
      )
    : {};

  const mergedMeta = { ...cloneMetaRecord(baseMeta), ...providedMetaEntries };

  const heroIds = controls?.heroElementIds ?? BASE_CONTENT_TAB_CONTROLS.heroElementIds;
  const footerIds = controls?.footerElementIds ?? BASE_CONTENT_TAB_CONTROLS.footerElementIds;
  const scheduleIds = controls?.scheduleElementIds ?? BASE_CONTENT_TAB_CONTROLS.scheduleElementIds;

  return {
    elementsMeta: mergedMeta,
    heroElementIds: [...heroIds],
    footerElementIds: [...footerIds],
    scheduleElementIds: [...scheduleIds],
    showSmartTextSizing: controls?.showSmartTextSizing ?? BASE_CONTENT_TAB_CONTROLS.showSmartTextSizing,
    allowReorder: controls?.allowReorder ?? BASE_CONTENT_TAB_CONTROLS.allowReorder,
    allowVisibilityToggles:
      controls?.allowVisibilityToggles ?? BASE_CONTENT_TAB_CONTROLS.allowVisibilityToggles,
    allowStaticVisibilityToggles:
      controls?.allowStaticVisibilityToggles ?? BASE_CONTENT_TAB_CONTROLS.allowStaticVisibilityToggles,
  };
};

export const resolveLayoutTabControls = (
  controls?: TemplateLayoutTabControls | null,
): ResolvedLayoutTabControls => {
  const spacingOptions = controls?.spacingOptions ?? BASE_LAYOUT_TAB_CONTROLS.spacingOptions;
  const layoutOptions = controls?.layoutOptions ?? BASE_LAYOUT_TAB_CONTROLS.layoutOptions;
  const dividerOptions = controls?.dividerOptions ?? BASE_LAYOUT_TAB_CONTROLS.dividerOptions;
  const range = controls?.cornerRadiusRange ?? BASE_LAYOUT_TAB_CONTROLS.cornerRadiusRange;

  return {
    showCornerRadius: controls?.showCornerRadius ?? BASE_LAYOUT_TAB_CONTROLS.showCornerRadius,
    cornerRadiusRange: { ...range },
    spacingOptions: cloneSpacingOptions(spacingOptions),
    layoutOptions: cloneLayoutOptions(layoutOptions),
    dividerOptions: cloneDividerOptions(dividerOptions),
    showAccentLinesToggle:
      controls?.showAccentLinesToggle ?? BASE_LAYOUT_TAB_CONTROLS.showAccentLinesToggle,
    showFooterBarToggle:
      controls?.showFooterBarToggle ?? BASE_LAYOUT_TAB_CONTROLS.showFooterBarToggle,
  };
};

export const DEFAULT_STYLE_TAB_CONTROLS = resolveStyleTabControls();
export const DEFAULT_CONTENT_TAB_CONTROLS = resolveContentTabControls();
export const DEFAULT_LAYOUT_TAB_CONTROLS = resolveLayoutTabControls();
