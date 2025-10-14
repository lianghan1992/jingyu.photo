import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './Icons';

export type SortType = 'newest' | 'oldest';

interface SortSelectorProps {
  activeSort: SortType;
  setActiveSort: (sort: SortType) => void;
}

const SortSelector: React.FC<SortSelectorProps> = ({ activeSort, setActiveSort }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const sorts: { key: SortType, label: string, description: string }[] = [
    { key: 'newest', label: '新', description: '从新到旧' },
    { key: 'oldest', label: '旧', description: '从旧到新' },
  ];

  const currentSort = sorts.find(s => s.key === activeSort) || sorts[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleSelect = (sort: SortType) => {
    setActiveSort(sort);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        id="sort-type-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-800 text-slate-300 hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-indigo-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>{currentSort.label}</span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
            className="absolute right-0 mt-2 w-32 origin-top-right bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-lg z-30 animate-fade-in"
            role="menu" 
            aria-orientation="vertical" 
            aria-labelledby="sort-type-button"
        >
          <div className="py-1" role="none">
            {sorts.map(sort => (
              <button
                key={sort.key}
                onClick={() => handleSelect(sort.key)}
                className={`w-full flex items-center text-left px-4 py-2 text-sm transition-colors ${
                  activeSort === sort.key ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700/80'
                }`}
                role="menuitem"
              >
                {sort.description}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortSelector;
