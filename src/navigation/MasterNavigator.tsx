import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MasterHomeScreen } from '../screens/master/MasterHomeScreen';
import { ChatScreen } from '../screens/client/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { MyReviewsScreen } from '../screens/profile/MyReviewsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { DocumentsScreen } from '../screens/profile/DocumentsScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { NotificationsScreen } from '../screens/client/NotificationsScreen';
import { GlassTabBar } from '../components/GlassTabBar';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MasterTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={MasterHomeScreen}
        options={{
          tabBarLabel: 'Задачи',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />,
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

export function MasterNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...TransitionPresets.SlideFromRightIOS,
        headerStyle: { backgroundColor: colors.bgGradientStart, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.heading, fontWeight: '700' },
        cardStyle: { backgroundColor: colors.bgGradientEnd },
        gestureEnabled: true,
        animation: 'slide_from_right' as any,
      }}
    >
      <Stack.Screen name="MasterTabs" component={MasterTabs} options={{ headerShown: false }} />
      <Stack.Screen name="MasterTaskDetail" component={MasterHomeScreen} options={{ headerTitle: 'Задача' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerTitle: 'Чат проекта' }} />
      {/* Profile sub-screens */}
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: 'Редактировать профиль' }} />
      <Stack.Screen name="NotificationsStack" component={NotificationsScreen} options={{ headerTitle: 'Уведомления' }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ headerTitle: 'Мои отзывы' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ headerTitle: 'Поддержка' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ headerTitle: 'Документы' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerTitle: 'О приложении' }} />
    </Stack.Navigator>
  );
}
