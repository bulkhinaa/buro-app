import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';

WebBrowser.maybeCompleteAuthSession();

// ── Yandex OAuth config ──
const YANDEX_CLIENT_ID = 'e07442624e8441dc87c5f1839b2fdb20';
const SUPABASE_FUNCTIONS_URL =
  'https://aaghopgrlxdjsrvmbuds.supabase.co/functions/v1';

/** Production web redirect URI */
const WEB_REDIRECT_URI = 'https://bulkhinaa.github.io/buro-app/';

/**
 * Returns the correct redirect URI for the current platform.
 * - Web (production): hardcoded GitHub Pages URL
 * - Web (dev): current page URL
 * - Native: deep link scheme
 */
const getRedirectUri = (): string => {
  if (Platform.OS === 'web') {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      return window.location.origin + window.location.pathname;
    }
    return WEB_REDIRECT_URI;
  }
  return 'buroremontov://auth/callback';
};

export function LoginScreen() {
  const [loading, setLoading] = useState<'yandex' | 'tinkoff' | null>(null);
  const { setUser, syncProfile } = useAuthStore();

  // ── Handle OAuth redirect on web (page loads with ?code=xxx) ──
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      // Clean URL so code doesn't persist on refresh
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState({}, '', url.toString());

      // Exchange the code
      handleYandexCode(code);
    }
  }, []);

  /**
   * Exchange Yandex authorization code for a Supabase session
   * via our Edge Function.
   */
  const handleYandexCode = async (code: string) => {
    try {
      setLoading('yandex');

      const redirectUri = getRedirectUri();

      // Call Edge Function to exchange code & create user
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/yandex-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Auth failed (${res.status})`);
      }

      const { email, otp, user_metadata } = await res.json();

      // Verify OTP to establish a real Supabase session
      const { data: sessionData, error: verifyError } =
        await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'magiclink',
        });

      if (verifyError) throw verifyError;

      // Sync profile with Yandex user data
      if (sessionData.user) {
        await syncProfile({
          id: sessionData.user.id,
          name: user_metadata?.name || '',
          phone: user_metadata?.phone || undefined,
        });
      }
    } catch (e: any) {
      console.error('Yandex auth error:', e);
      Alert.alert('Ошибка', e.message || 'Не удалось войти через Яндекс ID');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Start Yandex OAuth flow.
   * - On web: full-page redirect (works in PWA and regular browser)
   * - On native: in-app browser via expo-web-browser
   */
  const handleYandexSignIn = async () => {
    try {
      setLoading('yandex');

      const redirectUri = getRedirectUri();

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: YANDEX_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'login:email login:info',
        force_confirm: 'yes',
      });

      const authUrl = `https://oauth.yandex.ru/authorize?${params}`;

      if (Platform.OS === 'web') {
        // Full-page redirect — works in PWA and regular browser.
        // When Yandex redirects back, the useEffect above catches the code.
        window.location.href = authUrl;
        return; // Page will unload
      }

      // Native: open in-app browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );

      if (result.type === 'success' && result.url) {
        const resultUrl = new URL(result.url);
        const code = resultUrl.searchParams.get('code');
        if (code) {
          await handleYandexCode(code);
        }
      }
    } catch (e: any) {
      console.error('Yandex sign in error:', e);
      Alert.alert('Ошибка', e.message || 'Не удалось войти через Яндекс ID');
    } finally {
      setLoading(null);
    }
  };

  const handleTinkoffSignIn = async () => {
    Alert.alert(
      'Скоро',
      'Вход через Тинькофф ID будет доступен в следующем обновлении',
    );
  };

  const handleDevLogin = (role: UserRole) => {
    setUser({
      id: `dev-${role}`,
      phone: '+7 999 000 00 00',
      name: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role,
      created_at: new Date().toISOString(),
      is_active: true,
    });
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="home" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Бюро ремонтов</Text>
          <Text style={styles.subtitle}>
            Войдите, чтобы управлять{'\n'}вашим ремонтом
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button
            title={loading === 'yandex' ? 'Входим...' : 'Войти через Яндекс ID'}
            onPress={handleYandexSignIn}
            disabled={loading !== null}
            loading={loading === 'yandex'}
            fullWidth
            icon={
              <Ionicons name="log-in-outline" size={20} color={colors.white} />
            }
          />

          <Button
            title="Войти через Тинькофф ID"
            onPress={handleTinkoffSignIn}
            disabled={loading !== null}
            variant="outline"
            fullWidth
            icon={
              <Ionicons name="card-outline" size={20} color={colors.primary} />
            }
          />
        </View>

        <Text style={styles.terms}>
          Продолжая, вы принимаете{'\n'}
          <Text style={styles.termsLink}>Пользовательское соглашение</Text> и{' '}
          <Text style={styles.termsLink}>Политику конфиденциальности</Text>
        </Text>

        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devTitle}>DEV: Быстрый вход</Text>
            <View style={styles.devButtons}>
              {(['client', 'master', 'supervisor', 'admin'] as UserRole[]).map(
                (role) => (
                  <Pressable
                    key={role}
                    style={styles.devButton}
                    onPress={() => handleDevLogin(role)}
                  >
                    <Text style={styles.devButtonText}>{role}</Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: 'rgba(123, 45, 62, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttons: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  terms: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
  },
  devSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  devTitle: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  devButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  devButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  devButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
