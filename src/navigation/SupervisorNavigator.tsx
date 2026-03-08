import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SupervisorHomeScreen } from '../screens/supervisor/SupervisorHomeScreen';
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
const Stack = createNativeStackNavigator();

function SupervisorTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
        headerStyle: { backgroundColor: colors.bgGradientStart },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.heading, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bgGradientEnd },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="SupervisorTabs" component={SupervisorTabs} options={{ headerShown: false }} />
      <Stack.Screen name="SupervisorProjectDetail" component={SupervisorHomeScreen} options={{ headerTitle: 'Проект' }} />
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
