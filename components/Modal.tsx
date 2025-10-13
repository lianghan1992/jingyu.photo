import React, { useState, useEffect, useCallback } from 'react';
import type { MediaItem, ImageMetadata, VideoMetadata } from '../types';
import {
  CloseIcon,
  HeartIcon,
  HeartSolidIcon,
  DownloadIcon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TagIcon,
} from './Icons';

interface ModalProps {
  item: MediaItem;
  onClose: () => void;
  onToggleFavorite: (uid: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const Modal: React.FC<ModalProps> = ({ item, onClose, onToggleFavorite, onNavigate }) => {
  const [showInfo, setShowInfo] = useState(false);
  
  // State for progressive image loading and video loading
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState('');
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  useEffect(() => {
    if (item.file_type === 'image') {
      setIsHighResLoaded(false);
      // Immediately show the small, cached thumbnail
      const lowResSrc = `${item.thumbnailUrl}?size=small`;
      setImageSrc(lowResSrc);

      // Preload the high-resolution image in the background
      const highResImg = new Image();
      highResImg.src = `${item.url}?size=large`;
      highResImg.onload = () => {
        // Once loaded, update the src to trigger the transition
        setImageSrc(highResImg.src);
        setIsHighResLoaded(true);
      };
    } else {
      // For videos, use a simple loading state
      setIsVideoLoading(true);
    }
  }, [item.uid, item.file_type, item.url, item.thumbnailUrl]);


  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate('prev');
    }
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate('next');
    }
  }, [onClose, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.uid);
  };
  
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
        onClose();
    }
  };

  // Type guards for metadata
  const isImageMetadata = (metadata: any): metadata is ImageMetadata => {
    return item.file_type === 'image' && metadata !== null && typeof metadata === 'object';
  };

  const isVideoMetadata = (metadata: any): metadata is VideoMetadata => {
    return item.file_type === 'video' && metadata !== null && typeof metadata === 'object';
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    if (!dateString) return '未知日期';
    try {
        const parsableDateStr = dateString.replace(' ', 'T');
        const date = new Date(parsableDateStr);
        if(isNaN(date.getTime())) return '无效日期';
        return date.toLocaleDateString('zh-CN', options);
    } catch {
        return '未知日期';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-title"
    >
      <div className="absolute top-0 right-0 left-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col min-w-0">
            <h2 id="media-title" className="text-white text-lg font-semibold truncate">{item.ai_title || item.file_name}</h2>
            <p className="text-gray-300 text-sm">{formatDate(item.media_created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`} aria-label="Show info">
                <InfoIcon className="w-6 h-6" />
            </button>
            <button onClick={handleFavoriteClick} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Toggle favorite">
                {item.is_favorite ? <HeartSolidIcon className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6" />}
            </button>
            <a href={`${item.downloadUrl}`} download={item.file_name} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Download media">
                <DownloadIcon className="w-6 h-6" />
            </a>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close modal">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10 opacity-70 hover:opacity-100 transition-opacity" aria-label="Previous media">
        <ChevronLeftIcon className="w-8 h-8" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onNavigate('next'); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10 opacity-70 hover:opacity-100 transition-opacity" aria-label="Next media">
        <ChevronRightIcon className="w-8 h-8" />
      </button>

      <div className="relative w-full h-full flex items-center justify-center p-0" onClick={(e) => e.stopPropagation()}>
        <div className="w-full h-full flex items-center justify-center">
            {item.file_type === 'image' ? (
            <img 
                src={imageSrc}
                alt={item.file_name}
                className={`max-h-full max-w-full object-contain transition-all duration-500 ease-in-out ${isHighResLoaded ? 'filter-none blur-0' : 'filter blur-lg scale-105'}`}
            />
            ) : (
            <>
              {isVideoLoading && <div className="text-white absolute">加载中...</div>}
              <video
                  src={`${item.url}`}
                  controls
                  autoPlay
                  className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${isVideoLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoadedData={() => setIsVideoLoading(false)}
                  onError={() => setIsVideoLoading(false)}
              >
                  您的浏览器不支持视频标签。
              </video>
            </>
            )}
        </div>
      </div>

      <div 
        className={`absolute top-0 right-0 bottom-0 w-80 bg-gray-900/80 backdrop-blur-lg text-white transform transition-transform duration-300 ease-in-out z-20 shadow-2xl ${showInfo ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={!showInfo}
      >
        <div className="p-6 overflow-y-auto h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">详细信息</h3>
                <button onClick={() => setShowInfo(false)} className="p-1 rounded-full hover:bg-white/10" aria-label="Close info panel">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="space-y-4 text-sm text-gray-200">
                <p><strong>文件名:</strong> <span className="break-all">{item.file_name}</span></p>
                {item.ai_tags && item.ai_tags.length > 0 && (
                    <div>
                        <strong>AI 标签:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {item.ai_tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 bg-gray-700 text-gray-200 px-2.5 py-1 rounded-full text-xs">
                                    <TagIcon className="w-3 h-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                 <hr className="border-gray-600 my-4" />
                {isImageMetadata(item.media_metadata) && (
                    <>
                        <p><strong>尺寸:</strong> {item.media_metadata.width} x {item.media_metadata.height}</p>
                        {item.media_metadata.camera_make && <p><strong>相机:</strong> {item.media_metadata.camera_make} {item.media_metadata.camera_model}</p>}
                        {item.media_metadata.focal_length && <p><strong>焦距:</strong> {item.media_metadata.focal_length}</p>}
                        {item.media_metadata.aperture && <p><strong>光圈:</strong> {item.media_metadata.aperture}</p>}
                        {item.media_metadata.shutter_speed && <p><strong>快门速度:</strong> {item.media_metadata.shutter_speed}</p>}
                        {item.media_metadata.iso && <p><strong>ISO:</strong> {item.media_metadata.iso}</p>}
                    </>
                )}
                {isVideoMetadata(item.media_metadata) && (
                    <>
                        <p><strong>尺寸:</strong> {item.media_metadata.width} x {item.media_metadata.height}</p>
                        {item.media_metadata.duration && <p><strong>时长:</strong> {Math.round(item.media_metadata.duration)}s</p>}
                        {item.media_metadata.fps && <p><strong>帧率:</strong> {Math.round(item.media_metadata.fps)} FPS</p>}
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;