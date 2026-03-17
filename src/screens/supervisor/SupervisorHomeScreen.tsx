import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Card,
  StatusBadge,
  Button,
  AppDialog,
  ProgressBar,
} from '../../components';
import type { DialogButton } from '../../components';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Project, REPAIR_TYPE_LABELS } from '../../types';
import {
  fetchSupervisorAllProjects,
  supervisorAcceptProject,
  supervisorDeclineProject,
} from '../../services/projectService';

// ─── Extended project type (with enriched fields) ─────────────────────────────

type ProjectItem = Project & {
  clientName: string;
  stagesTotal: number;
  stagesDone: number;
  pendingReview: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_OFFERED: ProjectItem[] = [
  {
    id: 'sp-3',
    client_id: '5',
    supervisor_id: 'dev-sv-1',
    title: 'Ремонт 3-комнатной квартиры',
    address: 'г Москва, ул. Садовая, д 22, кв 105',
    area_sqm: 78,
    repair_type: 'premium',
    status: 'planning',
    created_at: '2026-03-20',
    updated_at: '2026-03-22',
    clientName: 'Сидоров К.М.',
    stagesTotal: 14,
    stagesDone: 0,
    pendingReview: 0,
  },
];

const MOCK_ACTIVE: ProjectItem[] = [
  {
    id: 'sp-1',
    client_id: '1',
    supervisor_id: 'dev-sv-1',
    title: 'Ремонт квартиры на Ленина 15',
    address: 'г Москва, ул. Ленина, д 15, кв 42',
    area_sqm: 54,
    repair_type: 'standard',
    status: 'in_progress',
    created_at: '2026-02-15',
    updated_at: '2026-03-05',
    clientName: 'Иванов А.П.',
    stagesTotal: 10,
    stagesDone: 5,
    pendingReview: 1,
  },
];

const MOCK_COMPLETED: ProjectItem[] = [
  {
    id: 'sp-2',
    client_id: '4',
    supervisor_id: 'dev-sv-1',
    title: 'Ремонт студии на Пушкина 8',
    address: 'г Москва, ул. Пушкина, д 8, кв 12',
    area_sqm: 32,
    repair_type: 'cosmetic',
    status: 'completed',
    created_at: '2026-02-01',
    updated_at: '2026-03-15',
    clientName: 'Петрова М.С.',
    stagesTotal: 7,
    stagesDone: 7,
    pendingReview: 0,
  },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type HomeTab = 'offered' | 'active' | 'completed';

interface TabDef {
  key: HomeTab;
  label: string;
  icon: string;
  iconFocused: string;
}

const TABS: TabDef[] = [
  { key: 'offered', label: 'Предложенные', icon: 'mail-outline', iconFocused: 'mail' },
  { key: 'active', label: 'Активные', icon: 'construct-outline', iconFocused: 'construct' },
  { key: 'completed', label: 'Завершённые', icon: 'checkmark-circle-outline', iconFocused: 'checkmark-circle' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SupervisorHomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.show);
  const isDev = user?.id?.startsWith('dev-');

  const [activeTab, setActiveTab] = useState<HomeTab>('active');
  const [offeredProjects, setOfferedProjects] = useState<ProjectItem[]>(isDev ? MOCK_OFFERED : []);
  const [activeProjects, setActiveProjects] = useState<ProjectItem[]>(isDev ? MOCK_ACTIVE : []);
  const [completedProjects, setCompletedProjects] = useState<ProjectItem[]>(isDev ? MOCK_COMPLETED : []);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  const showDialog = (title: string, message: string, buttons: DialogButton[]) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogButtons(buttons);
    setDialogVisible(true);
  };

  // ─── Load data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user || isDev) return;
    try {
      const all = await fetchSupervisorAllProjects(user.id);

      const offered = all
        .filter((p) => p.status === 'planning')
        .map(enrichProject);
      const active = all
        .filter((p) => p.status === 'in_progress')
        .map(enrichProject);
      const completed = all
        .filter((p) => p.status === 'completed')
        .map(enrichProject);

      setOfferedProjects(offered);
      setActiveProjects(active);
      setCompletedProjects(completed);
    } catch {
      // silently fall back
    }
  }, [user, isDev]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Accept ────────────────────────────────────────────────────────────────

  const handleAccept = (project: ProjectItem) => {
    showDialog(
      'Принять проект?',
      `«${project.title}»\n${project.area_sqm} м² · ${REPAIR_TYPE_LABELS[project.repair_type]}\n\nВы готовы взять этот объект в работу?`,
      [
        {
          text: 'Принять',
          onPress: async () => {
            try {
              if (!isDev) await supervisorAcceptProject(project.id);
              // Move from offered → active
              setOfferedProjects((prev) => prev.filter((p) => p.id !== project.id));
              setActiveProjects((prev) => [
                { ...project, status: 'in_progress' as const },
                ...prev,
              ]);
              setActiveTab('active');
              hapticSuccess();
              showToast('Проект принят в работу', 'success');
            } catch {
              showToast('Ошибка при принятии проекта', 'error');
            }
          },
        },
        { text: 'Отмена', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  // ─── Decline ───────────────────────────────────────────────────────────────

  const handleDecline = (project: ProjectItem) => {
    showDialog(
      'Отказаться от проекта?',
      `«${project.title}»\n\nПроект вернётся в очередь для назначения другому супервайзеру.`,
      [
        {
          text: 'Отказаться',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!isDev) await supervisorDeclineProject(project.id);
              setOfferedProjects((prev) => prev.filter((p) => p.id !== project.id));
              hapticError();
              showToast('Вы отказались от проекта', 'info');
            } catch {
              showToast('Ошибка при отказе', 'error');
            }
          },
        },
        { text: 'Отмена', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  // ─── Navigate to detail ────────────────────────────────────────────────────

  const openProject = (project: ProjectItem) => {
    navigation.navigate('SupervisorProjectDetail', {
      projectId: project.id,
      projectStatus: project.status,
    });
  };

  // ─── Render project cards ──────────────────────────────────────────────────

  const renderOfferedCard = (project: ProjectItem) => (
    <Card key={project.id} style={styles.offeredCard}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>Новый</Text>
        </View>
        <Text style={styles.clientName}>{project.clientName}</Text>
      </View>

      <Text style={styles.cardTitle}>{project.title}</Text>

      {/* Details */}
      <View style={styles.detailsRow}>
        <View style={styles.detailChip}>
          <Ionicons name="resize-outline" size={13} color={colors.primary} />
          <Text style={styles.detailChipText}>{project.area_sqm} м²</Text>
        </View>
        <View style={styles.detailChip}>
          <Ionicons name="construct-outline" size={13} color={colors.primary} />
          <Text style={styles.detailChipText}>{REPAIR_TYPE_LABELS[project.repair_type]}</Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={13} color={colors.textLight} />
        <Text style={styles.cardAddress} numberOfLines={1}>{project.address}</Text>
      </View>

      {/* Accept / Decline actions */}
      <View style={styles.offeredActions}>
        <Button
          title="Принять"
          onPress={() => handleAccept(project)}
          size="sm"
          style={styles.acceptBtn}
        />
        <Button
          title="Отказаться"
          onPress={() => handleDecline(project)}
          size="sm"
          variant="outline"
          style={styles.declineBtn}
        />
        <Pressable
          onPress={() => openProject(project)}
          style={styles.viewDetailsBtn}
        >
          <Text style={styles.viewDetailsText}>Подробнее</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
        </Pressable>
      </View>
    </Card>
  );

  const renderActiveCard = (project: ProjectItem) => {
    const progress = project.stagesTotal > 0
      ? project.stagesDone / project.stagesTotal
      : 0;

    return (
      <Pressable
        key={project.id}
        onPress={() => openProject(project)}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      >
        <Card style={styles.activeCard}>
          <View style={styles.cardHeader}>
            <StatusBadge status={project.status} type="project" />
            <View style={styles.rightHeaderRow}>
              {project.pendingReview > 0 && (
                <View style={styles.reviewBadge}>
                  <Ionicons name="hourglass-outline" size={12} color={colors.accent} />
                  <Text style={styles.reviewBadgeText}>{project.pendingReview}</Text>
                </View>
              )}
              <Text style={styles.clientName}>{project.clientName}</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>{project.title}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color={colors.textLight} />
            <Text style={styles.cardAddress} numberOfLines={1}>{project.address}</Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailChip}>
              <Ionicons name="resize-outline" size={13} color={colors.primary} />
              <Text style={styles.detailChipText}>{project.area_sqm} м²</Text>
            </View>
            <View style={styles.detailChip}>
              <Ionicons name="construct-outline" size={13} color={colors.primary} />
              <Text style={styles.detailChipText}>{REPAIR_TYPE_LABELS[project.repair_type]}</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={{ flex: 1 }}>
              <ProgressBar progress={progress} />
            </View>
            <Text style={styles.progressText}>
              {project.stagesDone}/{project.stagesTotal} этапов
            </Text>
          </View>

          <View style={styles.activeCardFooter}>
            {project.pendingReview > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="hourglass-outline" size={13} color={colors.accent} />
                <Text style={styles.pendingReviewNote}>
                  {project.pendingReview} этап{project.pendingReview > 1 ? 'а' : ''} ожидает проверки
                </Text>
              </View>
            ) : (
              <Text style={styles.activeNote}>Ожидание работ мастера</Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </View>
        </Card>
      </Pressable>
    );
  };

  const renderCompletedCard = (project: ProjectItem) => (
    <Pressable
      key={project.id}
      onPress={() => openProject(project)}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <Card style={styles.completedCard}>
        <View style={styles.cardHeader}>
          <StatusBadge status={project.status} type="project" />
          <Text style={styles.clientName}>{project.clientName}</Text>
        </View>
        <Text style={styles.cardTitle}>{project.title}</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={13} color={colors.textLight} />
          <Text style={styles.cardAddress} numberOfLines={1}>{project.address}</Text>
        </View>
        <Text style={styles.completedMeta}>
          {project.area_sqm} м² · {REPAIR_TYPE_LABELS[project.repair_type]} ·{' '}
          {project.stagesTotal} этапов
        </Text>
      </Card>
    </Pressable>
  );

  // ─── Tab content renderer ─────────────────────────────────────────────────

  const renderTabContent = () => {
    switch (activeTab) {
      case 'offered':
        return offeredProjects.length === 0
          ? renderEmpty('Нет предложенных проектов', 'Администратор назначит вам новые объекты')
          : offeredProjects.map(renderOfferedCard);

      case 'active':
        return activeProjects.length === 0
          ? renderEmpty('Нет активных проектов', 'Примите предложенный проект, чтобы начать работу')
          : activeProjects.map(renderActiveCard);

      case 'completed':
        return completedProjects.length === 0
          ? renderEmpty('Нет завершённых проектов', 'Здесь будет история выполненных работ')
          : completedProjects.map(renderCompletedCard);
    }
  };

  const renderEmpty = (title: string, subtitle: string) => (
    <Card style={styles.emptyCard} key="empty">
      <Ionicons name="clipboard-outline" size={48} color={colors.primary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </Card>
  );

  // ─── Stats row ─────────────────────────────────────────────────────────────

  const totalPendingReview = activeProjects.reduce((sum, p) => sum + p.pendingReview, 0);

  // ─── Invite master ───────────────────────────────────────────────────────
  const handleInviteMaster = () => {
    navigation.navigate('SupervisorInvites');
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerLabel}>Панель супервайзера</Text>
          <Text style={styles.headerName}>{user?.name || 'Супервайзер'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: offeredProjects.length > 0 ? colors.accent : colors.border }]}>
            <Text style={[styles.statNum, { color: offeredProjects.length > 0 ? colors.accent : colors.textLight }]}>
              {offeredProjects.length}
            </Text>
            <Text style={styles.statLabel}>Предложено</Text>
          </View>
          <View style={[styles.statCard, { borderColor: colors.primary }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>
              {activeProjects.length}
            </Text>
            <Text style={styles.statLabel}>Активных</Text>
          </View>
          <View style={[styles.statCard, { borderColor: totalPendingReview > 0 ? colors.warning : colors.border }]}>
            <Text style={[styles.statNum, { color: totalPendingReview > 0 ? colors.warning : colors.textLight }]}>
              {totalPendingReview}
            </Text>
            <Text style={styles.statLabel}>На проверке</Text>
          </View>
        </View>

        {/* Invite master */}
        <Pressable
          style={({ pressed }) => [styles.inviteRow, pressed && { opacity: 0.7 }]}
          onPress={handleInviteMaster}
        >
          <View style={styles.inviteIcon}>
            <Ionicons name="person-add" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>Пригласить мастера</Text>
            <Text style={styles.inviteSubtitle}>Отправьте ссылку для регистрации</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tab.key === 'offered'
              ? offeredProjects.length
              : tab.key === 'active'
              ? activeProjects.length
              : completedProjects.length;

            return (
              <Pressable
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={(isActive ? tab.iconFocused : tab.icon) as any}
                  size={15}
                  color={isActive ? colors.primary : colors.textLight}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ScrollView>

      <AppDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />
    </ScreenWrapper>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function enrichProject(p: Project): ProjectItem {
  return {
    ...p,
    clientName: p.title, // fallback — real implementation fetches client profile
    stagesTotal: 14,
    stagesDone: 0,
    pendingReview: 0,
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  headerSection: {
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  headerLabel: {
    ...typography.body,
    color: colors.textLight,
  },
  headerName: {
    ...typography.h1,
    color: colors.heading,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: 'rgba(123,45,62,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statNum: {
    ...typography.h1,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radius.xl,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: colors.white,
    shadowColor: 'rgba(123,45,62,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textLight,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabCount: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCountActive: {
    backgroundColor: colors.primaryLight,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textLight,
  },
  tabCountTextActive: {
    color: colors.primary,
  },

  // Tab content
  tabContent: {
    gap: spacing.md,
  },

  // Offered card
  offeredCard: {
    borderColor: 'rgba(197,165,90,0.25)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(197,165,90,0.04)',
  },
  newBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  newBadgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },

  // Active card
  activeCard: {},
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(197,165,90,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  reviewBadgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  progressText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
  activeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  pendingReviewNote: {
    ...typography.small,
    color: colors.accent,
    fontWeight: '500',
  },
  activeNote: {
    ...typography.small,
    color: colors.textLight,
    fontStyle: 'italic',
  },

  // Completed card
  completedCard: {
    opacity: 0.75,
  },
  completedMeta: {
    ...typography.small,
    color: colors.textLight,
    marginTop: spacing.xs,
  },

  // Shared card parts
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clientName: {
    ...typography.small,
    color: colors.textLight,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardAddress: {
    ...typography.small,
    color: colors.textLight,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  detailChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // Offered actions
  offeredActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  acceptBtn: {
    flex: 1,
    minWidth: 100,
  },
  declineBtn: {
    flex: 1,
    minWidth: 100,
    borderColor: colors.danger,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewDetailsText: {
    ...typography.small,
    color: colors.textLight,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  emptySubtitle: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
  },

  // Invite master
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  inviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(123,45,62,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTitle: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  inviteSubtitle: {
    ...typography.small,
    color: colors.textLight,
  },
});
