import React, { useState } from 'react';
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
      await StorageService.addDownload(currentTrack);
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
            <ChevronDown size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>PLAYING FROM</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              YouTube Music
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setQueueVisible(true)}
          >
            <ListMusic size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Artwork or Lyrics View */}
          {!showLyrics ? (
            <View style={styles.artworkContainer}>
              <Image
                source={{ uri: currentTrack.thumbnail }}
                style={styles.artwork}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsTitle}>Lyrics</Text>
              <Text style={styles.lyricsBody}>
                {`♪ ${currentTrack.title} ♪\n\nBy ${currentTrack.artist}\n\n[Music Playing]\n\nStreamed via yt-dlp audio engine\nEnjoy seamless high fidelity playback.`}
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
                size={28}
                color={isLiked ? '#FF0000' : '#FFFFFF'}
                fill={isLiked ? '#FF0000' : 'transparent'}
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
                size={22}
                color={isShuffle ? '#FF0000' : '#888888'}
              />
            </TouchableOpacity>

            {/* Previous */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={skipToPrevious}
            >
              <SkipBack size={32} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            {/* Play/Pause Button */}
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayPause}
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause size={36} color="#000000" fill="#000000" />
              ) : (
                <Play size={36} color="#000000" fill="#000000" style={styles.playIconOffset} />
              )}
            </TouchableOpacity>

            {/* Next */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={skipToNext}
            >
              <SkipForward size={32} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            {/* Repeat */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleRepeat}
            >
              {repeatMode === 'one' ? (
                <Repeat1 size={22} color="#FF0000" />
              ) : (
                <Repeat
                  size={22}
                  color={repeatMode === 'all' ? '#FF0000' : '#888888'}
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
              <FileText size={20} color={showLyrics ? '#FF0000' : '#AAAAAA'} />
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
                size={20}
                color={downloadSuccess ? '#00FF66' : isDownloading ? '#FF8800' : '#AAAAAA'}
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
              <ListMusic size={20} color="#AAAAAA" />
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
    backgroundColor: '#0F0F0F',
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
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
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
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
  },
  lyricsContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lyricsTitle: {
    color: '#FF0000',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  lyricsBody: {
    color: '#E0E0E0',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  titleArtistContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  artist: {
    color: '#AAAAAA',
    fontSize: 15,
    marginTop: 4,
  },
  likeButton: {
    padding: 8,
  },
  seekContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarTouchArea: {
    height: 30,
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
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
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#888888',
    fontSize: 12,
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  bottomActionItem: {
    alignItems: 'center',
    padding: 8,
  },
  bottomActionText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  bottomActionTextActive: {
    color: '#FF0000',
  },
  bottomActionTextSuccess: {
    color: '#00FF66',
  },
  playIconOffset: {
    marginLeft: 4,
  },
});
