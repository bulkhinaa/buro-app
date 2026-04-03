import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://aaghopgrlxdjsrvmbuds.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZ2hvcGdybHhkanNydm1idWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTU0ODUsImV4cCI6MjA4ODM5MTQ4NX0.kcRS5xcS5yR8ghUdhE5FJkYTB_23a0OOMzhcI-SGIzY';

const SECURE_STORE_LIMIT = 2048;

/**
 * Secure storage adapter for Supabase Auth.
 * - Native (iOS/Android): uses SecureStore (encrypted keychain/keystore)
 * - Web: falls back to AsyncStorage (no SecureStore support)
 * - Values exceeding SecureStore 2048-byte limit fall back to AsyncStorage
 */
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;
      // Fallback to AsyncStorage (migration from old storage or large values)
      return AsyncStorage.getItem(key);
    } catch {
      return AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    try {
      if (value.length <= SECURE_STORE_LIMIT) {
        await SecureStore.setItemAsync(key, value);
        // Clean up AsyncStorage if migrating
        try { await AsyncStorage.removeItem(key); } catch { /* ignore */ }
      } else {
        // Value too large for SecureStore, use AsyncStorage
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch { /* ignore */ }
    // Also clean up from AsyncStorage (migration)
    try {
      await AsyncStorage.removeItem(key);
    } catch { /* ignore */ }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
