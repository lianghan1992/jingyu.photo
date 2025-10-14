
import React, { useState, useEffect } from 'react';
import type { MediaItem } from '../types';
import { PlayIcon, HeartIcon, HeartSolidIcon } from './Icons';
import { fetchAuthenticatedBlobUrl } from '../services/api';

interface MediaItemCardProps {
  item: MediaItem;
  onClick: () => void;
  onToggleFavorite: (uid: string) => void;
}

const MediaItemCard: React.FC<MediaItemCardProps> = ({ item, onClick, onToggleFavorite }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadThumbnail = async () => {
      if (!item.thumbnailUrl) return;
      try {
        const url = await fetchAuthenticatedBlobUrl(`${item.thumbnailUrl}?size=small`);
        if (isMounted) {
          setImageSrc(url);
          objectUrl = url; // Store for cleanup
        }
      } catch (error) {
        console.error('Failed to load authenticated thumbnail:', error);
        if (isMounted) {
          setImageSrc(null); // Indicate error
        }
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [item.thumbnailUrl]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    onToggleFavorite(item.uid);
  };

  return (
    <div 
      className="group aspect-square relative overflow-hidden rounded-lg cursor-pointer bg-slate-800"
      onClick={onClick}
      role="button"
      aria-label={`View ${item.fileName}`}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={item.fileName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        // Simple placeholder while loading
        <div className="w-full h-full bg-slate-800"></div>
      )}
      
      {item.fileType === 'video' && (
         <div className="absolute bottom-1.5 left-1.5">
            <PlayIcon className="w-4 h-4 text-white drop-shadow-lg" />
        </div>
      )}

      <button 
        onClick={handleFavoriteClick}
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/40 transition-opacity duration-200"
        aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {item.isFavorite ? (
          <HeartSolidIcon className="w-4 h-4 text-red-500" />
        ) : (
          <HeartIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default MediaItemCard;