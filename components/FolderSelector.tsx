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
      <aside className="w-60 h-screen sticky top-0 bg-gray-100/70 backdrop-blur-lg p-4 border-r border-gray-200/80 flex-shrink-0 hidden md:flex md:flex-col">
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
                    activeView === item.key
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
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-100/90 backdrop-blur-lg border-t border-gray-200/80 z-30">
        <ul className="flex justify-around items-center h-16">
          {navItems.map(item => (
            <li key={item.key} className="flex-1 h-full">
              <button
                onClick={() => handleViewClick(item.key)}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors ${
                  activeView === item.key
                    ? 'text-blue-500'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
