import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, X, Volume2 } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';

export const QueueModal: React.FC = () => {
  const {
    queue,
    currentIndex,
    currentTrack,
    isQueueVisible,
    setQueueVisible,
    removeFromQueue,
    clearQueue,
    playTrack,
  } = usePlayer();

  const upcomingTracks = queue.slice(currentIndex + 1);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : Math.max(insets.top, 16);

  return (
    <Modal
      visible={isQueueVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent={true}
      onRequestClose={() => setQueueVisible(false)}
    >
      <View style={[styles.container, { paddingTop: topInset }]}>
        <StatusBar barStyle="light-content" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setQueueVisible(false)}
          >
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Up Next Queue</Text>

          {queue.length > 1 ? (
            <TouchableOpacity style={styles.clearButton} onPress={clearQueue}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Currently Playing Card */}
        {currentTrack && (
          <View style={styles.nowPlayingSection}>
            <Text style={styles.sectionHeader}>NOW PLAYING</Text>
            <View style={styles.nowPlayingCard}>
              <View style={styles.nowPlayingThumbWrapper}>
                <Image
                  source={{ uri: currentTrack.thumbnail }}
                  style={styles.nowPlayingThumbnail}
                />
              </View>
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
              </View>
              <View style={styles.activeIconCircle}>
                <Volume2 size={16} color="#FF1E44" />
              </View>
            </View>
          </View>
        )}

        {/* Up Next List */}
        <View style={styles.upNextSection}>
          <Text style={styles.sectionHeader}>
            UP NEXT ({upcomingTracks.length})
          </Text>

          {upcomingTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tracks queued up next.</Text>
              <Text style={styles.emptySubtext}>
                Play a song or tap the 3-dot options menu to "Add to Queue" or "Play Next".
              </Text>
            </View>
          ) : (
            <FlatList
              data={upcomingTracks}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const actualIndex = currentIndex + 1 + index;
                return (
                  <View style={styles.queueItem}>
                    <TouchableOpacity
                      style={styles.queueItemMain}
                      onPress={() => playTrack(item, queue)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.queueThumbWrapper}>
                        <Image
                          source={{ uri: item.thumbnail }}
                          style={styles.queueThumbnail}
                        />
                      </View>
                      <View style={styles.queueInfo}>
                        <Text style={styles.queueTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.queueArtist} numberOfLines={1}>
                          {item.artist}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFromQueue(actualIndex)}
                      activeOpacity={0.7}
                    >
                      <X size={18} color="#6A6A7D" />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
  },
  closeButton: {
    padding: 6,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    color: '#FF1E44',
    fontSize: 14,
    fontWeight: '600',
  },
  nowPlayingSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    color: '#6A6A7D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  nowPlayingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#242434',
    padding: 12,
    borderRadius: 14,
  },
  nowPlayingThumbWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A38',
    overflow: 'hidden',
  },
  nowPlayingThumbnail: {
    width: 48,
    height: 48,
    backgroundColor: '#161620',
  },
  nowPlayingInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nowPlayingTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  nowPlayingArtist: {
    color: '#8E8E9F',
    fontSize: 13,
    marginTop: 2,
  },
  activeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 30, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upNextSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#121218',
  },
  queueItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueThumbWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22222E',
    overflow: 'hidden',
  },
  queueThumbnail: {
    width: 44,
    height: 44,
    backgroundColor: '#161620',
  },
  queueInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  queueTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  queueArtist: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#8E8E9F',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#555566',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});
