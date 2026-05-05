import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, 
  Maximize, Settings, SkipBack, SkipForward, 
  MonitorPlay, Square, ChevronRight, ChevronLeft, Check, Activity, PictureInPicture2,
  Sun, Moon, Gauge, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return '0:00';
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const Player = ({ videoId, title, isTheaterMode, toggleTheater }) => {
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('0:00');
  const [durationFormatted, setDurationFormatted] = useState('0:00');
  const [useYouTubeEmbed, setUseYouTubeEmbed] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState('main');
  const [isAmbientMode, setIsAmbientMode] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [streamQuality, setStreamQuality] = useState('1080');

  const videoRef = useRef(null);
  const backgroundVideoRef = useRef(null);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    const fetchUrl = async () => {
      try {
        setLoading(true);
        setUseYouTubeEmbed(false);
        const data = await window.api.getVideoUrls(videoId, streamQuality);
        if (disposed) return;
        if (!data || data.error) {
          setUseYouTubeEmbed(true);
          setLoading(false);
          return;
        }
        setStreamData(data);
        setLoading(false);
      } catch (err) {
        if (!disposed) {
          setUseYouTubeEmbed(true);
          setLoading(false);
        }
      }
    };
    fetchUrl();
    return () => { disposed = true; };
  }, [videoId, streamQuality]);

  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
    }
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
    setShowSpeedIndicator(true);
    const timer = setTimeout(() => setShowSpeedIndicator(false), 1000);
    return () => clearTimeout(timer);
  }, [playbackRate, streamData]);

  useEffect(() => {
    if (!isPlaying) setShowControls(true);
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (!showSettings) setActiveMenu('main');
  }, [showSettings]);

  useEffect(() => {
    const unsub = window.api?.onMediaPlayPause(() => {
      togglePlay();
    });
    return () => unsub?.();
  }, [togglePlay]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);

      switch(e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 't': e.preventDefault(); toggleTheater(); break;
        case 'm': e.preventDefault(); setIsMuted(prev => !prev); break;
        case '>':
        case '.': 
          e.preventDefault(); 
          setPlaybackRate(prev => Math.min(prev + 0.25, 2)); 
          break;
        case '<':
        case ',': 
          e.preventDefault(); 
          setPlaybackRate(prev => Math.max(prev - 0.25, 0.25)); 
          break;
        case 'arrowright': e.preventDefault(); if (videoRef.current) videoRef.current.currentTime += 10; break;
        case 'arrowleft': e.preventDefault(); if (videoRef.current) videoRef.current.currentTime -= 10; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheater, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        setShowControls(true);
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setProgress((current / duration) * 100 || 0);
      setCurrentTimeFormatted(formatTime(current));
      if (duration) setDurationFormatted(formatTime(duration));
      if (audioRef.current && Math.abs(current - audioRef.current.currentTime) > 0.3) {
        audioRef.current.currentTime = current;
      }
      if (backgroundVideoRef.current && Math.abs(current - backgroundVideoRef.current.currentTime) > 0.3) {
        backgroundVideoRef.current.currentTime = current;
      }
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        if (duration > 0) setBufferProgress((bufferedEnd / duration) * 100);
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await containerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  };

  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={16} />;
    if (volume < 0.5) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-[#050505] flex flex-col items-center justify-center gap-4">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 rounded-2xl bg-[#007AFF] shadow-[0_0_40px_rgba(0,122,255,0.4)] flex items-center justify-center"
        >
          <Activity size={24} className="text-white" />
        </motion.div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Mastering Stream</span>
      </div>
    );
  }

  if (useYouTubeEmbed) {
    return (
      <iframe
        title={title}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`}
        className="w-full h-full bg-black"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full bg-black group overflow-hidden select-none cursor-none group-hover:cursor-default transition-all duration-700 ${isTheaterMode ? 'shadow-[0_0_100px_rgba(0,0,0,0.5)]' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
      }}
      onDoubleClick={toggleFullscreen}
    >
      {/* Immersive Ambilight Glow */}
      <AnimatePresence>
        {isAmbientMode && isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-[-10%] z-0 pointer-events-none"
          >
            <video
              ref={backgroundVideoRef}
              src={streamData?.videoUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover blur-[120px] scale-110 opacity-60"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <video
        ref={videoRef}
        src={streamData?.videoUrl}
        autoPlay
        playsInline
        preload="auto"
        muted={isMuted || streamData?.type === 'dash'}
        className="relative z-10 w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => { setIsPlaying(true); if (audioRef.current) audioRef.current.play(); }}
        onPause={() => { setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }}
        onError={() => setUseYouTubeEmbed(true)}
        onClick={togglePlay}
      />

      {/* Playback Speed Indicator */}
      <AnimatePresence>
        {showSpeedIndicator && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-6 py-3 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10"
          >
            <span className="text-2xl font-black text-white tracking-widest">{playbackRate}x</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {streamData?.type === 'dash' && (
        <audio
          ref={audioRef}
          src={streamData.audioUrl}
          autoPlay
          muted={isMuted}
          volume={volume}
        />
      )}

      {/* Floating UI Elements */}
      <AnimatePresence>
        {showControls && (
          <>
            {/* Top Bar */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start pointer-events-none z-20"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-white line-clamp-1 drop-shadow-2xl">{title}</h2>
              </div>
              <div className="px-3 py-1 bg-black/40 backdrop-blur-3xl rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{streamQuality}P</span>
              </div>
            </motion.div>

            {/* Bottom Control Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] bg-[#121212]/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-2xl z-20"
            >
              {/* Scrub Bar */}
              <div className="relative w-full h-1.5 group/progress mb-4 cursor-pointer"
                   onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const pos = (e.clientX - rect.left) / rect.width;
                     if (videoRef.current) videoRef.current.currentTime = pos * videoRef.current.duration;
                   }}>
                <div className="absolute inset-y-[-10px] inset-x-0" />
                <div className="w-full h-full bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-white/10 transition-all duration-300"
                    animate={{ width: `${bufferProgress}%` }}
                  />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-white transition-all duration-100"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                {/* Scrub Handle */}
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-xl opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, marginLeft: '-6px' }}
                />
              </div>

              {/* Action Rows */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button onClick={togglePlay} className="text-white hover:scale-125 transition-all active:scale-90">
                    {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-1" />}
                  </button>
                  
                  <div className="flex items-center gap-4 group/volume bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white transition-colors">
                      <VolumeIcon />
                    </button>
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
                         onClick={(e) => {
                           const rect = e.currentTarget.getBoundingClientRect();
                           const pos = (e.clientX - rect.left) / rect.width;
                           setVolume(pos);
                           setIsMuted(false);
                         }}>
                      <motion.div 
                        className="absolute top-0 left-0 h-full bg-white"
                        animate={{ width: isMuted ? 0 : `${volume * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-white/40 tracking-[0.1em] font-mono flex items-center gap-2">
                     <span className="text-white/90">{currentTimeFormatted}</span>
                     <span className="opacity-20">/</span>
                     <span>{durationFormatted}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <motion.button 
                    whileHover={{ rotate: 90 }}
                    className={`relative transition-colors ${showSettings ? 'text-white' : 'text-white/40 hover:text-white'}`}
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings size={18} />
                    {parseInt(streamQuality) >= 720 && (
                      <div className="absolute -top-1 -right-1.5 bg-red-600 text-[6px] font-black px-0.5 rounded-[1px] text-white leading-none">HD</div>
                    )}
                  </motion.button>
                  <button 
                    className={`transition-colors ${isTheaterMode ? 'text-white' : 'text-white/40 hover:text-white'}`}
                    onClick={toggleTheater}
                  >
                    <MonitorPlay size={18} />
                  </button>
                  <button 
                    className="text-white/40 hover:text-white transition-colors"
                    onClick={() => videoRef.current?.requestPictureInPicture()}
                  >
                    <PictureInPicture2 size={18} />
                  </button>
                  <button className="text-white/40 hover:text-white transition-colors" onClick={toggleFullscreen}>
                    <Maximize size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-32 right-[5%] w-[320px] bg-[#0A0A0A]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-50 p-2"
          >
            <div className="flex flex-col">
              {activeMenu === 'main' ? (
                <div className="p-2 space-y-1">
                  {/* Ambient Mode */}
                  <div className="flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#007AFF]/20 transition-colors">
                        <Sun size={20} className="text-white group-hover:text-[#007AFF] transition-colors" />
                      </div>
                      <span className="text-[14px] font-bold text-white/90">Ambient mode</span>
                    </div>
                    <button 
                      onClick={() => setIsAmbientMode(!isAmbientMode)}
                      className={`w-10 h-5 rounded-full transition-all relative ${isAmbientMode ? 'bg-[#007AFF]' : 'bg-white/20'}`}
                    >
                      <motion.div 
                        animate={{ x: isAmbientMode ? 22 : 2 }}
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                      />
                    </button>
                  </div>

                  {/* Sleep Timer */}
                  <div className="flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-not-allowed opacity-40">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Moon size={20} className="text-white" />
                      </div>
                      <span className="text-[14px] font-bold text-white/90">Sleep timer</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[12px] font-medium text-white/20">Off</span>
                       <ChevronRight size={16} className="text-white/10" />
                    </div>
                  </div>

                  {/* Playback Speed */}
                  <button 
                    onClick={() => setActiveMenu('speed')}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#FFD60A]/20 transition-colors">
                        <Gauge size={20} className="text-white group-hover:text-[#FFD60A] transition-colors" />
                      </div>
                      <span className="text-[14px] font-bold text-white/90">Playback speed</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[12px] font-bold text-white/40">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                       <ChevronRight size={16} className="text-white/20" />
                    </div>
                  </button>

                  {/* Quality */}
                  <button 
                    onClick={() => setActiveMenu('quality')}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#34C759]/20 transition-colors">
                        <Sliders size={20} className="text-white group-hover:text-[#34C759] transition-colors" />
                      </div>
                      <span className="text-[14px] font-bold text-white/90">Quality</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[12px] font-bold text-white/40">{streamQuality}p</span>
                       <ChevronRight size={16} className="text-white/20" />
                    </div>
                  </button>
                </div>
              ) : activeMenu === 'speed' ? (
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => setActiveMenu('main')}
                    className="flex items-center gap-3 px-5 py-4 text-white/40 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                    <span className="text-[14px] font-bold tracking-tight">Playback speed</span>
                  </button>
                  <div className="pt-2">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => { 
                          if (videoRef.current) videoRef.current.playbackRate = speed;
                          setPlaybackRate(speed);
                          setActiveMenu('main');
                        }}
                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-[13px] font-bold transition-all ${playbackRate === speed ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
                      >
                        <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                        {playbackRate === speed && <Check size={16} className="text-[#007AFF]" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => setActiveMenu('main')}
                    className="flex items-center gap-3 px-5 py-4 text-white/40 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                    <span className="text-[14px] font-bold tracking-tight">Quality</span>
                  </button>
                  <div className="pt-2">
                    {['2160', '1080', '720', '480', '360'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setStreamQuality(q); setActiveMenu('main'); }}
                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-[13px] font-bold transition-all ${streamQuality === q ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{q}p</span>
                          {parseInt(q) >= 720 && <span className="text-[9px] bg-white/10 px-1 rounded-sm text-white/40">HD</span>}
                        </div>
                        {streamQuality === q && <Check size={16} className="text-[#34C759]" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Player;
