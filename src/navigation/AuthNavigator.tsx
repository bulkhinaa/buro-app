import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...(Platform.OS !== 'web' ? TransitionPresets.SlideFromRightIOS : {}),
        headerShown: false,
        cardStyle: { backgroundColor: colors.bg },
        gestureEnabled: Platform.OS !== 'web',
        animationEnabled: Platform.OS !== 'web',
        animation: Platform.OS === 'web' ? 'none' as any : 'slide_from_right' as any,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
