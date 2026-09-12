import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  MoreVertical,
  ListPlus,
  ListStart,
  Heart,
  Download,
  Volume2,
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

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  onPress,
  index,
  showIndex = false,
}) => {
  const {
    currentTrack,
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
      await StorageService.addDownload(track);
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
        <View style={styles.thumbnailWrapper}>
          <Image
            source={{ uri: track.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {isCurrent && (
            <View style={styles.playingBadge}>
              <Volume2 size={14} color="#FF0000" />
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
          <MoreVertical size={18} color="#888888" />
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
              {/* Header Info */}
              <View style={styles.modalHeader}>
                <Image
                  source={{ uri: track.thumbnail }}
                  style={styles.modalThumbnail}
                />
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
                <ListStart size={20} color="#FFFFFF" />
                <Text style={styles.menuActionText}>Play Next</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuAction}
                onPress={() => {
                  addToQueue(track);
                  setMenuVisible(false);
                }}
              >
                <ListPlus size={20} color="#FFFFFF" />
                <Text style={styles.menuActionText}>Add to Queue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuAction}
                onPress={() => {
                  toggleLike(track);
                  setMenuVisible(false);
                }}
              >
                <Heart
                  size={20}
                  color={isLiked ? '#FF0000' : '#FFFFFF'}
                  fill={isLiked ? '#FF0000' : 'transparent'}
                />
                <Text style={styles.menuActionText}>
                  {isLiked ? 'Remove from Liked' : 'Save to Liked Songs'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuAction}
                onPress={handleDownload}
                disabled={downloading}
              >
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.menuActionText}>
                  {downloading ? 'Downloading...' : 'Download Offline'}
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
  },
  indexText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  activeIndexText: {
    color: '#FF0000',
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#1E1E1E',
  },
  playingBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 10,
    padding: 2,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  activeTitle: {
    color: '#FF0000',
    fontWeight: '700',
  },
  meta: {
    color: '#888888',
    fontSize: 13,
    marginTop: 3,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#212121',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  modalHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalArtist: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
  },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 16,
    fontWeight: '500',
  },
});
