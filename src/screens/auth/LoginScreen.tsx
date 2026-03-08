import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';

WebBrowser.maybeCompleteAuthSession();

// ── Yandex OAuth config ──
const YANDEX_CLIENT_ID = 'e07442624e8441dc87c5f1839b2fdb20';
const SUPABASE_FUNCTIONS_URL =
  'https://aaghopgrlxdjsrvmbuds.supabase.co/functions/v1';

/** Production web redirect URI */
const WEB_REDIRECT_URI = 'https://bulkhinaa.github.io/buro-app/';

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
  const showToast = useToastStore((s) => s.show);

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

      handleYandexCode(code);
    }
  }, []);

  /**
   * Exchange Yandex authorization code for a Supabase session.
   */
  const handleYandexCode = async (code: string) => {
    try {
      setLoading('yandex');

      const redirectUri = getRedirectUri();

      // iOS Safari can fail fetch before page is fully loaded after redirect
      if (Platform.OS === 'web') {
        await new Promise<void>((resolve) => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', () => resolve(), { once: true });
          }
        });
      }

      // 1. Call Edge Function to exchange code & create user
      console.log('[YandexAuth] Step 1: Exchanging code via Edge Function...');
      console.log('[YandexAuth] redirect_uri:', redirectUri);
      console.log('[YandexAuth] code (first 10 chars):', code.substring(0, 10));

      let res!: Response;
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          res = await fetch(`${SUPABASE_FUNCTIONS_URL}/yandex-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
          });
          break; // success
        } catch (fetchErr: any) {
          console.warn(`[YandexAuth] Fetch attempt ${attempt}/${MAX_RETRIES} failed:`, fetchErr.message);
          if (attempt === MAX_RETRIES) {
            console.error('[YandexAuth] FETCH FAILED after all retries:', fetchErr);
            throw new Error(`Сетевая ошибка: ${fetchErr.message}`);
          }
          // Wait before retry (1s, 2s)
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }

      console.log('[YandexAuth] Step 1 done, status:', res.status);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[YandexAuth] Edge Function error:', JSON.stringify(err));
        throw new Error(err.error || `Ошибка сервера (${res.status})`);
      }

      const responseData = await res.json();
      const { email, otp, user_metadata } = responseData;
      console.log('[YandexAuth] Step 2: Got OTP for:', email);

      // 2. Verify OTP to establish Supabase session
      const { data: sessionData, error: verifyError } =
        await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        });

      if (verifyError) {
        console.error('[YandexAuth] Step 2 FAILED - verifyOtp:', JSON.stringify(verifyError));
        throw new Error(`Ошибка OTP: ${verifyError.message}`);
      }

      console.log('[YandexAuth] Step 3: Session established for:', sessionData.user?.id);

      // 3. Sync profile with Yandex user data
      if (sessionData.user) {
        try {
          await syncProfile({
            id: sessionData.user.id,
            name: user_metadata?.name || '',
            phone: user_metadata?.phone || undefined,
          });
          console.log('[YandexAuth] Step 4: Profile synced OK');
        } catch (profileErr: any) {
          console.error('[YandexAuth] Step 4 FAILED - syncProfile:', profileErr);
          // Don't block login if profile sync fails
          showToast('Вошли, но профиль не синхронизирован', 'warning');
          return;
        }
      }

      showToast('Вы успешно вошли!', 'success');
    } catch (e: any) {
      console.error('[YandexAuth] FINAL ERROR:', e.message, e);
      showToast(
        e.message || 'Не удалось войти через Яндекс ID',
        'error',
      );
    } finally {
      setLoading(null);
    }
  };

  /**
   * Start Yandex OAuth flow.
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
        window.location.href = authUrl;
        return;
      }

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
      console.error('[YandexAuth] Sign in error:', e);
      showToast(
        e.message || 'Не удалось войти через Яндекс ID',
        'error',
      );
    } finally {
      setLoading(null);
    }
  };

  const handleTinkoffSignIn = () => {
    showToast('Вход через Тинькофф ID будет доступен позже', 'info');
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
          {/* ── Official Yandex ID button ── */}
          <Pressable
            style={({ pressed }) => [
              styles.yandexButton,
              pressed && styles.yandexButtonPressed,
              loading !== null && styles.yandexButtonDisabled,
            ]}
            onPress={handleYandexSignIn}
            disabled={loading !== null}
          >
            {loading === 'yandex' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                {/* Yandex "Я" logo */}
                <View style={styles.yandexLogo}>
                  <Text style={styles.yandexLogoText}>Я</Text>
                </View>
                <Text style={styles.yandexButtonText}>
                  Войти с Яндекс ID
                </Text>
              </>
            )}
          </Pressable>

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

  // ── Official Yandex ID button ──
  yandexButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 20,
    gap: 10,
  },
  yandexButtonPressed: {
    opacity: 0.85,
  },
  yandexButtonDisabled: {
    opacity: 0.6,
  },
  yandexLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FC3F1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yandexLogoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: -1,
  },
  yandexButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
