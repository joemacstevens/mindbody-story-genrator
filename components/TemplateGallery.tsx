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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Category Filter */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
        <div className="flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
          <p className="text-sm text-indigo-900 dark:text-indigo-200">
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
              className="aspect-[9/16] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                <UploadIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
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
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No templates in this category</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Try selecting a different category
            </p>
          </div>
        )}
      </div>

      {/* Context Menu (if needed) */}
      {menuTemplateId && (
        <div
          ref={menuRef}
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 py-1"
          style={{
            top: menuPosition.y,
            left: menuPosition.x,
            transform: 'translate(-100%, 0)',
          }}
        >
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            Duplicate
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            Rename
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
