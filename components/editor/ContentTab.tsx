import React, { useCallback, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ToggleSwitch, Button } from '../ui';
import { cn } from '../../utils/cn';
import type { ScheduleElementId, ScheduleElementMeta } from '../../types';
import { useStaggerAnimation } from '../../hooks/useStaggerAnimation';
import { resolveContentTabControls, type TemplateContentTabControls } from '../../lib/templates/editorConfig';

interface ContentTabProps {
  visibleElements: ScheduleElementId[];
  hiddenElements: ScheduleElementId[];
  elementsMeta: Record<ScheduleElementId, ScheduleElementMeta>;
  onReorder: (sourceId: ScheduleElementId, targetId: ScheduleElementId | null) => void;
  onToggleVisibility: (elementId: ScheduleElementId) => void;
  onOpenFontSettings: (elementId: ScheduleElementId) => void;
  onOpenColorPicker: (elementId: ScheduleElementId) => void;
  staticVisibility: Partial<Record<ScheduleElementId, boolean>>;
  onToggleStaticElement: (elementId: ScheduleElementId, next: boolean) => void;
  onApplySmartSizing: () => void;
  isSmartSizing: boolean;
  config?: TemplateContentTabControls | null;
}

interface ElementItemProps {
  id: ScheduleElementId;
  meta: ScheduleElementMeta;
  visible: boolean;
  draggable?: boolean;
  onToggle?: (next: boolean) => void;
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
  const isToggleable = typeof onToggle === 'function';
  const iconButtonClass = cn(
    'w-7 h-7 rounded-md bg-white/5 border-none text-slate-400 cursor-pointer flex items-center justify-center transition-all text-sm',
    'hover:bg-purple-500/20 hover:text-purple-400',
  );

  return (
    <div
      role="listitem"
      data-element-id={id}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-white/5 px-3.5 py-3.5 transition-all duration-200',
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
      {draggable ? (
        <div className="text-slate-500 text-lg cursor-grab">☰</div>
      ) : (
        <div className="w-4" aria-hidden="true" />
      )}
      <div className="flex-1 text-sm text-slate-200">{meta.label}</div>
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={onOpenFontSettings}
          className={iconButtonClass}
          aria-label={`Adjust font for ${meta.label}`}
        >
          Aa
        </button>
        <button
          type="button"
          onClick={onOpenColorPicker}
          className={iconButtonClass}
          aria-label={`Adjust color for ${meta.label}`}
        >
          🎨
        </button>
        {isToggleable ? (
          <ToggleSwitch
            checked={visible}
            onChange={(next) => onToggle?.(next)}
            className="ml-1 h-6 w-12"
            label={visible ? `Hide ${meta.label}` : `Show ${meta.label}`}
          />
        ) : null}
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
  staticVisibility,
  onToggleStaticElement,
  onApplySmartSizing,
  isSmartSizing,
  config,
}) => {
  const resolvedControls = useMemo(() => resolveContentTabControls(config), [config]);
  const meta = useMemo(
    () => ({ ...resolvedControls.elementsMeta, ...elementsMeta }),
    [elementsMeta, resolvedControls.elementsMeta],
  );
  const allowedScheduleIds = useMemo(() => new Set(resolvedControls.scheduleElementIds), [resolvedControls]);
  const filteredVisible = useMemo(
    () => visibleElements.filter((elementId) => allowedScheduleIds.has(elementId) && meta[elementId]),
    [allowedScheduleIds, meta, visibleElements],
  );
  const filteredHidden = useMemo(
    () => hiddenElements.filter((elementId) => allowedScheduleIds.has(elementId) && meta[elementId]),
    [allowedScheduleIds, meta, hiddenElements],
  );
  const heroElementIds = useMemo(
    () => resolvedControls.heroElementIds.filter((elementId) => Boolean(meta[elementId])),
    [meta, resolvedControls.heroElementIds],
  );
  const footerElementIds = useMemo(
    () => resolvedControls.footerElementIds.filter((elementId) => Boolean(meta[elementId])),
    [meta, resolvedControls.footerElementIds],
  );

  const [draggingId, setDraggingId] = useState<ScheduleElementId | null>(null);
  const visibleAnimations = useStaggerAnimation(filteredVisible.length, 70);
  const hiddenAnimations = useStaggerAnimation(filteredHidden.length, 70, filteredVisible.length * 70);
  const heroAnimations = useStaggerAnimation(heroElementIds.length, 70, (filteredVisible.length + filteredHidden.length) * 70);
  const footerAnimations = useStaggerAnimation(
    footerElementIds.length,
    70,
    (filteredVisible.length + filteredHidden.length + heroElementIds.length) * 70,
  );

  const allowReorder = resolvedControls.allowReorder;
  const allowVisibilityToggles = resolvedControls.allowVisibilityToggles;
  const allowStaticVisibility = resolvedControls.allowStaticVisibilityToggles;

  const handleDragStart = useCallback(
    (id: ScheduleElementId) => (event: React.DragEvent<HTMLDivElement>) => {
      if (!allowReorder) return;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
      setDraggingId(id);
    },
    [allowReorder],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!allowReorder) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    [allowReorder],
  );

  const handleDropOnItem = useCallback(
    (targetId: ScheduleElementId) => (event: React.DragEvent<HTMLDivElement>) => {
      if (!allowReorder) return;
      event.preventDefault();
      const sourceId = draggingId ?? (event.dataTransfer.getData('text/plain') as ScheduleElementId);
      if (!sourceId || sourceId === targetId) return;
      onReorder(sourceId, targetId);
      setDraggingId(null);
    },
    [allowReorder, draggingId, onReorder],
  );

  const handleDropOnList = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!allowReorder) return;
      event.preventDefault();
      const sourceId = draggingId ?? (event.dataTransfer.getData('text/plain') as ScheduleElementId);
      if (!sourceId) return;
      onReorder(sourceId, null);
      setDraggingId(null);
    },
    [allowReorder, draggingId, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  return (
    <div className="space-y-7">
      {resolvedControls.showSmartTextSizing ? (
        <Section title="Smart Text Sizing" badge="Auto fit">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400 sm:max-w-xs">
              Automatically balances headings and class details so everything fits the frame. Great when you just want it to look right.
            </p>
            <Button
              size="sm"
              onClick={onApplySmartSizing}
              className="w-full sm:w-auto"
              disabled={isSmartSizing}
              aria-busy={isSmartSizing}
            >
              {isSmartSizing ? 'Balancing…' : 'Smart Fit Text'}
            </Button>
          </div>
        </Section>
      ) : null}

      <Section title="Schedule Elements" badge={allowReorder ? '💡 Drag to reorder' : undefined}>
        <div role="list" className="space-y-2" onDragOver={handleDragOver} onDrop={handleDropOnList}>
          {filteredVisible.map((elementId, index) => {
            const metaEntry = meta[elementId];
            if (!metaEntry) return null;
            const draggable = allowReorder;
            return (
              <ElementItem
                key={elementId}
                id={elementId}
                meta={metaEntry}
                visible
                draggable={draggable}
                onToggle={allowVisibilityToggles ? () => onToggleVisibility(elementId) : undefined}
                onOpenFontSettings={() => onOpenFontSettings(elementId)}
                onOpenColorPicker={() => onOpenColorPicker(elementId)}
                onDragStart={draggable ? handleDragStart(elementId) : undefined}
                onDragOver={draggable ? handleDragOver : undefined}
                onDrop={draggable ? handleDropOnItem(elementId) : undefined}
                onDragEnd={draggable ? handleDragEnd : undefined}
                isDragging={draggingId === elementId}
                style={visibleAnimations[index]?.style}
              />
            );
          })}
        </div>

        <div className="mt-5 pt-5 border-t border-white/8">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Hidden Elements</div>
          <div className="space-y-2" role="list">
            {filteredHidden.length === 0 ? (
              <p className="text-xs text-slate-500">No hidden elements</p>
            ) : (
              filteredHidden.map((elementId, index) => {
                const metaEntry = meta[elementId];
                if (!metaEntry) return null;
                return (
                  <ElementItem
                    key={elementId}
                    id={elementId}
                    meta={metaEntry}
                    visible={false}
                    onToggle={allowVisibilityToggles ? () => onToggleVisibility(elementId) : undefined}
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

      {heroElementIds.length > 0 ? (
        <Section title="Header & Details" badge="✨ Hero">
          <div className="space-y-2" role="list">
            {heroElementIds.map((elementId, index) => {
              const metaEntry = meta[elementId];
              if (!metaEntry) return null;
              const isVisible = staticVisibility[elementId] !== false;
              return (
                <ElementItem
                  key={elementId}
                  id={elementId}
                  meta={metaEntry}
                  visible={isVisible}
                  onToggle={allowStaticVisibility ? (next) => onToggleStaticElement(elementId, next) : undefined}
                  onOpenFontSettings={() => onOpenFontSettings(elementId)}
                  onOpenColorPicker={() => onOpenColorPicker(elementId)}
                  style={heroAnimations[index]?.style}
                />
              );
            })}
          </div>
        </Section>
      ) : null}

      {footerElementIds.length > 0 ? (
        <Section title="Footer" badge="📣 Brand">
          <div className="space-y-2" role="list">
            {footerElementIds.map((elementId, index) => {
              const metaEntry = meta[elementId];
              if (!metaEntry) return null;
              const isVisible = staticVisibility[elementId] !== false;
              return (
                <ElementItem
                  key={elementId}
                  id={elementId}
                  meta={metaEntry}
                  visible={isVisible}
                  onToggle={allowStaticVisibility ? (next) => onToggleStaticElement(elementId, next) : undefined}
                  onOpenFontSettings={() => onOpenFontSettings(elementId)}
                  onOpenColorPicker={() => onOpenColorPicker(elementId)}
                  style={footerAnimations[index]?.style}
                />
              );
            })}
          </div>
        </Section>
      ) : null}
    </div>
  );
};

export default ContentTab;
