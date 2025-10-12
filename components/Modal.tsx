import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { MediaItem } from '../types';
import { CloseIcon, DownloadIcon, InfoIcon, TagIcon, HeartIcon, HeartSolidIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ModalProps {
  item: MediaItem;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col md:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Media Display */}
        <div className="relative flex-grow h-2/3 md:h-full md:w-3/4 bg-black flex items-center justify-center">
          {item.type === 'image' ? (
            <img src={item.originalUrl || item.url} alt={item.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <video src={item.originalUrl || item.url} controls autoPlay className="max-h-full max-w-full object-contain" />
          )}
          <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors" aria-label="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-1/4 h-1/3 md:h-full flex flex-col p-6 overflow-y-auto bg-zinc-50 border-l border-zinc-200">
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-1 text-zinc-900">{item.name}</h2>
            <p className="text-zinc-500 text-sm mb-6">{new Date(item.date).toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' })}</p>
            
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => onToggleFavorite(item.id)} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700">
                {item.isFavorite ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5 text-zinc-500" />}
                <span className="font-semibold text-sm">{item.isFavorite ? '已收藏' : '收藏'}</span>
              </button>
              <a href={item.originalUrl || item.url} download target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700">
                <DownloadIcon className="w-5 h-5 text-zinc-500" />
                <span className="font-semibold text-sm">下载</span>
              </a>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-2 text-zinc-500 uppercase tracking-wider"><TagIcon className="w-5 h-5"/> AI 标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.aiTags.map(tag => <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}
                    </div>
                </div>

                {item.metadata && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-zinc-500 uppercase tracking-wider"><InfoIcon className="w-5 h-5"/> 照片信息</h3>
                    <div className="space-y-2 text-sm text-zinc-600">
                        <div className="flex justify-between"><span>相机:</span> <span className="font-medium text-zinc-800 text-right">{item.metadata.camera}</span></div>
                        <div className="flex justify-between"><span>光圈:</span> <span className="font-medium text-zinc-800 text-right">{item.metadata.aperture}</span></div>
                        <div className="flex justify-between"><span>快门:</span> <span className="font-medium text-zinc-800 text-right">{item.metadata.shutterSpeed}</span></div>
                        <div className="flex justify-between"><span>ISO:</span> <span className="font-medium text-zinc-800 text-right">{item.metadata.iso}</span></div>
                        <div className="flex justify-between"><span>焦距:</span> <span className="font-medium text-zinc-800 text-right">{item.metadata.focalLength}</span></div>
                    </div>
                  </div>
                )}
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