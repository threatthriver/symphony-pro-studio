import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, 
  Maximize, Settings, SkipBack, SkipForward, 
  MonitorPlay, Square, ChevronRight, Check, Activity
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
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('0:00');
  const [durationFormatted, setDurationFormatted] = useState('0:00');
  const [useYouTubeEmbed, setUseYouTubeEmbed] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [streamQuality, setStreamQuality] = useState('1080');

  const videoRef = useRef(null);
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

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [resetControlsTimeout]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      resetControlsTimeout();
      switch(e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 't': e.preventDefault(); toggleTheater(); break;
        case 'm': e.preventDefault(); setIsMuted(prev => !prev); break;
        case 'arrowright': e.preventDefault(); if (videoRef.current) videoRef.current.currentTime += 10; break;
        case 'arrowleft': e.preventDefault(); if (videoRef.current) videoRef.current.currentTime -= 10; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheater, resetControlsTimeout]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (!videoRef.current.paused) videoRef.current.pause();
      else videoRef.current.play();
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
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        if (duration > 0) setDownloadPercent((bufferedEnd / duration) * 100);
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
      onMouseMove={resetControlsTimeout}
      onDoubleClick={toggleFullscreen}
    >
      {/* Immersive Ambilight Glow */}
      <AnimatePresence>
        {isTheaterMode && isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-[-10%] z-0 pointer-events-none"
          >
            <video
              src={streamData?.videoUrl}
              autoPlay
              muted
              playsInline
              loop
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
        muted={isMuted || streamData?.type === 'dash'}
        className="relative z-10 w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => { setIsPlaying(true); if (audioRef.current) audioRef.current.play(); }}
        onPause={() => { setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }}
        onError={() => setUseYouTubeEmbed(true)}
        onClick={togglePlay}
      />
      
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
              className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start pointer-events-none"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.2em] drop-shadow-lg">Symphony Studio</span>
                <h2 className="text-lg font-black text-white line-clamp-1 drop-shadow-2xl">{title}</h2>
              </div>
              <div className="px-3 py-1 bg-white/10 backdrop-blur-3xl rounded-lg border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">{streamQuality}P HDR</span>
              </div>
            </motion.div>

            {/* Bottom Control Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-3xl p-4 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)]"
            >
              {/* Scrub Bar */}
              <div className="relative w-full h-1.5 group/progress mb-4 cursor-pointer"
                   onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const pos = (e.clientX - rect.left) / rect.width;
                     if (videoRef.current) videoRef.current.currentTime = pos * videoRef.current.duration;
                   }}>
                <div className="absolute inset-y-[-10px] inset-x-0" />
                <div className="w-full h-full bg-white/10 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-white/5 transition-all duration-500"
                    style={{ width: `${downloadPercent}%` }}
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#007AFF] to-[#00C2FF] shadow-[0_0_15px_rgba(0,122,255,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Scrub Handle */}
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, marginLeft: '-8px' }}
                />
              </div>

              {/* Action Rows */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button onClick={togglePlay} className="text-white hover:scale-125 transition-all active:scale-90">
                    {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-1" />}
                  </button>
                  
                  <div className="flex items-center gap-3 group/volume">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white transition-colors">
                      <VolumeIcon />
                    </button>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={volume}
                      onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                      className="w-20 h-1 accent-[#007AFF] bg-white/10 rounded-full cursor-pointer"
                    />
                  </div>

                  <div className="text-[11px] font-black text-white/40 tracking-[0.1em] font-mono flex items-center gap-2">
                     <span className="text-white/90">{currentTimeFormatted}</span>
                     <span className="opacity-20">/</span>
                     <span>{durationFormatted}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <motion.button 
                    whileHover={{ rotate: 90 }}
                    className={`transition-colors ${showSettings ? 'text-[#007AFF]' : 'text-white/40 hover:text-white'}`}
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings size={18} />
                  </motion.button>
                  <button 
                    className={`transition-colors ${isTheaterMode ? 'text-[#007AFF]' : 'text-white/40 hover:text-white'}`}
                    onClick={toggleTheater}
                  >
                    <MonitorPlay size={18} />
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-32 right-1/2 translate-x-1/2 md:right-[10%] md:translate-x-0 w-64 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-50 p-2"
          >
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Studio Quality</span>
              <Activity size={12} className="text-[#007AFF]" />
            </div>
            <div className="p-1 space-y-1">
              {['2160', '1080', '720'].map(q => (
                <button
                  key={q}
                  onClick={() => { setStreamQuality(q); setShowSettings(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-[12px] font-black transition-all ${streamQuality === q ? 'bg-[#007AFF] text-white' : 'text-white/60 hover:bg-white/5'}`}
                >
                  <span className="tracking-tight">{q === '2160' ? '4K Ultra High Definition' : `${q}p High Definition`}</span>
                  {streamQuality === q && <Check size={14} strokeWidth={4} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Player;
