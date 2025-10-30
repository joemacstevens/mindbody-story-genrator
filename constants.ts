import type { AppSettings, Schedule, Style, ColorPalette } from './types';

// --- Base styles to reduce repetition ---
// FIX: Added `as const` to properties with string literal union types (`logoPosition`,
// `headingWeight`, etc.). This ensures TypeScript infers the specific literal type
// (e.g., 'bottom-center') rather than the general `string` type, resolving assignability
// errors when this base object is spread into objects that implement the `Style` interface.
const BASE_STYLE_SHARED = {
  bgImage: '',
  bgFit: 'cover' as const,
  bgBlur: 0,
  bgPosition: '50% 50%',
  logoUrl: '',
  logoPosition: 'bottom-center' as const,
  logoPadding: 48,
  logoSize: 100,
  subtitle: 'Teaneck, NJ',
  overlayColor: 'rgba(0, 0, 0, 0)',
  headingWeight: '900' as const,
  bodySize: 36, // Corresponds to text-4xl
  cornerRadius: '2xl' as const,
  dividerStyle: 'thin' as const,
  accentLines: true,
  footerBar: false,
  showHeading: true,
  showSubtitle: true,
  showSchedule: true,
  showFooter: true,
  showScheduleDate: true,
};

// --- New Theme Presets ---

const IMPACT_DARK: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Bebas Neue', sans-serif",
  accent: '#E74C3C',
  heading: 'CLASS SCHEDULE',
  footer: 'differentbreedsports.com',
  backgroundColor: '#000000',
  cardBackgroundColor: 'rgba(25, 25, 25, 0.5)',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#A0A0A0',
  supportsBackgroundImage: true,
};

const IMPACT_LIGHT: Style = {
  ...IMPACT_DARK,
  backgroundColor: '#FFFFFF',
  cardBackgroundColor: 'rgba(250, 250, 250, 0.5)',
  textColorPrimary: '#111111',
  textColorSecondary: '#666666',
  supportsBackgroundImage: true,
};

const CLASSIC: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Lexend', sans-serif",
  accent: '#1F7A8C',
  heading: 'Today’s Schedule',
  footer: 'Find Your Strength',
  backgroundColor: '#FAFAFA',
  cardBackgroundColor: 'rgba(255, 255, 255, 0.6)',
  textColorPrimary: '#1C1C1C',
  textColorSecondary: '#5e5e5e',
  headingWeight: '700',
  bodySize: 32,
  cornerRadius: 'lg',
  dividerStyle: 'dotted',
  supportsBackgroundImage: true,
};

const ENERGETIC: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Montserrat', sans-serif",
  accent: '#F4B400',
  heading: 'GET AFTER IT',
  footer: 'Energy & Excellence',
  backgroundColor: '#3A1A6A',
  cardBackgroundColor: 'rgba(20, 9, 38, 0.5)',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#cab2f0',
  headingWeight: '700',
  bodySize: 34,
  cornerRadius: 'md',
  dividerStyle: 'thick',
  footerBar: true,
  supportsBackgroundImage: true,
};

// --- HIGH-ENERGY / ATHLETIC TEMPLATES ---

const CROSSFIT_BEAST: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Bebas Neue', sans-serif",
  accent: '#DC2626',
  heading: 'TODAY\'S GRIND',
  footer: 'No Excuses. Just Results.',
  backgroundColor: '#0A0A0A',
  cardBackgroundColor: 'rgba(20, 20, 20, 0.8)',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#999999',
  headingWeight: '900',
  bodySize: 38,
  cornerRadius: 'sm',
  dividerStyle: 'thick',
  accentLines: true,
  footerBar: true,
  supportsBackgroundImage: true,
};

const HIIT_IMPACT: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Montserrat', sans-serif",
  accent: '#00F5FF',
  heading: 'POWER HOUR',
  footer: 'Sweat More. Worry Less.',
  backgroundColor: '#000000',
  cardBackgroundColor: 'rgba(15, 15, 30, 0.7)',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#00F5FF',
  headingWeight: '900',
  bodySize: 36,
  cornerRadius: 'none',
  dividerStyle: 'thin',
  accentLines: true,
  footerBar: false,
  supportsBackgroundImage: true,
  cardCornerRadius: 24,
  spacing: 'comfortable',
  layoutStyle: 'list',
};

const BOXING_KNOCKOUT: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Anton', sans-serif",
  accent: '#EF4444',
  heading: 'FIGHT SCHEDULE',
  footer: 'Train Like a Champion',
  backgroundColor: '#1A1A1A',
  cardBackgroundColor: 'rgba(40, 40, 40, 0.85)',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#B0B0B0',
  headingWeight: '900',
  bodySize: 38,
  cornerRadius: 'none',
  dividerStyle: 'thick',
  accentLines: true,
  footerBar: true,
  supportsBackgroundImage: true,
};

const ATHLETIC_PRO: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  accent: '#2563EB',
  heading: 'Class Schedule',
  footer: 'Performance Matters',
  backgroundColor: '#F8FAFC',
  cardBackgroundColor: 'rgba(255, 255, 255, 0.85)',
  textColorPrimary: '#0F172A',
  textColorSecondary: '#64748B',
  headingWeight: '700',
  bodySize: 34,
  cornerRadius: 'lg',
  dividerStyle: 'thin',
  accentLines: false,
  footerBar: false,
  supportsBackgroundImage: true,
};

// --- SERENE / WELLNESS TEMPLATES ---

const YOGA_ZEN: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Lexend', sans-serif",
  accent: '#059669',
  heading: 'Today\'s Practice',
  footer: 'Breathe. Flow. Restore.',
  backgroundColor: '#F0F9F4',
  cardBackgroundColor: 'rgba(255, 255, 255, 0.75)',
  textColorPrimary: '#064E3B',
  textColorSecondary: '#6B7280',
  headingWeight: '500',
  bodySize: 32,
  cornerRadius: '2xl',
  dividerStyle: 'dotted',
  accentLines: false,
  footerBar: false,
  supportsBackgroundImage: true,
};

const PILATES_GRACE: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Playfair Display', serif",
  accent: '#D4A574',
  heading: 'Today\'s Sessions',
  footer: 'Strength Through Grace',
  backgroundColor: '#FDFBF7',
  cardBackgroundColor: 'rgba(255, 255, 255, 0.9)',
  textColorPrimary: '#2C2C2C',
  textColorSecondary: '#8B7355',
  headingWeight: '700',
  bodySize: 30,
  cornerRadius: 'lg',
  dividerStyle: 'thin',
  accentLines: false,
  footerBar: false,
  supportsBackgroundImage: true,
};

const WELLNESS_RETREAT: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Lexend', sans-serif",
  accent: '#10B981',
  heading: 'Wellness Schedule',
  footer: 'Nourish Your Body & Mind',
  backgroundColor: '#ECFDF5',
  cardBackgroundColor: 'rgba(255, 255, 255, 0.8)',
  textColorPrimary: '#065F46',
  textColorSecondary: '#6B7280',
  headingWeight: '500',
  bodySize: 32,
  cornerRadius: '2xl',
  dividerStyle: 'none',
  accentLines: false,
  footerBar: false,
  supportsBackgroundImage: true,
};

const MEDITATION_FLOW: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  accent: '#A78BFA',
  heading: 'Mindfulness Schedule',
  footer: 'Find Your Peace',
  backgroundColor: '#FAF5FF',
  cardBackgroundColor: 'rgba(255, 255, 255, 0.7)',
  textColorPrimary: '#5B21B6',
  textColorSecondary: '#9333EA',
  headingWeight: '500',
  bodySize: 30,
  cornerRadius: '2xl',
  dividerStyle: 'dotted',
  accentLines: false,
  footerBar: false,
  supportsBackgroundImage: true,
};


// Replace built-in templates with mock-based set to align with gym-template-browser.html
const COMPACT_TIME_BLOCKS: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  heading: 'CLASS SCHEDULE',
  subtitle: 'Wednesday',
  footer: '@yourgymname',
  backgroundColor: '#111827',
  cardBackgroundColor: '#ef4444',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#94a3b8',
  accent: '#ef4444',
  spacing: 'comfortable',
  dividerStyle: 'none',
  cardCornerRadius: 14,
  layoutStyle: 'list',
  supportsBackgroundImage: true,
};

const TIMELINE_GRADIENT: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  heading: "TODAY'S CLASSES",
  subtitle: 'Wednesday, October 29',
  footer: '@yourgymname',
  backgroundColor: '#0f172a',
  cardBackgroundColor: 'rgba(30,41,59,0.75)',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#94a3b8',
  accent: '#6366f1',
  spacing: 'comfortable',
  dividerStyle: 'thin',
  cardCornerRadius: 16,
  layoutStyle: 'list',
  supportsBackgroundImage: true,
};

const BOLD_CARDS_STACK: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Bebas Neue', sans-serif",
  heading: 'GYM SCHEDULE',
  subtitle: 'Wed, Oct 29',
  footer: '@yourgymname',
  backgroundColor: '#f3f4f6',
  cardBackgroundColor: '#ef4444',
  textColorPrimary: '#111827',
  textColorSecondary: '#6b7280',
  accent: '#ef4444',
  spacing: 'comfortable',
  dividerStyle: 'none',
  cardCornerRadius: 24,
  layoutStyle: 'list',
  supportsBackgroundImage: true,
};

const MINIMAL_LIST: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Lexend', sans-serif",
  heading: 'Class Schedule',
  subtitle: 'Wednesday, October 29',
  footer: '@yourgymname',
  backgroundColor: '#FFFFFF',
  cardBackgroundColor: '#FFFFFF',
  textColorPrimary: '#111827',
  textColorSecondary: '#6b7280',
  accent: '#e5e7eb',
  spacing: 'comfortable',
  dividerStyle: 'thin',
  cardCornerRadius: 8,
  layoutStyle: 'list',
  supportsBackgroundImage: true,
};

const TWO_COLUMN_SPLIT: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  heading: 'CLASS SCHEDULE',
  subtitle: 'October 29, 2025',
  footer: '@yourgymname',
  backgroundColor: '#1e293b',
  cardBackgroundColor: 'rgba(51,65,85,0.85)',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#94a3b8',
  accent: '#334155',
  spacing: 'compact',
  dividerStyle: 'none',
  cardCornerRadius: 20,
  layoutStyle: 'grid',
  supportsBackgroundImage: true,
};

const COLOR_GRADIENT_FLOW: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  heading: '💪 GYM',
  subtitle: 'Wednesday, Oct 29',
  footer: '@yourgymname',
  backgroundColor: '#4c4ddc',
  cardBackgroundColor: 'rgba(255,255,255,0.1)',
  textColorPrimary: '#FFFFFF',
  textColorSecondary: '#FFFFFF',
  accent: '#f093fb',
  spacing: 'comfortable',
  dividerStyle: 'none',
  cardCornerRadius: 32,
  layoutStyle: 'list',
  supportsBackgroundImage: true,
};

const COMPACT_TABLE_GRID: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  heading: 'CLASS SCHEDULE',
  subtitle: 'Wednesday, October 29',
  footer: '@yourgymname',
  backgroundColor: '#fafafa',
  cardBackgroundColor: '#FFFFFF',
  textColorPrimary: '#111827',
  textColorSecondary: '#6b7280',
  accent: '#e5e7eb',
  spacing: 'compact',
  dividerStyle: 'thin',
  cardCornerRadius: 8,
  layoutStyle: 'grid',
  supportsBackgroundImage: true,
};

const NEON_FITNESS: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  heading: 'GYM',
  subtitle: 'WEDNESDAY',
  footer: '@yourgymname',
  backgroundColor: '#000000',
  cardBackgroundColor: 'rgba(0,0,0,0.6)',
  textColorPrimary: '#00FF00',
  textColorSecondary: '#00FF00',
  accent: '#FF00FF',
  spacing: 'comfortable',
  dividerStyle: 'thin',
  cardCornerRadius: 12,
  layoutStyle: 'list',
  supportsBackgroundImage: true,
};

const MORNING_TO_EVENING: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  heading: '☀️ MORNING',
  subtitle: 'Day Progression',
  footer: '@yourgymname',
  backgroundColor: '#1e293b',
  cardBackgroundColor: 'rgba(255,255,255,0.1)',
  textColorPrimary: '#F8FAFC',
  textColorSecondary: '#cbd5e1',
  accent: '#1e40af',
  spacing: 'comfortable',
  dividerStyle: 'thin',
  cardCornerRadius: 20,
  layoutStyle: 'list',
  supportsBackgroundImage: true,
};

const ULTRA_COMPACT_LIST: Style = {
  ...BASE_STYLE_SHARED,
  fontFamily: "'Inter', sans-serif",
  heading: 'CLASS SCHEDULE',
  subtitle: 'Wed, Oct 29',
  footer: '@yourgymname',
  backgroundColor: '#ffffff',
  cardBackgroundColor: '#FFFFFF',
  textColorPrimary: '#111827',
  textColorSecondary: '#6b7280',
  accent: '#6366f1',
  spacing: 'compact',
  dividerStyle: 'thin',
  cardCornerRadius: 8,
  layoutStyle: 'list',
  supportsBackgroundImage: true,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  activeTemplateId: 'compact-time-blocks',
  configs: {
    'compact-time-blocks': COMPACT_TIME_BLOCKS,
    'timeline-gradient': TIMELINE_GRADIENT,
    'bold-cards-stack': BOLD_CARDS_STACK,
    'minimal-list': MINIMAL_LIST,
    'two-column-split': TWO_COLUMN_SPLIT,
    'color-gradient-flow': COLOR_GRADIENT_FLOW,
    'compact-table-grid': COMPACT_TABLE_GRID,
    'neon-fitness': NEON_FITNESS,
    'morning-to-evening': MORNING_TO_EVENING,
    'ultra-compact-list': ULTRA_COMPACT_LIST,
  },
};

// Template metadata for categorization and display
export const TEMPLATE_CATEGORIES = {
  compact: {
    name: 'Compact',
    description: 'Maximum density lists and split layouts',
    icon: '🧱',
    templates: ['compact-time-blocks', 'two-column-split', 'ultra-compact-list'],
  },
  timeline: {
    name: 'Timeline',
    description: 'Vertical progression through the day',
    icon: '🕒',
    templates: ['timeline-gradient', 'morning-to-evening'],
  },
  colorful: {
    name: 'Colorful',
    description: 'Gradients and vibrant accents',
    icon: '🌈',
    templates: ['color-gradient-flow', 'neon-fitness'],
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple, clean layouts',
    icon: '🧼',
    templates: ['minimal-list', 'compact-table-grid'],
  },
  bold: {
    name: 'Bold',
    description: 'Large type and striking cards',
    icon: '🧨',
    templates: ['bold-cards-stack'],
  },
};

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: 'Charcoal & Fire',
    colors: {
      backgroundColor: '#000000',
      cardBackgroundColor: 'rgba(25, 25, 25, 0.5)',
      textColorPrimary: '#FFFFFF',
      textColorSecondary: '#A0A0A0',
      accent: '#E74C3C',
    },
  },
  {
    name: 'Classic Newsprint',
    colors: {
      backgroundColor: '#FFFFFF',
      cardBackgroundColor: 'rgba(250, 250, 250, 0.5)',
      textColorPrimary: '#111111',
      textColorSecondary: '#666666',
      accent: '#B91C1C',
    },
  },
  {
    name: 'Ocean Breeze',
    colors: {
      backgroundColor: '#FAFAFA',
      cardBackgroundColor: 'rgba(255, 255, 255, 0.6)',
      textColorPrimary: '#1C1C1C',
      textColorSecondary: '#5e5e5e',
      accent: '#1F7A8C',
    },
  },
  {
    name: 'Sunset Glow',
    colors: {
      backgroundColor: '#3A1A6A',
      cardBackgroundColor: 'rgba(20, 9, 38, 0.5)',
      textColorPrimary: '#FFFFFF',
      textColorSecondary: '#cab2f0',
      accent: '#F4B400',
    },
  },
    {
    name: 'Forest Canopy',
    colors: {
      backgroundColor: '#F1F5F2',
      cardBackgroundColor: 'rgba(255, 255, 255, 0.7)',
      textColorPrimary: '#1A2E22',
      textColorSecondary: '#526A5E',
      accent: '#748F7A',
    },
  },
  {
    name: 'Midnight Neon',
    colors: {
      backgroundColor: '#0D0221',
      cardBackgroundColor: 'rgba(20, 5, 40, 0.6)',
      textColorPrimary: '#F7F7FF',
      textColorSecondary: '#A682FF',
      accent: '#00F5D4',
    },
  },
];

export const MOCK_SCHEDULE: Schedule = {
  date: 'Wednesday',
  items: [
    {
      time: '5:10AM',
      class: 'FULL BODY',
      coach: '(Sub: Kerri Daniels)',
      location: 'Studio A',
      duration: '45 min',
      description: 'Strength + conditioning intervals',
    },
    {
      time: '6:05AM',
      class: 'FULL BODY',
      coach: '(Sub: Kerri Daniels)',
      location: 'Studio A',
      duration: '45 min',
      description: 'Repeat session with progressive overload focus',
    },
    {
      time: '9:00AM',
      class: 'FEMME BOOTCAMP',
      coach: '(Glenda Ortiz)',
      location: 'Main Room',
      duration: '50 min',
      description: 'Athletic conditioning with kettlebell circuits',
    },
    {
      time: '12:00PM',
      class: 'ZUMBA',
      coach: '(Lama Alassil)',
      location: 'Studio B',
      duration: '55 min',
      description: 'Latin-inspired cardio dance break',
    },
    {
      time: '5:15PM',
      class: 'ABS & BOOTY',
      coach: '(Alexis Mobley)',
      location: 'Strength Zone',
      duration: '45 min',
      description: 'Targeted core and glute training',
    },
    {
      time: '6:15PM',
      class: 'STEP UP',
      coach: '(Audrey Carryl)',
      location: 'Studio C',
      duration: '50 min',
      description: 'Rhythmic step cardio with strength spikes',
    },
  ],
};

export const FALLBACK_SCHEDULE: Schedule = {
  date: 'Preview Mode',
  items: [
    { time: '12:00 PM', class: 'No schedule data provided.', coach: 'System' },
  ],
};
