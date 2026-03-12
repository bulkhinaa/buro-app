import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MasterHomeScreen } from '../screens/master/MasterHomeScreen';
import { MasterTaskDetailScreen } from '../screens/master/MasterTaskDetailScreen';
import { MasterPortfolioScreen } from '../screens/master/MasterPortfolioScreen';
import { MasterPortfolioEditScreen } from '../screens/master/MasterPortfolioEditScreen';
import { MasterPricingScreen } from '../screens/master/MasterPricingScreen';
import { JumpFinanceScreen } from '../screens/master/JumpFinanceScreen';
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
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MasterTabs() {
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
        sceneContainerStyle: { backgroundColor: colors.bgGradientEnd },
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={MasterHomeScreen}
        options={{
          tabBarLabel: t('tabs.tasks'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: t('tabs.notifications'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={22} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={MasterPortfolioScreen}
        options={{
          tabBarLabel: t('tabs.portfolio'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'images' : 'images-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function MasterNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        ...(Platform.OS !== 'web' ? TransitionPresets.SlideFromRightIOS : {}),
        headerStyle: { backgroundColor: colors.bgGradientStart, elevation: 0, shadowOpacity: 0 },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.heading, fontWeight: '700' },
        cardStyle: { backgroundColor: colors.bgGradientEnd },
        gestureEnabled: Platform.OS !== 'web',
        animationEnabled: Platform.OS !== 'web',
        animation: Platform.OS === 'web' ? 'none' as any : 'slide_from_right' as any,
      }}
    >
      <Stack.Screen name="MasterTabs" component={MasterTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="MasterTaskDetail"
        component={MasterTaskDetailScreen}
        options={{
          headerShown: false,
          ...TransitionPresets.ModalSlideFromBottomIOS,
          animation: 'slide_from_bottom' as any,
        }}
      />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerTitle: t('nav.chatSupervisor') }} />
      {/* Portfolio — has its own header */}
      <Stack.Screen name="MasterPortfolioEdit" component={MasterPortfolioEditScreen} options={{ headerShown: false }} />
      {/* Pricing — has its own header */}
      <Stack.Screen name="MasterPricing" component={MasterPricingScreen} options={{ headerShown: false }} />
      {/* Verification — uses ScreenWrapper, needs stack header */}
      <Stack.Screen name="JumpFinance" component={JumpFinanceScreen} options={{ headerTitle: t('nav.verification') }} />
      {/* Profile sub-screens */}
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: t('nav.editProfile') }} />
      <Stack.Screen name="NotificationsStack" component={NotificationsScreen} options={{ headerTitle: t('nav.notifications') }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ headerTitle: t('nav.myReviews') }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ headerTitle: t('nav.support') }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ headerTitle: t('nav.documents') }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerTitle: t('nav.about') }} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} options={{ headerTitle: t('nav.language') }} />
    </Stack.Navigator>
  );
}
