import React, { useEffect, useRef, useState } from 'react';
import type { MediaItem, ImageMetadata, VideoMetadata } from '../types';
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

// To satisfy TypeScript, since hls.js is loaded from a script tag.
declare const Hls: any;
const STORAGE_KEY = 'jingyu-today-auth-token';

interface ModalProps {
  item: MediaItem;
  onClose: () => void;
  onToggleFavorite: (uid: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

// Helper component for cleaner metadata display
const MetadataRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
};

// Component for the details content, used in both desktop sidebar and mobile bottom sheet
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
      <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3 md:hidden" aria-hidden="true" />
      <h2 className="text-xl font-bold mb-1">{item.aiTitle || item.fileName}</h2>
      <p className="text-sm text-white/60 mb-4">{formattedDate}</p>
      
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


const Modal: React.FC<ModalProps> = ({ item, onClose, onToggleFavorite, onNavigate }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Reset state when item changes
    setShowDetails(false);
    setIsLoading(true);
    setError(false);
    setMediaSrc(null);

    let isMounted = true;
    let objectUrl: string | null = null;
    let hlsInstance: any | null = null;

    const cleanup = () => {
        isMounted = false;
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    };
    
    const loadMedia = async () => {
        try {
            if (item.fileType === 'image') {
                let url;
                try {
                    url = await fetchAuthenticatedBlobUrl(`${item.thumbnailUrl}?size=preview`);
                } catch (e) {
                    console.warn("Could not load preview, falling back to full image.", e);
                    url = await fetchAuthenticatedBlobUrl(item.url);
                }
                if (isMounted) {
                    objectUrl = url;
                    setMediaSrc(url);
                }
            } else if (item.fileType === 'video') {
                const videoElement = videoRef.current;
                if (!videoElement) return;

                if (item.hlsPlaybackUrl && typeof Hls !== 'undefined' && Hls.isSupported()) {
                    hlsInstance = new Hls({
                        xhrSetup: (xhr: XMLHttpRequest) => {
                            const token = localStorage.getItem(STORAGE_KEY);
                            if (token) {
                                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                            }
                        }
                    });
                    hlsInstance.loadSource(item.hlsPlaybackUrl);
                    hlsInstance.attachMedia(videoElement);
                    hlsInstance.on('hlsError', (event: any, data: any) => {
                        console.error('HLS Error:', data);
                        if (isMounted) setError(true);
                    });
                } else if (item.url) { // Fallback to direct URL if HLS is not available/supported
                    const url = await fetchAuthenticatedBlobUrl(item.url);
                    if (isMounted) {
                        objectUrl = url;
                        setMediaSrc(url);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load media in modal:", err);
            if (isMounted) setError(true);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };

    loadMedia();
    return cleanup;

  }, [item.uid, item.url, item.thumbnailUrl, item.fileType, item.hlsPlaybackUrl]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        onNavigate('prev');
      } else if (event.key === 'ArrowRight') {
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNavigate]);

  const formattedDate = item.mediaCreatedAt
    ? new Date(item.mediaCreatedAt.replace(' ', 'T')).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '未知日期';

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      onClick={(e) => { if(e.target === modalRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={item.fileName}
    >
        <button 
            onClick={onClose} 
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white/70 hover:text-white transition-colors z-[60]"
            aria-label="关闭"
        >
            <CloseIcon className="w-8 h-8" />
        </button>
        
        <button
          onClick={() => onNavigate('prev')}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-[60]"
          aria-label="上一个"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>

        <button
          onClick={() => onNavigate('next')}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-[60]"
          aria-label="下一个"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
        
        <div className="flex flex-col md:flex-row w-full h-full p-2 sm:p-4 md:p-8 gap-4">
            <div className="flex-1 flex items-center justify-center relative min-h-0">
                {isLoading && (
                    <div className="text-white/60">加载中...</div>
                )}
                {error && !isLoading && (
                    <div className="flex items-center justify-center h-full w-full bg-black/10 rounded-lg">
                        <p className="text-white/60">媒体加载失败</p>
                    </div>
                )}
                {!isLoading && !error && (
                  <>
                    {item.fileType === 'image' && mediaSrc && (
                        <img 
                            key={mediaSrc}
                            src={mediaSrc} 
                            alt={item.fileName} 
                            className="max-w-full max-h-full object-contain"
                        />
                    )}
                    {item.fileType === 'video' && (
                        <video 
                            key={mediaSrc || item.hlsPlaybackUrl}
                            ref={videoRef}
                            src={item.hlsPlaybackUrl ? undefined : mediaSrc || ''}
                            controls 
                            autoPlay 
                            className="max-w-full max-h-full object-contain"
                        >
                            您的浏览器不支持播放该视频。
                        </video>
                    )}
                  </>
                )}
                
                {/* --- BOTTOM OVERLAY --- */}
                {!isLoading && !error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6 text-white animate-fade-in">
                    <div className="flex justify-between items-end gap-4">
                      {/* Left side: Info */}
                      <div className="min-w-0">
                          <h2 className="font-bold text-lg truncate">{item.aiTitle || item.fileName}</h2>
                          <p className="text-sm text-white/80">{formattedDate}</p>
                          {item.aiTags && item.aiTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                  {item.aiTags.slice(0, 5).map(tag => (
                                      <span key={tag} className="bg-white/10 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                                  ))}
                              </div>
                          )}
                      </div>

                      {/* Right side: Actions */}
                      <div className="flex items-center flex-shrink-0 gap-4 sm:gap-5">
                          <button onClick={() => onToggleFavorite(item.uid)} className="flex flex-col items-center text-white/90 hover:text-white transition-colors text-center" aria-label={item.isFavorite ? '取消收藏' : '收藏'}>
                              {item.isFavorite ? <HeartSolidIcon className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6" />}
                              <span className="text-xs mt-1 md:sr-only">{item.isFavorite ? '已收藏' : '收藏'}</span>
                          </button>
                          <a href={item.downloadUrl} download className="flex flex-col items-center text-white/90 hover:text-white transition-colors text-center" aria-label="下载">
                              <DownloadIcon className="w-6 h-6" />
                              <span className="text-xs mt-1 md:sr-only">下载</span>
                          </a>
                          <button onClick={() => setShowDetails(!showDetails)} className="flex flex-col items-center text-white/90 hover:text-white transition-colors text-center" aria-label="显示详细信息">
                              <InfoIcon className="w-6 h-6" />
                              <span className="text-xs mt-1 md:sr-only">信息</span>
                          </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
            {/* --- DESKTOP SIDEBAR --- */}
            {showDetails && (
              <aside className="hidden md:flex w-full md:w-[380px] lg:w-[420px] flex-shrink-0 bg-zinc-900/80 backdrop-blur-xl rounded-lg text-white/90 p-4 md:p-6 flex-col overflow-y-auto animate-fade-in">
                  <DetailsPanelContent item={item} />
              </aside>
            )}
        </div>
        
        {/* --- MOBILE DETAILS BOTTOM SHEET --- */}
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
                    <DetailsPanelContent item={item} />
                </aside>
            </div>
        )}
    </div>
  );
};

export default Modal;