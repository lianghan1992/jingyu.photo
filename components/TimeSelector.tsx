import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './Icons';

export type TimeView = 'years' | 'months' | 'days';

interface TimeSelectorProps {
  activeView: TimeView;
  setActiveView: (view: TimeView) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ activeView, setActiveView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const views: { key: TimeView, label: string, description: string }[] = [
    { key: 'years', label: '年', description: '按年分组' },
    { key: 'months', label: '月', description: '按月分组' },
    { key: 'days', label: '日', description: '按日分组' },
  ];

  const currentView = views.find(v => v.key === activeView) || views[2];

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
  
  const handleSelect = (view: TimeView) => {
    setActiveView(view);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        id="time-view-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-800 text-slate-300 hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-indigo-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>{currentView.label}</span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
            className="absolute right-0 mt-2 w-32 origin-top-right bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-lg z-30 animate-fade-in"
            role="menu" 
            aria-orientation="vertical" 
            aria-labelledby="time-view-button"
        >
          <div className="py-1" role="none">
            {views.map(view => (
              <button
                key={view.key}
                onClick={() => handleSelect(view.key)}
                className={`w-full flex items-center text-left px-4 py-2 text-sm transition-colors ${
                  activeView === view.key ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700/80'
                }`}
                role="menuitem"
              >
                {view.description}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSelector;