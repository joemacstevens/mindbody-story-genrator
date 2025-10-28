import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Style, LogoPosition, SelectedElement } from '../types';
import { COLOR_PALETTES } from '../constants';
import { uploadImage } from '../services/storage';
import BackgroundModal from './BackgroundModal';

type EditorTab = 'colors' | 'text' | 'background' | 'logo' | 'advanced';

const fontOptions = [
  { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { name: 'Lexend', value: "'Lexend', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
  { name: 'Anton', value: "'Anton', sans-serif" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
];

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const parseOverlayColor = (value?: string | null) => {
  const defaultColor = { r: 0, g: 0, b: 0, a: 0 };
  if (!value) {
    return defaultColor;
  }
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/i);
  if (!match) {
    return defaultColor;
  }
  const [, r, g, b, a] = match;
  return {
    r: Number(r),
    g: Number(g),
    b: Number(b),
    a: typeof a !== 'undefined' ? clamp(Number(a)) : 1,
  };
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(
    normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized,
    16,
  );
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const componentToHex = (c: number) => c.toString(16).padStart(2, '0');
const rgbToHex = (r: number, g: number, b: number) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

const toRgbaString = (rgb: { r: number; g: number; b: number }, alpha: number) =>
  `rgba(${rgb.r},${rgb.g},${rgb.b},${clamp(alpha)})`;

interface SimplifiedEditorProps {
  currentStyle: Style;
  onChange: (newStyle: Style) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  selectedElement?: SelectedElement | null;
  onSelectElement?: (element: SelectedElement | null) => void;
  scheduleDate?: string;
  onScheduleDateChange?: (date: string) => void;
  onScheduleLoad?: (date: string) => void;
  isScheduleLoading?: boolean;
  scheduleLoadError?: string | null;
  scheduleLoadSuccess?: string | null;
  canLoadSchedule?: boolean;
  scheduleLoadHint?: string | null;
  renderSlug?: string | null;
}

const SimplifiedEditor: React.FC<SimplifiedEditorProps> = ({
  currentStyle,
  onChange,
  onSave,
  onReset,
  isCollapsed = false,
  onToggleCollapse,
  selectedElement = null,
  onSelectElement,
  scheduleDate,
  onScheduleDateChange,
  onScheduleLoad,
  isScheduleLoading = false,
  scheduleLoadError = null,
  scheduleLoadSuccess = null,
  canLoadSchedule = true,
  scheduleLoadHint = null,
  renderSlug = null,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('colors');
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const headingInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const [localScheduleDate, setLocalScheduleDate] = useState(scheduleDate ?? '');
  const overlayColor = useMemo(() => parseOverlayColor(currentStyle.overlayColor), [currentStyle.overlayColor]);

  useEffect(() => {
    if (!selectedElement) {
      return;
    }
    setActiveTab('text');
    if (selectedElement.type === 'heading') {
      headingInputRef.current?.focus();
    } else if (selectedElement.type === 'subtitle') {
      subtitleInputRef.current?.focus();
    } else if (selectedElement.type === 'footer') {
      footerInputRef.current?.focus();
    }
  }, [selectedElement]);

  useEffect(() => {
    setLocalScheduleDate(scheduleDate ?? '');
  }, [scheduleDate]);

  const handleChange = (updates: Partial<Style>) => {
    onChange({ ...currentStyle, ...updates });
  };
  const selectElement = (type: SelectedElement['type']) => {
    onSelectElement?.({ type });
  };
  const clearSelection = () => onSelectElement?.(null);
  const isElementSelected = (type: SelectedElement['type']) => selectedElement?.type === type;
  const handleVisibilityToggle = (
    field: 'showHeading' | 'showSubtitle' | 'showSchedule' | 'showFooter',
    type?: SelectedElement['type'],
  ) => {
    const enabled = currentStyle[field] !== false;
    handleChange({ [field]: enabled ? false : true } as Partial<Style>);
    if (enabled && type && isElementSelected(type)) {
      clearSelection();
    } else if (!enabled && type) {
      selectElement(type);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo file is too large. Please upload an image under 5MB.');
        return;
      }
      setIsUploadingLogo(true);
      try {
        const downloadURL = await uploadImage(file);
        handleChange({ logoUrl: downloadURL });
      } catch (error) {
        console.error(error);
        alert('Failed to upload logo. Please try again.');
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleSave = async () => {
    await onSave();
    setToastMessage('Saved successfully!');
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleResetClick = () => {
    onReset();
    clearSelection();
  };

  const handleBackgroundApply = (newBgStyle: Partial<Style>) => {
    handleChange(newBgStyle);
    setIsBackgroundModalOpen(false);
  };

  // Logo position grid positions
  const logoPositions: { value: LogoPosition; label: string }[] = [
    { value: 'top-left', label: 'TL' },
    { value: 'top-center', label: 'TC' },
    { value: 'top-right', label: 'TR' },
    { value: 'center', label: 'C' },
    { value: 'bottom-left', label: 'BL' },
    { value: 'bottom-center', label: 'BC' },
    { value: 'bottom-right', label: 'BR' },
  ];

  if (isCollapsed) {
    return (
      <div className="h-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <button
          onClick={onToggleCollapse}
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          Show Editor ▲
        </button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'colors':
        return (
          <div className="space-y-6">
            {/* Quick Palettes */}
            <div>
              <label className="block text-sm font-semibold mb-3">Quick Palettes</label>
              <div className="grid grid-cols-2 gap-3">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.name}
                    type="button"
                    onClick={() => handleChange(palette.colors)}
                    className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
                  >
                    <p className="text-xs font-semibold mb-2 text-left">{palette.name}</p>
                    <div className="flex gap-1">
                      {Object.values(palette.colors).slice(0, 4).map((color, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Colors */}
            <div>
              <label className="block text-sm font-semibold mb-3">Custom Colors</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Background</span>
                  <input
                    type="color"
                    value={currentStyle.backgroundColor}
                    onChange={(e) => handleChange({ backgroundColor: e.target.value })}
                    className="w-12 h-12 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Text Color</span>
                  <input
                    type="color"
                    value={currentStyle.textColorPrimary}
                    onChange={(e) => handleChange({ textColorPrimary: e.target.value })}
                    className="w-12 h-12 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Accent Color</span>
                  <input
                    type="color"
                    value={currentStyle.accent}
                    onChange={(e) => handleChange({ accent: e.target.value })}
                    className="w-12 h-12 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'text': {
        const sectionToggles: Array<{
          field: 'showHeading' | 'showSubtitle' | 'showSchedule' | 'showFooter';
          label: string;
          type: SelectedElement['type'];
        }> = [
          { field: 'showHeading', label: 'Heading', type: 'heading' },
          { field: 'showSubtitle', label: 'Subtitle', type: 'subtitle' },
          { field: 'showSchedule', label: 'Schedule', type: 'schedule' },
          { field: 'showFooter', label: 'Footer', type: 'footer' },
        ];
        const headingEnabled = currentStyle.showHeading !== false;
        const subtitleEnabled = currentStyle.showSubtitle !== false;
        const scheduleEnabled = currentStyle.showSchedule !== false;
        const footerEnabled = currentStyle.showFooter !== false;
        const baseInputClasses =
          'block w-full min-w-0 max-w-full px-4 py-3 rounded-lg border-2 text-sm transition focus:outline-none bg-white text-slate-900 placeholder-slate-400 dark:bg-gray-800 dark:text-slate-100 dark:placeholder-slate-500';
        const scheduleButtonDisabled =
          isScheduleLoading || !localScheduleDate || !canLoadSchedule;

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3">Sections</label>
              <div className="grid grid-cols-2 gap-2">
                {sectionToggles.map(({ field, label, type }) => {
                  const enabled = currentStyle[field] !== false;
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => handleVisibilityToggle(field, type)}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                        enabled
                          ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200'
                          : 'border-gray-700 bg-gray-800 text-gray-400'
                      }`}
                    >
                      {enabled ? 'Hide' : 'Show'} {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold mb-3">Content</label>
              <div className="space-y-3">
                <input
                  ref={headingInputRef}
                  type="text"
                  placeholder="Heading"
                  value={currentStyle.heading}
                  disabled={!headingEnabled}
                  onFocus={() => selectElement('heading')}
                  onChange={(e) => handleChange({ heading: e.target.value })}
                  className={`${baseInputClasses} ${
                    headingEnabled
                      ? 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'
                      : 'border-gray-800 bg-gray-900 text-slate-500 placeholder-slate-500 dark:text-slate-500 dark:placeholder-slate-600 opacity-60 cursor-not-allowed'
                  } ${isElementSelected('heading') ? 'ring-2 ring-indigo-400/60 border-indigo-400' : ''}`}
                />
                <input
                  ref={subtitleInputRef}
                  type="text"
                  placeholder="Subtitle (optional)"
                  value={currentStyle.subtitle}
                  disabled={!subtitleEnabled}
                  onFocus={() => selectElement('subtitle')}
                  onChange={(e) => handleChange({ subtitle: e.target.value })}
                  className={`${baseInputClasses} ${
                    subtitleEnabled
                      ? 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'
                      : 'border-gray-800 bg-gray-900 text-slate-500 placeholder-slate-500 dark:text-slate-500 dark:placeholder-slate-600 opacity-60 cursor-not-allowed'
                  } ${isElementSelected('subtitle') ? 'ring-2 ring-indigo-400/60 border-indigo-400' : ''}`}
                />
                <input
                  ref={footerInputRef}
                  type="text"
                  placeholder="Footer"
                  value={currentStyle.footer}
                  disabled={!footerEnabled}
                  onFocus={() => selectElement('footer')}
                  onChange={(e) => handleChange({ footer: e.target.value })}
                  className={`${baseInputClasses} ${
                    footerEnabled
                      ? 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'
                      : 'border-gray-800 bg-gray-900 text-slate-500 placeholder-slate-500 dark:text-slate-500 dark:placeholder-slate-600 opacity-60 cursor-not-allowed'
                  } ${isElementSelected('footer') ? 'ring-2 ring-indigo-400/60 border-indigo-400' : ''}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Schedule Date</label>
              <div className="space-y-3">
                <input
                  type="date"
                  value={localScheduleDate}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setLocalScheduleDate(nextDate);
                    onScheduleDateChange?.(nextDate);
                  }}
                  className={`${baseInputClasses} appearance-none border-gray-200 dark:border-gray-700 focus:border-indigo-500`}
                  disabled={isScheduleLoading}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!localScheduleDate) {
                        return;
                      }
                      onScheduleLoad?.(localScheduleDate);
                    }}
                    disabled={scheduleButtonDisabled}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      scheduleButtonDisabled
                        ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isScheduleLoading ? 'Loading…' : 'Load Schedule'}
                  </button>
                  {scheduleLoadHint && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">{scheduleLoadHint}</p>
                  )}
                </div>
                {scheduleLoadError && (
                  <p className="text-xs font-medium text-rose-400">{scheduleLoadError}</p>
                )}
                {scheduleLoadSuccess && !scheduleLoadError && (
                  <p className="text-xs font-medium text-emerald-400">{scheduleLoadSuccess}</p>
                )}
              </div>
            </div>

            {isElementSelected('schedule') && (
              <div className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-xs text-indigo-100">
                Adjust the font controls below to update every schedule row at once.
              </div>
            )}

            {/* Font */}
            <div>
              <label className="block text-sm font-semibold mb-3">Font Family</label>
              <div className="grid grid-cols-2 gap-2">
                {fontOptions.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => handleChange({ fontFamily: font.value })}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                      currentStyle.fontFamily === font.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                Font Size: {currentStyle.bodySize}px
              </label>
              <input
                type="range"
                min="24"
                max="48"
                value={currentStyle.bodySize}
                disabled={!scheduleEnabled}
                onMouseDown={() => selectElement('schedule')}
                onTouchStart={() => selectElement('schedule')}
                onChange={(e) => handleChange({ bodySize: parseInt(e.target.value) })}
                className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                  scheduleEnabled ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-900 cursor-not-allowed opacity-60'
                } ${isElementSelected('schedule') ? 'ring-2 ring-indigo-400/60' : ''}`}
              />
            </div>
          </div>
        );
      }

      case 'background':
        return (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setIsBackgroundModalOpen(true)}
              className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {currentStyle.bgImage ? 'Change Background Image' : 'Add Background Image'}
            </button>

            {currentStyle.bgImage && (
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  <img
                    src={currentStyle.bgImage}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleChange({ bgImage: '' })}
                  className="w-full py-2 px-4 border-2 border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Remove Background
                </button>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-semibold">Image Fit</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange({ bgFit: 'contain' })}
                  className={`py-2 rounded-lg font-semibold border ${
                    currentStyle.bgFit === 'contain'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => handleChange({ bgFit: 'cover' })}
                  className={`py-2 rounded-lg font-semibold border ${
                    currentStyle.bgFit !== 'contain'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Fill
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Background Blur: {currentStyle.bgBlur || 0}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={currentStyle.bgBlur || 0}
                onChange={(event) => handleChange({ bgBlur: parseInt(event.target.value, 10) })}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold">Overlay Color</label>
              <input
                type="color"
                value={rgbToHex(overlayColor.r, overlayColor.g, overlayColor.b)}
                onChange={(event) => {
                  const rgb = hexToRgb(event.target.value);
                  handleChange({ overlayColor: toRgbaString(rgb, overlayColor.a) });
                }}
                className="w-16 h-10 rounded border border-white/10 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Overlay Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(overlayColor.a * 100)}
                onChange={(event) => {
                  const opacity = Number(event.target.value) / 100;
                  handleChange({ overlayColor: toRgbaString(overlayColor, opacity) });
                }}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'logo':
        return (
          <div className="space-y-6">
            {/* Upload Logo */}
            <div>
              <label className="block text-sm font-semibold mb-3">Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploadingLogo}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 cursor-pointer"
              />
              {isUploadingLogo && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
            </div>

            {currentStyle.logoUrl && (
              <>
                {/* Logo Preview */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Preview</label>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-center">
                    <img
                      src={currentStyle.logoUrl}
                      alt="Logo"
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                </div>

                {/* Position Grid */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Position</label>
                  <div className="grid grid-cols-3 gap-3">
                    {logoPositions.map((pos) => (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() => handleChange({ logoPosition: pos.value })}
                        className={`aspect-square rounded-lg border-2 font-bold text-lg transition-colors ${
                          currentStyle.logoPosition === pos.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    TL=Top Left, TC=Top Center, TR=Top Right, C=Center, BL=Bottom Left, BC=Bottom Center, BR=Bottom Right
                  </p>
                </div>

                {/* Logo Size */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Size: {currentStyle.logoSize}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={currentStyle.logoSize}
                    onChange={(e) => handleChange({ logoSize: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Remove Logo */}
                <button
                  type="button"
                  onClick={() => handleChange({ logoUrl: '' })}
                  className="w-full py-2 px-4 border-2 border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Remove Logo
                </button>
              </>
            )}
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            {/* Corner Radius */}
            <div>
              <label className="block text-sm font-semibold mb-3">Corner Radius</label>
              <div className="grid grid-cols-5 gap-2">
                {(['none', 'sm', 'md', 'lg', '2xl'] as const).map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => handleChange({ cornerRadius: radius })}
                    className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                      currentStyle.cornerRadius === radius
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {radius}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Accent Lines</label>
                <button
                  type="button"
                  onClick={() => handleChange({ accentLines: !currentStyle.accentLines })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    currentStyle.accentLines ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      currentStyle.accentLines ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Footer Bar</label>
                <button
                  type="button"
                  onClick={() => handleChange({ footerBar: !currentStyle.footerBar })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    currentStyle.footerBar ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      currentStyle.footerBar ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Divider Style */}
            <div>
              <label className="block text-sm font-semibold mb-3">Divider Style</label>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'thin', 'thick', 'dotted'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleChange({ dividerStyle: style })}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                      currentStyle.dividerStyle === style
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const tabs: { key: EditorTab; label: string; icon: string }[] = [
    { key: 'colors', label: 'Colors', icon: '🎨' },
    { key: 'text', label: 'Text', icon: '✏️' },
    { key: 'background', label: 'Background', icon: '🖼️' },
    { key: 'logo', label: 'Logo', icon: '📍' },
    { key: 'advanced', label: 'Advanced', icon: '⚙️' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      {/* Header with Collapse Button */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Customize</h2>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="text-sm font-semibold text-slate-400 hover:text-white"
          >
            Hide ▼
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-2 py-2 border-b border-white/10 overflow-x-auto">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {renderTabContent()}
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleResetClick}
          className="flex-1 min-w-[150px] py-3 px-4 border border-white/20 font-semibold rounded-full text-slate-100 hover:border-white/60"
        >
          Reset
        </button>
        <Link
          to={renderSlug ? `/render/${renderSlug}` : '/render'}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!renderSlug}
          title={
            renderSlug
              ? 'Open the full render preview in a new tab'
              : 'Choose a gym in Gym Finder to enable the render preview'
          }
          className={`flex-1 min-w-[150px] py-3 px-4 font-semibold rounded-full text-center transition border border-white/10 ${
            renderSlug
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-slate-800/40 text-slate-400 pointer-events-none cursor-not-allowed'
          }`}
        >
          Preview Render
        </Link>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 min-w-[150px] py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-full shadow-lg hover:brightness-110 transition"
        >
          Save
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white py-2 px-4 rounded-full text-sm shadow-lg z-50">
          {toastMessage}
        </div>
      )}

      {/* Background Modal */}
      <BackgroundModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        currentStyle={currentStyle}
        onApply={handleBackgroundApply}
      />
    </div>
  );
};

export default SimplifiedEditor;
