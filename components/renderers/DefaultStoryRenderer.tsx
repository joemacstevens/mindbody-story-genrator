import React, { useState, useRef, useEffect } from 'react';
import type { Style, Schedule, TemplateId, LogoPosition, SelectedElement } from '../../types';
import { DEFAULT_APP_SETTINGS } from '../../constants';
import BackgroundLayer from '../BackgroundLayer';

type EditableField = 'heading' | 'subtitle' | 'footer';
interface StoryRendererProps {
  templateId: TemplateId;
  style: Style;
  schedule: Schedule;
  isFullSize?: boolean;
  onContentChange?: (update: Partial<Pick<Style, 'heading' | 'subtitle' | 'footer'>>) => void;
  forceInlineBackground?: boolean;
  selectedElement?: SelectedElement | null;
  onSelectElement?: (element: SelectedElement | null) => void;
  inlineLogoSrc?: string | null;
}

const positionClasses: Record<LogoPosition, string> = {
  'top-left': 'top-12 left-12',
  'top-center': 'top-12 left-1/2 -translate-x-1/2',
  'top-right': 'top-12 right-12',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'bottom-left': 'bottom-8 left-12',
  'bottom-center': 'bottom-8 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-8 right-12',
};

const cornerRadiusClasses: Record<NonNullable<Style['cornerRadius']>, string> = {
  'none': 'rounded-none', 'sm': 'rounded-sm', 'md': 'rounded-md', 'lg': 'rounded-lg', '2xl': 'rounded-2xl',
};

const dividerClasses: Record<NonNullable<Style['dividerStyle']>, string> = {
    'none': 'border-none', 'thin': 'border-t', 'thick': 'border-t-2', 'dotted': 'border-t border-dotted'
};

const DefaultStoryRenderer: React.FC<StoryRendererProps> = ({
  templateId,
  style,
  schedule,
  isFullSize = false,
  onContentChange,
  forceInlineBackground = false,
  selectedElement = null,
  onSelectElement,
  inlineLogoSrc = null,
}) => {
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLParagraphElement>(null);
  const scheduleContainerRef = useRef<HTMLDivElement | null>(null);
  const [scheduleHeight, setScheduleHeight] = useState(0);

  const fieldRefs: Record<EditableField, React.RefObject<HTMLElement>> = {
    heading: headingRef,
    subtitle: subtitleRef,
    footer: footerRef,
  };

  useEffect(() => {
    const node = scheduleContainerRef.current;
    if (!node || typeof window === 'undefined') {
      return;
    }

    const updateHeight = () => {
      const nextHeight = node.getBoundingClientRect().height;
      setScheduleHeight((prev) => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
    };

    updateHeight();

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => {
        updateHeight();
      });
      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    }

    const handle = window.setInterval(updateHeight, 250);

    return () => {
      window.clearInterval(handle);
    };
  }, [schedule.items.length, isFullSize]);

  useEffect(() => {
    if (editingField && fieldRefs[editingField]?.current) {
        const el = fieldRefs[editingField].current;
        if (el) {
            el.focus();
            // Move cursor to the end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(el);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }
  }, [editingField]);
  
  const handleBlur = (field: EditableField) => {
    const ref = fieldRefs[field];
    if (ref.current && onContentChange) {
      onContentChange({ [field]: ref.current.textContent || '' });
    }
    setEditingField(null);
  };

  const isTopLogo = style.logoUrl && style.logoPosition.startsWith('top-');
  const isBottomLogo = style.logoUrl && style.logoPosition.startsWith('bottom-');
  const isCenterLogo = style.logoUrl && style.logoPosition === 'center';
  
  const basePaddingPx = 60;
  const topPaddingWithLogoPx = 192;
  const bottomPaddingWithLogoPx = 160;
  const logoPadding = style.logoPadding || 0;

  const cardStyle: React.CSSProperties = {
    paddingLeft: `${basePaddingPx}px`,
    paddingRight: `${basePaddingPx}px`,
    paddingTop: isTopLogo ? `${topPaddingWithLogoPx + logoPadding}px` : `${basePaddingPx}px`,
    paddingBottom: isBottomLogo ? `${bottomPaddingWithLogoPx + logoPadding}px` : `${basePaddingPx}px`,
    alignItems: isCenterLogo ? 'center' : undefined,
    backgroundColor: style.cardBackgroundColor,
  };

  const shouldInlineBackground = forceInlineBackground || !style.bgImage;
  const gradientLayer =
    shouldInlineBackground &&
    style.bgImage &&
    style.overlayColor &&
    style.overlayColor !== 'transparent'
      ? `linear-gradient(${style.overlayColor}, ${style.overlayColor})`
      : null;

  const wrapperStyle: React.CSSProperties = {
    width: '1080px',
    height: '1920px',
    fontFamily: style.fontFamily,
    backgroundColor: shouldInlineBackground ? style.backgroundColor : 'transparent',
    backgroundImage:
      forceInlineBackground && style.bgImage
        ? gradientLayer
          ? `${gradientLayer}, url(${style.bgImage})`
          : `url(${style.bgImage})`
        : undefined,
    backgroundSize: style.bgFit || 'cover',
    backgroundPosition: style.bgPosition || '50% 50%',
    backgroundRepeat: 'no-repeat',
  };
  
  const classCount = schedule.items.length;
  const effectiveClassCount = Math.min(Math.max(classCount || 1, 1), 20);
  const density = (effectiveClassCount - 1) / 19;
  const availableHeight = scheduleHeight || 0;
  const templateDefaults = DEFAULT_APP_SETTINGS.configs[templateId];
  const baseBodySize = templateDefaults?.bodySize && templateDefaults.bodySize > 0 ? templateDefaults.bodySize : 36;
  const userBodySize = style.bodySize && style.bodySize > 0 ? style.bodySize : baseBodySize;
  const rawBodySize = availableHeight ? availableHeight / (effectiveClassCount * 2.1) : baseBodySize;
  const clampedBaseSize = Math.max(18, Math.min(rawBodySize, baseBodySize));
  const bodyFontSize = Math.max(18, clampedBaseSize * (userBodySize / baseBodySize));
  const fontScale = bodyFontSize / (userBodySize || 1);
  const spacingCompression = 1 - density * 0.5;
  const itemGap = Math.max(12, Math.round(44 * spacingCompression * Math.max(fontScale, 0.7)));
  const columnGap = Math.max(16, Math.round(32 * spacingCompression * Math.max(fontScale, 0.7)));
  const textStackGap = Math.max(6, Math.round(14 * spacingCompression));
  const schedulePaddingBlock = Math.max(28, Math.round(60 * spacingCompression));
  const timeFontSize = Math.max(bodyFontSize * (1.08 - density * 0.08), bodyFontSize + 2);
  const classFontSize = bodyFontSize * (0.98 - density * 0.04);
  const coachFontSize = Math.max(bodyFontSize * (0.76 - density * 0.06), bodyFontSize * 0.62);
  const locationFontSize = Math.max(bodyFontSize * (0.7 - density * 0.05), bodyFontSize * 0.58);
  const accentLineHeight = 1.1;
  const textLineHeight = 1.18;
  const timeLineHeight = 1.12;
  const itemCoachStyle: React.CSSProperties = {
    color: style.textColorSecondary,
    fontSize: `${Math.round(coachFontSize)}px`,
    lineHeight: textLineHeight,
  };

  const showHeading = style.showHeading !== false;
  const showSubtitle = style.showSubtitle !== false;
  const showFooter = style.showFooter !== false;
  const showSchedule = style.showSchedule !== false;

  const isSelected = (type: SelectedElement['type']) => selectedElement?.type === type;
  const selectionRingClass = (type: SelectedElement['type']) =>
    isSelected(type)
      ? 'ring-4 ring-indigo-400/70 ring-offset-4 ring-offset-black/30 rounded-xl'
      : '';
  const handleElementClick = (event: React.MouseEvent<HTMLElement>, type: SelectedElement['type']) => {
    event.stopPropagation();
    onSelectElement?.({ type });
  };
  
  const editableProps = (field: EditableField) =>
    onContentChange
      ? {
          onDoubleClick: () => setEditingField(field),
          onBlur: () => handleBlur(field),
          onClick: (event: React.MouseEvent<HTMLElement>) => handleElementClick(event, field),
          contentEditable: editingField === field,
          suppressContentEditableWarning: true,
          className: `outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 focus:rounded-md -m-1 p-1 transition-shadow ${
            editingField === field ? '' : 'hover:bg-white/10 cursor-pointer'
          }`,
        }
      : {
          onClick: (event: React.MouseEvent<HTMLElement>) => handleElementClick(event, field),
        };

  const logoSizeMultiplier = (style.logoSize || 100) / 100;
  const logoStyle: React.CSSProperties = {
    maxHeight: `${120 * logoSizeMultiplier}px`,
    maxWidth: `${300 * logoSizeMultiplier}px`,
  };
  const logoSource = inlineLogoSrc || style.logoUrl;
  
  return (
    <div style={wrapperStyle} className={`relative flex items-center justify-center p-[40px] bg-cover bg-center`}>
      {!forceInlineBackground && <BackgroundLayer style={style} />}
      <div
        className={`relative w-full h-full flex flex-col shadow-2xl backdrop-blur-sm ${cornerRadiusClasses[style.cornerRadius || '2xl']}`}
        style={cardStyle}
        onClick={(event) => event.stopPropagation()}
      >
        {logoSource && (
          <img
            src={logoSource}
            alt="Company Logo"
            style={logoStyle}
            className={`absolute object-contain ${positionClasses[style.logoPosition]}`}
            crossOrigin="anonymous"
          />
        )}

        <header className="flex-shrink-0 text-center">
            {style.accentLines && <div style={{ backgroundColor: style.accent }} className="h-3 w-1/3 mx-auto rounded-full mb-8"></div>}
            {showHeading && (() => {
              const headingEditable = editableProps('heading');
              const headingClassName = [
                'text-9xl uppercase tracking-tighter',
                headingEditable.className || '',
                selectionRingClass('heading'),
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <h1
                  ref={headingRef}
                  key={`heading-${style.heading}`}
                  {...headingEditable}
                  style={{ color: style.textColorPrimary, fontWeight: style.headingWeight || '900' }}
                  className={headingClassName}
                >
                  {style.heading}
                </h1>
              );
            })()}
            <h2 className={`text-6xl font-bold mt-2`} style={{ color: style.textColorPrimary }}>{schedule.date}</h2>
            {showSubtitle && (() => {
              const subtitleEditable = editableProps('subtitle');
              const subtitleClassName = [
                'text-4xl mt-2',
                subtitleEditable.className || '',
                selectionRingClass('subtitle'),
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <p
                  ref={subtitleRef}
                  key={`subtitle-${style.subtitle}`}
                  {...subtitleEditable}
                  className={subtitleClassName}
                  style={{ color: style.textColorSecondary }}
                >
                  {style.subtitle}
                </p>
              );
            })()}
        </header>

        {style.dividerStyle !== 'none' && <div className={`my-8 ${dividerClasses[style.dividerStyle || 'thin']}`} style={{borderColor: style.textColorSecondary, opacity: 0.5}}></div>}

        {showSchedule ? (
          <main
            ref={scheduleContainerRef}
            className={`flex-grow flex flex-col overflow-hidden cursor-pointer ${selectionRingClass('schedule')}`}
            onClick={(event) => handleElementClick(event, 'schedule')}
            style={{ paddingTop: `${schedulePaddingBlock}px`, paddingBottom: `${schedulePaddingBlock}px` }}
          >
            <ul className="flex flex-col" style={{ gap: `${itemGap}px` }}>
              {schedule.items.length > 0 ? (
                schedule.items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div
                      className="font-semibold"
                      style={{
                        color: style.accent,
                        fontSize: `${Math.round(timeFontSize)}px`,
                        lineHeight: timeLineHeight,
                        minWidth: `${Math.max(96, Math.round(170 * spacingCompression * Math.max(fontScale, 0.7)))}px`,
                      }}
                    >
                      {item.time}
                    </div>
                    <div
                      className="flex min-w-0 flex-1 flex-col"
                      style={{ gap: `${textStackGap}px`, marginLeft: `${columnGap}px` }}
                    >
                      <p
                        className="font-bold"
                        style={{
                          color: style.textColorPrimary,
                          fontSize: `${Math.round(classFontSize)}px`,
                          lineHeight: accentLineHeight,
                        }}
                      >
                        {item.class}
                      </p>
                      {item.coach ? (
                        <p style={itemCoachStyle}>with {item.coach}</p>
                      ) : null}
                      {item.location ? (
                        <p
                          style={{
                            color: style.textColorSecondary,
                            fontSize: `${Math.round(locationFontSize)}px`,
                            lineHeight: textLineHeight,
                          }}
                        >
                          📍 {item.location}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))
              ) : (
                <li className="flex items-center justify-center">
                  <p
                    className="font-semibold text-center"
                    style={{ color: style.textColorSecondary, fontSize: `${Math.round(bodyFontSize)}px`, lineHeight: 1.3 }}
                  >
                    No classes today.
                  </p>
                </li>
              )}
            </ul>
          </main>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow text-sm text-slate-400 italic">
            Schedule hidden
          </div>
        )}

        {showFooter && (() => {
          const footerEditable = editableProps('footer');
          const footerClassName = [
            'text-3xl font-medium tracking-widest uppercase',
            footerEditable.className || '',
            selectionRingClass('footer'),
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <footer
              className={`flex-shrink-0 pt-8 text-center ${style.footerBar ? 'py-4 rounded' : ''}`}
              style={{ backgroundColor: style.footerBar ? style.accent : 'transparent' }}
            >
              <p
                ref={footerRef}
                key={`footer-${style.footer}`}
                {...footerEditable}
                className={footerClassName}
                style={{ color: style.footerBar ? style.backgroundColor : style.textColorSecondary }}
              >
                {style.footer}
              </p>
            </footer>
          );
        })()}
      </div>
    </div>
  );
};

export default DefaultStoryRenderer;
