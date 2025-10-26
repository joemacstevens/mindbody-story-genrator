import React, { useState } from 'react';
import type { Style, LogoPosition } from '../types';
import { COLOR_PALETTES } from '../constants';
import { uploadImage } from '../services/storage';
import BackgroundModal from './BackgroundModal';

interface SimplifiedEditorProps {
  currentStyle: Style;
  onChange: (newStyle: Style) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

type EditorTab = 'colors' | 'text' | 'background' | 'logo' | 'advanced';

const SimplifiedEditor: React.FC<SimplifiedEditorProps> = ({
  currentStyle,
  onChange,
  onSave,
  onReset,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('colors');
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleChange = (updates: Partial<Style>) => {
    onChange({ ...currentStyle, ...updates });
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

  const handleBackgroundApply = (newBgStyle: Partial<Style>) => {
    handleChange(newBgStyle);
    setIsBackgroundModalOpen(false);
  };

  // Logo position grid positions
  const logoPositions: { value: LogoPosition; label: string }[] = [
    { value: 'top-left', label: 'TL' },
    { value: 'top-center', label: 'TC' },
    { value: 'top-right', label: 'TR' },
    { value: 'bottom-left', label: 'BL' },
    { value: 'bottom-center', label: 'BC' },
    { value: 'bottom-right', label: 'BR' },
  ];

  const fontOptions = [
    { name: 'Inter', value: "Inter, system-ui, sans-serif" },
    { name: 'Lexend', value: "'Lexend', sans-serif" },
    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { name: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
    { name: 'Anton', value: "'Anton', sans-serif" },
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
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

      case 'text':
        return (
          <div className="space-y-6">
            {/* Content */}
            <div>
              <label className="block text-sm font-semibold mb-3">Content</label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Heading"
                  value={currentStyle.heading}
                  onChange={(e) => handleChange({ heading: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-indigo-500 focus:outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Subtitle (optional)"
                  value={currentStyle.subtitle}
                  onChange={(e) => handleChange({ subtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-indigo-500 focus:outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Footer"
                  value={currentStyle.footer}
                  onChange={(e) => handleChange({ footer: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-indigo-500 focus:outline-none text-sm"
                />
              </div>
            </div>

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
                onChange={(e) => handleChange({ bodySize: parseInt(e.target.value) })}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>
        );

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
                    TL=Top Left, TC=Top Center, TR=Top Right, BL=Bottom Left, BC=Bottom Center, BR=Bottom Right
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
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 flex gap-3">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-3 px-4 border border-white/20 font-semibold rounded-full text-slate-100 hover:border-white/60"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-full shadow-lg hover:brightness-110 transition"
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
