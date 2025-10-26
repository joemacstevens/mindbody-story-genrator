import React, { useState, useRef, useEffect } from 'react';
import type { AppSettings, TemplateId, Schedule } from '../types';
import { TEMPLATE_CATEGORIES } from '../constants';
import TemplateCard from './TemplateCard';
import UploadIcon from './icons/UploadIcon';

interface TemplateGalleryProps {
  settings: AppSettings;
  schedule: Schedule;
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
  const [menuTemplateId, setMenuTemplateId] = useState<TemplateId | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuTemplateId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (id: TemplateId, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setMenuPosition({ x: rect.right, y: rect.top });
    setMenuTemplateId(id);
    onTemplateMenu?.(id, event);
  };

  // Get all templates
  const allTemplates = Object.entries(settings.configs).map(([id, style]) => ({
    id: id as TemplateId,
    name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    style,
    isUserTemplate: false, // TODO: Implement user template detection
  }));

  // Filter templates by category
  const filteredTemplates =
    activeCategory === 'all'
      ? allTemplates
      : allTemplates.filter((t) =>
          TEMPLATE_CATEGORIES[activeCategory as keyof typeof TEMPLATE_CATEGORIES]?.templates.includes(t.id)
        );

  const categories = [
    { key: 'all' as const, name: 'All', icon: '🎨' },
    ...Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => ({
      key: key as keyof typeof TEMPLATE_CATEGORIES,
      name: cat.name,
      icon: cat.icon,
    })),
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100">
      {/* Category Filter */}
      <div className="flex-shrink-0 bg-slate-900/70 border-b border-white/5 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeCategory === cat.key
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category Description */}
      {activeCategory !== 'all' && (
        <div className="flex-shrink-0 bg-indigo-500/10 px-4 py-3 border-b border-indigo-500/30">
          <p className="text-sm text-indigo-100">
            {TEMPLATE_CATEGORIES[activeCategory as keyof typeof TEMPLATE_CATEGORIES]?.description}
          </p>
        </div>
      )}

      {/* Template Grid */}
      <div className="flex-grow overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
          {/* Create New Template Card */}
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="aspect-[9/16] rounded-3xl border-2 border-dashed border-white/20 hover:border-white/50 bg-slate-900/70 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-xl group"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <UploadIcon className="w-6 h-6 text-indigo-200" />
              </div>
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white">
                Create New
              </span>
            </button>
          )}

          {/* Template Cards */}
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              name={template.name}
              style={template.style}
              schedule={schedule}
              isActive={settings.activeTemplateId === template.id}
              onSelect={onTemplateSelect}
              onMenuClick={handleMenuClick}
              isUserTemplate={template.isUserTemplate}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500">
            <p className="text-lg">No templates in this category</p>
            <p className="text-sm mt-2">
              Try selecting a different category
            </p>
          </div>
        )}
      </div>

      {/* Context Menu (if needed) */}
      {menuTemplateId && (
        <div
          ref={menuRef}
          className="fixed bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 py-1"
          style={{
            top: menuPosition.y,
            left: menuPosition.x,
            transform: 'translate(-100%, 0)',
          }}
        >
          <button className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
            Duplicate
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
            Rename
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-white/5">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
