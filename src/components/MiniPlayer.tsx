import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    skipToNext,
    setFullPlayerVisible,
  } = usePlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <View style={styles.container}>
      {/* Progress Bar Top Border */}
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
          <Image
            source={{ uri: currentTrack.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />

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
            style={styles.actionButton}
            onPress={togglePlayPause}
            activeOpacity={0.7}
          >
            {isPlaying ? (
              <Pause size={22} color="#FFFFFF" />
            ) : (
              <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={skipToNext}
            activeOpacity={0.7}
          >
            <SkipForward size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#212121',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginHorizontal: 8,
    marginBottom: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
  },
  progressBarBackground: {
    height: 2.5,
    backgroundColor: '#383838',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF0000',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#111111',
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
    letterSpacing: 0.2,
  },
  artist: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  trackTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
