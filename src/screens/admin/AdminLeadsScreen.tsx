import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, GlassChip, SystemButton } from '../../components';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { colors, spacing, typography, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAdminStore, MOCK_LEADS, type Lead, type LeadFilter } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { fetchAllLeads, updateLeadStatus } from '../../services/projectService';

const FILTER_OPTIONS: { key: LeadFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'contacted', label: 'Связались' },
  { key: 'converted', label: 'Конвертированы' },
  { key: 'rejected', label: 'Отклонённые' },
];

const STATUS_COLORS: Record<string, string> = {
  new: colors.primary,
  contacted: colors.gold,
  converted: colors.success,
  rejected: colors.danger,
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  contacted: 'Связались',
  converted: 'Конвертирован',
  rejected: 'Отклонён',
};

export function AdminLeadsScreen({ navigation }: any) {
  const { colors: themeColors, glass, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const isDev = user?.id.startsWith('dev-');

  const allLeads = useAdminStore((s) => s.leads);
  const filter = useAdminStore((s) => s.leadFilter);

  const leads = useMemo(() => {
    let filtered = allLeads;
    if (filter !== 'all') {
      filtered = filtered.filter((l) => l.status === filter);
    }
    return filtered;
  }, [allLeads, filter]);
  const setLeads = useAdminStore((s) => s.setLeads);
  const setFilter = useAdminStore((s) => s.setLeadFilter);

  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isDev) {
        setLeads(MOCK_LEADS);
      } else {
        const data = await fetchAllLeads();
        setLeads(data as Lead[]);
      }
    } catch {
      setLeads(MOCK_LEADS);
    } finally {
      setLoading(false);
    }
  }, [isDev, setLeads]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (lead: Lead, newStatus: string) => {
    try {
      if (!isDev) await updateLeadStatus(lead.id, newStatus);
      setLeads(
        useAdminStore.getState().leads.map((l) =>
          l.id === lead.id ? { ...l, status: newStatus as Lead['status'] } : l,
        ),
      );
      hapticSuccess();
      showToast(`Статус: ${STATUS_LABELS[newStatus]}`, 'success');
    } catch {
      showToast('Ошибка обновления статуса', 'error');
    }
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: STATUS_COLORS[item.status] },
          ]}
        />
        <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString('ru-RU')}
        </Text>
      </View>

      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardPhone}>{item.phone}</Text>

      {item.address ? (
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color={colors.textLight} />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
      ) : null}

      {item.area_sqm ? (
        <View style={styles.detailRow}>
          <Ionicons name="resize-outline" size={14} color={colors.textLight} />
          <Text style={styles.detailText}>{item.area_sqm} м²</Text>
        </View>
      ) : null}

      {item.budget ? (
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={14} color={colors.textLight} />
          <Text style={styles.detailText}>{item.budget}</Text>
        </View>
      ) : null}

      {item.message ? (
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
      ) : null}

      {/* Actions */}
      {item.status === 'new' && (
        <View style={styles.actions}>
          <Button
            title="Связались"
            onPress={() => handleUpdateStatus(item, 'contacted')}
            size="sm"
          />
          <Button
            title="Отклонить"
            onPress={() => handleUpdateStatus(item, 'rejected')}
            variant="ghost"
            size="sm"
          />
        </View>
      )}

      {item.status === 'contacted' && (
        <View style={styles.actions}>
          <Button
            title="Создать проект"
            onPress={() => handleUpdateStatus(item, 'converted')}
            size="sm"
          />
          <Button
            title="Отклонить"
            onPress={() => handleUpdateStatus(item, 'rejected')}
            variant="ghost"
            size="sm"
          />
        </View>
      )}
    </Card>
  );

  const statusCounts = allLeads.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.backRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <Text style={styles.title}>Лиды с лендинга</Text>
      <Text style={styles.subtitle}>
        Заявки с формы на сайте
      </Text>

      <View style={styles.filters}>
        {FILTER_OPTIONS.map((opt) => {
          const count =
            opt.key === 'all'
              ? allLeads.length
              : statusCounts[opt.key] || 0;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                setFilter(opt.key);
                hapticLight();
              }}
            >
              <GlassChip
                label={`${opt.label}${count > 0 ? ` (${count})` : ''}`}
                active={filter === opt.key}
              />
            </Pressable>
          );
        })}
      </View>

      {leads.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons
            name="megaphone-outline"
            size={48}
            color={colors.primary}
            style={{ marginBottom: spacing.md }}
          />
          <Text style={styles.emptyText}>Нет лидов</Text>
          <Text style={styles.emptySubtext}>
            Лиды с лендинга появятся здесь
          </Text>
        </Card>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLead}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  backRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.small,
    fontWeight: '600',
    flex: 1,
  },
  cardDate: {
    ...typography.small,
    color: colors.textLight,
  },
  cardName: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: 2,
  },
  cardPhone: {
    ...typography.body,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  detailText: {
    ...typography.small,
    color: colors.textLight,
  },
  message: {
    ...typography.small,
    color: colors.text,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
});
