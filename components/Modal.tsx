import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  HeartSolidIcon,
  DownloadIcon,
  InfoIcon,
  TagIcon
} from './Icons';
import { fetchAuthenticatedBlobUrl } from '../services/api';
import type { MediaItem, ImageMetadata, VideoMetadata } from '../types';

declare const Hls: any;
const STORAGE_KEY = 'jingyu-today-auth-token';

interface ModalProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onToggleFavorite: (uid: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const MediaDisplay: React.FC<{ item: MediaItem; isActive: boolean }> = ({ item, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setMediaSrc(null);

    let isMounted = true;
    let objectUrl: string | null = null;
    let hlsInstance: any | null = null;

    const cleanup = () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (hlsInstance) hlsInstance.destroy();
    };

    const loadMedia = async () => {
      try {
        if (item.fileType === 'image') {
          const url = await fetchAuthenticatedBlobUrl(`${item.thumbnailUrl}?size=preview`);
          if (isMounted) {
            objectUrl = url;
            setMediaSrc(url);
          }
        } else if (item.fileType === 'video') {
          if (!videoRef.current) return;
          if (item.hlsPlaybackUrl && typeof Hls !== 'undefined' && Hls.isSupported()) {
            hlsInstance = new Hls({
              xhrSetup: (xhr: XMLHttpRequest) => {
                const token = localStorage.getItem(STORAGE_KEY);
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              },
            });
            hlsInstance.loadSource(item.hlsPlaybackUrl);
            hlsInstance.attachMedia(videoRef.current);
          } else if (item.url) {
            const url = await fetchAuthenticatedBlobUrl(item.url);
            if (isMounted) {
              objectUrl = url;
              setMediaSrc(url);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load media:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMedia();
    return cleanup;
  }, [item]);

  useEffect(() => {
    // Handle video play/pause based on active state
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(e => console.warn("Autoplay was prevented.", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);


  if (isLoading) return <div className="w-full h-full flex items-center justify-center text-white/60">加载中...</div>;
  if (error) return <div className="w-full h-full flex items-center justify-center bg-black/10 rounded-lg"><p className="text-white/60">媒体加载失败</p></div>;

  return (
    <>
      {item.fileType === 'image' && mediaSrc && (
        <img src={mediaSrc} alt={item.fileName} className="max-w-full max-h-full object-contain" draggable="false" />
      )}
      {item.fileType === 'video' && (
        <video
          ref={videoRef}
          src={mediaSrc || undefined}
          controls
          autoPlay={isActive}
          muted={!isActive} // Mute inactive videos to allow autoplay
          loop
          playsInline
          className="max-w-full max-h-full object-contain"
        >
          您的浏览器不支持播放该视频。
        </video>
      )}
    </>
  );
};


const MetadataRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
};

const DetailsPanelContent: React.FC<{ item: MediaItem, onToggleFavorite: (uid: string) => void }> = ({ item, onToggleFavorite }) => {
    const formattedDate = item.mediaCreatedAt
    ? new Date(item.mediaCreatedAt.replace(' ', 'T')).toLocaleString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
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
      <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3 md:hidden" aria-hidden="true" />
      <h2 className="text-xl font-bold mb-1">{item.aiTitle || item.fileName}</h2>
      <p className="text-sm text-white/60 mb-4">{formattedDate}</p>

      <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onToggleFavorite(item.uid)} className="flex items-center gap-2 text-sm hover:text-white transition-colors">
              {item.isFavorite ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
              {item.isFavorite ? '已收藏' : '收藏'}
          </button>
          <a href={item.downloadUrl} download className="flex items-center gap-2 text-sm hover:text-white transition-colors">
              <DownloadIcon className="w-5 h-5" />
              下载
          </a>
      </div>
      
      {item.aiTags && item.aiTags.length > 0 && (
          <div className="mb-6">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-white/60 mb-2">
                  <TagIcon className="w-4 h-4" />
                  AI 标签
              </h3>
              <div className="flex flex-wrap gap-2">
                  {item.aiTags.map(tag => (
                      <span key={tag} className="bg-white/10 text-sm px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
              </div>
          </div>
      )}
      
      {metadata && (
          <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-white/60 mb-3">
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

const Modal: React.FC<ModalProps> = ({ items, currentIndex, onClose, onToggleFavorite, onNavigate }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const filmStripRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasNavigatedRef = useRef(false);

  const currentItem = items[currentIndex];
  const prevItem = items[currentIndex - 1];
  const nextItem = items[currentIndex + 1];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') onNavigate('prev');
      else if (event.key === 'ArrowRight') onNavigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  useEffect(() => {
    if (hasNavigatedRef.current) {
        // After navigation, reset offset without animation
        if (filmStripRef.current) {
            filmStripRef.current.style.transition = 'none';
        }
        setOffsetX(0);
        
        // Force a reflow before re-enabling transitions
        requestAnimationFrame(() => {
            if (filmStripRef.current) {
                filmStripRef.current.style.transition = '';
            }
        });
        hasNavigatedRef.current = false;
    }
  }, [currentIndex]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setIsDragging(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchStartRef.current) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
        setOffsetX(deltaX);
    } else {
        // Vertical scroll, cancel drag
        setIsDragging(false);
        setOffsetX(0);
    }
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const swipeThreshold = containerWidth / 4;

    if (offsetX < -swipeThreshold && nextItem) {
      onNavigate('next');
      hasNavigatedRef.current = true;
    } else if (offsetX > swipeThreshold && prevItem) {
      onNavigate('prev');
      hasNavigatedRef.current = true;
    } else {
      setOffsetX(0);
    }
  };
  
  const handleTransitionEnd = () => {
    if (!isDragging && offsetX !== 0) {
        setOffsetX(0);
    }
  };

  const getFilmStripTransform = () => {
    const baseOffset = -33.333; // Center the current item
    // The width calculation is tricky, as it relies on CSS. 
    // It's simpler to use pixels for the dynamic offset.
    return `translateX(calc(${baseOffset}% + ${offsetX}px))`;
  }

  if (!currentItem) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      onClick={(e) => { if(e.target === modalRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={currentItem.fileName}
    >
        <button 
            onClick={onClose} 
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white/70 hover:text-white transition-colors z-[60]"
            aria-label="关闭"
        >
            <CloseIcon className="w-8 h-8" />
        </button>
        
        {prevItem && <button
          onClick={() => onNavigate('prev')}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-[60]"
          aria-label="上一个"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>}

        {nextItem && <button
          onClick={() => onNavigate('next')}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-[60]"
          aria-label="下一个"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>}
        
        <div className="flex flex-col md:flex-row w-full h-full p-2 sm:p-4 md:p-8 gap-4">
            <div 
              ref={containerRef}
              className="flex-1 flex items-center justify-center relative min-h-0 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                ref={filmStripRef}
                className="flex h-full w-[300%] items-center"
                style={{
                    transform: getFilmStripTransform(),
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                }}
                onTransitionEnd={handleTransitionEnd}
              >
                {[prevItem, currentItem, nextItem].map((item, index) => (
                    <div key={item ? item.uid : `empty-${index}`} className="w-1/3 h-full flex-shrink-0 flex items-center justify-center p-2">
                        {item && <MediaDisplay item={item} isActive={index === 1 && !isDragging} />}
                    </div>
                ))}
              </div>
                
                <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center items-center gap-10">
                    <button onClick={() => onToggleFavorite(currentItem.uid)} className="flex flex-col items-center text-white/90 hover:text-white transition-colors">
                        {currentItem.isFavorite ? <HeartSolidIcon className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6" />}
                        <span className="text-xs mt-1">{currentItem.isFavorite ? '已收藏' : '收藏'}</span>
                    </button>
                    <a href={currentItem.downloadUrl} download className="flex flex-col items-center text-white/90 hover:text-white transition-colors">
                        <DownloadIcon className="w-6 h-6" />
                        <span className="text-xs mt-1">下载</span>
                    </a>
                    <button onClick={() => setShowDetails(true)} className="flex flex-col items-center text-white/90 hover:text-white transition-colors">
                        <InfoIcon className="w-6 h-6" />
                        <span className="text-xs mt-1">信息</span>
                    </button>
                </div>
            </div>
            <aside className="hidden md:flex w-full md:w-[380px] lg:w-[420px] flex-shrink-0 bg-zinc-900/80 backdrop-blur-xl rounded-lg text-white/90 p-4 md:p-6 flex-col overflow-y-auto">
                <DetailsPanelContent item={currentItem} onToggleFavorite={onToggleFavorite} />
            </aside>
        </div>
        
        {showDetails && (
            <div 
                className="absolute inset-0 bg-black/40 md:hidden animate-fade-in"
                onClick={() => setShowDetails(false)}
                aria-hidden="true"
            >
                <aside
                    onClick={e => e.stopPropagation()}
                    className="absolute bottom-0 left-0 right-0 w-full max-h-[60vh] bg-zinc-900 rounded-t-xl text-white/90 p-4 flex flex-col overflow-y-auto animate-slide-up"
                    role="dialog"
                    aria-modal="true"
                    aria-label="详细信息"
                >
                    <DetailsPanelContent item={currentItem} onToggleFavorite={onToggleFavorite} />
                </aside>
            </div>
        )}
    </div>
  );
};

export default Modal;