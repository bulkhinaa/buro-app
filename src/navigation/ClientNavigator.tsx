import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import { AddObjectScreen } from '../screens/client/AddObjectScreen';
import { ObjectDetailScreen } from '../screens/client/ObjectDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { MyReviewsScreen } from '../screens/profile/MyReviewsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { DocumentsScreen } from '../screens/profile/DocumentsScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { GlassTabBar } from '../components/GlassTabBar';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClientTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
        headerStyle: { backgroundColor: colors.bgGradientStart },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.heading, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bgGradientEnd },
        headerShadowVisible: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="ClientTabs"
        component={ClientTabs}
        options={{ headerShown: false }}
      />
      {/* Object screens */}
      <Stack.Screen
        name="AddObject"
        component={AddObjectScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ObjectDetail"
        component={ObjectDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{ headerShown: false }}
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
        options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="StageApproval"
        component={StageApprovalScreen}
        options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ProjectComplete"
        component={ProjectCompleteScreen}
        options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
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
    </Stack.Navigator>
  );
}
