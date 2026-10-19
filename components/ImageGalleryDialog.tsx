import React, { useState, useEffect, useRef } from 'react';
import {
  PhotoIcon,
  ArrowUpTrayIcon,
  FolderOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface GalleryItem {
  id: string;
  src: string;
  name: string;
  createdAt: number;
}

interface ImageGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (src: string) => void;
}

const STORAGE_KEY = 'tajmir_saved_gallery_images';

// Initial starter presets so users always have items to choose from
const DEFAULT_PRESETS: GalleryItem[] = [
  {
    id: 'preset-logo-1',
    src: '/logo_1.png',
    name: 'Tajmir Shield (Logo 1)',
    createdAt: 1,
  },
  {
    id: 'preset-logo-2',
    src: '/logo_2.png',
    name: 'Tajmir Shield (Logo 2)',
    createdAt: 2,
  },
  {
    id: 'preset-logo-3',
    src: '/logo_3.png',
    name: 'Tajmir Shield (Logo 3)',
    createdAt: 3,
  },
  {
    id: 'preset-corner-dec',
    src: 'https://tajmir-images.pages.dev/letter%20d.png',
    name: 'Decorative Gold Corner',
    createdAt: 4,
  }
];

export const ImageGalleryDialog: React.FC<ImageGalleryDialogProps> = ({
  isOpen,
  onClose,
  onSelectImage,
}) => {
  const [images, setImages] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved gallery images:', e);
    }
    return DEFAULT_PRESETS;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const browseInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  const saveImages = (updated: GalleryItem[]) => {
    setImages(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  // Auto-select first image when opening
  useEffect(() => {
    if (isOpen) {
      if (images.length > 0 && !selectedId) {
        setSelectedId(images[0].id);
      }
    }
  }, [isOpen, images, selectedId]);

  if (!isOpen) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const newSrc = e.target.result as string;
        const newItem: GalleryItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          src: newSrc,
          name: file.name.replace(/\.[^/.]+$/, ''),
          createdAt: Date.now(),
        };

        const updated = [newItem, ...images];
        saveImages(updated);
        setSelectedId(newItem.id);

        // Scroll to the beginning to highlight new image
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDeleteImage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = images.filter((img) => img.id !== id);
    saveImages(updated);
    if (selectedId === id) {
      setSelectedId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleConfirm = () => {
    const selected = images.find((img) => img.id === selectedId);
    if (selected) {
      onSelectImage(selected.src);
      onClose();
    }
  };

  const handleCardDoubleClick = (item: GalleryItem) => {
    setSelectedId(item.id);
    onSelectImage(item.src);
    onClose();
  };

  const selectedItem = images.find((img) => img.id === selectedId);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <PhotoIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Image Gallery</h3>
              <p className="text-xs text-gray-500">Select an uploaded image or add a new one to the layout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6">

          {/* Section: Uploaded Images Slider (ABOVE THE 2 BUTTONS) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Uploaded Images ({images.length})
              </span>
              {images.length > 3 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleScroll('left')}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                    title="Slide left"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleScroll('right')}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                    title="Slide right"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Sliding Carousel Track */}
            <div className="relative group">
              {images.length === 0 ? (
                <div className="w-full h-44 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50/50">
                  <PhotoIcon className="w-10 h-10 stroke-1 text-gray-300" />
                  <p className="text-xs font-medium">No images uploaded yet</p>
                  <p className="text-[11px] text-gray-400">Click &quot;Upload Image&quot; or &quot;Browse Image&quot; below to add one</p>
                </div>
              ) : (
                <div
                  ref={scrollContainerRef}
                  className="flex items-center gap-3.5 overflow-x-auto py-2 px-1 scroll-smooth no-scrollbar scrollbar-none select-none"
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {images.map((item) => {
                    const isSelected = item.id === selectedId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        onDoubleClick={() => handleCardDoubleClick(item)}
                        style={{ scrollSnapAlign: 'start' }}
                        className={`relative flex-shrink-0 w-36 h-36 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-2 overflow-hidden ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/30 shadow-md scale-[1.02]'
                            : 'border-gray-200 bg-gray-50/80 hover:border-gray-300 hover:bg-white hover:shadow-sm'
                        }`}
                        title={`${item.name} (Double click to insert)`}
                      >
                        {/* Selected Indicator Badge */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 z-10 text-blue-600 bg-white rounded-full shadow-xs">
                            <CheckCircleIcon className="w-5 h-5 fill-blue-600 text-white" />
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteImage(e, item.id)}
                          className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-md bg-white/90 hover:bg-red-50 hover:text-red-600 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xs cursor-pointer"
                          title="Delete image"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Image Preview Thumbnail */}
                        <div className="w-full flex-grow flex items-center justify-center overflow-hidden">
                          <img
                            src={item.src}
                            alt={item.name}
                            className="max-h-24 max-w-full object-contain pointer-events-none drop-shadow-xs"
                            crossOrigin="anonymous"
                          />
                        </div>

                        {/* Image Name Label */}
                        <div className="w-full mt-1 text-center">
                          <span className="text-[11px] font-medium text-gray-700 truncate block px-1">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section: The 2 Action Buttons (BELOW THE SLIDER) */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={uploadInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={browseInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            {/* Button 1: Upload Image */}
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <ArrowUpTrayIcon className="w-4 h-4 stroke-2" />
              <span>Upload Image</span>
            </button>

            {/* Button 2: Browse Image */}
            <button
              type="button"
              onClick={() => browseInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all border border-gray-200 cursor-pointer"
            >
              <FolderOpenIcon className="w-4 h-4 stroke-2 text-gray-600" />
              <span>Browse Image</span>
            </button>
          </div>

        </div>

        {/* Modal Footer (Confirmation / Cancel) */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500 truncate max-w-[280px]">
            {selectedItem ? (
              <span>Selected: <strong className="text-gray-800">{selectedItem.name}</strong></span>
            ) : (
              <span>Select an image above</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedId}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              Insert Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
