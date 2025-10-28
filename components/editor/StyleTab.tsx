import React, { useRef } from 'react';
import type { EditorColorPalette, Style, LogoPosition } from '../../types';
import { Button } from '../ui';
import { cn } from '../../utils/cn';

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
}

const StyleSection: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({
  title,
  description,
  children,
}) => (
  <section className="space-y-4 rounded-2xl border border-border-light/70 bg-surface/70 p-5 shadow-sm backdrop-blur">
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {description ? <p className="text-xs text-text-tertiary">{description}</p> : null}
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
          'relative flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-light/60',
          'bg-surface/60 p-6 text-center transition-all duration-200 focus-visible:border-primary focus-visible:bg-primary/15 focus-visible:outline-none',
          currentImage ? 'border-solid border-border-light/70 bg-surface/80 hover:border-primary hover:bg-primary/10' : 'hover:border-primary hover:bg-primary/10',
          isUploading && 'pointer-events-none opacity-70',
        )}
      >
        {children}
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background/80 text-text-secondary">
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
  <div className="space-y-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{label}</p>
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
      'rounded-xl border border-border-light/70 px-4 py-2 text-sm font-medium text-text-tertiary transition-all duration-150',
      'hover:border-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      selected && 'border-primary bg-primary/10 text-primary-light shadow-[0_0_0_2px_rgba(139,123,216,0.15)]',
    )}
  >
    {children}
  </button>
);

const PaletteCard: React.FC<PaletteCardProps> = ({ palette, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(palette)}
    className={cn(
      'group w-full rounded-2xl border border-border-light/70 bg-surface/80 p-4 text-left transition-all duration-200',
      'hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      selected && 'border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(139,123,216,0.15)]',
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">{palette.name}</p>
        {palette.description ? (
          <p className="text-xs text-text-tertiary">{palette.description}</p>
        ) : null}
      </div>
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full border border-border-light text-xs text-text-tertiary transition',
          selected
            ? 'border-primary bg-primary text-background'
            : 'bg-surface-hover/50 group-hover:bg-primary/20',
        )}
        aria-hidden="true"
      >
        {selected ? '✓' : '–'}
      </span>
    </div>
    <div className="mt-4 flex gap-3">
      {palette.preview.map((color) => (
        <span
          key={color}
          className="h-9 w-9 rounded-lg border border-border-light/60"
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
}) => (
  <div className="space-y-6">
    <StyleSection title="Color Theme" description="Choose a palette to instantly restyle your schedule preview.">
      <div className="grid gap-3 sm:grid-cols-2">
        {palettes.map((palette) => (
          <PaletteCard
            key={palette.id}
            palette={palette}
            selected={palette.id === selectedPaletteId}
            onSelect={onSelectPalette}
          />
        ))}
      </div>
      <Button variant="secondary" fullWidth disabled>
        🎨 Customize Colors (coming soon)
      </Button>
    </StyleSection>

    <StyleSection
      title="Background"
      description="Use a photo or keep things simple with a solid color backdrop."
    >
      <ImageUploadArea
        currentImage={style.bgImage}
        onUpload={onBackgroundUpload}
        isUploading={isBackgroundUploading}
      >
        {style.bgImage ? (
          <img
            src={style.bgImage}
            alt="Background preview"
            className="max-h-[140px] w-full rounded-xl object-cover"
          />
        ) : (
          <>
            <span className="text-2xl opacity-70">🖼️</span>
            <div className="space-y-1 text-sm text-text-tertiary">
              <p className="font-semibold text-text-secondary">Tap to upload image</p>
              <p className="text-xs text-text-tertiary">or stay with the solid color</p>
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
        >
          🗑️ Remove Background
        </Button>
      ) : null}
    </StyleSection>

    <StyleSection title="Logo" description="Add your mark and choose where it appears on the canvas.">
      <ImageUploadArea
        currentImage={style.logoUrl}
        onUpload={onLogoUpload}
        isUploading={isLogoUploading}
      >
        {style.logoUrl ? (
          <img
            src={style.logoUrl}
            alt="Logo preview"
            className="max-h-[120px] w-full rounded-xl object-contain p-4"
          />
        ) : (
          <>
            <span className="text-2xl opacity-70">📌</span>
            <div className="space-y-1 text-sm text-text-tertiary">
              <p className="font-semibold text-text-secondary">Upload your logo</p>
              <p className="text-xs text-text-tertiary">PNG or SVG with transparent backgrounds work best</p>
            </div>
          </>
        )}
      </ImageUploadArea>
      {style.logoUrl ? (
        <div className="space-y-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={onRemoveLogo}
            disabled={isLogoUploading}
          >
            🗑️ Remove Logo
          </Button>
          <ControlGroup label="Logo Position">
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

export default StyleTab;
