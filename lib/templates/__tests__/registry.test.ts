import { describe, it, expect, beforeEach } from 'vitest';
import {
  CLASSIC_TEMPLATE_DEFINITION,
  CLASSIC_TEMPLATE_ID,
  __dangerousResetTemplateRegistryForTests,
  getFallbackTemplateId,
  getTemplateDefinition,
  getTemplateDefinitionOrThrow,
  registerTemplate,
  setFallbackTemplateId,
  validateTemplateDefinition,
} from '..';
import type { TemplateDefinition } from '..';

const createTestTemplateDefinition = (overrides: Partial<TemplateDefinition> = {}): TemplateDefinition => ({
  id: overrides.id ?? 'test-template',
  metadata: {
    name: overrides.metadata?.name ?? 'Test Template',
    description: overrides.metadata?.description,
    category: overrides.metadata?.category,
    tags: overrides.metadata?.tags,
    version: overrides.metadata?.version ?? '1.0.0',
    createdBy: overrides.metadata?.createdBy,
  },
  defaults: {
    createStyle: overrides.defaults?.createStyle ?? (() => CLASSIC_TEMPLATE_DEFINITION.defaults.createStyle()),
    createVisibleElements:
      overrides.defaults?.createVisibleElements ??
      (() => CLASSIC_TEMPLATE_DEFINITION.defaults.createVisibleElements()),
    createHiddenElements:
      overrides.defaults?.createHiddenElements ?? (() => CLASSIC_TEMPLATE_DEFINITION.defaults.createHiddenElements()),
    createElementOrder:
      overrides.defaults?.createElementOrder ?? (() => CLASSIC_TEMPLATE_DEFINITION.defaults.createElementOrder()),
    createElementStyles:
      overrides.defaults?.createElementStyles ?? (() => CLASSIC_TEMPLATE_DEFINITION.defaults.createElementStyles()),
    createSmartSpacing:
      overrides.defaults?.createSmartSpacing ?? (() => CLASSIC_TEMPLATE_DEFINITION.defaults.createSmartSpacing()),
  },
});

describe('template registry', () => {
  beforeEach(() => {
    __dangerousResetTemplateRegistryForTests();
    registerTemplate(CLASSIC_TEMPLATE_DEFINITION, { fallback: true });
  });

  it('validates well-formed template definitions', () => {
    const definition = createTestTemplateDefinition();
    const result = validateTemplateDefinition(definition);

    expect(result.ok).toBe(true);
    expect(result.ok && result.definition).toEqual(definition);
  });

  it('flags template definitions missing required metadata', () => {
    const invalid = {
      id: '',
      metadata: { name: '', version: '' },
      defaults: {},
    };

    const result = validateTemplateDefinition(invalid);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const issuePaths = result.issues.map((issue) => issue.path);
      expect(issuePaths).toContain('definition.id');
      expect(issuePaths).toContain('definition.metadata.name');
      expect(issuePaths).toContain('definition.metadata.version');
      expect(issuePaths).toContain('definition.defaults.createStyle');
      expect(issuePaths).toContain('definition.defaults.createVisibleElements');
      expect(issuePaths).toContain('definition.defaults.createHiddenElements');
    }
  });

  it('registers templates and resolves fallback when id is missing', () => {
    const customTemplate = createTestTemplateDefinition({ id: 'custom-template' });
    registerTemplate(customTemplate);

    const resolved = getTemplateDefinition('custom-template');
    expect(resolved?.id).toBe('custom-template');

    const fallback = getTemplateDefinition('unknown-template');
    expect(fallback?.id).toBe(CLASSIC_TEMPLATE_ID);

    expect(getFallbackTemplateId()).toBe(CLASSIC_TEMPLATE_ID);
  });

  it('throws when setting fallback to unknown template id', () => {
    expect(() => setFallbackTemplateId('does-not-exist')).toThrowError(/unregistered/);
  });

  it('prevents registering the same template twice without replace option', () => {
    const duplicate = createTestTemplateDefinition({ id: CLASSIC_TEMPLATE_ID });
    expect(() => registerTemplate(duplicate)).toThrowError(/already registered/);
  });

  it('returns a definition when explicitly requested or throws if none is available', () => {
    const result = getTemplateDefinitionOrThrow(CLASSIC_TEMPLATE_ID);
    expect(result.id).toBe(CLASSIC_TEMPLATE_ID);

    __dangerousResetTemplateRegistryForTests();
    expect(() => getTemplateDefinitionOrThrow('missing')).toThrowError(/no fallback template is available/);
  });
});
