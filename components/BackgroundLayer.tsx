import React from 'react';
import type { Style } from '../types';

interface BackgroundLayerProps {
  style: Pick<Style, 'bgImage' | 'bgFit' | 'bgPosition' | 'overlayColor' | 'bgBlur' | 'backgroundColor'>;
}

const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ style }) => {
  // This component now handles both the solid background color and the image layer.
  // It always renders to provide the base background color, and the -z-10
  // keeps it behind the main content card.
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden -z-10"
      style={{ backgroundColor: style.backgroundColor }}
    >
      {style.bgImage && (
        <>
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${style.bgImage})`,
              backgroundSize: style.bgFit,
              backgroundPosition: style.bgPosition,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: style.overlayColor || 'transparent',
              backdropFilter: `blur(${(style.bgBlur || 0)}px)`,
            }}
          />
        </>
      )}
    </div>
  );
};

export default BackgroundLayer;
