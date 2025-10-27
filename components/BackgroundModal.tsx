import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import type { Style } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import {
  searchUnsplashPhotos,
  UnsplashPhoto,
} from '../services/unsplash';
import { uploadImage } from '../services/storage';
import XIcon from './icons/XIcon';
import UploadIcon from './icons/UploadIcon';

type CategoryKey =
  | 'all'
  | 'fitness'
  | 'motivation'
  | 'nature'
  | 'minimal'
  | 'dark'
  | 'athletic';

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: Style;
  onApply: (newBgStyle: Partial<Style>) => void;
}

type BackgroundSource = 'unsplash' | 'upload' | 'custom';

interface BackgroundSelection {
  id: string;
  url: string;
  thumbUrl: string;
  source: BackgroundSource;
  attribution?: string;
  photographerName?: string;
  unsplashLink?: string;
  description?: string;
}

interface RecentBackground extends BackgroundSelection {
  timestamp: number;
}

const CATEGORY_QUERIES: Record<CategoryKey, string> = {
  all: 'fitness studio dark background gradient',
  fitness: 'fitness gym workout portrait background',
  motivation: 'motivational athletic poster background',
  nature: 'nature forest calm gradient background',
  minimal: 'minimalist abstract gradient dark background',
  dark: 'dark moody gradient texture background',
  athletic: 'athlete sports action background portrait',
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: 'All',
  fitness: 'Fitness',
  motivation: 'Motivation',
  nature: 'Nature',
  minimal: 'Minimal',
  dark: 'Dark',
  athletic: 'Athletic',
};

const RECENT_STORAGE_KEY = 'recentBackgroundsV2';
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

const withUnsplashParams = (
  url: string,
  params: Record<string, string | number>,
) => {
  try {
    const parsed = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      parsed.searchParams.set(key, String(value));
    });
    return parsed.toString();
  } catch (error) {
    const separator = url.includes('?') ? '&' : '?';
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      query.set(key, String(value));
    });
    return `${url}${separator}${query.toString()}`;
  }
};

const mapUnsplashPhotoToSelection = (photo: UnsplashPhoto): BackgroundSelection => {
  const mainUrl = withUnsplashParams(photo.urls.regular, {
    auto: 'format',
    fit: 'max',
    q: 80,
    w: 1600,
  });
  const thumbUrl = withUnsplashParams(photo.urls.small, {
    auto: 'format',
    fit: 'crop',
    q: 70,
    w: 400,
  });

  return {
    id: photo.id,
    url: mainUrl,
    thumbUrl,
    source: 'unsplash',
    attribution: `Photo by ${photo.user.name} on Unsplash`,
    photographerName: photo.user.name,
    unsplashLink: photo.links.html,
    description: photo.alt_description || undefined,
  };
};

const isValidRecentEntry = (value: unknown): value is RecentBackground => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.url === 'string' &&
    typeof entry.thumbUrl === 'string' &&
    typeof entry.source === 'string' &&
    typeof entry.timestamp === 'number'
  );
};

const useRecentBackgrounds = () => {
  const [recents, setRecents] = useState<RecentBackground[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((item) => {
              if (isValidRecentEntry(item)) {
                return item as RecentBackground;
              }
              if (typeof item === 'string') {
                return {
                  id: item,
                  url: item,
                  thumbUrl: item,
                  source: 'custom' as BackgroundSource,
                  timestamp: Date.now(),
                } satisfies RecentBackground;
              }
              return null;
            })
            .filter((item): item is RecentBackground => Boolean(item));
          setRecents(normalized.slice(0, 8));
        }
      }
    } catch (error) {
      console.error('Failed to parse recent backgrounds', error);
    }
  }, []);

  const addRecent = useCallback((selection: BackgroundSelection) => {
    if (!selection.url) return;
    setRecents((prev) => {
      const next: RecentBackground[] = [
        {
          ...selection,
          timestamp: Date.now(),
        },
        ...prev.filter((item) => item.url !== selection.url),
      ].slice(0, 8);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to persist recent backgrounds', error);
      }
      return next;
    });
  }, []);

  return { recents, addRecent };
};

const BottomSheetBackdrop: React.FC<{ children: React.ReactNode } & {
  onDismiss: (event: React.MouseEvent<HTMLDivElement>) => void;
  isVisible: boolean;
}> = ({ children, onDismiss, isVisible }) => {
  const [render, setRender] = useState(isVisible);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setRender(true);
      const raf = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(raf);
    }
    setAnimateIn(false);
    const timeout = setTimeout(() => setRender(false), 250);
    return () => clearTimeout(timeout);
  }, [isVisible]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 transition-opacity duration-300 ${
        animateIn ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onDismiss}
      role="presentation"
    >
      {children}
    </div>
  );
};

const BackgroundModal: React.FC<BackgroundModalProps> = ({
  isOpen,
  onClose,
  currentStyle,
  onApply,
}) => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [gridItems, setGridItems] = useState<BackgroundSelection[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<BackgroundSelection | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { recents, addRecent } = useRecentBackgrounds();

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isSearchMode = debouncedSearch.trim().length > 0;

  const currentQuery = useMemo(() => {
    if (isSearchMode) {
      return debouncedSearch.trim();
    }
    return CATEGORY_QUERIES[selectedCategory];
  }, [debouncedSearch, isSearchMode, selectedCategory]);

  useEffect(() => {
    setModalRoot(document.getElementById('modal-root'));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsSheetVisible(false);
      setIsDragging(false);
      setDragOffset(0);
      setSearchQuery('');
      setSelectedCategory('all');
      setGridItems([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      setSelectedImage(null);
      document.body.style.overflow = '';
      return;
    }

    setIsSheetVisible(true);
    const existing = currentStyle.bgImage;
    if (existing) {
      setSelectedImage({
        id: `current-${existing}`,
        url: existing,
        thumbUrl: existing,
        source: 'custom',
        attribution: 'Current background',
      });
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentStyle.bgImage, isOpen]);

  const resetAndLoad = useCallback(async () => {
    if (!isOpen || !currentQuery) {
      setGridItems([]);
      setHasMore(false);
      return;
    }
    setLoadingMore(false);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);
    try {
      const response = await searchUnsplashPhotos({
        query: currentQuery,
        page: 1,
        perPage: 12,
        orientation: 'portrait',
        orderBy: isSearchMode ? 'relevant' : 'latest',
      });
      const mapped = response.results.map(mapUnsplashPhotoToSelection);
      setGridItems(mapped);
      setHasMore((response.total_pages ?? 1) > 1);
    } catch (error) {
      if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.');
      } else {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch images from Unsplash.',
        );
      }
      setGridItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [currentQuery, isOpen, isSearchMode]);

  useEffect(() => {
    if (isOpen) {
      resetAndLoad();
    }
  }, [isOpen, resetAndLoad]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingMore || !currentQuery) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const response = await searchUnsplashPhotos({
        query: currentQuery,
        page: nextPage,
        perPage: 12,
        orientation: 'portrait',
        orderBy: isSearchMode ? 'relevant' : 'latest',
      });
      const mapped = response.results.map(mapUnsplashPhotoToSelection);
      setGridItems((prev) => {
        const deduped = [...prev];
        mapped.forEach((item) => {
          if (!deduped.some((existing) => existing.id === item.id)) {
            deduped.push(item);
          }
        });
        return deduped;
      });
      setPage(nextPage);
      setHasMore(nextPage < (response.total_pages ?? nextPage));
    } catch (error) {
      if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.');
      } else {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch additional images.',
        );
      }
    } finally {
      setLoadingMore(false);
    }
  }, [currentQuery, hasMore, isSearchMode, loading, loadingMore, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = contentRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        root,
        rootMargin: '200px 0px',
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  useEffect(() => {
    if (!isOpen) return;
    resetAndLoad();
  }, [debouncedSearch, selectedCategory, resetAndLoad, isOpen]);

  const handleSelect = (selection: BackgroundSelection) => {
    setSelectedImage((prev) =>
      prev?.url === selection.url ? prev : { ...selection },
    );
  };

  const handleDeselect = () => {
    setSelectedImage(null);
  };

  const handleApply = () => {
    if (!selectedImage) return;
    addRecent(selectedImage);
    onApply({
      bgImage: selectedImage.url,
      bgFit: 'cover',
      bgPosition: '50% 50%',
    });
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadError('File is too large. Please choose an image under 10MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const downloadURL = await uploadImage(file);
      const selection: BackgroundSelection = {
        id: `upload-${Date.now()}`,
        url: downloadURL,
        thumbUrl: downloadURL,
        source: 'upload',
        attribution: 'Uploaded image',
        description: file.name,
      };
      setSelectedImage(selection);
      addRecent(selection);
    } catch (error) {
      console.error(error);
      if ((error as Error)?.name === 'NotAllowedError') {
        setUploadError('Permission to access photos was denied.');
      } else {
        setUploadError('Failed to upload image. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (!uploadInputRef.current) return;
    setUploadError(null);
    uploadInputRef.current.value = '';
    uploadInputRef.current.click();
  };

  const handleCategoryChange = (category: CategoryKey) => {
    setSelectedCategory(category);
  };

  const handleHeaderPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        'input, button, textarea, select, [role="button"], [role="textbox"]',
      )
    ) {
      return;
    }
    handleStartDrag(event);
  };

  const handleStartDrag = (event: React.PointerEvent) => {
    dragStartY.current = event.clientY;
    setIsDragging(true);
    setDragOffset(0);
    try {
      sheetRef.current?.setPointerCapture(event.pointerId);
    } catch (error) {
      // Ignore pointer capture errors on unsupported devices.
    }
  };

  const handleDragMove = (event: React.PointerEvent) => {
    if (!isDragging || dragStartY.current == null) return;
    const offset = Math.max(0, event.clientY - dragStartY.current);
    setDragOffset(offset);
  };

  const handleDragEnd = (event: React.PointerEvent) => {
    if (!isDragging) return;
    if (sheetRef.current?.hasPointerCapture(event.pointerId)) {
      sheetRef.current.releasePointerCapture(event.pointerId);
    }
    const shouldClose = dragOffset > 120;
    setIsDragging(false);
    setDragOffset(0);
    if (shouldClose) {
      onClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const showPreview = Boolean(selectedImage);

  const renderGridContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-white/70">
          <p>{error}</p>
          <button
            type="button"
            onClick={resetAndLoad}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!gridItems.length) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center text-sm text-white/70">
          <p>
            {isSearchMode
              ? 'No results found. Try a different search term.'
              : 'No curated images found for this category.'}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          {gridItems.map((item) => {
            const isSelected = selectedImage?.url === item.url;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  isSelected ? handleDeselect() : handleSelect(item)
                }
                className={`group relative overflow-hidden rounded-2xl bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isSelected
                    ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-neutral-950'
                    : 'hover:ring-1 hover:ring-white/30'
                }`}
                aria-pressed={isSelected}
              >
                <img
                  src={item.thumbUrl}
                  alt={item.description || item.attribution || 'Background option'}
                  className={`h-full w-full object-cover transition duration-300 ${
                    isSelected ? 'scale-[1.02]' : 'group-hover:scale-105'
                  }`}
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-500/20" />
                )}
                <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-white bg-indigo-500 text-white'
                        : 'border-white/30 bg-black/40 text-transparent'
                    } transition`}
                  >
                    ✓
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div ref={sentinelRef} className="h-8 w-full" />
        {loadingMore && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-white/70">
            <span className="h-3 w-3 animate-ping rounded-full bg-white/60" />
            Loading more backgrounds…
          </div>
        )}
      </>
    );
  };

  if (!modalRoot) {
    return null;
  }

  return ReactDOM.createPortal(
    <BottomSheetBackdrop
      onDismiss={handleBackdropClick}
      isVisible={isOpen && isSheetVisible}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Select background image"
        className="relative h-[72vh] w-full max-w-3xl rounded-t-3xl border border-white/10 bg-neutral-950/95 shadow-2xl transition-transform duration-300"
        style={{
          transform: isSheetVisible
            ? `translateY(${dragOffset}px)`
            : `translateY(calc(100% + ${dragOffset}px))`,
        }}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div
          className="flex flex-col h-full"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="flex flex-col gap-3 border-b border-white/10 px-5 pb-4 pt-3"
            onPointerDown={handleHeaderPointerDown}
          >
            <div
              className="mx-auto h-1.5 w-12 rounded-full bg-white/20"
              role="presentation"
              onPointerDown={handleStartDrag}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/40">
                    🔍
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search backgrounds…"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none"
                    aria-label="Search Unsplash backgrounds"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="hidden min-h-[44px] items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-indigo-300 transition hover:border-indigo-400 hover:text-indigo-200 sm:flex"
                >
                  <UploadIcon className="h-4 w-4" />
                  Upload
                </button>
              </div>
              <button
                type="button"
                onClick={handleUploadClick}
                className="text-left text-xs font-semibold text-indigo-300 underline-offset-4 hover:underline sm:hidden"
              >
                Or upload your own
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files)}
              />
              {uploadError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {uploadError}
                </div>
              )}
              {isUploading && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="h-2 w-2 animate-ping rounded-full bg-indigo-300" />
                  Uploading image…
                </div>
              )}
            </div>
          </div>

          {showPreview && selectedImage && (
            <div className="px-5 pt-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-black/30">
                <img
                  src={selectedImage.thumbUrl}
                  alt={selectedImage.description || selectedImage.attribution || 'Selected background'}
                  className="h-20 w-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {selectedImage.attribution || 'Selected background'}
                  </p>
                  {selectedImage.description && (
                    <p className="text-xs text-white/60 truncate">
                      {selectedImage.description}
                    </p>
                  )}
                  {selectedImage.source === 'upload' && (
                    <p className="text-xs text-white/50">Uploaded image</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDeselect}
                  className="inline-flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/40 hover:text-white"
                  aria-label="Remove selected background"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {recents.length > 0 && (
            <div className="mt-4 space-y-3 px-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/50">
                <span>Recently Used</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recents.map((item) => {
                  const isSelected = selectedImage?.url === item.url;
                  return (
                    <button
                      key={`${item.id}-${item.timestamp}`}
                      type="button"
                      onClick={() =>
                        isSelected ? handleDeselect() : handleSelect(item)
                      }
                      className={`relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isSelected
                          ? 'border-indigo-400'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <img
                        src={item.thumbUrl}
                        alt={item.attribution || 'Recent background'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-500/20" />
                      )}
                      <div className="pointer-events-none absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/80 bg-black/60 text-xs font-bold text-white">
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 px-5">
            <div className="flex gap-2 overflow-x-auto">
              {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((category) => {
                const isSelected = category === selectedCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                        : 'border-white/15 text-white/70 hover:border-white/40'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {CATEGORY_LABELS[category]}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={contentRef}
            className="mt-4 flex-1 overflow-y-auto px-5 pb-24"
          >
            {renderGridContent()}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-20 h-20 bg-gradient-to-t from-neutral-950 to-transparent" />

          <div className="flex items-center gap-3 border-t border-white/10 bg-neutral-950/90 px-5 py-4">
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[44px] flex-1 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedImage}
              className={`min-h-[44px] flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedImage
                  ? 'bg-indigo-500 text-white hover:brightness-110'
                  : 'cursor-not-allowed bg-white/10 text-white/40'
              }`}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </BottomSheetBackdrop>,
    modalRoot,
  );
};

export default BackgroundModal;

