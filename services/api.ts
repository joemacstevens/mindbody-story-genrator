import { db } from './firebase';
// FIX: The named imports for `ref`, `get`, and `set` were failing. Changed to a
// namespace import (`* as rtdb`) to resolve the "no exported member" errors.
// This is a common workaround for module resolution or CJS/ESM interop issues
// and aligns with the fix in `services/firebase.ts`.
import * as rtdb from 'firebase/database';
import { DEFAULT_APP_SETTINGS, FALLBACK_SCHEDULE } from '../constants';
import type { AppSettings, Schedule, Style, TemplateId } from '../types';
import { isAppSettings } from '../types';

const SCHEDULE_KEY = 'story_scheduler_schedule';
const SETTINGS_PATH = 'settings';

// Custom events for cross-component state updates
export const CONFIG_UPDATED_EVENT = 'config_updated';
export const SCHEDULE_UPDATED_EVENT = 'schedule_updated';

export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    // FIX: `ref` is now accessed through the `rtdb` namespace.
    const settingsRef = rtdb.ref(db, SETTINGS_PATH);
    // FIX: `get` is now accessed through the `rtdb` namespace.
    const snapshot = await rtdb.get(settingsRef);

    if (snapshot.exists()) {
      const dbSettings = snapshot.val();

      if (isAppSettings(dbSettings)) {
        // Create a fully merged config object to prevent `undefined` properties.
        const finalConfigs: { [key: string]: Style } = {};
        
        // Get all unique template keys from both defaults and the database.
        const allTemplateKeys = new Set([
          ...Object.keys(DEFAULT_APP_SETTINGS.configs),
          ...Object.keys(dbSettings.configs || {})
        ]);

        for (const key of allTemplateKeys) {
            const templateKey = key as TemplateId;
            const defaultStyle = DEFAULT_APP_SETTINGS.configs[templateKey];
            const dbStyle = dbSettings.configs?.[templateKey];

            // Use the template's own default style as a base. If one doesn't exist
            // (i.e., it's a custom template), use a known complete style as a
            // fallback base. This ensures all required properties are always present.
            const baseStyle = defaultStyle || DEFAULT_APP_SETTINGS.configs['impact-dark'];
            
            // Merge the database style over the base style.
            const mergedStyle: Style = {
                ...baseStyle,
                ...(dbStyle || {})
            };

            // FIX: The `supportsBackgroundImage` property defines a TEMPLATE's capability.
            // It should not be a user-configurable style saved in the database.
            // This ensures that the value from the code's constant definition
            // is always the source of truth, preventing a stale `false` value in the
            // database from incorrectly disabling the feature for a template.
            if (defaultStyle) {
                mergedStyle.supportsBackgroundImage = defaultStyle.supportsBackgroundImage;
            }
            
            finalConfigs[templateKey] = mergedStyle;
        }

        const mergedSettings: AppSettings = {
          ...DEFAULT_APP_SETTINGS, // Provides default activeTemplateId
          ...dbSettings,         // Overwrites with DB activeTemplateId and other root settings
          configs: finalConfigs, // Uses the safely merged configs
        };
        return mergedSettings;
      } else {
        console.error(
          'ERROR: Invalid settings structure in database. The fetched data does not match the expected AppSettings type.',
          'Problematic data:',
          dbSettings,
          'Falling back to default settings and attempting to repair the database entry.'
        );
        // FIX: `set` is now accessed through the `rtdb` namespace.
        await rtdb.set(settingsRef, DEFAULT_APP_SETTINGS);
        return DEFAULT_APP_SETTINGS;
      }
    } else {
      // FIX: `set` is now accessed through the `rtdb` namespace.
      await rtdb.set(settingsRef, DEFAULT_APP_SETTINGS);
      return DEFAULT_APP_SETTINGS;
    }
  } catch (error) {
    console.error('FATAL: Could not fetch settings from Realtime Database. Falling back to default settings.', error);
    return DEFAULT_APP_SETTINGS;
  }
};

export const saveAppSettings = async (settings: AppSettings): Promise<void> => {
  try {
    // FIX: `ref` is now accessed through the `rtdb` namespace.
    const settingsRef = rtdb.ref(db, SETTINGS_PATH);
    // FIX: `set` is now accessed through the `rtdb` namespace.
    await rtdb.set(settingsRef, settings);
    window.dispatchEvent(new Event(CONFIG_UPDATED_EVENT));
  } catch (error) {
    console.error('Failed to save settings to Realtime Database:', error);
  }
};

export const getSchedule = (): Schedule => {
  try {
    const scheduleStr = sessionStorage.getItem(SCHEDULE_KEY);
    return scheduleStr ? JSON.parse(scheduleStr) : FALLBACK_SCHEDULE;
  } catch (error) {
    console.error('Failed to parse schedule from sessionStorage:', error);
    return FALLBACK_SCHEDULE;
  }
};

export const saveSchedule = (schedule: Schedule): void => {
  sessionStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  window.dispatchEvent(new Event(SCHEDULE_UPDATED_EVENT));
};