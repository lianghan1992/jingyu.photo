import React, { useEffect, useRef } from 'react';
import { SearchIcon, CloseIcon } from './Icons';

interface SearchModalProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ searchQuery, setSearchQuery, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-focus the input when the modal opens
    inputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleKeyDownInInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onClose();
    }
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center p-4 pt-[15vh] animate-fade-in"
      onClick={(e) => { if(e.target === modalRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
    >
        <div className="w-full max-w-2xl">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <SearchIcon className="w-6 h-6 text-slate-500" />
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索照片、标签或地点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDownInInput}
              className="w-full pl-14 pr-14 py-4 border border-slate-700/80 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-slate-800 text-slate-100 placeholder-slate-400 text-xl"
              aria-label="Search media"
            />
            <button
              onClick={onClose}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-100 transition-colors"
              aria-label="关闭搜索"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
    </div>
  );
};

export default SearchModal;
