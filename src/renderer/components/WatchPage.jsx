import React, { useState, useMemo } from 'react';
import { Share2, Heart, MessageSquare, MoreHorizontal, Check, SkipBack, SkipForward, ChevronRight, Play, Activity, X } from 'lucide-react';
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
  toggleSubscription,
  isMini = false
}) => {
  const isLiked = likedVideos.some(v => v.id === playingVideo.id);
  const isSubscribed = subscriptions.some(a => a.id === playingVideo.author.id);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Only show "Show more" if the description is actually long
  const needsExpansion = useMemo(() => {
    return (playingVideo.description?.length || 0) > 200;
  }, [playingVideo.description]);

  if (isMini) {
    return (
      <motion.div 
        layout
        layoutId="global-player-container"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full h-full overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-black group relative"
      >
        <div className="absolute top-3 right-3 z-[2000] opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onVideoClick(null); }}
            className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-xl hover:bg-black/80 rounded-full border border-white/10 text-white/60 hover:text-white transition-all active:scale-90"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`flex flex-col ${isTheaterMode ? 'w-full' : 'lg:flex-row gap-6 max-w-[2000px] mx-auto px-4'} pt-0 pb-20 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]`}>
      {/* Primary Content */}
      <div className={`flex-1 min-w-0 ${isTheaterMode ? 'w-full' : ''}`}>
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`aspect-video rounded-[2rem] overflow-hidden bg-black shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative group border border-white/[0.08] ${isTheaterMode ? 'rounded-none h-[88vh] border-x-0 border-t-0' : ''}`}
        >
          {children}
        </motion.div>

        <AnimatePresence>
          {!isFocusMode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`mt-10 ${isTheaterMode ? 'max-w-[1400px] mx-auto px-8' : 'px-4'}`}
            >
              <div className="flex flex-col gap-6">
                <h1 className="text-[26px] font-bold tracking-tight text-white leading-tight">{playingVideo.title}</h1>
                
                <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#0A0A0A] overflow-hidden border border-white/5">
                          {playingVideo.author.thumbnail ? (
                            <img 
                              src={playingVideo.author.thumbnail} 
                              alt={playingVideo.author.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                              <span className="text-white/40 text-sm font-bold uppercase">{playingVideo.author.name[0]}</span>
                            </div>
                          )}
                        </div>
                        <div className="mr-6">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[17px] text-white">{playingVideo.author.name}</h3>
                            {playingVideo.author.isVerified && (
                              <div className="w-3.5 h-3.5 bg-white/10 rounded-full flex items-center justify-center">
                                <Check size={8} className="text-white/60" strokeWidth={4} />
                              </div>
                            )}
                          </div>
                          <p className="text-[12px] font-medium text-white/30">{playingVideo.author.subscribers || 'Creator'}</p>
                        </div>
                        <button 
                          onClick={() => toggleSubscription(playingVideo.author)}
                          className={`px-8 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 ${
                            isSubscribed 
                              ? 'bg-white/5 text-white/60 hover:bg-white/10' 
                              : 'bg-white text-black hover:bg-white/90 shadow-xl'
                          }`}
                        >
                          {isSubscribed ? 'Subscribed' : 'Subscribe'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <button 
                            onClick={() => toggleLike(playingVideo)}
                            className={`flex items-center gap-2.5 px-6 py-2.5 hover:bg-white/5 transition-all text-[13px] font-bold border-r border-white/5 group ${isLiked ? 'text-white' : 'text-white/80'}`}
                          >
                            <Heart size={18} fill={isLiked ? "white" : "none"} strokeWidth={2.5} className="group-active:scale-125 transition-transform" />
                            <span>{playingVideo.likes || 'Like'}</span>
                        </button>
                        <button className="px-5 py-2.5 hover:bg-white/5 transition-all text-white/80">
                            <Share2 size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                      <button 
                        onClick={() => setIsFocusMode(true)}
                        className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 active:scale-90"
                      >
                        <Activity size={18} className="text-white/40" />
                      </button>
                    </div>
                </div>
              </div>

              <div className={`mt-8 bg-white/5 p-8 rounded-3xl border border-white/5 group transition-all duration-300 ${isTheaterMode ? 'max-w-[1400px] mx-auto' : ''}`}>
                <div className="flex items-center gap-4 mb-4 text-[14px] font-bold text-white">
                  <span>{playingVideo.views} views</span>
                  <span className="text-white/20">•</span>
                  <span>{playingVideo.publishedAt}</span>
                </div>
                
                <motion.div 
                  animate={{ height: isExpanded ? 'auto' : '60px' }}
                  className="overflow-hidden relative"
                >
                  <p className={`text-white/60 leading-relaxed text-[15px] font-medium whitespace-pre-wrap ${!isExpanded && needsExpansion ? 'line-clamp-2' : ''}`}>
                    {playingVideo.description}
                  </p>
                </motion.div>
                
                {needsExpansion && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-4 text-[13px] font-bold text-white hover:text-white/80 transition-all"
                  >
                    {isExpanded ? 'Show less' : '...more'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar / Recommendations */}
      <AnimatePresence>
        {!isFocusMode && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`w-full lg:w-[400px] flex-shrink-0 ${isTheaterMode ? 'max-w-[1400px] mx-auto px-8 mt-16' : ''}`}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WatchPage;
