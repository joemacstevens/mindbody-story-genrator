import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { Style } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { searchUnsplashPhotos, UnsplashPhoto } from '../services/unsplash';
import { uploadImage } from '../services/storage';
import XIcon from './icons/XIcon';
import UploadIcon from './icons/UploadIcon';

type Tab = 'upload' | 'unsplash' | 'url';
interface TempStyle {
  bgImage?: string;
  bgFit?: 'cover' | 'contain';
  bgPosition?: string;
  overlayColor?: string;
  bgBlur?: number;
}

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: Style;
  onApply: (newBgStyle: Partial<Style>) => void;
}

const useRecentBackgrounds = () => {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedRecents = localStorage.getItem('recentBackgrounds');
      if (storedRecents) {
        setRecents(JSON.parse(storedRecents));
      }
    } catch (error) {
      console.error("Failed to parse recent backgrounds from localStorage", error);
    }
  }, []);

  const addRecent = (url: string) => {
    if (!url) return;
    setRecents(prev => {
      const newRecents = [url, ...prev.filter(u => u !== url)].slice(0, 6);
      localStorage.setItem('recentBackgrounds', JSON.stringify(newRecents));
      return newRecents;
    });
  };

  return { recents, addRecent };
};

const BackgroundModal: React.FC<BackgroundModalProps> = ({ isOpen, onClose, currentStyle, onApply }) => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('unsplash');
  const [tempStyle, setTempStyle] = useState<TempStyle>({});
  const [unsplashQuery, setUnsplashQuery] = useState('fitness');
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashError, setUnsplashError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { recents, addRecent } = useRecentBackgrounds();
  const debouncedQuery = useDebounce(unsplashQuery, 500);

  const imagePreviewRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setModalRoot(document.getElementById('modal-root'));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTempStyle({
        bgImage: currentStyle.bgImage,
        bgFit: currentStyle.bgFit,
        bgPosition: currentStyle.bgPosition,
        overlayColor: currentStyle.overlayColor,
        bgBlur: currentStyle.bgBlur,
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, currentStyle]);

  useEffect(() => {
    const fetchUnsplash = async () => {
      if (!debouncedQuery) {
        setUnsplashResults([]);
        return;
      }
      setUnsplashLoading(true);
      setUnsplashError(null);
      try {
        const data = await searchUnsplashPhotos(debouncedQuery);
        setUnsplashResults(data.results);
      } catch (error) {
        setUnsplashError(error.message || 'Failed to fetch images from Unsplash.');
      } finally {
        setUnsplashLoading(false);
      }
    };
    fetchUnsplash();
  }, [debouncedQuery]);

  const handleApply = () => {
    addRecent(tempStyle.bgImage!);
    onApply(tempStyle);
  };

  const handleClear = () => {
    onApply({
        bgImage: '',
        bgFit: 'cover',
        bgPosition: '50% 50%',
        overlayColor: 'rgba(0,0,0,0)',
        bgBlur: 0,
    });
  };
  
  const handleSelectImage = (url: string) => {
    setTempStyle(prev => ({ ...prev, bgImage: url, bgPosition: '50% 50%' }));
  };

  const handleFileChange = async (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        setUploadError('File is too large. Please upload an image under 20MB.');
        return;
      }

      setIsUploading(true);
      setUploadError(null);
      try {
        const downloadURL = await uploadImage(file);
        handleSelectImage(downloadURL);
      } catch (error) {
        console.error(error);
        setUploadError('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUrlLoad = () => {
    setUrlError(null);
    if (!urlInput.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
      setUrlError('Please enter a valid image URL (e.g., ending in .jpg, .png).');
      return;
    }
    const img = new Image();
    img.src = urlInput;
    img.onload = () => handleSelectImage(urlInput);
    img.onerror = () => setUrlError('Could not load image from this URL.');
  };
  
  const handlePanStart = (e: React.MouseEvent) => {
    if (!imagePreviewRef.current) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    imagePreviewRef.current.style.cursor = 'grabbing';
  };

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current || !imagePreviewRef.current) return;
    const [bgX, bgY] = (tempStyle.bgPosition || '50% 50%').split(' ').map(v => parseFloat(v));
    const dx = (e.clientX - panStart.current.x) / imagePreviewRef.current!.clientWidth * 100;
    const dy = (e.clientY - panStart.current.y) / imagePreviewRef.current!.clientHeight * 100;

    const newX = Math.max(0, Math.min(100, bgX + dx));
    const newY = Math.max(0, Math.min(100, bgY + dy));

    setTempStyle(prev => ({ ...prev, bgPosition: `${newX}% ${newY}%` }));
    panStart.current = { x: e.clientX, y: e.clientY };
  }, [tempStyle.bgPosition]);

  const handlePanEnd = useCallback(() => {
    isPanning.current = false;
    if (imagePreviewRef.current) {
        imagePreviewRef.current.style.cursor = 'grab';
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handlePanMove);
    document.addEventListener('mouseup', handlePanEnd);
    return () => {
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
    };
  }, [handlePanMove, handlePanEnd]);

  if (!isOpen || !modalRoot) return null;

  const modalContent = (
    <div 
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-50 flex items-end md:items-center justify-center p-0 md:p-8" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
    >
      <div 
        className="bg-slate-900 text-slate-100 w-full max-w-3xl md:max-w-6xl h-[92vh] md:h-[95vh] rounded-t-3xl md:rounded-3xl border border-white/10 shadow-[0_30px_80px_rgba(2,6,23,0.9)] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-3">
          <span className="w-12 h-1.5 rounded-full bg-white/30" />
        </div>
        <header className="shrink-0 flex items-center justify-between px-5 py-4 md:p-5 border-b border-white/10 bg-slate-900 sticky top-0 z-10">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">Background</p>
            <h2 className="text-2xl font-bold">Upload artwork</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close modal">
            <XIcon className="w-6 h-6"/>
          </button>
        </header>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row p-4 gap-4 overflow-y-auto lg:overflow-hidden">
            {/* Main Content Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-950/50 rounded-2xl p-4 border border-white/5 min-h-[260px]">
              {!tempStyle.bgImage ? (
                  <div className="text-center text-slate-500">
                      <p>Select an image to see a preview</p>
                  </div>
              ) : (
                  <div className="w-full max-w-[320px] aspect-[9/16] rounded-2xl overflow-hidden relative bg-slate-950">
                      <div 
                          ref={imagePreviewRef}
                          className="w-full h-full"
                          style={{ 
                              backgroundImage: `url(${tempStyle.bgImage})`,
                              backgroundSize: tempStyle.bgFit as 'cover' | 'contain',
                              backgroundPosition: tempStyle.bgPosition,
                              cursor: 'grab'
                          }}
                          onMouseDown={handlePanStart}
                      />
                      <div className="absolute inset-0 pointer-events-none" style={{
                          backgroundColor: tempStyle.overlayColor || 'transparent',
                          backdropFilter: `blur(${(tempStyle.bgBlur || 0)}px)`
                      }}/>
                  </div>
              )}
            </div>

            {/* Controls */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-slate-950/40 rounded-2xl border border-white/5 overflow-x-auto">
                  {(['upload', 'unsplash', 'url'] as Tab[]).map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full py-2 px-4 rounded-xl text-sm font-semibold transition ${
                        activeTab === tab ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-300 hover:bg-white/5'
                      }`}>
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                  ))}
              </div>

              {/* Tab Content */}
              <div className="flex-grow bg-slate-950/30 rounded-2xl p-4 overflow-y-auto border border-white/5">
                {activeTab === 'upload' && (
                    <div 
                        className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/15 rounded-2xl p-8 text-slate-300 hover:bg-white/5 hover:border-white/40 transition-colors"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); handleFileChange(e.dataTransfer.files); }}
                    >
                      {isUploading ? (
                          <div className="text-center">
                            <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="font-semibold">Uploading...</p>
                          </div>
                      ) : (
                        <>
                          <UploadIcon className="w-16 h-16 mb-4"/>
                          <p className="font-semibold">Drag & drop an image</p>
                          <p className="text-sm my-2">or</p>
                          <label className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-full cursor-pointer hover:brightness-110">
                              Choose file
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e.target.files)}/>
                          </label>
                          {uploadError && <p className="text-red-400 text-sm mt-4">{uploadError}</p>}
                        </>
                      )}
                    </div>
                )}
                {activeTab === 'unsplash' && (
                    <div className="flex flex-col h-full">
                        <input
                            type="text"
                            value={unsplashQuery}
                            onChange={e => setUnsplashQuery(e.target.value)}
                            placeholder="Search Unsplash for portrait photos..."
                            className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <div className="flex-grow mt-4 overflow-y-auto">
                            {unsplashLoading && <p>Loading...</p>}
                            {unsplashError && <p className="text-red-400">{unsplashError}</p>}
                            <div className="grid grid-cols-3 gap-2">
                                {unsplashResults.map(photo => (
                                    <button
                                        key={photo.id}
                                        onClick={() => handleSelectImage(photo.urls.regular)}
                                        className="aspect-[9/16] bg-gray-700 rounded-md overflow-hidden group relative"
                                    >
                                        <img
                                            src={`${photo.urls.small}&fit=crop&w=200&h=356`}
                                            alt={photo.alt_description || photo.user.name}
                                            loading="lazy"
                                            onLoad={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.opacity = '1';
                                            }}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                // Try the raw URL as fallback
                                                if (!target.src.includes('?fallback')) {
                                                    target.src = photo.urls.thumb + '?fallback=1';
                                                } else {
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent && !parent.querySelector('.fallback-text')) {
                                                        const div = document.createElement('div');
                                                        div.className = 'fallback-text flex items-center justify-center h-full text-xs text-gray-400';
                                                        div.textContent = 'Image unavailable';
                                                        parent.appendChild(div);
                                                    }
                                                }
                                            }}
                                            style={{ opacity: 0, transition: 'opacity 0.3s' }}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                 {activeTab === 'url' && (
                    <div className="space-y-4">
                        <label className="font-semibold">Image URL</label>
                        <div className="flex gap-2">
                           <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." className="flex-grow p-2 rounded-md bg-gray-700 border border-gray-600"/>
                           <button onClick={handleUrlLoad} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">Load</button>
                        </div>
                        {urlError && <p className="text-red-400 text-sm">{urlError}</p>}
                    </div>
                )}
            </div>

            {/* Adjustments */}
            <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                <h3 className="font-bold text-lg">Adjustments</h3>
                 <div>
                    <label className="block text-sm font-medium">Fit / Fill</label>
                    <div className="flex gap-2 mt-1">
                        <button onClick={() => setTempStyle(p => ({...p, bgFit: 'contain'}))} className={`w-full py-1 rounded-md text-sm ${tempStyle.bgFit === 'contain' ? 'bg-indigo-600' : 'bg-gray-700'}`}>Fit</button>
                        <button onClick={() => setTempStyle(p => ({...p, bgFit: 'cover'}))} className={`w-full py-1 rounded-md text-sm ${tempStyle.bgFit === 'cover' ? 'bg-indigo-600' : 'bg-gray-700'}`}>Fill</button>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Overlay</label>
                        <input type="color" value={(tempStyle.overlayColor || 'rgba(0,0,0,0)').split(',').length > 3 ? `rgb(${tempStyle.overlayColor?.split(',').slice(0,3).join(',').replace('rgba(', '')})` : '#000000'} onChange={e => {
                            const newAlpha = tempStyle.overlayColor?.split(',')[3]?.replace(')', '') || '0.5';
                            const r = parseInt(e.target.value.slice(1,3), 16);
                            const g = parseInt(e.target.value.slice(3,5), 16);
                            const b = parseInt(e.target.value.slice(5,7), 16);
                            setTempStyle(p => ({...p, overlayColor: `rgba(${r},${g},${b},${newAlpha})`}));
                        }} className="w-full h-8 p-1 border-gray-600 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Blur: {tempStyle.bgBlur || 0}px</label>
                        <input type="range" min="0" max="20" step="1" value={tempStyle.bgBlur || 0} onChange={e => setTempStyle(p => ({...p, bgBlur: parseInt(e.target.value, 10)}))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                 </div>
            </div>
          </div>
        </div>

        <footer className="shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border-t border-gray-700 bg-slate-900">
            <div className="w-full md:w-auto">
                 <h4 className="text-sm font-bold mb-2">Recent</h4>
                 <div className="flex gap-2 overflow-x-auto pr-2">
                    {recents.map(url => (
                        <button
                            key={url}
                            onClick={() => handleSelectImage(url)}
                            className="w-16 h-16 rounded-md bg-gray-700 overflow-hidden border-2 border-transparent hover:border-indigo-500 flex-shrink-0"
                        >
                             <img src={url} className="w-full h-full object-cover"/>
                        </button>
                    ))}
                 </div>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                <button onClick={handleClear} className="text-sm font-semibold text-gray-400 hover:text-white w-full sm:w-auto text-center">Clear Background</button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button onClick={onClose} className="py-2 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold w-full sm:w-auto">Cancel</button>
                  <button onClick={handleApply} className="py-2 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-semibold w-full sm:w-auto">Apply</button>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default BackgroundModal;
