const { ipcMain, shell, app } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class DownloadManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.downloads = new Map();
    this.downloadPath = path.join(app.getPath('downloads'), 'Antigravity-Downloads');
    
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }

    this.setupIpc();
  }

  setupIpc() {
    ipcMain.handle('start-download', async (event, { url, videoId, title, format = 'video', quality }) => {
      return this.startDownload(url, videoId, title, format, quality);
    });

    ipcMain.handle('get-downloads', async () => {
      return Array.from(this.downloads.values());
    });

    ipcMain.handle('open-download-folder', async () => {
      shell.openPath(this.downloadPath);
    });
    
    ipcMain.handle('open-file', async (event, filePath) => {
      shell.openPath(filePath);
    });
  }

  startDownload(url, videoId, title, format, quality) {
    const id = videoId || Math.random().toString(36).substring(7);
    const safeTitle = (title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const downloadEntry = {
      id,
      url,
      title: title || 'Untitled Video',
      status: 'downloading',
      progress: 0,
      speed: '0 KiB/s',
      eta: 'Unknown',
      path: '',
      format: quality ? `${format} (${quality}p)` : format,
      startTime: Date.now()
    };

    this.downloads.set(id, downloadEntry);
    this.notifyProgress(id);

    const args = [
      '--newline',
      '--progress',
      '--progress-template', '%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s',
      '--output', path.join(this.downloadPath, `%(title)s.%(ext)s`),
      url
    ];

    if (format === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      // Best video up to the specified quality + best audio merged into mp4
      let formatString = 'bestvideo+bestaudio/best';
      if (quality) {
        formatString = `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}][ext=mp4]/best`;
      }
      args.push('-f', formatString, '--merge-output-format', 'mp4');
    }

    const process = spawn('yt-dlp', args);

    process.stdout.on('data', (data) => {
      const output = data.toString().trim();
      
      if (output.includes('has already been downloaded')) {
        downloadEntry.progress = 100;
        downloadEntry.status = 'completed';
        this.notifyProgress(id);
      }

      // yt-dlp output with our template: 45.2%|1.2MiB/s|00:15
      const match = output.match(/([\d.]+)%\|([^|]+)\|([^|]+)/);
      if (match) {
        const [, percent, speed, eta] = match;
        downloadEntry.progress = parseFloat(percent);
        downloadEntry.speed = speed.trim();
        downloadEntry.eta = eta.trim();
        this.notifyProgress(id);
      }
      
      // Try to catch the file path
      if (output.includes('[download] Destination:')) {
        downloadEntry.path = output.split('[download] Destination:')[1].trim();
      } else if (output.includes('[VideoConvertor] Merging formats into')) {
          downloadEntry.path = output.split('Merging formats into "')[1].split('"')[0].trim();
      } else if (output.includes('[ExtractAudio] Destination:')) {
          downloadEntry.path = output.split('[ExtractAudio] Destination:')[1].trim();
      }
    });

    process.stderr.on('data', (data) => {
      console.error(`[DownloadManager] Error: ${data}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        downloadEntry.status = 'completed';
        downloadEntry.progress = 100;
      } else {
        // Check if it was already downloaded (sometimes code is non-zero or we can check output)
        if (downloadEntry.progress === 100) {
            downloadEntry.status = 'completed';
        } else {
            downloadEntry.status = 'error';
        }
      }
      this.notifyProgress(id);
    });

    return id;
  }

  notifyProgress(id) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('download-status-update', this.downloads.get(id));
    }
  }
}

module.exports = DownloadManager;
