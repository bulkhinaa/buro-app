import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper, Button, GlassView } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import {
  useScheduleStore,
  SCHEDULE_HOURS,
  DAY_LABELS_SHORT,
  DAY_LABELS_FULL,
  getWeekStart,
} from '../../store/scheduleStore';
import { useToastStore } from '../../store/toastStore';

/**
 * MasterScheduleTemplateScreen — define default working hours template
 * Drag/tap on a weekly grid to set working hours, then apply to future weeks.
 */
export function MasterScheduleTemplateScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { template, fetchTemplate, saveTemplate, applyTemplate } = useScheduleStore();
  const showToast = useToastStore((s) => s.show);

  const masterId = user?.id || '';
  const [saving, setSaving] = useState(false);

  // Local state: set of "day-hour" keys that are working
  const [workingSlots, setWorkingSlots] = useState<Set<string>>(new Set());

  // Load from store
  useEffect(() => {
    if (masterId) {
      fetchTemplate(masterId);
    }
  }, [masterId]);

  // Sync store template to local state
  useEffect(() => {
    const keys = new Set(
      template
        .filter((t) => t.is_working)
        .map((t) => `${t.day_of_week}-${t.hour}`)
    );
    setWorkingSlots(keys);
  }, [template]);

  const toggleSlot = useCallback((day: number, hour: number) => {
    const key = `${day}-${hour}`;
    setWorkingSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Select/deselect entire day
  const toggleDay = useCallback((day: number) => {
    setWorkingSlots((prev) => {
      const next = new Set(prev);
      const daySlots = SCHEDULE_HOURS.map((h) => `${day}-${h}`);
      const allSelected = daySlots.every((k) => next.has(k));
      for (const k of daySlots) {
        if (allSelected) {
          next.delete(k);
        } else {
          next.add(k);
        }
      }
      return next;
    });
  }, []);

  // Quick presets
  const applyPreset = useCallback((preset: 'weekdays' | 'all' | 'clear') => {
    setWorkingSlots(() => {
      const next = new Set<string>();
      if (preset === 'clear') return next;
      const days = preset === 'weekdays' ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6];
      const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]; // 9:00-17:00
      for (const d of days) {
        for (const h of hours) {
          next.add(`${d}-${h}`);
        }
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const slots = Array.from(workingSlots).map((key) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour };
    });
    await saveTemplate(masterId, slots);
    showToast('Шаблон сохранён', 'success');
    setSaving(false);
  }, [masterId, workingSlots, saveTemplate, showToast]);

  const handleApply = useCallback(async () => {
    setSaving(true);
    await applyTemplate(masterId, getWeekStart(new Date()));
    showToast('Шаблон применён на 4 недели', 'success');
    setSaving(false);
    navigation.goBack();
  }, [masterId, applyTemplate, showToast, navigation]);

  const workingCount = workingSlots.size;
  const totalSlots = SCHEDULE_HOURS.length * 7;

  return (
    <ScreenWrapper scroll={false}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Задать шаблон</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>
          Выберите рабочие часы — шаблон можно применить на будущие недели
        </Text>

        {/* Presets */}
        <View style={styles.presets}>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => applyPreset('weekdays')}
          >
            <Text style={styles.presetText}>Пн-Пт 9-17</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => applyPreset('all')}
          >
            <Text style={styles.presetText}>Все дни 9-17</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetBtn, styles.presetClear]}
            onPress={() => applyPreset('clear')}
          >
            <Text style={[styles.presetText, styles.presetClearText]}>Очистить</Text>
          </TouchableOpacity>
        </View>

        {/* Template grid */}
        <View style={styles.gridContainer}>
          {/* Header row */}
          <View style={styles.gridHeaderRow}>
            <View style={styles.hourCol} />
            {DAY_LABELS_SHORT.map((label, dayIdx) => (
              <TouchableOpacity
                key={dayIdx}
                style={styles.dayHeaderCell}
                onPress={() => toggleDay(dayIdx)}
              >
                <Text style={styles.dayHeaderText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hour rows */}
          {SCHEDULE_HOURS.map((hour) => (
            <View key={hour} style={styles.gridRow}>
              <View style={styles.hourCol}>
                <Text style={styles.hourText}>{`${hour}:00`}</Text>
              </View>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const isWorking = workingSlots.has(`${day}-${hour}`);
                return (
                  <TouchableOpacity
                    key={`${day}-${hour}`}
                    style={[
                      styles.gridCell,
                      isWorking && styles.gridCellWorking,
                    ]}
                    onPress={() => toggleSlot(day, hour)}
                    activeOpacity={0.7}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Stats */}
        <Text style={styles.stats}>
          {workingCount} рабочих слотов из {totalSlots} ({Math.round((workingCount / totalSlots) * 100)}%)
        </Text>

        {/* Actions */}
        <Button
          title="Сохранить шаблон"
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
        <Button
          title="Сохранить и применить на 4 недели"
          onPress={async () => {
            await handleSave();
            await handleApply();
          }}
          variant="outline"
          loading={saving}
          style={styles.applyBtn}
        />

        <View style={{ height: 120 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  presets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  presetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  presetClear: {
    backgroundColor: colors.dangerLight,
  },
  presetClearText: {
    color: colors.danger,
  },
  gridContainer: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    height: 28,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  hourCol: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.heading,
  },
  gridRow: {
    flexDirection: 'row',
    height: 32,
  },
  hourText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textLight,
  },
  gridCell: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(123,45,62,0.04)',
  },
  gridCellWorking: {
    backgroundColor: colors.primary,
  },
  stats: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  saveBtn: {
    marginBottom: spacing.md,
  },
  applyBtn: {
    marginBottom: spacing.md,
  },
});
