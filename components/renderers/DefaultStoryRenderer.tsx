import React, { useState, useRef, useEffect } from 'react';
import type { Style, Schedule, TemplateId, LogoPosition } from '../../types';
import BackgroundLayer from '../BackgroundLayer';

type EditableField = 'heading' | 'subtitle' | 'footer';
interface StoryRendererProps {
  templateId: TemplateId;
  style: Style;
  schedule: Schedule;
  isFullSize?: boolean;
  onContentChange?: (update: Partial<Pick<Style, 'heading' | 'subtitle' | 'footer'>>) => void;
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

const DefaultStoryRenderer: React.FC<StoryRendererProps> = ({ style, schedule, isFullSize = false, onContentChange }) => {
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

  const wrapperStyle: React.CSSProperties = {
    width: '1080px',
    height: '1920px',
    fontFamily: style.fontFamily,
    // If there is a bg image, the BackgroundLayer will handle the bg color.
    // If not, this wrapper will show the color. This fixes the layering bug.
    backgroundColor: style.bgImage ? 'transparent' : style.backgroundColor,
  };
  
  const bodyFontSize = style.bodySize || 36;
  const itemCoachStyle: React.CSSProperties = { color: style.textColorSecondary, fontSize: `${Math.round(bodyFontSize * 0.85)}px`, marginTop: '4px' };
  
  const editableProps = (field: EditableField) => onContentChange ? {
      onDoubleClick: () => setEditingField(field),
      onBlur: () => handleBlur(field),
      contentEditable: editingField === field,
      suppressContentEditableWarning: true,
      className: `outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 focus:rounded-md -m-1 p-1 transition-shadow ${editingField === field ? '' : 'hover:bg-white/10 cursor-pointer'}`,
  } : {};

  const logoSizeMultiplier = (style.logoSize || 100) / 100;
  const logoStyle: React.CSSProperties = {
    maxHeight: `${120 * logoSizeMultiplier}px`,
    maxWidth: `${300 * logoSizeMultiplier}px`,
  };
  
  return (
    <div style={wrapperStyle} className={`relative flex items-center justify-center p-[40px] bg-cover bg-center`}>
      <BackgroundLayer style={style} />
      <div
        className={`relative w-full h-full flex flex-col shadow-2xl backdrop-blur-sm ${cornerRadiusClasses[style.cornerRadius || '2xl']}`}
        style={cardStyle}
      >
        {style.logoUrl && <img src={style.logoUrl} alt="Company Logo" style={logoStyle} className={`absolute object-contain ${positionClasses[style.logoPosition]}`} />}

        <header className="flex-shrink-0 text-center">
            {style.accentLines && <div style={{ backgroundColor: style.accent }} className="h-3 w-1/3 mx-auto rounded-full mb-8"></div>}
            <h1
                ref={headingRef}
                key={`heading-${style.heading}`}
                {...editableProps('heading')}
                style={{ color: style.textColorPrimary, fontWeight: style.headingWeight || '900' }}
                className={`text-9xl uppercase tracking-tighter ${editableProps('heading').className}`}
            >
                {style.heading}
            </h1>
            <h2 className={`text-6xl font-bold mt-2`} style={{ color: style.textColorPrimary }}>{schedule.date}</h2>
            {style.subtitle && (
                <p 
                    ref={subtitleRef}
                    key={`subtitle-${style.subtitle}`}
                    {...editableProps('subtitle')}
                    className={`text-4xl mt-2 ${editableProps('subtitle').className}`} style={{ color: style.textColorSecondary }}>
                    {style.subtitle}
                </p>
            )}
        </header>

        {style.dividerStyle !== 'none' && <div className={`my-8 ${dividerClasses[style.dividerStyle || 'thin']}`} style={{borderColor: style.textColorSecondary, opacity: 0.5}}></div>}

        <main className="flex-grow flex flex-col overflow-y-auto pr-4 -mr-4">
          <ul className="space-y-10 my-auto">
            {schedule.items.length > 0 ? (
              schedule.items.map((item, index) => (
                <li key={index} className="grid grid-cols-12 gap-6 items-center">
                  <div className="col-span-4 text-left font-semibold" style={{ color: style.accent, fontSize: `${bodyFontSize}px` }}>{item.time}</div>
                  <div className="col-span-8">
                    <p className={`font-bold`} style={{ color: style.textColorPrimary, fontSize: `${bodyFontSize}px` }}>{item.class}</p>
                    <p style={itemCoachStyle}>with {item.coach}</p>
                  </div>
                </li>
              ))
            ) : (
               <li className="flex items-center justify-center h-full"><p className={`font-semibold`} style={{ color: style.textColorSecondary, fontSize: `${bodyFontSize}px` }}>No classes today.</p></li>
            )}
          </ul>
        </main>

        <footer className={`flex-shrink-0 pt-8 text-center ${style.footerBar ? 'py-4 rounded' : ''}`} style={{backgroundColor: style.footerBar ? style.accent : 'transparent'}}>
          <p 
            ref={footerRef}
            key={`footer-${style.footer}`}
            {...editableProps('footer')}
            className={`text-3xl font-medium tracking-widest uppercase ${editableProps('footer').className}`} 
            style={{ color: style.footerBar ? style.backgroundColor : style.textColorSecondary }}>
            {style.footer}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DefaultStoryRenderer;