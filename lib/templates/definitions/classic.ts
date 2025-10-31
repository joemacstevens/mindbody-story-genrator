import { DEFAULT_APP_SETTINGS } from '../../../constants';
import {
  DEFAULT_VISIBLE_ELEMENTS,
  DEFAULT_HIDDEN_ELEMENTS,
  ELEMENT_ORDER,
  buildInitialElementStyles,
} from '../../../components/editor/contentElements';
import { DEFAULT_SMART_SPACING } from '../../../components/editor/smartTextSizing';
import type { Style } from '../../../types';
import type { TemplateDefinition } from '../registry';
import {
  DEFAULT_CONTENT_TAB_CONTROLS,
  DEFAULT_LAYOUT_TAB_CONTROLS,
  DEFAULT_STYLE_TAB_CONTROLS,
} from '../editorConfig';

const deriveBaseStyle = (): Style => {
  const defaultTemplateId = DEFAULT_APP_SETTINGS.activeTemplateId;
  const baseStyle = DEFAULT_APP_SETTINGS.configs[defaultTemplateId];

  if (!baseStyle) {
    throw new Error(
      `Unable to resolve default style for classic template using template id "${defaultTemplateId}".`,
    );
  }

  return { ...baseStyle };
};

export const CLASSIC_TEMPLATE_ID = 'classic-story' as const;

const createClassicTemplateDefinition = (): TemplateDefinition => ({
  id: CLASSIC_TEMPLATE_ID,
  metadata: {
    name: 'Classic Story',
    description: 'Single-column story layout with hero, stacked schedule list, and optional footer.',
    category: 'story',
    tags: ['story', 'classic', 'default'],
    version: '1.0.0',
    createdBy: 'studiogram',
  },
  defaults: {
    createStyle: () => deriveBaseStyle(),
    createVisibleElements: () => [...DEFAULT_VISIBLE_ELEMENTS],
    createHiddenElements: () => [...DEFAULT_HIDDEN_ELEMENTS],
    createElementOrder: () => [...ELEMENT_ORDER],
    createElementStyles: () => buildInitialElementStyles(),
    createSmartSpacing: () => ({ ...DEFAULT_SMART_SPACING }),
  },
  editor: {
    styleTab: DEFAULT_STYLE_TAB_CONTROLS,
    contentTab: DEFAULT_CONTENT_TAB_CONTROLS,
    layoutTab: DEFAULT_LAYOUT_TAB_CONTROLS,
  },
});

export const CLASSIC_TEMPLATE_DEFINITION = createClassicTemplateDefinition();
