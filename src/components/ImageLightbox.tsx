import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause, Loader2 } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

// --- Lazy loaded Image Component for Lightbox ---
function LightboxImage({ 
  src, 
  alt, 
  isCurrent, 
  isAdjacent, 
  isPlaying 
}: { 
  src: string; 
  alt: string; 
  isCurrent: boolean; 
  isAdjacent: boolean;
  isPlaying: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Load only when it is active or an adjacent slide (preloading next/prev)
  useEffect(() => {
    if (isCurrent || isAdjacent) {
      setShouldLoad(true);
    }
  }, [isCurrent, isAdjacent]);

  if (!shouldLoad) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3 z-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Memuat Foto...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`max-w-full max-h-full object-contain transition-all duration-700 ease-out ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${isCurrent && isPlaying ? 'scale-105 duration-[4000ms]' : ''}`}
      />
    </div>
  );
}

export default function ImageLightbox({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);


  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && isPlaying && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, images.length]);

  if (!isOpen) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 0 && (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {images.map((img, idx) => {
            const isCurrent = idx === currentIndex;
            const isAdjacent = Math.abs(idx - currentIndex) === 1 ||
              (currentIndex === 0 && idx === images.length - 1) ||
              (currentIndex === images.length - 1 && idx === 0);

            return (
              <div 
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-center ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                <LightboxImage
                  src={img}
                  alt={`Preview ${idx}`}
                  isCurrent={isCurrent}
                  isAdjacent={isAdjacent}
                  isPlaying={isPlaying}
                />
              </div>
            );
          })}
        </div>
      )}

      {images.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 px-6 py-3 rounded-full z-50">
            <button onClick={togglePlay} className="text-white hover:text-emerald-400 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <div className="flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
