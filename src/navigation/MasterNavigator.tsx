import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MasterHomeScreen } from '../screens/master/MasterHomeScreen';
import { MasterTaskDetailScreen } from '../screens/master/MasterTaskDetailScreen';
import { MasterPortfolioScreen } from '../screens/master/MasterPortfolioScreen';
import { MasterPortfolioEditScreen } from '../screens/master/MasterPortfolioEditScreen';
import { MasterPricingScreen } from '../screens/master/MasterPricingScreen';
import { JumpFinanceScreen } from '../screens/master/JumpFinanceScreen';
import { MasterScheduleScreen } from '../screens/master/MasterScheduleScreen';
import { MasterScheduleTemplateScreen } from '../screens/master/MasterScheduleTemplateScreen';
import { MasterVacationsScreen } from '../screens/master/MasterVacationsScreen';
import { MasterOfferDetailScreen } from '../screens/master/MasterOfferDetailScreen';
import { EditSpecializationsScreen } from '../screens/master/EditSpecializationsScreen';
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
import { colors } from '../theme';

const Stack = createStackNavigator();

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
      <Stack.Screen name="MasterHome" component={MasterHomeScreen} options={{ headerShown: false, title: 'Бюро ремонтов — Мастер' }} />
      <Stack.Screen
        name="MasterTaskDetail"
        component={MasterTaskDetailScreen}
        options={{
          headerShown: false,
          title: 'Задача',
          ...TransitionPresets.ModalSlideFromBottomIOS,
          animation: 'slide_from_bottom' as any,
        }}
      />
      {/* Schedule */}
      <Stack.Screen name="MasterSchedule" component={MasterScheduleScreen} options={{ headerShown: false, title: 'График' }} />
      <Stack.Screen name="MasterScheduleTemplate" component={MasterScheduleTemplateScreen} options={{ headerShown: false, title: 'Шаблон графика' }} />
      <Stack.Screen name="MasterVacations" component={MasterVacationsScreen} options={{ headerShown: false, title: 'Отпуска' }} />
      <Stack.Screen name="MasterOfferDetail" component={MasterOfferDetailScreen} options={{ headerShown: false, title: 'Предложение' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerTitle: t('nav.chatSupervisor') }} />
      {/* Portfolio */}
      <Stack.Screen name="MasterPortfolio" component={MasterPortfolioScreen} options={{ headerShown: false, title: 'Портфолио' }} />
      <Stack.Screen name="MasterPortfolioEdit" component={MasterPortfolioEditScreen} options={{ headerShown: false, title: 'Портфолио' }} />
      {/* Pricing */}
      <Stack.Screen name="MasterPricing" component={MasterPricingScreen} options={{ headerShown: false, title: 'Расценки' }} />
      {/* Verification */}
      <Stack.Screen name="JumpFinance" component={JumpFinanceScreen} options={{ headerTitle: t('nav.verification') }} />
      {/* Specializations */}
      <Stack.Screen name="EditSpecializations" component={EditSpecializationsScreen} options={{ headerShown: false, title: 'Специализации' }} />
      {/* Profile & settings */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false, title: 'Профиль' }} />
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
    </Stack.Navigator>
  );
}
