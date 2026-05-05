const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  search: (query) => ipcRenderer.invoke('search-youtube', query),
  getSuggestions: (query) => ipcRenderer.invoke('get-suggestions', query),
  searchMore: () => ipcRenderer.invoke('search-more'),

  getHomeFeed: () => ipcRenderer.invoke('get-home-feed'),
  getSubscriptions: () => ipcRenderer.invoke('get-subscriptions'),
  getTrending: () => ipcRenderer.invoke('get-trending'),
  getVideoUrls: (videoId, quality) => ipcRenderer.invoke('get-video-urls', videoId, quality),
  getChannelThumbnail: (channelId) => ipcRenderer.invoke('get-channel-thumbnail', channelId),
  getVideoUrl: (videoId, quality) => ipcRenderer.invoke('get-video-url', videoId, quality),
  warmVideo: (videoId) => ipcRenderer.invoke('warm-video', videoId),
  getVideoDetails: (videoId) => ipcRenderer.invoke('get-video-details', videoId),
  onDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  // Download System
  startDownload: (data) => ipcRenderer.invoke('start-download', data),
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  openDownloadFolder: () => ipcRenderer.invoke('open-download-folder'),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  onDownloadStatusUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-status-update', handler);
    return () => ipcRenderer.removeListener('download-status-update', handler);
  },
  // Update System
  onUpdateAvailable: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('update_available', handler);
    return () => ipcRenderer.removeListener('update_available', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('update_downloaded', handler);
    return () => ipcRenderer.removeListener('update_downloaded', handler);
  },
  restartApp: () => ipcRenderer.send('restart_app'),
  // Media Keys
  onMediaPlayPause: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('media-play-pause', handler);
    return () => ipcRenderer.removeListener('media-play-pause', handler);
  },
  onMediaNext: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('media-next', handler);
    return () => ipcRenderer.removeListener('media-next', handler);
  },
  onMediaPrev: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('media-prev', handler);
    return () => ipcRenderer.removeListener('media-prev', handler);
  }
});
