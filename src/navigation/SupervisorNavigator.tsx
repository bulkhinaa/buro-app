import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { SupervisorHomeScreen } from '../screens/supervisor/SupervisorHomeScreen';
import { SupervisorProjectDetailScreen } from '../screens/supervisor/SupervisorProjectDetailScreen';
import { SupervisorStageDetailScreen } from '../screens/supervisor/SupervisorStageDetailScreen';
import { SupervisorStagePlanScreen } from '../screens/supervisor/SupervisorStagePlanScreen';
import { SupervisorInvitesScreen } from '../screens/supervisor/SupervisorInvitesScreen';
import { ChatScreen } from '../screens/client/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { MyReviewsScreen } from '../screens/profile/MyReviewsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { DocumentsScreen } from '../screens/profile/DocumentsScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { DocumentViewerScreen } from '../screens/profile/DocumentViewerScreen';
import { NotificationsScreen } from '../screens/client/NotificationsScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createStackNavigator();

export function SupervisorNavigator() {
  const { colors } = useTheme();
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
        animation: Platform.OS === 'web' ? 'none' as any : 'slide_from_right' as any,
      }}
    >
      <Stack.Screen
        name="SupervisorHome"
        component={SupervisorHomeScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="SupervisorProjectDetail"
        component={SupervisorProjectDetailScreen}
        options={{ headerTitle: 'Проект' }}
      />

      <Stack.Screen
        name="SupervisorStageDetail"
        component={SupervisorStageDetailScreen}
        options={({ route }: any) => ({
          headerTitle: route?.params?.stageTitle ?? 'Этап',
        })}
      />

      <Stack.Screen
        name="SupervisorStagePlan"
        component={SupervisorStagePlanScreen}
        options={{ headerTitle: 'План этапов' }}
      />

      <Stack.Screen
        name="SupervisorInvites"
        component={SupervisorInvitesScreen}
        options={{ headerTitle: 'Приглашения мастеров' }}
      />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerTitle: 'Чат проекта' }}
      />

      {/* Profile & settings */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false, title: 'Профиль' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: 'Редактировать профиль' }} />
      <Stack.Screen name="NotificationsStack" component={NotificationsScreen} options={{ headerTitle: 'Уведомления' }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ headerTitle: 'Мои отзывы' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ headerTitle: 'Поддержка' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ headerTitle: 'Документы' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerTitle: 'О приложении' }} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} options={{ headerTitle: 'Язык' }} />
      <Stack.Screen
        name="DocumentViewer"
        component={DocumentViewerScreen}
        options={({ route }: any) => ({ headerTitle: route?.params?.title ?? 'Документ' })}
      />
    </Stack.Navigator>
  );
}
