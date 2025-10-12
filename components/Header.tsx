import React from 'react';
import { SearchIcon, HeartIcon, HeartSolidIcon } from './Icons';
import TimeSelector, { TimeView } from './TimeSelector';

type SortType = 'newest' | 'oldest';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeSort: SortType;
  setActiveSort: (sort: SortType) => void;
  timeView: TimeView;
  setTimeView: (view: TimeView) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  activeSort, 
  setActiveSort,
  timeView,
  setTimeView,
  favoritesOnly,
  setFavoritesOnly
}) => {
  return (
    <header className="sticky top-0 z-20 bg-zinc-50/80 backdrop-blur-lg border-b border-gray-200/80 px-4 sm:px-6 md:px-8 py-3">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="搜索照片、标签或地点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300/60 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white/70 hover:border-gray-400/80"
              aria-label="Search media"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`p-2 rounded-lg transition-colors ${
                favoritesOnly 
                  ? 'bg-red-100 text-red-500' 
                  : 'text-gray-600 hover:bg-gray-200/80'
              }`}
              aria-pressed={favoritesOnly}
              aria-label={favoritesOnly ? "显示全部" : "仅显示收藏"}
            >
              {favoritesOnly ? <HeartSolidIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
            </button>

            <TimeSelector activeView={timeView} setActiveView={setTimeView} />
            <select 
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as SortType)}
              className="text-sm font-medium text-gray-600 bg-transparent border-none rounded-md focus:ring-2 focus:ring-blue-500"
              aria-label="Sort media"
            >
              <option value="newest">最新</option>
              <option value="oldest">最旧</option>
            </select>
        </div>
      </div>
    </header>
  );
};

export default Header;