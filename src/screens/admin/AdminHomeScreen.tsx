import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, StatusBadge, Button, AppDialog, MapPreview } from '../../components';
import type { DialogButton } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { Project, REPAIR_TYPE_LABELS } from '../../types';
import {
  fetchAllProjects,
  updateProjectStatus,
  assignSupervisor,
} from '../../services/projectService';

type RequestItem = Project & { clientName: string; clientPhone: string };

const MOCK_REQUESTS: RequestItem[] = [
  {
    id: 'mock-1',
    client_id: '5',
    title: 'Ремонт ванной',
    address: 'ул. Гагарина, 22, кв. 7',
    area_sqm: 8,
    repair_type: 'standard',
    status: 'new',
    created_at: '2025-02-06T09:00:00Z',
    updated_at: '2025-02-06T09:00:00Z',
    clientName: 'Сидоров В.М.',
    clientPhone: '+7 (916) 123-45-67',
  },
  {
    id: 'mock-2',
    client_id: '6',
    title: 'Капремонт 3-к',
    address: 'пр. Мира, 101, кв. 55',
    area_sqm: 78,
    repair_type: 'premium',
    status: 'new',
    created_at: '2025-02-05T14:00:00Z',
    updated_at: '2025-02-05T14:00:00Z',
    clientName: 'Козлова И.А.',
    clientPhone: '+7 (903) 987-65-43',
  },
  {
    id: 'mock-3',
    client_id: '7',
    title: 'Косметический ремонт студии',
    address: 'ул. Лесная, 5, кв. 18',
    area_sqm: 34,
    repair_type: 'cosmetic',
    status: 'new',
    created_at: '2025-02-04T11:00:00Z',
    updated_at: '2025-02-04T11:00:00Z',
    clientName: 'Новиков Д.А.',
    clientPhone: '+7 (925) 555-12-34',
  },
];

const MOCK_SUPERVISORS = [
  { id: 'sv-1', name: 'Алексеев П.И.' },
  { id: 'sv-2', name: 'Борисова Е.А.' },
  { id: 'sv-3', name: 'Григорьев М.С.' },
];

export function AdminHomeScreen({ navigation }: any) {
  const [requests, setRequests] = useState<RequestItem[]>(MOCK_REQUESTS);
  const [assignedCount, setAssignedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

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

  const loadData = useCallback(async () => {
    try {
      const projects = await fetchAllProjects('new');
      if (projects.length > 0) {
        setRequests(
          projects.map((p) => ({
            ...p,
            clientName: p.title,
            clientPhone: '',
          })),
        );
      }
    } catch {
      // DEV mode: Supabase may fail without auth, use mocks
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = (item: RequestItem) => {
    const svButtons: DialogButton[] = MOCK_SUPERVISORS.map((sv) => ({
      text: sv.name,
      onPress: async () => {
        try {
          await assignSupervisor(item.id, sv.id);
        } catch {
          // DEV mode fallback
        }
        setRequests((prev) => prev.filter((r) => r.id !== item.id));
        setAssignedCount((c) => c + 1);
        // Show success dialog
        showDialog(
          'Назначен',
          `Супервайзер ${sv.name} назначен на проект «${item.title}»`,
          [{ text: 'OK', onPress: () => {} }],
        );
      },
    }));
    svButtons.push({
      text: 'Отмена',
      style: 'cancel',
      onPress: () => {},
    });

    showDialog('Выберите супервайзера', `Проект: ${item.address}`, svButtons);
  };

  const handleReject = (item: RequestItem) => {
    showDialog(
      'Отклонить заявку?',
      `${item.clientName}\n${item.address}`,
      [
        {
          text: 'Отклонить',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateProjectStatus(item.id, 'cancelled');
            } catch {
              // DEV mode fallback
            }
            setRequests((prev) => prev.filter((r) => r.id !== item.id));
            setRejectedCount((c) => c + 1);
          },
        },
        { text: 'Нет', style: 'cancel', onPress: () => {} },
      ],
    );
  };

  const renderRequest = ({ item }: { item: RequestItem }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <StatusBadge status={item.status} type="project" />
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString('ru-RU')}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.clientName}</Text>
      {item.clientPhone ? (
        <Text style={styles.cardPhone}>{item.clientPhone}</Text>
      ) : null}
      <Text style={styles.cardAddress}>
        {item.address} · {item.area_sqm} м² · {REPAIR_TYPE_LABELS[item.repair_type]}
      </Text>

      <MapPreview address={item.address} />

      <View style={styles.cardActions}>
        <Button
          title="Назначить супервайзера"
          onPress={() => handleAssign(item)}
          size="sm"
        />
        <Button
          title="Отклонить"
          onPress={() => handleReject(item)}
          variant="ghost"
          size="sm"
        />
      </View>
    </Card>
  );

  const totalNew = requests.length;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Админ-панель</Text>
        <Text style={styles.subtitle}>Управление проектами и пользователями</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {totalNew}
          </Text>
          <Text style={styles.statLabel}>Новых заявок</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.gold }]}>
            {assignedCount}
          </Text>
          <Text style={styles.statLabel}>Назначено</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.success }]}>8</Text>
          <Text style={styles.statLabel}>Мастеров</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>3</Text>
          <Text style={styles.statLabel}>Супервайзеров</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Новые заявки {totalNew > 0 ? `(${totalNew})` : ''}
      </Text>

      {totalNew === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="mail-open-outline" size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyText}>Все заявки обработаны</Text>
          <Text style={styles.emptySubtext}>
            Назначено: {assignedCount} · Отклонено: {rejectedCount}
          </Text>
        </Card>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}

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

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'rgba(123, 45, 62, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    ...typography.h1,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardDate: {
    ...typography.small,
    color: colors.textLight,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 2,
  },
  cardPhone: {
    ...typography.body,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  cardAddress: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  // emptyIcon style removed — now using Ionicons inline
  emptyText: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textLight,
  },
});
