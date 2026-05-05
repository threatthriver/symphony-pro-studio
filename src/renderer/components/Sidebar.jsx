import React from 'react';
import { Home, TrendingUp, MonitorPlay, Settings, Download, History, Clock, Heart, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NavItem = React.memo(({ icon, label, active, onClick, collapsed }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group no-drag relative ${
      active 
        ? 'text-white' 
        : 'text-white/40 hover:bg-white/[0.05] hover:text-white/80'
    }`}
  >
    {active && (
      <motion.div
        layoutId="activePill"
        className="absolute inset-0 bg-white/[0.08] rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.05] z-0"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
    
    <div className={`flex-shrink-0 z-10 transition-all duration-300 ${active ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
      {React.cloneElement(icon, { size: 18, strokeWidth: 2 })}
    </div>
    
    <AnimatePresence>
      {!collapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className={`text-[13px] font-bold leading-tight z-10 tracking-tight ${active ? 'font-black' : ''}`}
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
));

const MAIN_NAV_ITEMS = [
  { id: 'home', icon: <Home />, label: 'Home' },
  { id: 'explore', icon: <TrendingUp />, label: 'Discover' },
  { id: 'subscriptions', icon: <MonitorPlay />, label: 'Creators' }
];

const LIBRARY_NAV_ITEMS = [
  { id: 'downloads', icon: <Download />, label: 'Downloads' },
  { id: 'history', icon: <History />, label: 'History' },
  { id: 'liked', icon: <Heart />, label: 'Liked' }
];

const Sidebar = ({ playingVideo, currentView, onNavigate }) => {
  const isCollapsed = !!playingVideo;

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isCollapsed ? 76 : 240
      }}
      className="bg-[#0A0A0A] pt-16 flex flex-col no-drag border-r border-white/[0.05] z-40 relative h-screen transition-all duration-300 overflow-hidden"
    >
      
      <div className="flex-1 space-y-10 px-3 relative z-10">
        <div>
          {!isCollapsed && (
            <div className="px-4 mb-4">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Symphony Studio</span>
            </div>
          )}
          <div className="space-y-1">
            {MAIN_NAV_ITEMS.map((item) => (
              <NavItem 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                active={currentView === item.id} 
                onClick={() => onNavigate(item.id)} 
                collapsed={isCollapsed}
              />
            ))}
          </div>
        </div>

        <div>
          {!isCollapsed && (
            <div className="px-4 mb-4 flex items-center gap-2">
              <Library size={10} className="text-white/20" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Library</span>
            </div>
          )}
          <div className="space-y-1">
            {LIBRARY_NAV_ITEMS.map((item) => (
              <NavItem 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                active={currentView === item.id}
                onClick={() => onNavigate(item.id)}
                collapsed={isCollapsed}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-auto pb-8 px-3 relative z-10">
        <div className="pt-6 border-t border-white/[0.03]">
          <NavItem 
            icon={<Settings />} 
            label="Preferences" 
            active={currentView === 'settings'}
            onClick={() => onNavigate('settings')}
            collapsed={isCollapsed} 
          />
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
