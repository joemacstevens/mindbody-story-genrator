import React, { useEffect } from 'react';
import { getAppSettings, saveAppSettings, saveSchedule } from '../services/api';
import type { Schedule, Style } from '../types';
import { isSchedule, isStyle } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ensureUserDocument } from '../services/userData';

const IngestPage: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    const getSearchParams = () => {
      const hash = window.location.hash;
      const searchString = hash.includes('?') ? hash.substring(hash.indexOf('?')) : '';
      return new URLSearchParams(searchString);
    };
    const searchParams = getSearchParams();
    const slugParam = searchParams.get('slug');
    const normalizedSlug = slugParam?.trim() || null;
    const slugWasProvided = Boolean(normalizedSlug);
    let resolvedSlug = normalizedSlug;

    const processData = async () => {
      if (user?.uid) {
        await ensureUserDocument(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      }
      try {
        let scheduleData: Schedule | null = null;
        let styleData: Style | null = null;

        const scheduleParam = searchParams.get('schedule');
        const configParam = searchParams.get('config'); // This is now a Style object
        const scheduleUrl = searchParams.get('scheduleUrl');
        const configUrl = searchParams.get('configUrl');

        // Step 1: Process Schedule
        if (scheduleParam) {
          const decoded = JSON.parse(atob(scheduleParam));
          if (isSchedule(decoded)) {
            scheduleData = decoded;
          } else {
            throw new Error('Invalid schedule data structure from "schedule" parameter.');
          }
        } else if (scheduleUrl) {
          const response = await fetch(decodeURIComponent(scheduleUrl));
          if (!response.ok) throw new Error(`Failed to fetch schedule from URL: ${response.statusText}`);
          const decoded = await response.json();
          if (isSchedule(decoded)) {
            scheduleData = decoded;
          } else {
            throw new Error('Invalid schedule data structure from "scheduleUrl".');
          }
        }

        // Step 2: Process Config (Style object)
        if (configParam) {
          const decoded = JSON.parse(atob(configParam));
          if (isStyle(decoded)) {
            styleData = decoded;
          } else {
            console.warn('Invalid style data structure from "config" parameter. Ignoring.');
          }
        } else if (configUrl) {
           const response = await fetch(decodeURIComponent(configUrl));
           if (!response.ok) {
             console.warn(`Failed to fetch style from URL: ${response.statusText}. Ignoring.`);
           } else {
             const decoded = await response.json();
             if (isStyle(decoded)) {
               styleData = decoded;
             } else {
               console.warn('Invalid style data structure from "configUrl". Ignoring.');
             }
           }
        }

        // Step 3: Save data
        if (scheduleData && user?.uid) {
          const savedSlug = await saveSchedule(
            scheduleData,
            normalizedSlug ?? 'global',
            user.uid,
          );
          resolvedSlug = savedSlug;
        } else if (scheduleData) {
          console.warn('Skipping schedule ingestion because no user session is available.');
        } else {
          console.error("No valid schedule data provided via 'schedule' or 'scheduleUrl' parameter.");
        }

        if (styleData && user?.uid) {
          const currentSettings = await getAppSettings(user.uid);
          const activeTemplateId = currentSettings.activeTemplateId;
          
          // FIX: Merge the incoming partial style with the existing one to prevent
          // saving an object with 'undefined' values, which Firebase rejects.
          const existingStyle = currentSettings.configs[activeTemplateId];
          const mergedStyle = { ...existingStyle, ...styleData };

          const newConfigs = {
            ...currentSettings.configs,
            [activeTemplateId]: mergedStyle,
          };
          await saveAppSettings({ ...currentSettings, configs: newConfigs }, user.uid);
        } else if (styleData) {
          console.warn('Skipping style ingestion because no user session is available.');
        }

      } catch (error) {
        console.error('Data ingestion failed:', error);
      } finally {
        const slugSuffix = slugWasProvided && resolvedSlug ? `/${resolvedSlug}` : '';
        window.location.replace(`/#/render${slugSuffix}`);
      }
    };

    processData();
  }, [user]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center text-gray-800 dark:text-gray-200">
        <p className="text-2xl font-semibold">Processing data...</p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">You will be redirected shortly.</p>
      </div>
    </div>
  );
};

export default IngestPage;
