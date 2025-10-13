import React, { useEffect, useState } from 'react';
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
  if (!item.media_metadata) {
    return (
      <div className="text-center py-4">
        <InfoIcon className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
        <p className="text-zinc-500 text-sm">无可用元数据。</p>
      </div>
    );
  }

  const infoItems: { label: string, value: React.ReactNode }[] = [];
  const metadata = item.media_metadata;

  if (item.file_type === 'image') {
    const imgMeta = metadata as ImageMetadata;
    if (imgMeta.width && imgMeta.height) infoItems.push({ label: '尺寸', value: `${imgMeta.width} × ${imgMeta.height}` });
    if (imgMeta.camera_make || imgMeta.camera_model) infoItems.push({ label: '相机', value: `${imgMeta.camera_make || ''} ${imgMeta.camera_model || ''}`.trim() });
    if (imgMeta.focal_length) infoItems.push({ label: '焦距', value: imgMeta.focal_length });
    if (imgMeta.aperture) infoItems.push({ label: '光圈', value: imgMeta.aperture });
    if (imgMeta.shutter_speed) infoItems.push({ label: '快门', value: imgMeta.shutter_speed });
    if (imgMeta.iso) infoItems.push({ label: 'ISO', value: String(imgMeta.iso) });
  } else if (item.file_type === 'video') {
    const vidMeta = metadata as VideoMetadata;
    if (vidMeta.width && vidMeta.height) infoItems.push({ label: '分辨率', value: `${vidMeta.width} × ${vidMeta.height}` });
    if (vidMeta.duration) infoItems.push({ label: '时长', value: formatDuration(vidMeta.duration) });
    if (vidMeta.fps) infoItems.push({ label: '帧率', value: `${Math.round(vidMeta.fps)} FPS` });
  }
  
  if (infoItems.length === 0) {
    return (
      <div className="text-center py-4">
        <InfoIcon className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
        <p className="text-zinc-500 text-sm">无可用元数据。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {infoItems.map(({ label, value }) => (
        <div key={label} className="grid grid-cols-3 gap-2 items-center">
          <span className="font-medium text-zinc-500 col-span-1">{label}</span>
          <span className="text-zinc-800 text-right truncate col-span-2" title={String(value)}>{value}</span>
        </div>
      ))}
    </div>
  );
};


const Modal: React.FC<ModalProps> = ({ item, onClose, onToggleFavorite, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'details'>('ai');
  
  useEffect(() => {
    setActiveTab('ai');
  }, [item]);

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

  const mediaUrl = item.url;

  const formattedDate = () => {
    const dateStr = item.media_created_at;
    if (!dateStr) return '未知日期';
    const parsableDateStr = dateStr.replace(' ', 'T');
    const date = new Date(parsableDateStr);
    if (isNaN(date.getTime())) return '未知日期';
    return date.toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' });
  };

  const TabButton: React.FC<{tab: 'ai' | 'details', label: string}> = ({tab, label}) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-2.5 text-sm font-semibold transition-colors focus:outline-none ${
            activeTab === tab 
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-zinc-500 hover:text-zinc-800 border-b-2 border-transparent'
        }`}
    >
        {label}
    </button>
  );

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col md:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Media Display */}
        <div className="relative flex-grow h-2/3 md:h-full md:w-3/4 bg-black flex items-center justify-center">
          {item.file_type === 'video' ? (
            <video src={mediaUrl} controls autoPlay className="max-h-full max-w-full object-contain" />
          ) : (
            <img src={mediaUrl} alt={item.file_name} className="max-h-full max-w-full object-contain" />
          )}
          <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors" aria-label="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-1/4 h-1/3 md:h-full flex flex-col bg-zinc-50 border-l border-zinc-200">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-1 text-zinc-900 break-words">{item.ai_title || item.file_name}</h2>
            <p className="text-zinc-500 text-sm mb-6">{formattedDate()}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => onToggleFavorite(item.uid)} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700">
                {item.is_favorite ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5 text-zinc-500" />}
                <span className="font-semibold text-sm">{item.is_favorite ? '已收藏' : '收藏'}</span>
              </button>
              <a href={item.downloadUrl} download={item.file_name} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700">
                <DownloadIcon className="w-5 h-5 text-zinc-500" />
                <span className="font-semibold text-sm">下载</span>
              </a>
            </div>
          </div>
          
          <div className="border-b border-t border-zinc-200 px-4">
              <div className="flex">
                  <TabButton tab="ai" label="AI 摘要" />
                  <TabButton tab="details" label="详细信息" />
              </div>
          </div>

          <div className="flex-grow p-6 overflow-y-auto">
            {activeTab === 'ai' ? (
              <div>
                {item.ai_tags && item.ai_tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.ai_tags.map(tag => <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <TagIcon className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                    <p className="text-zinc-500 text-sm">暂无 AI 标签。</p>
                  </div>
                )}
              </div>
            ) : (
              <MetadataDisplay item={item} />
            )}
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
