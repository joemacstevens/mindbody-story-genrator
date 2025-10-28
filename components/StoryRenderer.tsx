import React from 'react';
import type { Style, Schedule, TemplateId, SelectedElement } from '../types';
import DefaultStoryRenderer from './renderers/DefaultStoryRenderer';

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

const StoryRenderer: React.FC<StoryRendererProps> = (props) => {
  // All templates now use the same unified renderer.
  // The visual differences are controlled by the `style` prop.
  return <DefaultStoryRenderer {...props} />;
};

export default StoryRenderer;
