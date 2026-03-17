import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper, Button, GlassView, AppDialog, Input } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { useToastStore } from '../../store/toastStore';
import type { MasterVacation } from '../../types';

const MONTH_NAMES = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function getDaysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (86400000)) + 1;
}

export function MasterVacationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { vacations, fetchVacations, addVacation, removeVacation } = useScheduleStore();
  const showToast = useToastStore((s) => s.show);

  const masterId = user?.id || '';
  const [showAddModal, setShowAddModal] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (masterId) {
      fetchVacations(masterId);
    }
  }, [masterId]);

  const handleAdd = useCallback(async () => {
    if (!dateFrom || !dateTo) {
      showToast('Укажите даты отпуска', 'error');
      return;
    }
    if (dateFrom > dateTo) {
      showToast('Дата начала должна быть раньше даты окончания', 'error');
      return;
    }
    setSaving(true);
    const result = await addVacation(masterId, dateFrom, dateTo, reason || undefined);
    setSaving(false);
    if (result) {
      showToast('Отпуск добавлен', 'success');
      setShowAddModal(false);
      setDateFrom('');
      setDateTo('');
      setReason('');
    } else {
      showToast('Не удалось добавить отпуск', 'error');
    }
  }, [masterId, dateFrom, dateTo, reason, addVacation, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await removeVacation(masterId, deleteId);
    showToast('Отпуск удалён', 'success');
    setDeleteId(null);
  }, [masterId, deleteId, removeVacation, showToast]);

  const renderVacation = useCallback(({ item }: { item: MasterVacation }) => {
    const days = getDaysBetween(item.date_from, item.date_to);
    const isPast = new Date(item.date_to + 'T23:59:59') < new Date();

    return (
      <GlassView style={[styles.vacationCard, isPast && styles.vacationPast]}>
        <View style={styles.vacationRow}>
          <View style={styles.vacationInfo}>
            <View style={styles.vacationDates}>
              <Ionicons name="calendar-outline" size={16} color={isPast ? colors.textLight : colors.primary} />
              <Text style={[styles.vacationDateText, isPast && styles.vacationPastText]}>
                {formatDisplayDate(item.date_from)} — {formatDisplayDate(item.date_to)}
              </Text>
            </View>
            <Text style={styles.vacationDays}>
              {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
            </Text>
            {item.reason ? (
              <Text style={styles.vacationReason}>{item.reason}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setDeleteId(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </GlassView>
    );
  }, []);

  return (
    <ScreenWrapper scroll={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Отпуска</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {vacations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="airplane-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>Нет запланированных отпусков</Text>
          <Button
            title="Добавить отпуск"
            onPress={() => setShowAddModal(true)}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <FlatList
          data={vacations}
          keyExtractor={(item) => item.id}
          renderItem={renderVacation}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add vacation modal (custom, since AppDialog doesn't support children) */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>Новый отпуск</Text>

            <View style={styles.dialogContent}>
              <Text style={styles.fieldLabel}>Дата начала (ГГГГ-ММ-ДД)</Text>
              <Input
                placeholder="2026-04-01"
                value={dateFrom}
                onChangeText={setDateFrom}
              />
              <Text style={styles.fieldLabel}>Дата окончания (ГГГГ-ММ-ДД)</Text>
              <Input
                placeholder="2026-04-14"
                value={dateTo}
                onChangeText={setDateTo}
              />
              <Text style={styles.fieldLabel}>Причина (необязательно)</Text>
              <Input
                placeholder="Отпуск, семейные обстоятельства..."
                value={reason}
                onChangeText={setReason}
              />
            </View>

            <View style={styles.dialogButtons}>
              <Button
                title="Отмена"
                variant="outline"
                onPress={() => setShowAddModal(false)}
                style={styles.dialogBtn}
              />
              <Button
                title="Добавить"
                onPress={handleAdd}
                loading={saving}
                style={styles.dialogBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete confirmation */}
      <AppDialog
        visible={!!deleteId}
        title="Удалить отпуск?"
        message="Отпуск будет удалён. Это действие нельзя отменить."
        onClose={() => setDeleteId(null)}
        buttons={[
          { text: 'Отмена', style: 'cancel', onPress: () => setDeleteId(null) },
          { text: 'Удалить', style: 'destructive', onPress: handleDelete },
        ]}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.heading,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  vacationCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  vacationPast: {
    opacity: 0.5,
  },
  vacationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vacationInfo: {
    flex: 1,
  },
  vacationDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vacationDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.heading,
  },
  vacationPastText: {
    color: colors.textLight,
  },
  vacationDays: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  vacationReason: {
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  emptyBtn: {
    width: 200,
  },
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 360,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  dialogContent: {
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  dialogBtn: {
    flex: 1,
  },
});
