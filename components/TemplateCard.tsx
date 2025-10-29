import React from 'react';
import type { Style, TemplateId, Schedule } from '../types';
import StoryRenderer from './StoryRenderer';
import MoreVertIcon from './icons/MoreVertIcon';
import CheckIcon from './icons/CheckIcon';
import { cn } from '../utils/cn';

interface TemplateCardProps {
  id: TemplateId;
  name: string;
  style: Style;
  schedule: Schedule;
  isActive: boolean;
  onSelect: (id: TemplateId) => void;
  onMenuClick?: (id: TemplateId, event: React.MouseEvent) => void;
  isUserTemplate?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  id,
  name,
  style,
  schedule,
  isActive,
  onSelect,
  onMenuClick,
  isUserTemplate = false,
}) => {
  const handleClick = () => {
    onSelect(id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuClick?.(id, e);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative group cursor-pointer rounded-3xl bg-slate-900/70 transition-all duration-200 ease-out transform-gpu',
        'active:translate-y-0',
        isActive
          ? 'ring-4 ring-white shadow-[0_15px_35px_rgba(15,23,42,0.8)] scale-[1.02]'
          : 'ring-2 ring-white/10 hover:-translate-y-1 hover:ring-white/40 hover:shadow-[0_18px_45px_rgba(15,23,42,0.55)]',
      )}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 z-20 bg-indigo-500 text-white rounded-full p-1.5 shadow-lg">
          <CheckIcon className="w-4 h-4" />
        </div>
      )}

      {/* Menu Button */}
      {onMenuClick && (
        <button
          onClick={handleMenuClick}
          className="absolute top-2 right-2 z-20 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Template options"
        >
          <MoreVertIcon className="w-4 h-4" />
        </button>
      )}

      {/* User Template Badge */}
      {isUserTemplate && (
        <div className="absolute top-2 left-2 z-20 bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
          Custom
        </div>
      )}

      {/* Template Preview */}
      <div className="relative aspect-[9/16] rounded-t-3xl overflow-hidden bg-slate-950">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              width: '1080px',
              height: '1920px',
              transform: 'scale(0.1)',
              transformOrigin: 'center center',
            }}
          >
            <StoryRenderer
              templateId={id}
              style={style}
              schedule={schedule}
              isFullSize={false}
            />
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4 rounded-b-3xl bg-slate-950/70 border-t border-white/5">
        <h3 className="font-semibold text-center text-sm truncate text-slate-100">{name}</h3>
      </div>
    </div>
  );
};

export default TemplateCard;
