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
    <div className={`flex flex-col ${isTheaterMode ? 'w-full' : 'lg:flex-row gap-12 max-w-[1800px] mx-auto px-10'} pt-4 pb-20 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]`}>
      {/* Primary Content */}
      <div className={`flex-1 min-w-0 ${isTheaterMode ? 'w-full' : ''}`}>
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`aspect-video rounded-[2rem] overflow-hidden bg-black shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative group border border-white/[0.08] ${isTheaterMode ? 'rounded-none h-[82vh] border-x-0 border-t-0' : ''}`}
        >
          {children}
        </motion.div>

        <div className={`mt-10 ${isTheaterMode ? 'max-w-[1200px] mx-auto px-8' : ''}`}>
          <div className="flex flex-col gap-8">
             <h1 className="text-[32px] font-black tracking-tight text-white leading-[1.1]">{playingVideo.title}</h1>
             
             <div className="flex flex-wrap items-center justify-between gap-8 pb-8 border-b border-white/[0.04]">
                   <div className="flex items-center gap-5">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent p-[1px] shadow-2xl cursor-pointer"
                    >
                      <div className="w-full h-full rounded-2xl bg-[#0A0A0A] overflow-hidden">
                        {playingVideo.author.thumbnail ? (
                          <img 
                            src={playingVideo.author.thumbnail} 
                            alt={playingVideo.author.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                            <span className="text-white/40 text-lg font-black uppercase">{playingVideo.author.name[0]}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                    <div className="mr-4">
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-black text-[17px] text-white tracking-tight">{playingVideo.author.name}</h3>
                         {playingVideo.author.isVerified && (
                           <motion.div
                             animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                             transition={{ duration: 3, repeat: Infinity }}
                             className="w-4 h-4 bg-[#007AFF]/20 border border-[#007AFF]/40 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,122,255,0.3)]"
                           >
                             <Check size={10} className="text-[#007AFF]" strokeWidth={4} />
                           </motion.div>
                         )}
                      </div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Verified Studio Creator</p>
                    </div>
                  <button 
                    onClick={() => toggleSubscription(playingVideo.author)}
                    className={`px-8 py-3 rounded-2xl text-[13px] font-black transition-all duration-500 transform active:scale-95 shadow-xl ${
                      isSubscribed 
                        ? 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10' 
                        : 'bg-[#007AFF] text-white hover:bg-[#007AFF]/90 shadow-[0_15px_30px_-10px_rgba(0,122,255,0.5)]'
                    }`}
                  >
                    {isSubscribed ? 'Following' : 'Subscribe'}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.05] shadow-2xl backdrop-blur-3xl">
                     <button 
                        onClick={() => toggleLike(playingVideo)}
                        className={`flex items-center gap-3 px-7 py-3 hover:bg-white/5 rounded-xl transition-all text-[13px] font-black border-r border-white/5 group ${isLiked ? 'text-[#FF2D55]' : 'text-white/70'}`}
                      >
                        <Heart size={18} fill={isLiked ? "currentColor" : "none"} strokeWidth={3} className="group-active:scale-125 transition-transform" />
                        <span>{isLiked ? 'Loved' : 'Appreciate'}</span>
                     </button>
                     <button className="flex items-center gap-3 px-7 py-3 hover:bg-white/5 rounded-xl transition-all text-[13px] font-black text-white/70 group">
                        <Share2 size={18} strokeWidth={3} className="group-active:rotate-12 transition-transform" />
                        <span>Propagate</span>
                     </button>
                  </div>
                  <button className="w-12 h-12 flex items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl transition-all border border-white/[0.05] shadow-xl backdrop-blur-3xl active:scale-90">
                    <MoreHorizontal size={20} className="text-white/50" />
                  </button>
                </div>
             </div>
          </div>
        </div>
        
        <div className={`mt-10 bg-white/[0.02] p-8 rounded-[2rem] border border-white/[0.04] relative overflow-hidden group hover:border-white/10 transition-all duration-700 ${isTheaterMode ? 'max-w-[1200px] mx-auto px-10' : ''}`}>
          {/* Studio Ambiance Glow */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#007AFF]/5 blur-[120px] pointer-events-none rounded-full" />
          
          <div className="flex items-center gap-12 mb-10 relative">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Global Audience</span>
              <span className="font-black text-[15px] text-white tracking-tight">{playingVideo.views}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Release Date</span>
              <span className="font-black text-[15px] text-white tracking-tight">{playingVideo.publishedAt || 'Studio Master'}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Mastering Info</span>
              <div className="flex items-center gap-2.5">
                 <div className="w-2 h-2 rounded-full bg-[#007AFF] shadow-[0_0_15px_rgba(0,122,255,0.8)] animate-pulse" />
                 <span className="font-black text-[15px] text-[#007AFF] tracking-tight">Lossless 4K HDR</span>
              </div>
            </div>
          </div>
          
          <motion.div 
            animate={{ height: isExpanded ? 'auto' : '90px' }}
            className="overflow-hidden relative"
          >
            <p className={`text-white/40 leading-[1.7] text-[14px] font-bold max-w-4xl whitespace-pre-wrap ${!isExpanded && needsExpansion ? 'line-clamp-3' : ''}`}>
              {playingVideo.description || `Symphony Pro Studio Environment. High-fidelity extraction active. This content has been optimized for native display on macOS with precision color grading and neural metadata enhancement.`}
            </p>
            {!isExpanded && needsExpansion && (
               <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
            )}
          </motion.div>
          
          {needsExpansion && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-8 text-[11px] font-black text-[#007AFF] hover:text-[#3395FF] transition-all flex items-center gap-2 group/btn uppercase tracking-[0.3em]"
            >
               {isExpanded ? 'Compress Studio' : 'Expand Session Details'}
               <ChevronRight size={14} strokeWidth={4} className={`transition-transform duration-500 ${isExpanded ? '-rotate-90' : 'group-hover/btn:translate-x-1.5'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Sidebar / Recommendations */}
      <div className={`w-full lg:w-[460px] flex-shrink-0 ${isTheaterMode ? 'max-w-[1200px] mx-auto px-10 mt-16' : ''}`}>
        <div className="flex items-center justify-between mb-8 px-2">
           <div className="flex items-center gap-3">
              <Activity size={14} className="text-[#007AFF] animate-pulse" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30">Up Next in Studio</h3>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Mastering</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
           </div>
        </div>
        <div className="space-y-6">
          {relatedVideos.map((video, idx) => (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, type: 'spring', damping: 20 }}
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
