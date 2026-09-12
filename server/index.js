const express = require('express');
const cors = require('cors');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Ensure downloads directory exists
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}
app.use('/downloads', express.static(DOWNLOADS_DIR));

// Resolve yt-dlp path
function getYtDlpPath() {
  const venvPath = path.join(__dirname, 'venv/bin/yt-dlp');
  if (fs.existsSync(venvPath)) {
    return venvPath;
  }
  const possiblePaths = [
    '/opt/homebrew/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    'yt-dlp'
  ];
  for (const p of possiblePaths) {
    try {
      execSync(`${p} --version`, { stdio: 'ignore' });
      return p;
    } catch (e) {
      // continue
    }
  }
  return 'yt-dlp';
}

const YT_DLP_BIN = getYtDlpPath();
console.log(`[yt-music-server] Using yt-dlp executable: ${YT_DLP_BIN}`);

// In-memory cache for fast responses
const cache = {
  trending: {},
  streamUrls: new Map(), // videoId -> { url, timestamp }
};

// Helper to format seconds into mm:ss
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Clean song title and artist
function cleanTrackInfo(entry) {
  let title = entry.title || 'Unknown Title';
  let artist = entry.channel || entry.uploader || 'Unknown Artist';

  // If title is "Artist - Song", extract
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  }

  // Remove common noisy tags like (Official Audio), (Official Video), [MV], etc.
  title = title
    .replace(/\s*[([](official\s*(music\s*)?(audio|video|lyric\s*video|hd|4k)?|audio|video|mv|visualizer)[)\]]/gi, '')
    .trim();

  // Get best thumbnail
  let thumbnail = `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`;
  if (entry.thumbnails && Array.isArray(entry.thumbnails) && entry.thumbnails.length > 0) {
    // Pick the highest resolution thumbnail
    const sorted = [...entry.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    thumbnail = sorted[0].url || thumbnail;
  }

  return {
    id: entry.id,
    title,
    artist,
    duration: entry.duration || 0,
    durationFormatted: formatDuration(entry.duration),
    thumbnail,
    url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
  };
}

// 1. Health check
app.get('/api/health', (req, res) => {
  exec(`${YT_DLP_BIN} --version`, (err, stdout) => {
    if (err) {
      console.error('[Health check] Error running yt-dlp:', err.message);
    }
    res.json({
      status: 'ok',
      ytDlpVersion: stdout ? stdout.trim() : 'unknown',
      ytDlpPath: YT_DLP_BIN,
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  });
});

// 2. Search
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  const limit = parseInt(req.query.limit, 10) || 12;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Search query "q" is required' });
  }

  // Enhance query to prefer audio/songs
  const searchQuery = `ytsearch${limit}:${query.trim()} official audio`;
  const args = [searchQuery, '--dump-single-json', '--flat-playlist', '--skip-download'];

  const proc = spawn(YT_DLP_BIN, args);
  let stdoutData = '';
  let stderrData = '';

  proc.stdout.on('data', (data) => {
    stdoutData += data;
  });

  proc.stderr.on('data', (data) => {
    stderrData += data;
  });

  proc.on('close', (code) => {
    if (code !== 0 || !stdoutData) {
      console.error(`[Search Error] Exit code ${code}: ${stderrData}`);
      return res.status(500).json({ error: 'Search failed', details: stderrData });
    }

    try {
      const parsed = JSON.parse(stdoutData);
      const entries = parsed.entries || [];
      const results = entries.map(cleanTrackInfo);
      res.json({ results, count: results.length });
    } catch (parseErr) {
      res.status(500).json({ error: 'Failed to parse search results', details: parseErr.message });
    }
  });
});

// Common extractor arguments to prevent bot detection and use Node runtime
const COMMON_YT_ARGS = [
  '--js-runtimes', 'node',
  '--remote-components', 'ejs:github',
  '--extractor-args', 'youtube:player_client=tv,android,web',
];

// 3. Direct Stream URL Resolution
app.get('/api/stream-url/:id', (req, res) => {
  const videoId = req.params.id;
  if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

  // Check in-memory cache (cached for 1 hour)
  const cached = cache.streamUrls.get(videoId);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return res.json({ streamUrl: cached.url, cached: true });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const args = [
    ...COMMON_YT_ARGS,
    '-g',
    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
    url,
  ];

  exec(`${YT_DLP_BIN} ${args.map(a => `"${a}"`).join(' ')}`, { timeout: 20000 }, (err, stdout, stderr) => {
    if (err || !stdout.trim()) {
      return res.status(500).json({ error: 'Failed to extract stream URL', details: stderr });
    }

    const streamUrl = stdout.trim().split('\n')[0];
    cache.streamUrls.set(videoId, { url: streamUrl, timestamp: Date.now() });

    res.json({ streamUrl, cached: false });
  });
});

// 4. Stream endpoint (handles direct redirect or audio piping)
app.get('/api/stream/:id', (req, res) => {
  const videoId = req.params.id;
  const pipe = req.query.pipe === 'true';

  if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

  if (!pipe) {
    // Redirect to direct audio CDN stream
    const cached = cache.streamUrls.get(videoId);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return res.redirect(cached.url);
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const args = [
      ...COMMON_YT_ARGS,
      '-g',
      '-f', 'bestaudio[ext=m4a]/bestaudio/best',
      url,
    ];

    exec(`${YT_DLP_BIN} ${args.map(a => `"${a}"`).join(' ')}`, { timeout: 20000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        return res.status(500).json({ error: 'Failed to get stream' });
      }
      const streamUrl = stdout.trim().split('\n')[0];
      cache.streamUrls.set(videoId, { url: streamUrl, timestamp: Date.now() });
      res.redirect(streamUrl);
    });
  } else {
    // Pipe raw audio stream
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const proc = spawn(YT_DLP_BIN, [...COMMON_YT_ARGS, '-o', '-', '-f', 'bestaudio[ext=m4a]/bestaudio', url]);

    res.setHeader('Content-Type', 'audio/mp4');
    proc.stdout.pipe(res);

    req.on('close', () => {
      proc.kill();
    });
  }
});

// 5. Trending / Explore Tracks
app.get('/api/trending', (req, res) => {
  const genre = req.query.genre || 'top';
  const queryMap = {
    top: 'trending songs 2026',
    chill: 'lofi hip hop chill beats music',
    workout: 'workout gym motivation music',
    focus: 'deep focus study instrumental',
    party: 'party dance club hits music',
    pop: 'popular pop hits music',
    rock: 'rock classic alternative music',
  };

  const searchQuery = queryMap[genre] || queryMap.top;
  const cacheKey = `trending_${genre}`;

  if (cache.trending[cacheKey] && Date.now() - cache.trending[cacheKey].timestamp < 900000) {
    return res.json({ results: cache.trending[cacheKey].data, cached: true });
  }

  const args = [`ytsearch10:${searchQuery}`, '--dump-single-json', '--flat-playlist', '--skip-download'];

  exec(`${YT_DLP_BIN} ${args.map(a => `"${a}"`).join(' ')}`, { timeout: 25000 }, (err, stdout, stderr) => {
    if (err || !stdout) {
      // Fallback sample data if offline
      return res.json({ results: getFallbackTrending(genre), fallback: true });
    }

    try {
      const parsed = JSON.parse(stdout);
      const entries = parsed.entries || [];
      const results = entries.map(cleanTrackInfo);
      cache.trending[cacheKey] = { data: results, timestamp: Date.now() };
      res.json({ results, cached: false });
    } catch (e) {
      res.json({ results: getFallbackTrending(genre), fallback: true });
    }
  });
});

// 6. Download for Offline Playback
app.post('/api/download/:id', (req, res) => {
  const videoId = req.params.id;
  const filename = `${videoId}.mp3`;
  const filePath = path.join(DOWNLOADS_DIR, filename);

  if (fs.existsSync(filePath)) {
    return res.json({
      success: true,
      alreadyDownloaded: true,
      downloadUrl: `/downloads/${filename}`,
      filename,
    });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const args = [
    ...COMMON_YT_ARGS,
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', path.join(DOWNLOADS_DIR, `${videoId}.%(ext)s`),
    url
  ];

  const proc = spawn(YT_DLP_BIN, args);
  let errorMsg = '';

  proc.stderr.on('data', (d) => {
    errorMsg += d.toString();
  });

  proc.on('close', (code) => {
    if (code === 0 && fs.existsSync(filePath)) {
      res.json({
        success: true,
        downloadUrl: `/downloads/${filename}`,
        filename,
      });
    } else {
      res.status(500).json({ error: 'Download failed', details: errorMsg });
    }
  });
});

// 7. List downloaded files
app.get('/api/downloads', (req, res) => {
  fs.readdir(DOWNLOADS_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read downloads directory' });
    const mp3s = files.filter(f => f.endsWith('.mp3')).map(f => ({
      id: f.replace('.mp3', ''),
      filename: f,
      url: `/downloads/${f}`,
    }));
    res.json({ downloads: mp3s });
  });
});

// Fallback curated tracks
function getFallbackTrending(genre) {
  return [
    {
      id: '5NV6Rdv1a3I',
      title: 'Get Lucky',
      artist: 'Daft Punk ft. Pharrell Williams',
      duration: 249,
      durationFormatted: '4:09',
      thumbnail: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hq720.jpg',
      url: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I',
    },
    {
      id: 'd5gf9dXbPi0',
      title: 'BIRDS OF A FEATHER',
      artist: 'Billie Eilish',
      duration: 212,
      durationFormatted: '3:32',
      thumbnail: 'https://i.ytimg.com/vi/d5gf9dXbPi0/hq720.jpg',
      url: 'https://www.youtube.com/watch?v=d5gf9dXbPi0',
    },
    {
      id: '4NRXx6U8ABQ',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      duration: 200,
      durationFormatted: '3:20',
      thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hq720.jpg',
      url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
    },
    {
      id: 'kXYiU_JCYtU',
      title: 'Numb',
      artist: 'Linkin Park',
      duration: 187,
      durationFormatted: '3:07',
      thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hq720.jpg',
      url: 'https://www.youtube.com/watch?v=kXYiU_JCYtU',
    },
  ];
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[yt-music-server] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[yt-music-server] Ready to stream with yt-dlp!`);
});
