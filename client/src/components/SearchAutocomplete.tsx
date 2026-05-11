import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAutocomplete, trackSearch } from '../api';

type Suggestion = { id: number; name: string; category: string; price: number; image: string };

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSearch: (v: string) => void;
}

export default function SearchAutocomplete({ value, onChange, onSearch }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setSuggestions([]); setTrending([]); return; }
    try {
      const data = await fetchAutocomplete(q);
      setSuggestions(data.products || []);
      setTrending(data.trending || []);
    } catch {
      setSuggestions([]); setTrending([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allItems = [
    ...trending.map((t) => ({ type: 'trending' as const, label: t })),
    ...suggestions.map((s) => ({ type: 'product' as const, ...s })),
  ];

  const hasResults = allItems.length > 0;

  const select = (label: string) => {
    onChange(label);
    onSearch(label);
    trackSearch(label);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !hasResults) {
      if (e.key === 'Enter') { onSearch(value); trackSearch(value); setOpen(false); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0) {
        select(allItems[highlighted].label ?? (allItems[highlighted] as any).name);
      } else {
        onSearch(value); trackSearch(value); setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false); setHighlighted(-1);
    }
  };

  return (
    <div ref={containerRef} className="search-autocomplete-wrap">
      <input
        className="search-input"
        placeholder="Search products..."
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      <AnimatePresence>
        {open && hasResults && (
          <motion.div
            className="autocomplete-dropdown"
            initial={{ opacity: 0, y: -6, scaleY: 0.97 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top' }}
          >
            {trending.length > 0 && (
              <div className="ac-section-label">TRENDING</div>
            )}
            {trending.map((t, i) => (
              <div
                key={`t-${t}`}
                className={`ac-item ac-trending ${highlighted === i ? 'ac-item-active' : ''}`}
                onMouseDown={() => select(t)}
                onMouseEnter={() => setHighlighted(i)}
              >
                <span className="ac-trend-icon">↗</span>
                <span>{t}</span>
              </div>
            ))}

            {suggestions.length > 0 && (
              <div className="ac-section-label" style={{ marginTop: trending.length ? 4 : 0 }}>PRODUCTS</div>
            )}
            {suggestions.map((s, i) => {
              const idx = trending.length + i;
              return (
                <div
                  key={`p-${s.id}`}
                  className={`ac-item ac-product ${highlighted === idx ? 'ac-item-active' : ''}`}
                  onMouseDown={() => select(s.name)}
                  onMouseEnter={() => setHighlighted(idx)}
                >
                  {s.image
                    ? <img src={s.image} alt={s.name} className="ac-product-img" />
                    : <div className="ac-product-img ac-product-img-empty" />}
                  <div className="ac-product-info">
                    <span className="ac-product-name">{s.name}</span>
                    <span className="ac-product-cat">{s.category}</span>
                  </div>
                  <span className="ac-product-price">${s.price.toFixed(2)}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
