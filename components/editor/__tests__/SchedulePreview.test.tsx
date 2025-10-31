import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchedulePreview } from '../SchedulePreview';
import { MOCK_SCHEDULE } from '../../../constants';
import {
  CLASSIC_TEMPLATE_DEFINITION,
  CLASSIC_TEMPLATE_ID,
  __dangerousResetTemplateRegistryForTests,
  registerTemplate,
} from '../../../lib/templates';
import { __dangerousSetTemplateRegistryPreviewFlagForTests } from '../../../lib/templates/featureFlags';
import type { TemplateId } from '../../../types';

describe('SchedulePreview registry integration', () => {
  beforeEach(() => {
    __dangerousResetTemplateRegistryForTests();
    registerTemplate(CLASSIC_TEMPLATE_DEFINITION, { fallback: true });
    __dangerousSetTemplateRegistryPreviewFlagForTests(true);
  });

  afterEach(() => {
    __dangerousSetTemplateRegistryPreviewFlagForTests(undefined);
  });

  it('renders consistently when using registry defaults', () => {
    const definition = CLASSIC_TEMPLATE_DEFINITION;

    const manualMarkup = renderToStaticMarkup(
      <SchedulePreview
        schedule={MOCK_SCHEDULE}
        style={definition.defaults.createStyle()}
        visibleElements={definition.defaults.createVisibleElements()}
        elementStyles={definition.defaults.createElementStyles()}
        spacingScales={definition.defaults.createSmartSpacing()}
      />,
    );

    const registryMarkup = renderToStaticMarkup(
      <SchedulePreview templateId={CLASSIC_TEMPLATE_ID} schedule={MOCK_SCHEDULE} />,
    );

    expect(registryMarkup).toBe(manualMarkup);
  });

  it('matches the canonical classic template snapshot', () => {
    const markup = renderToStaticMarkup(
      <SchedulePreview templateId={CLASSIC_TEMPLATE_ID} schedule={MOCK_SCHEDULE} />,
    );

    expect(markup).toMatchSnapshot();
  });

  it('falls back to the registered default template when id is missing', () => {
    const fallbackMarkup = renderToStaticMarkup(
      <SchedulePreview templateId={CLASSIC_TEMPLATE_ID} schedule={MOCK_SCHEDULE} />,
    );

    const missingMarkup = renderToStaticMarkup(
      <SchedulePreview templateId={'missing-template' as TemplateId} schedule={MOCK_SCHEDULE} />,
    );

    expect(missingMarkup).toBe(fallbackMarkup);
  });
});
