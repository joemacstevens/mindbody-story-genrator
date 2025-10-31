import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_MODULES,
  TEMPLATE_GALLERY_CATEGORIES,
  CLASSIC_TEMPLATE_ID,
  CLASSIC_TEMPLATE_METADATA,
} from '../../templates';
import { CLASSIC_TEMPLATE_DEFINITION } from '../../lib/templates';

describe('template modules', () => {
  it('includes the classic template module with matching metadata', () => {
    const classicModule = TEMPLATE_MODULES.find((module) => module.id === CLASSIC_TEMPLATE_ID);
    expect(classicModule).toBeDefined();
    expect(classicModule?.metadata.name).toBe(CLASSIC_TEMPLATE_METADATA.name);
    expect(classicModule?.metadata.version).toBe(CLASSIC_TEMPLATE_DEFINITION.metadata.version);
    expect(classicModule?.gallery.categoryId).toBe('signature');
  });

  it('provides a preview style aligned with the registry defaults', () => {
    const classicModule = TEMPLATE_MODULES.find((module) => module.id === CLASSIC_TEMPLATE_ID);
    const previewStyle = classicModule?.previewStyle;
    const definitionStyle = CLASSIC_TEMPLATE_DEFINITION.defaults.createStyle();
    expect(previewStyle).toEqual(definitionStyle);
  });

  it('maps every module to a declared gallery category', () => {
    const categoryIds = new Set(TEMPLATE_GALLERY_CATEGORIES.map((category) => category.id));
    TEMPLATE_MODULES.forEach((module) => {
      expect(categoryIds.has(module.gallery.categoryId)).toBe(true);
    });
  });
});
