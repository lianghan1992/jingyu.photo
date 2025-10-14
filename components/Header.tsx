import React from 'react';
import { SearchIcon, HeartIcon, HeartSolidIcon, LibraryIcon, PhotoIcon, VideoIcon } from './Icons';
import TimeSelector, { TimeView } from './TimeSelector';
import { ViewType } from './FolderSelector';

type SortType = 'newest' | 'oldest';

interface HeaderProps {
  openSearch: () => void;
  activeSort: SortType;
  setActiveSort: (sort: SortType) => void;
  timeView: TimeView;
  setTimeView: (view: TimeView) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  openSearch, 
  activeSort, 
  setActiveSort,
  timeView,
  setTimeView,
  favoritesOnly,
  setFavoritesOnly,
  activeView,
  setActiveView
}) => {
  const viewItems = [
    { key: 'all' as ViewType, label: '图库', icon: LibraryIcon },
    { key: 'image' as ViewType, label: '照片', icon: PhotoIcon },
    { key: 'video' as ViewType, label: '视频', icon: VideoIcon },
  ];

  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 sm:px-6 md:px-8 py-3">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        
        {/* Left Side: View Toggles (Mobile) / Search Bar (Desktop) */}
        <div className="flex-1">
            {/* Desktop Search Bar */}
            <div className="hidden md:block max-w-2xl">
                <button
                    onClick={openSearch}
                    className="w-full text-left pl-4 pr-4 py-2 border border-slate-700/60 rounded-lg transition bg-slate-800/70 hover:border-slate-600/80 text-slate-500 flex items-center gap-2"
                    aria-label="Search media"
                >
                    <SearchIcon className="w-5 h-5" />
                    搜索照片、标签或地点...
                </button>
            </div>

            {/* Mobile View Toggles */}
            <div className="flex items-center gap-2 md:hidden">
              {viewItems.map(view => (
                <button
                  key={view.key}
                  onClick={() => setActiveView(view.key)}
                  className={`p-2 rounded-lg transition-colors ${
                    activeView === view.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700/80'
                  }`}
                  aria-label={view.label}
                >
                  <view.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
        </div>
        
        {/* Right Side: All other controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`p-2 rounded-lg transition-colors ${
              favoritesOnly 
                ? 'bg-red-900/50 text-red-400' 
                : 'text-slate-400 hover:bg-slate-700/80'
            }`}
            aria-pressed={favoritesOnly}
            aria-label={favoritesOnly ? "显示全部" : "仅显示收藏"}
          >
            {favoritesOnly ? <HeartSolidIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
          </button>

          <button 
              onClick={openSearch}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/80 transition-colors md:hidden"
              aria-label="搜索"
          >
              <SearchIcon className="w-5 h-5" />
          </button>

          <TimeSelector activeView={timeView} setActiveView={setTimeView} />
          
          <select 
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value as SortType)}
            className="text-sm font-medium text-slate-400 bg-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 transition-colors hover:bg-slate-700/80 border-transparent focus:border-indigo-500"
            aria-label="Sort media"
          >
            <option value="newest">新</option>
            <option value="oldest">旧</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;