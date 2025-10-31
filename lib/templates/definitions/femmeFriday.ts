import {
  DEFAULT_VISIBLE_ELEMENTS,
  DEFAULT_HIDDEN_ELEMENTS,
  ELEMENT_ORDER,
  buildInitialElementStyles,
} from '../../../components/editor/contentElements';
import { DEFAULT_SMART_SPACING } from '../../../components/editor/smartTextSizing';
import type { TemplateDefinition } from '../registry';
import {
  DEFAULT_CONTENT_TAB_CONTROLS,
  DEFAULT_LAYOUT_TAB_CONTROLS,
  DEFAULT_STYLE_TAB_CONTROLS,
} from '../editorConfig';
import {
  FEMME_FRIDAY_TEMPLATE_BASE_STYLE,
  FEMME_FRIDAY_TEMPLATE_ID,
  FEMME_FRIDAY_TEMPLATE_METADATA,
} from '../../../templates';

const createFemmeFridayElementStyles = () => {
  const styles = buildInitialElementStyles();
  styles.heading = {
    ...styles.heading,
    color: '#FDF2F8',
    letterSpacing: -0.8,
  };
  styles.subtitle = {
    ...styles.subtitle,
    color: '#FBCFE8',
    fontWeight: 600,
  };
  styles.scheduleDate = {
    ...styles.scheduleDate,
    color: '#F472B6',
    letterSpacing: 2.4,
  };
  styles.className = {
    ...styles.className,
    color: '#FDF2F8',
    fontWeight: 700,
  };
  styles.instructor = {
    ...styles.instructor,
    color: '#F9A8D4',
    fontWeight: 500,
  };
  styles.time = {
    ...styles.time,
    color: '#FDF2F8',
    fontWeight: 600,
    letterSpacing: 0.6,
  };
  styles.location = {
    ...styles.location,
    color: '#FCE7F3',
  };
  styles.duration = {
    ...styles.duration,
    color: '#F5D0FE',
  };
  styles.description = {
    ...styles.description,
    color: '#F5D0FE',
  };
  styles.footer = {
    ...styles.footer,
    color: '#F5D0FE',
    letterSpacing: 0.4,
  };
  return styles;
};

const createFemmeFridayTemplateDefinition = (): TemplateDefinition => ({
  id: FEMME_FRIDAY_TEMPLATE_ID,
  metadata: {
    ...FEMME_FRIDAY_TEMPLATE_METADATA,
    tags: FEMME_FRIDAY_TEMPLATE_METADATA.tags ? [...FEMME_FRIDAY_TEMPLATE_METADATA.tags] : undefined,
  },
  defaults: {
    createStyle: () => ({ ...FEMME_FRIDAY_TEMPLATE_BASE_STYLE }),
    createVisibleElements: () => [...DEFAULT_VISIBLE_ELEMENTS],
    createHiddenElements: () => [...DEFAULT_HIDDEN_ELEMENTS],
    createElementOrder: () => [...ELEMENT_ORDER],
    createElementStyles: () => createFemmeFridayElementStyles(),
    createSmartSpacing: () => ({
      ...DEFAULT_SMART_SPACING,
      heroGap: DEFAULT_SMART_SPACING.heroGap * 1.05,
      scheduleGap: DEFAULT_SMART_SPACING.scheduleGap * 1.12,
      cardPadding: DEFAULT_SMART_SPACING.cardPadding * 1.08,
      footerGap: DEFAULT_SMART_SPACING.footerGap * 1.05,
      timePadding: DEFAULT_SMART_SPACING.timePadding * 1.08,
    }),
  },
  editor: {
    styleTab: DEFAULT_STYLE_TAB_CONTROLS,
    contentTab: DEFAULT_CONTENT_TAB_CONTROLS,
    layoutTab: DEFAULT_LAYOUT_TAB_CONTROLS,
  },
});

export const FEMME_FRIDAY_TEMPLATE_DEFINITION = createFemmeFridayTemplateDefinition();
export { FEMME_FRIDAY_TEMPLATE_ID } from '../../../templates';
