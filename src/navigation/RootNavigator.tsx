import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { ClientNavigator } from './ClientNavigator';
import { MasterNavigator } from './MasterNavigator';
import { SupervisorNavigator } from './SupervisorNavigator';
import { AdminNavigator } from './AdminNavigator';
import { SplashAnimation } from '../components/SplashAnimation';
import { OnboardingScreen, ONBOARDING_KEY } from '../screens/onboarding/OnboardingScreen';
import { colors } from '../theme';

const navTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.bg,
    card: colors.bg,
    text: colors.heading,
    border: colors.border,
    notification: colors.danger,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

export function RootNavigator() {
  const { isAuthenticated, user, isLoading, initAuth } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const [animationDone, setAnimationDone] = useState(false);
  const [authDone, setAuthDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    initAuth();
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
      setShowOnboarding(seen !== 'true');
    } catch {
      setShowOnboarding(false);
    }
  };

  // Track when auth finishes loading
  useEffect(() => {
    if (!isLoading) {
      setAuthDone(true);
    }
  }, [isLoading]);

  // Hide splash only when BOTH animation and auth are done
  useEffect(() => {
    if (animationDone && authDone) {
      setShowSplash(false);
    }
  }, [animationDone, authDone]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const getNavigator = () => {
    // Show onboarding for first-time users
    if (showOnboarding && !isAuthenticated) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    if (!isAuthenticated || !user) {
      return <AuthNavigator />;
    }

    switch (user.role) {
      case 'admin':
        return <AdminNavigator />;
      case 'supervisor':
        return <SupervisorNavigator />;
      case 'master':
        return <MasterNavigator />;
      case 'client':
      default:
        return <ClientNavigator />;
    }
  };

  return (
    <View style={styles.root}>
      <NavigationContainer theme={navTheme}>
        {authDone && showOnboarding !== null ? (
          getNavigator()
        ) : (
          <View style={styles.placeholder} />
        )}
      </NavigationContainer>

      {showSplash && (
        <SplashAnimation onFinished={() => setAnimationDone(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#120810',
  },
});
