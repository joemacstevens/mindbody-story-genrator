// FIX: Replaced incorrect file content with actual type definitions.
export type TemplateId = string;

export type LogoPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type Style = {
  fontFamily: string;
  accent: string;
  heading: string;
  footer: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  textColorPrimary: string;
  textColorSecondary: string;
  bgImage: string;
  bgFit: 'cover' | 'contain';
  bgBlur: number;
  bgPosition: string;
  logoUrl: string;
  logoPosition: LogoPosition;
  logoPadding: number;
  logoSize: number;
  subtitle: string;
  overlayColor: string;
  headingWeight: '400' | '500' | '700' | '900';
  bodySize: number;
  cornerRadius: 'none' | 'sm' | 'md' | 'lg' | '2xl';
  dividerStyle: 'none' | 'thin' | 'thick' | 'dotted';
  accentLines: boolean;
  footerBar: boolean;
  supportsBackgroundImage?: boolean;
  showHeading?: boolean;
  showSubtitle?: boolean;
  showSchedule?: boolean;
  showFooter?: boolean;
};

export type SelectedElementType = 'heading' | 'subtitle' | 'footer' | 'schedule';

export type SelectedElement = {
  type: SelectedElementType;
};

export type AppSettings = {
  activeTemplateId: TemplateId;
  configs: { [key: string]: Style };
};

export type ScheduleItem = {
  time: string;
  class: string;
  coach: string;
};

export type Schedule = {
  date: string;
  items: ScheduleItem[];
};

export type GymLocation = {
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
};

export type ColorPalette = {
  name: string;
  colors: {
    backgroundColor: string;
    cardBackgroundColor: string;
    textColorPrimary: string;
    textColorSecondary: string;
    accent: string;
  };
};

// --- Type Guards ---

export const isSchedule = (data: any): data is Schedule => {
  return (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof data.date === 'string' &&
    Array.isArray(data.items) &&
    data.items.every(
      (item: any) =>
        item &&
        typeof item === 'object' &&
        typeof item.time === 'string' &&
        typeof item.class === 'string' &&
        typeof item.coach === 'string'
    )
  );
};

export const isStyle = (data: any): data is Style => {
  // A non-exhaustive check for the Style type
  return (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'fontFamily' in data &&
    'accent' in data &&
    'heading' in data &&
    'backgroundColor' in data &&
    'textColorPrimary' in data
  );
};

export const isAppSettings = (data: any): data is AppSettings => {
  return (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof data.activeTemplateId === 'string' &&
    typeof data.configs === 'object' &&
    data.configs !== null &&
    !Array.isArray(data.configs)
  );
};

export const isGymLocation = (data: any): data is GymLocation => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.name === 'string' &&
    typeof data.slug === 'string' &&
    typeof data.city === 'string' &&
    typeof data.state === 'string' &&
    typeof data.country === 'string'
  );
};
