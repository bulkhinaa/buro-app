import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...TransitionPresets.SlideFromRightIOS,
        headerShown: false,
        cardStyle: { backgroundColor: colors.bg },
        gestureEnabled: true,
        animation: 'slide_from_right' as any,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
