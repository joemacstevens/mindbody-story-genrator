import React, { useRef } from 'react';
import type { CSSProperties } from 'react';
import type { EditorColorPalette, Style, LogoPosition } from '../../types';
import { Button } from '../ui';
import { cn } from '../../utils/cn';
import { useStaggerAnimation } from '../../hooks/useStaggerAnimation';

interface StyleTabProps {
  palettes: EditorColorPalette[];
  selectedPaletteId: string;
  onSelectPalette: (palette: EditorColorPalette) => void;
  style: Style;
  onBackgroundUpload: (file: File, previewUrl: string) => void;
  onRemoveBackground: () => void;
  onLogoUpload: (file: File, previewUrl: string) => void;
  onRemoveLogo: () => void;
  onLogoPositionChange: (position: LogoPosition) => void;
  isBackgroundUploading?: boolean;
  isLogoUploading?: boolean;
}

interface PaletteCardProps {
  palette: EditorColorPalette;
  selected: boolean;
  onSelect: (palette: EditorColorPalette) => void;
  style?: CSSProperties;
}

const StyleSection: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({
  title,
  description,
  children,
}) => (
  <section className="mb-7">
    <div className="mb-3.5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</h3>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
    </div>
    {children}
  </section>
);

interface ImageUploadAreaProps {
  currentImage?: string;
  onUpload: (file: File, previewUrl: string) => void;
  isUploading?: boolean;
  children: React.ReactNode;
}

const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({ currentImage, onUpload, isUploading, children }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onUpload(file, previewUrl);
    // Reset input so the same file can be selected again if needed
    event.target.value = '';
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/20 bg-white/3 p-7 text-center cursor-pointer transition-all duration-200',
          'hover:border-purple-500 hover:bg-purple-500/5',
          currentImage ? 'border-solid border-white/30 bg-white/5' : '',
          isUploading && 'pointer-events-none opacity-70',
        )}
      >
        {children}
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-900/80 text-slate-300">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
            <p className="text-xs font-semibold uppercase tracking-wide">Uploading…</p>
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
    </>
  );
};

const ControlGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-5">
    <p className="text-sm text-slate-300 mb-3">{label}</p>
    {children}
  </div>
);

const RadioGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-3 gap-2">{children}</div>
);

const RadioOption: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({
  selected,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-lg border-2 px-3 py-3 text-center text-sm transition-all duration-200',
      'hover:border-purple-500/50 hover:text-slate-50',
      selected 
        ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
        : 'border-white/10 bg-white/5 text-slate-400',
    )}
  >
    {children}
  </button>
);

const PaletteCard: React.FC<PaletteCardProps> = ({ palette, selected, onSelect, style }) => (
  <button
    type="button"
    onClick={() => onSelect(palette)}
    className={cn(
      'w-full rounded-xl border-2 bg-white/4 p-4 text-left transition-all duration-200 cursor-pointer',
      'hover:border-purple-500/40 hover:-translate-y-0.5 hover:shadow-lg',
      selected 
        ? 'border-purple-500 bg-purple-500/8 shadow-[0_0_0_3px_rgba(139,123,216,0.1)]' 
        : 'border-white/10',
    )}
    style={style}
  >
    <div className="mb-2">
      <p className="text-sm font-medium text-slate-200">{palette.name}</p>
    </div>
    <div className="flex gap-1.5">
      {palette.preview.map((color) => (
        <span
          key={color}
          className="h-7 w-7 rounded-md border border-white/15"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  </button>
);

export const StyleTab: React.FC<StyleTabProps> = ({
  palettes,
  selectedPaletteId,
  onSelectPalette,
  style,
  onBackgroundUpload,
  onRemoveBackground,
  onLogoUpload,
  onRemoveLogo,
  onLogoPositionChange,
  isBackgroundUploading = false,
  isLogoUploading = false,
}) => {
  const paletteAnimations = useStaggerAnimation(palettes.length, 70);

  return (
    <div className="space-y-7">
      <StyleSection title="Color Theme">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {palettes.map((palette, index) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              selected={palette.id === selectedPaletteId}
              onSelect={onSelectPalette}
              style={paletteAnimations[index]?.style}
            />
          ))}
        </div>
        <Button variant="secondary" fullWidth disabled>
          🎨 Customize Colors
        </Button>
      </StyleSection>

      <StyleSection title="Background">
        <ImageUploadArea
          currentImage={style.bgImage}
          onUpload={onBackgroundUpload}
          isUploading={isBackgroundUploading}
        >
          {style.bgImage ? (
            <img
              src={style.bgImage}
              alt="Background preview"
              className="max-h-[120px] w-full rounded-lg object-cover"
            />
          ) : (
            <>
              <span className="text-3xl opacity-50 mb-2">🖼️</span>
              <div className="text-sm text-slate-400">
                <p className="font-medium">Tap to upload image</p>
                <p className="text-xs opacity-70 mt-1">or use solid color</p>
              </div>
            </>
          )}
        </ImageUploadArea>
        {style.bgImage ? (
          <Button
            variant="secondary"
            fullWidth
            onClick={onRemoveBackground}
            disabled={isBackgroundUploading}
            className="mt-3"
          >
            🗑️ Remove Background
          </Button>
        ) : null}
      </StyleSection>

      <StyleSection title="Logo">
        <ImageUploadArea
          currentImage={style.logoUrl}
          onUpload={onLogoUpload}
          isUploading={isLogoUploading}
        >
          {style.logoUrl ? (
            <img
              src={style.logoUrl}
              alt="Logo preview"
              className="max-h-[100px] w-full rounded-lg object-contain p-4"
            />
          ) : (
            <>
              <span className="text-3xl opacity-50 mb-2">📌</span>
              <div className="text-sm text-slate-400">
                <p className="font-medium">Upload your logo</p>
              </div>
            </>
          )}
        </ImageUploadArea>
        {style.logoUrl ? (
          <div className="mt-4">
            <ControlGroup label="Position">
              <RadioGroup>
                <RadioOption selected={style.logoPosition === 'top-center'} onClick={() => onLogoPositionChange('top-center')}>
                  Top
                </RadioOption>
                <RadioOption selected={style.logoPosition === 'center'} onClick={() => onLogoPositionChange('center')}>
                  Center
                </RadioOption>
                <RadioOption selected={style.logoPosition === 'bottom-center'} onClick={() => onLogoPositionChange('bottom-center')}>
                  Bottom
                </RadioOption>
              </RadioGroup>
            </ControlGroup>
          </div>
        ) : null}
      </StyleSection>
    </div>
  );
};

export default StyleTab;
