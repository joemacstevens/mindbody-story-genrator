
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const storyContainerRef = useRef<HTMLDivElement | null>(null);
  const [forceInlineBackground, setForceInlineBackground] = useState(false);

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

  const convertDataUrlToBlob = (dataUrl: string): Blob => {
    const [header, base64Data] = dataUrl.split(',');
    if (!header || !base64Data) {
      throw new Error('Invalid data URL');
    }

    const mimeMatch = header.match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] ?? 'image/png';

    const binaryString = atob(base64Data);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: mimeType });
  };

  const tryShareImage = async (blob: Blob, fileName: string) => {
    if (!navigator.canShare) {
      return false;
    }
    const file = new File([blob], fileName, { type: 'image/png' });
    if (!navigator.canShare({ files: [file] })) {
      return false;
    }
    await navigator.share({
      files: [file],
      title: 'Studiogram Export',
      text: 'Exported with Studiogram',
    });
    return true;
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!storyContainerRef.current) {
      setExportError('Renderer not ready yet. Please try again in a moment.');
      return;
    }
    setIsExporting(true);
    setExportError(null);
    setForceInlineBackground(true);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    try {
      const dataUrl = await toPng(storyContainerRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
        width: 1080,
        height: 1920,
        backgroundColor: style?.backgroundColor ?? '#000000',
      });
      const slugSegment = activeSlug?.replace(/[^a-z0-9-]/gi, '-') || 'schedule';
      const templateSegment = finalTemplateId?.replace(/[^a-z0-9-]/gi, '-') || 'template';
      const fileName = `${slugSegment}-${templateSegment}.png`;
      const blob = convertDataUrlToBlob(dataUrl);

      const shared = await tryShareImage(blob, fileName);
      if (!shared) {
        downloadBlob(blob, fileName);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportError('Could not export the image. Please retry.');
    } finally {
      setIsExporting(false);
      setForceInlineBackground(false);
    }
  };
  
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
    <div
      className={`relative w-screen h-screen flex items-center justify-center overflow-hidden ${pageBgClass}`}
    >
      <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isExporting ? 'Exporting…' : 'Export PNG'}
        </button>
        {exportError && (
          <span className="text-xs text-red-200 bg-red-900/40 px-3 py-1 rounded-full">
            {exportError}
          </span>
        )}
      </div>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <div ref={storyContainerRef} className="w-[1080px] h-[1920px]">
          <StoryRenderer
            key={key}
            templateId={finalTemplateId}
            style={style}
            schedule={schedule}
            isFullSize={true}
            forceInlineBackground={forceInlineBackground}
          />
        </div>
      </div>
    </div>
  );
};

export default RenderPage;
