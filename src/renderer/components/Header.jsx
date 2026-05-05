import React from 'react';
import { Search, MonitorPlay, Bell, User, ChevronLeft, ChevronRight, Command, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ query, setQuery, onSearch, onNavigate }) => {
  const [suggestions, setSuggestions] = React.useState([]);
  const [historyItems, setHistoryItems] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef(null);

  // Load search history from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('symphony-search-history');
    if (saved) {
      setHistoryItems(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = React.useCallback((term) => {
    if (!term || term.trim().length < 2) return;
    setHistoryItems(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== term.toLowerCase());
      const next = [term, ...filtered].slice(0, 10);
      localStorage.setItem('symphony-search-history', JSON.stringify(next));
      return next;
    });
  }, []);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedQuery = query.trim().toLowerCase();
      
      // Filter history based on current query
      const matchingHistory = trimmedQuery 
        ? historyItems.filter(item => item.toLowerCase().includes(trimmedQuery))
        : historyItems;

      if (trimmedQuery.length > 1) {
        const liveResults = await window.api.getSuggestions(query);
        // Blend matching history with live results, removing duplicates
        const blended = [
          ...matchingHistory.map(text => ({ text, type: 'history' })),
          ...liveResults
            .filter(res => !matchingHistory.some(h => h.toLowerCase() === res.toLowerCase()))
            .map(text => ({ text, type: 'live' }))
        ].slice(0, 8);
        
        setSuggestions(blended);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else if (matchingHistory.length > 0 && inputRef.current === document.activeElement) {
        setSuggestions(matchingHistory.map(text => ({ text, type: 'history' })).slice(0, 8));
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [query, historyItems]);

  const handleSuggestionClick = (suggestion) => {
    const term = typeof suggestion === 'string' ? suggestion : suggestion.text;
    setQuery(term);
    setShowSuggestions(false);
    saveToHistory(term);
    onSearch(null, term);
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
        saveToHistory(query);
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
    <header className="h-16 flex items-center px-6 drag z-[100] sticky top-0 bg-black/80 backdrop-blur-3xl border-b border-white/[0.05]">
      {/* Left: Branding & Navigation */}
      <div className="flex items-center gap-6 no-drag min-w-[120px]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => window.history.forward()}
            className="p-2 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 flex justify-center no-drag">
        <div className="w-full max-w-[640px] relative no-drag">
          <div className="relative flex items-center group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={16} className="text-white/20 group-focus-within:text-white transition-colors" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search videos..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-12 text-[15px] font-medium focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-white/20 text-white"
            />
            
            <div className="absolute inset-y-0 right-4 flex items-center">
              {query && (
                <button 
                  onClick={handleClear}
                  className="text-white/40 hover:text-white transition-colors p-1"
                >
                  <span className="text-[12px]">✕</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-[200]"
              >
                <div className="space-y-0.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => handleSuggestionClick(s)}
                      className={`w-full text-left px-5 py-3 text-[14px] font-medium flex items-center gap-4 transition-colors ${
                        selectedIndex === i ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {s.type === 'history' ? (
                        <History size={16} className="text-white/20" />
                      ) : (
                        <Search size={16} className="text-white/20" />
                      )}
                      <span className="truncate">{s.text}</span>
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
