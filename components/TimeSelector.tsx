import React from 'react';

export type TimeView = 'years' | 'months' | 'days';

interface TimeSelectorProps {
  activeView: TimeView;
  setActiveView: (view: TimeView) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ activeView, setActiveView }) => {
  const views: { key: TimeView, label: string }[] = [
    { key: 'years', label: '年' },
    { key: 'months', label: '月' },
    { key: 'days', label: '日' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
      {views.map(view => (
        <button
          key={view.key}
          onClick={() => setActiveView(view.key)}
          className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
            activeView === view.key
              ? 'bg-slate-300 text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-pressed={activeView === view.key}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
};

export default TimeSelector;