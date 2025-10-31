import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StyleTab } from '../StyleTab';
import { ContentTab } from '../ContentTab';
import { LayoutTab } from '../LayoutTab';
import { CLASSIC_TEMPLATE_DEFINITION } from '../../../lib/templates';
import { STYLE_COLOR_PALETTES } from '../stylePalettes';
import { DEFAULT_VISIBLE_ELEMENTS, DEFAULT_HIDDEN_ELEMENTS } from '../contentElements';
import type { ScheduleElementId } from '../../../types';
import { resolveContentTabControls } from '../../../lib/templates/editorConfig';

const noop = () => {};

describe('editor panel template adapters', () => {
  it('hides style tab sections when disabled by template config', () => {
    const style = CLASSIC_TEMPLATE_DEFINITION.defaults.createStyle();
    const markup = renderToStaticMarkup(
      <StyleTab
        palettes={STYLE_COLOR_PALETTES}
        selectedPaletteId="template"
        onSelectPalette={noop}
        style={style}
        onBackgroundUpload={noop}
        onRemoveBackground={noop}
        onLogoUpload={noop}
        onRemoveLogo={noop}
        onLogoPositionChange={noop}
        isBackgroundUploading={false}
        isLogoUploading={false}
        config={{
          showPaletteSection: false,
          showBackgroundSection: false,
          showLogoSection: false,
        }}
      />,
    );

    expect(markup).not.toContain('Color Theme');
    expect(markup).not.toContain('Background');
    expect(markup).not.toContain('Logo');
  });

  it('disables smart sizing, toggles, and drag handles in content tab when configured', () => {
    const controls = resolveContentTabControls(null);
    const elementsMeta = controls.elementsMeta;
    const staticVisibility: Partial<Record<ScheduleElementId, boolean>> = {
      heading: true,
      subtitle: true,
      scheduleDate: true,
      footer: true,
    };

    const markup = renderToStaticMarkup(
      <ContentTab
        visibleElements={DEFAULT_VISIBLE_ELEMENTS}
        hiddenElements={DEFAULT_HIDDEN_ELEMENTS}
        elementsMeta={elementsMeta}
        onReorder={noop}
        onToggleVisibility={noop}
        onOpenFontSettings={noop}
        onOpenColorPicker={noop}
        staticVisibility={staticVisibility}
        onToggleStaticElement={noop}
        onApplySmartSizing={noop}
        isSmartSizing={false}
        config={{
          showSmartTextSizing: false,
          allowReorder: false,
          allowVisibilityToggles: false,
          allowStaticVisibilityToggles: false,
        }}
      />,
    );

    expect(markup).not.toContain('Smart Fit Text');
    expect(markup).not.toContain('Drag to reorder');
    expect(markup).not.toContain('☰');
    expect(markup).not.toContain('Hide ');
  });

  it('keeps classic content tab controls when no overrides are provided', () => {
    const controls = resolveContentTabControls(null);
    const elementsMeta = controls.elementsMeta;
    const staticVisibility: Partial<Record<ScheduleElementId, boolean>> = {
      heading: true,
      subtitle: true,
      scheduleDate: true,
      footer: true,
    };

    const markup = renderToStaticMarkup(
      <ContentTab
        visibleElements={DEFAULT_VISIBLE_ELEMENTS}
        hiddenElements={DEFAULT_HIDDEN_ELEMENTS}
        elementsMeta={elementsMeta}
        onReorder={noop}
        onToggleVisibility={noop}
        onOpenFontSettings={noop}
        onOpenColorPicker={noop}
        staticVisibility={staticVisibility}
        onToggleStaticElement={noop}
        onApplySmartSizing={noop}
        isSmartSizing={false}
      />,
    );

    expect(markup).toContain('Smart Fit Text');
    expect(markup).toContain('Drag to reorder');
    expect(markup).toContain('Hide Class Name');
  });

  it('hides layout tab controls when template config disables them', () => {
    const style = CLASSIC_TEMPLATE_DEFINITION.defaults.createStyle();
    const markup = renderToStaticMarkup(
      <LayoutTab
        style={style}
        onUpdate={noop}
        config={{
          showCornerRadius: false,
          spacingOptions: [],
          layoutOptions: [],
          dividerOptions: [],
          showAccentLinesToggle: false,
          showFooterBarToggle: false,
        }}
      />,
    );

    expect(markup).not.toContain('Corner Radius');
    expect(markup).not.toContain('Spacing &');
    expect(markup).not.toContain('Layout Style');
    expect(markup).not.toContain('Divider Style');
    expect(markup).not.toContain('Accent Lines');
    expect(markup).not.toContain('Footer Bar');
  });

  it('retains classic layout controls when no overrides are provided', () => {
    const style = CLASSIC_TEMPLATE_DEFINITION.defaults.createStyle();
    const markup = renderToStaticMarkup(<LayoutTab style={style} onUpdate={noop} />);

    expect(markup).toContain('Corner Radius');
    expect(markup).toContain('Spacing &');
    expect(markup).toContain('Layout Style');
    expect(markup).toContain('Divider Style');
  });
});
