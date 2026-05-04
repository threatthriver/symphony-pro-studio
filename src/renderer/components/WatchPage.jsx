import React, { useState, useMemo } from 'react';
import { Share2, Heart, MessageSquare, MoreHorizontal, Check, SkipBack, SkipForward, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCard from './VideoCard';

const WatchPage = ({ 
  playingVideo, 
  relatedVideos, 
  onVideoClick, 
  onPrefetch, 
  children, 
  isTheaterMode,
  likedVideos,
  toggleLike,
  subscriptions,
  toggleSubscription
}) => {
  const isLiked = likedVideos.some(v => v.id === playingVideo.id);
  const isSubscribed = subscriptions.some(a => a.id === playingVideo.author.id);

  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show "Show more" if the description is actually long
  const needsExpansion = useMemo(() => {
    return (playingVideo.description?.length || 0) > 200;
  }, [playingVideo.description]);

  return (
    <div className={`flex flex-col ${isTheaterMode ? 'w-full' : 'lg:flex-row gap-10 max-w-[1700px] mx-auto px-6'} pt-2 pb-20 transition-all duration-500 ease-in-out`}>
      {/* Primary Content */}
      <div className={`flex-1 min-w-0 ${isTheaterMode ? 'w-full' : ''}`}>
        <motion.div 
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`aspect-video rounded-2xl overflow-hidden bg-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative group border border-white/5 ${isTheaterMode ? 'rounded-none h-[75vh]' : ''}`}
        >
          {children}
        </motion.div>

        <div className={`mt-8 ${isTheaterMode ? 'max-w-[1200px] mx-auto px-6' : ''}`}>
          <div className="flex flex-col gap-5">
             <h1 className="text-[26px] font-bold tracking-tight text-white/95 leading-[1.2]">{playingVideo.title}</h1>
             
             <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                   <div className="flex items-center gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {playingVideo.author.thumbnail ? (
                        <img 
                          src={playingVideo.author.thumbnail} 
                          alt={playingVideo.author.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white/40 text-sm font-black uppercase">{playingVideo.author.name[0]}</span>
                      )}
                    </motion.div>
                    <div className="mr-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                         <h3 className="font-bold text-[15px] text-white/95 tracking-tight">{playingVideo.author.name}</h3>
                         {playingVideo.author.isVerified && (
                           <Check size={14} className="text-[#007AFF]" strokeWidth={3} />
                         )}
                      </div>
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-wider">Verified Artist</p>
                    </div>
                  <button 
                    onClick={() => toggleSubscription(playingVideo.author)}
                    className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all duration-300 transform active:scale-95 ${
                      isSubscribed 
                        ? 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/15' 
                        : 'bg-white text-black hover:bg-white/90 shadow-[0_8px_20px_-4px_rgba(255,255,255,0.2)]'
                    }`}
                  >
                    {isSubscribed ? 'Following' : 'Subscribe'}
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center bg-white/[0.04] p-1 rounded-full border border-white/[0.08] shadow-inner backdrop-blur-xl">
                     <button 
                        onClick={() => toggleLike(playingVideo)}
                        className={`flex items-center gap-2.5 px-6 py-2 hover:bg-white/5 rounded-l-full transition-all text-[13px] font-bold border-r border-white/10 group ${isLiked ? 'text-[#007AFF]' : 'text-white/80'}`}
                      >
                        <Heart size={16} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} className="group-active:scale-125 transition-transform" />
                        <span>{isLiked ? 'Loved' : 'Like'}</span>
                     </button>
                     <button className="flex items-center gap-2.5 px-6 py-2 hover:bg-white/5 rounded-r-full transition-all text-[13px] font-bold text-white/80 group">
                        <Share2 size={16} strokeWidth={2.5} className="group-active:rotate-12 transition-transform" />
                        <span>Share</span>
                     </button>
                  </div>
                  <button className="p-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-all border border-white/[0.08] shadow-sm backdrop-blur-xl active:scale-90">
                    <MoreHorizontal size={18} className="text-white/70" />
                  </button>
                </div>
             </div>
          </div>
        </div>
        
        <div className={`mt-8 bg-white/[0.03] p-6 rounded-[24px] border border-white/[0.06] relative overflow-hidden group hover:border-white/10 transition-all duration-500 ${isTheaterMode ? 'max-w-[1200px] mx-auto px-6' : ''}`}>
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#007AFF]/5 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="flex items-center gap-10 mb-6 relative">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.15em] mb-1.5">Global Reach</span>
              <span className="font-bold text-sm text-white/90 tracking-tight">{playingVideo.views}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.15em] mb-1.5">Mastered On</span>
              <span className="font-bold text-sm text-white/90 tracking-tight">{playingVideo.publishedAt || 'Recently'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.15em] mb-1.5">Stream Quality</span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
                 <span className="font-bold text-sm text-[#007AFF] tracking-tight">4K Dynamic HDR</span>
              </div>
            </div>
          </div>
          
          <motion.div 
            animate={{ height: isExpanded ? 'auto' : '80px' }}
            className="overflow-hidden relative"
          >
            <p className={`text-white/50 leading-[1.6] text-[13.5px] font-medium max-w-4xl whitespace-pre-wrap ${!isExpanded && needsExpansion ? 'line-clamp-3' : ''}`}>
              {playingVideo.description || `Symphony Pro Studio: High-performance video experience. Optimized for Apple Silicon and Retina displays. Enjoy seamless playback with native macOS integration.`}
            </p>
            {!isExpanded && needsExpansion && (
               <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
            )}
          </motion.div>
          
          {needsExpansion && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 text-[12px] font-black text-[#007AFF] hover:text-[#3395FF] transition-all flex items-center gap-1.5 group/btn uppercase tracking-widest"
            >
               {isExpanded ? 'Minimize Studio' : 'Expand Details'}
               <ChevronRight size={12} strokeWidth={3} className={`transition-transform duration-300 ${isExpanded ? '-rotate-90' : 'group-hover/btn:translate-x-1'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Sidebar / Recommendations */}
      <div className={`w-full lg:w-[420px] flex-shrink-0 ${isTheaterMode ? 'max-w-[1200px] mx-auto px-6 mt-12' : ''}`}>
        <div className="flex items-center justify-between mb-6 px-1">
           <div className="flex items-center gap-2">
              <Play size={10} className="text-[#007AFF] fill-current" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Next In Queue</h3>
           </div>
           <button className="text-[10px] font-bold text-white/20 hover:text-[#007AFF] transition-colors bg-white/5 px-3 py-1 rounded-full border border-white/5">Autoplay On</button>
        </div>
        <div className="space-y-4">
          {relatedVideos.map((video, idx) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={video.id} 
            >
              <VideoCard 
                video={video} 
                onClick={() => onVideoClick(video)}
                onPrefetch={onPrefetch}
                layout="list"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
