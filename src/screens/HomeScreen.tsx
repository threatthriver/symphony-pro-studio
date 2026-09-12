import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Play, Sparkles, Flame, Radio, WifiOff } from 'lucide-react-native';
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

  const quickPicks = useMemo(() => tracks.slice(0, 6), [tracks]);
  const trendingList = useMemo(() => tracks.slice(0, 15), [tracks]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF1E44"
          colors={['#FF1E44']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Play size={15} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>Symphony</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
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
          activeOpacity={0.8}
        >
          {serverConfig.isConnected ? (
            <View style={styles.onlineDot} />
          ) : (
            <WifiOff size={11} color="#FF5252" />
          )}
          <Text
            style={[
              styles.serverBadgeText,
              serverConfig.isConnected
                ? styles.serverOnlineText
                : styles.serverOfflineText,
            ]}
          >
            {serverConfig.isConnected ? '24/7 Cloud' : 'Offline'}
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
    backgroundColor: '#08080A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF1E44',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#FF1E44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  proBadge: {
    backgroundColor: '#1E1E28',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#303042',
  },
  proBadgeText: {
    color: '#FF1E44',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  serverOnline: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  serverOffline: {
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderColor: 'rgba(255, 68, 68, 0.25)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00E676',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  serverBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  serverOnlineText: {
    color: '#00E676',
  },
  serverOfflineText: {
    color: '#FF5252',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    backgroundColor: '#14141C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#242432',
  },
  filterChipSelected: {
    backgroundColor: '#FF1E44',
    borderColor: '#FF1E44',
    shadowColor: '#FF1E44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  filterChipText: {
    color: '#A0A0B2',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  section: {
    marginTop: 26,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionSubtitle: {
    color: '#FF1E44',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  quickPicksList: {
    paddingHorizontal: 16,
  },
  quickPickCard: {
    width: QUICK_PICK_WIDTH,
    marginHorizontal: 5,
  },
  quickPickArtworkWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#161620',
    borderWidth: 1,
    borderColor: '#242432',
  },
  quickPickArtwork: {
    width: QUICK_PICK_WIDTH,
    height: QUICK_PICK_WIDTH,
    borderRadius: 13,
  },
  quickPickPlayOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(10, 10, 14, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  quickPickTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  quickPickArtist: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 2,
  },
  loaderContainer: {
    paddingVertical: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: '#8E8E9F',
    fontSize: 13,
    marginTop: 14,
    letterSpacing: 0.2,
  },
});
