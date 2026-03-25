import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator, navigationRef } from './src/navigation/RootNavigator';
import { Toast, ErrorBoundary } from './src/components';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { ThemeProvider } from './src/theme';
import { useThemeStore } from './src/store/themeStore';
import './src/i18n'; // Initialize i18next

function PushNotificationInit() {
  usePushNotifications(navigationRef);
  return null;
}

function ThemedStatusBar() {
  const theme = useThemeStore((s) => s.theme);
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedStatusBar />
            <RootNavigator />
            <PushNotificationInit />
            <Toast />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
