import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cheezeyy_recently_viewed';
const MAX_ITEMS = 12;

export type RecentItem = {
  id: number;
  name: string;
  image: string;
  price: number;
  category?: string;
  viewedAt: number;
};

const read = (): RecentItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (items: RecentItem[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
};

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>(() => read());

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const track = useCallback((item: Omit<RecentItem, 'viewedAt'>) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== item.id);
      const next = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => { write([]); setItems([]); }, []);

  return { items, track, clear };
}
