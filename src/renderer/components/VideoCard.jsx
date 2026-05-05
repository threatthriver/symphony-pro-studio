import React from 'react';
import { Music, Check, Play, MoreHorizontal, Sparkles, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCard = React.memo(({ video, onClick, onPrefetch, layout = "grid" }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      onMouseEnter={() => { if (onPrefetch) onPrefetch(video.id); setIsHovered(true); }}
      onMouseLeave={() => { setIsHovered(false); }}
      className={`group cursor-pointer relative ${layout === 'grid' ? 'space-y-3' : 'flex gap-4 mb-6'}`}
    >
      <div className={`relative rounded-xl overflow-hidden bg-[#0A0A0A] border border-white/5 transition-all duration-300
        ${isHovered ? 'border-white/10' : ''}
        ${layout === 'grid' ? 'aspect-video w-full' : 'w-52 aspect-video flex-shrink-0'}`}>
        
        <img 
          src={video.bestThumbnail.url} 
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        
        {/* Timestamp */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white/90 z-20">
          {video.duration}
        </div>
      </div>

      <div className={`${layout === 'grid' ? 'flex gap-3' : 'flex flex-col flex-1 min-w-0 pt-0.5'}`}>
        {layout === 'grid' && (
          <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-white/5 border border-white/5">
             {video.author.thumbnail ? (
               <img src={video.author.thumbnail} alt={video.author.name} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center font-bold text-white/20 text-xs">
                 {video.author.name[0]}
               </div>
             )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold leading-snug text-white/90 line-clamp-2 transition-colors ${layout === 'grid' ? 'text-[14px]' : 'text-[15px] mb-1'}`}>
            {video.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <p className="text-white/40 text-[12px] font-medium truncate max-w-[160px]">
              {video.author.name}
            </p>
            {video.author.isVerified && (
              <Check size={12} className="text-white/40" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] text-white/40">{video.views} Views</span>
            <span className="text-white/20">•</span>
            <span className="text-[12px] text-white/40">{video.publishedAt || 'Recently'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
