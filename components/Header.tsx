import React from 'react';
import { SearchIcon, HeartIcon, HeartSolidIcon, LibraryIcon, PhotoIcon, VideoIcon } from './Icons';
import TimeSelector, { TimeView } from './TimeSelector';
import SortSelector from './SortSelector';
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
        {/* Site Title/Logo */}
        <div className="flex items-center gap-3">
          <img src="icons/icon.svg" alt="璟聿今日 Logo" className="w-8 h-8 rounded-lg" />
          <span className="hidden md:block text-lg font-bold text-slate-100">
            璟聿今日
          </span>
        </div>
        
        {/* Controls Container */}
        <div className="flex items-center gap-2 md:gap-4">
            {/* 1. View switcher (mobile only) */}
            <div className="md:hidden flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
              {viewItems.map(view => (
                <button
                  key={view.key}
                  onClick={() => setActiveView(view.key)}
                  className={`p-1.5 rounded-md transition-colors ${
                    activeView === view.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-label={view.label}
                >
                  <view.icon className="w-5 h-5" />
                </button>
              ))}
            </div>

            {/* 2. Favorites */}
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
            
            {/* 3. Search */}
            <button 
                onClick={openSearch}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/80 transition-colors"
                aria-label="搜索"
            >
                <SearchIcon className="w-5 h-5" />
            </button>

            {/* 4. Year/Month/Day */}
            <TimeSelector activeView={timeView} setActiveView={setTimeView} />
            
            {/* 5. New/Old */}
            <SortSelector activeSort={activeSort} setActiveSort={setActiveSort} />
        </div>
      </div>
    </header>
  );
};

export default Header;