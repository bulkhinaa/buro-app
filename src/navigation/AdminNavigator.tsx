import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminRequestsScreen } from '../screens/admin/AdminRequestsScreen';
import { AdminRequestDetailScreen } from '../screens/admin/AdminRequestDetailScreen';
import { AdminLeadsScreen } from '../screens/admin/AdminLeadsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminUserDetailScreen } from '../screens/admin/AdminUserDetailScreen';
import { AdminTemplatesScreen } from '../screens/admin/AdminTemplatesScreen';
import { AdminPaymentScreen } from '../screens/admin/AdminPaymentScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { MyReviewsScreen } from '../screens/profile/MyReviewsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { DocumentsScreen } from '../screens/profile/DocumentsScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { NotificationsScreen } from '../screens/client/NotificationsScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

export function AdminNavigator() {
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
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
      {/* Admin sub-screens */}
      <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminRequestDetail" component={AdminRequestDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminLeads" component={AdminLeadsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminTemplates" component={AdminTemplatesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminPayment" component={AdminPaymentScreen} options={{ headerShown: false }} />
      {/* Profile & settings */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false, title: 'Профиль' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: 'Редактировать профиль' }} />
      <Stack.Screen name="NotificationsStack" component={NotificationsScreen} options={{ headerTitle: 'Уведомления' }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ headerTitle: 'Мои отзывы' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ headerTitle: 'Поддержка' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ headerTitle: 'Документы' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerTitle: 'О приложении' }} />
    </Stack.Navigator>
  );
}
