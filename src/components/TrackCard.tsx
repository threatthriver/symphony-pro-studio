import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import {
  MoreVertical,
  ListPlus,
  ListStart,
  Heart,
  Download,
} from 'lucide-react-native';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { StorageService } from '../services/storage';

interface TrackCardProps {
  track: Track;
  onPress: () => void;
  index?: number;
  showIndex?: boolean;
}

const EqualizerBars: React.FC<{ isPlaying: boolean }> = React.memo(({ isPlaying }) => {
  const bar1 = useRef(new Animated.Value(0.4)).current;
  const bar2 = useRef(new Animated.Value(0.9)).current;
  const bar3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!isPlaying) {
      bar1.setValue(0.3);
      bar2.setValue(0.5);
      bar3.setValue(0.4);
      return;
    }

    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar1, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(bar1, { toValue: 0.25, duration: 380, useNativeDriver: true }),
      ])
    );
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar2, { toValue: 0.25, duration: 280, useNativeDriver: true }),
        Animated.timing(bar2, { toValue: 1, duration: 320, useNativeDriver: true }),
      ])
    );
    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar3, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(bar3, { toValue: 0.3, duration: 340, useNativeDriver: true }),
      ])
    );

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [isPlaying, bar1, bar2, bar3]);

  return (
    <View style={styles.equalizerWrap}>
      <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: bar1 }] }]} />
      <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: bar2 }] }]} />
      <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: bar3 }] }]} />
    </View>
  );
});

const TrackCardComponent: React.FC<TrackCardProps> = ({
  track,
  onPress,
  index,
  showIndex = false,
}) => {
  const {
    currentTrack,
    isPlaying,
    likedTracks,
    toggleLike,
    addToQueue,
    playNext,
  } = usePlayer();

  const [menuVisible, setMenuVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isLiked = likedTracks.some((t) => t.id === track.id);

  const handleDownload = async () => {
    setDownloading(true);
    const res = await api.downloadTrack(track.id);
    if (res.success) {
      await StorageService.addDownload({
        ...track,
        streamUrl: res.url,
        isDownloaded: true,
      });
    }
    setDownloading(false);
    setMenuVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isCurrent && styles.activeContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Optional Ranking Index */}
        {showIndex && index !== undefined && (
          <Text style={[styles.indexText, isCurrent && styles.activeIndexText]}>
            {index + 1}
          </Text>
        )}

        {/* Thumbnail with overlay icon if playing */}
        <View style={[styles.thumbnailWrapper, isCurrent && styles.activeThumbnailWrapper]}>
          <Image
            source={{ uri: track.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {isCurrent && (
            <View style={styles.playingBadge}>
              <EqualizerBars isPlaying={isPlaying} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text
            style={[styles.title, isCurrent && styles.activeTitle]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {track.artist}
            {track.durationFormatted ? ` • ${track.durationFormatted}` : ''}
          </Text>
        </View>

        {/* 3-Dot Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreVertical size={18} color={isCurrent ? '#FF1E44' : '#6A6A7D'} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Options Context Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Grab Handle */}
              <View style={styles.grabHandle} />

              {/* Header Info */}
              <View style={styles.modalHeader}>
                <View style={styles.modalThumbWrapper}>
                  <Image
                    source={{ uri: track.thumbnail }}
                    style={styles.modalThumbnail}
                  />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.modalArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Action Rows */}
              <TouchableOpacity
                style={styles.menuAction}
                onPress={() => {
                  playNext(track);
                  setMenuVisible(false);
                }}
              >
                <View style={styles.actionIconWrapper}>
                  <ListStart size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.menuActionText}>Play Next</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuAction}
                onPress={() => {
                  addToQueue(track);
                  setMenuVisible(false);
                }}
              >
                <View style={styles.actionIconWrapper}>
                  <ListPlus size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.menuActionText}>Add to Queue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuAction}
                onPress={() => {
                  toggleLike(track);
                  setMenuVisible(false);
                }}
              >
                <View style={styles.actionIconWrapper}>
                  <Heart
                    size={18}
                    color={isLiked ? '#FF1E44' : '#FFFFFF'}
                    fill={isLiked ? '#FF1E44' : 'transparent'}
                  />
                </View>
                <Text style={styles.menuActionText}>
                  {isLiked ? 'Remove from Liked' : 'Save to Liked Songs'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuAction}
                onPress={handleDownload}
                disabled={downloading}
              >
                <View style={styles.actionIconWrapper}>
                  <Download size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.menuActionText}>
                  {downloading ? 'Downloading to storage...' : 'Download Offline'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 1,
  },
  activeContainer: {
    backgroundColor: 'rgba(255, 30, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 68, 0.25)',
  },
  indexText: {
    color: '#6A6A7D',
    fontSize: 14,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  activeIndexText: {
    color: '#FF1E44',
    fontWeight: '700',
  },
  thumbnailWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#22222E',
  },
  activeThumbnailWrapper: {
    borderColor: '#FF1E44',
  },
  thumbnail: {
    width: 50,
    height: 50,
    backgroundColor: '#161620',
  },
  playingBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FF1E44',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equalizerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 10,
    width: 12,
    justifyContent: 'space-between',
  },
  equalizerBar: {
    width: 2.5,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  activeTitle: {
    color: '#FF1E44',
    fontWeight: '700',
  },
  meta: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 3,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#14141B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#262634',
    padding: 20,
    paddingBottom: 36,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333344',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalThumbWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A38',
    overflow: 'hidden',
  },
  modalThumbnail: {
    width: 48,
    height: 48,
    backgroundColor: '#1A1A24',
  },
  modalHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalArtist: {
    color: '#8E8E9F',
    fontSize: 13,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#20202C',
    marginVertical: 12,
  },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuActionText: {
    color: '#E0E0EC',
    fontSize: 14,
    marginLeft: 14,
    fontWeight: '500',
  },
});

export const TrackCard = React.memo(TrackCardComponent);
