import React, { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import { ToggleSwitch } from '../ui';
import { cn } from '../../utils/cn';
import type { ScheduleElementId, ScheduleElementMeta } from '../../types';
import { useStaggerAnimation } from '../../hooks/useStaggerAnimation';

interface ContentTabProps {
  visibleElements: ScheduleElementId[];
  hiddenElements: ScheduleElementId[];
  elementsMeta: Record<ScheduleElementId, ScheduleElementMeta>;
  onReorder: (sourceId: ScheduleElementId, targetId: ScheduleElementId | null) => void;
  onToggleVisibility: (elementId: ScheduleElementId) => void;
  onOpenFontSettings: (elementId: ScheduleElementId) => void;
  onOpenColorPicker: (elementId: ScheduleElementId) => void;
}

interface ElementItemProps {
  id: ScheduleElementId;
  meta: ScheduleElementMeta;
  visible: boolean;
  draggable?: boolean;
  onToggle: (next: boolean) => void;
  onOpenFontSettings?: () => void;
  onOpenColorPicker?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  style?: CSSProperties;
}

const Section: React.FC<{ title: string; badge?: string; children: React.ReactNode }> = ({
  title,
  badge,
  children,
}) => (
  <section className="mb-7">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      {badge ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/15 rounded-xl text-xs text-purple-400 font-medium">
          {badge}
        </span>
      ) : null}
    </div>
    {children}
  </section>
);

const ElementItem: React.FC<ElementItemProps> = ({
  id,
  meta,
  visible,
  draggable = false,
  onToggle,
  onOpenFontSettings,
  onOpenColorPicker,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
  style,
}) => {
  const iconButtonClass = cn(
    'w-7 h-7 rounded-md bg-white/5 border-none text-slate-400 cursor-pointer flex items-center justify-center transition-all text-sm',
    'hover:bg-purple-500/20 hover:text-purple-400',
  );

  return (
    <div
      role="listitem"
      data-element-id={id}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-white/5 px-3.5 py-3.5 transition-all duration-200 cursor-move',
        visible ? 'border-white/10 text-slate-200' : 'border-white/10 text-slate-400 opacity-50',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDragging && 'border-purple-500 bg-purple-500/10',
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={style}
    >
      <div className="text-slate-500 text-lg cursor-grab">☰</div>
      <div className="flex-1 text-sm text-slate-200">{meta.label}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenFontSettings}
          className={cn(iconButtonClass, 'hidden sm:flex')}
        >
          Aa
        </button>
        <button type="button" onClick={onOpenColorPicker} className={cn(iconButtonClass, 'hidden sm:flex')}>
          🎨
        </button>
        <ToggleSwitch
          checked={visible}
          onChange={onToggle}
          className="ml-1 h-6 w-12"
          label={visible ? `Hide ${meta.label}` : `Show ${meta.label}`}
        />
      </div>
    </div>
  );
};

export const ContentTab: React.FC<ContentTabProps> = ({
  visibleElements,
  hiddenElements,
  elementsMeta,
  onReorder,
  onToggleVisibility,
  onOpenFontSettings,
  onOpenColorPicker,
}) => {
  const [draggingId, setDraggingId] = useState<ScheduleElementId | null>(null);
  const visibleAnimations = useStaggerAnimation(visibleElements.length, 70);
  const hiddenAnimations = useStaggerAnimation(hiddenElements.length, 70, visibleElements.length * 70);

  const handleDragStart = useCallback(
    (id: ScheduleElementId) => (event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
      setDraggingId(id);
    },
    [],
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropOnItem = useCallback(
    (targetId: ScheduleElementId) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const sourceId = draggingId ?? (event.dataTransfer.getData('text/plain') as ScheduleElementId);
      if (!sourceId || sourceId === targetId) return;
      onReorder(sourceId, targetId);
      setDraggingId(null);
    },
    [draggingId, onReorder],
  );

  const handleDropOnList = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const sourceId = draggingId ?? (event.dataTransfer.getData('text/plain') as ScheduleElementId);
      if (!sourceId) return;
      onReorder(sourceId, null);
      setDraggingId(null);
    },
    [draggingId, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  return (
    <div className="space-y-7">
      <Section title="Schedule Elements" badge="💡 Drag to reorder">
        <div
          role="list"
          className="space-y-2"
          onDragOver={handleDragOver}
          onDrop={handleDropOnList}
        >
          {visibleElements.map((elementId, index) => {
            const meta = elementsMeta[elementId];
            if (!meta) return null;
            return (
              <ElementItem
                key={elementId}
                id={elementId}
                meta={meta}
                visible
                draggable
                onToggle={(next) => onToggleVisibility(elementId)}
                onOpenFontSettings={() => onOpenFontSettings(elementId)}
                onOpenColorPicker={() => onOpenColorPicker(elementId)}
                onDragStart={handleDragStart(elementId)}
                onDragOver={handleDragOver}
                onDrop={handleDropOnItem(elementId)}
                onDragEnd={handleDragEnd}
                isDragging={draggingId === elementId}
                style={visibleAnimations[index]?.style}
              />
            );
          })}
        </div>

        <div className="mt-5 pt-5 border-t border-white/8">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">
            Hidden Elements
          </div>
          <div className="space-y-2" role="list">
            {hiddenElements.length === 0 ? (
              <p className="text-xs text-slate-500">No hidden elements</p>
            ) : (
              hiddenElements.map((elementId, index) => {
                const meta = elementsMeta[elementId];
                if (!meta) return null;
                return (
                  <ElementItem
                    key={elementId}
                    id={elementId}
                    meta={meta}
                    visible={false}
                    onToggle={(next) => onToggleVisibility(elementId)}
                    onOpenFontSettings={() => onOpenFontSettings(elementId)}
                    onOpenColorPicker={() => onOpenColorPicker(elementId)}
                    style={hiddenAnimations[index]?.style}
                  />
                );
              })
            )}
          </div>
        </div>
      </Section>
    </div>
  );
};

export default ContentTab;
