import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SupervisorHomeScreen } from '../screens/supervisor/SupervisorHomeScreen';
import { SupervisorProjectDetailScreen } from '../screens/supervisor/SupervisorProjectDetailScreen';
import { SupervisorStageDetailScreen } from '../screens/supervisor/SupervisorStageDetailScreen';
import { SupervisorStagePlanScreen } from '../screens/supervisor/SupervisorStagePlanScreen';
import { ChatScreen } from '../screens/client/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { MyReviewsScreen } from '../screens/profile/MyReviewsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { DocumentsScreen } from '../screens/profile/DocumentsScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { NotificationsScreen } from '../screens/client/NotificationsScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { GlassTabBar } from '../components/GlassTabBar';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'construct' : 'construct-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function SupervisorNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...(Platform.OS !== 'web' ? TransitionPresets.SlideFromRightIOS : {}),
        headerStyle: {
          backgroundColor: colors.bgGradientStart,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.heading, fontWeight: '700' },
        cardStyle: { backgroundColor: colors.bgGradientEnd },
        gestureEnabled: Platform.OS !== 'web',
        animationEnabled: Platform.OS !== 'web',
        animation: Platform.OS === 'web' ? 'none' as any : 'slide_from_right' as any,
      }}
    >
      <Stack.Screen
        name="SupervisorTabs"
        component={SupervisorTabs}
        options={{ headerShown: false }}
      />

      {/* Project detail — replaces broken SupervisorHomeScreen stub */}
      <Stack.Screen
        name="SupervisorProjectDetail"
        component={SupervisorProjectDetailScreen}
        options={{ headerTitle: 'Проект' }}
      />

      {/* Stage detail for review */}
      <Stack.Screen
        name="SupervisorStageDetail"
        component={SupervisorStageDetailScreen}
        options={({ route }: any) => ({
          headerTitle: route?.params?.stageTitle ?? 'Этап',
        })}
      />

      {/* Stage plan */}
      <Stack.Screen
        name="SupervisorStagePlan"
        component={SupervisorStagePlanScreen}
        options={{ headerTitle: 'План этапов' }}
      />

      {/* Chat */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerTitle: 'Чат проекта' }}
      />

      {/* Profile sub-screens */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerTitle: 'Редактировать профиль' }}
      />
      <Stack.Screen
        name="NotificationsStack"
        component={NotificationsScreen}
        options={{ headerTitle: 'Уведомления' }}
      />
      <Stack.Screen
        name="MyReviews"
        component={MyReviewsScreen}
        options={{ headerTitle: 'Мои отзывы' }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ headerTitle: 'Поддержка' }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ headerTitle: 'Документы' }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerTitle: 'О приложении' }}
      />
      <Stack.Screen
        name="LanguageSelect"
        component={LanguageSelectScreen}
        options={{ headerTitle: 'Язык' }}
      />
    </Stack.Navigator>
  );
}
