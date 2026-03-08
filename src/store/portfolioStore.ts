import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PortfolioState {
  bookmarks: Set<string>;
  likes: Record<string, boolean>; // caseId -> liked by current user
  toggleBookmark: (id: string) => void;
  toggleLike: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  isLiked: (id: string) => boolean;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY_BOOKMARKS = 'portfolio_bookmarks';
const STORAGE_KEY_LIKES = 'portfolio_likes';

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  bookmarks: new Set<string>(),
  likes: {},

  toggleBookmark: (id: string) => {
    const { bookmarks } = get();
    const next = new Set(bookmarks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ bookmarks: next });
    // Persist
    AsyncStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify([...next])).catch(() => {});
  },

  toggleLike: (id: string) => {
    const { likes } = get();
    const next = { ...likes, [id]: !likes[id] };
    set({ likes: next });
    // Persist
    AsyncStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(next)).catch(() => {});
  },

  isBookmarked: (id: string) => get().bookmarks.has(id),
  isLiked: (id: string) => !!get().likes[id],

  hydrate: async () => {
    try {
      const [bm, lk] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_BOOKMARKS),
        AsyncStorage.getItem(STORAGE_KEY_LIKES),
      ]);
      if (bm) set({ bookmarks: new Set(JSON.parse(bm)) });
      if (lk) set({ likes: JSON.parse(lk) });
    } catch {}
  },
}));

// Hydrate on import
usePortfolioStore.getState().hydrate();
