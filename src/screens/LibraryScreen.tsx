import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Heart, Download, Clock, Play, Shuffle } from 'lucide-react-native';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { StorageService } from '../services/storage';
import { TrackCard } from '../components/TrackCard';

type LibraryTab = 'liked' | 'history' | 'downloads';

export const LibraryScreen: React.FC = () => {
  const { likedTracks, playTrack } = usePlayer();

  const [activeTab, setActiveTab] = useState<LibraryTab>('liked');
  const [historyTracks, setHistoryTracks] = useState<Track[]>([]);
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>([]);

  useEffect(() => {
    (async () => {
      const history = await StorageService.getHistory();
      setHistoryTracks(history);
      const downloads = await StorageService.getDownloads();
      setDownloadedTracks(downloads);
    })();
  }, [activeTab]);

  const getCurrentTracks = (): Track[] => {
    switch (activeTab) {
      case 'liked':
        return likedTracks;
      case 'history':
        return historyTracks;
      case 'downloads':
        return downloadedTracks;
      default:
        return [];
    }
  };

  const currentList = getCurrentTracks();

  const handlePlayAll = () => {
    if (currentList.length > 0) {
      playTrack(currentList[0], currentList);
    }
  };

  const handleShuffleAll = () => {
    if (currentList.length > 0) {
      const shuffled = [...currentList].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Library</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'liked' && styles.activeTabButton]}
          onPress={() => setActiveTab('liked')}
        >
          <Heart
            size={16}
            color={activeTab === 'liked' ? '#FF0000' : '#888888'}
            fill={activeTab === 'liked' ? '#FF0000' : 'transparent'}
          />
          <Text
            style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}
          >
            Liked ({likedTracks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'history' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Clock
            size={16}
            color={activeTab === 'history' ? '#FFFFFF' : '#888888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'downloads' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('downloads')}
        >
          <Download
            size={16}
            color={activeTab === 'downloads' ? '#FFFFFF' : '#888888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'downloads' && styles.activeTabText,
            ]}
          >
            Downloads
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Row: Play All / Shuffle All */}
      {currentList.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={handlePlayAll}
            activeOpacity={0.8}
          >
            <Play size={16} color="#000000" fill="#000000" />
            <Text style={styles.actionPillText}>Play All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPillSecondary}
            onPress={handleShuffleAll}
            activeOpacity={0.8}
          >
            <Shuffle size={16} color="#FFFFFF" />
            <Text style={styles.actionPillTextSecondary}>Shuffle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tracks List */}
      {currentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            {activeTab === 'liked'
              ? 'No liked tracks yet'
              : activeTab === 'downloads'
              ? 'No offline downloads'
              : 'No listening history'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'liked'
              ? 'Tap the heart icon on any song to save it here.'
              : activeTab === 'downloads'
              ? 'Download songs from the options menu for offline playback.'
              : 'Songs you play will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TrackCard
              track={item}
              index={index}
              onPress={() => playTrack(item, currentList)}
            />
          )}
        />
      )}

      <View style={styles.bottomSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSpacer: {
    height: 90,
  },
  container: {
    flex: 1,
    backgroundColor: '#030303',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  actionPillText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  actionPillSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionPillTextSecondary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
