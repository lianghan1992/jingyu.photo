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

interface ModalProps {
  item: MediaItem;
  onClose: () => void;
  onToggleFavorite: (uid: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const Modal: React.FC<ModalProps> = ({ item, onClose, onToggleFavorite, onNavigate }) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handleFavoriteClick = () => {
    onToggleFavorite(item.uid);
  };
  
  const formattedDate = item.date
    ? new Date(item.date.replace(' ', 'T')).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '未知日期';

  const metadata = item.metadata;
  const isImage = item.type === 'image';
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
      aria-label={item.name}
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
                {item.type === 'image' ? (
                    <img 
                        src={`${item.thumbnailUrl}?size=preview`} 
                        alt={item.name} 
                        className="max-w-full max-h-full object-contain"
                    />
                ) : (
                    <video 
                        src={item.hlsPlaybackUrl || item.url} 
                        controls 
                        autoPlay 
                        className="max-w-full max-h-full object-contain"
                    >
                        Your browser does not support the video tag.
                    </video>
                )}
            </div>
            <aside className="w-80 flex-shrink-0 bg-gray-800/50 backdrop-blur-md rounded-lg ml-4 text-white/90 p-6 flex flex-col overflow-y-auto">
                <h2 className="text-xl font-bold mb-1">{item.aiTitle || item.name}</h2>
                <p className="text-sm text-white/60 mb-4">{formattedDate}</p>

                <div className="flex items-center gap-4 mb-6">
                    <button onClick={handleFavoriteClick} className="flex items-center gap-2 text-sm hover:text-white transition-colors">
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
                            <div className="flex justify-between"><span className="text-white/60">文件名</span> <span>{item.name}</span></div>
                            {metadata.width && metadata.height && (
                               <div className="flex justify-between"><span className="text-white/60">分辨率</span> <span>{metadata.width} x {metadata.height}</span></div>
                            )}
                            {isImage && imageMeta?.cameraMake && (
                                <div className="flex justify-between"><span className="text-white/60">相机</span> <span>{imageMeta.cameraMake} {imageMeta.cameraModel}</span></div>
                            )}
                            {isImage && imageMeta?.aperture && imageMeta?.shutterSpeed && imageMeta?.iso && (
                                <div className="flex justify-between"><span className="text-white/60">曝光</span> <span>{`ƒ/${imageMeta.aperture} • ${imageMeta.shutterSpeed}s • ISO ${imageMeta.iso}`}</span></div>
                            )}
                            {!isImage && videoMeta?.duration && (
                                <div className="flex justify-between"><span className="text-white/60">时长</span> <span>{formatDuration(videoMeta.duration)}</span></div>
                            )}
                             {!isImage && videoMeta?.fps && (
                                <div className="flex justify-between"><span className="text-white/60">帧率</span> <span>{videoMeta.fps.toFixed(2)} fps</span></div>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    </div>
  );
};

export default Modal;