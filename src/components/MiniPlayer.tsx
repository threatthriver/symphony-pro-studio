import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlayPause,
    skipToNext,
    setFullPlayerVisible,
  } = usePlayer();

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentTrack) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentTrack, slideAnim, fadeAnim]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Progress Bar Top Accent */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Track Details - press to open FullPlayer */}
        <TouchableOpacity
          style={styles.trackTouchable}
          onPress={() => setFullPlayerVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.thumbnailWrapper}>
            <Image
              source={{ uri: currentTrack.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </View>

          <View style={styles.trackInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayPause}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FF1E44" />
            ) : isPlaying ? (
              <Pause size={18} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={styles.playIconOffset} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={skipToNext}
            activeOpacity={0.7}
          >
            <SkipForward size={20} color="#C4C4D4" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121218',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262634',
    marginHorizontal: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  progressBarBackground: {
    height: 2.5,
    backgroundColor: '#20202C',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF1E44',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  trackTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A38',
    overflow: 'hidden',
  },
  thumbnail: {
    width: 44,
    height: 44,
    backgroundColor: '#171720',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  artist: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E28',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2F2F40',
    marginLeft: 4,
  },
  playIconOffset: {
    marginLeft: 2,
  },
  skipButton: {
    padding: 8,
    marginLeft: 4,
  },
});
