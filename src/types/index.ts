export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  url: string;
  streamUrl?: string;
  isDownloaded?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: number;
  coverUrl?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface ServerConfig {
  baseUrl: string;
  isConnected: boolean;
  ytDlpVersion: string;
  lastChecked?: number;
}
