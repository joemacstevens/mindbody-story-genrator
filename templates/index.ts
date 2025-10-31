import type { TemplateId } from '../types';
import type { TemplateGalleryCategory, TemplateModule } from './types';
import { CLASSIC_TEMPLATE_MODULE, CLASSIC_TEMPLATE_ID, CLASSIC_TEMPLATE_BASE_STYLE, CLASSIC_TEMPLATE_METADATA } from './classic';

export const TEMPLATE_GALLERY_CATEGORIES: TemplateGalleryCategory[] = [
  {
    id: 'signature',
    name: 'Signature',
    description: 'Studiogram default layouts crafted for daily gym schedules.',
    icon: '✨',
  },
];

export const TEMPLATE_MODULES: TemplateModule[] = [CLASSIC_TEMPLATE_MODULE];

export const BUILT_IN_TEMPLATE_IDS = new Set<TemplateId>(
  TEMPLATE_MODULES.map((module) => module.id),
);

export const getTemplateModule = (templateId: TemplateId): TemplateModule | null =>
  TEMPLATE_MODULES.find((module) => module.id === templateId) ?? null;

export { CLASSIC_TEMPLATE_ID, CLASSIC_TEMPLATE_BASE_STYLE, CLASSIC_TEMPLATE_METADATA } from './classic';
export type { TemplateModule, TemplateGalleryCategory } from './types';
export type { TemplateGalleryCategoryId } from './types';
