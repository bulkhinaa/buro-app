/**
 * Error logging service — TASK-03
 *
 * Two-level architecture:
 * 1. Sentry — native crashes, JS errors (add @sentry/react-native later)
 * 2. Supabase error_logs — UX errors, API failures, RLS violations
 *
 * QA-tester can see all errors in Supabase → qa_dashboard VIEW
 */

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type ErrorType = 'api_error' | 'rls_violation' | 'ui_error' | 'network_error' | 'validation';
type Severity = 'critical' | 'high' | 'medium' | 'low';

// Queue for batching error logs (avoid spamming DB)
const errorQueue: Record<string, any>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Log an error to Supabase error_logs table.
 * Non-blocking — errors are batched and flushed every 3 seconds.
 */
export const logError = (
  error_type: ErrorType,
  severity: Severity,
  screen: string,
  action: string,
  error: unknown,
  metadata: Record<string, unknown> = {},
) => {
  const user = useAuthStore.getState().user;
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code ?? (error as any)?.status ?? null;

  // Skip logging for dev users
  if (user?.id.startsWith('dev-')) return;

  // TODO: When Sentry is installed, capture critical/high errors
  // if (severity === 'critical' || severity === 'high') {
  //   Sentry.captureException(error, {
  //     tags: { screen, action, error_type },
  //     extra: metadata,
  //   });
  // }

  // Queue for Supabase insert
  errorQueue.push({
    user_id: user?.id ?? null,
    error_type,
    severity,
    screen,
    action,
    error_code: code ? String(code) : null,
    error_message: msg.slice(0, 500), // Truncate long messages
    metadata,
  });

  // Flush after 3 seconds or 5 errors (whichever comes first)
  if (errorQueue.length >= 5) {
    flushErrors();
  } else {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flushErrors, 3000);
  }
};

/** Flush error queue to Supabase */
const flushErrors = async () => {
  if (errorQueue.length === 0) return;
  const batch = errorQueue.splice(0, errorQueue.length);

  try {
    await supabase.from('error_logs').insert(batch);
  } catch {
    // If insert fails, re-queue (once)
    // Don't re-queue to avoid infinite loops
  }
};

/**
 * Safe Supabase query wrapper — logs errors automatically.
 *
 * Usage:
 * ```typescript
 * const data = await safeQuery(
 *   'ProjectDetail',
 *   'load_stages',
 *   supabase.from('stages').select('*').eq('project_id', id),
 *   'high'
 * );
 * ```
 */
export const safeQuery = async <T>(
  screen: string,
  action: string,
  query: PromiseLike<{ data: T | null; error: any }>,
  severity: Severity = 'high',
): Promise<T | null> => {
  const result = await query;
  if (result.error) {
    logError('api_error', severity, screen, action, result.error);
    throw result.error;
  }
  return result.data;
};

/**
 * Wrap an async function with error logging.
 *
 * Usage:
 * ```typescript
 * const handleSave = withErrorLogging('EditProfile', 'save_profile', async () => {
 *   await saveProfile(updates);
 * });
 * ```
 */
export const withErrorLogging = (
  screen: string,
  action: string,
  fn: () => Promise<void>,
  severity: Severity = 'high',
) => {
  return async () => {
    try {
      await fn();
    } catch (error) {
      logError('api_error', severity, screen, action, error);
      throw error;
    }
  };
};
