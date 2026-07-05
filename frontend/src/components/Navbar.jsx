import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  }, [location.pathname]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await api.search(query);
        setResults(r.slice(0, 8));
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  function goToProduct(r) {
    if (r.subcategorySlug) {
      navigate(`/${r.categorySlug}/${r.subcategorySlug}/${r.id}`);
    } else {
      navigate(`/${r.categorySlug}/${r.id}`);
    }
    setSearchOpen(false);
  }

  function handleSearchSubmit() {
    if (!query.trim()) return;
    navigate(`/busca?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-white/5 shadow-2xl' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-2xl tracking-widest text-white group-hover:text-brand-500 transition-colors">
            BRESOLIN
          </span>
          <span className="font-display text-2xl tracking-widest text-brand-500">
            JERSEYS
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Buscar"
          >
            {searchOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-white/5 bg-dark-800/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Buscar camisas..."
                className="w-full pl-10 pr-10 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors text-sm"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              )}
              {query.trim() && !searching && (
                <button
                  onClick={handleSearchSubmit}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-500 transition-colors"
                  aria-label="Ver todos os resultados"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {results.length > 0 && (
              <div className="mt-2 rounded-xl border border-white/10 overflow-hidden">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => goToProduct(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div
                      className="w-10 h-10 rounded-lg bg-dark-600 flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${r.cover})` }}
                    />
                    <div>
                      <p className="text-sm text-white font-medium">{r.name}</p>
                      <p className="text-xs text-gray-500">
                        {r.category}{r.subcategory ? ` › ${r.subcategory}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.length > 0 && (
              <button
                onClick={handleSearchSubmit}
                className="mt-2 w-full py-2 text-xs text-brand-400 hover:text-brand-300 transition-colors text-center"
              >
                Ver todos os resultados para "{query}" →
              </button>
            )}

            {query && !searching && results.length === 0 && (
              <p className="mt-3 text-sm text-gray-500 text-center py-2">
                Nenhum resultado para "{query}"
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}