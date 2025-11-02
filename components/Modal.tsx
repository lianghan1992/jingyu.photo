// Fix: Corrected the React import statement by removing the invalid 'a as React,' part.
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { MediaItem, ImageMetadata, VideoMetadata } from '../types';
import {
  CloseIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  HeartIcon,
  HeartSolidIcon,
  DownloadIcon,
  InfoIcon,
  TagIcon
} from './Icons';
import { fetchAuthenticatedBlobUrl } from '../services/api';

// To satisfy TypeScript, since hls.js is loaded from a script tag.
declare const Hls: any;

// Interaction thresholds
const SWIPE_THRESHOLD = 50; // Min distance in px to trigger navigation
const DISMISS_THRESHOLD = 80; // Min horizontal distance to dismiss
const TAP_MAX_DELTA = 10;
const TAP_MAX_DURATION = 300;
const HINT_STORAGE_KEY = 'jingyu-today-swipe-hint-shown';


interface ModalProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onToggleFavorite: (uid: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const getSlideStyle = (position: -1 | 0 | 1, dragOffset: number, isDragging: boolean): React.CSSProperties => {
  const baseTranslate = position * 100;
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: `translateY(calc(${baseTranslate}% + ${dragOffset}px))`,
    transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem', // p-1
  };
};

const MetadataRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="truncate text-slate-200">{value}</span>
    </div>
  );
};

const DetailsPanelContent: React.FC<{ item: MediaItem }> = ({ item }) => {
    const formattedDate = item.mediaCreatedAt
    ? new Date(item.mediaCreatedAt.replace(' ', 'T')).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '未知日期';

  const metadata = item.mediaMetadata;
  const isImage = item.fileType === 'image';
  const imageMeta = isImage ? (metadata as ImageMetadata) : null;
  const videoMeta = !isImage ? (metadata as VideoMetadata) : null;
  
  const formatDuration = (seconds: number | undefined) => {
    if (seconds === undefined) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 md:hidden" aria-hidden="true" />
      <h2 className="text-xl font-bold text-slate-100 mb-1">{item.aiTitle || item.fileName}</h2>
      <p className="text-sm text-slate-400 mb-4">{formattedDate}</p>
      
      {item.aiTags && item.aiTags.length > 0 && (
          <div className="mb-6">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 mb-2">
                  <TagIcon className="w-4 h-4" />
                  AI 标签
              </h3>
              <div className="flex flex-wrap gap-2">
                  {item.aiTags.map(tag => (
                      <span key={tag} className="bg-slate-700/60 text-slate-300 text-sm px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
              </div>
          </div>
      )}
      
      {metadata && (
          <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 mb-3">
                  <InfoIcon className="w-4 h-4" />
                  详细信息
              </h3>
              <div className="space-y-2 text-sm">
                  <MetadataRow label="文件名" value={item.fileName} />
                  <MetadataRow label="分辨率" value={metadata.width && metadata.height ? `${metadata.width} x ${metadata.height}` : null} />
                  {isImage && <MetadataRow label="相机" value={imageMeta?.cameraMake ? `${imageMeta.cameraMake} ${imageMeta.cameraModel || ''}`.trim() : null} />}
                  {isImage && <MetadataRow label="曝光" value={imageMeta?.aperture && imageMeta?.shutterSpeed && imageMeta?.iso ? `ƒ/${imageMeta.aperture} • ${imageMeta.shutterSpeed}s • ISO ${imageMeta.iso}` : null} />}
                  {!isImage && <MetadataRow label="时长" value={formatDuration(videoMeta?.duration)} />}
                  {!isImage && <MetadataRow label="帧率" value={videoMeta?.fps ? `${videoMeta.fps.toFixed(2)} fps` : null} />}
              </div>
          </div>
      )}
    </>
  );
};

const MediaSlide: React.FC<{ item: MediaItem; isActive: boolean; isPreloading?: boolean }> = ({ item, isActive }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [placeholderSrc, setPlaceholderSrc] = useState<string | null>(null);
    const [mediaSrc, setMediaSrc] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let placeholderUrl: string | null = null;
        let finalMediaUrl: string | null = null;
        
        const cleanup = () => {
            isMounted = false;
            if (placeholderUrl) URL.revokeObjectURL(placeholderUrl);
            if (finalMediaUrl) URL.revokeObjectURL(finalMediaUrl);
        };

        const loadMedia = async () => {
            setIsReady(false);
            setError(false);
            setPlaceholderSrc(null);
            setMediaSrc(null);
            
            try {
                placeholderUrl = await fetchAuthenticatedBlobUrl(`${item.thumbnailUrl}?size=preview`);
                if (isMounted) setPlaceholderSrc(placeholderUrl);
            } catch (e) { console.warn("Could not load placeholder.", e); }

            try {
                if (item.fileType === 'image') {
                    finalMediaUrl = await fetchAuthenticatedBlobUrl(item.url);
                    if (isMounted) { setMediaSrc(finalMediaUrl); setIsReady(true); }
                } else if (item.fileType === 'video') {
                    // For video, we set `isReady` immediately.
                    // The `src` will be handled by the video element's effect.
                    if (isMounted) setIsReady(true);
                }
            } catch (err) {
                console.error("Failed to load media in modal:", err);
                if (isMounted) setError(true);
            }
        };

        loadMedia();
        return cleanup;
    }, [item]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || item.fileType !== 'video') return;

        let hlsInstance: any | null = null;

        if (isActive) {
            videoElement.muted = false; // Unmute when active
            const playPromise = videoElement.play();
            if (playPromise) {
                playPromise.catch(err => {
                    if (err.name !== 'AbortError') {
                        console.warn("Video autoplay prevented.", err);
                        // Optional: show a play button if autoplay fails
                    }
                });
            }
        } else {
            videoElement.pause();
            videoElement.currentTime = 0; // Reset on becoming inactive
        }

        const setupVideoSource = () => {
            if (item.hlsPlaybackUrl && typeof Hls !== 'undefined' && Hls.isSupported()) {
                hlsInstance = new Hls();
                hlsInstance.loadSource(item.hlsPlaybackUrl);
                hlsInstance.attachMedia(videoElement);
            } else {
                videoElement.src = item.url;
            }
        };

        // Set up the source if it's not already set
        if (!videoElement.currentSrc || videoElement.currentSrc !== item.url) {
            setupVideoSource();
        }

        return () => {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        };
    }, [item, isActive]);

    if (error) {
        return <div className="w-full h-full flex items-center justify-center bg-black/10 rounded-lg"> <p className="text-slate-500">媒体加载失败</p> </div>;
    }

    if (!isReady) {
        return (
            <div className="w-full h-full relative flex items-center justify-center">
                {placeholderSrc && <img src={placeholderSrc} alt="正在加载..." className="max-w-full max-h-full object-contain blur-sm brightness-75" />}
                <div className="absolute text-slate-200 bg-black/30 px-4 py-2 rounded-lg font-semibold">加载中...</div>
            </div>
        );
    }
    
    return (
        <div className="w-full h-full flex items-center justify-center">
            {item.fileType === 'image' && mediaSrc && <img src={mediaSrc} alt={item.fileName} className="max-w-full max-h-full object-contain" />}
            {item.fileType === 'video' && (
                <video 
                    key={item.uid} 
                    ref={videoRef} 
                    controls={isActive}
                    playsInline 
                    muted 
                    loop={!isActive}
                    preload="auto"
                    className="max-w-full max-h-full object-contain">
                        您的浏览器不支持播放该视频。
                </video>
            )}
        </div>
    );
};

const Modal: React.FC<ModalProps> = ({ items, currentIndex, onClose, onToggleFavorite, onNavigate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  
  const interactionRef = useRef({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startTime: 0,
      isGesture: false,
      isVerticalGesture: null as boolean | null,
  });
  
  const item = items[currentIndex];
  const prevItem = useMemo(() => items[currentIndex - 1], [items, currentIndex]);
  const nextItem = useMemo(() => items[currentIndex + 1], [items, currentIndex]);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    // Hide hint if user navigates
    if (showSwipeHint) setShowSwipeHint(false);
    onNavigate(direction);
  }, [onNavigate, showSwipeHint]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_STORAGE_KEY)) {
        setShowSwipeHint(true);
        const timer = setTimeout(() => {
          setShowSwipeHint(false);
          // Don't set the flag here, set it after the first successful swipe
        }, 4000);
        return () => clearTimeout(timer);
      }
    } catch(e) {
      console.warn("Could not access localStorage for swipe hint.");
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowDown' && prevItem) handleNavigate('prev');
      else if (event.key === 'ArrowUp' && nextItem) handleNavigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNavigate, prevItem, nextItem]);

  const handleTouchStart = (e: React.TouchEvent) => {
      interactionRef.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          currentX: e.touches[0].clientX,
          currentY: e.touches[0].clientY,
          startTime: Date.now(),
          isGesture: true,
          isVerticalGesture: null,
      };
      setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!interactionRef.current.isGesture) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const { startX, startY, isVerticalGesture } = interactionRef.current;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      interactionRef.current.currentX = currentX;
      interactionRef.current.currentY = currentY;

      if (isVerticalGesture === null) {
        // Determine gesture direction after a small threshold
        if (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10) {
          interactionRef.current.isVerticalGesture = Math.abs(deltaY) > Math.abs(deltaX);
        }
      }

      if (interactionRef.current.isVerticalGesture === true) {
        // Prevent swiping past boundaries
        if ((!prevItem && deltaY > 0) || (!nextItem && deltaY < 0)) {
            setDragOffsetY(deltaY / 3); // Resistance
        } else {
            setDragOffsetY(deltaY);
        }
      } else if (interactionRef.current.isVerticalGesture === false && deltaX > 0) {
        // Handle horizontal swipe right to dismiss
        const pullRatio = Math.min(1, deltaX / (window.innerWidth / 2));
        setModalStyle({
            transform: `translateX(${deltaX}px)`,
            backgroundColor: `rgba(15, 23, 42, ${0.9 * (1 - pullRatio)})`,
            transition: 'none',
        });
      }
  };
  
  const handleTouchEnd = () => {
      if (!interactionRef.current.isGesture) return;
      setIsDragging(false);
      
      const { startX, startY, startTime, currentX, currentY, isVerticalGesture } = interactionRef.current;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const duration = Date.now() - startTime;

      // Handle horizontal dismiss first
      if (isVerticalGesture === false && modalStyle.transform) {
          if (deltaX > DISMISS_THRESHOLD) {
              setModalStyle({
                  transform: `translateX(100vw)`,
                  backgroundColor: 'rgba(15, 23, 42, 0)',
                  transition: 'transform 0.3s ease-out, background-color 0.3s ease-out',
              });
              setTimeout(onClose, 300);
          } else {
              setModalStyle({
                  transform: 'translateX(0)',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  transition: 'transform 0.3s ease-out, background-color 0.3s ease-out',
              });
              setTimeout(() => setModalStyle({}), 300);
          }
          return;
      }
      
      // Check for tap to toggle UI
      if (Math.abs(deltaX) < TAP_MAX_DELTA && Math.abs(deltaY) < TAP_MAX_DELTA && duration < TAP_MAX_DURATION) {
          setUiVisible(v => !v);
          if (showDetails) setShowDetails(false);
          setDragOffsetY(0);
          interactionRef.current.isGesture = false;
          return;
      }
      
      // Handle vertical swipe for navigation
      if (isVerticalGesture) {
          if (deltaY < -SWIPE_THRESHOLD && nextItem) {
            handleNavigate('next');
            try { localStorage.setItem(HINT_STORAGE_KEY, 'true'); } catch(e) {}
          } else if (deltaY > SWIPE_THRESHOLD && prevItem) {
            handleNavigate('prev');
          }
      }

      setDragOffsetY(0);
      interactionRef.current.isGesture = false;
  };
  
  useEffect(() => {
    // Reset details panel when item changes
    setShowDetails(false);
  }, [item.uid]);
  
  if (!item) return null; // Should not happen if App component logic is correct

  const formattedDate = item.mediaCreatedAt ? new Date(item.mediaCreatedAt.replace(' ', 'T')).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '未知日期';

  return (
    <div 
      style={modalStyle}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center touch-none animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={item.fileName}
    >
        <div className={`absolute top-0 left-0 right-0 p-2 sm:p-4 z-[60] transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} flex justify-between items-center`}>
          {/* Placeholder for left-aligned header items */}
          <div></div>
          <button onClick={onClose} className="text-slate-300/70 hover:text-slate-100 transition-colors" aria-label="关闭">
              <CloseIcon className="w-8 h-8" />
          </button>
        </div>
        
        {/* Desktop Nav Arrows */}
        {prevItem && <div className={`absolute left-1/2 -translate-x-1/2 bottom-1 z-[60] transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={() => handleNavigate('prev')} className="hidden md:block p-2 text-slate-300/70 hover:text-slate-100 hover:bg-black/20 rounded-full transition-all" aria-label="上一个">
            <ChevronDownIcon className="w-8 h-8" />
          </button>
        </div>}

        {nextItem && <div className={`absolute left-1/2 -translate-x-1/2 top-1 z-[60] transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={() => handleNavigate('next')} className="hidden md:block p-2 text-slate-300/70 hover:text-slate-100 hover:bg-black/20 rounded-full transition-all" aria-label="下一个">
            <ChevronUpIcon className="w-8 h-8" />
          </button>
        </div>}
        
        <div className="flex-1 w-full flex items-center justify-center relative min-h-0 overflow-hidden">
            {prevItem && (
                <div style={getSlideStyle(-1, dragOffsetY, isDragging)}>
                    <MediaSlide item={prevItem} isActive={false} />
                </div>
            )}
            <div style={getSlideStyle(0, dragOffsetY, isDragging)}>
                <MediaSlide item={item} isActive={true} />
            </div>
            {nextItem && (
                <div style={getSlideStyle(1, dragOffsetY, isDragging)}>
                    <MediaSlide item={nextItem} isActive={false} />
                </div>
            )}
        </div>
        
        {/* Swipe Up Hint */}
        {showSwipeHint && (
          <div className="absolute inset-x-0 bottom-[25%] z-[70] flex flex-col items-center justify-center pointer-events-none animate-fade-in" aria-hidden="true">
            <div className="animate-swipe-up-hint">
              <ChevronUpIcon className="w-10 h-10 text-white/80 drop-shadow-lg" />
            </div>
            <p className="text-white text-lg font-semibold drop-shadow-md mt-2">向上滑动</p>
          </div>
        )}


        {/* Bottom UI Bar */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6 text-white transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex justify-between items-end gap-4">
                <div className="min-w-0">
                    <h2 className="font-bold text-lg text-slate-100 truncate">{item.aiTitle || item.fileName}</h2>
                    <p className="text-sm text-slate-300">{formattedDate}</p>
                    {item.aiTags && item.aiTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.aiTags.slice(0, 5).map(tag => ( <span key={tag} className="bg-white/10 text-xs px-2 py-0.5 rounded-full">{tag}</span> ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center flex-shrink-0 gap-4 sm:gap-5">
                    <button onClick={() => onToggleFavorite(item.uid)} className="flex flex-col items-center text-slate-200 hover:text-white transition-colors text-center" aria-label={item.isFavorite ? '取消收藏' : '收藏'}>
                        {item.isFavorite ? <HeartSolidIcon className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6" />}
                        <span className="text-xs mt-1 md:sr-only">{item.isFavorite ? '已收藏' : '收藏'}</span>
                    </button>
                    <a href={item.downloadUrl} download className="flex flex-col items-center text-slate-200 hover:text-white transition-colors text-center" aria-label="下载">
                        <DownloadIcon className="w-6 h-6" />
                        <span className="text-xs mt-1 md:sr-only">下载</span>
                    </a>
                    <button onClick={() => setShowDetails(!showDetails)} className="flex flex-col items-center text-slate-200 hover:text-white transition-colors text-center" aria-label="显示详细信息">
                        <InfoIcon className="w-6 h-6" />
                        <span className="text-xs mt-1 md:sr-only">信息</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Details Panel */}
        {showDetails && (
          <aside className="hidden md:flex absolute right-0 top-0 bottom-0 w-full md:w-[380px] lg:w-[420px] flex-shrink-0 bg-slate-900/80 backdrop-blur-xl text-slate-200 p-4 md:p-6 flex-col overflow-y-auto animate-slide-in-from-right"  onClick={e => e.stopPropagation()}>
              <DetailsPanelContent item={item} />
          </aside>
        )}
        
        {/* Mobile Details Panel */}
        {showDetails && (
            <div className="absolute inset-0 bg-black/40 md:hidden animate-fade-in" onClick={() => setShowDetails(false)} aria-hidden="true">
                <aside onClick={e => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 w-full max-h-[60vh] bg-slate-900 rounded-t-xl text-slate-200 p-4 flex flex-col overflow-y-auto animate-slide-up" role="dialog" aria-modal="true" aria-label="详细信息">
                    <DetailsPanelContent item={item} />
                </aside>
            </div>
        )}
    </div>
  );
};

export default Modal;