import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Search, X, TrendingUp } from 'lucide-react-native';
import { Track } from '../types';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { TrackCard } from '../components/TrackCard';

const POPULAR_SEARCHES = [
  'Daft Punk',
  'Billie Eilish',
  'The Weeknd',
  'Taylor Swift',
  'Linkin Park',
  'Coldplay',
  'Lofi Hip Hop',
];

export const SearchScreen: React.FC = () => {
  const { playTrack } = usePlayer();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchTerm: string = query) => {
    if (!searchTerm.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.searchTracks(searchTerm.trim(), 20);
      setResults(data);
    } catch (e) {
      console.error('Search error:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.inputWrapper}>
          <Search size={20} color="#888888" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search songs, artists, albums..."
            placeholderTextColor="#888888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <X size={18} color="#888888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loaderText}>Searching YouTube via yt-dlp...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TrackCard
              track={item}
              onPress={() => playTrack(item, results)}
            />
          )}
        />
      ) : hasSearched ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching with different song keywords or artist names.
          </Text>
        </View>
      ) : (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <TrendingUp size={16} color="#FF0000" />
            <Text style={styles.suggestionsTitle}>Popular Searches</Text>
          </View>

          <View style={styles.chipsWrap}>
            {POPULAR_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.suggestionChip}
                onPress={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
              >
                <Search size={14} color="#AAAAAA" />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#212121',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 6,
  },
  listContent: {
    paddingBottom: 120,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#888888',
    fontSize: 14,
    marginTop: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  },
  suggestionsContainer: {
    padding: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  suggestionText: {
    color: '#E0E0E0',
    fontSize: 14,
    marginLeft: 8,
  },
});

