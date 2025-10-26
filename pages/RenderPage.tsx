
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StoryRenderer from '../components/StoryRenderer';
import { FALLBACK_SCHEDULE } from '../constants';
import {
  getAppSettings,
  getSchedule,
  CONFIG_UPDATED_EVENT,
  SCHEDULE_UPDATED_EVENT,
  fetchLatestSchedule,
  cacheScheduleLocally,
} from '../services/api';
import type { AppSettings, Schedule, TemplateId } from '../types';

const isColorDark = (hexColor: string): boolean => {
  if (!hexColor) return false;
  const color = hexColor.charAt(0) === '#' ? hexColor.substring(1, 7) : hexColor;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

const RenderPage: React.FC = () => {
  const { slug: slugFromPath } = useParams<{ slug?: string }>();
  const getSearchParams = () => {
    const hash = window.location.hash;
    const searchString = hash.includes('?') ? hash.substring(hash.indexOf('?')) : '';
    return new URLSearchParams(searchString);
  };
  const searchParams = getSearchParams();
  const slugFromQuery = searchParams.get('slug') ?? null;
  const normalizedSlugFromPath = slugFromPath?.trim();
  const normalizedSlugFromQuery = slugFromQuery?.trim();
  const activeSlug = normalizedSlugFromPath || normalizedSlugFromQuery || null;

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [schedule, setSchedule] = useState<Schedule>(() =>
    activeSlug ? getSchedule(activeSlug) : FALLBACK_SCHEDULE,
  );
  const [key, setKey] = useState(Date.now());
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      const newSettings = await getAppSettings();
      if (isMounted) {
        setSettings(newSettings);
        setKey(Date.now());
      }
    };

    loadSettings();
    window.addEventListener(CONFIG_UPDATED_EVENT, loadSettings);

    return () => {
      isMounted = false;
      window.removeEventListener(CONFIG_UPDATED_EVENT, loadSettings);
    };
  }, []);

  useEffect(() => {
    if (!activeSlug) return;

    const updateFromCache = () => {
      setSchedule(getSchedule(activeSlug));
      setKey(Date.now());
    };

    updateFromCache();

    const handleScheduleUpdate = (event: Event) => {
      const eventSlug = (event as CustomEvent<{ slug?: string }>).detail?.slug;
      if (eventSlug && eventSlug !== activeSlug) {
        return;
      }
      updateFromCache();
    };

    window.addEventListener(SCHEDULE_UPDATED_EVENT, handleScheduleUpdate);

    return () => {
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, handleScheduleUpdate);
    };
  }, [activeSlug]);

  if (!activeSlug) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-950 text-slate-100 px-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Choose a gym to render</h1>
        <p className="text-sm text-slate-300 max-w-md">
          Open Gym Finder, search for your gym, and choose “Open render” or navigate directly to
          <span className="mx-1 rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs">/#/render/&lt;slug&gt;</span>
          to load a specific location.
        </p>
      </div>
    );
  }

  useEffect(() => {
    const calculateScale = () => {
      const storyWidth = 1080;
      const storyHeight = 1920;
      const padding = 40;

      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - padding;
      
      const scaleX = availableWidth / storyWidth;
      const scaleY = availableHeight / storyHeight;
      
      setScale(Math.min(scaleX, scaleY, 1));
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);

    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    let isMounted = true;
    const syncSchedule = async () => {
      const remote = await fetchLatestSchedule(activeSlug);
      if (remote && isMounted) {
        cacheScheduleLocally(remote, activeSlug);
        setSchedule(remote);
        setKey(Date.now());
      }
    };
    syncSchedule();
    return () => {
      isMounted = false;
    };
  }, [activeSlug]);
  
  const templateIdOverride = searchParams.get('templateId') as TemplateId | null;
  const finalTemplateId = templateIdOverride || settings?.activeTemplateId;
  
  const style = finalTemplateId ? settings?.configs[finalTemplateId] : null;
  
  useEffect(() => {
    const isDark = style ? isColorDark(style.backgroundColor) : finalTemplateId?.includes('dark');
    const pageBgColor = isDark ? '#1F2937' : '#F9FAFB'; 
    document.body.style.backgroundColor = pageBgColor;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [style, finalTemplateId]);
  
  if (!settings || !finalTemplateId || !style) {
     const isDarkGuess = (searchParams.get('templateId') as TemplateId | null)?.includes('dark');
     const bgColor = isDarkGuess ? 'bg-gray-800' : 'bg-gray-50';
     const textColor = isDarkGuess ? 'dark:text-gray-200' : 'text-gray-800';
     
     return (
       <div className={`w-screen h-screen flex items-center justify-center ${bgColor}`}>
         <p className={`text-2xl font-semibold ${textColor}`}>Loading Render...</p>
       </div>
     );
  }

  const isPageDark = isColorDark(style.backgroundColor);
  const pageBgClass = isPageDark ? 'bg-gray-800' : 'bg-gray-50';

  return (
    <div className={`w-screen h-screen flex items-center justify-center overflow-hidden ${pageBgClass}`}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <StoryRenderer
          key={key}
          templateId={finalTemplateId}
          style={style}
          schedule={schedule}
          isFullSize={true}
        />
      </div>
    </div>
  );
};

export default RenderPage;
