
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import StoryRenderer from '../components/StoryRenderer';
import { FALLBACK_SCHEDULE, DEFAULT_APP_SETTINGS } from '../constants';
import { buildFontEmbedCss } from '../utils/fontEmbedder';
import { getAppSettings, getUserSchedule } from '../services/api';
import type { AppSettings, Schedule, TemplateId } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ensureUserDocument } from '../services/userData';

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
  const { user } = useAuth();
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
  const [schedule, setSchedule] = useState<Schedule>(FALLBACK_SCHEDULE);
  const [key, setKey] = useState(Date.now());
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const storyContainerRef = useRef<HTMLDivElement | null>(null);
  const [forceInlineBackground, setForceInlineBackground] = useState(false);
  const fontEmbedCssRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    void ensureUserDocument(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setSettings(DEFAULT_APP_SETTINGS);
      return;
    }
    let isMounted = true;
    getAppSettings(user.uid)
      .then((newSettings) => {
        if (isMounted) {
          setSettings(newSettings);
          setKey(Date.now());
        }
      })
      .catch((error) => {
        console.error('Failed to load user settings for render page', error);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!activeSlug) {
      setSchedule(FALLBACK_SCHEDULE);
      return;
    }
    if (!user?.uid) {
      setSchedule(FALLBACK_SCHEDULE);
      return;
    }
    let isMounted = true;
    getUserSchedule(activeSlug, user.uid)
      .then((userSchedule) => {
        if (isMounted && userSchedule) {
          setSchedule(userSchedule);
          setKey(Date.now());
        }
      })
      .catch((error) => {
        console.error('Failed to load schedule for render page', error);
      });
    return () => {
      isMounted = false;
    };
  }, [activeSlug, user]);

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

  const templateIdOverride = searchParams.get('templateId') as TemplateId | null;
  const finalTemplateId = templateIdOverride || settings?.activeTemplateId;
  const style = finalTemplateId ? settings?.configs[finalTemplateId] : null;

  useEffect(() => {
    if (!finalTemplateId) {
      return;
    }
    const bgColor = style
      ? isColorDark(style.backgroundColor)
        ? '#1F2937'
        : '#F9FAFB'
      : finalTemplateId.includes('dark')
        ? '#1F2937'
        : '#F9FAFB';
    document.body.style.backgroundColor = bgColor;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [style, finalTemplateId]);

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

  if (!user?.uid) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-950 text-slate-100 px-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Sign in to view renders</h1>
        <p className="text-sm text-slate-300 max-w-md">
          This render is tied to your account. Please sign in through the main Studiogram app and reopen this link.
        </p>
      </div>
    );
  }

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

  const isIosShareTarget = () => {
    if (typeof navigator === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent || '';
    const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
    const platform = (navigator.platform || uaData?.platform || '').toLowerCase();
    const isTouchMac = platform.includes('mac') && navigator.maxTouchPoints > 1;
    return /ipad|iphone|ipod/.test(ua.toLowerCase()) || isTouchMac;
  };

  const tryShareImage = async (blob: Blob, fileName: string) => {
    if (!navigator.share || !isIosShareTarget()) {
      return false;
    }

    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      return false;
    }

    try {
      await navigator.share({
        files: [file],
        title: 'Studiogram Export',
        text: 'Exported with Studiogram',
      });
      return true;
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        // The user dismissed the share sheet; treat as a handled case so we don't
        // fall back to the download flow.
        return true;
      }
      console.error('Share failed:', error);
      return false;
    }
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
      let fontEmbedCSS = fontEmbedCssRef.current;
      if (fontEmbedCSS === null) {
        try {
          fontEmbedCSS = await buildFontEmbedCss();
        } catch (error) {
          console.error('Could not build font embed CSS for export', error);
          fontEmbedCSS = '';
        }
        fontEmbedCssRef.current = fontEmbedCSS;
      }

      const dataUrl = await toPng(storyContainerRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
        width: 1080,
        height: 1920,
        backgroundColor: style?.backgroundColor ?? '#000000',
        skipFonts: true,
        fontEmbedCSS: fontEmbedCSS || undefined,
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
      <div className="absolute top-6 right-6 flex flex-col items-end gap-2 z-50">
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
