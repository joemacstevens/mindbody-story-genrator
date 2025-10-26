import React from 'react';
import type { Style } from '../types';

interface BackgroundLayerProps {
  style: Pick<Style, 'bgImage' | 'bgFit' | 'bgPosition' | 'overlayColor' | 'bgBlur' | 'backgroundColor'>;
}

const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ style }) => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: style.backgroundColor, zIndex: 0 }}
    >
      {style.bgImage && (
        <>
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${style.bgImage})`,
              backgroundSize: style.bgFit || 'cover',
              backgroundPosition: style.bgPosition || '50% 50%',
              filter: style.bgBlur ? `blur(${style.bgBlur}px)` : undefined,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: style.overlayColor || 'transparent',
            }}
          />
        </>
      )}
    </div>
  );
};

export default BackgroundLayer;
