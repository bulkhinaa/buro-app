import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { Button } from './Button';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MasterCandidate {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  reviewCount: number;
  activeTasksCount: number;
  avatarUrl?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (master: MasterCandidate) => void;
  masters: MasterCandidate[];
  stageTitle?: string;
  loading?: boolean;
}

// ─── Specialization filter options ─────────────────────────────────────────────

const SPECIALIZATIONS = [
  { value: 'all', label: 'Все' },
  { value: 'universal', label: 'Универсал' },
  { value: 'electrician', label: 'Электрик' },
  { value: 'plumber', label: 'Сантехник' },
  { value: 'tiler', label: 'Плиточник' },
  { value: 'plasterer', label: 'Штукатур' },
  { value: 'painter', label: 'Маляр' },
  { value: 'carpenter', label: 'Столяр' },
  { value: 'flooring', label: 'Полы' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function MasterSelectModal({ visible, onClose, onSelect, masters, stageTitle, loading }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const filteredMasters = useMemo(() => {
    if (filter === 'all') return masters;
    const spec = SPECIALIZATIONS.find((s) => s.value === filter);
    if (!spec) return masters;
    return masters.filter((m) =>
      m.specialization.toLowerCase().includes(spec.label.toLowerCase()),
    );
  }, [masters, filter]);

  const handleConfirm = () => {
    const master = masters.find((m) => m.id === selectedId);
    if (master) {
      onSelect(master);
      setSelectedId(null);
      setFilter('all');
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setFilter('all');
    onClose();
  };

  const renderMasterCard = ({ item }: { item: MasterCandidate }) => {
    const isSelected = item.id === selectedId;

    return (
      <Pressable
        style={[
          styles.masterCard,
          isSelected && styles.masterCardSelected,
        ]}
        onPress={() => setSelectedId(item.id)}
      >
        {/* Avatar */}
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Ionicons
            name="person"
            size={22}
            color={isSelected ? colors.white : colors.primary}
          />
        </View>

        {/* Info */}
        <View style={styles.masterInfo}>
          <Text style={styles.masterName}>{item.name}</Text>
          <Text style={styles.masterSpec}>{item.specialization}</Text>
          <View style={styles.masterMeta}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.metaText}>
              {item.rating.toFixed(1)} ({item.reviewCount})
            </Text>
            {item.activeTasksCount > 0 && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>
                  {item.activeTasksCount} задач
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Selection indicator */}
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Назначить мастера</Text>
              {stageTitle && (
                <Text style={styles.subtitle}>на этап «{stageTitle}»</Text>
              )}
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.heading} />
            </Pressable>
          </View>

          {/* Specialization filter */}
          <FlatList
            data={SPECIALIZATIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.filterChip,
                  filter === item.value && styles.filterChipActive,
                ]}
                onPress={() => setFilter(item.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filter === item.value && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />

          {/* Masters list */}
          <FlatList
            data={filteredMasters}
            keyExtractor={(item) => item.id}
            renderItem={renderMasterCard}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={40} color={colors.textLight} />
                <Text style={styles.emptyText}>Мастера не найдены</Text>
              </View>
            }
          />

          {/* Confirm button */}
          <View style={styles.footer}>
            <Button
              title={selectedId ? 'Назначить' : 'Выберите мастера'}
              onPress={handleConfirm}
              loading={loading}
              fullWidth
              style={!selectedId ? { opacity: 0.5 } : undefined}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.heading,
  },
  subtitle: {
    ...typography.small,
    color: colors.textLight,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },

  // Filter
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
  },

  // List
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: spacing.md,
    gap: spacing.md,
  },
  masterCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(123,45,62,0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123,45,62,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: colors.primary,
  },
  masterInfo: {
    flex: 1,
    gap: 2,
  },
  masterName: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  masterSpec: {
    ...typography.small,
    color: colors.textLight,
  },
  masterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.textLight,
  },
  metaDot: {
    color: colors.textLight,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
