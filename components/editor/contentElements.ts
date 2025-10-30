import type { ScheduleElementId, ScheduleElementMeta, ScheduleElementStyle } from '../../types';

export const HERO_ELEMENT_IDS = ['heading', 'subtitle', 'scheduleDate'] as const;
export const FOOTER_ELEMENT_IDS = ['footer'] as const;
export type StaticContentElementId = typeof HERO_ELEMENT_IDS[number] | typeof FOOTER_ELEMENT_IDS[number];

export const SCHEDULE_ELEMENT_IDS: ScheduleElementId[] = [
  'className',
  'instructor',
  'time',
  'location',
  'duration',
  'description',
];

export const CONTENT_ELEMENT_META: Record<ScheduleElementId, ScheduleElementMeta> = {
  heading: {
    id: 'heading',
    label: 'Hero Heading',
    description: 'Main hero title at the top of your schedule.',
    defaultFontSize: 48,
    defaultFontWeight: 800,
    defaultLetterSpacing: -0.5,
    defaultLineHeight: 1.1,
    defaultColor: '#F8FAFC',
    icon: 'H',
    category: 'hero',
    toggleKey: 'showHeading',
  },
  subtitle: {
    id: 'subtitle',
    label: 'Hero Subtitle',
    description: 'Supporting line beneath your heading.',
    defaultFontSize: 20,
    defaultFontWeight: 500,
    defaultLetterSpacing: 0,
    defaultLineHeight: 1.35,
    defaultColor: '#CBD5E1',
    icon: 'S',
    category: 'hero',
    toggleKey: 'showSubtitle',
  },
  scheduleDate: {
    id: 'scheduleDate',
    label: 'Schedule Date',
    description: 'Date label above your class list.',
    defaultFontSize: 14,
    defaultFontWeight: 600,
    defaultLetterSpacing: 2,
    defaultLineHeight: 1.2,
    defaultColor: '#A5B4FC',
    icon: '📅',
    category: 'hero',
    toggleKey: 'showScheduleDate',
  },
  footer: {
    id: 'footer',
    label: 'Footer Note',
    description: 'Footer text beneath the schedule.',
    defaultFontSize: 16,
    defaultFontWeight: 500,
    defaultLetterSpacing: 0,
    defaultLineHeight: 1.4,
    defaultColor: '#94A3B8',
    icon: '📣',
    category: 'footer',
    toggleKey: 'showFooter',
  },
  className: {
    id: 'className',
    label: 'Class Name',
    description: 'Primary title for each class block.',
    defaultFontSize: 18,
    defaultFontWeight: 700,
    defaultLetterSpacing: 0,
    defaultLineHeight: 1.2,
    defaultColor: '#F8FAFC',
    icon: 'Aa',
    field: 'class',
    category: 'schedule',
  },
  instructor: {
    id: 'instructor',
    label: 'Instructor',
    description: 'Coach or instructor attribution.',
    defaultFontSize: 14,
    defaultFontWeight: 500,
    defaultLetterSpacing: 0,
    defaultLineHeight: 1.35,
    defaultColor: '#CBD5E1',
    icon: 'Aa',
    field: 'coach',
    category: 'schedule',
  },
  time: {
    id: 'time',
    label: 'Time',
    description: 'Class start time badge.',
    defaultFontSize: 16,
    defaultFontWeight: 600,
    defaultLetterSpacing: 0.5,
    defaultLineHeight: 1.1,
    defaultColor: '#FFFFFF',
    icon: '🕓',
    field: 'time',
    category: 'schedule',
  },
  location: {
    id: 'location',
    label: 'Room / Location',
    description: 'Where the class meets.',
    defaultFontSize: 13,
    defaultFontWeight: 500,
    defaultLetterSpacing: 0,
    defaultLineHeight: 1.3,
    defaultColor: '#94A3B8',
    icon: '📍',
    field: 'location',
    category: 'schedule',
  },
  duration: {
    id: 'duration',
    label: 'Duration',
    description: 'Length of class time.',
    defaultFontSize: 13,
    defaultFontWeight: 500,
    defaultLetterSpacing: 0,
    defaultLineHeight: 1.3,
    defaultColor: '#94A3B8',
    icon: '⏱️',
    field: 'duration',
    category: 'schedule',
  },
  description: {
    id: 'description',
    label: 'Description',
    description: 'Optional supporting blurb.',
    defaultFontSize: 13,
    defaultFontWeight: 400,
    defaultLetterSpacing: 0,
    defaultLineHeight: 1.35,
    defaultColor: '#94A3B8',
    icon: '💬',
    field: 'description',
    category: 'schedule',
  },
};

export const DEFAULT_VISIBLE_ELEMENTS: ScheduleElementId[] = ['className', 'instructor', 'time', 'location'];

export const DEFAULT_HIDDEN_ELEMENTS: ScheduleElementId[] = ['duration', 'description'];

export const ELEMENT_ORDER: ScheduleElementId[] = [
  'className',
  'instructor',
  'time',
  'location',
  'duration',
  'description',
];

const ALL_CONTENT_ELEMENT_IDS: ScheduleElementId[] = [
  ...HERO_ELEMENT_IDS,
  ...ELEMENT_ORDER,
  ...FOOTER_ELEMENT_IDS,
];

export const getDefaultElementStyle = (elementId: ScheduleElementId): ScheduleElementStyle => {
  const meta = CONTENT_ELEMENT_META[elementId];
  return {
    fontSize: meta?.defaultFontSize ?? 16,
    fontWeight: meta?.defaultFontWeight ?? 500,
    letterSpacing: meta?.defaultLetterSpacing ?? 0,
    lineHeight: meta?.defaultLineHeight ?? 1.3,
    color: meta?.defaultColor ?? '#F8FAFC',
  };
};

export const buildInitialElementStyles = (): Record<ScheduleElementId, ScheduleElementStyle> => {
  const styles = {} as Record<ScheduleElementId, ScheduleElementStyle>;
  ALL_CONTENT_ELEMENT_IDS.forEach((elementId) => {
    styles[elementId] = getDefaultElementStyle(elementId);
  });
  return styles;
};
