import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SupervisorHomeScreen } from '../screens/supervisor/SupervisorHomeScreen';
import { ChatScreen } from '../screens/client/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SupervisorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Projects"
        component={SupervisorHomeScreen}
        options={{
          tabBarLabel: 'Проекты',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'construct' : 'construct-outline'} size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function SupervisorNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.heading, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="SupervisorTabs" component={SupervisorTabs} options={{ headerShown: false }} />
      <Stack.Screen name="SupervisorProjectDetail" component={SupervisorHomeScreen} options={{ headerTitle: 'Проект' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerTitle: 'Чат проекта' }} />
    </Stack.Navigator>
  );
}
