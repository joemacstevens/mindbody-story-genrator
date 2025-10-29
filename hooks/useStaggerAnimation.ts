import { useMemo } from 'react';
import type { CSSProperties } from 'react';

export interface StaggerFrame {
  style: CSSProperties;
}

/**
 * Generates inline animation delays for staggered entrance effects.
 */
export const useStaggerAnimation = (
  itemCount: number,
  delay = 80,
  initialDelay = 0,
): StaggerFrame[] => {
  return useMemo(() => {
    if (itemCount <= 0) {
      return [];
    }
    return Array.from({ length: itemCount }, (_, index) => ({
      style: { animationDelay: `${initialDelay + index * delay}ms` } as CSSProperties,
    }));
  }, [itemCount, delay, initialDelay]);
};

export default useStaggerAnimation;
