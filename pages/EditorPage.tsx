import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ensureUserDocument, fetchUserRoot } from '../services/userData';
import { Button, Modal } from '../components/ui';
import { SchedulePreview } from '../components/editor/SchedulePreview';
import { StyleTab } from '../components/editor/StyleTab';
import { ContentTab } from '../components/editor/ContentTab';
import { LayoutTab } from '../components/editor/LayoutTab';
import { FontSettings } from '../components/editor/FontSettings';
import { ColorPicker } from '../components/editor/ColorPicker';
import {
  computeSmartSizing,
  DEFAULT_SMART_SPACING,
  type SmartSpacingScales,
  type StoryMetrics,
} from '../components/editor/smartTextSizing';
import { DEFAULT_APP_SETTINGS } from '../constants';
import { STYLE_COLOR_PALETTES } from '../components/editor/stylePalettes';
import {
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
import { saveTemplate, getUserSchedule, saveSchedule } from '../services/api';
import { toPng } from 'html-to-image';
import TemplateGallery from '../components/TemplateGallery';
import { getTemplateDefinition } from '../lib/templates';
import { isTemplateRegistryPreviewEnabled } from '../lib/templates/featureFlags';
import { resolveContentTabControls } from '../lib/templates/editorConfig';

const SaveSpinner: React.FC = () => (
  <span
    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
    aria-hidden="true"
  />
);

// Removed device chrome overlay for edge-to-edge story preview
const PhoneFrameOverlay: React.FC = () => null;

type ZoomMode = 'fit' | '1' | '1.5';

const ZOOM_OPTIONS: ZoomMode[] = ['fit', '1', '1.5'];
const ZOOM_LABELS: Record<ZoomMode, string> = {
  fit: 'Fit to Screen',
  '1': '100%',
  '1.5': '150%',
};

const formatPanelWidth = (value: number) => Math.min(600, Math.max(320, value));

const EditorPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'style' | 'content' | 'layout'>('style');
  const [panelWidth, setPanelWidth] = useState(420);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef(0);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const scheduleEndpoint = useMemo(
    () => (import.meta.env.VITE_SCHEDULE_ENDPOINT as string | undefined) || '/api/schedule',
    [],
  );
  const clientTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/New_York',
    [],
  );
  const [storyScale, setStoryScale] = useState(1);
  const previewAreaRef = useRef<HTMLDivElement | null>(null);
  const storyCanvasRef = useRef<HTMLDivElement | null>(null);
  const zoomModeRef = useRef<ZoomMode>('fit');
  const autoSizingKeysRef = useRef<Set<string>>(new Set());
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
  const [smartSpacing, setSmartSpacing] = useState<SmartSpacingScales>(DEFAULT_SMART_SPACING);
  const [storyMetrics, setStoryMetrics] = useState<StoryMetrics | null>(null);
  const [isSmartSizing, setIsSmartSizing] = useState(false);
  const [activeFontElement, setActiveFontElement] = useState<ScheduleElementId | null>(null);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [activeColorElement, setActiveColorElement] = useState<ScheduleElementId | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const saveResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [scheduleMeta, setScheduleMeta] = useState<{
    locationSlug?: string | null;
    radius?: number | null;
    timezone?: string | null;
  }>({});
  const [activeMobileDrawer, setActiveMobileDrawer] = useState<'none' | 'edit' | 'date'>('none');
  const [areMobileFabsVisible, setAreMobileFabsVisible] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isMobile = !isDesktop;
  const previewPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const previewPointerMovedRef = useRef(false);
  const lastPreviewTapRef = useRef(0);
  const closeMobileDrawer = useCallback(() => {
    setActiveMobileDrawer('none');
    setAreMobileFabsVisible(true);
  }, []);
  const openMobileEditDrawer = useCallback(() => {
    setActiveMobileDrawer('edit');
    setAreMobileFabsVisible(false);
  }, []);
  const openMobileDateDrawer = useCallback(() => {
    setActiveMobileDrawer('date');
    setAreMobileFabsVisible(false);
  }, []);
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
    if (!isMobile) {
      return;
    }
    if (isGalleryOpen) {
      closeMobileDrawer();
      setAreMobileFabsVisible(false);
    }
  }, [closeMobileDrawer, isGalleryOpen, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }
    if (!isGalleryOpen && activeMobileDrawer === 'none') {
      setAreMobileFabsVisible(true);
    }
  }, [activeMobileDrawer, isGalleryOpen, isMobile]);

  useEffect(() => {
    if (!user?.uid || !userGymSlug) {
      setSchedule(null);
      return;
    }

    let isActive = true;
    setIsScheduleLoading(true);
    setScheduleError(null);

    getUserSchedule(userGymSlug, user.uid)
      .then((snapshot) => {
        if (!isActive) return;
        if (snapshot?.schedule) {
          setSchedule(snapshot.schedule);
          setSelectedDate(snapshot.lastRequestedDate ?? todayIso);
          setScheduleMeta({
            locationSlug: snapshot.mindbodyMeta?.locationSlug ?? userGymSlug,
            radius: snapshot.mindbodyMeta?.radius ?? null,
            timezone: snapshot.mindbodyMeta?.timezone ?? null,
          });
          setScheduleSuccessMessage(null);
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

  const templateConfigs = useMemo(() => DEFAULT_APP_SETTINGS.configs, []);
  const initialTemplateId = DEFAULT_APP_SETTINGS.activeTemplateId as TemplateId;

  const [activeTemplateId, setActiveTemplateId] = useState<TemplateId>(initialTemplateId);
  const isTemplateRegistryEnabled = isTemplateRegistryPreviewEnabled();
  const templateDefinition = useMemo(() => {
    if (!isTemplateRegistryEnabled) {
      return null;
    }
    return getTemplateDefinition(activeTemplateId) ?? null;
  }, [activeTemplateId, isTemplateRegistryEnabled]);
  const contentTabControls = useMemo(
    () => resolveContentTabControls(templateDefinition?.editor?.contentTab ?? null),
    [templateDefinition],
  );
  const contentElementsMeta = contentTabControls.elementsMeta;
  const gallerySettings = useMemo(
    () => ({
      activeTemplateId,
      configs: templateConfigs,
    }),
    [activeTemplateId, templateConfigs],
  );
  const [styleState, setStyleState] = useState<Style>(() => ({
    ...templateConfigs[initialTemplateId],
  }));
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('template');
  const staticVisibility = useMemo(
    () => ({
      heading: styleState.showHeading !== false,
      subtitle: styleState.showSubtitle !== false,
      scheduleDate: styleState.showScheduleDate !== false,
      footer: styleState.showFooter !== false,
    }),
    [styleState.showHeading, styleState.showSubtitle, styleState.showScheduleDate, styleState.showFooter],
  );

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
      closeMobileDrawer();
    }
  }, [closeMobileDrawer, isMobile]);

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

  const handleDateInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
    setScheduleSuccessMessage(null);
    setScheduleError(null);
  }, []);

  const handleLoadScheduleForDate = useCallback(async (): Promise<boolean> => {
    if (!selectedDate) {
      return false;
    }
    if (!user?.uid) {
      setScheduleError('You need to be signed in to load schedules.');
      return false;
    }

    const effectiveSlug = scheduleMeta.locationSlug ?? userGymSlug;
    if (!effectiveSlug) {
      setScheduleError('Choose a gym in Gym Finder first to load schedules.');
      return false;
    }

    const effectiveRadius = scheduleMeta.radius && Number(scheduleMeta.radius) > 0 ? Number(scheduleMeta.radius) : 5;
    const effectiveTimezone = scheduleMeta.timezone ?? clientTimezone;

    setIsScheduleLoading(true);
    setScheduleError(null);
    setScheduleSuccessMessage(null);

    try {
      const response = await fetch(scheduleEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationSlug: effectiveSlug,
          date: selectedDate,
          radius: effectiveRadius,
          timezone: effectiveTimezone,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const nextSchedule: Schedule | null = data?.schedule ?? null;
      if (!nextSchedule) {
        throw new Error('Schedule payload missing from response.');
      }

      const responseSlug = typeof data?.slug === 'string' && data.slug ? data.slug : effectiveSlug;
      const metaPayload = {
        locationSlug: responseSlug,
        radius: effectiveRadius,
        timezone: effectiveTimezone,
      } as { locationSlug?: string; radius?: number; timezone?: string };

      const savedSlug = await saveSchedule(nextSchedule, responseSlug, user.uid, {
        date: selectedDate,
        meta: metaPayload,
      });

      const refreshed = await getUserSchedule(savedSlug, user.uid);
      if (refreshed?.schedule) {
        setSchedule(refreshed.schedule);
        setSelectedDate(refreshed.lastRequestedDate ?? selectedDate);
        setScheduleMeta({
          locationSlug: refreshed.mindbodyMeta?.locationSlug ?? savedSlug,
          radius: refreshed.mindbodyMeta?.radius ?? effectiveRadius,
          timezone: refreshed.mindbodyMeta?.timezone ?? effectiveTimezone,
        });
        setScheduleSuccessMessage(`Loaded schedule for ${refreshed.schedule.date}.`);
        setUserGymSlug(savedSlug);
        setUserGymName(savedSlug.replace(/-/g, ' '));
      } else {
        setSchedule(nextSchedule);
        setScheduleSuccessMessage(`Loaded schedule for ${nextSchedule.date}.`);
      }
      return true;
    } catch (error) {
      console.error('Failed to load schedule for date:', error);
      setScheduleError('Could not load the schedule for that date. Please try again.');
      return false;
    } finally {
      setIsScheduleLoading(false);
    }
  }, [clientTimezone, scheduleEndpoint, scheduleMeta, selectedDate, user?.uid, userGymSlug]);
  const handleMobileLoadScheduleForDate = useCallback(async () => {
    const success = await handleLoadScheduleForDate();
    if (success) {
      closeMobileDrawer();
    }
  }, [closeMobileDrawer, handleLoadScheduleForDate]);

  const handleTemplateSelect = useCallback(
    (templateId: TemplateId) => {
      const templateStyle = templateConfigs[templateId];
      if (!templateStyle) {
        console.warn('Attempted to load unknown template', templateId);
        return;
      }

      setActiveTemplateId(templateId);
      setStyleState({ ...templateStyle });
      setSelectedPaletteId('template');
      setVisibleElements(DEFAULT_VISIBLE_ELEMENTS);
      setHiddenElements(DEFAULT_HIDDEN_ELEMENTS);
      setElementStyles(buildInitialElementStyles());
      closeMobileDrawer();
      setIsGalleryOpen(false);
    },
    [closeMobileDrawer, templateConfigs],
  );

  const handleOpenGallery = useCallback(() => {
    closeMobileDrawer();
    setIsGalleryOpen(true);
  }, [closeMobileDrawer]);

  const handleCloseGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);

  const isMobileDrawerOpen = activeMobileDrawer !== 'none';

  const handleMobilePreviewTap = useCallback(() => {
    const allowToggle =
      isMobile &&
      !isMobileDrawerOpen &&
      !isGalleryOpen &&
      !isFontModalOpen &&
      !isColorModalOpen;

    if (!allowToggle) {
      previewPointerMovedRef.current = false;
      return;
    }

    if (previewPointerMovedRef.current) {
      previewPointerMovedRef.current = false;
      return;
    }

    const now = Date.now();
    if (now - lastPreviewTapRef.current < 180) {
      return;
    }
    lastPreviewTapRef.current = now;
    setAreMobileFabsVisible((prev) => !prev);
    previewPointerMovedRef.current = false;
  }, [isColorModalOpen, isFontModalOpen, isGalleryOpen, isMobile, isMobileDrawerOpen]);

  const handlePreviewPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isMobile) {
        return;
      }
      previewPointerStartRef.current = { x: event.clientX, y: event.clientY };
      previewPointerMovedRef.current = false;
    },
    [isMobile],
  );

  const handlePreviewPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    if (!previewPointerStartRef.current) return;
    const dx = Math.abs(event.clientX - previewPointerStartRef.current.x);
    const dy = Math.abs(event.clientY - previewPointerStartRef.current.y);
    if (dx > 8 || dy > 8) {
      previewPointerMovedRef.current = true;
    }
  }, [isMobile]);

  const handlePreviewPointerUp = useCallback(() => {
    previewPointerStartRef.current = null;
  }, []);

  const handleExport = useCallback(async () => {
    if (!storyCanvasRef.current) {
      return;
    }

    setIsExporting(true);

    try {
      const dataUrl = await toPng(storyCanvasRef.current, {
        width: 1080,
        height: 1920,
        style: {
          transform: 'none',
          width: '1080px',
          height: '1920px',
        },
      });

      const link = document.createElement('a');
      const baseName = (userGymSlug || userGymName || 'studiogram')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      link.download = `${baseName || 'studiogram'}-schedule-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
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
    setElementStyles((prev) => {
      const baseStyle = prev[elementId] ?? getDefaultElementStyle(elementId);
      return {
        ...prev,
        [elementId]: {
          ...baseStyle,
          color,
        },
      };
    });
  }, []);

  const handleElementColorReset = useCallback((elementId: ScheduleElementId) => {
    const defaults = getDefaultElementStyle(elementId);
    setElementStyles((prev) => ({
      ...prev,
      [elementId]: {
        ...(prev[elementId] ?? defaults),
        color: defaults.color,
      },
    }));
  }, []);

  const handleStoryMetricsChange = useCallback(
    (metrics: StoryMetrics) => {
      const normalized: StoryMetrics = {
        contentHeight: Math.round(metrics.contentHeight),
        availableHeight: Math.round(metrics.availableHeight),
        heroHeight: Math.round(metrics.heroHeight),
        scheduleHeight: Math.round(metrics.scheduleHeight),
        footerHeight: Math.round(metrics.footerHeight),
        itemCount: metrics.itemCount,
      };

      setStoryMetrics((prev) => {
        if (
          prev &&
          prev.contentHeight === normalized.contentHeight &&
          prev.availableHeight === normalized.availableHeight &&
          prev.heroHeight === normalized.heroHeight &&
          prev.scheduleHeight === normalized.scheduleHeight &&
          prev.footerHeight === normalized.footerHeight &&
          prev.itemCount === normalized.itemCount
        ) {
          return prev;
        }
        return normalized;
      });
    },
    [],
  );

  const handleApplySmartSizing = useCallback(() => {
    setIsSmartSizing(true);
    setElementStyles((prev) => {
      try {
        const result = computeSmartSizing({
          currentStyles: prev,
          style: styleState,
          visibleElements,
          schedule,
          metrics: storyMetrics,
        });
        setSmartSpacing(result.spacing);
        return result.elementStyles;
      } finally {
        setIsSmartSizing(false);
      }
    });
  }, [schedule, storyMetrics, styleState, visibleElements]);

  const scheduleSignature = useMemo(() => {
    if (!schedule?.items?.length) return 'none';
    return schedule.items
      .map(
        (item) =>
          [
            item.class?.length ?? 0,
            item.coach?.length ?? 0,
            item.location?.length ?? 0,
            item.description?.length ?? 0,
            item.time?.length ?? 0,
            item.duration?.length ?? 0,
          ].join('-'),
      )
      .join('|');
  }, [schedule]);

  const heroSignature = useMemo(
    () =>
      [
        styleState.heading?.length ?? 0,
        styleState.subtitle?.length ?? 0,
        styleState.footer?.length ?? 0,
        styleState.showHeading !== false ? 1 : 0,
        styleState.showSubtitle !== false ? 1 : 0,
        styleState.showFooter !== false ? 1 : 0,
        styleState.showScheduleDate !== false ? 1 : 0,
      ].join('-'),
    [
      styleState.heading,
      styleState.subtitle,
      styleState.footer,
      styleState.showHeading,
      styleState.showSubtitle,
      styleState.showFooter,
      styleState.showScheduleDate,
    ],
  );

  const visibleSignature = useMemo(() => visibleElements.join(','), [visibleElements]);

  const autoSizingKey = useMemo(
    () =>
      [
        activeTemplateId,
        heroSignature,
        styleState.layoutStyle ?? 'list',
        styleState.spacing ?? 'comfortable',
        styleState.cardCornerRadius ?? 0,
        styleState.accentLines ? 1 : 0,
        styleState.footerBar ? 1 : 0,
        schedule?.items.length ?? 0,
        schedule?.date ?? '',
        scheduleSignature,
        visibleSignature,
      ].join('|'),
    [
      activeTemplateId,
      heroSignature,
      styleState.layoutStyle,
      styleState.spacing,
      styleState.cardCornerRadius,
      styleState.accentLines,
      styleState.footerBar,
      schedule?.items.length,
      schedule?.date,
      scheduleSignature,
      visibleSignature,
    ],
  );

  useEffect(() => {
    if (!storyMetrics) return;
    if (isSmartSizing) return;
    const key = autoSizingKey;
    const seen = autoSizingKeysRef.current;
    if (seen.has(key)) {
      return;
    }
    if (seen.size > 50) {
      seen.clear();
    }
    seen.add(key);
    handleApplySmartSizing();
  }, [autoSizingKey, handleApplySmartSizing, isSmartSizing, storyMetrics]);

  const updateStoryScale = useCallback(
    (mode?: ZoomMode) => {
      const nextMode = mode ?? zoomModeRef.current;
      zoomModeRef.current = nextMode;
      setZoomMode(nextMode);

      if (nextMode === 'fit') {
        const container = previewAreaRef.current;
        if (!container || typeof window === 'undefined') {
          setStoryScale(1);
          return;
        }

        const bounds = container.getBoundingClientRect();
        const scaleWidth = bounds.width / 1080;
        const scaleHeight = bounds.height / 1920;
        const computedScale = Math.min(scaleWidth, scaleHeight);
        const safeScale = Number.isFinite(computedScale) && computedScale > 0 ? computedScale : 1;
        setStoryScale(safeScale);
      } else {
        const parsed = Number.parseFloat(nextMode);
        const safeScale = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
        setStoryScale(safeScale);
      }
    },
    [],
  );

  const handleZoomSelect = useCallback(
    (mode: ZoomMode) => {
      updateStoryScale(mode);
    },
    [updateStoryScale],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      updateStoryScale();
    };

    const node = previewAreaRef.current;
    handleResize();
    const rafId = window.requestAnimationFrame(handleResize);

    let observer: ResizeObserver | null = null;

    if (node && 'ResizeObserver' in window) {
      observer = new ResizeObserver(handleResize);
      observer.observe(node);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [updateStoryScale, isDesktop, isGalleryOpen, panelWidth]);

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

  const handleToggleStaticElement = useCallback(
    (elementId: ScheduleElementId, next: boolean) => {
      switch (elementId) {
        case 'heading':
          updateStyle({ showHeading: next });
          break;
        case 'subtitle':
          updateStyle({ showSubtitle: next });
          break;
        case 'scheduleDate':
          updateStyle({ showScheduleDate: next });
          break;
        case 'footer':
          updateStyle({ showFooter: next });
          break;
        default:
          break;
      }
    },
    [updateStyle],
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

  const activeFontMeta = activeFontElement ? contentElementsMeta[activeFontElement] : null;
  const activeFontStyles =
    activeFontElement != null
      ? elementStyles[activeFontElement] ?? getDefaultElementStyle(activeFontElement)
      : null;
  const activeFontDefaults =
    activeFontElement != null ? getDefaultElementStyle(activeFontElement) : null;

  const activeColorMeta = activeColorElement ? contentElementsMeta[activeColorElement] : null;
  const activeColorValue =
    activeColorElement != null
      ? elementStyles[activeColorElement]?.color ?? getDefaultElementStyle(activeColorElement).color
      : '#FFFFFF';

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
          templateId: activeTemplateId,
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
    activeTemplateId,
    elementStyles,
    hiddenElements,
    saveTemplate,
    styleState,
    user?.uid,
    userGymSlug,
    visibleElements,
  ]);

  const fontVars = React.useMemo<React.CSSProperties>(
    () => {
      const headingStyle = elementStyles.heading ?? getDefaultElementStyle('heading');
      const subtitleStyle = elementStyles.subtitle ?? getDefaultElementStyle('subtitle');
      const scheduleDateStyle = elementStyles.scheduleDate ?? getDefaultElementStyle('scheduleDate');
      const footerStyle = elementStyles.footer ?? getDefaultElementStyle('footer');
      const classStyle = elementStyles.className ?? getDefaultElementStyle('className');
      const timeStyle = elementStyles.time ?? getDefaultElementStyle('time');
      const instructorStyle = elementStyles.instructor ?? getDefaultElementStyle('instructor');
      const locationStyle = elementStyles.location ?? getDefaultElementStyle('location');
      const descriptionStyle = elementStyles.description ?? getDefaultElementStyle('description');

      return {
        '--font-heading': `${headingStyle.fontSize}px`,
        '--font-subtitle': `${subtitleStyle.fontSize}px`,
        '--font-date': `${scheduleDateStyle.fontSize}px`,
        '--font-class': `${classStyle.fontSize}px`,
        '--font-time': `${timeStyle.fontSize}px`,
        '--font-instructor': `${instructorStyle.fontSize}px`,
        '--font-location': `${locationStyle.fontSize}px`,
        '--font-description': `${descriptionStyle.fontSize}px`,
        '--font-footer': `${footerStyle.fontSize}px`,
      };
    },
    [elementStyles],
  );

  const baseCanvasStyle = React.useMemo<React.CSSProperties>(
    () => ({
      width: '1080px',
      height: '1920px',
      transform: `scale(${storyScale})`,
      transformOrigin: 'center center',
    }),
    [storyScale],
  );

  const scaledCanvasWrapperStyle = React.useMemo<React.CSSProperties>(
    () => ({
      width: `${1080 * storyScale}px`,
      height: `${1920 * storyScale}px`,
    }),
    [storyScale],
  );

  const storyCanvasTransformStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...fontVars,
      width: '1080px',
      height: '1920px',
    }),
    [fontVars],
  );
  const actionButtons = isGalleryOpen ? (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCloseGallery}
      fullWidth={isMobile}
    >
      <span role="img" aria-hidden="true">↩️</span>
      <span>Back to Editor</span>
    </Button>
  ) : (
    <>
      <Button variant="secondary" size="sm" fullWidth={isMobile}>
        <span>↻</span>
        <span>Reset</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleOpenGallery}
        fullWidth={isMobile}
      >
        <span role="img" aria-hidden="true">🖼️</span>
        <span>Gallery</span>
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
            {!isMobile && <span>Save Template</span>}
            {isMobile && <span className="sr-only">Save Template</span>}
          </>
        )}
      </Button>
    </>
  );

  const scheduleStatusMessage = isScheduleLoading ? (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-xs text-purple-100 text-center">
      Loading your latest schedule…
    </div>
  ) : scheduleError ? (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 text-center">
      {scheduleError}
    </div>
  ) : scheduleSuccessMessage ? (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100 text-center">
      {scheduleSuccessMessage}
    </div>
  ) : null;
  const allowMobileFabs = isMobile && !isGalleryOpen && !isMobileDrawerOpen && !isFontModalOpen && !isColorModalOpen;
  const fabMotionState = allowMobileFabs && areMobileFabsVisible ? 'visible' : 'hidden';
  const fabInteractionEnabled = allowMobileFabs && areMobileFabsVisible;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 h-18 border-b border-white/10 bg-slate-900/95 backdrop-blur-xl px-4 py-4 sm:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6">
          {/* Header Left */}
          <div className="flex items-center gap-4">
            {/* Desktop: Logo + Breadcrumb */}
            <Link to="/" className="hidden sm:flex items-center gap-3 text-white transition hover:text-white/80">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-semibold text-white shadow-lg">
                S
              </span>
              <span className="text-lg font-semibold tracking-tight">Studiogram</span>
            </Link>
            <nav className="hidden items-center gap-2 text-sm sm:flex">
              <button
                type="button"
                onClick={handleOpenGallery}
                className={cn(
                  'rounded-full px-3 py-1 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                  isGalleryOpen
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                )}
              >
                Templates
              </button>
              <span className="text-slate-600">/</span>
              <span className={cn('font-medium', isGalleryOpen ? 'text-white' : 'text-slate-300')}>
                {isGalleryOpen ? 'Template Gallery' : 'Schedule Editor'}
              </span>
            </nav>
            {/* Mobile: Profile Icon */}
            {isMobile && (
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
                    className="absolute left-0 mt-3 w-44 rounded-xl border border-white/10 bg-slate-900/95 p-2 shadow-xl backdrop-blur-xl"
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
            )}
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
            {/* Desktop: Profile Icon */}
            {!isMobile && (
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
            )}
            {/* Mobile: Export Button */}
            {isMobile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={isGalleryOpen ? handleCloseGallery : handleOpenGallery}
              >
                <span role="img" aria-hidden="true">{isGalleryOpen ? '↩️' : '🖼️'}</span>
                <span>{isGalleryOpen ? 'Back' : 'Gallery'}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <AnimatePresence mode="wait" initial={false}>
        {isGalleryOpen ? (
          <motion.div
            key="template-gallery"
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="flex h-[calc(100vh-72px)] flex-col overflow-hidden">
              {!isMobile && (
                <div className="flex-shrink-0 border-b border-white/10 bg-slate-950/90 px-4 py-5 sm:px-8 sm:py-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Templates</p>
                      <h1 className="text-2xl font-semibold text-white sm:text-3xl">Template Gallery</h1>
                      <p className="mt-1 text-sm text-slate-300/80">
                        {schedule ? 'Preview each design with your live schedule data.' : 'Preview each design with sample schedule data until you connect a gym.'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCloseGallery}
                      className="self-start"
                    >
                      <span role="img" aria-hidden="true">↩️</span>
                      <span>Back to Editor</span>
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <TemplateGallery
                  settings={gallerySettings}
                  schedule={schedule}
                  onTemplateSelect={handleTemplateSelect}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor-view"
            className="flex-1"
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
          {isMobile ? (
            <div className="relative flex h-[calc(100vh-72px)] flex-col overflow-hidden bg-slate-950">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,123,216,0.03),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(139,123,216,0.03),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
              <div className="relative z-10 flex flex-1 flex-col items-center px-4 pt-6 pb-16">
                {scheduleStatusMessage ? (
                  <div className="mb-4 w-full max-w-xs">{scheduleStatusMessage}</div>
                ) : null}
                <div
                  ref={previewAreaRef}
                  onClick={handleMobilePreviewTap}
                  onPointerDown={handlePreviewPointerDown}
                  onPointerMove={handlePreviewPointerMove}
                  onPointerUp={handlePreviewPointerUp}
                  onPointerLeave={handlePreviewPointerUp}
                  onPointerCancel={handlePreviewPointerUp}
                  className="relative flex min-h-0 w-full flex-1 items-center justify-center"
                >
                  <div className="relative flex items-center justify-center" style={scaledCanvasWrapperStyle}>
                    <div className="relative" style={baseCanvasStyle}>
                      <PhoneFrameOverlay />
                      <div
                        id="story-canvas"
                        ref={storyCanvasRef}
                        className="story-canvas z-0 overflow-hidden rounded-[48px] bg-slate-950 shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
                        style={storyCanvasTransformStyle as React.CSSProperties}
                      >
                        <SchedulePreview
                          schedule={schedule ?? { date: userGymName, items: [] }}
                          style={styleState}
                          visibleElements={visibleElements}
                          elementStyles={elementStyles}
                          spacingScales={smartSpacing}
                          onMetricsChange={handleStoryMetricsChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
                variants={{
                  visible: { opacity: 1, y: 0 },
                  hidden: { opacity: 0, y: 24 },
                }}
                initial={false}
                animate={fabMotionState}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                <div
                  className={cn(
                    'flex items-center gap-4 rounded-full',
                    fabInteractionEnabled ? 'pointer-events-auto' : 'pointer-events-none',
                  )}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!allowMobileFabs) return;
                      openMobileEditDrawer();
                    }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-400 text-xl text-white shadow-[0_18px_38px_rgba(88,80,214,0.55)] transition hover:scale-105 active:scale-95"
                    aria-label="Open editor drawer"
                  >
                    <span role="img" aria-hidden="true">✏️</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!fabInteractionEnabled || isExporting) {
                        return;
                      }
                      void handleExport();
                    }}
                    disabled={!fabInteractionEnabled || isExporting}
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl text-white shadow-[0_18px_38px_rgba(15,23,42,0.55)] transition hover:bg-white/20 hover:scale-105 active:scale-95',
                      (isExporting || !fabInteractionEnabled) && 'opacity-60',
                    )}
                    aria-label="Export story"
                  >
                    {isExporting ? <SaveSpinner /> : <span role="img" aria-hidden="true">⬇️</span>}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!allowMobileFabs) return;
                      openMobileDateDrawer();
                    }}
                    disabled={!fabInteractionEnabled}
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/90 text-base text-slate-100 shadow-[0_14px_30px_rgba(15,23,42,0.45)] transition hover:bg-slate-700 hover:scale-105 active:scale-95',
                      !fabInteractionEnabled && 'opacity-60',
                    )}
                    aria-label="Select schedule date"
                  >
                    <span role="img" aria-hidden="true">🗓️</span>
                  </button>
                </div>
              </motion.div>

              <AnimatePresence>
                {isMobile && !isGalleryOpen && isMobileDrawerOpen && (
                  <>
                    <motion.button
                      key="mobile-drawer-backdrop"
                      type="button"
                      aria-label="Close menu"
                      onClick={closeMobileDrawer}
                      className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      key="mobile-drawer"
                      className="fixed inset-x-0 bottom-0 z-50"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      <div className="rounded-t-3xl border-t border-white/10 bg-slate-900/95 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] shadow-[0_-24px_60px_rgba(5,12,24,0.65)] backdrop-blur-2xl max-h-[82vh] overflow-hidden">
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
                        {activeMobileDrawer === 'edit' ? (
                          <>
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Editor</p>
                                <h2 className="text-base font-semibold text-white">Customize Story</h2>
                              </div>
                              <button
                                type="button"
                                onClick={closeMobileDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-slate-200 transition hover:bg-white/20"
                                aria-label="Close editor"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="mb-4 flex gap-1 rounded-xl bg-white/5 p-1.5">
                              {([
                                { key: 'layout' as const, label: 'Template' },
                                { key: 'style' as const, label: 'Styles' },
                                { key: 'content' as const, label: 'Schedule' },
                              ]).map(({ key, label }) => (
                                <button
                                  key={key}
                                  type="button"
                                  className={cn(
                                    'flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition',
                                    activeTab === key ? 'bg-white text-slate-900 shadow-lg' : 'hover:text-white',
                                  )}
                                  onClick={() => setActiveTab(key)}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto pr-1">
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
                                  config={templateDefinition?.editor?.styleTab ?? null}
                                />
                              ) : activeTab === 'content' ? (
                                <ContentTab
                                  visibleElements={visibleElements}
                                  hiddenElements={hiddenElements}
                                  elementsMeta={contentElementsMeta}
                                  onReorder={handleReorderElements}
                                  onToggleVisibility={handleToggleElementVisibility}
                                  onOpenFontSettings={handleOpenFontSettings}
                                  onOpenColorPicker={handleOpenColorPicker}
                                  staticVisibility={staticVisibility}
                                  onToggleStaticElement={handleToggleStaticElement}
                                  onApplySmartSizing={handleApplySmartSizing}
                                  isSmartSizing={isSmartSizing}
                                  config={templateDefinition?.editor?.contentTab ?? null}
                                />
                              ) : (
                                <LayoutTab
                                  style={styleState}
                                  onUpdate={updateStyle}
                                  config={templateDefinition?.editor?.layoutTab ?? null}
                                />
                              )}
                            </div>
                            <div className="mt-5 flex flex-col gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleOpenGallery}
                                fullWidth
                              >
                                <span role="img" aria-hidden="true">🖼️</span>
                                <span>Open Template Gallery</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveTemplate}
                                disabled={isSaving || !user?.uid}
                                className={cn(
                                  saveSuccess &&
                                    'from-emerald-500 to-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.45)] animate-[successPulse_0.5s_ease-out]',
                                )}
                                fullWidth
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
                                    <span role="img" aria-hidden="true">💾</span>
                                    <span>Save Template</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        ) : activeMobileDrawer === 'date' ? (
                          <div className="space-y-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Schedule</p>
                                <h2 className="text-base font-semibold text-white">Pick a date</h2>
                              </div>
                              <button
                                type="button"
                                onClick={closeMobileDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-slate-200 transition hover:bg-white/20"
                                aria-label="Close date picker"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="space-y-3">
                              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Schedule date
                              </label>
                              <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateInputChange}
                                className="w-full rounded-xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-slate-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400"
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={handleMobileLoadScheduleForDate}
                              disabled={isScheduleLoading || !selectedDate}
                              className="w-full"
                            >
                              {isScheduleLoading ? (
                                <>
                                  <SaveSpinner />
                                  <span>Loading…</span>
                                </>
                              ) : (
                                <>
                                  <span role="img" aria-hidden="true">📅</span>
                                  <span>Load Schedule</span>
                                </>
                              )}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex h-[calc(100vh-72px)] overflow-hidden">
              <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-slate-900 p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,123,216,0.03),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,123,216,0.03),transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
                <div className="relative z-10 flex h-full w-full max-w-5xl flex-col items-center justify-start min-h-0">
                  {scheduleStatusMessage ? (
                    <div className="mb-4 w-full max-w-sm text-center">{scheduleStatusMessage}</div>
                  ) : null}
                  <div className="relative z-20 mb-6 flex flex-wrap items-center justify-center gap-2">
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Schedule Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateInputChange}
                        className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                      <button
                        type="button"
                        onClick={handleLoadScheduleForDate}
                        disabled={isScheduleLoading || !selectedDate}
                        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isScheduleLoading ? (
                          <>
                            <SaveSpinner />
                            <span>Loading…</span>
                          </>
                        ) : (
                          <>
                            <span role="img" aria-hidden="true">
                              📅
                            </span>
                            <span>Load</span>
                          </>
                        )}
                      </button>
                    </div>
                    {ZOOM_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleZoomSelect(option)}
                        className={cn(
                          'rounded-lg border border-white/10 px-4 py-2 text-xs font-medium transition',
                          zoomMode === option
                            ? 'bg-purple-500/20 text-white shadow-[0_0_30px_rgba(99,102,241,0.35)]'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        {ZOOM_LABELS[option]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={isExporting}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isExporting ? (
                        <>
                          <SaveSpinner />
                          <span>Exporting…</span>
                        </>
                      ) : (
                        <>
                          <span role="img" aria-hidden="true">
                            📥
                          </span>
                          <span>Export</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    ref={previewAreaRef}
                    className="story-preview relative z-10 flex h-full w-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto"
                  >
                    <div className="relative flex items-center justify-center" style={scaledCanvasWrapperStyle}>
                      <div className="relative" style={baseCanvasStyle}>
                        <PhoneFrameOverlay />
                        <div
                          id="story-canvas"
                          ref={storyCanvasRef}
                          className="story-canvas z-0 overflow-hidden rounded-[48px] bg-slate-950 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
                          style={storyCanvasTransformStyle as React.CSSProperties}
                        >
                          <SchedulePreview
                            schedule={schedule ?? { date: userGymName, items: [] }}
                            style={styleState}
                            visibleElements={visibleElements}
                            elementStyles={elementStyles}
                            spacingScales={smartSpacing}
                            onMetricsChange={handleStoryMetricsChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <aside
                className="relative w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden"
                style={{ width: `${panelWidth}px` }}
              >
                <button
                  type="button"
                  onPointerDown={handleResizeStart}
                  className={`absolute left-0 top-0 z-20 h-full w-1 cursor-ew-resize transition ${
                    isDragging ? 'bg-purple-500' : 'bg-transparent hover:bg-purple-500/40'
                  }`}
                  aria-label="Resize panel"
                />
                <div className="m-5 flex gap-1 rounded-xl bg-white/3 p-1.5">
                  {(['style', 'content', 'layout'] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`flex-1 rounded-lg border-none bg-transparent px-4 py-2.5 text-slate-400 font-medium transition-all duration-200 ${
                        activeTab === tab ? 'bg-purple-500/15 text-purple-400' : 'hover:text-slate-300'
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
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
                      config={templateDefinition?.editor?.styleTab ?? null}
                    />
                  ) : activeTab === 'content' ? (
                    <ContentTab
                      visibleElements={visibleElements}
                      hiddenElements={hiddenElements}
                      elementsMeta={contentElementsMeta}
                      onReorder={handleReorderElements}
                      onToggleVisibility={handleToggleElementVisibility}
                      onOpenFontSettings={handleOpenFontSettings}
                      onOpenColorPicker={handleOpenColorPicker}
                      staticVisibility={staticVisibility}
                      onToggleStaticElement={handleToggleStaticElement}
                      onApplySmartSizing={handleApplySmartSizing}
                      isSmartSizing={isSmartSizing}
                      config={templateDefinition?.editor?.contentTab ?? null}
                    />
                  ) : activeTab === 'layout' ? (
                    <LayoutTab
                      style={styleState}
                      onUpdate={updateStyle}
                      config={templateDefinition?.editor?.layoutTab ?? null}
                    />
                  ) : null}
                </div>
              </aside>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

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
