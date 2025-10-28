import type { ScheduleElementId, ScheduleElementMeta, ScheduleElementStyle } from '../../types';

export const CONTENT_ELEMENT_META: Record<ScheduleElementId, ScheduleElementMeta> = {
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
  },
};

export const DEFAULT_VISIBLE_ELEMENTS: ScheduleElementId[] = [
  'className',
  'instructor',
  'time',
  'location',
];

export const DEFAULT_HIDDEN_ELEMENTS: ScheduleElementId[] = ['duration', 'description'];

export const ELEMENT_ORDER: ScheduleElementId[] = [
  'className',
  'instructor',
  'time',
  'location',
  'duration',
  'description',
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
  ELEMENT_ORDER.forEach((elementId) => {
    styles[elementId] = getDefaultElementStyle(elementId);
  });
  return styles;
};
