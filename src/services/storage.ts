import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Playlist, ServerConfig } from '../types';

const KEYS = {
  LIKED: '@yt_music_liked',
  PLAYLISTS: '@yt_music_playlists',
  HISTORY: '@yt_music_history',
  SERVER_CONFIG: '@yt_music_server_config',
  DOWNLOADS: '@yt_music_downloads',
};

export const StorageService = {
  async getLikedTracks(): Promise<Track[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LIKED);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading liked tracks:', e);
      return [];
    }
  },

  async saveLikedTracks(tracks: Track[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LIKED, JSON.stringify(tracks));
    } catch (e) {
      console.error('Error saving liked tracks:', e);
    }
  },

  async toggleLikeTrack(track: Track): Promise<Track[]> {
    const current = await this.getLikedTracks();
    const exists = current.some((t) => t.id === track.id);
    const updated = exists
      ? current.filter((t) => t.id !== track.id)
      : [track, ...current];
    await this.saveLikedTracks(updated);
    return updated;
  },

  async getPlaylists(): Promise<Playlist[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PLAYLISTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading playlists:', e);
      return [];
    }
  },

  async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.error('Error saving playlists:', e);
    }
  },

  async getHistory(): Promise<Track[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading history:', e);
      return [];
    }
  },

  async addToHistory(track: Track): Promise<Track[]> {
    try {
      const current = await this.getHistory();
      const filtered = current.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 50); // keep last 50
      await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error adding to history:', e);
      return [];
    }
  },

  async getServerConfig(): Promise<ServerConfig | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SERVER_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error loading server config:', e);
      return null;
    }
  },

  async saveServerConfig(config: ServerConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SERVER_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving server config:', e);
    }
  },

  async getDownloads(): Promise<Track[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DOWNLOADS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveDownloads(tracks: Track[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.DOWNLOADS, JSON.stringify(tracks));
    } catch (e) {
      console.error('Error saving downloads:', e);
    }
  },

  async addDownload(track: Track): Promise<Track[]> {
    try {
      const current = await this.getDownloads();
      const filtered = current.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered];
      await this.saveDownloads(updated);
      return updated;
    } catch (e) {
      console.error('Error adding to downloads:', e);
      return [];
    }
  },
};
