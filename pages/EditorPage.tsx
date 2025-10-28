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
import { DEFAULT_APP_SETTINGS, MOCK_SCHEDULE } from '../constants';
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
} from '../types';
import { cn } from '../utils/cn';
import { uploadImage } from '../services/storage';
import { saveTemplate } from '../services/api';
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
  const { user } = useAuth();
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-text-primary">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border-light/60 bg-background-deep/95 px-6 backdrop-blur-2xl">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-3 text-text-primary">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
              <span className="text-lg font-semibold text-primary-light">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-text-tertiary">
                Studiogram
              </span>
              <span className="text-sm font-semibold text-text-secondary">Schedule Editor</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 text-sm text-text-tertiary sm:flex">
            <Link to="/" className="hover:text-text-primary">Templates</Link>
            <span className="text-text-muted">/</span>
            <span className="font-medium text-text-secondary">Schedule Editor</span>
          </nav>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="rounded-full border border-border-light bg-surface px-4 py-2 text-sm font-medium text-text-secondary">
            📍 {userGymName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">↻ Reset</Button>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={isExporting}>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold shadow-primary">
            {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </div>
      </header>

      <div
        ref={layoutRef}
        className="flex flex-col gap-6 lg:grid lg:h-[calc(100vh-72px)] lg:grid-cols-[1fr_auto] lg:overflow-hidden"
      >
        <section className="relative flex items-center justify-center overflow-hidden bg-background-deep">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,123,216,0.08),transparent_55%),radial-gradient(circle_at_80%_65%,rgba(139,123,216,0.08),transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
          </div>
          <div className="relative z-10 flex w-full max-w-3xl flex-col gap-6 px-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface/70 p-4 shadow-md backdrop-blur">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleZoomChange(-10)}>−</Button>
                  <span className="min-w-[60px] text-center text-sm font-semibold">{zoomLevel}%</span>
                  <Button variant="secondary" size="sm" onClick={() => handleZoomChange(10)}>+</Button>
                </div>
                <Button variant="ghost" size="sm" onClick={handleResetZoom}>⊡ Fit</Button>
                <div className="ml-auto flex items-center gap-2 rounded-full bg-surface/80 p-2">
                  {(['mobile', 'tablet', 'desktop'] as DeviceOption[]).map((device) => (
                    <Button
                      key={device}
                      variant={selectedDevice === device ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedDevice(device)}
                    >
                      {device === 'mobile' ? '📱 Mobile' : device === 'tablet' ? '📱 Tablet' : '🖥️ Desktop'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div
                ref={previewRef}
                className="relative flex items-center justify-center border-4 border-border-light bg-gradient-to-br from-background via-background-deep to-background shadow-[0_30px_90px_rgba(0,0,0,0.5)] animate-float"
                style={previewStyle}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-border-light/40" />
                <SchedulePreview
                  schedule={MOCK_SCHEDULE}
                  style={styleState}
                  device={selectedDevice}
                  visibleElements={visibleElements}
                  elementStyles={elementStyles}
                />
              </div>
            </div>
          </div>
        </section>

        <aside
          className="relative flex flex-col border-t border-border-light/60 bg-background/95 backdrop-blur-2xl lg:h-full lg:border-t-0 lg:border-l"
          style={isDesktop ? { width: `${panelWidth}px` } : undefined}
        >
          <button
            type="button"
            onPointerDown={handleResizeStart}
            className={cn(
              'absolute left-0 top-0 z-20 hidden h-full w-1 cursor-ew-resize transition lg:block',
              isDragging ? 'bg-primary' : 'bg-transparent hover:bg-primary/40',
            )}
            aria-label="Resize panel"
          />
          <div className="flex items-center justify-between gap-3 border-b border-border-light/60 px-5 py-4">
            <nav className="inline-flex items-center gap-2 rounded-xl bg-surface/70 p-1">
              {(
                [
                  { id: 'style', label: 'Style' },
                  { id: 'content', label: 'Content' },
                  { id: 'layout', label: 'Layout' },
                ] as const
              ).map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'rounded-lg',
                    activeTab === tab.id && 'bg-primary/15 text-primary-light border border-primary/40',
                  )}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex-1 overflow-auto px-5 py-6 text-sm text-text-secondary">
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
            ) : (
              <p className="text-text-tertiary">
                Panel content for the <span className="font-semibold text-text-primary">{activeTab}</span>{' '}
                tab will be implemented in upcoming prompts.
              </p>
            )}
          </div>
        </aside>
      </div>

      <Modal
        isOpen={Boolean(isFontModalOpen && activeFontElement && activeFontMeta && activeFontStyles)}
        onClose={handleCloseFontSettings}
        title={activeFontMeta ? `Font Settings – ${activeFontMeta.label}` : 'Font Settings'}
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
