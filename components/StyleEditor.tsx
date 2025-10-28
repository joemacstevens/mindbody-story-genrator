import React, { useState, Fragment } from 'react';
import type { Style, TemplateId, AppSettings, ColorPalette } from '../types';
import { DEFAULT_APP_SETTINGS, MOCK_SCHEDULE, COLOR_PALETTES } from '../constants';
import BackgroundModal from './BackgroundModal';
import { uploadImage } from '../services/storage';
import XIcon from './icons/XIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import StoryRenderer from './StoryRenderer';

type EditorTab = 'Templates' | 'Theme';

interface StyleEditorProps {
  currentStyle: Style;
  onChange: (newStyle: Style) => void;
  onSave: () => Promise<void>;
  activeTemplateId: TemplateId;
  onTemplateSelect: (templateId: TemplateId) => void;
  isSheetOpen: boolean;
  onSheetClose: () => void;
  onReset: () => void;
  allConfigs: AppSettings['configs'];
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; icon: string; isOpen: boolean; onToggle: () => void; }> = ({ title, children, icon, isOpen, onToggle }) => {
    return (
        <div className="border-t border-gray-200 dark:border-gray-700">
            <button
                type="button"
                className="flex justify-between items-center w-full py-3 text-left font-semibold"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <span>{title}</span>
                </span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="pb-4 space-y-4">{children}</div>}
        </div>
    );
};

const StyleEditor: React.FC<StyleEditorProps> = ({ currentStyle, onChange, onSave, activeTemplateId, onTemplateSelect, isSheetOpen, onSheetClose, onReset, allConfigs }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [desktopActiveTab, setDesktopActiveTab] = useState<EditorTab>('Theme');
  const [sheetActiveTab, setSheetActiveTab] = useState<EditorTab>('Theme');
  const [openSection, setOpenSection] = useState<string | null>(null);

  const templates = allConfigs ? Object.entries(allConfigs).map(([id, style]) => {
    if (!style) return null;
    return {
      id: id as TemplateId,
      name: id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      style,
    };
  }).filter(Boolean) as { id: TemplateId; name: string; style: Style }[] : [];

  const fontOptions = [
    { name: "Inter", value: "Inter, system-ui, sans-serif" },
    { name: "Lexend", value: "'Lexend', sans-serif" },
    { name: "Montserrat", value: "'Montserrat', sans-serif" },
    { name: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;

    if (type === 'range') {
      newValue = parseFloat(value);
    } else if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked;
    }
    onChange({ ...currentStyle, [name]: newValue });
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Logo file is too large. Please upload an image under 5MB.');
        return;
      }
      setIsUploadingLogo(true);
      try {
        const downloadURL = await uploadImage(file);
        onChange({ ...currentStyle, logoUrl: downloadURL });
      } catch (error) {
        console.error(error);
        alert('Failed to upload logo. Please try again.');
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await onSave();
    setToastMessage('Theme saved successfully.');
    setTimeout(() => setToastMessage(''), 3000);
  };
  
  const handleBackgroundApply = (newBgStyle: Partial<Style>) => {
    onChange({ ...currentStyle, ...newBgStyle });
    setIsModalOpen(false);
  };
  
  const handlePaletteChange = (paletteColors: ColorPalette['colors']) => {
    onChange({ ...currentStyle, ...paletteColors });
  };

  const ContentSection = () => (
    <div className="space-y-4">
      <input type="text" name="heading" placeholder="Heading" value={currentStyle.heading} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm" />
      <input type="text" name="subtitle" placeholder="Subtitle (optional)" value={currentStyle.subtitle} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm" />
      <input type="text" name="footer" placeholder="Footer" value={currentStyle.footer} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm" />
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
            <span>Logo</span>
            {currentStyle.logoUrl && <button type="button" onClick={() => onChange({...currentStyle, logoUrl: ''})} className="text-xs text-red-500 hover:underline">Remove</button>}
        </label>
        <input type="file" id="logoUrl" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 mt-1" disabled={isUploadingLogo}/>
        {isUploadingLogo && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
        {currentStyle.logoUrl && !isUploadingLogo && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <img src={currentStyle.logoUrl} alt="Logo Preview" className="h-12 w-auto object-contain bg-gray-200 dark:bg-gray-700 p-1 rounded" />
            <div>
              <label htmlFor="logoPosition" className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
              <select id="logoPosition" name="logoPosition" value={currentStyle.logoPosition} onChange={handleChange} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm">
                <option value="top-left">Top Left</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="center">Center</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
            <div>
              <label htmlFor="logoSize" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Size</span>
                <span>{currentStyle.logoSize || 100}%</span>
              </label>
              <input type="range" id="logoSize" name="logoSize" min="50" max="200" step="5" value={currentStyle.logoSize || 100} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-1" />
            </div>
            <div>
              <label htmlFor="logoPadding" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Padding</span>
                <span>{currentStyle.logoPadding}px</span>
              </label>
              <input type="range" id="logoPadding" name="logoPadding" min="0" max="200" step="4" value={currentStyle.logoPadding} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const TypographySection = () => (
     <div className="space-y-4">
      <select name="fontFamily" value={currentStyle.fontFamily} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm">
        {fontOptions.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
      </select>
      <select name="headingWeight" value={currentStyle.headingWeight} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm">
        <option value="400">Regular</option><option value="500">Medium</option><option value="700">Bold</option><option value="900">Black</option>
      </select>
      <div>
        <label className="text-sm">Body Size: {currentStyle.bodySize}px</label>
        <input type="range" name="bodySize" min="24" max="48" value={currentStyle.bodySize} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
      </div>
    </div>
  );

  const ColorsSection = () => {
    const colorLabels: Record<string, string> = {
      backgroundColor: 'Background',
      cardBackgroundColor: 'Card Background',
      textColorPrimary: 'Main Text',
      textColorSecondary: 'Details',
      accent: 'Accent',
    };
    
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Palettes</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {COLOR_PALETTES.map((palette) => (
              <button
                key={palette.name}
                type="button"
                onClick={() => handlePaletteChange(palette.colors)}
                className="p-2 rounded-lg text-left transition-all border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <p className="text-xs font-semibold mb-2">{palette.name}</p>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: palette.colors.backgroundColor, border: `1px solid ${palette.colors.textColorSecondary}` }} />
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: palette.colors.textColorPrimary }} />
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: palette.colors.textColorSecondary }} />
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: palette.colors.accent }} />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {(['backgroundColor', 'cardBackgroundColor', 'textColorPrimary', 'textColorSecondary', 'accent'] as const).map(color => (
                <div key={color} className="flex items-center justify-between">
                    <label className="text-sm">{colorLabels[color]}</label>
                    <input type="color" name={color} value={currentStyle[color]} onChange={handleChange} className="w-8 h-8 rounded border-gray-300 dark:border-gray-600" />
                </div>
            ))}
        </div>
      </div>
    );
  };

  const LayoutSection = () => {
    const cornerRadiusMap = ['none', 'sm', 'md', 'lg', '2xl'];
    const radiusValue = cornerRadiusMap.indexOf(currentStyle.cornerRadius || '2xl');
    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRadius = cornerRadiusMap[parseInt(e.target.value, 10)];
        onChange({ ...currentStyle, cornerRadius: newRadius as Style['cornerRadius'] });
    };

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full text-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-opacity"
            >
                Change Background
            </button>
            <div className="flex items-center justify-between">
                <label className="text-sm">Accent Lines</label>
                <input type="checkbox" name="accentLines" checked={currentStyle.accentLines} onChange={handleChange} className="rounded text-indigo-500" />
            </div>
            <div className="flex items-center justify-between">
                <label className="text-sm">Footer Bar</label>
                <input type="checkbox" name="footerBar" checked={currentStyle.footerBar} onChange={handleChange} className="rounded text-indigo-500" />
            </div>
            <div>
              <label className="text-sm">Corner Radius</label>
              <input type="range" min="0" max="4" value={radiusValue} onChange={handleRadiusChange} className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
            </div>
            <div>
              <label className="text-sm">Divider Style</label>
              <select name="dividerStyle" value={currentStyle.dividerStyle} onChange={handleChange} className="w-full mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm">
                  <option value="none">None</option><option value="thin">Thin</option><option value="thick">Thick</option><option value="dotted">Dotted</option>
              </select>
            </div>
        </div>
    );
  };

  const TemplatesTabContent = () => (
    <div className="px-4 pt-4 pb-32 space-y-4">
        <div className="grid grid-cols-1 gap-4">
            {templates.map(template => (
                <button
                    key={template.id}
                    type="button"
                    onClick={() => onTemplateSelect(template.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all border-2 ${activeTemplateId === template.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                    <p className="font-semibold text-center mb-2">{template.name}</p>
                    <div className="w-[135px] h-[240px] mx-auto overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 shadow-inner pointer-events-none bg-gray-500">
                        <div style={{ transform: 'scale(0.125)', transformOrigin: 'top left' }}>
                            <StoryRenderer
                                templateId={template.id}
                                style={template.style}
                                schedule={MOCK_SCHEDULE}
                                isFullSize={false}
                            />
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
  );

  const DesktopThemeEditor = () => (
    <div className="p-4 space-y-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4"><h3 className="font-semibold flex items-center gap-3"><span className="text-xl">📝</span> Content</h3><div className="mt-2"><ContentSection /></div></div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4"><h3 className="font-semibold flex items-center gap-3"><span className="text-xl">🔠</span> Typography</h3><div className="mt-2"><TypographySection /></div></div>
      <CollapsibleSection
        icon="🌈"
        title="Colors"
        isOpen={openSection === 'Colors'}
        onToggle={() => setOpenSection(prev => prev === 'Colors' ? null : 'Colors')}
      >
        <ColorsSection />
      </CollapsibleSection>
      <CollapsibleSection
        icon="⬛"
        title="Layout & Details"
        isOpen={openSection === 'Layout & Details'}
        onToggle={() => setOpenSection(prev => prev === 'Layout & Details' ? null : 'Layout & Details')}
      >
        <LayoutSection />
      </CollapsibleSection>
    </div>
  );

  const MobileThemeEditor = () => (
    <div className="p-4 pb-32 space-y-6">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4"><h3 className="text-lg font-bold mb-3">📝 Content</h3> <ContentSection /></div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4"><h3 className="text-lg font-bold mb-3">🔠 Typography</h3> <TypographySection /></div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4"><h3 className="text-lg font-bold mb-3">🌈 Colors</h3> <ColorsSection /></div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4"><h3 className="text-lg font-bold mb-3">⬛ Layout & Details</h3> <LayoutSection /></div>
    </div>
  );

  // When isSheetOpen is false and we're on mobile, render as full-page content
  const isInlineMode = !isSheetOpen && typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <>
      {/* Inline Full-Page Editor (for mobile tab view) */}
      {isInlineMode && (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-bold">Style Editor</h2>
          </div>
          <div className="p-2 border-b dark:border-gray-700 flex-shrink-0 flex gap-2">
            {(['Templates', 'Theme'] as EditorTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setSheetActiveTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-semibold transition-colors ${
                  sheetActiveTab === tab ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
            <div className="flex-grow overflow-y-auto">
              {sheetActiveTab === 'Templates' && <TemplatesTabContent />}
              {sheetActiveTab === 'Theme' && <MobileThemeEditor />}
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex-shrink-0 flex items-center justify-between gap-2">
              <button type="button" onClick={onReset} className="py-2 px-4 rounded-md text-sm font-semibold border border-gray-300 dark:border-gray-600">
                Reset
              </button>
              <button type="submit" className="py-2 px-4 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex-grow">
                Save Theme
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-12' : 'w-80'}`}>
        <div className="relative w-full h-full flex flex-col">
            <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="absolute top-16 -left-4 z-10 w-8 h-16 bg-gray-700 hover:bg-gray-600 text-white rounded-l-lg flex items-center justify-center">
                <ChevronRightIcon className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
            {!isSidebarCollapsed && (
                <>
                    <div className="p-4 border-b dark:border-gray-700 flex-shrink-0"><h2 className="text-xl font-bold">Style Editor</h2></div>
                    <div className="p-2 border-b dark:border-gray-700 flex-shrink-0 flex gap-2">
                        {(['Templates', 'Theme'] as EditorTab[]).map(tab => (
                            <button key={tab} onClick={() => setDesktopActiveTab(tab)} className={`flex-1 py-1.5 px-3 rounded-md text-sm font-semibold transition-colors ${desktopActiveTab === tab ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{tab}</button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                        <div className="flex-grow overflow-y-auto">
                            {desktopActiveTab === 'Templates' && <TemplatesTabContent />}
                            {desktopActiveTab === 'Theme' && <DesktopThemeEditor />}
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
                            <button type="submit" className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Save Theme</button>
                        </div>
                    </form>
                </>
            )}
        </div>
      </aside>

      {/* Mobile Bottom Sheet */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isSheetOpen ? 'bg-black/60' : 'bg-transparent pointer-events-none'}`} onClick={onSheetClose}>
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col transform transition-transform duration-300 ${isSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="style-editor-heading">
          <header className="p-4 border-b dark:border-gray-700 flex-shrink-0 sticky top-0 bg-white dark:bg-gray-900 z-10">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3"></div>
            <div className="flex justify-between items-center">
              <h2 id="style-editor-heading" className="text-xl font-bold">Style Editor</h2>
              <button onClick={onSheetClose} aria-label="Close Style Editor"><XIcon className="w-6 h-6" /></button>
            </div>
            <div className="overflow-x-auto whitespace-nowrap mt-4 -mb-4 border-b dark:border-gray-700">
                {(['Templates', 'Theme'] as EditorTab[]).map(tab => (
                    <button key={tab} onClick={() => setSheetActiveTab(tab)} className={`py-2 px-3 text-sm font-semibold ${sheetActiveTab === tab ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500'}`}>{tab}</button>
                ))}
            </div>
          </header>
          <div className="flex-grow overflow-y-auto">
            {sheetActiveTab === 'Templates' && <TemplatesTabContent />}
            {sheetActiveTab === 'Theme' && <MobileThemeEditor />}
          </div>
          <footer className="p-4 border-t dark:border-gray-700 flex-shrink-0 flex items-center justify-between gap-2">
            <button type="button" onClick={onReset} className="py-2 px-4 rounded-md text-sm font-semibold border border-gray-300 dark:border-gray-600">Reset</button>
            <button type="button" onClick={onSheetClose} className="py-2 px-4 rounded-md text-sm font-semibold bg-gray-200 dark:bg-gray-700">Apply</button>
            <button type="button" onClick={() => handleSubmit()} className="py-2 px-4 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex-grow">Save Theme</button>
          </footer>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white py-2 px-4 rounded-full text-sm shadow-lg z-50">
            {toastMessage}
        </div>
      )}

      <BackgroundModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currentStyle={currentStyle} onApply={handleBackgroundApply} />
    </>
  );
};

export default StyleEditor;
