import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Play, Sparkles, Flame, Radio, Wifi, WifiOff } from 'lucide-react-native';
import { Track } from '../types';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { TrackCard } from '../components/TrackCard';

const { width } = Dimensions.get('window');
const QUICK_PICK_WIDTH = (width - 48) / 2.2;

const MOOD_FILTERS = [
  { id: 'top', label: 'Trending', icon: Flame },
  { id: 'chill', label: 'Relax', icon: Sparkles },
  { id: 'workout', label: 'Workout', icon: Flame },
  { id: 'focus', label: 'Focus', icon: Radio },
  { id: 'party', label: 'Party', icon: Sparkles },
  { id: 'pop', label: 'Pop Hits', icon: Sparkles },
  { id: 'rock', label: 'Rock', icon: Sparkles },
];

export const HomeScreen: React.FC = () => {
  const { playTrack, serverConfig, refreshServerStatus } = usePlayer();

  const [selectedMood, setSelectedMood] = useState('top');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracks = useCallback(async (mood: string = selectedMood) => {
    try {
      setLoading(true);
      const data = await api.getTrending(mood);
      setTracks(data);
    } catch (e) {
      console.error('Error loading home tracks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMood]);

  useEffect(() => {
    fetchTracks(selectedMood);
  }, [fetchTracks, selectedMood]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshServerStatus();
    fetchTracks(selectedMood);
  };

  const quickPicks = tracks.slice(0, 6);
  const trendingList = tracks.slice(0, 15);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF0000"
          colors={['#FF0000']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>Music</Text>
        </View>

        {/* Server status badge */}
        <TouchableOpacity
          style={[
            styles.serverBadge,
            serverConfig.isConnected
              ? styles.serverOnline
              : styles.serverOffline,
          ]}
          onPress={refreshServerStatus}
        >
          {serverConfig.isConnected ? (
            <Wifi size={12} color="#00FF66" />
          ) : (
            <WifiOff size={12} color="#FF6666" />
          )}
          <Text
            style={[
              styles.serverBadgeText,
              serverConfig.isConnected
                ? styles.serverOnlineText
                : styles.serverOfflineText,
            ]}
          >
            {serverConfig.isConnected ? 'yt-dlp Ready' : 'Connecting...'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mood Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {MOOD_FILTERS.map((item) => {
          const isSelected = selectedMood === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedMood(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loaderText}>Extracting tunes via yt-dlp...</Text>
        </View>
      ) : (
        <>
          {/* Quick Picks Carousel */}
          {quickPicks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionSubtitle}>START RADIO FROM A SONG</Text>
                <Text style={styles.sectionTitle}>Quick Picks</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPicksList}
              >
                {quickPicks.map((track) => (
                  <TouchableOpacity
                    key={track.id}
                    style={styles.quickPickCard}
                    onPress={() => playTrack(track, quickPicks)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.quickPickArtworkWrapper}>
                      <Image
                        source={{ uri: track.thumbnail }}
                        style={styles.quickPickArtwork}
                        resizeMode="cover"
                      />
                      <View style={styles.quickPickPlayOverlay}>
                        <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.quickPickTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.quickPickArtist} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Trending Hits Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionSubtitle}>HOT & POPULAR</Text>
              <Text style={styles.sectionTitle}>
                {selectedMood === 'top'
                  ? 'Trending Now'
                  : `${MOOD_FILTERS.find((m) => m.id === selectedMood)?.label} Mix`}
              </Text>
            </View>

            {trendingList.map((track, idx) => (
              <TrackCard
                key={`${track.id}-${idx}`}
                track={track}
                index={idx}
                showIndex={true}
                onPress={() => playTrack(track, trendingList)}
              />
            ))}
          </View>
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bottomSpacer: {
    height: 120,
  },
  container: {
    flex: 1,
    backgroundColor: '#030303',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  serverOnline: {
    backgroundColor: 'rgba(0, 255, 102, 0.12)',
  },
  serverOffline: {
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
  },
  serverBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },
  serverOnlineText: {
    color: '#00FF66',
  },
  serverOfflineText: {
    color: '#FF6666',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filterChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterChipText: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#000000',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  quickPicksList: {
    paddingHorizontal: 16,
  },
  quickPickCard: {
    width: QUICK_PICK_WIDTH,
    marginHorizontal: 4,
  },
  quickPickArtworkWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#181818',
  },
  quickPickArtwork: {
    width: QUICK_PICK_WIDTH,
    height: QUICK_PICK_WIDTH,
    borderRadius: 8,
  },
  quickPickPlayOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPickTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  quickPickArtist: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#888888',
    fontSize: 14,
    marginTop: 12,
  },
});
