import React, { useState, useEffect, useRef, useCallback } from 'react';
import { History, MonitorPlay, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoCard from './components/VideoCard';
import WatchPage from './components/WatchPage';
import Player from './components/Player';
import DownloadsPage from './components/DownloadsPage';
import SettingsPage from './components/SettingsPage';
import EmptyState from './components/EmptyState';
import { SymphonyAlgorithm } from './Algorithm';

const SkeletonCard = () => (
  <div className="space-y-2.5">
    <div className="aspect-video w-full rounded-xl bg-white/[0.05] animate-pulse border border-white/[0.03]" />
    <div className="flex gap-2.5">
      <div className="w-9 h-9 rounded-full bg-white/[0.05] animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 w-full bg-white/[0.05] rounded animate-pulse" />
        <div className="h-2.5 w-2/3 bg-white/[0.05] rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const skeletonCount = 15;


const App = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [currentView, setCurrentView] = useState('home');
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  
  const searchCache = useRef(new Map());

  // --- STATE & PERSISTENCE ---
  const [likedVideos, setLikedVideos] = useState(() => {
    const saved = localStorage.getItem('liked-videos');
    return saved ? JSON.parse(saved) : [];
  });

  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem('subscriptions');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('watch-history');
    return saved ? JSON.parse(saved) : [];
  });

  // Save changes to localStorage
  useEffect(() => localStorage.setItem('liked-videos', JSON.stringify(likedVideos)), [likedVideos]);
  useEffect(() => localStorage.setItem('subscriptions', JSON.stringify(subscriptions)), [subscriptions]);
  useEffect(() => localStorage.setItem('watch-history', JSON.stringify(history)), [history]);

  useEffect(() => {
    const unsubAvailable = window.api?.onUpdateAvailable(() => setUpdateAvailable(true));
    const unsubDownloaded = window.api?.onUpdateDownloaded(() => setUpdateDownloaded(true));
    return () => {
      unsubAvailable?.();
      unsubDownloaded?.();
    };
  }, []);

  // --- UTILITIES ---
  const toggleLike = useCallback((video) => {
    setLikedVideos(prev => {
      const exists = prev.find(v => v.id === video.id);
      if (exists) return prev.filter(v => v.id !== video.id);
      return [video, ...prev].slice(0, 50);
    });
  }, []);

  const toggleSubscription = useCallback((author) => {
    setSubscriptions(prev => {
      const exists = prev.find(a => a.id === author.id);
      if (exists) return prev.filter(a => a.id !== author.id);
      return [author, ...prev];
    });
  }, []);

  const getAlgorithmFeed = useCallback(async () => {
    setLoading(true);
    const feed = await SymphonyAlgorithm.getPersonalizedFeed({
      history,
      likedVideos,
      subscriptions,
      api: window.api
    });
    setVideos(feed);
    setLoading(false);
  }, [history, likedVideos, subscriptions]);

  // --- HANDLERS ---
  const handleSearch = useCallback(async (e, overrideQuery) => {
    if (e && e.key !== 'Enter') return;
    setLoading(true);
    const searchQuery = overrideQuery !== undefined ? overrideQuery : query;
    if (searchQuery) {
       const results = await window.api.search(searchQuery);
       setVideos(results);
       setLoading(false);
    } else {
       await getAlgorithmFeed();
    }
    if (currentView !== 'home') {
      setCurrentView('home');
      window.history.pushState({ view: 'home', video: playingVideo }, '');
    }
  }, [query, playingVideo, currentView, getAlgorithmFeed]);

  const handleNavigate = useCallback(async (view) => {
    if (view === currentView) return;
    setCurrentView(view);
    setLoading(true);
    if (view === 'home') {
      await getAlgorithmFeed();
    } else if (view === 'explore') {
      const results = await window.api.getTrending();
      setVideos(results);
      setLoading(false);
    } else if (view === 'subscriptions') {
      const results = await window.api.getSubscriptions();
      setVideos(results);
      setLoading(false);
    }
    window.history.pushState({ view, video: playingVideo }, '');
  }, [currentView, playingVideo, getAlgorithmFeed]);

  // --- EFFECTS ---
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    getAlgorithmFeed();
  }, []);

  useEffect(() => {
    window.history.replaceState({ view: 'home', video: null }, '');
    const handlePopState = (event) => {
      const state = event.state;
      if (state) {
        setCurrentView(state.view || 'home');
        setPlayingVideo(state.video || null);
      }
    };
    
    let lastSwipe = 0;
    const handleWheel = (e) => {
      if (Math.abs(e.deltaX) > 45 && Math.abs(e.deltaY) < 15 && Date.now() - lastSwipe > 800) {
        if (e.deltaX < -5) { window.history.back(); lastSwipe = Date.now(); }
        else if (e.deltaX > 5) { window.history.forward(); lastSwipe = Date.now(); }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      if (e.key === 't') setIsTheaterMode(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleVideoClick = useCallback(async (video) => {
    if (!video) {
      setPlayingVideo(null);
      setCurrentView('home');
      return;
    }
    window.api.warmVideo(video.id);
    
    let updatedVideo = { ...video };
    if (!video.author.thumbnail && video.author.id) {
      try {
        const thumb = await window.api.getChannelThumbnail(video.author.id);
        if (thumb) updatedVideo.author.thumbnail = thumb;
      } catch (err) {}
    }

    setHistory(prev => {
      const filtered = prev.filter(v => v.id !== updatedVideo.id);
      const newHistory = [updatedVideo, ...filtered].slice(0, 50);
      localStorage.setItem('watch-history', JSON.stringify(newHistory));
      return newHistory;
    });

    setPlayingVideo(updatedVideo);
    setCurrentView('watch');
    
    // Fetch full details (description, exact views, etc.) in background
    window.api.getVideoDetails(video.id).then(details => {
      if (details) {
        setPlayingVideo(prev => {
          // Only update if we're still on the same video
          if (prev?.id !== video.id) return prev;
          return {
            ...prev,
            description: details.description || prev.description,
            views: details.viewCount || prev.views,
            publishedAt: details.publishedAt || prev.publishedAt
          };
        });
      }
    });

    window.history.pushState({ view: 'watch', video: updatedVideo }, '');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  const prefetchVideo = useCallback((id) => {
    window.api.warmVideo(id);
  }, []);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || loading) return;
    setIsLoadingMore(true);
    const moreVideos = await window.api.searchMore();
    if (moreVideos && moreVideos.length > 0) {
      setVideos(prev => [...prev, ...moreVideos]);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, loading]);

  useEffect(() => {
    if (!loadMoreRef.current || currentView !== 'home') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        handleLoadMore();
      }
    }, { threshold: 0.1 });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [handleLoadMore, currentView]);

  return (
    <div className={`flex h-screen bg-[#050505] text-white overflow-hidden relative font-sans select-none selection:bg-white/10 transition-opacity duration-300 ${isWindowFocused ? "opacity-100" : "opacity-90"}`}>

      <Sidebar 
        playingVideo={playingVideo} 
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-10 bg-black">
        <Header 
          query={query} 
          setQuery={setQuery} 
          onSearch={handleSearch} 
          onNavigate={handleNavigate} 
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {currentView !== 'watch' && (
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="px-8 py-8 pb-32 max-w-[1800px] mx-auto min-h-full"
              >
                {currentView === 'downloads' ? (
                  <DownloadsPage />
                ) : currentView === 'settings' ? (
                  <SettingsPage />
                ) : currentView === 'history' ? (
                  <>
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="text-2xl font-black text-white/90 tracking-tight">Recent Sessions</h2>
                      <button 
                        onClick={() => { setHistory([]); localStorage.removeItem('watch-history'); }}
                        className="mac-button-secondary !text-[11px] !px-4"
                      >
                        Clear History
                      </button>
                    </div>
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-32 text-white/10">
                         <History size={48} strokeWidth={1} className="mb-4" />
                         <p className="text-sm font-medium">Your history is clear</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-10">
                        {history.map(video => (
                          <VideoCard 
                            key={video.id} 
                            video={video} 
                            onClick={() => handleVideoClick(video)}
                            onPrefetch={prefetchVideo}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>

                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="text-2xl font-black text-white/90 capitalize tracking-tight">
                        {currentView === 'home' ? 'Discover for You' : currentView}
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-12">
                      {loading ? (
                        Array(skeletonCount).fill(0).map((_, i) => (
                          <SkeletonCard key={i} />
                        ))
                      ) : (
                        videos.map(video => (
                          <VideoCard 
                            key={`${currentView}-${video.id}`} 
                            video={video} 
                            onClick={() => handleVideoClick(video)}
                            onPrefetch={prefetchVideo}
                          />
                        ))
                      )}
                    </div>

                    {!loading && videos.length === 0 && (
                      <EmptyState 
                        type={query ? 'search' : 'home'} 
                        onAction={handleNavigate}
                      />
                    )}

                    <div ref={loadMoreRef} className="h-24 flex items-center justify-center mt-8">
                      {isLoadingMore && (
                        <div className="w-6 h-6 border-2 border-white/5 border-t-[#007AFF] rounded-full animate-spin shadow-[0_0_15px_rgba(0,122,255,0.3)]" />
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent Watch Page / Player */}
          {playingVideo && (
            <motion.div
              layout
              layoutId="global-player-container"
              key="persistent-player"
              className={currentView === 'watch' 
                ? "relative z-10 w-full min-h-full bg-black" 
                : "fixed bottom-10 right-10 w-[400px] aspect-video z-[1000]"
              }
            >
              <WatchPage 
                playingVideo={playingVideo}
                relatedVideos={videos.filter(v => v.id !== playingVideo.id).slice(0, 12)}
                onVideoClick={handleVideoClick}
                onPrefetch={prefetchVideo}
                isTheaterMode={isTheaterMode}
                setIsTheaterMode={setIsTheaterMode}
                likedVideos={likedVideos}
                toggleLike={toggleLike}
                subscriptions={subscriptions}
                toggleSubscription={toggleSubscription}
                isMini={currentView !== 'watch'}
              >
                <Player 
                  videoId={playingVideo.id} 
                  title={playingVideo.title} 
                  isTheaterMode={isTheaterMode}
                  toggleTheater={() => setIsTheaterMode(!isTheaterMode)}
                />
              </WatchPage>
            </motion.div>
          )}

          {/* Update Notification */}
          <AnimatePresence>
            {updateDownloaded && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-10 left-10 z-[100] p-1 bg-gradient-to-br from-[#007AFF] to-[#0051FF] rounded-2xl shadow-[0_20px_50px_rgba(0,122,255,0.4)]"
              >
                <div className="bg-[#0A0A0A]/90 backdrop-blur-xl rounded-[calc(1rem-2px)] p-4 flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-[#007AFF] uppercase tracking-widest mb-0.5">System Update</span>
                    <span className="text-[14px] font-bold text-white/90">A new version is ready to install</span>
                  </div>
                  <button 
                    onClick={() => window.api.restartApp()}
                    className="px-5 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white text-[13px] font-black rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Restart & Install
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
