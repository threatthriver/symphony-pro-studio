import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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

  useEffect(() => {
    if (seekTargetTime !== null && videoRef.current) {
      videoRef.current.seek(seekTargetTime);
      onSeekHandled();
    }
  }, [seekTargetTime, onSeekHandled]);

  if (!activeStreamUrl) {
    return null;
  }

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
