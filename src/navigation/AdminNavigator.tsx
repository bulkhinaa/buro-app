import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
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
        name="Dashboard"
        component={AdminHomeScreen}
        options={{
          tabBarLabel: 'Заявки',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />,
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

export function AdminNavigator() {
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
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
