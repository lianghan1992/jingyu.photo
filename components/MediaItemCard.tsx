
import React from 'react';
import type { MediaItem } from '../types';
import { PlayIcon, HeartIcon, HeartSolidIcon } from './Icons';

interface MediaItemCardProps {
  item: MediaItem;
  onClick: () => void;
  onToggleFavorite: (uid: string) => void;
}

const MediaItemCard: React.FC<MediaItemCardProps> = ({ item, onClick, onToggleFavorite }) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    onToggleFavorite(item.uid);
  };

  return (
    <div 
      className="group aspect-square relative overflow-hidden rounded-lg cursor-pointer bg-gray-200"
      onClick={onClick}
      role="button"
      aria-label={`View ${item.file_name}`}
    >
      {item.thumbnailUrl && (
        <img
          src={`${item.thumbnailUrl}?size=small`}
          alt={item.file_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      )}
      
      {item.file_type === 'video' && (
         <div className="absolute bottom-1.5 left-1.5">
            <PlayIcon className="w-4 h-4 text-white drop-shadow-lg" />
        </div>
      )}

      <button 
        onClick={handleFavoriteClick}
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/40 transition-opacity duration-200"
        aria-label={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
      >
        {item.is_favorite ? (
          <HeartSolidIcon className="w-4 h-4 text-red-500" />
        ) : (
          <HeartIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default MediaItemCard;
