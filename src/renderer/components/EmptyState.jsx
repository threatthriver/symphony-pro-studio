import React from 'react';
import { Search, Compass, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const EmptyState = ({ type = 'home', onAction }) => {
  const config = {
    home: {
      icon: <Sparkles className="text-[#007AFF]" size={32} />,
      title: "Your Personal Symphony",
      description: "Start watching videos to help us build a personalized feed you'll love.",
      actionLabel: "Explore Trending",
      action: () => onAction('explore')
    },
    search: {
      icon: <Search className="text-[#007AFF]" size={32} />,
      title: "No results found",
      description: "Try searching for something else or check your spelling.",
      actionLabel: "Back to Home",
      action: () => onAction('home')
    }
  };

  const { icon, title, description, actionLabel, action } = config[type] || config.home;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative group"
      >
        {/* Glassmorphic Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-10 shadow-2xl transition-all duration-500 group-hover:border-white/20">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/10 via-transparent to-purple-500/10 opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mb-6 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              {icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white/95 mb-3 tracking-tight">
              {title}
            </h3>
            
            <p className="text-white/40 text-[14px] leading-relaxed mb-8 px-4">
              {description}
            </p>
            
            <button 
              onClick={action}
              className="mac-button w-full !py-3 !text-[14px] font-bold shadow-lg shadow-[#007AFF]/20 hover:shadow-[#007AFF]/30 transition-all active:scale-95"
            >
              {actionLabel}
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#007AFF]/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
      </motion.div>
    </div>
  );
};

export default EmptyState;
