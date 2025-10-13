import React, { useState, useEffect } from 'react';
import { LibraryIcon, PhotoIcon, VideoIcon, FolderIcon, SparklesIcon } from './Icons';
import { fetchFolders, triggerAiProcessing } from '../services/api';

export type ViewType = 'all' | 'image' | 'video';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  activeFolder: string | null;
  setActiveFolder: (folder: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, activeFolder, setActiveFolder }) => {
  const [folders, setFolders] = useState<string[]>([]);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navItems = [
    { key: 'all' as ViewType, label: '图库', icon: LibraryIcon },
    { key: 'image' as ViewType, label: '照片', icon: PhotoIcon },
    { key: 'video' as ViewType, label: '视频', icon: VideoIcon },
  ];

  useEffect(() => {
    const loadFolders = async () => {
      try {
        setFolderError(null);
        const fetchedFolders = await fetchFolders();
        setFolders(fetchedFolders);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "无法加载文件夹";
        setFolderError(errorMessage);
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
  
  const handleAiProcessClick = async () => {
    setIsProcessing(true);
    try {
        const result = await triggerAiProcessing();
        alert(`成功！\n${result.message}\n\nAI处理任务已在后台开始，请稍后刷新查看结果。`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '发生未知错误';
        alert(`错误: ${errorMessage}`);
    } finally {
        setIsProcessing(false);
    }
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
          <li>
            <button
                onClick={handleAiProcessClick}
                disabled={isProcessing}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-gray-200/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SparklesIcon className="w-5 h-5" />
                {isProcessing ? '处理中...' : 'AI处理'}
            </button>
          </li>
        </ul>
      </nav>
      {(folders.length > 0 || folderError) && (
         <div className="mt-6 pt-6 border-t border-gray-200/80">
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">文件夹</h3>
          {folderError ? (
            <p className="px-3 text-sm text-red-500">{folderError}</p>
          ) : (
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
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;