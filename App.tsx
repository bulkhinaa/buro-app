import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Toast, ErrorBoundary } from './src/components';
import { registerForPushNotifications, savePushToken } from './src/services/pushNotificationService';
import { useAuthStore } from './src/store/authStore';
import './src/i18n'; // Initialize i18next

function PushNotificationInit() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await savePushToken(user.id, token);
      }
    })();
  }, [user]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <RootNavigator />
          <PushNotificationInit />
          <Toast />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
