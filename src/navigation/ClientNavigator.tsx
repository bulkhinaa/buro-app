import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
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
import { DocumentViewerScreen } from '../screens/profile/DocumentViewerScreen';
import { MasterWelcomeScreen } from '../screens/master/MasterWelcomeScreen';
import { MasterSetupScreen } from '../screens/master/MasterSetupScreen';
import { MasterMatchScreen } from '../screens/client/MasterMatchScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { useTheme } from '../theme/ThemeContext';
import { useMasterStore } from '../store/masterStore';

// Wrappers adapt onComplete prop for stack navigation
function MasterWelcomeWrapper({ navigation }: any) {
  return <MasterWelcomeScreen onComplete={() => navigation.replace('MasterSetup')} />;
}

function MasterSetupWrapper() {
  const setActiveView = useMasterStore((s) => s.setActiveView);
  // Explicitly switch to master view after setup completes.
  // completeSetup() already sets activeView in the store, but calling setActiveView
  // here ensures RootNavigator re-renders synchronously on the same tick.
  return (
    <MasterSetupScreen
      onComplete={() => {
        setActiveView('master');
      }}
    />
  );
}

const Stack = createStackNavigator();

export function ClientNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
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
      <Stack.Screen
        name="ClientHome"
        component={ClientHomeScreen}
        options={{ headerShown: false, title: 'Бюро ремонтов' }}
      />
      {/* Portfolio */}
      <Stack.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ headerShown: false, title: 'Портфолио' }}
      />
      {/* Object screens */}
      <Stack.Screen
        name="AddObject"
        component={AddObjectScreen}
        options={{ headerShown: false, title: 'Новый объект' }}
      />
      <Stack.Screen
        name="ObjectDetail"
        component={ObjectDetailScreen}
        options={{ headerShown: false, title: 'Объект' }}
      />
      <Stack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{ headerShown: false, title: 'Новый проект' }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ headerShown: false, title: 'Проект' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerTitle: t('nav.chat') }}
      />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={{ headerShown: false, title: 'Портфолио', ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      <Stack.Screen
        name="StageApproval"
        component={StageApprovalScreen}
        options={{ headerShown: false, title: 'Приёмка этапа', ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ headerShown: false, title: 'Отзыв', ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      <Stack.Screen
        name="ProjectComplete"
        component={ProjectCompleteScreen}
        options={{ headerShown: false, title: 'Проект завершён', ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      {/* Profile & settings */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false, title: 'Профиль' }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: t('nav.editProfile') }} />
      <Stack.Screen name="NotificationsStack" component={NotificationsScreen} options={{ headerTitle: t('nav.notifications') }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ headerTitle: t('nav.myReviews') }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ headerTitle: t('nav.support') }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ headerTitle: t('nav.documents') }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerTitle: t('nav.about') }} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} options={{ headerTitle: t('nav.language') }} />
      <Stack.Screen
        name="DocumentViewer"
        component={DocumentViewerScreen}
        options={({ route }: any) => ({ headerTitle: route?.params?.title ?? 'Документ' })}
      />
      <Stack.Screen name="MasterMatch" component={MasterMatchScreen} options={{ headerShown: false, title: 'Подбор мастера' }} />
      {/* Master onboarding (triggered from Profile "Стать мастером") */}
      <Stack.Screen
        name="MasterWelcome"
        component={MasterWelcomeWrapper}
        options={{ headerShown: false, title: 'Стать мастером', ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
      <Stack.Screen
        name="MasterSetup"
        component={MasterSetupWrapper}
        options={{ headerShown: false, title: 'Настройка профиля', ...TransitionPresets.ModalSlideFromBottomIOS, animation: 'slide_from_bottom' as any }}
      />
    </Stack.Navigator>
  );
}
