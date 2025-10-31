import type { Style } from '../../types';
import type { TemplateModule } from '../types';
import type { TemplateMetadata } from '../../lib/templates/registry';

export const FEMME_FRIDAY_TEMPLATE_ID = 'femme-friday' as const;

export const FEMME_FRIDAY_TEMPLATE_METADATA: TemplateMetadata = {
  name: 'Femme Friday',
  description: 'Gradient story inspired by Femme NJ with a soft timeline vibe for boutique studios.',
  category: 'story',
  tags: ['story', 'timeline', 'gradient'],
  version: '1.0.0',
  createdBy: 'studiogram',
};

export const FEMME_FRIDAY_TEMPLATE_BASE_STYLE: Style = {
  fontFamily: "'Poppins', sans-serif",
  heading: 'CLASS SCHEDULE',
  subtitle: 'Friday',
  footer: '@femme.nj',
  backgroundColor: '#3b0a55',
  cardBackgroundColor: 'rgba(255, 255, 255, 0.08)',
  textColorPrimary: '#FDF2F8',
  textColorSecondary: '#F9A8D4',
  accent: '#F472B6',
  bgImage: '',
  bgFit: 'cover',
  bgBlur: 0,
  bgPosition: '50% 50%',
  logoUrl: '',
  logoPosition: 'bottom-center',
  logoPadding: 48,
  logoSize: 100,
  overlayColor: 'rgba(59, 10, 85, 0.25)',
  headingWeight: '700',
  bodySize: 34,
  cornerRadius: '2xl',
  dividerStyle: 'none',
  accentLines: false,
  footerBar: false,
  supportsBackgroundImage: true,
  showHeading: true,
  showSubtitle: true,
  showSchedule: true,
  showFooter: true,
  showScheduleDate: false,
  cardCornerRadius: 28,
  spacing: 'spacious',
  layoutStyle: 'list',
};

export const FEMME_FRIDAY_TEMPLATE_MODULE: TemplateModule = {
  id: FEMME_FRIDAY_TEMPLATE_ID,
  metadata: FEMME_FRIDAY_TEMPLATE_METADATA,
  previewStyle: { ...FEMME_FRIDAY_TEMPLATE_BASE_STYLE },
  gallery: {
    categoryId: 'signature',
    accentColor: FEMME_FRIDAY_TEMPLATE_BASE_STYLE.accent,
    tagline: 'Pink gradient story layout with glowing timeline accents.',
    features: ['High-contrast typography', 'Soft neon gradient', 'Timeline-inspired spacing'],
    styleTags: ['gradient', 'timeline', 'boutique'],
  },
};
