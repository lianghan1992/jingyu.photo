import React from 'react';

export type TimeView = 'years' | 'months' | 'days';

interface TimeSelectorProps {
  activeView: TimeView;
  setActiveView: (view: TimeView) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ activeView, setActiveView }) => {
  const views: { key: TimeView, label: string }[] = [
    { key: 'years', label: '年份' },
    { key: 'months', label: '月份' },
    { key: 'days', label: '日期' },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-200/60 p-1 rounded-lg">
      {views.map(view => (
        <button
          key={view.key}
          onClick={() => setActiveView(view.key)}
          className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
            activeView === view.key
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
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