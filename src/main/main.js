const { app, BrowserWindow, ipcMain, protocol, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const http = require('http');
const fs = require('fs');
const vm = require('vm');
const DownloadManager = require('./DownloadManager');

let win;
let streamServer;
let yt;

const streamCache = new Map();
const MAX_STREAM_CACHE_ENTRIES = 8;

async function getYouTube(cookie = null) {
  if (!yt || cookie) {
    const { Innertube, UniversalCache } = await import('youtubei.js');
    
    yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      cookie: cookie || undefined
    });
  }
  return yt;
}

const { exec } = require('child_process');

function getDirectUrl(videoId, quality) {
  return new Promise((resolve, reject) => {
    let format = 'best';
    if (quality && quality !== 'best') {
      format = `best[height<=${quality}]/best`;
    }
    exec(`yt-dlp -f "${format}" -g "https://www.youtube.com/watch?v=${videoId}"`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        // Just in case yt-dlp returns multiple lines, take the first one
        resolve(stdout.trim().split('\n')[0]);
      }
    });
  });
}

function startBridgeServer() {
  streamServer = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://127.0.0.1`);
    const videoId = parsedUrl.pathname.split('/')[1]?.trim();
    const quality = parsedUrl.searchParams.get('quality') || 'best';

    if (!videoId || videoId.includes('.') || videoId === 'favicon.ico') {
      res.writeHead(404);
      return res.end();
    }

    console.log(`[Bridge] Request for ${videoId} at quality ${quality}`);

    try {
      const streamUrl = await getDirectUrl(videoId, quality);
      
      if (!streamUrl) throw new Error('Empty URL from yt-dlp');
      
      console.log(`[Bridge] Redirecting ${videoId} to Google Video Servers`);
      res.writeHead(302, { 'Location': streamUrl });
      res.end();
    } catch (err) {
      console.error('[Bridge] Playback Error:', err.message);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end();
      }
    }
  });

  streamServer.listen(0, '127.0.0.1', () => {
    console.log(`[Bridge] Active on port: ${streamServer.address().port}`);
  });
}

function createWindow() {
  const savedState = {
    width: 1400,
    height: 900,
    x: undefined,
    y: undefined,
    ...JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'window-state.json'), { encoding: 'utf8', flag: 'a+' }) || '{}')
  };

  win = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    }
  });

  win.on('close', () => {
    const bounds = win.getBounds();
    fs.writeFileSync(path.join(app.getPath('userData'), 'window-state.json'), JSON.stringify(bounds));
  });

  new DownloadManager(win);

  if (process.env.NODE_ENV === 'development' || true) {
    win.loadURL('http://127.0.0.1:5174');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

let lastSearchResult = null;

ipcMain.handle('search-youtube', async (event, query) => {
  try {
    const youtube = await getYouTube();
    lastSearchResult = await youtube.search(query, { type: 'video' });
    
    const videoResults = lastSearchResult.results.filter(n => n.type === 'Video');
    return videoResults.map(v => ({
      type: 'video',
      id: v.id,
      title: v.title?.text || v.title?.toString() || 'Untitled',
      author: { 
        name: v.author?.name || v.author?.text || 'Unknown',
        id: v.author?.id,
        thumbnail: v.author?.thumbnails?.[0]?.url || v.author?.best_thumbnail?.url || v.author?.avatar?.url,
        isVerified: !!(v.author?.is_verified || v.author?.is_official)
      },
      bestThumbnail: { 
        url: v.thumbnails?.[0]?.url || v.best_thumbnail?.url || '' 
      },
      description: v.description_snippet?.text || v.description?.text || '',
      views: v.short_view_count?.text || v.view_count?.text || '0 views',
      duration: v.duration?.text || v.duration?.toString() || ''
    }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
});

ipcMain.handle('search-more', async () => {
  try {
    if (!lastSearchResult || !lastSearchResult.has_continuation) return [];
    lastSearchResult = await lastSearchResult.getContinuation();
    const videoResults = lastSearchResult.results.filter(n => n.type === 'Video');
    return videoResults.map(v => ({
      type: 'video',
      id: v.id,
      title: v.title?.text || 'Untitled',
      author: { 
        name: v.author?.name || 'Unknown',
        id: v.author?.id,
        thumbnail: v.author?.thumbnails?.[0]?.url || v.author?.best_thumbnail?.url
      },
      bestThumbnail: { url: v.thumbnails?.[0]?.url || v.best_thumbnail?.url || '' },
      description: v.description_snippet?.text || v.description?.text || '',
      views: v.short_view_count?.text || '0 views',
      duration: v.duration?.text || ''
    }));
  } catch (error) {
    return [];
  }
});

ipcMain.handle('get-suggestions', async (event, query) => {
  try {
    if (!query || query.length < 2) return [];
    const youtube = await getYouTube();
    return await youtube.getSearchSuggestions(query);
  } catch (error) {
    return [];
  }
});

async function extractVideosFromFeed(feed) {
  const rawVideos = [];
  const seenIds = new Set();

  const crawler = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    // Look for any object that has a videoId
    const vidId = obj.videoId || obj.video_id || (typeof obj.id === 'string' && obj.id.length === 11 ? obj.id : null);
    
    if (vidId && typeof vidId === 'string' && vidId.length === 11) {
      // Try to find a title in this object or its children
      let title = obj.title?.text || obj.title?.toString() || obj.title || 
                  obj.headline?.text || obj.headline?.toString() ||
                  obj.text?.text || obj.text?.toString();
      
      if (vidId && !seenIds.has(vidId)) {
        rawVideos.push({
          ...obj,
          id: vidId,
          title: title || 'Untitled'
        });
        seenIds.add(vidId);
      }
    }

    if (Array.isArray(obj)) {
      obj.forEach(crawler);
    } else {
      Object.entries(obj).forEach(([key, val]) => {
        if (val && typeof val === 'object' && key !== 'actions' && key !== 'endpoint') {
          crawler(val);
        }
      });
    }
  };

  crawler(feed);
  console.log(`[Bridge] Scraped ${rawVideos.length} videos from raw feed`);
  console.log(`[Bridge] Pattern-matched ${rawVideos.length} potential videos`);
  
  return rawVideos.map(v => {
    const bestThumb = v.thumbnails?.[0]?.url || v.best_thumbnail?.url || v.thumbnail?.[0]?.url || '';
    return {
      type: 'video',
      id: v.id,
      title: v.title || 'Untitled',
      author: { 
        name: v.author?.name?.text || v.author?.name || v.author?.text || v.short_byline_text?.text || 'Unknown',
        id: v.author?.id || v.channel_id,
        thumbnail: v.author?.thumbnails?.[0]?.url || v.author?.best_thumbnail?.url || ''
      },
      bestThumbnail: { url: bestThumb },
      description: v.description_snippet?.text || v.description?.text || v.snippet?.text || '',
      views: v.short_view_count?.text || v.view_count?.text || v.views?.text || '0 views',
      duration: v.duration?.text || v.duration?.toString() || ''
    };
  });
}

ipcMain.handle('get-home-feed', async () => {
  try {
    const youtube = await getYouTube();
    const feed = await youtube.getHomeFeed();
    
    console.log(`[Bridge] Fetching Home Feed...`);
    lastSearchResult = feed;
    const videos = await extractVideosFromFeed(feed);
    console.log(`[Bridge] Final Video Count: ${videos.length}`);
    return videos;
  } catch (error) {
    console.error('[Bridge] Home Feed Error:', error);
    return [];
  }
});


ipcMain.handle('get-subscriptions', async () => {
  return [];
});

ipcMain.handle('get-trending', async () => {
  try {
    const youtube = await getYouTube();
    // FEtrending is the raw browse ID for trending
    const feed = await youtube.browse('FEtrending');
    lastSearchResult = feed;
    return await extractVideosFromFeed(feed);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('get-channel-thumbnail', async (event, channelId) => {
  try {
    const youtube = await getYouTube();
    const channel = await youtube.getChannel(channelId);
    // Be exhaustive in finding the avatar in the channel object
    const avatar = channel.metadata?.avatar?.[0]?.url || 
                   channel.metadata?.thumbnails?.[0]?.url || 
                   channel.header?.author?.thumbnails?.[0]?.url;
    return avatar || null;
  } catch (error) {
    console.error('[Bridge] Failed to fetch channel info:', error.message);
    return null;
  }
});

ipcMain.handle('get-video-details', async (event, videoId) => {
  try {
    const youtube = await getYouTube();
    const info = await youtube.getInfo(videoId);
    
    // Aggressive description search
    let description = '';
    if (info.basic_info?.description) description = info.basic_info.description;
    else if (info.description) description = info.description;
    else if (info.secondary_info?.description?.text) description = info.secondary_info.description.text;
    else if (info.secondary_info?.description?.toString()) description = info.secondary_info.description.toString();
    
    // Fallback View Count
    const views = info.basic_info?.view_count || 
                  info.primary_info?.view_count?.text || 
                  info.primary_info?.view_count?.toString() || 
                  '0 views';

    // Fallback Published Date
    const published = info.primary_info?.published?.text || 
                      info.primary_info?.published?.toString() ||
                      info.basic_info?.published ||
                      'Recently';

    return {
      description,
      viewCount: views,
      publishedAt: published,
      likes: info.primary_info?.menu?.top_level_buttons?.[0]?.label || ''
    };
  } catch (error) {
    console.error('[Bridge] Critical Metadata Error:', error.message);
    return null;
  }
});

ipcMain.handle('get-video-urls', async (event, videoId, quality = 'best') => {
  return new Promise((resolve, reject) => {
    let format = 'best';
    if (quality && quality !== 'best') {
      format = `bestvideo[height<=${quality}]+bestaudio/best`;
    }
    
    console.log(`[Bridge] Fetching raw URLs for ${videoId} at quality ${quality}`);
    exec(`yt-dlp -f "${format}" -g "https://www.youtube.com/watch?v=${videoId}"`, (error, stdout) => {
      if (error) {
        console.error('[Bridge] yt-dlp error:', error);
        resolve({ error: true });
        return;
      }
      
      const urls = stdout.trim().split('\n');
      if (urls.length >= 2) {
        resolve({ type: 'dash', videoUrl: urls[0], audioUrl: urls[1] });
      } else {
        resolve({ type: 'muxed', videoUrl: urls[0] });
      }
    });
  });
});

ipcMain.handle('get-video-url', async (event, videoId, quality = 'best') => {
  // Legacy support, though we won't use it if we use get-video-urls
  if (!streamServer || !streamServer.address()) return '';
  const port = streamServer.address().port;
  return `http://127.0.0.1:${port}/${videoId}?quality=${quality}`;
});

ipcMain.handle('warm-video', async (event, videoId) => {
  // Warming is no longer necessary as we use direct yt-dlp redirect
  return true;
});

app.whenReady().then(async () => {
  await getYouTube(); // Pre-initialize
  startBridgeServer();
  createWindow();

  // Register Global Media Shortcuts
  globalShortcut.register('MediaPlayPause', () => win?.webContents.send('media-play-pause'));
  globalShortcut.register('MediaNextTrack', () => win?.webContents.send('media-next'));
  globalShortcut.register('MediaPreviousTrack', () => win?.webContents.send('media-prev'));

  // Auto Update Configuration
  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    win?.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('update_downloaded');
  });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});


