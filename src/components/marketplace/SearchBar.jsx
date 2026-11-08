import { useEffect, useState } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

export function SearchBar({ value, onChange, placeholder = 'Search textbooks, electronics...' }) {
  const [draft, setDraft] = useState(value ?? '');
  const [recent, setRecent] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    setRecent(saved);
  }, []);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => {
      if (draft !== value) {
        onChange(draft);
        if (draft.trim().length > 2) {
          saveSearch(draft.trim());
        }
      }
    }, 300);
    return () => clearTimeout(id);
  }, [draft]);

  useEffect(() => { setDraft(value ?? ''); }, [value]);

  const saveSearch = (term) => {
    const saved = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    const updated = [term, ...saved.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    setRecent(updated);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 focus:outline-none"
      />
      {draft && (
        <button
          onClick={() => setDraft('')}
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
                  onClick={() => setDraft(term)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 transition-colors"
                >
                  {term}
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
                onClick={() => setDraft(term)}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}