import React from 'react';
import type { Style, Schedule, TemplateId } from '../types';
import DefaultStoryRenderer from './renderers/DefaultStoryRenderer';

interface StoryRendererProps {
  templateId: TemplateId;
  style: Style;
  schedule: Schedule;
  isFullSize?: boolean;
  onContentChange?: (update: Partial<Pick<Style, 'heading' | 'subtitle' | 'footer'>>) => void;
}

const StoryRenderer: React.FC<StoryRendererProps> = (props) => {
  // All templates now use the same unified renderer.
  // The visual differences are controlled by the `style` prop.
  return <DefaultStoryRenderer {...props} />;
};

export default StoryRenderer;
