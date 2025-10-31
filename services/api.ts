import { DEFAULT_APP_SETTINGS } from '../constants';
import type {
  AppSettings,
  Schedule,
  Style,
  TemplateId,
  ScheduleElementId,
  ScheduleElementStyle,
} from '../types';
import { isSchedule } from '../types';
import {
  fetchUserSettings as firestoreFetchUserSettings,
  saveUserSettings as firestoreSaveUserSettings,
  fetchUserSchedule as firestoreFetchUserSchedule,
  saveUserSchedule as firestoreSaveUserSchedule,
  fetchUserRoot,
  saveEditorTemplate as firestoreSaveEditorTemplate,
} from './userData';
import type { UserScheduleDocument } from './userData';

const DEFAULT_SCHEDULE_SLUG = 'global';

const resolveScheduleSlug = (slug?: string | null): string => {
  const trimmed = slug?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_SCHEDULE_SLUG;
};

export const getAppSettings = async (userId?: string): Promise<AppSettings> => {
  if (!userId) {
    return DEFAULT_APP_SETTINGS;
  }
  try {
    const userSettings = await firestoreFetchUserSettings(userId);
    if (userSettings) {
      return userSettings;
    }
  } catch (error) {
    console.error('Failed to fetch user settings from Firestore; using defaults.', error);
  }
  return DEFAULT_APP_SETTINGS;
};

export const saveAppSettings = async (settings: AppSettings, userId?: string): Promise<void> => {
  if (!userId) {
    console.warn('saveAppSettings called without a userId; skipping persistence.');
    return;
  }
  try {
    await firestoreSaveUserSettings(userId, settings);
  } catch (error) {
    console.error('Failed to save user settings to Firestore.', error);
    throw error;
  }
};

export type UserScheduleSnapshot = {
  schedule: Schedule;
  lastRequestedDate?: string | null;
  mindbodyMeta?: UserScheduleDocument['mindbodyMeta'];
};

export const getUserSchedule = async (
  slug: string,
  userId: string,
): Promise<UserScheduleSnapshot | null> => {
  try {
    const doc = await firestoreFetchUserSchedule(userId, resolveScheduleSlug(slug));
    if (doc?.schedule && isSchedule(doc.schedule)) {
      return {
        schedule: doc.schedule,
        lastRequestedDate: doc.lastRequestedDate ?? null,
        mindbodyMeta: doc.mindbodyMeta ?? undefined,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch schedule for slug "${slug}" from Firestore.`, error);
  }
  return null;
};

export const saveSchedule = async (
  schedule: Schedule,
  slug: string,
  userId: string,
  options: {
    date?: string;
    meta?: UserScheduleDocument['mindbodyMeta'];
  } = {},
): Promise<string> => {
  const resolvedSlug = resolveScheduleSlug(slug);
  try {
    await firestoreSaveUserSchedule(userId, resolvedSlug, schedule, {
      lastRequestedDate: options.date,
      mindbodyMeta: options.meta,
    });
  } catch (error) {
    console.error(`Failed to save schedule for slug "${resolvedSlug}" to Firestore.`, error);
    throw error;
  }
  return resolvedSlug;
};

export { fetchUserRoot };

export type TemplateSavePayload = {
  templateId: TemplateId;
  style: Style;
  visibleElements: ScheduleElementId[];
  hiddenElements: ScheduleElementId[];
  elementOrder?: ScheduleElementId[];
  elementStyles: Record<ScheduleElementId, ScheduleElementStyle>;
  gymSlug?: string | null;
};

export const saveTemplate = async (payload: TemplateSavePayload, userId?: string): Promise<void> => {
  if (!userId) {
    console.warn('saveTemplate called without a userId; skipping persistence.');
    return;
  }

  try {
    await firestoreSaveEditorTemplate(userId, payload.templateId, {
      style: payload.style,
      visibleElements: payload.visibleElements,
      hiddenElements: payload.hiddenElements,
      elementOrder: payload.elementOrder,
      elementStyles: payload.elementStyles,
      gymSlug: payload.gymSlug,
    });
  } catch (error) {
    console.error('Failed to save template to Firestore.', error);
    throw error;
  }
};
