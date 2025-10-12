
import React from 'react';
import type { MediaItem } from '../types';
// Fix: Corrected import path for MediaItemCard component.
import MediaItemCard from './MediaItemCard';

interface MediaGridProps {
  items: Record<string, MediaItem[]>;
  onItemClick: (item: MediaItem) => void;
  onToggleFavorite: (id: string) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({ items, onItemClick, onToggleFavorite }) => {
  return (
    <div className="space-y-12">
      {/* Fix: Replaced `Object.entries` with `Object.keys`. This resolves a TypeScript issue where
          the value from `Object.entries` was inferred as `unknown`, causing a runtime error.
          By using `Object.keys`, `items[date]` is correctly typed as `MediaItem[]`. */}
      {Object.keys(items).map((date) => (
        <div key={date}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 px-1">{date}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 sm:gap-2">
            {items[date].map((item) => (
              <MediaItemCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaGrid;