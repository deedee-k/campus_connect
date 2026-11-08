import { useEffect, useState, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

export function SearchBar({ value, onChange, placeholder = 'Search textbooks, electronics...' }) {
  const [draft, setDraft] = useState(value ?? '');
  const [recent, setRecent] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    setRecent(saved);
  }, []);

  // Debounce search for live filtering
  useEffect(() => {
    const id = setTimeout(() => {
      if (draft !== value) {
        onChange(draft);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [draft, value, onChange]);

  // Keep in sync if parent resets value externally
  useEffect(() => { setDraft(value ?? ''); }, [value]);

  // Handle clicking outside the search bar to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveSearch = (term) => {
    if (!term.trim()) return;
    const saved = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    // Remove duplicates and keep the newest one at the top, max 5
    const updated = [term.trim(), ...saved.filter(t => t.toLowerCase() !== term.trim().toLowerCase())].slice(0, 5);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    setRecent(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveSearch(draft);
      // Don't close the dropdown, let the user see their recent search
      setShowDropdown(true); 
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 focus:outline-none"
      />
      {draft && (
        <button
          onClick={() => { setDraft(''); saveSearch(''); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      )}

      {/* Recommendations Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          
          {/* Recently Searched */}
          {recent.length > 0 && (
            <div className="border-b border-slate-100">
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50 flex items-center gap-1">
                <Clock size={12}/> Recent Searches
              </p>
              {recent.map((term, i) => (
                <button
                  key={i}
                  onClick={() => { setDraft(term); saveSearch(term); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 transition-colors flex items-center gap-2"
                >
                  <Search size={14} className="text-slate-400" /> {term}
                </button>
              ))}
            </div>
          )}

          {/* Trending Recommendations */}
          <div>
            <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50 flex items-center gap-1">
              <TrendingUp size={12}/> Trending on Campus
            </p>
            {['Samsung Phone', 'Calculus Textbook', 'Lenovo Laptop', 'University Hoodie'].map((term) => (
              <button
                key={term}
                onClick={() => { setDraft(term); saveSearch(term); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 transition-colors flex items-center gap-2"
              >
                <TrendingUp size={14} className="text-violet-400" /> {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}