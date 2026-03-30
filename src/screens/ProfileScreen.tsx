import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button, CellIndicator, AppDialog } from '../components';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useMasterStore } from '../store/masterStore';
import { useToastStore } from '../store/toastStore';
import { useThemeStore } from '../store/themeStore';
import { SPECIALIZATION_MAP } from '../data/specializations';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useLanguageStore, LANGUAGES } from '../store/languageStore';

// MVP: JumpFinance hidden, restore post-MVP
// Jump Finance Edge Function is not deployed yet (missing JUMP_FINANCE_CLIENT_KEY secret).
// Set to true once the function is deployed and tested.
const JUMP_FINANCE_ENABLED = false;

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, logout, deleteAccount } = useAuthStore();
  const { setupComplete, activeView, setActiveView, profile } = useMasterStore();
  const showToast = useToastStore((s) => s.show);
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { isDark, colors, glass } = useTheme();
  const { toggleTheme } = useThemeStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const styles = useProfileStyles(colors, glass, isDark);

  const roleKeys: Record<string, string> = {
    client: 'profile.roleClient',
    master: 'profile.roleMaster',
    supervisor: 'profile.roleSupervisor',
    admin: 'profile.roleAdmin',
  };

  // For dual-role users, show active role
  const displayRole = (() => {
    if (user?.role === 'client' && setupComplete) {
      return activeView === 'master' ? t('profile.roleMaster') : t('profile.roleClient');
    }
    return t(roleKeys[user?.role || 'client']);
  })();

  // Current language display name
  const currentLangName = LANGUAGES.find((l) => l.code === language)?.name || 'Русский';

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const isClient = user?.role === 'client';
  const isMasterView = (isClient && setupComplete && activeView === 'master') || user?.role === 'master';

  // Glass menu card style (theme-aware)
  const glassMenuCardStyle = {
    backgroundColor: isDark ? 'rgba(22, 22, 31, 0.7)' : 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xs,
    marginBottom: spacing.md,
    shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  };

  const specChipStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    backgroundColor: isDark ? 'rgba(22, 22, 31, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.85)',
  };

  const roleCardStyle = (isActive: boolean) => ({
    flex: 1,
    alignItems: 'center' as const,
    backgroundColor: isActive
      ? (isDark ? 'rgba(232, 87, 122, 0.1)' : 'rgba(123, 45, 62, 0.06)')
      : (isDark ? 'rgba(22, 22, 31, 0.7)' : 'rgba(255, 255, 255, 0.6)'),
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: isActive ? colors.primary : (isDark ? colors.border : 'rgba(255, 255, 255, 0.85)'),
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  });

  return (
    <ScreenWrapper style={styles.tabBarSpacer}>
      {/* Back button */}
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Back"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </Pressable>

      <View style={styles.header}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={[styles.avatarImage, { borderColor: colors.primary }]} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.white }]}>
              {user?.name ? user.name[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.heading }]}>{user?.name || t('profile.nameFallback')}</Text>
        <Text style={[styles.role, { color: colors.gold }]}>{displayRole}</Text>
        {user?.city ? <Text style={[styles.city, { color: colors.textLight }]}>{user.city}</Text> : null}
        {user?.phone ? <Text style={[styles.phone, { color: colors.textLight }]}>{user.phone}</Text> : null}
      </View>

      <View style={glassMenuCardStyle}>
        <CellIndicator
          variant="card"
          icon={<Ionicons name="create-outline" size={20} color={colors.primary} />}
          name={t('profile.menuEdit')}
          showChevron
          onPress={() => navigation.navigate('EditProfile')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="notifications-outline" size={20} color={colors.primary} />}
          name={t('profile.menuNotifications')}
          showChevron
          onPress={() => navigation.navigate('NotificationsStack')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="clipboard-outline" size={20} color={colors.primary} />}
          name={t('profile.menuReviews')}
          showChevron
          onPress={() => navigation.navigate('MyReviews')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="language-outline" size={20} color={colors.primary} />}
          name={t('profile.menuLanguage')}
          value={currentLangName}
          showChevron
          onPress={() => navigation.navigate('LanguageSelect')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.primary} />}
          name={t('profile.menuTheme')}
          rightElement={
            <Switch
              value={isDark}
              onValueChange={() => toggleTheme()}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDark ? colors.primary : colors.textLight}
            />
          }
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="chatbubble-outline" size={20} color={colors.primary} />}
          name={t('profile.menuSupport')}
          showChevron
          onPress={() => navigation.navigate('Support')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="document-outline" size={20} color={colors.primary} />}
          name={t('profile.menuDocuments')}
          showChevron
          onPress={() => navigation.navigate('Documents')}
        />
        <CellIndicator
          variant="card"
          icon={<Ionicons name="information-circle-outline" size={20} color={colors.primary} />}
          name={t('profile.menuAbout')}
          showChevron
          onPress={() => navigation.navigate('About')}
        />
      </View>

      {/* Master sections — verification, specializations, pricing */}
      {isMasterView && profile && (
        <View style={glassMenuCardStyle}>
          {/* Verification cell — hidden until Jump Finance is deployed */}
          {JUMP_FINANCE_ENABLED && (
            <CellIndicator
              variant="card"
              icon={
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={
                    profile.verification_status === 'approved'
                      ? colors.success
                      : profile.verification_status === 'pending'
                        ? colors.warning
                        : colors.primary
                  }
                />
              }
              name={
                profile.verification_status === 'approved'
                  ? t('profile.verified')
                  : profile.verification_status === 'pending'
                    ? t('profile.verificationPending')
                    : t('profile.startVerification')
              }
              showChevron
              onPress={() => navigation.navigate('JumpFinance')}
            />
          )}
          <CellIndicator
            variant="card"
            icon={<Ionicons name="pricetag-outline" size={20} color={colors.primary} />}
            name={t('profile.myPricing')}
            showChevron
            onPress={() => navigation.navigate('MasterPricing')}
          />
          <CellIndicator
            variant="card"
            icon={<Ionicons name="calendar-outline" size={20} color={colors.primary} />}
            name="График работы"
            showChevron
            onPress={() => navigation.navigate('MasterSchedule')}
          />
          <CellIndicator
            variant="card"
            icon={<Ionicons name="images-outline" size={20} color={colors.primary} />}
            name="Моё портфолио"
            showChevron
            onPress={() => navigation.navigate('MasterPortfolio')}
          />
        </View>
      )}

      {/* Specializations chips */}
      {isMasterView && profile && profile.specializations.length > 0 && (
        <View style={styles.specsSection}>
          <Text style={[styles.specsTitle, { color: colors.heading }]}>{t('profile.specializations')}</Text>
          <View style={styles.specsRow}>
            {profile.specializations.map((specId) => {
              const spec = SPECIALIZATION_MAP[specId];
              if (!spec) return null;
              return (
                <View key={specId} style={specChipStyle}>
                  <Ionicons name={spec.icon as any} size={14} color={colors.primary} />
                  <Text style={[styles.specChipText, { color: colors.text }]}>{spec.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Multi-role switcher */}
      <Text style={[styles.sectionTitle, { color: colors.heading }]}>{t('profile.myCabinets')}</Text>
      <View style={styles.rolesGrid}>
        {/* Client role — always available */}
        <RoleCard
          icon="home-outline"
          activeIcon="home"
          label={t('profile.roleClient')}
          isActive={activeView === 'client'}
          colors={colors}
          isDark={isDark}
          roleCardStyle={roleCardStyle}
          onPress={() => {
            setActiveView('client');
            showToast('Кабинет клиента', 'info');
          }}
        />

        {/* Master role */}
        {setupComplete ? (
          <RoleCard
            icon="hammer-outline"
            activeIcon="hammer"
            label={t('profile.roleMaster')}
            isActive={activeView === 'master'}
            colors={colors}
            isDark={isDark}
            roleCardStyle={roleCardStyle}
            onPress={() => {
              setActiveView('master');
              showToast('Кабинет мастера', 'info');
            }}
          />
        ) : (
          <RoleCard
            icon="add-circle-outline"
            activeIcon="add-circle"
            label={t('profile.becomeMaster')}
            isActive={false}
            isAdd
            colors={colors}
            isDark={isDark}
            roleCardStyle={roleCardStyle}
            onPress={() => navigation.navigate('MasterWelcome')}
          />
        )}

        {/* Supervisor role — available for supervisors or any user with role access */}
        {(user?.role === 'supervisor' || user?.role === 'admin') && (
          <RoleCard
            icon="eye-outline"
            activeIcon="eye"
            label={t('profile.roleSupervisor')}
            isActive={activeView === 'supervisor'}
            colors={colors}
            isDark={isDark}
            roleCardStyle={roleCardStyle}
            onPress={() => {
              setActiveView('supervisor');
              showToast('Кабинет супервайзера', 'info');
            }}
          />
        )}
      </View>

      <Button
        title={t('profile.logoutButton')}
        onPress={handleLogout}
        variant="outline"
        fullWidth
        style={{ marginTop: spacing.xxl }}
      />

      <Pressable
        style={styles.deleteAccountButton}
        onPress={() => setShowDeleteDialog(true)}
      >
        <Text style={[styles.deleteAccountText, { color: colors.danger }]}>{t('profile.deleteAccount')}</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.textLight }]}>{t('profile.version')}</Text>
      <AppDialog
        visible={showLogoutDialog}
        title={t('profile.logoutTitle')}
        message={t('profile.logoutMessage')}
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
          { text: t('profile.logoutConfirm'), style: 'destructive', onPress: logout },
        ]}
        onClose={() => setShowLogoutDialog(false)}
      />

      <AppDialog
        visible={showDeleteDialog}
        title={t('profile.deleteAccountTitle')}
        message={t('profile.deleteAccountMessage')}
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
          {
            text: deleting ? '...' : t('profile.deleteAccountConfirm'),
            style: 'destructive',
            onPress: async () => {
              setDeleting(true);
              try {
                await deleteAccount();
                showToast(t('profile.deleteAccountSuccess'), 'success');
              } catch {
                showToast(t('profile.deleteAccountError'), 'error');
              } finally {
                setDeleting(false);
                setShowDeleteDialog(false);
              }
            },
          },
        ]}
        onClose={() => setShowDeleteDialog(false)}
      />
    </ScreenWrapper>
  );
}

interface RoleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive: boolean;
  isAdd?: boolean;
  colors: any;
  isDark: boolean;
  roleCardStyle: (isActive: boolean) => any;
  onPress: () => void;
}

function RoleCard({
  icon,
  activeIcon,
  label,
  isActive,
  isAdd,
  colors,
  isDark,
  roleCardStyle,
  onPress,
}: RoleCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        roleCardStyle(isActive),
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <View style={[
        profileStaticStyles.roleIconCircle,
        isActive && { backgroundColor: colors.primary },
        !isActive && !isAdd && { backgroundColor: isDark ? 'rgba(232, 87, 122, 0.1)' : 'rgba(123, 45, 62, 0.08)' },
        isAdd && { backgroundColor: isDark ? 'rgba(240, 201, 93, 0.15)' : 'rgba(197, 165, 90, 0.12)' },
      ]}>
        <Ionicons
          name={isActive ? activeIcon : icon}
          size={24}
          color={isActive ? colors.white : isAdd ? colors.gold : colors.primary}
        />
      </View>
      <Text style={[
        profileStaticStyles.roleLabel,
        { color: colors.text },
        isActive && { color: colors.primary, fontWeight: '600' },
      ]}>
        {label}
      </Text>
      {isActive && (
        <View style={[profileStaticStyles.roleActiveDot, { backgroundColor: colors.primary }]} />
      )}
    </Pressable>
  );
}

// Static styles that don't depend on theme
const profileStaticStyles = StyleSheet.create({
  roleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  roleLabel: {
    ...typography.small,
    textAlign: 'center',
  },
  roleActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: spacing.xs,
  },
});

import type { ThemeColors } from '../theme/colors';
import type { GlassTokens } from '../theme/glass';

function useProfileStyles(colors: ThemeColors, glass: GlassTokens, isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    backButton: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
      padding: spacing.xs,
    },
    header: {
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.xxl,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: spacing.lg,
      borderWidth: 2,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '700',
    },
    name: {
      ...typography.h2,
      marginBottom: spacing.xs,
    },
    role: {
      ...typography.body,
      marginBottom: spacing.xs,
    },
    city: {
      ...typography.small,
      marginBottom: spacing.xs,
    },
    phone: {
      ...typography.body,
    },
    specsSection: {
      marginBottom: spacing.md,
    },
    specsTitle: {
      ...typography.bodyBold,
      marginBottom: spacing.sm,
    },
    specsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    specChipText: {
      ...typography.small,
    },
    deleteAccountButton: {
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    deleteAccountText: {
      ...typography.small,
    },
    version: {
      ...typography.caption,
      textAlign: 'center',
      marginTop: spacing.xxl,
      marginBottom: spacing.xxl,
    },
    sectionTitle: {
      ...typography.bodyBold,
      marginBottom: spacing.md,
    },
    rolesGrid: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    tabBarSpacer: {
      paddingBottom: 24,
    },
  }), [colors, glass, isDark]);
}
