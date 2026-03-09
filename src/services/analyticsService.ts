/**
 * Analytics service — TASK-02
 *
 * Tracks user actions and screen views for funnel analysis.
 * Events are batched (10 events or 5 seconds) before sending to Supabase.
 * Dev users (id starts with "dev-") are excluded from tracking.
 */

import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// Generate a unique session ID per app launch
const SESSION_ID = Math.random().toString(36).substring(2);
const APP_VERSION = '1.0.0';

// Event queue for batching
const eventQueue: Record<string, any>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

type EventType = 'screen_view' | 'button_tap' | 'form_submit' | 'swipe' | 'error';

/**
 * Track a generic event.
 */
export const track = (
  event_type: EventType,
  screen: string,
  action: string,
  metadata: Record<string, unknown> = {},
) => {
  const user = useAuthStore.getState().user;

  // Skip dev users
  if (user?.id.startsWith('dev-')) return;

  eventQueue.push({
    user_id: user?.id ?? null,
    session_id: SESSION_ID,
    event_type,
    screen,
    action,
    metadata,
    platform: Platform.OS,
    app_version: APP_VERSION,
  });

  // Flush at 10 events or after 5 seconds
  if (eventQueue.length >= 10) {
    flush();
  } else {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 5000);
  }
};

/** Send batched events to Supabase */
const flush = async () => {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0, eventQueue.length);

  try {
    await supabase.from('user_events').insert(batch);
  } catch {
    // Silent failure — analytics should never break the app
  }
};

// ─── Convenient helpers ───

/** Track screen view (call in useEffect on mount) */
export const trackScreen = (screen: string, meta?: Record<string, unknown>) =>
  track('screen_view', screen, 'view', meta);

/** Track button tap */
export const trackTap = (screen: string, action: string, meta?: Record<string, unknown>) =>
  track('button_tap', screen, action, meta);

/** Track form submission */
export const trackForm = (screen: string, action: string, meta?: Record<string, unknown>) =>
  track('form_submit', screen, action, meta);

/** Track swipe / scroll event */
export const trackSwipe = (screen: string, action: string, meta?: Record<string, unknown>) =>
  track('swipe', screen, action, meta);

/** Flush remaining events (call on app background / logout) */
export const flushAnalytics = () => flush();
