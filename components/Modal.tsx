import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { MediaItem, ImageMetadata, VideoMetadata } from '../types';
import { CloseIcon, DownloadIcon, InfoIcon, TagIcon, HeartIcon, HeartSolidIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ModalProps {
  item: MediaItem;
  onClose: () => void;
  onToggleFavorite: (uid: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.round(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};

const MetadataDisplay: React.FC<{ item: MediaItem }> = ({ item }) => {
  if (!item.metadata) return null;

  const metadata = item.metadata;
  const infoItems: { label: string, value: React.ReactNode }[] = [];

  if (item.type === 'image') {
    const imgMeta = metadata as ImageMetadata;
    if (imgMeta.cameraModel) infoItems.push({ label: '相机', value: `${imgMeta.cameraMake || ''} ${imgMeta.cameraModel}`.trim() });
    const photoDetails = [imgMeta.focalLength, imgMeta.aperture, imgMeta.shutterSpeed, imgMeta.iso ? `ISO ${imgMeta.iso}` : null].filter(Boolean).join(' ');
    if (photoDetails) infoItems.push({ label: '参数', value: photoDetails });
    if (imgMeta.width && imgMeta.height) infoItems.push({ label: '尺寸', value: `${imgMeta.width} x ${imgMeta.height}` });

  } else if (item.type === 'video') {
    const vidMeta = metadata as VideoMetadata;
    if (vidMeta.duration) infoItems.push({ label: '时长', value: formatDuration(vidMeta.duration) });
    if (vidMeta.width && vidMeta.height) infoItems.push({ label: '分辨率', value: `${vidMeta.width} x ${vidMeta.height}` });
  }

  if (infoItems.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-zinc-500 uppercase tracking-wider">
        <InfoIcon className="w-5 h-5"/> 详细信息
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {infoItems.map(({ label, value }) => (
          <React.Fragment key={label}>
            <div className="font-medium text-zinc-600">{label}</div>
            <div className="text-zinc-800 truncate">{value}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};


const Modal: React.FC<ModalProps> = ({ item, onClose, onToggleFavorite, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, onNavigate]);

  // The backend now provides the full, correct URL, so we use it directly.
  const mediaUrl = item.url;

  const formattedDate = () => {
    if (!item.date) return '未知日期';
    const date = new Date(item.date);
    if (isNaN(date.getTime())) return '未知日期';
    return date.toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' });
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col md:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Media Display */}
        <div className="relative flex-grow h-2/3 md:h-full md:w-3/4 bg-black flex items-center justify-center">
          {item.type === 'video' ? (
            <video src={mediaUrl} controls autoPlay className="max-h-full max-w-full object-contain" />
          ) : (
            <img src={mediaUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
          )}
          <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors" aria-label="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-1/4 h-1/3 md:h-full flex flex-col p-6 overflow-y-auto bg-zinc-50 border-l border-zinc-200">
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-1 text-zinc-900">{item.aiTitle || item.name}</h2>
            <p className="text-zinc-500 text-sm mb-6">{formattedDate()}</p>
            
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => onToggleFavorite(item.uid)} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700">
                {item.isFavorite ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5 text-zinc-500" />}
                <span className="font-semibold text-sm">{item.isFavorite ? '已收藏' : '收藏'}</span>
              </button>
              <a href={item.downloadUrl} download={item.name} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700">
                <DownloadIcon className="w-5 h-5 text-zinc-500" />
                <span className="font-semibold text-sm">下载</span>
              </a>
            </div>

            <div className="space-y-6">
                {item.aiTags && item.aiTags.length > 0 && (
                  <div className="pb-6 border-b border-zinc-200">
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-zinc-500 uppercase tracking-wider"><TagIcon className="w-5 h-5"/> AI 标签</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.aiTags.map(tag => <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}
                      </div>
                  </div>
                )}
                
                <MetadataDisplay item={item} />
            </div>

          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <button onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/20 p-2 rounded-full hover:bg-black/40 transition-colors hidden md:block" aria-label="Previous item">
        <ChevronLeftIcon className="w-8 h-8" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onNavigate('next'); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/20 p-2 rounded-full hover:bg-black/40 transition-colors hidden md:block" aria-label="Next item">
        <ChevronRightIcon className="w-8 h-8" />
      </button>
    </div>,
    document.body
  );
};

export default Modal;