import React from 'react';
import { Search, MonitorPlay, Bell, User, ChevronLeft, ChevronRight, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ query, setQuery, onSearch, onNavigate }) => {
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length > 1) {
        const results = await window.api.getSuggestions(query);
        setSuggestions(results);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(null, suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        onSearch(e);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
    onSearch(null, '');
  };

  return (
    <header className="h-14 flex items-center px-6 drag z-[100] sticky top-0 backdrop-blur-2xl bg-black/10 border-b border-white/[0.03]">
      {/* Left: Navigation Buttons */}
      <div className="flex items-center gap-4 no-drag min-w-[120px]">
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/[0.05]">
          <button 
            onClick={() => window.history.back()}
            className="p-1.5 hover:bg-white/5 rounded-md transition-all text-white/30 hover:text-white/90 active:scale-90"
          >
            <ChevronLeft size={16} strokeWidth={3} />
          </button>
          <button 
            onClick={() => window.history.forward()}
            className="p-1.5 hover:bg-white/5 rounded-md transition-all text-white/30 hover:text-white/90 active:scale-90"
          >
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 flex justify-center no-drag">
        <div className="w-full max-w-[540px] relative group no-drag">
          <div className={`absolute -inset-[1px] bg-gradient-to-r from-[#007AFF]/50 to-[#5856D6]/50 rounded-[1.25rem] opacity-0 transition-opacity duration-500 blur-[2px] ${showSuggestions ? 'opacity-100' : 'group-focus-within:opacity-40'}`} />
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={14} className="text-white/20 group-focus-within:text-[#007AFF] transition-colors" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search Symphony Studio..."
              className="w-full bg-[#0A0A0A]/80 border border-white/[0.08] rounded-[1.1rem] py-2.5 pl-12 pr-12 text-[14px] font-black tracking-tight focus:outline-none focus:bg-black/90 focus:border-[#007AFF]/40 focus:ring-8 focus:ring-[#007AFF]/5 transition-all placeholder:text-white/20 text-white/90 backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
            />
            
            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
              {query ? (
                <button 
                  onClick={handleClear}
                  className="text-white/20 hover:text-white/60 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                    <span className="text-[10px] font-black">✕</span>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/5 bg-white/[0.02] opacity-40">
                  <Command size={10} />
                  <span className="text-[10px] font-bold">K</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-4 bg-[#0A0A0A]/90 backdrop-blur-[40px] border border-white/[0.08] rounded-[2.2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8),0_0_20px_rgba(0,122,255,0.05)] overflow-hidden py-3 z-[200] p-2"
              >
                <div className="px-6 py-2 mb-2">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]">Quick Search</span>
                </div>
                <div className="space-y-1">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => handleSuggestionClick(s)}
                      className={`w-full text-left px-5 py-3.5 rounded-[1.4rem] text-[14px] font-black flex items-center justify-between group/item transition-all ${
                        selectedIndex === i 
                          ? 'bg-[#007AFF] text-white shadow-[0_10px_20px_rgba(0,122,255,0.3)]' 
                          : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${selectedIndex === i ? 'bg-white/20' : 'bg-white/5 text-white/20'}`}>
                          <Search size={14} strokeWidth={3} />
                        </div>
                        <span className="truncate tracking-tight">{s}</span>
                      </div>
                      <ChevronRight size={14} className={`opacity-0 group-hover/item:opacity-40 transition-all ${selectedIndex === i ? 'text-white !opacity-100' : '-translate-x-2'}`} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="min-w-[120px] flex justify-end items-center gap-2 no-drag">
        <button className="p-2 text-white/30 hover:text-white/80 transition-colors">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#0051FF] p-[1px]">
           <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
             <User size={16} className="text-white/80" />
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
