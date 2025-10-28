import React, { useCallback, useState } from 'react';
import { ToggleSwitch } from '../ui';
import { cn } from '../../utils/cn';
import type { ScheduleElementId, ScheduleElementMeta } from '../../types';

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
}

const Section: React.FC<{ title: string; badge?: string; children: React.ReactNode }> = ({
  title,
  badge,
  children,
}) => (
  <section className="space-y-4 rounded-2xl border border-border-light/70 bg-surface/70 p-5 shadow-sm backdrop-blur">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {badge ? (
        <span className="inline-flex items-center rounded-full border border-border-light/60 bg-surface/80 px-3 py-1 text-xs font-medium text-text-tertiary">
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
}) => {
  const iconButtonClass = cn(
    'flex h-9 w-9 items-center justify-center rounded-xl border border-border-light/60 bg-surface/60 text-sm text-text-tertiary transition-all duration-200',
    'hover:border-primary hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  );

  return (
    <div
      role="listitem"
      data-element-id={id}
      className={cn(
        'group relative flex items-center justify-between gap-4 rounded-2xl border border-border-light/60 bg-surface/80 px-4 py-3 transition-all duration-200',
        visible ? 'text-text-primary' : 'text-text-tertiary opacity-75',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDragging && 'border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(139,123,216,0.18)]',
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-1 items-center gap-3">
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border-light/60 bg-surface/60 text-xs text-text-tertiary transition-colors',
            draggable ? 'cursor-grab active:cursor-grabbing group-hover:text-text-secondary' : 'cursor-default opacity-60',
          )}
          aria-hidden="true"
        >
          ☰
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {meta.icon ? (
              <span className="text-sm text-text-tertiary" aria-hidden="true">
                {meta.icon}
              </span>
            ) : null}
            <span className="text-sm font-semibold text-text-primary">{meta.label}</span>
          </div>
          {meta.description ? (
            <p className="text-xs text-text-tertiary">{meta.description}</p>
          ) : null}
        </div>
      </div>
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
          className="ml-1 h-7 w-[52px]"
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
    <div className="space-y-6">
      <Section title="Schedule Elements" badge="💡 Drag to reorder">
        <div
          role="list"
          className="space-y-3"
          onDragOver={handleDragOver}
          onDrop={handleDropOnList}
        >
          {visibleElements.map((elementId) => {
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
              />
            );
          })}
        </div>

        <div className="space-y-3 rounded-2xl border border-border-light/50 bg-surface/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Hidden Elements
          </div>
          <div className="space-y-2" role="list">
            {hiddenElements.length === 0 ? (
              <p className="text-xs text-text-muted">No hidden elements</p>
            ) : (
              hiddenElements.map((elementId) => {
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
