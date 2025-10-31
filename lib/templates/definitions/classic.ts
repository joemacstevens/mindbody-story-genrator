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
  CLASSIC_TEMPLATE_BASE_STYLE,
  CLASSIC_TEMPLATE_ID,
  CLASSIC_TEMPLATE_METADATA,
} from '../../../templates';

const createClassicTemplateDefinition = (): TemplateDefinition => ({
  id: CLASSIC_TEMPLATE_ID,
  metadata: {
    ...CLASSIC_TEMPLATE_METADATA,
    tags: CLASSIC_TEMPLATE_METADATA.tags ? [...CLASSIC_TEMPLATE_METADATA.tags] : undefined,
  },
  defaults: {
    createStyle: () => ({ ...CLASSIC_TEMPLATE_BASE_STYLE }),
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
export { CLASSIC_TEMPLATE_ID } from '../../../templates';
