import type { Style } from '../../types';
import type { TemplateModule } from '../types';
import type { TemplateMetadata } from '../../lib/templates/registry';

export const CLASSIC_TEMPLATE_ID = 'classic-story' as const;

export const CLASSIC_TEMPLATE_METADATA: TemplateMetadata = {
  name: 'Classic Story',
  description: 'Single-column story layout with hero, stacked schedule list, and optional footer.',
  category: 'story',
  tags: ['story', 'classic', 'default'],
  version: '1.0.0',
  createdBy: 'studiogram',
};

export const CLASSIC_TEMPLATE_BASE_STYLE: Style = {
  fontFamily: "'Inter', sans-serif",
  heading: 'CLASS SCHEDULE',
  subtitle: 'Wednesday',
  footer: '@yourgymname',
  backgroundColor: '#111827',
  cardBackgroundColor: '#ef4444',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#94a3b8',
  accent: '#ef4444',
  bgImage: '',
  bgFit: 'cover',
  bgBlur: 0,
  bgPosition: '50% 50%',
  logoUrl: '',
  logoPosition: 'bottom-center',
  logoPadding: 48,
  logoSize: 100,
  overlayColor: 'rgba(0, 0, 0, 0)',
  headingWeight: '900',
  bodySize: 36,
  cornerRadius: '2xl',
  dividerStyle: 'none',
  accentLines: true,
  footerBar: false,
  supportsBackgroundImage: true,
  showHeading: true,
  showSubtitle: true,
  showSchedule: true,
  showFooter: true,
  showScheduleDate: true,
  cardCornerRadius: 14,
  spacing: 'comfortable',
  layoutStyle: 'list',
};

export const CLASSIC_TEMPLATE_MODULE: TemplateModule = {
  id: CLASSIC_TEMPLATE_ID,
  metadata: CLASSIC_TEMPLATE_METADATA,
  previewStyle: { ...CLASSIC_TEMPLATE_BASE_STYLE },
  gallery: {
    categoryId: 'signature',
    accentColor: CLASSIC_TEMPLATE_BASE_STYLE.accent,
    tagline: 'Bold list-based schedule with accent hero for daily programming.',
    features: ['IG Story optimized', 'Large readable text', 'Micro-interactions'],
    styleTags: ['classic', 'list', 'bold'],
  },
};
