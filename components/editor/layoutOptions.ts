import type { Style } from '../../types';

export type LayoutSpacingOption = {
  readonly id: NonNullable<Style['spacing']>;
  readonly label: string;
  readonly description: string;
};

export type LayoutStyleOption = {
  readonly id: NonNullable<Style['layoutStyle']>;
  readonly label: string;
  readonly icon: string;
};

export type LayoutDividerOption = {
  readonly id: NonNullable<Style['dividerStyle']>;
  readonly label: string;
};

export const DEFAULT_CORNER_RADIUS_RANGE = { min: 0, max: 40 } as const;

export const DEFAULT_SPACING_OPTIONS: LayoutSpacingOption[] = [
  { id: 'compact', label: 'Compact', description: 'Tighter spacing for dense schedules' },
  { id: 'comfortable', label: 'Comfortable', description: 'Balanced spacing for most templates' },
  { id: 'spacious', label: 'Spacious', description: 'Generous spacing with more breathing room' },
];

export const DEFAULT_LAYOUT_OPTIONS: LayoutStyleOption[] = [
  { id: 'grid', label: 'Grid', icon: '▦' },
  { id: 'list', label: 'List', icon: '☰' },
  { id: 'card', label: 'Card', icon: '▢' },
];

export const DEFAULT_DIVIDER_OPTIONS: LayoutDividerOption[] = [
  { id: 'none', label: 'None' },
  { id: 'thin', label: 'Thin' },
  { id: 'thick', label: 'Thick' },
  { id: 'dotted', label: 'Dotted' },
];
