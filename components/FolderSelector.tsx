import React from 'react';
import { LibraryIcon, PhotoIcon, VideoIcon } from './Icons';

export type ViewType = 'all' | 'image' | 'video';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { key: 'all' as ViewType, label: '图库', icon: LibraryIcon },
    { key: 'image' as ViewType, label: '照片', icon: PhotoIcon },
    { key: 'video' as ViewType, label: '视频', icon: VideoIcon },
  ];

  const handleViewClick = (view: ViewType) => {
    setActiveView(view);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-60 h-screen sticky top-0 bg-slate-950/70 backdrop-blur-lg p-4 border-r border-slate-800/80 flex-shrink-0 hidden md:flex md:flex-col">
        <nav className="mt-4">
          <ul>
            {navItems.map(item => (
              <li key={item.key}>
                <button
                  onClick={() => handleViewClick(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                    activeView === item.key
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;