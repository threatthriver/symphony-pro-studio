import React from 'react';
import { Shield, Key, Globe, Monitor, Volume2, Database } from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    title: 'General',
    options: [
      { id: 'appearance', title: 'Appearance', description: 'System (Dark)', icon: Monitor, value: 'Dark' },
      { id: 'language', title: 'Language', description: 'English (US)', icon: Globe, value: 'English' },
    ]
  },
  {
    title: 'Playback',
    options: [
      { id: 'quality', title: 'Default Quality', description: 'High Definition (1080p)', icon: Monitor, value: '1080p' },
      { id: 'volume', title: 'Default Volume', description: '80%', icon: Volume2, value: '80%' },
    ]
  },
  {
    title: 'Privacy & Security',
    options: [
      { id: 'safeSearch', title: 'Restricted Mode', description: 'Filter mature content', icon: Shield, type: 'toggle', value: true },
      { id: 'cache', title: 'Clear Cache', description: '42.5 MB used', icon: Database, value: 'Clear' },
    ]
  }
];

const SettingsPage = () => {
  return (
    <div className="px-6 py-6 max-w-[800px] mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white/90 mb-1">Settings</h2>
        <p className="text-[13px] font-medium text-white/40">Manage your application preferences.</p>
      </div>

      <div className="space-y-8">
        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-[11px] font-bold text-white/20 uppercase tracking-widest px-1">{section.title}</h3>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden divide-y divide-white/[0.05]">
              {section.options.map((option) => (
                <div key={option.id} className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 shadow-sm">
                      <option.icon size={16} className="text-white/60 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-white/90">{option.title}</h4>
                      <p className="text-[11px] font-medium text-white/30">{option.description}</p>
                    </div>
                  </div>
                  
                  {option.type === 'toggle' ? (
                    <button className={`w-9 h-5 rounded-full p-0.5 transition-colors ${option.value ? 'bg-[#007AFF]' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${option.value ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  ) : (
                    <div className="text-[11px] font-bold text-[#007AFF] hover:underline cursor-pointer">
                      {option.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-[10px] font-medium text-white/10 uppercase tracking-[0.2em]">Symphony Pro Studio • Version 1.2.0 (Stable)</p>
      </div>
    </div>
  );
};

export default SettingsPage;
