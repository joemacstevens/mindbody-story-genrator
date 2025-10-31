import React, { useEffect, useMemo } from 'react';
import type { Style, TemplateId, Schedule } from '../types';
import { SchedulePreview } from './editor/SchedulePreview';
import MoreVertIcon from './icons/MoreVertIcon';
import CheckIcon from './icons/CheckIcon';
import { cn } from '../utils/cn';
import { getTemplateDefinition } from '../lib/templates';
import { isTemplateRegistryPreviewEnabled } from '../lib/templates/featureFlags';
import { DEFAULT_APP_SETTINGS } from '../constants';

interface TemplateCardProps {
  id: TemplateId;
  name: string;
  style?: Style;
  schedule: Schedule;
  isActive: boolean;
  onSelect: (id: TemplateId) => void;
  onMenuClick?: (id: TemplateId, event: React.MouseEvent) => void;
  isUserTemplate?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  id,
  name,
  style: styleProp,
  schedule,
  isActive,
  onSelect,
  onMenuClick,
  isUserTemplate = false,
}) => {
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  const handleClick = () => {
    onSelect(id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuClick?.(id, e);
  };

  const registryDefinition = useMemo(() => {
    if (!isTemplateRegistryPreviewEnabled()) {
      return null;
    }
    return getTemplateDefinition(id ?? undefined);
  }, [id]);

  useEffect(() => {
    if (!isTemplateRegistryPreviewEnabled()) {
      return;
    }
    if (registryDefinition && registryDefinition.id !== id && !isTestEnv) {
      console.warn(
        `TemplateCard: template "${id}" is not registered. Falling back to "${registryDefinition.id}".`,
      );
    }
  }, [id, registryDefinition, isTestEnv]);

  const resolvedStyle = useMemo<Style>(() => {
    if (styleProp) {
      return styleProp;
    }

    if (registryDefinition) {
      try {
        return registryDefinition.defaults.createStyle();
      } catch (error) {
        if (!isTestEnv) {
          console.error('TemplateCard: failed to derive style from template definition.', error);
        }
      }
    }

    const fallback =
      DEFAULT_APP_SETTINGS.configs[id] ||
      DEFAULT_APP_SETTINGS.configs[DEFAULT_APP_SETTINGS.activeTemplateId] ||
      Object.values(DEFAULT_APP_SETTINGS.configs)[0];

    if (!fallback) {
      throw new Error(`TemplateCard: unable to resolve a fallback style for template "${id}".`);
    }

    return { ...fallback };
  }, [styleProp, registryDefinition, id, isTestEnv]);

  const previewTemplateId = registryDefinition?.id ?? id;

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
              pointerEvents: 'none',
            }}
          >
            <SchedulePreview
              templateId={previewTemplateId}
              schedule={schedule}
              style={resolvedStyle}
            />
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4 rounded-b-3xl bg-slate-950/70 border-t border-white/5">
        <h3 className="font-semibold text-center text-sm truncate text-slate-100">{name}</h3>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(id);
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500/90 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <span>Load Template</span>
          <span aria-hidden="true" className="text-base leading-none">→</span>
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;
