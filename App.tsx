import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator, navigationRef } from './src/navigation/RootNavigator';
import { Toast, ErrorBoundary } from './src/components';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import './src/i18n'; // Initialize i18next

function PushNotificationInit() {
  usePushNotifications(navigationRef);
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
