import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_MODULES,
  TEMPLATE_GALLERY_CATEGORIES,
  CLASSIC_TEMPLATE_ID,
  CLASSIC_TEMPLATE_METADATA,
  FEMME_FRIDAY_TEMPLATE_ID,
  FEMME_FRIDAY_TEMPLATE_METADATA,
} from '../../templates';
import { CLASSIC_TEMPLATE_DEFINITION, FEMME_FRIDAY_TEMPLATE_DEFINITION } from '../../lib/templates';

const MODULE_EXPECTATIONS = [
  {
    id: CLASSIC_TEMPLATE_ID,
    metadata: CLASSIC_TEMPLATE_METADATA,
    definition: CLASSIC_TEMPLATE_DEFINITION,
  },
  {
    id: FEMME_FRIDAY_TEMPLATE_ID,
    metadata: FEMME_FRIDAY_TEMPLATE_METADATA,
    definition: FEMME_FRIDAY_TEMPLATE_DEFINITION,
  },
] as const;

describe('template modules', () => {
  it('includes the built-in template modules with matching metadata', () => {
    MODULE_EXPECTATIONS.forEach(({ id, metadata, definition }) => {
      const module = TEMPLATE_MODULES.find((entry) => entry.id === id);
      expect(module).toBeDefined();
      expect(module?.metadata.name).toBe(metadata.name);
      expect(module?.metadata.version).toBe(definition.metadata.version);
      expect(module?.gallery.categoryId).toBe('signature');
    });
  });

  it('provides a preview style aligned with the registry defaults', () => {
    MODULE_EXPECTATIONS.forEach(({ id, definition }) => {
      const module = TEMPLATE_MODULES.find((entry) => entry.id === id);
      const previewStyle = module?.previewStyle;
      const definitionStyle = definition.defaults.createStyle();
      expect(previewStyle).toEqual(definitionStyle);
    });
  });

  it('maps every module to a declared gallery category', () => {
    const categoryIds = new Set(TEMPLATE_GALLERY_CATEGORIES.map((category) => category.id));
    TEMPLATE_MODULES.forEach((module) => {
      expect(categoryIds.has(module.gallery.categoryId)).toBe(true);
    });
  });
});
