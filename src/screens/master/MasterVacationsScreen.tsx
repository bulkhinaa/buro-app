import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper, Button, GlassView, AppDialog, Input, DateRangePicker } from '../../components';
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

// Swipeable vacation card with delete action
function SwipeableVacationCard({
  item,
  onDelete,
}: {
  item: MasterVacation;
  onDelete: (id: string) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);
  const days = getDaysBetween(item.date_from, item.date_to);
  const isPast = new Date(item.date_to + 'T23:59:59') < new Date();

  const DELETE_THRESHOLD = -80;

  const handleSwipeStart = useCallback(() => {
    if (swiped) {
      // Close swipe
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => setSwiped(false));
    } else {
      // Open swipe to reveal delete
      Animated.spring(translateX, {
        toValue: DELETE_THRESHOLD,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => setSwiped(true));
    }
  }, [swiped, translateX]);

  return (
    <View style={styles.swipeContainer}>
      {/* Delete action behind */}
      <View style={styles.deleteAction}>
        <Pressable
          style={styles.deleteActionBtn}
          onPress={() => onDelete(item.id)}
        >
          <Ionicons name="trash" size={22} color={colors.white} />
          <Text style={styles.deleteActionText}>Удалить</Text>
        </Pressable>
      </View>

      {/* Card that slides */}
      <Animated.View
        style={[
          styles.slideCard,
          { transform: [{ translateX }] },
        ]}
      >
        <Pressable onLongPress={handleSwipeStart} onPress={() => swiped && handleSwipeStart()}>
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
                onPress={() => onDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </GlassView>
        </Pressable>
      </Animated.View>
    </View>
  );
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
    return <SwipeableVacationCard item={item} onDelete={(id) => setDeleteId(id)} />;
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

      {/* Add vacation modal with DateRangePicker */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>Новый отпуск</Text>

            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />

            {dateFrom && dateTo ? (
              <View style={styles.selectedRange}>
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <Text style={styles.selectedRangeText}>
                  {formatDisplayDate(dateFrom)} — {formatDisplayDate(dateTo)}
                  {' · '}
                  {getDaysBetween(dateFrom, dateTo)} {getDaysBetween(dateFrom, dateTo) === 1 ? 'день' : getDaysBetween(dateFrom, dateTo) < 5 ? 'дня' : 'дней'}
                </Text>
              </View>
            ) : null}

            <View style={styles.reasonField}>
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
  // Swipeable card
  swipeContainer: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.xl,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: colors.danger,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  slideCard: {
    backgroundColor: 'transparent',
  },
  vacationCard: {
    padding: spacing.lg,
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
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  selectedRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(123, 45, 62, 0.08)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  selectedRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  reasonField: {
    marginTop: spacing.lg,
    gap: spacing.sm,
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
