import React from 'react';
import { Download, Music, Check, Play, MoreHorizontal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCard = React.memo(({ video, onClick, onPrefetch, layout = "grid" }) => {
  const [showQualities, setShowQualities] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleDownload = (e, format, quality) => {
    e.stopPropagation();
    window.api.startDownload({
      url: `https://www.youtube.com/watch?v=${video.id}`,
      videoId: video.id,
      title: video.title,
      format,
      quality
    });
    setShowQualities(false);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      onClick={onClick}
      onMouseEnter={() => { onPrefetch(video.id); setIsHovered(true); }}
      onMouseLeave={() => { setShowQualities(false); setIsHovered(false); }}
      className={`group cursor-pointer relative will-change-transform ${layout === 'grid' ? 'space-y-3' : 'flex gap-5 mb-6'}`}
    >
      <div className={`relative rounded-2xl overflow-hidden bg-[#121212] transition-all duration-500 ease-out 
        ${isHovered ? 'scale-[1.02] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]' : 'shadow-lg'}
        ${layout === 'grid' ? 'aspect-video w-full' : 'w-56 aspect-video flex-shrink-0'}`}>
        
        <img 
          src={video.bestThumbnail.url} 
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-1000 ease-in-out group-hover:scale-110"
        />
        
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {/* Premium Timestamp */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xl px-2 py-0.5 rounded-lg text-[10px] font-black text-white border border-white/10 shadow-lg z-10 tracking-widest uppercase">
          {video.duration}
        </div>
        
        {/* Center Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
           <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-2xl text-white flex items-center justify-center border border-white/20 transform scale-75 group-hover:scale-100 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <Play size={20} fill="white" className="ml-1" />
           </div>
        </div>

        {/* Action Controls */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute top-2 right-2 flex flex-col gap-1.5 z-20"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setShowQualities(!showQualities); }}
                className="w-8 h-8 rounded-xl bg-black/60 hover:bg-[#007AFF] text-white flex items-center justify-center backdrop-blur-xl border border-white/10 transition-all shadow-xl active:scale-90"
              >
                <Download size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quality Studio Menu */}
        <AnimatePresence>
          {showQualities && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#0a0a0a]/95 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Sparkles size={10} /> Choose Resolution
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-[180px]">
                {[2160, 1080, 720, 480].map(q => (
                  <button 
                    key={q}
                    onClick={(e) => handleDownload(e, 'video', q)}
                    className="px-3 py-2 bg-white/[0.03] hover:bg-[#007AFF] text-white rounded-xl text-[11px] font-black transition-all border border-white/[0.05] active:scale-95"
                  >
                    {q === 2160 ? '4K' : q + 'P'}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowQualities(false)}
                className="mt-6 text-[10px] font-bold text-white/30 hover:text-white uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`${layout === 'grid' ? 'flex gap-3' : 'flex flex-col flex-1 min-w-0 pt-1'}`}>
        {layout === 'grid' && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex-shrink-0 overflow-hidden border border-white/10 mt-1 shadow-md">
             {video.author.thumbnail ? (
               <img src={video.author.thumbnail} alt={video.author.name} className="w-full h-full object-cover transition-transform hover:scale-110" />
             ) : (
               <div className="w-full h-full flex items-center justify-center font-black text-white/20 text-[12px] uppercase">
                 {video.author.name[0]}
               </div>
             )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-black leading-[1.3] text-white/90 line-clamp-2 transition-colors group-hover:text-white tracking-tight ${layout === 'grid' ? 'text-[14px]' : 'text-[15px] mb-2'}`}>
            {video.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-white/40 text-[11px] font-bold hover:text-white/80 transition-colors truncate uppercase tracking-[0.05em]">
              {video.author.name}
            </p>
            {video.author.isVerified && (
              <motion.div 
                animate={{ opacity: [0.6, 1, 0.6] }} 
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Check size={11} className="text-[#007AFF]" strokeWidth={3} />
              </motion.div>
            )}
          </div>
          <p className="text-white/20 text-[11px] font-black mt-1.5 tracking-widest uppercase">
            {video.views} VIEWS • {video.duration || 'LIVE NOW'}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
