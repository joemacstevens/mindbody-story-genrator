import type { TemplateId, Style, ScheduleElementId, ScheduleElementStyle } from '../../types';
import type { SmartSpacingScales } from '../../components/editor/smartTextSizing';
import type { TemplateEditorControls } from './editorConfig';

export type TemplateValidationIssue = {
  readonly path: string;
  readonly message: string;
};

export type TemplateValidationResult =
  | { readonly ok: true; readonly definition: TemplateDefinition }
  | { readonly ok: false; readonly issues: TemplateValidationIssue[] };

export interface TemplateMetadata {
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly version: string;
  readonly createdBy?: string;
}

export interface TemplateDefaultFactories {
  readonly createStyle: () => Style;
  readonly createVisibleElements: () => ScheduleElementId[];
  readonly createHiddenElements: () => ScheduleElementId[];
  readonly createElementOrder: () => ScheduleElementId[];
  readonly createElementStyles: () => Record<ScheduleElementId, ScheduleElementStyle>;
  readonly createSmartSpacing: () => SmartSpacingScales;
}

export interface TemplateDefinition {
  readonly id: TemplateId;
  readonly metadata: TemplateMetadata;
  readonly defaults: TemplateDefaultFactories;
  readonly editor?: TemplateEditorControls;
}

type RegistryMap = Map<TemplateId, TemplateDefinition>;

const templateRegistry: RegistryMap = new Map();
let fallbackTemplateId: TemplateId | null = null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

const collectIssues = (
  issues: TemplateValidationIssue[],
  path: string,
  message: string,
) => {
  issues.push({ path, message });
};

export const validateTemplateDefinition = (input: unknown): TemplateValidationResult => {
  const issues: TemplateValidationIssue[] = [];

  if (!isRecord(input)) {
    collectIssues(issues, 'definition', 'Template definition must be an object.');
    return { ok: false, issues };
  }

  if (!isNonEmptyString(input.id)) {
    collectIssues(issues, 'definition.id', 'Template id must be a non-empty string.');
  }

  if (!isRecord(input.metadata)) {
    collectIssues(issues, 'definition.metadata', 'Metadata must be an object.');
  } else {
    if (!isNonEmptyString(input.metadata.name)) {
      collectIssues(issues, 'definition.metadata.name', 'Name is required.');
    }
    if (!isNonEmptyString(input.metadata.version)) {
      collectIssues(issues, 'definition.metadata.version', 'Version is required.');
    }
    if (input.metadata.tags !== undefined) {
      if (!Array.isArray(input.metadata.tags) || !input.metadata.tags.every(isNonEmptyString)) {
        collectIssues(
          issues,
          'definition.metadata.tags',
          'Tags, when provided, must be non-empty strings.',
        );
      }
    }
  }

  if (!isRecord(input.defaults)) {
    collectIssues(issues, 'definition.defaults', 'Defaults must be an object with factories.');
  } else {
    const defaults = input.defaults;
    if (!isFunction(defaults.createStyle)) {
      collectIssues(
        issues,
        'definition.defaults.createStyle',
        'createStyle factory must be a function.',
      );
    }
    if (!isFunction(defaults.createVisibleElements)) {
      collectIssues(
        issues,
        'definition.defaults.createVisibleElements',
        'createVisibleElements factory must be a function.',
      );
    }
    if (!isFunction(defaults.createHiddenElements)) {
      collectIssues(
        issues,
        'definition.defaults.createHiddenElements',
        'createHiddenElements factory must be a function.',
      );
    }
    if (!isFunction(defaults.createElementOrder)) {
      collectIssues(
        issues,
        'definition.defaults.createElementOrder',
        'createElementOrder factory must be a function.',
      );
    }
    if (!isFunction(defaults.createElementStyles)) {
      collectIssues(
        issues,
        'definition.defaults.createElementStyles',
        'createElementStyles factory must be a function.',
      );
    }
    if (!isFunction(defaults.createSmartSpacing)) {
      collectIssues(
        issues,
        'definition.defaults.createSmartSpacing',
        'createSmartSpacing factory must be a function.',
      );
    }
  }

  if (input.editor !== undefined && !isRecord(input.editor)) {
    collectIssues(issues, 'definition.editor', 'Editor controls must be an object when provided.');
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, definition: input as TemplateDefinition };
};

const cloneStyleTabControls = (controls: TemplateEditorControls['styleTab']) => {
  if (!controls) return undefined;
  return {
    ...controls,
    palettes: controls.palettes
      ? controls.palettes.map((palette) => ({
          ...palette,
          colors: { ...palette.colors },
          preview: [...palette.preview],
        }))
      : undefined,
    logoPositions: controls.logoPositions ? [...controls.logoPositions] : undefined,
  };
};

const cloneContentTabControls = (controls: TemplateEditorControls['contentTab']) => {
  if (!controls) return undefined;
  return {
    ...controls,
    elementsMeta: controls.elementsMeta
      ? Object.fromEntries(
          Object.entries(controls.elementsMeta).map(([key, value]) => [
            key,
            value ? { ...value } : value,
          ]),
        )
      : undefined,
    heroElementIds: controls.heroElementIds ? [...controls.heroElementIds] : undefined,
    footerElementIds: controls.footerElementIds ? [...controls.footerElementIds] : undefined,
    scheduleElementIds: controls.scheduleElementIds ? [...controls.scheduleElementIds] : undefined,
  };
};

const cloneLayoutTabControls = (controls: TemplateEditorControls['layoutTab']) => {
  if (!controls) return undefined;
  return {
    ...controls,
    cornerRadiusRange: controls.cornerRadiusRange ? { ...controls.cornerRadiusRange } : undefined,
    spacingOptions: controls.spacingOptions
      ? controls.spacingOptions.map((option) => ({ ...option }))
      : undefined,
    layoutOptions: controls.layoutOptions ? controls.layoutOptions.map((option) => ({ ...option })) : undefined,
    dividerOptions: controls.dividerOptions ? controls.dividerOptions.map((option) => ({ ...option })) : undefined,
  };
};

const freezeDefinition = (definition: TemplateDefinition): TemplateDefinition => ({
  ...definition,
  metadata: {
    ...definition.metadata,
    tags: definition.metadata.tags ? Object.freeze([...definition.metadata.tags]) : undefined,
  },
  defaults: {
    ...definition.defaults,
  },
  editor: definition.editor
    ? {
        styleTab: cloneStyleTabControls(definition.editor.styleTab),
        contentTab: cloneContentTabControls(definition.editor.contentTab),
        layoutTab: cloneLayoutTabControls(definition.editor.layoutTab),
      }
    : undefined,
});

export const registerTemplate = (
  definition: TemplateDefinition,
  options: { fallback?: boolean; replace?: boolean } = {},
): TemplateDefinition => {
  const validation = validateTemplateDefinition(definition);
  if (!validation.ok) {
    const message = validation.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid template definition for "${definition.id ?? 'unknown'}":\n${message}`);
  }

  if (!options.replace && templateRegistry.has(definition.id)) {
    throw new Error(`Template "${definition.id}" is already registered.`);
  }

  const frozen = freezeDefinition(definition);
  templateRegistry.set(definition.id, frozen);

  if (options.fallback || !fallbackTemplateId) {
    fallbackTemplateId = definition.id;
  }

  return frozen;
};

export const setFallbackTemplateId = (templateId: TemplateId): void => {
  if (!templateRegistry.has(templateId)) {
    throw new Error(`Cannot set fallback template to unregistered id "${templateId}".`);
  }
  fallbackTemplateId = templateId;
};

export const getFallbackTemplateId = (): TemplateId | null => fallbackTemplateId;

export const getTemplateDefinition = (templateId?: TemplateId | null): TemplateDefinition | null => {
  if (templateId && templateRegistry.has(templateId)) {
    return templateRegistry.get(templateId) ?? null;
  }
  if (fallbackTemplateId && templateRegistry.has(fallbackTemplateId)) {
    return templateRegistry.get(fallbackTemplateId) ?? null;
  }
  return null;
};

export const getTemplateDefinitionOrThrow = (templateId?: TemplateId | null): TemplateDefinition => {
  const definition = getTemplateDefinition(templateId);
  if (!definition) {
    throw new Error(
      `Template "${templateId ?? 'unknown'}" is not registered and no fallback template is available.`,
    );
  }
  return definition;
};

export const listTemplateDefinitions = (): TemplateDefinition[] => Array.from(templateRegistry.values());

export const isTemplateRegistered = (templateId: TemplateId): boolean => templateRegistry.has(templateId);

/** @internal - exposed for test hooks only */
export const __dangerousResetTemplateRegistryForTests = (): void => {
  templateRegistry.clear();
  fallbackTemplateId = null;
};
