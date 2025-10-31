import type { Style, TemplateId } from '../types';
import type { TemplateMetadata } from '../lib/templates/registry';

export type TemplateGalleryCategoryId = string;

export interface TemplateGalleryCategory {
  readonly id: TemplateGalleryCategoryId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
}

export interface TemplateModuleGalleryConfig {
  readonly categoryId: TemplateGalleryCategoryId;
  readonly accentColor: string;
  readonly tagline: string;
  readonly features: ReadonlyArray<string>;
  readonly styleTags: ReadonlyArray<string>;
}

export interface TemplateModule {
  readonly id: TemplateId;
  readonly metadata: TemplateMetadata;
  readonly previewStyle: Style;
  readonly gallery: TemplateModuleGalleryConfig;
}
