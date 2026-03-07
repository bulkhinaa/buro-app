import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientHomeScreen } from '../screens/client/ClientHomeScreen';
import { ProjectDetailScreen } from '../screens/client/ProjectDetailScreen';
import { CreateProjectScreen } from '../screens/client/CreateProjectScreen';
import { ChatScreen } from '../screens/client/ChatScreen';
import { PortfolioScreen } from '../screens/client/PortfolioScreen';
import { CaseDetailScreen } from '../screens/client/CaseDetailScreen';
import { StageApprovalScreen } from '../screens/client/StageApprovalScreen';
import { ReviewScreen } from '../screens/client/ReviewScreen';
import { ProjectCompleteScreen } from '../screens/client/ProjectCompleteScreen';
import { NotificationsScreen } from '../screens/client/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClientTabs() {
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
        name="Home"
        component={ClientHomeScreen}
        options={{
          tabBarLabel: 'Главная',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Портфолио',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'images' : 'images-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Уведомления',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function ClientNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.heading, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ClientTabs"
        component={ClientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{ headerTitle: 'Новый проект' }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ headerTitle: 'Проект' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerTitle: 'Чат проекта' }}
      />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StageApproval"
        component={StageApprovalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProjectComplete"
        component={ProjectCompleteScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
