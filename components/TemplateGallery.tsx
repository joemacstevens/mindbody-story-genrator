import React, { useState, useMemo } from 'react';
import type { AppSettings, TemplateId, Schedule, Style } from '../types';
import { MOCK_SCHEDULE } from '../constants';
import {
  TEMPLATE_GALLERY_CATEGORIES,
  TEMPLATE_MODULES,
  BUILT_IN_TEMPLATE_IDS,
  type TemplateGalleryCategoryId,
} from '../templates';
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

type CategoryKey = 'all' | TemplateGalleryCategoryId | 'custom';

type GalleryTemplate = {
  id: TemplateId;
  name: string;
  style: Style;
  categoryId: TemplateGalleryCategoryId | 'custom';
  styleTags: string[];
  tagline?: string;
  description?: string;
  features: string[];
  isUserTemplate: boolean;
};

const formatTemplateName = (id: TemplateId): string =>
  id
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatTokenLabel = (token: string): string =>
  token
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  settings,
  schedule,
  onTemplateSelect,
  onTemplateMenu: _onTemplateMenu,
  onCreateNew,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyleTag, setSelectedStyleTag] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const previewSchedule = schedule ?? MOCK_SCHEDULE;
  const usingMockData = !schedule;
  const elementStyles = useMemo(() => buildInitialElementStyles(), []);

  const moduleTemplates = useMemo<GalleryTemplate[]>(
    () =>
      TEMPLATE_MODULES.map((module) => ({
        id: module.id,
        name: module.metadata.name,
        style: { ...module.previewStyle },
        categoryId: module.gallery.categoryId,
        styleTags: [...module.gallery.styleTags],
        tagline: module.gallery.tagline,
        description: module.metadata.description,
        features: [...module.gallery.features],
        isUserTemplate: false,
      })),
    [],
  );

  const userTemplates = useMemo<GalleryTemplate[]>(() => {
    const entries: GalleryTemplate[] = [];
    Object.entries(settings.configs).forEach(([id, style]) => {
      if (BUILT_IN_TEMPLATE_IDS.has(id as TemplateId)) {
        return;
      }
      entries.push({
        id: id as TemplateId,
        name: formatTemplateName(id as TemplateId),
        style: { ...(style as Style) },
        categoryId: 'custom',
        styleTags: ['custom'],
        tagline: 'Saved from your editor customizations.',
        description: 'Your personalized layout synced from Studiogram.',
        features: ['Custom branding', 'Editor adjustments retained'],
        isUserTemplate: true,
      });
    });
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }, [settings.configs]);

  const allTemplates = useMemo(
    () => [...moduleTemplates, ...userTemplates],
    [moduleTemplates, userTemplates],
  );

  const hasCustomTemplates = userTemplates.length > 0;

  const categories = useMemo(
    () => {
      const base = TEMPLATE_GALLERY_CATEGORIES.map((category) => ({
        key: category.id as CategoryKey,
        name: category.name,
        icon: category.icon,
      }));
      const customCategory = hasCustomTemplates
        ? [{ key: 'custom' as CategoryKey, name: 'Custom', icon: '🛠️' }]
        : [];
      return [{ key: 'all' as CategoryKey, name: 'All', icon: '🎨' }, ...base, ...customCategory];
    },
    [hasCustomTemplates],
  );

  const styleTagOptions = useMemo(() => {
    const tags = new Set<string>();
    moduleTemplates.forEach((template) => template.styleTags.forEach((tag) => tags.add(tag)));
    if (hasCustomTemplates) {
      tags.add('custom');
    }
    return ['all', ...Array.from(tags)];
  }, [moduleTemplates, hasCustomTemplates]);

  const categoryFiltered = useMemo(() => {
    if (activeCategory === 'all') {
      return allTemplates;
    }
    return allTemplates.filter((template) => template.categoryId === activeCategory);
  }, [activeCategory, allTemplates]);

  const styleFiltered = useMemo(() => {
    if (selectedStyleTag === 'all') {
      return categoryFiltered;
    }
    return categoryFiltered.filter((template) => template.styleTags.includes(selectedStyleTag));
  }, [categoryFiltered, selectedStyleTag]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) {
      return styleFiltered;
    }
    const query = searchQuery.toLowerCase();
    return styleFiltered.filter((template) => {
      const haystacks = [template.name, template.tagline, template.description]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());
      return haystacks.some((value) => value.includes(query));
    });
  }, [styleFiltered, searchQuery]);

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
    ? allTemplates.find((template) => template.id === selectedTemplateId) ?? null
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
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
          {styleTagOptions.map((tag) => (
            <button
              key={`style-${tag}`}
              onClick={() => setSelectedStyleTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                selectedStyleTag === tag ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tag === 'all' ? 'All Styles' : formatTokenLabel(tag)}
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
                selectedTemplateId === template.id
                  ? 'border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]'
                  : 'border-transparent hover:border-white/20'
              }`}
            >
              <div className="template-preview relative aspect-[9/16] bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    style={{ width: '1080px', height: '1920px', transform: 'scale(0.12)', transformOrigin: 'center center', pointerEvents: 'none' }}
                  >
                    <SchedulePreview
                      schedule={previewSchedule}
                      style={template.style}
                      visibleElements={DEFAULT_VISIBLE_ELEMENTS}
                      elementStyles={elementStyles}
                      spacingScales={DEFAULT_SMART_SPACING}
                    />
                  </div>
                </div>
                {template.isUserTemplate && (
                  <div className="absolute top-3 left-3 rounded-full bg-indigo-500/90 px-3 py-1 text-xs font-semibold text-white shadow">
                    Custom
                  </div>
                )}
              </div>
              <div className="template-info p-3 space-y-1">
                <div className="template-title text-sm font-semibold truncate">{template.name}</div>
                {template.tagline && (
                  <div className="text-xs text-slate-400 line-clamp-2">{template.tagline}</div>
                )}
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
        <Button variant="secondary" onClick={() => setIsPreviewOpen(false)} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleLoad} disabled={!selectedTemplateId} className="flex-1">
          Load Template
        </Button>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen && !!selectedTemplate}
        onClose={() => setIsPreviewOpen(false)}
        title={selectedTemplate?.name ?? 'Template Preview'}
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-slate-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  style={{ width: '1080px', height: '1920px', transform: 'scale(0.25)', transformOrigin: 'center center', pointerEvents: 'none' }}
                >
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
            {selectedTemplate.tagline && (
              <p className="text-sm text-slate-200">{selectedTemplate.tagline}</p>
            )}
            {selectedTemplate.description && (
              <p className="text-sm text-slate-400">{selectedTemplate.description}</p>
            )}
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
                <div className="text-slate-400">Category</div>
                <div className="font-semibold">
                  {selectedTemplate.categoryId === 'custom'
                    ? 'Custom'
                    : TEMPLATE_GALLERY_CATEGORIES.find((cat) => cat.id === selectedTemplate.categoryId)?.name ?? 'Signature'}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedTemplate.features.map((feature) => (
                <span
                  key={feature}
                  className="feature-tag inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300"
                >
                  {feature}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Built-in templates load with your saved settings when available.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setIsPreviewOpen(false)} className="flex-1">
                Close
              </Button>
              <Button onClick={handleLoad} className="flex-1">
                Load Template
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemplateGallery;
