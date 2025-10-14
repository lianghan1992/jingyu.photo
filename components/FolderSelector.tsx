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
      <aside className="w-60 h-screen sticky top-0 bg-zinc-950/70 backdrop-blur-lg p-4 border-r border-zinc-800/80 flex-shrink-0 hidden md:flex md:flex-col">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
            璟
          </div>
          <span className="text-xl font-bold text-zinc-100">
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
                    activeView === item.key
                      ? 'bg-blue-500 text-white shadow'
                      // Fix: Corrected TailwindCSS class for hover effect on sidebar navigation items.
                      : 'text-zinc-400 hover:bg-zinc-800/60'
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