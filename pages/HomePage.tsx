import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { AppSettings, TemplateId, Style, Schedule } from '../types';
import { getAppSettings, saveAppSettings, CONFIG_UPDATED_EVENT, getSchedule, SCHEDULE_UPDATED_EVENT } from '../services/api';
import SimplifiedEditor from '../components/SimplifiedEditor';
import StoryRenderer from '../components/StoryRenderer';
import TemplateGallery from '../components/TemplateGallery';
import { MOCK_SCHEDULE, DEFAULT_APP_SETTINGS } from '../constants';
import ExternalLinkIcon from '../components/icons/ExternalLinkIcon';
import SlidersIcon from '../components/icons/SlidersIcon';
import GridIcon from '../components/icons/GridIcon';
import EyeIcon from '../components/icons/EyeIcon';
import UndoIcon from '../components/icons/UndoIcon';
import RedoIcon from '../components/icons/RedoIcon';

type TabType = 'templates' | 'preview' | 'editor';

const HomePage: React.FC = () => {
  const [history, setHistory] = useState<(AppSettings | null)[]>([null]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [schedule, setSchedule] = useState<Schedule>(MOCK_SCHEDULE);
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [isEditorCollapsed, setEditorCollapsed] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.3);

  const settings = history[currentIndex];

  const setSettings = useCallback((newSettings: AppSettings, fromHistory = false) => {
    if (fromHistory) {
      // When navigating history, just update the pointer
      const newHistory = [...history];
      newHistory[currentIndex] = newSettings;
      setHistory(newHistory);
    } else {
      // When making a new change, clear the "redo" stack
      const newHistory = history.slice(0, currentIndex + 1);
      setHistory([...newHistory, newSettings]);
      setCurrentIndex(newHistory.length);
    }
  }, [history, currentIndex]);

  const fetchInitialData = useCallback(async () => {
    const initialSettings = await getAppSettings();
    setHistory([initialSettings]);
    setCurrentIndex(0);

    const sessionSchedule = getSchedule();
    if (sessionSchedule.items.length > 1 || sessionSchedule.date !== 'Preview Mode') {
        setSchedule(sessionSchedule);
    } else {
        setSchedule(MOCK_SCHEDULE);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();

    const handleConfigUpdate = async () => {
        const newSettings = await getAppSettings();
        setHistory([newSettings]);
        setCurrentIndex(0);
    }
    const handleScheduleUpdate = () => setSchedule(getSchedule());

    window.addEventListener(CONFIG_UPDATED_EVENT, handleConfigUpdate);
    window.addEventListener(SCHEDULE_UPDATED_EVENT, handleScheduleUpdate);
    
    return () => {
      window.removeEventListener(CONFIG_UPDATED_EVENT, handleConfigUpdate);
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, handleScheduleUpdate);
    };
  }, [fetchInitialData]);

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleRedo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);
  
  // Effect to calculate and update the preview scale on window resize
  useEffect(() => {
    const calculateScale = () => {
      // Tailwind's 'sm' breakpoint is 640px
      const isSmallScreen = window.innerWidth < 640;
      // Phone mockup dimensions: 320px (small), 360px (sm and up)
      // Padding is p-3 (12px on each side)
      const mockUpWidth = isSmallScreen ? 320 : 360;
      const padding = 24; // 12px left + 12px right
      const innerWidth = mockUpWidth - padding;
      const storyWidth = 1080; // Native width of the story
      setPreviewScale(innerWidth / storyWidth);
    };

    calculateScale(); // Initial calculation
    window.addEventListener('resize', calculateScale);

    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const setActiveTemplate = (templateId: TemplateId) => {
    if (!settings) return;
    // Simply change the active template ID. The style for this template
    // is already loaded in settings.configs. This fixes the bug where
    // non-default templates were unselectable.
    const newSettings = { ...settings, activeTemplateId: templateId };
    setSettings(newSettings);
  };
  
  const handleStyleChange = (newStyle: Style) => {
    if (!settings) return;
    const activeTemplateId = settings.activeTemplateId;
    const newConfigs = { ...settings.configs, [activeTemplateId]: newStyle };
    const newSettings = { ...settings, configs: newConfigs };
    setSettings(newSettings);
  };
  
  const handleContentChange = (update: Partial<Pick<Style, 'heading' | 'subtitle' | 'footer'>>) => {
      if (!settings) return;
      const activeStyle = settings.configs[settings.activeTemplateId];
      if (!activeStyle) return;
      handleStyleChange({ ...activeStyle, ...update });
  };

  const handleStyleSave = async () => {
    if (!settings) return;
    await saveAppSettings(settings);
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Loading Configuration...</p>
        </div>
      </div>
    );
  }

  const activeStyle = settings.configs[settings.activeTemplateId];
  const phonePreviewScale = Math.min(Math.max(previewScale, 0.18), 0.4);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return (
          <TemplateGallery
            settings={settings}
            schedule={schedule}
            onTemplateSelect={setActiveTemplate}
          />
        );

      case 'preview':
        return (
          <div className="h-full flex flex-col">
            {/* Split View: Preview (60%) + Editor (40%) */}
            <div className={`flex-1 flex ${isEditorCollapsed ? 'flex-col' : 'flex-col lg:flex-row'} overflow-hidden`}>
              {/* Preview Area */}
              <div className={`${isEditorCollapsed ? 'flex-1' : 'flex-1 lg:flex-[6]'} flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900`}>
                {/* Action Bar */}
                <div className="w-full max-w-lg flex justify-between items-center mb-4 px-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleUndo}
                      disabled={currentIndex <= 0}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Undo"
                    >
                      <UndoIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={currentIndex >= history.length - 1}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Redo"
                    >
                      <RedoIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {settings.activeTemplateId
                      .split('-')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </p>
                </div>

                {/* Story Preview - Larger on desktop */}
                <div className="w-full max-w-sm lg:max-w-md aspect-[9/16] bg-slate-900/70 rounded-3xl p-3 shadow-[0_20px_60px_rgba(2,6,23,0.8)] border border-white/5">
                  <div className="w-full h-full overflow-hidden rounded-2xl bg-slate-950 relative">
                    {activeStyle && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          style={{
                            width: '1080px',
                            height: '1920px',
                            transform: `scale(${phonePreviewScale})`,
                            transformOrigin: 'center center',
                          }}
                        >
                          <StoryRenderer
                            templateId={settings.activeTemplateId}
                            style={activeStyle}
                            schedule={schedule}
                            onContentChange={handleContentChange}
                            isFullSize={false}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Editor Panel */}
              {!isEditorCollapsed && activeStyle && (
                <div className="flex-1 lg:flex-[4] border-t lg:border-t-0 lg:border-l border-white/5 bg-slate-950/40">
                  <SimplifiedEditor
                    currentStyle={activeStyle}
                    onChange={handleStyleChange}
                    onSave={handleStyleSave}
                    onReset={() => {
                      const presetStyle = DEFAULT_APP_SETTINGS.configs[settings.activeTemplateId];
                      if (presetStyle) handleStyleChange(presetStyle);
                    }}
                    isCollapsed={isEditorCollapsed}
                    onToggleCollapse={() => setEditorCollapsed(!isEditorCollapsed)}
                  />
                </div>
              )}
            </div>

            {/* Show Editor Button (when collapsed) */}
            {isEditorCollapsed && (
              <div className="flex-shrink-0 bg-slate-900/80 border-t border-white/5 py-3 flex justify-center">
                <button
                  onClick={() => setEditorCollapsed(false)}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:brightness-110 transition"
                >
                  Show Editor ▲
                </button>
              </div>
            )}
          </div>
        );

      case 'editor':
        return (
          <div className="h-full overflow-hidden">
            {activeStyle && (
              <SimplifiedEditor
                currentStyle={activeStyle}
                onChange={handleStyleChange}
                onSave={handleStyleSave}
                onReset={() => {
                  const presetStyle = DEFAULT_APP_SETTINGS.configs[settings.activeTemplateId];
                  if (presetStyle) handleStyleChange(presetStyle);
                }}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 shadow-[0_10px_40px_rgba(15,23,42,0.6)] z-20">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-indigo-200/70">Studio OS</p>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Studiogram</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/gym-finder"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100/80 hover:border-white/40 hover:text-white transition"
            >
              <span className="hidden sm:inline">Gym Finder</span>
              <span className="sm:hidden">Gyms</span>
            </Link>
            <Link
              to="/render"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(99,102,241,0.4)] hover:brightness-110 transition"
              aria-label="View final render page"
            >
              <ExternalLinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Export</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-hidden pb-20 lg:pb-0 bg-slate-950">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed lg:relative bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(2,6,23,0.8)] z-30 safe-area-bottom">
        <div className="max-w-screen-2xl mx-auto px-3 py-2">
          <div className="flex justify-around items-center gap-2">
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-2xl text-[11px] font-semibold uppercase tracking-wide transition ${
                activeTab === 'templates'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <GridIcon className="w-5 h-5 mb-1" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-2xl text-[11px] font-semibold uppercase tracking-wide transition ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <EyeIcon className="w-5 h-5 mb-1" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-2xl text-[11px] font-semibold uppercase tracking-wide transition ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <SlidersIcon className="w-5 h-5 mb-1" />
              Editor
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default HomePage;
