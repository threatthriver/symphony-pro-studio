import React, { useState, useEffect } from 'react';
import { Download, Folder, Play, Trash2, CheckCircle, Clock, AlertCircle, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DownloadsPage = () => {
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const data = await window.api.getDownloads();
        setDownloads(Array.isArray(data) ? data : []);
      } catch (err) {
        setDownloads([]);
      }
    };
    fetchDownloads();

    const cleanup = window.api.onDownloadStatusUpdate((updatedDownload) => {
      setDownloads(prev => {
        const index = prev.findIndex(d => d.id === updatedDownload.id);
        if (index === -1) return [updatedDownload, ...prev];
        const next = [...prev];
        next[index] = updatedDownload;
        return next;
      });
    });

    return cleanup;
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="px-6 py-6 max-w-[1200px] mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white/90 mb-1">Downloads</h2>
          <p className="text-[13px] font-medium text-white/40">Your offline library and active transfers.</p>
        </div>
        <button 
          onClick={() => window.api.openDownloadFolder()}
          className="mac-button-secondary flex items-center gap-2 !px-3"
        >
          <Folder size={14} className="text-white/60" />
          Show in Finder
        </button>
      </div>

      <div className="space-y-2">
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/10">
            <Download size={48} strokeWidth={1} className="mb-4" />
            <p className="text-sm font-medium">No downloads yet</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {downloads.map((d) => (
              <motion.div 
                key={d.id} 
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mac-card rounded-xl p-3 flex items-center gap-4 group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  d.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                  d.status === 'error' ? 'bg-rose-500/10 text-rose-500' : 
                  'bg-white/5 text-white/40'
                }`}>
                  {d.status === 'completed' ? <CheckCircle size={20} /> : 
                   d.status === 'error' ? <AlertCircle size={20} /> : 
                   <Download size={20} className={d.status === 'downloading' ? 'animate-bounce' : ''} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[13px] font-semibold text-white/90 truncate">{d.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                       <span className="text-[9px] font-bold uppercase tracking-wider text-white/20">{d.format}</span>
                       <span className="text-[9px] font-bold uppercase tracking-wider text-white/20">{d.quality || 'Best'}</span>
                    </div>
                  </div>
                  
                  {d.status === 'downloading' ? (
                    <div className="mt-1.5 space-y-1.5">
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${d.progress}%` }}
                          className="h-full bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.4)]" 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-medium text-white/30 tracking-tight">
                        <div className="flex gap-3">
                          <span className="text-[#007AFF]">{d.progress.toFixed(1)}%</span>
                          <span>{d.speed}</span>
                          <span>{formatBytes(d.totalSize)}</span>
                        </div>
                        <span>ETA: {d.eta}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-white/20">
                      <span className={d.status === 'completed' ? 'text-emerald-500/80' : d.status === 'error' ? 'text-rose-500/80' : ''}>
                        {d.status}
                      </span>
                      {d.status === 'completed' && (
                        <>
                          <span>•</span>
                          <span>{new Date(d.startTime).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{formatBytes(d.size)}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  {d.status === 'completed' && (
                    <button 
                      onClick={() => window.api.openFile(d.path)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  )}
                  <button className="w-8 h-8 flex items-center justify-center hover:bg-rose-500/10 rounded-lg transition-colors text-white/20 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default DownloadsPage;
