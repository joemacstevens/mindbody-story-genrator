import { DEFAULT_APP_SETTINGS } from '../constants';
import type { Schedule } from '../types';
import {
  ensureUserDocument,
  saveUserSettings,
  saveUserSchedule,
  saveUserRoot,
} from './userData';
import {
  saveGymRecordForUser,
  setDefaultGymForUser,
  type SavedGym,
  type SavedGymsState,
} from './savedGyms';

const MIGRATION_KEY = 'userDataV1';
const LEGACY_SCHEDULE_PREFIX = 'story_scheduler_schedule::';
const LEGACY_LAST_SLUG_KEY = 'story_scheduler_last_slug';
const LEGACY_GYMS_KEY = 'savedGymsState:v1';

const migrationsInFlight = new Map<string, Promise<void>>();

const readLegacySavedGyms = (): SavedGymsState => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { gyms: [], defaultGymSlug: null };
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_GYMS_KEY);
    if (!raw) {
      return { gyms: [], defaultGymSlug: null };
    }
    const parsed = JSON.parse(raw) as Partial<SavedGymsState>;
    const gymsArray = Array.isArray(parsed?.gyms) ? parsed!.gyms : [];
    const gyms: SavedGym[] = gymsArray
      .map((gym) => ({
        name: gym.name,
        slug: gym.slug,
        radius: Number(gym.radius) || 5,
        lastUsedAt: gym.lastUsedAt || new Date().toISOString(),
      }))
      .filter((gym) => Boolean(gym.name) && Boolean(gym.slug));
    const defaultGymSlug =
      typeof parsed?.defaultGymSlug === 'string' ? parsed!.defaultGymSlug : gyms[0]?.slug ?? null;
    return { gyms, defaultGymSlug };
  } catch (error) {
    console.error('Migration: failed to read legacy saved gyms from localStorage', error);
    return { gyms: [], defaultGymSlug: null };
  }
};

const readLegacyLastSlug = (): string | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(LEGACY_LAST_SLUG_KEY);
    return stored?.trim() || null;
  } catch {
    return null;
  }
};

const readLegacySchedule = (slug: string): Schedule | null => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(`${LEGACY_SCHEDULE_PREFIX}${slug}`);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) {
      return parsed as Schedule;
    }
  } catch (error) {
    console.error(`Migration: failed to parse legacy schedule for slug "${slug}"`, error);
  }
  return null;
};

const performMigration = async (uid: string) => {
  const userDoc = await ensureUserDocument(uid);
  const migrations = userDoc.migrations ?? {};
  if (migrations[MIGRATION_KEY]) {
    return;
  }

  try {
    await saveUserSettings(uid, DEFAULT_APP_SETTINGS);
  } catch (error) {
    console.error('Migration: failed to seed default settings', error);
  }

  try {
    const legacyGyms = readLegacySavedGyms();
    await Promise.all(
      legacyGyms.gyms.map((gym) =>
        saveGymRecordForUser(uid, {
          name: gym.name,
          slug: gym.slug,
          radius: gym.radius,
          lastUsedAt: gym.lastUsedAt,
        }),
      ),
    );
    if (legacyGyms.defaultGymSlug) {
      await setDefaultGymForUser(uid, legacyGyms.defaultGymSlug);
    }
  } catch (error) {
    console.error('Migration: failed to migrate saved gyms', error);
  }

  try {
    const lastSlug = readLegacyLastSlug();
    if (lastSlug) {
      const schedule = readLegacySchedule(lastSlug);
      if (schedule && schedule.items.length > 0) {
        await saveUserSchedule(uid, lastSlug, schedule);
      }
    }
  } catch (error) {
    console.error('Migration: failed to migrate schedule snapshot', error);
  }

  try {
    await saveUserRoot(uid, {
      migrations: {
        ...migrations,
        [MIGRATION_KEY]: true,
      },
    });
  } catch (error) {
    console.error('Migration: failed to mark migration completion', error);
  }
};

export const runUserDataMigration = async (uid: string): Promise<void> => {
  if (!uid) {
    return;
  }
  if (!migrationsInFlight.has(uid)) {
    migrationsInFlight.set(
      uid,
      performMigration(uid)
        .catch((error) => {
          console.error('Migration: unexpected failure', error);
        })
        .finally(() => {
          migrationsInFlight.delete(uid);
        }),
    );
  }
  await migrationsInFlight.get(uid);
};
