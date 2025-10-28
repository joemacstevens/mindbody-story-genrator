import type { EditorColorPalette } from '../../types';

export const STYLE_COLOR_PALETTES: EditorColorPalette[] = [
  {
    id: 'studio-slate',
    name: 'Studio Slate',
    description: 'Crisp navy with coral accents',
    colors: {
      backgroundColor: '#F8FAFC',
      cardBackgroundColor: 'rgba(51, 65, 85, 0.08)',
      textColorPrimary: '#334155',
      textColorSecondary: '#64748B',
      accent: '#FF6B6B',
    },
    preview: ['#334155', '#F8FAFC', '#FF6B6B'],
  },
  {
    id: 'serene-studio',
    name: 'Serene Studio',
    description: 'Soft neutrals with sage highlights',
    colors: {
      backgroundColor: '#FFF8F0',
      cardBackgroundColor: 'rgba(255, 232, 213, 0.65)',
      textColorPrimary: '#475569',
      textColorSecondary: '#6B7280',
      accent: '#84A98C',
    },
    preview: ['#475569', '#FFF8F0', '#84A98C'],
  },
  {
    id: 'modern-wellness',
    name: 'Modern Wellness',
    description: 'Muted charcoal and botanical greens',
    colors: {
      backgroundColor: '#E8DCC8',
      cardBackgroundColor: 'rgba(45, 55, 72, 0.08)',
      textColorPrimary: '#2D3748',
      textColorSecondary: '#4A5568',
      accent: '#2F4F4F',
    },
    preview: ['#2D3748', '#E8DCC8', '#2F4F4F'],
  },
  {
    id: 'sunset-minimal',
    name: 'Sunset Minimal',
    description: 'Lavender dusk with warm metallics',
    colors: {
      backgroundColor: '#FFF5E1',
      cardBackgroundColor: 'rgba(255, 213, 170, 0.6)',
      textColorPrimary: '#4A3F5C',
      textColorSecondary: '#7A6A80',
      accent: '#C8A882',
    },
    preview: ['#4A3F5C', '#FFF5E1', '#C8A882'],
  },
];
