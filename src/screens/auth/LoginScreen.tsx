import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const [loading, setLoading] = useState<'yandex' | 'tinkoff' | null>(null);
  const { setUser, syncProfile } = useAuthStore();

  const handleYandexSignIn = async () => {
    try {
      setLoading('yandex');
      // Yandex ID OAuth 2.0 via Supabase custom provider or expo-auth-session
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'yandex' as any,
        options: {
          redirectTo: 'buroremontov://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'buroremontov://auth/callback',
        );

        if (result.type === 'success' && result.url) {
          const params = new URL(result.url);
          const accessToken = params.hash
            ?.substring(1)
            .split('&')
            .find((p) => p.startsWith('access_token='))
            ?.split('=')[1];
          const refreshToken = params.hash
            ?.substring(1)
            .split('&')
            .find((p) => p.startsWith('refresh_token='))
            ?.split('=')[1];

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) throw sessionError;

            const user = sessionData.user;
            await syncProfile({
              id: user?.id || '',
              name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
              phone: user?.user_metadata?.phone || user?.phone || undefined,
            });
          }
        }
      }
    } catch (e: any) {
      Alert.alert('Ошибка', 'Не удалось войти через Яндекс ID');
    } finally {
      setLoading(null);
    }
  };

  const handleTinkoffSignIn = async () => {
    try {
      setLoading('tinkoff');
      // Tinkoff ID OAuth 2.0 via Supabase custom provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'tinkoff' as any,
        options: {
          redirectTo: 'buroremontov://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'buroremontov://auth/callback',
        );

        if (result.type === 'success' && result.url) {
          const params = new URL(result.url);
          const accessToken = params.hash
            ?.substring(1)
            .split('&')
            .find((p) => p.startsWith('access_token='))
            ?.split('=')[1];
          const refreshToken = params.hash
            ?.substring(1)
            .split('&')
            .find((p) => p.startsWith('refresh_token='))
            ?.split('=')[1];

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) throw sessionError;

            const user = sessionData.user;
            await syncProfile({
              id: user?.id || '',
              name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
              phone: user?.user_metadata?.phone || user?.phone || undefined,
            });
          }
        }
      }
    } catch (e: any) {
      Alert.alert('Ошибка', 'Не удалось войти через Тинькофф ID');
    } finally {
      setLoading(null);
    }
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
              <Ionicons name="logo-yahoo" size={20} color={colors.white} />
            }
          />

          <Button
            title={loading === 'tinkoff' ? 'Входим...' : 'Войти через Тинькофф ID'}
            onPress={handleTinkoffSignIn}
            disabled={loading !== null}
            loading={loading === 'tinkoff'}
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
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  // logoEmoji style removed — now using Ionicons
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
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  devButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
