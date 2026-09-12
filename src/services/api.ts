import { Platform } from 'react-native';
import { Track } from '../types';

const RENDER_CLOUD_HOST = 'https://symphony-backend-d2lk.onrender.com';
const DEFAULT_PORT = 5050;
const DEFAULT_HOST = RENDER_CLOUD_HOST;

class ApiService {
  private baseUrl: string = DEFAULT_HOST;
  private trendingCache = new Map<string, { data: Track[]; timestamp: number }>();
  private searchCache = new Map<string, { data: Track[]; timestamp: number }>();
  private streamCache = new Map<string, { url: string; timestamp: number }>();
  private searchAbortController: AbortController | null = null;

  constructor() {
    this.baseUrl = DEFAULT_HOST;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
    this.trendingCache.clear();
    this.searchCache.clear();
    this.streamCache.clear();
  }

  async checkHealth(): Promise<{ isConnected: boolean; ytDlpVersion: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          isConnected: data.status === 'ok',
          ytDlpVersion: data.ytDlpVersion || 'Installed',
        };
      }
    } catch {
      // If localhost failed on Android, try emulator fallback 10.0.2.2
      if (Platform.OS === 'android' && this.baseUrl.includes('localhost')) {
        try {
          const fallbackUrl = `http://10.0.2.2:${DEFAULT_PORT}`;
          const fallbackRes = await fetch(`${fallbackUrl}/api/health`);
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            this.baseUrl = fallbackUrl;
            return {
              isConnected: data.status === 'ok',
              ytDlpVersion: data.ytDlpVersion || 'Installed',
            };
          }
        } catch {
          // ignore
        }
      }
    }

    return {
      isConnected: false,
      ytDlpVersion: 'Disconnected',
    };
  }

  async searchTracks(query: string, limit: number = 15): Promise<Track[]> {
    const trimmed = query.trim().toLowerCase();
    const cacheKey = `${trimmed}_${limit}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 600000) {
      return cached.data;
    }

    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    this.searchAbortController = new AbortController();

    try {
      const res = await fetch(
        `${this.baseUrl}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        { signal: this.searchAbortController.signal }
      );
      if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
      const data = await res.json();
      const results: Track[] = data.results || [];
      this.searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
      return results;
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return [];
      }
      console.error('Search API error:', e);
      return [];
    }
  }

  async getStreamUrl(trackId: string): Promise<string> {
    const cached = this.streamCache.get(trackId);
    if (cached && Date.now() - cached.timestamp < 2700000) {
      return cached.url;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/stream-url/${trackId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.streamUrl) {
          this.streamCache.set(trackId, { url: data.streamUrl, timestamp: Date.now() });
          return data.streamUrl;
        }
      }
    } catch (e) {
      console.warn('Stream URL endpoint failed, using direct stream route:', e);
    }
    // Fallback directly to the streaming endpoint
    return `${this.baseUrl}/api/stream/${trackId}`;
  }

  async getTrending(genre: string = 'top'): Promise<Track[]> {
    const cached = this.trendingCache.get(genre);
    if (cached && Date.now() - cached.timestamp < 600000) {
      return cached.data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/trending?genre=${genre}`);
      if (!res.ok) throw new Error('Failed to fetch trending');
      const data = await res.json();
      const results: Track[] = data.results || [];
      this.trendingCache.set(genre, { data: results, timestamp: Date.now() });
      return results;
    } catch (e) {
      console.error('Trending API error:', e);
      return [];
    }
  }

  async downloadTrack(trackId: string): Promise<{ success: boolean; url?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/download/${trackId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      return {
        success: data.success,
        url: data.downloadUrl ? `${this.baseUrl}${data.downloadUrl}` : undefined,
      };
    } catch (e) {
      console.error('Download API error:', e);
      return { success: false };
    }
  }
}

export const api = new ApiService();
