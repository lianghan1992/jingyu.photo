import React, { useState, useEffect } from 'react';
import { LibraryIcon, PhotoIcon, VideoIcon, FolderIcon } from './Icons';
import { fetchFolders } from '../services/api';

export type ViewType = 'all' | 'image' | 'video';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  activeFolder: string | null;
  setActiveFolder: (folder: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, activeFolder, setActiveFolder }) => {
  const [folders, setFolders] = useState<string[]>([]);
  
  const navItems = [
    { key: 'all' as ViewType, label: '图库', icon: LibraryIcon },
    { key: 'image' as ViewType, label: '照片', icon: PhotoIcon },
    { key: 'video' as ViewType, label: '视频', icon: VideoIcon },
  ];

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const fetchedFolders = await fetchFolders();
        setFolders(fetchedFolders);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      }
    };
    loadFolders();
  }, []);

  const handleViewClick = (view: ViewType) => {
    setActiveFolder(null);
    setActiveView(view);
  };
  
  const handleFolderClick = (folder: string | null) => {
      setActiveView('all');
      setActiveFolder(folder);
  };

  return (
    <aside className="w-60 h-screen sticky top-0 bg-gray-100/70 backdrop-blur-lg p-4 border-r border-gray-200/80 flex-shrink-0 hidden md:block">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
          苏
        </div>
        <span className="text-xl font-bold text-gray-800">
          璟聿.today
        </span>
      </div>
      <nav>
        <ul>
          {navItems.map(item => (
            <li key={item.key}>
              <button
                onClick={() => handleViewClick(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                  activeView === item.key && activeFolder === null
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-200/60'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {folders.length > 0 && (
         <div className="mt-6 pt-6 border-t border-gray-200/80">
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">文件夹</h3>
          <nav>
            <ul>
              {folders.map(folder => (
                <li key={folder}>
                  <button
                    onClick={() => handleFolderClick(folder)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                      activeFolder === folder
                        ? 'bg-blue-500 text-white shadow'
                        : 'text-gray-600 hover:bg-gray-200/60'
                    }`}
                  >
                    <FolderIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{folder.split(/[\\/]/).pop()}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
