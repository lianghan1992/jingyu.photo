import React from 'react';

type FilterType = 'all' | 'image' | 'video';
type SortType = 'newest' | 'oldest';

interface FilterBarProps {
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  activeSort: SortType;
  setActiveSort: (sort: SortType) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  activeFilter, setActiveFilter, 
  activeSort, setActiveSort,
  favoritesOnly, setFavoritesOnly
}) => {
  const filters: { key: FilterType, label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'image', label: '照片' },
    { key: 'video', label: '视频' },
  ];

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sticky top-[69px] z-10 bg-gray-100/80 backdrop-blur-lg border-b border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-lg">
          {filters.map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                activeFilter === filter.key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
           <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600">
            <input 
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            仅显示收藏
          </label>
        
          <select 
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value as SortType)}
            className="text-sm font-medium text-gray-600 bg-transparent border-none rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">最新</option>
            <option value="oldest">最旧</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
