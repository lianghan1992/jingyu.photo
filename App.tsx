import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { MediaItem } from './types';
import Header from './components/Header';
import Sidebar, { ViewType } from './components/FolderSelector';
import MediaGrid from './components/MediaGrid';
import Modal from './components/Modal';
import { TimeView } from './components/TimeSelector';
import { fetchMedia, toggleFavorite } from './services/api';

const PAGE_SIZE = 42; // 7 columns * 6 rows

const App: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewType>('all');
  const [activeSort, setActiveSort] = useState<'newest' | 'oldest'>('newest');
  const [timeView, setTimeView] = useState<TimeView>('days');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLElement>(null);

  const loadMedia = useCallback(async (reset = false) => {
    if (isLoading || (!hasMore && !reset)) return;

    setIsLoading(true);
    setError(null);
    const currentPage = reset ? 1 : page;

    try {
      const response = await fetchMedia({
        page: currentPage,
        pageSize: PAGE_SIZE,
        sort: activeSort,
        type: activeView,
        favoritesOnly,
        search: searchQuery,
        folder: activeFolder,
      });

      setMediaItems(prev => reset ? response.items : [...prev, ...response.items]);
      setPage(currentPage + 1);
      setHasMore(response.items.length > 0 && response.items.length === PAGE_SIZE);
    } catch (err) {
      setError('无法加载媒体文件。请稍后重试。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, activeSort, activeView, favoritesOnly, searchQuery, activeFolder]);

  useEffect(() => {
    const freshLoad = async () => {
      // Wait for debouncing search query
      if (searchQuery) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      setMediaItems([]);
      setPage(1);
      setHasMore(true);
      await loadMedia(true);
    };
    freshLoad();
  }, [searchQuery, activeView, activeSort, favoritesOnly, activeFolder]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
        if (container && hasMore && !isLoading) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop - clientHeight < 500) { // 500px threshold
                loadMedia();
            }
        }
    };
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadMedia]);
  
  const groupedMedia = useMemo(() => {
    let options: Intl.DateTimeFormatOptions;
    if (timeView === 'days') {
        options = { year: 'numeric', month: 'long', day: 'numeric' };
    } else if (timeView === 'months') {
        options = { year: 'numeric', month: 'long' };
    } else { // years
        options = { year: 'numeric' };
    }

    return mediaItems.reduce((acc, item) => {
      const dateStr = item.date;
      // Robust date parsing
      const parsableDateStr = dateStr ? dateStr.replace(' ', 'T') : null;
      const date = parsableDateStr ? new Date(parsableDateStr) : null;
      
      const dateKey = (date && !isNaN(date.getTime()))
        ? date.toLocaleDateString('zh-CN', options)
        : '未知日期';

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, MediaItem[]>);
  }, [mediaItems, timeView]);

  const handleToggleFavorite = async (uid: string) => {
    const itemIndex = mediaItems.findIndex(item => item.uid === uid);
    if (itemIndex === -1) return;

    const item = mediaItems[itemIndex];
    const newIsFavorite = !item.isFavorite;

    const updatedItems = [...mediaItems];
    updatedItems[itemIndex] = { ...item, isFavorite: newIsFavorite };
    setMediaItems(updatedItems);

    try {
      await toggleFavorite(uid, item.isFavorite);
    } catch (error) {
      console.error("Failed to update favorite status:", error);
      updatedItems[itemIndex] = { ...item, isFavorite: item.isFavorite };
      setMediaItems(updatedItems);
    }
  };

  const handleItemClick = (item: MediaItem) => {
    const index = mediaItems.findIndex(i => i.uid === item.uid);
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
      
      if (newIndex >= 0 && newIndex < mediaItems.length) {
          setSelectedItemIndex(newIndex);
      }
  };

  const selectedItem = selectedItemIndex !== null ? mediaItems[selectedItemIndex] : null;

  return (
    <div className="flex bg-zinc-50 min-h-screen text-zinc-800">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
      />
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
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8">
              {mediaItems.length > 0 ? (
                  <MediaGrid 
                      items={groupedMedia} 
                      onItemClick={handleItemClick}
                      onToggleFavorite={handleToggleFavorite} 
                  />
              ) : (
                !isLoading && (
                  <div className="text-center py-20">
                      <p className="text-gray-500 text-lg">没有找到匹配的项目。</p>
                  </div>
                )
              )}
              {isLoading && (
                 <div className="text-center py-10 text-gray-500">
                    加载中...
                 </div>
              )}
              {error && (
                <div className="text-center py-10 text-red-500">
                   {error}
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