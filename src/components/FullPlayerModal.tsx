import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Download,
  FileText,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { StorageService } from '../services/storage';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - 64;

export const FullPlayerModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    isShuffle,
    repeatMode,
    isFullPlayerVisible,
    likedTracks,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    setFullPlayerVisible,
    setQueueVisible,
  } = usePlayer();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : Math.max(insets.top, 16);

  const artworkScale = useRef(new Animated.Value(isPlaying ? 1 : 0.92)).current;

  useEffect(() => {
    Animated.spring(artworkScale, {
      toValue: isPlaying ? 1 : 0.92,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, artworkScale]);

  if (!currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const handleProgressBarPress = (e: any) => {
    if (!duration || duration <= 0) return;
    const { locationX } = e.nativeEvent;
    const barWidth = width - 48;
    const newProgress = Math.max(0, Math.min(locationX / barWidth, 1));
    seekTo(newProgress * duration);
  };

  const handleDownload = async () => {
    if (isDownloading || downloadSuccess) return;
    setIsDownloading(true);
    const res = await api.downloadTrack(currentTrack.id);
    setIsDownloading(false);
    if (res.success) {
      await StorageService.addDownload({
        ...currentTrack,
        streamUrl: res.url,
        isDownloaded: true,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  return (
    <Modal
      visible={isFullPlayerVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent={true}
      onRequestClose={() => setFullPlayerVisible(false)}
    >
      <View style={[styles.container, { paddingTop: topInset }]}>
        <StatusBar barStyle="light-content" />
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFullPlayerVisible(false)}
          >
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>PLAYING FROM</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Symphony Cloud Stream
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setQueueVisible(true)}
          >
            <ListMusic size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Artwork or Lyrics View */}
          {!showLyrics ? (
            <Animated.View
              style={[
                styles.artworkContainer,
                { transform: [{ scale: artworkScale }] },
              ]}
            >
              <Image
                source={{ uri: currentTrack.thumbnail }}
                style={styles.artwork}
                resizeMode="cover"
              />
            </Animated.View>
          ) : (
            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsTitle}>Lyrics</Text>
              <Text style={styles.lyricsBody}>
                {`♪ ${currentTrack.title} ♪\n\nBy ${currentTrack.artist}\n\n[Music Playing]\n\nStreamed via Symphony Cloud Audio Engine\nEnjoy seamless high fidelity playback.`}
              </Text>
            </View>
          )}

          {/* Track Metadata Row */}
          <View style={styles.metaRow}>
            <View style={styles.titleArtistContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {currentTrack.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => toggleLike(currentTrack)}
            >
              <Heart
                size={26}
                color={isLiked ? '#FF1E44' : '#8E8E9F'}
                fill={isLiked ? '#FF1E44' : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {/* Seekbar */}
          <View style={styles.seekContainer}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.progressBarTouchArea}
              onPress={handleProgressBarPress}
            >
              <View style={styles.progressBarTrack}>
                <View
                  style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                />
                <View
                  style={[styles.progressKnob, { left: `${progress * 100}%` }]}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>
                {formatTime(duration || currentTrack.duration)}
              </Text>
            </View>
          </View>

          {/* Main Controls Row */}
          <View style={styles.controlsRow}>
            {/* Shuffle */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleShuffle}
            >
              <Shuffle
                size={20}
                color={isShuffle ? '#FF1E44' : '#6A6A7D'}
              />
            </TouchableOpacity>

            {/* Previous */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={skipToPrevious}
            >
              <SkipBack size={30} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            {/* Play/Pause Button with Spinner */}
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayPause}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : isPlaying ? (
                <Pause size={34} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={34} color="#FFFFFF" fill="#FFFFFF" style={styles.playIconOffset} />
              )}
            </TouchableOpacity>

            {/* Next */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={skipToNext}
            >
              <SkipForward size={30} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            {/* Repeat */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleRepeat}
            >
              {repeatMode === 'one' ? (
                <Repeat1 size={22} color="#FF1E44" />
              ) : (
                <Repeat
                  size={20}
                  color={repeatMode === 'all' ? '#FF1E44' : '#6A6A7D'}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Actions Row */}
          <View style={styles.bottomActionsRow}>
            <TouchableOpacity
              style={styles.bottomActionItem}
              onPress={() => setShowLyrics(!showLyrics)}
            >
              <FileText size={18} color={showLyrics ? '#FF1E44' : '#8E8E9F'} />
              <Text
                style={[
                  styles.bottomActionText,
                  showLyrics && styles.bottomActionTextActive,
                ]}
              >
                Lyrics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomActionItem}
              onPress={handleDownload}
              disabled={isDownloading}
            >
              <Download
                size={18}
                color={downloadSuccess ? '#00E599' : isDownloading ? '#FFA028' : '#8E8E9F'}
              />
              <Text
                style={[
                  styles.bottomActionText,
                  downloadSuccess && styles.bottomActionTextSuccess,
                ]}
              >
                {downloadSuccess
                  ? 'Saved'
                  : isDownloading
                  ? 'Saving...'
                  : 'Download'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomActionItem}
              onPress={() => setQueueVisible(true)}
            >
              <ListMusic size={18} color="#8E8E9F" />
              <Text style={styles.bottomActionText}>Up Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#6A6A7D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  artworkContainer: {
    marginTop: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#222230',
    overflow: 'hidden',
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    backgroundColor: '#14141E',
  },
  lyricsContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#222230',
    backgroundColor: '#12121A',
    padding: 24,
    marginTop: 16,
    marginBottom: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lyricsTitle: {
    color: '#FF1E44',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  lyricsBody: {
    color: '#D4D4E0',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 22,
  },
  titleArtistContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  artist: {
    color: '#8E8E9F',
    fontSize: 15,
    marginTop: 4,
  },
  likeButton: {
    padding: 8,
  },
  seekContainer: {
    width: '100%',
    marginBottom: 26,
  },
  progressBarTouchArea: {
    height: 30,
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#20202C',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF1E44',
    borderRadius: 2,
  },
  progressKnob: {
    position: 'absolute',
    top: -5,
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FF1E44',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#6A6A7D',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  controlButton: {
    padding: 12,
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF1E44',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1E44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1A24',
  },
  bottomActionItem: {
    alignItems: 'center',
    padding: 8,
  },
  bottomActionText: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  bottomActionTextActive: {
    color: '#FF1E44',
  },
  bottomActionTextSuccess: {
    color: '#00E599',
  },
  playIconOffset: {
    marginLeft: 3,
  },
});
