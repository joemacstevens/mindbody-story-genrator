import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { AppSettings, TemplateId, Schedule } from '../types';
import { TEMPLATE_CATEGORIES, MOCK_SCHEDULE } from '../constants';
import UploadIcon from './icons/UploadIcon';
import { Button, Modal } from './ui';
import { SchedulePreview } from './editor/SchedulePreview';
import { DEFAULT_SMART_SPACING } from './editor/smartTextSizing';
import { DEFAULT_VISIBLE_ELEMENTS, buildInitialElementStyles } from './editor/contentElements';

interface TemplateGalleryProps {
  settings: AppSettings;
  schedule?: Schedule | null;
  onTemplateSelect: (id: TemplateId) => void;
  onTemplateMenu?: (id: TemplateId, event: React.MouseEvent) => void;
  onCreateNew?: () => void;
}

type CategoryKey = keyof typeof TEMPLATE_CATEGORIES | 'all';

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  settings,
  schedule,
  onTemplateSelect,
  onTemplateMenu,
  onCreateNew,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'all' | 'compact' | 'timeline' | 'colorful' | 'minimal' | 'bold'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const previewSchedule = schedule ?? MOCK_SCHEDULE;
  const usingMockData = !schedule;
  const elementStyles = useMemo(() => buildInitialElementStyles(), []);

  // Build template list
  const allTemplates = useMemo(() => (
    Object.entries(settings.configs).map(([id, style]) => ({
      id: id as TemplateId,
      name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      style,
      isUserTemplate: false,
    }))
  ), [settings.configs]);

  // Filter by category chips from constants as before
  const categoryFiltered = useMemo(() => (
    activeCategory === 'all'
      ? allTemplates
      : allTemplates.filter((t) =>
          TEMPLATE_CATEGORIES[activeCategory as keyof typeof TEMPLATE_CATEGORIES]?.templates.includes(t.id)
        )
  ), [activeCategory, allTemplates]);

  // Additional style chips like the HTML reference (best-effort name-based)
  const styleFiltered = useMemo(() => {
    if (selectedStyle === 'all') return categoryFiltered;
    const token = selectedStyle.toLowerCase();
    return categoryFiltered.filter(t =>
      t.name.toLowerCase().includes(token)
    );
  }, [categoryFiltered, selectedStyle]);

  // Search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return styleFiltered;
    const q = searchQuery.toLowerCase();
    return styleFiltered.filter(t =>
      t.name.toLowerCase().includes(q)
    );
  }, [styleFiltered, searchQuery]);

  const categories = [
    { key: 'all' as const, name: 'All', icon: '🎨' },
    ...Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => ({
      key: key as keyof typeof TEMPLATE_CATEGORIES,
      name: cat.name,
      icon: cat.icon,
    })),
  ];

  const openPreview = (id: TemplateId) => {
    setSelectedTemplateId(id);
    setIsPreviewOpen(true);
  };

  const handleLoad = () => {
    if (selectedTemplateId) {
      onTemplateSelect(selectedTemplateId);
      setIsPreviewOpen(false);
    }
  };

  const selectedTemplate = selectedTemplateId
    ? filteredTemplates.find(t => t.id === selectedTemplateId) || allTemplates.find(t => t.id === selectedTemplateId)
    : null;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Templates</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">Template Gallery</h1>
            <div className="mt-1 text-sm text-slate-300/80">Optimized for Instagram Story (1080×1920)</div>
          </div>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="inline-flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeCategory === cat.key ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{cat.icon}</span>{cat.name}
            </button>
          ))}
          {(['all','compact','timeline','colorful','minimal','bold'] as const).map(key => (
            <button
              key={`style-${key}`}
              onClick={() => setSelectedStyle(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                selectedStyle === key ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {key === 'all' ? 'All Styles' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {usingMockData && (
        <div className="flex-shrink-0 bg-white/5 border-y border-white/10 px-4 py-3 text-sm text-slate-300">
          Showing sample schedule data. Connect a gym to preview with your live schedule.
        </div>
      )}

      {/* Grid */}
      <div className="flex-grow overflow-y-auto p-4 pb-28">
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="aspect-[9/16] rounded-2xl border-2 border-dashed border-white/20 hover:border-white/50 bg-slate-900/70 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-xl group"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <UploadIcon className="w-6 h-6 text-indigo-200" />
              </div>
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Create New</span>
            </button>
          )}

          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => openPreview(template.id)}
              className={`rounded-xl border-2 transition cursor-pointer ${
                selectedTemplateId === template.id ? 'border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]' : 'border-transparent hover:border-white/20'
              }`}
            >
              <div className="template-preview relative aspect-[9/16] bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div style={{ width: '1080px', height: '1920px', transform: 'scale(0.12)', transformOrigin: 'center center', pointerEvents: 'none' }}>
                    <SchedulePreview
                      schedule={previewSchedule}
                      style={template.style}
                      visibleElements={DEFAULT_VISIBLE_ELEMENTS}
                      elementStyles={elementStyles}
                      spacingScales={DEFAULT_SMART_SPACING}
                    />
                  </div>
                </div>
              </div>
              <div className="template-info p-3">
                <div className="template-title text-sm font-semibold truncate">{template.name}</div>
                <div className="template-meta flex items-center justify-between text-xs text-slate-400">
                  <span className="template-style">📱 {template.style.layoutStyle ?? 'List'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-lg">No templates found</p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-white/10 px-4 py-3 flex gap-3">
        <Button variant="secondary" onClick={() => setIsPreviewOpen(false)} className="flex-1">Cancel</Button>
        <Button onClick={handleLoad} disabled={!selectedTemplateId} className="flex-1">Load Template</Button>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen && !!selectedTemplate} onClose={() => setIsPreviewOpen(false)} title={selectedTemplate?.name ?? 'Template Preview'}>
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-slate-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div style={{ width: '1080px', height: '1920px', transform: 'scale(0.25)', transformOrigin: 'center center', pointerEvents: 'none' }}>
                  <SchedulePreview
                    schedule={previewSchedule}
                    style={selectedTemplate.style}
                    visibleElements={DEFAULT_VISIBLE_ELEMENTS}
                    elementStyles={elementStyles}
                    spacingScales={DEFAULT_SMART_SPACING}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-slate-400">Style</div>
                <div className="font-semibold">{selectedTemplate.style.layoutStyle ?? 'List'}</div>
              </div>
              <div>
                <div className="text-slate-400">Max Classes</div>
                <div className="font-semibold">Up to 20</div>
              </div>
              <div>
                <div className="text-slate-400">Layout</div>
                <div className="font-semibold">{selectedTemplate.style.layoutStyle ?? 'List'}</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['IG Story optimized','Large readable text','Micro-interactions'].map((f) => (
                <span key={f} className="feature-tag inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{f}</span>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setIsPreviewOpen(false)} className="flex-1">Close</Button>
              <Button onClick={handleLoad} className="flex-1">Load Template</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemplateGallery;
