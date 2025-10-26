import React, { useState, useRef, useEffect } from 'react';
import type { Style, Schedule, TemplateId, LogoPosition, SelectedElement } from '../../types';
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
}

const positionClasses: Record<LogoPosition, string> = {
  'top-left': 'top-12 left-12',
  'top-center': 'top-12 left-1/2 -translate-x-1/2',
  'top-right': 'top-12 right-12',
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
  style,
  schedule,
  isFullSize = false,
  onContentChange,
  forceInlineBackground = false,
  selectedElement = null,
  onSelectElement,
}) => {
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLParagraphElement>(null);

  const fieldRefs: Record<EditableField, React.RefObject<HTMLElement>> = {
    heading: headingRef,
    subtitle: subtitleRef,
    footer: footerRef,
  };

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
  
  const basePaddingPx = 60;
  const topPaddingWithLogoPx = 192;
  const bottomPaddingWithLogoPx = 160;
  const logoPadding = style.logoPadding || 0;

  const cardStyle: React.CSSProperties = {
    paddingLeft: `${basePaddingPx}px`,
    paddingRight: `${basePaddingPx}px`,
    paddingTop: isTopLogo ? `${topPaddingWithLogoPx + logoPadding}px` : `${basePaddingPx}px`,
    paddingBottom: isBottomLogo ? `${bottomPaddingWithLogoPx + logoPadding}px` : `${basePaddingPx}px`,
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
  
  const bodyFontSize = style.bodySize || 36;
  const itemCoachStyle: React.CSSProperties = {
    color: style.textColorSecondary,
    fontSize: `${Math.round(bodyFontSize * 0.85)}px`,
    marginTop: '4px',
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
  
  return (
    <div style={wrapperStyle} className={`relative flex items-center justify-center p-[40px] bg-cover bg-center`}>
      {!forceInlineBackground && <BackgroundLayer style={style} />}
      <div
        className={`relative w-full h-full flex flex-col shadow-2xl backdrop-blur-sm ${cornerRadiusClasses[style.cornerRadius || '2xl']}`}
        style={cardStyle}
        onClick={(event) => event.stopPropagation()}
      >
        {style.logoUrl && <img src={style.logoUrl} alt="Company Logo" style={logoStyle} className={`absolute object-contain ${positionClasses[style.logoPosition]}`} />}

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
            className={`flex-grow flex flex-col overflow-y-auto pr-4 -mr-4 cursor-pointer ${selectionRingClass('schedule')}`}
            onClick={(event) => handleElementClick(event, 'schedule')}
          >
            <ul className="space-y-10 my-auto">
              {schedule.items.length > 0 ? (
                schedule.items.map((item, index) => (
                  <li key={index} className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-4 text-left font-semibold" style={{ color: style.accent, fontSize: `${bodyFontSize}px` }}>
                      {item.time}
                    </div>
                    <div className="col-span-8">
                      <p className="font-bold" style={{ color: style.textColorPrimary, fontSize: `${bodyFontSize}px` }}>
                        {item.class}
                      </p>
                      <p style={itemCoachStyle}>with {item.coach}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="flex items-center justify-center h-full">
                  <p className="font-semibold" style={{ color: style.textColorSecondary, fontSize: `${bodyFontSize}px` }}>
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
