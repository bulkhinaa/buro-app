import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, Linking, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, radius } from '../../theme';
import { useTranslation } from 'react-i18next';

// WebView only available on native
const WebView = Platform.OS !== 'web'
  ? require('react-native-webview').WebView
  : null;

interface Props {
  route: { params: { uri: string; title?: string } };
  navigation: { goBack: () => void };
}

export function DocumentViewerScreen({ route, navigation }: Props) {
  const { uri, title } = route.params;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On web: render inline with iframe + toolbar
  if (Platform.OS === 'web') {
    // Start 5s timeout for iframe load failure detection
    useEffect(() => {
      timeoutRef.current = setTimeout(() => {
        if (loading) {
          setIframeError(true);
          setLoading(false);
        }
      }, 5000);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const handleIframeLoad = () => {
      setLoading(false);
      setIframeError(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </Pressable>
          <Text style={[styles.toolbarTitle, { color: colors.heading }]} numberOfLines={1}>
            {title || t('nav.documents')}
          </Text>
          <View style={styles.toolbarSpacer} />
        </View>

        {/* Loading indicator */}
        {loading && !iframeError && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textLight }]}>
              {t('documents.loading')}
            </Text>
          </View>
        )}

        {/* iframe error fallback */}
        {iframeError ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.bg }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.textLight} />
            <Text style={[styles.errorText, { color: colors.textLight }]}>
              {t('documents.loadError')}
            </Text>
            <Pressable
              style={[styles.fallbackButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL(uri)}
            >
              <Text style={[styles.fallbackButtonText, { color: colors.white }]}>
                {t('documents.openInBrowser')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <iframe
            src={uri}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              border: 'none',
              display: loading ? 'none' : 'block',
            } as any}
            onLoad={handleIframeLoad}
            onError={() => {
              setIframeError(true);
              setLoading(false);
            }}
          />
        )}
      </View>
    );
  }

  // On native: use WebView as before
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.bg }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      {WebView && (
        <WebView
          source={{ uri }}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
          allowsInlineMediaPlayback={false}
          javaScriptEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTitle: {
    ...typography.bodyBold,
    flex: 1,
    marginLeft: spacing.xs,
  },
  toolbarSpacer: {
    width: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
  },
  fallbackButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  fallbackButtonText: {
    ...typography.bodyBold,
  },
  webview: {
    flex: 1,
  },
});
