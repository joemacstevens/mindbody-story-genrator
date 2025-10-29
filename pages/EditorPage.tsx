import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ensureUserDocument, fetchUserRoot } from '../services/userData';
import { Button, Modal } from '../components/ui';
import { SchedulePreview } from '../components/editor/SchedulePreview';
import { StyleTab } from '../components/editor/StyleTab';
import { ContentTab } from '../components/editor/ContentTab';
import { LayoutTab } from '../components/editor/LayoutTab';
import { FontSettings } from '../components/editor/FontSettings';
import { ColorPicker } from '../components/editor/ColorPicker';
import { DEFAULT_APP_SETTINGS } from '../constants';
import { STYLE_COLOR_PALETTES } from '../components/editor/stylePalettes';
import {
  CONTENT_ELEMENT_META,
  DEFAULT_VISIBLE_ELEMENTS,
  DEFAULT_HIDDEN_ELEMENTS,
  ELEMENT_ORDER,
  buildInitialElementStyles,
  getDefaultElementStyle,
} from '../components/editor/contentElements';
import type {
  TemplateId,
  Style,
  EditorColorPalette,
  LogoPosition,
  ScheduleElementId,
  ScheduleElementStyle,
  Schedule,
} from '../types';
import { cn } from '../utils/cn';
import { uploadImage } from '../services/storage';
import { saveTemplate, getUserSchedule } from '../services/api';
import { toBlob } from 'html-to-image';

const SaveSpinner: React.FC = () => (
  <span
    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
    aria-hidden="true"
  />
);

type DeviceOption = 'mobile' | 'tablet' | 'desktop';

const devicePresets: Record<DeviceOption, { width: number; height: number; radius: string }> = {
  mobile: { width: 375, height: 667, radius: '24px' },
  tablet: { width: 768, height: 1024, radius: '20px' },
  desktop: { width: 1200, height: 800, radius: '12px' },
};

const formatPanelWidth = (value: number) => Math.min(600, Math.max(320, value));

const EditorPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<DeviceOption>('mobile');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState<'style' | 'content' | 'layout'>('style');
  const [panelWidth, setPanelWidth] = useState(420);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef(0);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [userGymName, setUserGymName] = useState<string>('Select a gym');
  const [userGymSlug, setUserGymSlug] = useState<string | null>(null);
  const [isBackgroundUploading, setIsBackgroundUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const backgroundPreviewUrlRef = useRef<string | null>(null);
  const logoPreviewUrlRef = useRef<string | null>(null);
  const [visibleElements, setVisibleElements] =
    useState<ScheduleElementId[]>(DEFAULT_VISIBLE_ELEMENTS);
  const [hiddenElements, setHiddenElements] =
    useState<ScheduleElementId[]>(DEFAULT_HIDDEN_ELEMENTS);
  const [elementStyles, setElementStyles] = useState<Record<ScheduleElementId, ScheduleElementStyle>>(
    () => buildInitialElementStyles(),
  );
  const [activeFontElement, setActiveFontElement] = useState<ScheduleElementId | null>(null);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [activeColorElement, setActiveColorElement] = useState<ScheduleElementId | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const saveResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isMobile = !isDesktop;
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarFallback =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  useEffect(() => {
    if (!user?.uid) return;
    const fetchData = async () => {
      try {
        await ensureUserDocument(user.uid);
        const root = await fetchUserRoot(user.uid);
        if (root?.lastScheduleSlug) {
          setUserGymName(root.lastScheduleSlug.replace(/-/g, ' '));
          setUserGymSlug(root.lastScheduleSlug);
        } else {
          setUserGymSlug(null);
        }
      } catch (error) {
        console.error('Failed to load editor context', error);
      }
    };
    void fetchData();
  }, [user]);

  useEffect(() => {
    if (!user?.uid || !userGymSlug) {
      setSchedule(null);
      return;
    }

    let isActive = true;
    setIsScheduleLoading(true);
    setScheduleError(null);

    getUserSchedule(userGymSlug, user.uid)
      .then((result) => {
        if (!isActive) return;
        if (result) {
          setSchedule(result);
        } else {
          setSchedule(null);
          setScheduleError('No schedule saved for this gym yet. Load one from Gym Finder to get started.');
        }
      })
      .catch((error) => {
        console.error('Failed to load schedule for editor preview', error);
        if (!isActive) return;
        setSchedule(null);
        setScheduleError('Unable to load your schedule preview right now.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsScheduleLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user?.uid, userGymSlug]);

  const templateId = DEFAULT_APP_SETTINGS.activeTemplateId as TemplateId;
  const templateStyle = DEFAULT_APP_SETTINGS.configs[templateId];
  const defaultPalette = STYLE_COLOR_PALETTES[0];

  const [styleState, setStyleState] = useState<Style>(() => ({
    ...templateStyle,
    ...defaultPalette.colors,
  }));
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(defaultPalette.id);

  const updateStyle = useCallback((updates: Partial<Style>) => {
    setStyleState((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const handlePaletteSelect = useCallback(
    (palette: EditorColorPalette) => {
      setSelectedPaletteId(palette.id);
      updateStyle({
        backgroundColor: palette.colors.backgroundColor,
        cardBackgroundColor: palette.colors.cardBackgroundColor,
        textColorPrimary: palette.colors.textColorPrimary,
        textColorSecondary: palette.colors.textColorSecondary,
        accent: palette.colors.accent,
      });
    },
    [updateStyle],
  );

  const revokeBackgroundPreview = useCallback(() => {
    if (backgroundPreviewUrlRef.current) {
      URL.revokeObjectURL(backgroundPreviewUrlRef.current);
      backgroundPreviewUrlRef.current = null;
    }
  }, []);

  const revokeLogoPreview = useCallback(() => {
    if (logoPreviewUrlRef.current) {
      URL.revokeObjectURL(logoPreviewUrlRef.current);
      logoPreviewUrlRef.current = null;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsUserMenuOpen(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed', error);
    }
  }, [signOut]);

  useEffect(() => {
    const updateMatch = () => {
      if (typeof window === 'undefined') return;
      const matches = window.matchMedia('(min-width: 1024px)').matches;
      setIsDesktop(matches);
    };

    updateMatch();
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(min-width: 1024px)');
      const listener = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
      if (media.addEventListener) {
        media.addEventListener('change', listener);
      } else {
        // Safari
        media.addListener(listener);
      }
      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', listener);
        } else {
          media.removeListener(listener);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isMobile) {
      setIsMobilePanelOpen(true);
    }
  }, [isMobile]);

  const handleBackgroundUpload = useCallback(
    async (file: File, previewUrl: string) => {
      const previousBackground = styleState.bgImage;
      revokeBackgroundPreview();
      backgroundPreviewUrlRef.current = previewUrl;
      updateStyle({ bgImage: previewUrl });
      setIsBackgroundUploading(true);
      try {
        const downloadURL = await uploadImage(file);
        updateStyle({ bgImage: downloadURL });
      } catch (error) {
        console.error('Failed to upload background image', error);
        updateStyle({ bgImage: previousBackground });
        alert('Unable to upload background image. Please try again.');
      } finally {
        setIsBackgroundUploading(false);
        revokeBackgroundPreview();
      }
    },
    [revokeBackgroundPreview, styleState.bgImage, updateStyle],
  );

  const handleRemoveBackground = useCallback(() => {
    revokeBackgroundPreview();
    updateStyle({ bgImage: '' });
  }, [revokeBackgroundPreview, updateStyle]);

  const handleLogoUpload = useCallback(
    async (file: File, previewUrl: string) => {
      const previousLogo = styleState.logoUrl;
      revokeLogoPreview();
      logoPreviewUrlRef.current = previewUrl;
      updateStyle({ logoUrl: previewUrl });
      setIsLogoUploading(true);
      try {
        const downloadURL = await uploadImage(file);
        updateStyle({ logoUrl: downloadURL });
      } catch (error) {
        console.error('Failed to upload logo image', error);
        updateStyle({ logoUrl: previousLogo });
        alert('Unable to upload logo. Please try again.');
      } finally {
        setIsLogoUploading(false);
        revokeLogoPreview();
      }
    },
    [revokeLogoPreview, styleState.logoUrl, updateStyle],
  );

  const handleRemoveLogo = useCallback(() => {
    revokeLogoPreview();
    updateStyle({ logoUrl: '' });
  }, [revokeLogoPreview, updateStyle]);

  const handleLogoPositionChange = useCallback(
    (position: LogoPosition) => {
      updateStyle({ logoPosition: position });
    },
    [updateStyle],
  );

  const handleExport = useCallback(async () => {
    if (!previewRef.current) {
      return;
    }

    setIsExporting(true);

    try {
      const blob = await toBlob(previewRef.current, {
        backgroundColor: 'transparent',
        pixelRatio: 2,
      });

      if (!blob) {
        throw new Error('Failed to generate export image');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const baseName = (userGymSlug || userGymName || 'studiogram')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      link.download = `${baseName || 'studiogram'}-schedule-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('We could not export your template. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [userGymName, userGymSlug]);

  const handleOpenFontSettings = useCallback((elementId: ScheduleElementId) => {
    setActiveFontElement(elementId);
    setIsFontModalOpen(true);
  }, []);

  const handleCloseFontSettings = useCallback(() => {
    setIsFontModalOpen(false);
    setActiveFontElement(null);
  }, []);

  const handleOpenColorPicker = useCallback((elementId: ScheduleElementId) => {
    setActiveColorElement(elementId);
    setIsColorModalOpen(true);
  }, []);

  const handleCloseColorPicker = useCallback(() => {
    setIsColorModalOpen(false);
    setActiveColorElement(null);
  }, []);

  const handleFontStyleChange = useCallback((elementId: ScheduleElementId, next: ScheduleElementStyle) => {
    setElementStyles((prev) => ({
      ...prev,
      [elementId]: next,
    }));
  }, []);

  const handleFontStyleReset = useCallback((elementId: ScheduleElementId) => {
    const defaults = getDefaultElementStyle(elementId);
    setElementStyles((prev) => ({
      ...prev,
      [elementId]: defaults,
    }));
  }, []);

  const handleElementColorChange = useCallback((elementId: ScheduleElementId, color: string) => {
    setElementStyles((prev) => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        color,
      },
    }));
  }, []);

  const handleElementColorReset = useCallback((elementId: ScheduleElementId) => {
    const defaults = getDefaultElementStyle(elementId);
    setElementStyles((prev) => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        color: defaults.color,
      },
    }));
  }, []);

  const handleToggleElementVisibility = useCallback(
    (elementId: ScheduleElementId) => {
      setVisibleElements((prevVisible) => {
        if (prevVisible.includes(elementId)) {
          const nextVisible = prevVisible.filter((id) => id !== elementId);
          setHiddenElements((prevHidden) => {
            const filtered = prevHidden.filter((id) => id !== elementId);
            return [...filtered, elementId];
          });
          return nextVisible;
        }

        const nextVisible = [...prevVisible, elementId];
        const ordered = ELEMENT_ORDER.filter((id) => nextVisible.includes(id));
        setHiddenElements((prevHidden) => prevHidden.filter((id) => id !== elementId));
        return ordered;
      });
    },
    [],
  );

  const handleReorderElements = useCallback(
    (sourceId: ScheduleElementId, targetId: ScheduleElementId | null) => {
      setVisibleElements((prevVisible) => {
        if (!prevVisible.includes(sourceId)) {
          return prevVisible;
        }

        const withoutSource = prevVisible.filter((id) => id !== sourceId);
        if (!targetId) {
          return [...withoutSource, sourceId];
        }

        const targetIndex = withoutSource.indexOf(targetId);
        if (targetIndex === -1) {
          return [...withoutSource, sourceId];
        }

        const reordered = [...withoutSource];
        reordered.splice(targetIndex, 0, sourceId);
        return reordered;
      });
    },
    [],
  );

  useEffect(
    () => () => {
      revokeBackgroundPreview();
      revokeLogoPreview();
      if (saveResetTimeoutRef.current) {
        clearTimeout(saveResetTimeoutRef.current);
      }
    },
    [revokeBackgroundPreview, revokeLogoPreview],
  );

  const activeFontMeta = activeFontElement ? CONTENT_ELEMENT_META[activeFontElement] : null;
  const activeFontStyles =
    activeFontElement != null
      ? elementStyles[activeFontElement] ?? getDefaultElementStyle(activeFontElement)
      : null;
  const activeFontDefaults =
    activeFontElement != null ? getDefaultElementStyle(activeFontElement) : null;

  const activeColorMeta = activeColorElement ? CONTENT_ELEMENT_META[activeColorElement] : null;
  const activeColorValue =
    activeColorElement != null
      ? elementStyles[activeColorElement]?.color ?? getDefaultElementStyle(activeColorElement).color
      : '#FFFFFF';

  const handleZoomChange = (delta: number) => {
    setZoomLevel((prev) => Math.min(200, Math.max(25, prev + delta)));
  };

  const handleResetZoom = () => setZoomLevel(100);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!isDragging || !layoutRef.current) return;
      const bounding = layoutRef.current.getBoundingClientRect();
      const newWidth = formatPanelWidth(bounding.right - event.clientX + dragOffsetRef.current);
      setPanelWidth(newWidth);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const handleResizeStart = (event: React.PointerEvent) => {
    if (!layoutRef.current) return;
    setIsDragging(true);
    dragOffsetRef.current = layoutRef.current.getBoundingClientRect().right - event.clientX - panelWidth;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleSaveTemplate = useCallback(async () => {
    if (!user?.uid) {
      console.warn('Attempted to save template without an authenticated user.');
      return;
    }

    setIsSaving(true);
    try {
      await saveTemplate(
        {
          templateId,
          style: styleState,
          visibleElements,
          hiddenElements,
          elementOrder: visibleElements,
          elementStyles,
          gymSlug: userGymSlug,
        },
        user.uid,
      );

      setSaveSuccess(true);
      if (saveResetTimeoutRef.current) {
        clearTimeout(saveResetTimeoutRef.current);
      }
      saveResetTimeoutRef.current = setTimeout(() => {
        setSaveSuccess(false);
        saveResetTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save your template. Please try again.');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  }, [
    elementStyles,
    hiddenElements,
    saveTemplate,
    styleState,
    templateId,
    user?.uid,
    userGymSlug,
    visibleElements,
  ]);

  const devicePreset = devicePresets[selectedDevice];
  const previewStyle = {
    width: `${devicePreset.width * (zoomLevel / 100)}px`,
    height: `${devicePreset.height * (zoomLevel / 100)}px`,
    borderRadius: devicePreset.radius,
  };
  const aspectRatio = Number((devicePreset.height / devicePreset.width).toFixed(4));
  const mobilePreviewStyle = {
    width: 'min(320px, 80vw)',
    height: `calc(min(320px, 80vw) * ${aspectRatio})`,
    borderRadius: devicePreset.radius,
  } as const;
  const actionButtons = (
    <>
      <Button variant="secondary" size="sm" fullWidth={isMobile}>
        <span>↻</span>
        <span>Reset</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        fullWidth={isMobile}
      >
        {isExporting ? (
          <>
            <SaveSpinner />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <span role="img" aria-hidden="true">
              📥
            </span>
            <span>Export</span>
          </>
        )}
      </Button>
      <Button
        size="sm"
        onClick={handleSaveTemplate}
        disabled={isSaving || !user?.uid}
        className={cn(
          saveSuccess &&
            'from-emerald-500 to-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.45)] animate-[successPulse_0.5s_ease-out]',
        )}
        fullWidth={isMobile}
      >
        {isSaving ? (
          <>
            <SaveSpinner />
            <span>Saving...</span>
          </>
        ) : saveSuccess ? (
          <>
            <span className="text-base">✓</span>
            <span>Saved!</span>
          </>
        ) : (
          <>
            <span role="img" aria-hidden="true">
              💾
            </span>
            <span>Save Template</span>
          </>
        )}
      </Button>
    </>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 h-18 border-b border-white/10 bg-slate-900/95 backdrop-blur-xl px-4 py-4 sm:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6">
          {/* Header Left */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 text-white transition hover:text-white/80">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-semibold text-white shadow-lg">
                S
              </span>
              <span className="text-lg font-semibold tracking-tight">Studiogram</span>
            </Link>
            <nav className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
              <span>Templates</span>
              <span className="text-slate-600">/</span>
              <span className="font-medium text-slate-300">Schedule Editor</span>
            </nav>
          </div>

          {/* Header Center */}
          <div className="flex justify-center">
            <Link
              to="/gym-finder"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white sm:hidden"
              aria-label={userGymName ? `Open gym finder for ${userGymName}` : 'Open gym finder'}
            >
              <span role="img" aria-hidden="true">
                📍
              </span>
              <span className="max-w-[140px] truncate">{userGymName}</span>
              <span aria-hidden="true" className="text-xs opacity-70">
                ▾
              </span>
            </Link>
            <Link
              to="/gym-finder"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white sm:inline-flex"
            >
              <span role="img" aria-hidden="true">
                📍
              </span>
              <span className="font-medium">{userGymName}</span>
              <span aria-hidden="true" className="opacity-60">
                ▾
              </span>
            </Link>
          </div>

          {/* Header Right */}
          <div className="flex items-center justify-end gap-4">
            {!isMobile && <div className="flex items-center gap-3">{actionButtons}</div>}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-label="Open account menu"
                className={cn(
                  'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white shadow-lg transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 hover:scale-105',
                  user?.photoURL
                    ? 'bg-white/10 hover:bg-white/20'
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                )}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user?.displayName ? `Signed in as ${user.displayName}` : 'Account avatar'}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{avatarFallback}</span>
                )}
              </button>
              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-44 rounded-xl border border-white/10 bg-slate-900/95 p-2 shadow-xl backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    <span role="img" aria-hidden="true">
                      🚪
                    </span>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {isMobile && (
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-white/10 bg-slate-900/95 px-4 py-4 backdrop-blur-lg">
            {actionButtons}
          </div>
        )}
      </header>

      {/* Main Layout */}
      {isMobile ? (
        /* Mobile Layout - Stacked */
        <div className="flex flex-col h-[calc(100vh-72px)] overflow-hidden">
          {/* Preview Section */}
          <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-auto">
            {/* Canvas Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,123,216,0.03),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,123,216,0.03),transparent_50%)]" />
            
            {/* Canvas Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
            
            <div className="relative z-10 w-full max-w-sm">
              {isScheduleLoading ? (
                <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-xs text-purple-100 text-center">
                  Loading your latest schedule…
                </div>
              ) : scheduleError ? (
                <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 text-center">
                  {scheduleError}
                </div>
              ) : null}
              {/* Live Preview Label */}
              <div className="text-center mb-6">
                <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Live Preview</h2>
              </div>
              
              {/* Preview Frame */}
              <div
                ref={previewRef}
                className="relative bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out overflow-hidden mx-auto"
                style={mobilePreviewStyle}
              >
                <div className="h-full p-6">
                  <SchedulePreview
                    schedule={schedule ?? { date: userGymName, items: [] }}
                    style={styleState}
                    device={selectedDevice}
                    visibleElements={visibleElements}
                    elementStyles={elementStyles}
                  />
                </div>
              </div>
              
              {/* Preview Controls */}
              <div className="flex gap-3 justify-center mt-6">
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 text-sm hover:bg-white/10 hover:text-slate-50 transition-all">
                  <span>↻</span> Refresh
                </button>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 text-sm hover:bg-white/10 hover:text-slate-50 transition-all">
                  <span>📱</span> Full Screen
                </button>
              </div>
            </div>
          </div>

          {/* Editor Panel */}
            <div
              className={cn(
                'relative bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex flex-col overflow-hidden transition-[height] duration-300 ease-out',
                !isMobilePanelOpen && 'shadow-[0_-18px_40px_rgba(0,0,0,0.4)]'
              )}
              style={{ height: isMobilePanelOpen ? '52vh' : '64px' }}
            >
              <button
                type="button"
                onClick={() => setIsMobilePanelOpen((prev) => !prev)}
                aria-expanded={isMobilePanelOpen}
                className={cn(
                  'absolute left-1/2 -top-6 z-50 flex h-10 w-20 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-white/12 shadow-[0_12px_30px_rgba(5,12,24,0.35)] backdrop-blur-md transition-all duration-300 ease-out hover:bg-white/18',
                  isMobilePanelOpen ? 'opacity-100' : 'opacity-95'
                )}
              >
                <span className="sr-only">{isMobilePanelOpen ? 'Collapse editor panel' : 'Expand editor panel'}</span>
                <span
                  className={cn(
                    'inline-flex h-1.5 w-12 items-center justify-center rounded-full bg-white/40 transition-transform duration-300 ease-out',
                    isMobilePanelOpen ? 'rotate-0' : 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>

            {/* Tab Navigation */}
            <div
              className={cn(
                'flex bg-white/3 p-1.5 m-5 rounded-xl gap-1 transition-all duration-300 ease-out',
                isMobilePanelOpen ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
              )}
            >
              {(['style', 'content', 'layout'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 py-2.5 px-4 bg-transparent border-none text-slate-400 font-medium cursor-pointer rounded-lg transition-all duration-200 ${
                    activeTab === tab 
                      ? 'bg-purple-500/15 text-purple-400' 
                      : 'hover:text-slate-300'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div
              className={cn(
                'flex-1 overflow-y-auto px-6 pb-20 transition-opacity duration-300 ease-out',
                isMobilePanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              )}
            >
              {activeTab === 'style' ? (
                <StyleTab
                  palettes={STYLE_COLOR_PALETTES}
                  selectedPaletteId={selectedPaletteId}
                  onSelectPalette={handlePaletteSelect}
                  style={styleState}
                  onBackgroundUpload={handleBackgroundUpload}
                  onRemoveBackground={handleRemoveBackground}
                  onLogoUpload={handleLogoUpload}
                  onRemoveLogo={handleRemoveLogo}
                  onLogoPositionChange={handleLogoPositionChange}
                  isBackgroundUploading={isBackgroundUploading}
                  isLogoUploading={isLogoUploading}
                />
              ) : activeTab === 'content' ? (
                <ContentTab
                  visibleElements={visibleElements}
                  hiddenElements={hiddenElements}
                  elementsMeta={CONTENT_ELEMENT_META}
                  onReorder={handleReorderElements}
                  onToggleVisibility={handleToggleElementVisibility}
                  onOpenFontSettings={handleOpenFontSettings}
                  onOpenColorPicker={handleOpenColorPicker}
                />
              ) : activeTab === 'layout' ? (
                <LayoutTab
                  style={styleState}
                  onUpdate={updateStyle}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Layout - Side by Side */
        <div className="flex h-[calc(100vh-72px)] overflow-hidden">
          {/* Canvas Area (Left) */}
          <div className="flex-1 bg-slate-900 flex items-center justify-center p-12 relative overflow-auto">
            {/* Canvas Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,123,216,0.03),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,123,216,0.03),transparent_50%)]" />
            
            {/* Canvas Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
            
            <div className="relative z-10">
              {isScheduleLoading ? (
                <div className="absolute -top-20 left-0 right-0 mx-auto w-max rounded-full border border-purple-500/30 bg-purple-500/15 px-4 py-2 text-xs text-purple-100">
                  Loading schedule…
                </div>
              ) : scheduleError ? (
                <div className="absolute -top-20 left-0 right-0 mx-auto w-max rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs text-amber-100">
                  {scheduleError}
                </div>
              ) : null}
              {/* Preview Controls Top */}
              <div className="absolute -top-16 left-0 right-0 flex justify-between items-center">
                {/* Zoom Controls */}
                <div className="flex gap-2 bg-slate-900/80 backdrop-blur-sm p-2 rounded-xl border border-white/10">
                  <button 
                    className="w-8 h-8 bg-white/5 border-none rounded-md text-slate-400 cursor-pointer transition-all text-base hover:bg-white/10 hover:text-slate-50"
                    onClick={() => handleZoomChange(-10)}
                  >
                    −
                  </button>
                  <span className="flex items-center px-3 text-xs text-slate-400">{zoomLevel}%</span>
                  <button 
                    className="w-8 h-8 bg-white/5 border-none rounded-md text-slate-400 cursor-pointer transition-all text-base hover:bg-white/10 hover:text-slate-50"
                    onClick={() => handleZoomChange(10)}
                  >
                    +
                  </button>
                  <button 
                    className="w-8 h-8 bg-white/5 border-none rounded-md text-slate-400 cursor-pointer transition-all text-base hover:bg-white/10 hover:text-slate-50"
                    onClick={handleResetZoom}
                    title="Fit to screen"
                  >
                    ⊡
                  </button>
                </div>
                
                {/* Device Toggle */}
                <div className="flex gap-1 bg-slate-900/80 backdrop-blur-sm p-1 rounded-xl border border-white/10">
                  {(['mobile', 'tablet', 'desktop'] as DeviceOption[]).map((device) => (
                    <button
                      key={device}
                      className={`px-4 py-2 bg-transparent border-none rounded-md text-slate-400 cursor-pointer transition-all text-xs ${
                        selectedDevice === device 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'hover:text-slate-50'
                      }`}
                      onClick={() => setSelectedDevice(device)}
                    >
                      {device === 'mobile' ? '📱 Mobile' : device === 'tablet' ? '📱 Tablet' : '🖥️ Desktop'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Frame */}
              <div
                ref={previewRef}
                className="relative bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out overflow-hidden"
                style={previewStyle}
              >
                <div className="h-full p-8">
                <SchedulePreview
                  schedule={schedule ?? { date: userGymName, items: [] }}
                  style={styleState}
                  device={selectedDevice}
                  visibleElements={visibleElements}
                  elementStyles={elementStyles}
                />
              </div>
            </div>
          </div>
          </div>

          {/* Right Panel */}
        <aside
            className="relative w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden"
            style={{ width: `${panelWidth}px` }}
          >
            {/* Resize Handle */}
          <button
            type="button"
            onPointerDown={handleResizeStart}
              className={`absolute left-0 top-0 z-20 h-full w-1 cursor-ew-resize transition ${
                isDragging ? 'bg-purple-500' : 'bg-transparent hover:bg-purple-500/40'
              }`}
            aria-label="Resize panel"
          />
            
            {/* Tab Navigation */}
            <div className="flex bg-white/3 p-1.5 m-5 rounded-xl gap-1">
              {(['style', 'content', 'layout'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 py-2.5 px-4 bg-transparent border-none text-slate-400 font-medium cursor-pointer rounded-lg transition-all duration-200 ${
                    activeTab === tab 
                      ? 'bg-purple-500/15 text-purple-400' 
                      : 'hover:text-slate-300'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
          </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === 'style' ? (
              <StyleTab
                palettes={STYLE_COLOR_PALETTES}
                selectedPaletteId={selectedPaletteId}
                onSelectPalette={handlePaletteSelect}
                style={styleState}
                onBackgroundUpload={handleBackgroundUpload}
                onRemoveBackground={handleRemoveBackground}
                onLogoUpload={handleLogoUpload}
                onRemoveLogo={handleRemoveLogo}
                onLogoPositionChange={handleLogoPositionChange}
                isBackgroundUploading={isBackgroundUploading}
                isLogoUploading={isLogoUploading}
              />
            ) : activeTab === 'content' ? (
              <ContentTab
                visibleElements={visibleElements}
                hiddenElements={hiddenElements}
                elementsMeta={CONTENT_ELEMENT_META}
                onReorder={handleReorderElements}
                onToggleVisibility={handleToggleElementVisibility}
                onOpenFontSettings={handleOpenFontSettings}
                onOpenColorPicker={handleOpenColorPicker}
              />
            ) : activeTab === 'layout' ? (
              <LayoutTab
                style={styleState}
                onUpdate={updateStyle}
              />
              ) : null}
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Actions */}
      {isMobile && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-white/10 bg-slate-900/95 px-4 py-4 backdrop-blur-xl">
          <Button variant="secondary" size="sm" className="flex-1">
            <span>↻</span>
            <span>Reset</span>
          </Button>
          <Button size="sm" onClick={handleSaveTemplate} disabled={isSaving || !user?.uid} className="flex-2">
            {isSaving ? (
              <>
                <SaveSpinner />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <span>✓</span>
                <span>Saved!</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Template</span>
              </>
            )}
          </Button>
          </div>
      )}

      <Modal
        isOpen={Boolean(isFontModalOpen && activeFontElement && activeFontMeta && activeFontStyles)}
        onClose={handleCloseFontSettings}
        title={activeFontMeta ? `Font Settings – ${activeFontMeta.label}` : 'Font Settings'}
        className={cn(isMobile && 'max-w-full rounded-none border-0')}
      >
        {activeFontElement && activeFontMeta && activeFontStyles && activeFontDefaults ? (
          <FontSettings
            elementId={activeFontElement}
            meta={activeFontMeta}
            value={activeFontStyles}
            defaults={activeFontDefaults}
            onChange={(next) => handleFontStyleChange(activeFontElement, next)}
            onDone={handleCloseFontSettings}
            onReset={() => handleFontStyleReset(activeFontElement)}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(isColorModalOpen && activeColorElement && activeColorMeta)}
        onClose={handleCloseColorPicker}
        title={activeColorMeta ? `Color – ${activeColorMeta.label}` : 'Element Color'}
        className={cn(isMobile && 'max-w-full rounded-none border-0')}
      >
        {activeColorElement && activeColorMeta ? (
          <ColorPicker
            elementId={activeColorElement}
            meta={activeColorMeta}
            color={activeColorValue}
            defaultColor={getDefaultElementStyle(activeColorElement).color}
            onChange={(nextColor) => handleElementColorChange(activeColorElement, nextColor)}
            onDone={handleCloseColorPicker}
            onReset={() => handleElementColorReset(activeColorElement)}
          />
        ) : null}
      </Modal>
    </div>
  );
};

export default EditorPage;
