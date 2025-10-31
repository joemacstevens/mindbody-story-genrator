import { CLASSIC_TEMPLATE_DEFINITION } from './definitions/classic';
import {
  registerTemplate,
  setFallbackTemplateId,
  getTemplateDefinition,
  getTemplateDefinitionOrThrow,
  getFallbackTemplateId,
  listTemplateDefinitions,
  isTemplateRegistered,
  validateTemplateDefinition,
  __dangerousResetTemplateRegistryForTests,
  type TemplateDefinition,
  type TemplateDefaultFactories,
  type TemplateMetadata,
  type TemplateValidationIssue,
  type TemplateValidationResult,
} from './registry';

if (!isTemplateRegistered(CLASSIC_TEMPLATE_DEFINITION.id)) {
  registerTemplate(CLASSIC_TEMPLATE_DEFINITION, { fallback: true });
}

export {
  registerTemplate,
  setFallbackTemplateId,
  getTemplateDefinition,
  getTemplateDefinitionOrThrow,
  getFallbackTemplateId,
  listTemplateDefinitions,
  isTemplateRegistered,
  validateTemplateDefinition,
  __dangerousResetTemplateRegistryForTests,
};

export type {
  TemplateDefinition,
  TemplateDefaultFactories,
  TemplateMetadata,
  TemplateValidationIssue,
  TemplateValidationResult,
};

export { CLASSIC_TEMPLATE_DEFINITION, CLASSIC_TEMPLATE_ID } from './definitions/classic';
