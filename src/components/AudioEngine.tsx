import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, AppState, AppStateStatus } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { usePlayer } from '../context/PlayerContext';

export const AudioEngine: React.FC = () => {
  const {
    activeStreamUrl,
    isPlaying,
    repeatMode,
    onAudioProgress,
    onAudioLoad,
    onAudioEnd,
    onAudioError,
    seekTargetTime,
    onSeekHandled,
  } = usePlayer();

  const videoRef = useRef<VideoRef>(null);
  const [appState, setAppState] = useState<AppStateStatus>(
    (AppState.currentState as AppStateStatus) || 'active',
  );

  // Battery Optimization: Throttle progress events when app is backgrounded
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (seekTargetTime !== null && videoRef.current) {
      videoRef.current.seek(seekTargetTime);
      onSeekHandled();
    }
  }, [seekTargetTime, onSeekHandled]);

  if (!activeStreamUrl) {
    return null;
  }

  // Active in foreground: 500ms for smooth seekbar.
  // Backgrounded: 2500ms to conserve CPU cycles & battery wakeups.
  const updateInterval = appState === 'active' ? 500 : 2500;

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <Video
        ref={videoRef}
        source={{ uri: activeStreamUrl }}
        paused={!isPlaying}
        repeat={repeatMode === 'one'}
        playInBackground={true}
        playWhenInactive={true}
        ignoreSilentSwitch="ignore"
        progressUpdateInterval={updateInterval}
        bufferConfig={{
          minBufferMs: 5000,
          maxBufferMs: 30000,
          bufferForPlaybackMs: 1500,
          bufferForPlaybackAfterRebufferMs: 3000,
        }}
        rate={1.0}
        volume={1.0}
        muted={false}
        onProgress={onAudioProgress}
        onLoad={onAudioLoad}
        onEnd={onAudioEnd}
        onError={onAudioError}
        style={styles.hiddenVideo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -200,
    left: -200,
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  hiddenVideo: {
    width: 1,
    height: 1,
  },
});
