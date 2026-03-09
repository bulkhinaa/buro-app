import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Review } from '../types';
import { supabase } from '../lib/supabase';

const REVIEWS_KEY = 'client_reviews';

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;

  // Actions
  loadReviews: (clientId: string) => Promise<void>;
  submitReview: (review: Omit<Review, 'id' | 'created_at'>) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  isLoading: false,

  loadReviews: async (clientId: string) => {
    set({ isLoading: true });

    const isDev = clientId.startsWith('dev-');

    if (isDev) {
      try {
        const stored = await AsyncStorage.getItem(REVIEWS_KEY);
        set({ reviews: stored ? JSON.parse(stored) : [], isLoading: false });
      } catch {
        set({ reviews: [], isLoading: false });
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          set({ reviews: data as Review[], isLoading: false });
        } else {
          set({ reviews: [], isLoading: false });
        }
      } catch {
        try {
          const stored = await AsyncStorage.getItem(REVIEWS_KEY);
          set({ reviews: stored ? JSON.parse(stored) : [], isLoading: false });
        } catch {
          set({ reviews: [], isLoading: false });
        }
      }
    }
  },

  submitReview: async (review: Omit<Review, 'id' | 'created_at'>) => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    const { reviews } = get();
    const updated = [newReview, ...reviews];
    set({ reviews: updated });

    // Persist locally
    try {
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    // Try Supabase (non-blocking for dev users)
    const isDev = review.client_id.startsWith('dev-');
    if (!isDev) {
      try {
        await supabase.from('reviews').insert({
          project_id: review.project_id,
          master_id: review.master_id,
          client_id: review.client_id,
          rating: review.rating,
          text: review.text || null,
        });
      } catch {
        // Dev fallback — already saved locally
      }
    }
  },
}));
