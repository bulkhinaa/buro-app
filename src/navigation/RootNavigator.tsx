import React, { useEffect, useState, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useMasterStore } from '../store/masterStore';
import { useLanguageStore } from '../store/languageStore';
import { AuthNavigator } from './AuthNavigator';
import { ClientNavigator } from './ClientNavigator';
import { MasterNavigator } from './MasterNavigator';
import { SupervisorNavigator } from './SupervisorNavigator';
import { AdminNavigator } from './AdminNavigator';
import { SplashAnimation } from '../components/SplashAnimation';
import { OnboardingScreen, ONBOARDING_KEY } from '../screens/onboarding/OnboardingScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { MasterWelcomeScreen } from '../screens/master/MasterWelcomeScreen';
import { MasterSetupScreen } from '../screens/master/MasterSetupScreen';
import { colors } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const { welcomeSeen, setupComplete, activeView, init: initMaster } = useMasterStore();
  const { hasChosenLanguage, isLoaded: langLoaded, init: initLanguage } = useLanguageStore();
  const [showSplash, setShowSplash] = useState(true);
  const [animationDone, setAnimationDone] = useState(false);
  const [authDone, setAuthDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [showLanguageSelect, setShowLanguageSelect] = useState<boolean | null>(null);
  const [masterInitDone, setMasterInitDone] = useState(false);
  const [masterWelcomeDone, setMasterWelcomeDone] = useState(false);
  const [masterSetupDone, setMasterSetupDone] = useState(false);

  useEffect(() => {
    initAuth();
    initLanguage();
    checkOnboarding();
  }, []);

  // Once language store is loaded, determine if language select should show
  useEffect(() => {
    if (langLoaded) {
      setShowLanguageSelect(!hasChosenLanguage);
    }
  }, [langLoaded, hasChosenLanguage]);

  // Initialize master store for all authenticated users (dual-role support)
  useEffect(() => {
    if (isAuthenticated && user) {
      initMaster(user.id).then(() => setMasterInitDone(true));
    } else {
      setMasterInitDone(true);
    }
  }, [isAuthenticated, user]);

  // Sync store values into local state
  useEffect(() => {
    if (masterInitDone) {
      setMasterWelcomeDone(welcomeSeen);
      setMasterSetupDone(setupComplete);
    }
  }, [masterInitDone, welcomeSeen, setupComplete]);

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

  // ── Fade transition when navigator swaps ──
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevNavKey = useRef('');

  const navKey = (() => {
    if (!authDone || showOnboarding === null || showLanguageSelect === null) return 'loading';
    if (showLanguageSelect && !isAuthenticated) return 'language-select';
    if (showOnboarding && !isAuthenticated) return 'onboarding';
    if (!isAuthenticated || !user) return 'auth';
    if (!masterInitDone) return 'master-loading';
    if (user.role === 'master') {
      if (!masterWelcomeDone) return 'master-welcome';
      if (!masterSetupDone) return 'master-setup';
      return 'master';
    }
    if (user.role === 'client' && setupComplete && activeView === 'master') return 'master-view';
    return user.role;
  })();

  useEffect(() => {
    if (prevNavKey.current && prevNavKey.current !== navKey) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
    prevNavKey.current = navKey;
  }, [navKey]);

  const handleLanguageComplete = () => {
    setShowLanguageSelect(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const getNavigator = () => {
    // Show language selection for first-time users (before onboarding)
    if (showLanguageSelect && !isAuthenticated) {
      return <LanguageSelectScreen onComplete={handleLanguageComplete} />;
    }

    // Show onboarding for first-time users
    if (showOnboarding && !isAuthenticated) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    if (!isAuthenticated || !user) {
      return <AuthNavigator />;
    }

    // Wait for master store to load
    if (!masterInitDone) {
      return <View style={styles.placeholder} />;
    }

    // Direct master role: welcome → setup → navigator
    if (user.role === 'master') {
      if (!masterWelcomeDone) {
        return <MasterWelcomeScreen onComplete={() => setMasterWelcomeDone(true)} />;
      }
      if (!masterSetupDone) {
        return <MasterSetupScreen onComplete={() => setMasterSetupDone(true)} />;
      }
      return <MasterNavigator />;
    }

    // Dual-role: client who completed master setup and switched to master view
    if (user.role === 'client' && setupComplete && activeView === 'master') {
      return <MasterNavigator />;
    }

    switch (user.role) {
      case 'admin':
        return <AdminNavigator />;
      case 'supervisor':
        return <SupervisorNavigator />;
      case 'client':
      default:
        return <ClientNavigator />;
    }
  };

  return (
    <View style={styles.root}>
      <NavigationContainer theme={navTheme}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          {authDone && showOnboarding !== null && showLanguageSelect !== null ? (
            getNavigator()
          ) : (
            <View style={styles.placeholder} />
          )}
        </Animated.View>
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
  animatedContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#120810',
  },
});
