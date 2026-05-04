import React from 'react';
import { Download, Music, Check, Play, MoreHorizontal, Sparkles, Activity } from 'lucide-react';
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
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      onClick={onClick}
      onMouseEnter={() => { if (onPrefetch) onPrefetch(video.id); setIsHovered(true); }}
      onMouseLeave={() => { setShowQualities(false); setIsHovered(false); }}
      className={`group cursor-pointer relative will-change-transform ${layout === 'grid' ? 'space-y-4' : 'flex gap-6 mb-8'}`}
    >
      {/* Dynamic Elevation Shadow */}
      <div className={`absolute -inset-4 bg-white/[0.02] rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-all duration-500 blur-2xl -z-10`} />

      <div className={`relative rounded-[1.5rem] overflow-hidden bg-[#0A0A0A] transition-all duration-700 ease-out border border-white/[0.03]
        ${isHovered ? 'scale-[1.02] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] border-white/[0.08]' : 'shadow-lg'}
        ${layout === 'grid' ? 'aspect-video w-full' : 'w-64 aspect-video flex-shrink-0'}`}>
        
        <img 
          src={video.bestThumbnail.url} 
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
        />
        
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
        
        {/* Premium Timestamp */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-2xl px-2 py-1 rounded-lg text-[10px] font-black text-white/90 border border-white/10 shadow-xl z-20 tracking-[0.1em] uppercase">
          {video.duration}
        </div>
        
        {/* Hover Details Overlay */}
        <AnimatePresence>
          {isHovered && !showQualities && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col justify-end p-4 bg-black/20"
            >
               <motion.div 
                 initial={{ y: 10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="flex items-center gap-2"
               >
                 <div className="px-2 py-0.5 bg-[#007AFF] rounded-md text-[8px] font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(0,122,255,0.4)]">Studio Master</div>
                 <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-widest text-white border border-white/10">Retina</div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-3 right-3 flex flex-col gap-2 z-30"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setShowQualities(!showQualities); }}
                className="w-9 h-9 rounded-2xl bg-black/40 hover:bg-[#007AFF] text-white flex items-center justify-center backdrop-blur-2xl border border-white/10 transition-all shadow-2xl active:scale-90 group/btn"
              >
                <Download size={14} className="group-hover/btn:scale-110 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quality Studio Menu */}
        <AnimatePresence>
          {showQualities && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 z-[40] flex flex-col items-center justify-center p-6 bg-[#050505]/95 backdrop-blur-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                <Activity size={12} className="animate-pulse" /> Precision Mastering
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
                {[2160, 1080, 720, 480].map(q => (
                  <button 
                    key={q}
                    onClick={(e) => handleDownload(e, 'video', q)}
                    className="px-4 py-3 bg-white/[0.03] hover:bg-[#007AFF] text-white rounded-2xl text-[12px] font-black transition-all border border-white/[0.05] active:scale-95 shadow-lg group/q"
                  >
                    <span className="group-hover/q:scale-110 block transition-transform">
                      {q === 2160 ? '4K Ultra' : q + 'P HD'}
                    </span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowQualities(false)}
                className="mt-8 text-[10px] font-black text-white/20 hover:text-white uppercase tracking-[0.3em] transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`${layout === 'grid' ? 'flex gap-4' : 'flex flex-col flex-1 min-w-0 pt-1'}`}>
        {layout === 'grid' && (
          <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-tr from-white/10 to-transparent flex-shrink-0 overflow-hidden border border-white/10 mt-1 shadow-xl relative group/avatar">
             <div className="absolute inset-0 bg-[#007AFF]/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
             {video.author.thumbnail ? (
               <img src={video.author.thumbnail} alt={video.author.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" />
             ) : (
               <div className="w-full h-full flex items-center justify-center font-black text-white/20 text-[14px] uppercase bg-white/[0.02]">
                 {video.author.name[0]}
               </div>
             )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-black leading-[1.3] text-white/90 line-clamp-2 transition-colors group-hover:text-[#007AFF] tracking-tight ${layout === 'grid' ? 'text-[15px]' : 'text-[16px] mb-2'}`}>
            {video.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-white/40 text-[11px] font-black group-hover:text-white/80 transition-colors truncate uppercase tracking-[0.1em] max-w-[160px]">
              {video.author.name}
            </p>
            {video.author.isVerified && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} 
                transition={{ duration: 4, repeat: Infinity }}
                className="w-3.5 h-3.5 bg-[#007AFF]/10 border border-[#007AFF]/30 rounded-full flex items-center justify-center"
              >
                <Check size={8} className="text-[#007AFF]" strokeWidth={4} />
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase">{video.views} Views</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase">{video.duration || 'Live Now'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
