import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Button, CellIndicator, AppDialog } from '../components';
import { colors, spacing, radius, typography } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useMasterStore } from '../store/masterStore';
import { useToastStore } from '../store/toastStore';
import { SPECIALIZATION_MAP } from '../data/specializations';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useLanguageStore, LANGUAGES } from '../store/languageStore';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, logout, deleteAccount } = useAuthStore();
  const { setupComplete, activeView, setActiveView, profile } = useMasterStore();
  const showToast = useToastStore((s) => s.show);
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <ScreenWrapper style={styles.tabBarSpacer}>
      <View style={styles.header}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name || t('profile.nameFallback')}</Text>
        <Text style={styles.role}>{displayRole}</Text>
        {user?.city ? <Text style={styles.city}>{user.city}</Text> : null}
        {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
      </View>

      <View style={styles.glassMenuCard}>
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
        <View style={styles.glassMenuCard}>
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
          <CellIndicator
            variant="card"
            icon={<Ionicons name="pricetag-outline" size={20} color={colors.primary} />}
            name={t('profile.myPricing')}
            showChevron
            onPress={() => navigation.navigate('MasterPricing')}
          />
        </View>
      )}

      {/* Specializations chips */}
      {isMasterView && profile && profile.specializations.length > 0 && (
        <View style={styles.specsSection}>
          <Text style={styles.specsTitle}>{t('profile.specializations')}</Text>
          <View style={styles.specsRow}>
            {profile.specializations.map((specId) => {
              const spec = SPECIALIZATION_MAP[specId];
              if (!spec) return null;
              return (
                <View key={specId} style={styles.specChip}>
                  <Ionicons name={spec.icon as any} size={14} color={colors.primary} />
                  <Text style={styles.specChipText}>{spec.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Become master — client who hasn't set up master profile yet */}
      {isClient && !setupComplete && (
        <Pressable
          style={styles.roleSwitchCard}
          onPress={() => navigation.navigate('MasterWelcome')}
        >
          <View style={styles.roleSwitchContent}>
            <View style={styles.roleSwitchIconCircle}>
              <Ionicons name="hammer-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.roleSwitchTextBlock}>
              <Text style={styles.roleSwitchTitle}>{t('profile.becomeMaster')}</Text>
              <Text style={styles.roleSwitchSubtitle}>
                {t('profile.becomeMasterSubtitle')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      )}

      {/* Switch between client and master views */}
      {isClient && setupComplete && (
        <Pressable
          style={styles.roleSwitchCard}
          onPress={() => setActiveView(activeView === 'master' ? 'client' : 'master')}
        >
          <View style={styles.roleSwitchContent}>
            <View style={styles.roleSwitchIconCircle}>
              <Ionicons
                name={activeView === 'master' ? 'home-outline' : 'hammer-outline'}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.roleSwitchTextBlock}>
              <Text style={styles.roleSwitchTitle}>
                {activeView === 'master' ? t('profile.clientCabinet') : t('profile.masterCabinet')}
              </Text>
              <Text style={styles.roleSwitchSubtitle}>
                {activeView === 'master'
                  ? t('profile.switchToClient')
                  : t('profile.switchToMaster')}
              </Text>
            </View>
          </View>
          <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
        </Pressable>
      )}

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
        <Text style={styles.deleteAccountText}>{t('profile.deleteAccount')}</Text>
      </Pressable>

      <Text style={styles.version}>{t('profile.version')}</Text>
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

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
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
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  name: {
    ...typography.h2,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  role: {
    ...typography.body,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  city: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  phone: {
    ...typography.body,
    color: colors.textLight,
  },
  glassMenuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xs,
    marginBottom: spacing.md,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  roleSwitchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  roleSwitchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleSwitchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 45, 62, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  roleSwitchTextBlock: {
    flex: 1,
  },
  roleSwitchTitle: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  roleSwitchSubtitle: {
    ...typography.small,
    color: colors.textLight,
    marginTop: 2,
  },
  specsSection: {
    marginBottom: spacing.md,
  },
  specsTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.sm,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  specChipText: {
    ...typography.small,
    color: colors.text,
  },
  deleteAccountButton: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  deleteAccountText: {
    ...typography.small,
    color: colors.danger,
  },
  version: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  tabBarSpacer: {
    paddingBottom: 120,
  },
});
