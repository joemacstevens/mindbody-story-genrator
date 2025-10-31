export type TemplateFeatureFlags = {
  templateRegistryPreviews?: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __STUDIOGRAM_TEMPLATE_FLAGS__: TemplateFeatureFlags | undefined;
}

const DEFAULT_FLAGS: Required<TemplateFeatureFlags> = {
  templateRegistryPreviews: true,
};

export const isTemplateRegistryPreviewEnabled = (): boolean => {
  const flags = globalThis.__STUDIOGRAM_TEMPLATE_FLAGS__;
  if (typeof flags?.templateRegistryPreviews === 'boolean') {
    return flags.templateRegistryPreviews;
  }
  return DEFAULT_FLAGS.templateRegistryPreviews;
};

/** @internal - testing hook */
export const __dangerousSetTemplateRegistryPreviewFlagForTests = (
  value: boolean | undefined,
): void => {
  const flags = (globalThis.__STUDIOGRAM_TEMPLATE_FLAGS__ ??= {});
  if (typeof value === 'boolean') {
    flags.templateRegistryPreviews = value;
  } else {
    delete flags.templateRegistryPreviews;
  }
};

export {};
