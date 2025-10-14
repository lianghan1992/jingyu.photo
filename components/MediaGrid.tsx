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
      {/* Fix: Changed from Object.entries to Object.keys to resolve a TypeScript inference issue where the media array was being typed as 'unknown'. */}
      {Object.keys(items).map((date) => (
        <div key={date}>
          <h2 className="text-2xl font-bold text-zinc-100 mb-4 px-1">{date}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
            {items[date].map((item) => (
              <MediaItemCard
                key={item.uid}
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