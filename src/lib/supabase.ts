import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aaghopgrlxdjsrvmbuds.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZ2hvcGdybHhkanNydm1idWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTU0ODUsImV4cCI6MjA4ODM5MTQ4NX0.kcRS5xcS5yR8ghUdhE5FJkYTB_23a0OOMzhcI-SGIzY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
