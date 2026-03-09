import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
import { MasterWelcomeScreen } from '../screens/master/MasterWelcomeScreen';
import { MasterSetupScreen } from '../screens/master/MasterSetupScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { GlassTabBar } from '../components/GlassTabBar';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

// Wrappers adapt onComplete prop for stack navigation
function MasterWelcomeWrapper({ navigation }: any) {
  return <MasterWelcomeScreen onComplete={() => navigation.replace('MasterSetup')} />;
}

function MasterSetupWrapper() {
  // completeSetup() inside MasterSetupScreen sets activeView='master' automatically.
  // RootNavigator re-renders and swaps ClientNavigator → MasterNavigator.
  return <MasterSetupScreen onComplete={() => {}} />;
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ClientTabs() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.is_read).length);

  // Load notifications on mount
  React.useEffect(() => {
    if (user) {
      useNotificationStore.getState().loadNotifications(user.id);
    }
  }, [user]);

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
          tabBarLabel: t('tabs.home'),
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
          tabBarLabel: t('tabs.portfolio'),
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
          tabBarLabel: t('tabs.notifications'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
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
  const { t } = useTranslation();
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
        options={{ headerTitle: t('nav.project') }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerTitle: t('nav.chat') }}
      />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={{ headerShown: false, ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      <Stack.Screen
        name="StageApproval"
        component={StageApprovalScreen}
        options={{ headerShown: false, ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ headerShown: false, ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      <Stack.Screen
        name="ProjectComplete"
        component={ProjectCompleteScreen}
        options={{ headerShown: false, ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      {/* Profile sub-screens */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerTitle: t('nav.editProfile') }}
      />
      <Stack.Screen
        name="NotificationsStack"
        component={NotificationsScreen}
        options={{ headerTitle: t('nav.notifications') }}
      />
      <Stack.Screen
        name="MyReviews"
        component={MyReviewsScreen}
        options={{ headerTitle: t('nav.myReviews') }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ headerTitle: t('nav.support') }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ headerTitle: t('nav.documents') }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerTitle: t('nav.about') }}
      />
      <Stack.Screen
        name="LanguageSelect"
        component={LanguageSelectScreen}
        options={{ headerTitle: t('nav.language') }}
      />
      {/* Master onboarding (triggered from Profile "Стать мастером") */}
      <Stack.Screen
        name="MasterWelcome"
        component={MasterWelcomeWrapper}
        options={{ headerShown: false, ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      <Stack.Screen
        name="MasterSetup"
        component={MasterSetupWrapper}
        options={{ headerShown: false, ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
    </Stack.Navigator>
  );
}
