
import React, { useState, useEffect } from 'react';
import StoryRenderer from '../components/StoryRenderer';
import { getAppSettings, getSchedule, CONFIG_UPDATED_EVENT, SCHEDULE_UPDATED_EVENT, fetchLatestSchedule, cacheScheduleLocally } from '../services/api';
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
  const getSearchParams = () => {
    const hash = window.location.hash;
    const searchString = hash.includes('?') ? hash.substring(hash.indexOf('?')) : '';
    return new URLSearchParams(searchString);
  };
  const searchParams = getSearchParams();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [schedule, setSchedule] = useState<Schedule>(getSchedule());
  const [key, setKey] = useState(Date.now());
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleUpdate = async () => {
      const newSettings = await getAppSettings();
      setSettings(newSettings);
      setSchedule(getSchedule());
      setKey(Date.now());
    };
    
    window.addEventListener(CONFIG_UPDATED_EVENT, handleUpdate);
    window.addEventListener(SCHEDULE_UPDATED_EVENT, handleUpdate);
    
    handleUpdate();

    return () => {
      window.removeEventListener(CONFIG_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, handleUpdate);
    };
  }, []);

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
    let isMounted = true;
    const syncSchedule = async () => {
      const remote = await fetchLatestSchedule();
      if (remote && isMounted) {
        cacheScheduleLocally(remote);
        setSchedule(remote);
      }
    };
    syncSchedule();
    return () => {
      isMounted = false;
    };
  }, []);
  
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
