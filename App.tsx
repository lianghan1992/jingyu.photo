import React, { useState, useMemo } from 'react';
import type { MediaItem } from './types';
import Header from './components/Header';
import Sidebar, { ViewType } from './components/FolderSelector'; // Using FolderSelector as Sidebar
import MediaGrid from './components/MediaGrid';
import Modal from './components/Modal';
import { sampleMedia } from './data/sample-media';
import { TimeView } from './components/TimeSelector';

const App: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(sampleMedia);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewType>('all');
  const [activeSort, setActiveSort] = useState<'newest' | 'oldest'>('newest');
  const [timeView, setTimeView] = useState<TimeView>('days'); // Default view set to 'days'
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const filteredAndSortedMedia = useMemo(() => {
    return mediaItems
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.aiTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        let matchesView = true;
        if (activeView === 'image') {
          matchesView = item.type === 'image';
        } else if (activeView === 'video') {
          matchesView = item.type === 'video';
        }
        
        const matchesFavorites = favoritesOnly ? item.isFavorite : true;

        return matchesSearch && matchesView && matchesFavorites;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return activeSort === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [mediaItems, searchQuery, activeView, activeSort, favoritesOnly]);
  
  const groupedMedia = useMemo(() => {
    let options: Intl.DateTimeFormatOptions;
    if (timeView === 'days') {
        options = { year: 'numeric', month: 'long', day: 'numeric' };
    } else if (timeView === 'months') {
        options = { year: 'numeric', month: 'long' };
    } else { // years
        options = { year: 'numeric' };
    }

    return filteredAndSortedMedia.reduce((acc, item) => {
      const dateKey = new Date(item.date).toLocaleDateString('zh-CN', options);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, MediaItem[]>);
  }, [filteredAndSortedMedia, timeView]);

  const handleToggleFavorite = (id: string) => {
    setMediaItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleItemClick = (item: MediaItem) => {
    const index = filteredAndSortedMedia.findIndex(i => i.id === item.id);
    if (index !== -1) {
        setSelectedItemIndex(index);
    }
  };
  
  const handleCloseModal = () => {
      setSelectedItemIndex(null);
  };
  
  const handleNavigation = (direction: 'prev' | 'next') => {
      if (selectedItemIndex === null) return;
      
      const newIndex = direction === 'prev' ? selectedItemIndex - 1 : selectedItemIndex + 1;
      
      if (newIndex >= 0 && newIndex < filteredAndSortedMedia.length) {
          setSelectedItemIndex(newIndex);
      }
  };

  const selectedItem = selectedItemIndex !== null ? filteredAndSortedMedia[selectedItemIndex] : null;

  return (
    <div className="flex bg-zinc-50 min-h-screen text-zinc-800">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col h-screen">
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          timeView={timeView}
          setTimeView={setTimeView}
          favoritesOnly={favoritesOnly}
          setFavoritesOnly={setFavoritesOnly}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8">
              {filteredAndSortedMedia.length > 0 ? (
                  <MediaGrid 
                      items={groupedMedia} 
                      onItemClick={handleItemClick}
                      onToggleFavorite={handleToggleFavorite} 
                  />
              ) : (
                  <div className="text-center py-20">
                      <p className="text-gray-500 text-lg">没有找到匹配的项目。</p>
                  </div>
              )}
          </div>
        </main>
      </div>

      {selectedItem && (
        <Modal 
          item={selectedItem} 
          onClose={handleCloseModal}
          onToggleFavorite={handleToggleFavorite}
          onNavigate={handleNavigation}
        />
      )}
    </div>
  );
};

export default App;