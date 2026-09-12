import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, RepeatMode, ServerConfig } from '../types';
import { api } from '../services/api';
import { StorageService } from '../services/storage';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  queue: Track[];
  currentIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isFullPlayerVisible: boolean;
  isQueueVisible: boolean;
  likedTracks: Track[];
  serverConfig: ServerConfig;
  activeStreamUrl: string | null;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlayPause: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  seekTo: (seconds: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (track?: Track) => Promise<void>;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setFullPlayerVisible: (visible: boolean) => void;
  setQueueVisible: (visible: boolean) => void;
  updateServerHost: (host: string) => Promise<void>;
  refreshServerStatus: () => Promise<void>;

  // Video Audio engine callbacks
  onAudioProgress: (data: { currentTime: number; seekableDuration: number }) => void;
  onAudioLoad: (data: { duration: number }) => void;
  onAudioEnd: () => void;
  onAudioError: (error: any) => void;
  seekTargetTime: number | null;
  onSeekHandled: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isFullPlayerVisible, setFullPlayerVisible] = useState<boolean>(false);
  const [isQueueVisible, setQueueVisible] = useState<boolean>(false);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);
  const [seekTargetTime, setSeekTargetTime] = useState<number | null>(null);

  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    baseUrl: api.getBaseUrl(),
    isConnected: false,
    ytDlpVersion: 'Checking...',
  });

  // Load saved state on mount
  useEffect(() => {
    (async () => {
      const savedConfig = await StorageService.getServerConfig();
      if (savedConfig && !savedConfig.baseUrl.includes('10.0.2.2')) {
        api.setBaseUrl(savedConfig.baseUrl);
        setServerConfig(savedConfig);
      } else {
        api.setBaseUrl('http://localhost:5050');
        setServerConfig({
          baseUrl: 'http://localhost:5050',
          isConnected: false,
          ytDlpVersion: 'Checking...',
        });
      }
      const savedLikes = await StorageService.getLikedTracks();
      setLikedTracks(savedLikes);
      await refreshServerStatus();
    })();
  }, []);

  const refreshServerStatus = async () => {
    const health = await api.checkHealth();
    setServerConfig((prev) => ({
      ...prev,
      isConnected: health.isConnected,
      ytDlpVersion: health.ytDlpVersion,
      lastChecked: Date.now(),
    }));
  };

  const updateServerHost = async (host: string) => {
    api.setBaseUrl(host);
    const health = await api.checkHealth();
    const newConfig: ServerConfig = {
      baseUrl: host,
      isConnected: health.isConnected,
      ytDlpVersion: health.ytDlpVersion,
      lastChecked: Date.now(),
    };
    setServerConfig(newConfig);
    await StorageService.saveServerConfig(newConfig);
  };

  const hasAttemptedFallbackRef = useRef<boolean>(false);

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    try {
      hasAttemptedFallbackRef.current = false;
      setIsLoading(true);
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 0);

      // Handle queue
      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((t) => t.id === track.id);
        setCurrentIndex(idx !== -1 ? idx : 0);
      } else {
        // Add to existing queue if not present
        setQueue((prev) => {
          const idx = prev.findIndex((t) => t.id === track.id);
          if (idx !== -1) {
            setCurrentIndex(idx);
            return prev;
          }
          const next = [...prev, track];
          setCurrentIndex(next.length - 1);
          return next;
        });
      }

      // Record to history
      await StorageService.addToHistory(track);

      // Priority 1: Direct streamUrl if already attached
      let streamUrl = track.streamUrl;

      // Priority 2: Check offline downloads cache
      if (!streamUrl) {
        const downloads = await StorageService.getDownloads();
        const downloaded = downloads.find((d) => d.id === track.id);
        if (downloaded?.streamUrl) {
          streamUrl = downloaded.streamUrl;
        }
      }

      // Priority 3: Resolve cloud stream URL
      if (!streamUrl) {
        streamUrl = await api.getStreamUrl(track.id);
      }

      setActiveStreamUrl(streamUrl);
      setIsPlaying(true);
    } catch (e) {
      console.error('Failed to play track:', e);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack) return;
    setIsPlaying((prev) => !prev);
  };

  const skipToNext = () => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * queue.length);
      setCurrentIndex(randomIdx);
      playTrack(queue[randomIdx], queue);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      playTrack(queue[nextIndex], queue);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
      playTrack(queue[0], queue);
    } else {
      setIsPlaying(false);
    }
  };

  const skipToPrevious = () => {
    if (currentTime > 3) {
      // Seek to start if already more than 3 seconds in
      seekTo(0);
      return;
    }
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0 && prevIndex < queue.length) {
      setCurrentIndex(prevIndex);
      playTrack(queue[prevIndex], queue);
    } else {
      seekTo(0);
    }
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    setSeekTargetTime(seconds);
  };

  const onSeekHandled = () => {
    setSeekTargetTime(null);
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleLike = async (trackToLike?: Track) => {
    const target = trackToLike || currentTrack;
    if (!target) return;
    const updated = await StorageService.toggleLikeTrack(target);
    setLikedTracks(updated);
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const playNext = (track: Track) => {
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(currentIndex + 1, 0, track);
      return copy;
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex((c) => Math.max(0, c - 1));
    } else if (index === currentIndex) {
      if (queue.length <= 1) {
        setCurrentIndex(-1);
      } else if (currentIndex >= queue.length - 1) {
        setCurrentIndex(queue.length - 2);
      }
    }
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setCurrentIndex(0);
    } else {
      setQueue([]);
      setCurrentIndex(-1);
    }
  };

  // Video event callbacks
  const onAudioProgress = (data: { currentTime: number; seekableDuration: number }) => {
    setCurrentTime(data.currentTime);
    if (data.seekableDuration > 0 && duration === 0) {
      setDuration(data.seekableDuration);
    }
  };

  const onAudioLoad = (data: { duration: number }) => {
    setIsLoading(false);
    if (data.duration > 0) {
      setDuration(data.duration);
    }
  };

  const onAudioEnd = () => {
    if (repeatMode === 'one') {
      seekTo(0);
      setIsPlaying(true);
    } else {
      skipToNext();
    }
  };

  const onAudioError = (error: any) => {
    console.warn('[PlayerContext] Audio playback error on stream:', activeStreamUrl, error);
    if (
      currentTrack &&
      !hasAttemptedFallbackRef.current &&
      activeStreamUrl &&
      !activeStreamUrl.includes('pipe=true')
    ) {
      console.log('[PlayerContext] Attempting resilient fallback to backend piped audio stream...');
      hasAttemptedFallbackRef.current = true;
      setIsLoading(true);
      const pipeUrl = `${api.getBaseUrl()}/api/stream/${currentTrack.id}?pipe=true`;
      setActiveStreamUrl(pipeUrl);
      setIsPlaying(true);
      return;
    }
    setIsLoading(false);
    setIsPlaying(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        queue,
        currentIndex,
        isShuffle,
        repeatMode,
        isFullPlayerVisible,
        isQueueVisible,
        likedTracks,
        serverConfig,
        activeStreamUrl,
        playTrack,
        togglePlayPause,
        skipToNext,
        skipToPrevious,
        seekTo,
        toggleShuffle,
        toggleRepeat,
        toggleLike,
        addToQueue,
        playNext,
        removeFromQueue,
        clearQueue,
        setFullPlayerVisible,
        setQueueVisible,
        updateServerHost,
        refreshServerStatus,
        onAudioProgress,
        onAudioLoad,
        onAudioEnd,
        onAudioError,
        seekTargetTime,
        onSeekHandled,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
