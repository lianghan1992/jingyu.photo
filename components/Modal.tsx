import React, { useEffect, useRef } from 'react';
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

// To satisfy TypeScript, since hls.js is loaded from a script tag.
declare const Hls: any;

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
      <span>{value}</span>
    </div>
  );
};


const Modal: React.FC<ModalProps> = ({ item, onClose, onToggleFavorite, onNavigate }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
  
  useEffect(() => {
    if (item.file_type !== 'video' || !videoRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    let hlsInstance: any | null = null;

    if (item.hls_playback_url) {
      if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(item.hls_playback_url);
        hlsInstance.attachMedia(videoElement);
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (e.g., Safari)
        videoElement.src = item.hls_playback_url;
      } else {
        // Fallback to direct URL if HLS is not supported at all
        videoElement.src = item.url;
      }
    } else {
      // No HLS URL, use direct URL
      videoElement.src = item.url;
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [item]);


  const handleFavoriteClick = () => {
    onToggleFavorite(item.uid);
  };
  
  const formattedDate = item.media_created_at
    ? new Date(item.media_created_at.replace(' ', 'T')).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '未知日期';

  const metadata = item.media_metadata;
  const isImage = item.file_type === 'image';
  const imageMeta = isImage ? (metadata as ImageMetadata) : null;
  const videoMeta = !isImage ? (metadata as VideoMetadata) : null;
  
  const formatDuration = (seconds: number | undefined) => {
    if (seconds === undefined) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      onClick={(e) => { if(e.target === modalRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={item.file_name}
    >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-50"
            aria-label="Close modal"
        >
            <CloseIcon className="w-8 h-8" />
        </button>
        
        <button
          onClick={() => onNavigate('prev')}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
          aria-label="Previous item"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>

        <button
          onClick={() => onNavigate('next')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
          aria-label="Next item"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
        
        <div className="flex w-full h-full p-16">
            <div className="flex-1 flex items-center justify-center">
                {item.file_type === 'image' ? (
                    <img 
                        src={`${item.thumbnail_url}?size=large`} 
                        alt={item.file_name} 
                        className="max-w-full max-h-full object-contain"
                    />
                ) : (
                    <video 
                        ref={videoRef}
                        controls 
                        autoPlay 
                        className="max-w-full max-h-full object-contain"
                    >
                        Your browser does not support the video tag.
                    </video>
                )}
            </div>
            <aside className="w-80 flex-shrink-0 bg-gray-800/50 backdrop-blur-md rounded-lg ml-4 text-white/90 p-6 flex flex-col overflow-y-auto">
                <h2 className="text-xl font-bold mb-1">{item.ai_title || item.file_name}</h2>
                <p className="text-sm text-white/60 mb-4">{formattedDate}</p>

                <div className="flex items-center gap-4 mb-6">
                    <button onClick={handleFavoriteClick} className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                        {item.is_favorite ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
                        {item.is_favorite ? '已收藏' : '收藏'}
                    </button>
                    <a href={item.download_url} download className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                        <DownloadIcon className="w-5 h-5" />
                        下载
                    </a>
                </div>
                
                {item.ai_tags && item.ai_tags.length > 0 && (
                    <div className="mb-6">
                        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-white/60 mb-2">
                            <TagIcon className="w-4 h-4" />
                            AI 标签
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {item.ai_tags.map(tag => (
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
                            <MetadataRow label="文件名" value={item.file_name} />
                            <MetadataRow label="分辨率" value={metadata.width && metadata.height ? `${metadata.width} x ${metadata.height}` : null} />
                            {isImage && <MetadataRow label="相机" value={imageMeta?.camera_make ? `${imageMeta.camera_make} ${imageMeta.camera_model || ''}`.trim() : null} />}
                            {isImage && <MetadataRow label="曝光" value={imageMeta?.aperture && imageMeta?.shutter_speed && imageMeta?.iso ? `ƒ/${imageMeta.aperture} • ${imageMeta.shutter_speed}s • ISO ${imageMeta.iso}` : null} />}
                            {!isImage && <MetadataRow label="时长" value={formatDuration(videoMeta?.duration)} />}
                            {!isImage && <MetadataRow label="帧率" value={videoMeta?.fps ? `${videoMeta.fps.toFixed(2)} fps` : null} />}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    </div>
  );
};

export default Modal;
