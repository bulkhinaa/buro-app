import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, SystemButton, GlassChip, AppDialog } from '../../components';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { spacing, typography, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  fetchStageTemplates,
  createStageTemplate,
  updateStageTemplate,
  deleteStageTemplate,
} from '../../services/projectService';
import type { StageTemplate } from '../../types';

import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';

// Local mock for dev users
const DEFAULT_TEMPLATES: StageTemplate[] = [
  { id: 'tpl-1', order_index: 1, title: 'Демонтаж', description: 'Снятие старых покрытий, демонтаж перегородок, вынос строительного мусора', checklist: ['Снятие обоев и старой краски', 'Демонтаж старого пола', 'Демонтаж сантехники', 'Вынос строительного мусора'] },
  { id: 'tpl-2', order_index: 2, title: 'Электрика (черновая)', description: 'Прокладка кабелей, установка подрозетников, электрощита', checklist: ['Разводка электропроводки', 'Установка подрозетников', 'Монтаж электрощита', 'Прокладка слаботочных сетей'] },
  { id: 'tpl-3', order_index: 3, title: 'Сантехника (черновая)', description: 'Разводка труб водоснабжения и канализации', checklist: ['Разводка труб водоснабжения', 'Прокладка канализации', 'Установка коллекторов', 'Гидроизоляция мокрых зон'] },
  { id: 'tpl-4', order_index: 4, title: 'Стяжка пола', description: 'Выравнивание пола цементно-песчаной стяжкой', checklist: ['Установка маяков', 'Заливка стяжки', 'Контроль уровня', 'Просушка'] },
  { id: 'tpl-5', order_index: 5, title: 'Штукатурка стен', description: 'Выравнивание стен гипсовой или цементной штукатуркой', checklist: ['Грунтовка поверхностей', 'Установка маяков', 'Нанесение штукатурки', 'Выравнивание и затирка'] },
  { id: 'tpl-6', order_index: 6, title: 'Укладка плитки', description: 'Облицовка стен и полов керамической плиткой', checklist: ['Подготовка поверхности', 'Раскладка плитки', 'Укладка на клей', 'Затирка швов'] },
  { id: 'tpl-7', order_index: 7, title: 'Электрика (чистовая)', description: 'Установка розеток, выключателей, светильников', checklist: ['Установка розеток', 'Установка выключателей', 'Монтаж светильников', 'Проверка и тестирование'] },
  { id: 'tpl-8', order_index: 8, title: 'Сантехника (чистовая)', description: 'Установка унитаза, раковины, ванны, смесителей', checklist: ['Установка унитаза', 'Установка раковины', 'Установка ванны/душа', 'Подключение смесителей'] },
  { id: 'tpl-9', order_index: 9, title: 'Шпаклёвка и покраска', description: 'Финишная шпаклёвка стен, грунтовка и покраска', checklist: ['Шпаклёвка стен', 'Шлифовка', 'Грунтовка', 'Покраска в 2-3 слоя'] },
  { id: 'tpl-10', order_index: 10, title: 'Укладка напольного покрытия', description: 'Монтаж ламината, паркета или линолеума', checklist: ['Подложка', 'Укладка покрытия', 'Подрезка', 'Установка плинтусов'] },
  { id: 'tpl-11', order_index: 11, title: 'Установка дверей', description: 'Монтаж межкомнатных и входных дверей', checklist: ['Подготовка проёмов', 'Установка коробки', 'Навеска полотна', 'Установка наличников'] },
  { id: 'tpl-12', order_index: 12, title: 'Монтаж потолков', description: 'Установка натяжных или подвесных потолков', checklist: ['Разметка уровня', 'Монтаж профилей', 'Установка полотна/панелей', 'Установка светильников'] },
  { id: 'tpl-13', order_index: 13, title: 'Чистовая отделка', description: 'Поклейка обоев, декоративные работы, установка плинтусов', checklist: ['Поклейка обоев', 'Установка плинтусов', 'Декоративные элементы', 'Финальные штрихи'] },
  { id: 'tpl-14', order_index: 14, title: 'Финальная уборка', description: 'Генеральная уборка после ремонта, вывоз мусора', checklist: ['Уборка строительной пыли', 'Мытьё окон', 'Очистка поверхностей', 'Вывоз оставшегося мусора'] },
];

const webInputStyle = Platform.OS === 'web' ? { outlineStyle: 'none' as any, outlineWidth: 0 } : {};

export function AdminTemplatesScreen({ navigation }: any) {
  const { colors, glass, isDark } = useTheme();
  const styles = useAdminTemplatesStyles(colors, glass, isDark);
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editChecklist, setEditChecklist] = useState<string[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StageTemplate | null>(null);
  const showToast = useToastStore((s) => s.show);
  const user = useAuthStore((s) => s.user);
  const isDev = user?.id.startsWith('dev-');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      if (isDev) {
        setTemplates(DEFAULT_TEMPLATES);
      } else {
        const data = await fetchStageTemplates();
        setTemplates(data.length > 0 ? data : DEFAULT_TEMPLATES);
      }
    } catch {
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    hapticLight();
    if (editingId === id) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const startEditing = (item: StageTemplate) => {
    hapticLight();
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditChecklist([...item.checklist]);
    setNewCheckItem('');
    setExpandedId(item.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewCheckItem('');
  };

  const saveEditing = useCallback(async () => {
    if (editingId === null) return;
    if (!editTitle.trim()) {
      showToast('Введите название этапа', 'error');
      return;
    }

    const updates = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      checklist: editChecklist.filter((c) => c.trim()),
    };

    setSaving(true);
    try {
      if (!isDev) {
        await updateStageTemplate(editingId, updates);
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, ...updates } : t)),
      );
      setEditingId(null);
      hapticSuccess();
      showToast('Шаблон сохранён', 'success');
    } catch {
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  }, [editingId, editTitle, editDescription, editChecklist, isDev, showToast]);

  const handleAddTemplate = async () => {
    const nextIndex = templates.length + 1;
    const newTemplate: Omit<StageTemplate, 'id'> = {
      order_index: nextIndex,
      title: `Новый этап ${nextIndex}`,
      description: '',
      checklist: [],
    };

    setSaving(true);
    try {
      if (isDev) {
        const devItem: StageTemplate = { id: `tpl-${Date.now()}`, ...newTemplate };
        setTemplates((prev) => [...prev, devItem]);
        startEditing(devItem);
      } else {
        const created = await createStageTemplate(newTemplate);
        setTemplates((prev) => [...prev, created]);
        startEditing(created);
      }
      hapticSuccess();
      showToast('Этап добавлен', 'success');
    } catch {
      showToast('Ошибка создания', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (!isDev) {
        await deleteStageTemplate(deleteTarget.id);
      }
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) setEditingId(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      hapticSuccess();
      showToast('Этап удалён', 'info');
    } catch {
      showToast('Ошибка удаления', 'error');
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  };

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    setEditChecklist((prev) => [...prev, newCheckItem.trim()]);
    setNewCheckItem('');
  };

  const removeChecklistItem = (idx: number) => {
    setEditChecklist((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateChecklistItem = (idx: number, value: string) => {
    setEditChecklist((prev) => prev.map((item, i) => (i === idx ? value : item)));
  };

  const renderTemplate = ({ item }: { item: StageTemplate }) => {
    const isExpanded = expandedId === item.id;
    const isEditing = editingId === item.id;

    return (
      <Card style={styles.card}>
        <Pressable
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.indexCircle}>
            <Text style={styles.indexText}>{item.order_index}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={isExpanded ? undefined : 1}>
              {item.description || 'Без описания'}
            </Text>
          </View>
          {isExpanded && !isEditing && (
            <View style={styles.headerActions}>
              <Pressable onPress={() => startEditing(item)} hitSlop={8}>
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => setDeleteTarget(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textLight}
          />
        </Pressable>

        {isExpanded && !isEditing && (
          <View style={styles.expandedContent}>
            <Text style={styles.checklistTitle}>Чек-лист</Text>
            {item.checklist.length > 0 ? (
              item.checklist.map((check, i) => (
                <View key={i} style={styles.checkItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                  <Text style={styles.checkText}>{check}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Нет пунктов</Text>
            )}
          </View>
        )}

        {isEditing && (
          <View style={styles.expandedContent}>
            <Text style={styles.editLabel}>Название</Text>
            <TextInput
              style={[styles.editInput, webInputStyle]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Название этапа"
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.editLabel}>Описание</Text>
            <TextInput
              style={[styles.editInput, styles.editInputMultiline, webInputStyle]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Описание этапа"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.editLabel}>Чек-лист</Text>
            {editChecklist.map((check, i) => (
              <View key={i} style={styles.editCheckRow}>
                <TextInput
                  style={[styles.editCheckInput, webInputStyle]}
                  value={check}
                  onChangeText={(val) => updateChecklistItem(i, val)}
                  placeholderTextColor={colors.textLight}
                />
                <Pressable onPress={() => removeChecklistItem(i)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </Pressable>
              </View>
            ))}

            <View style={styles.editCheckRow}>
              <TextInput
                style={[styles.editCheckInput, webInputStyle]}
                value={newCheckItem}
                onChangeText={setNewCheckItem}
                placeholder="Новый пункт..."
                placeholderTextColor={colors.textLight}
                onSubmitEditing={addChecklistItem}
              />
              <Pressable onPress={addChecklistItem} hitSlop={8}>
                <Ionicons name="add-circle" size={20} color={colors.success} />
              </Pressable>
            </View>

            <View style={styles.editActions}>
              <Pressable style={styles.cancelBtn} onPress={cancelEditing}>
                <Text style={styles.cancelBtnText}>Отмена</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveEditing}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={colors.white} />
                    <Text style={styles.saveBtnText}>Сохранить</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.backRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>База знаний</Text>
          <Text style={styles.subtitle}>
            {templates.length} этапов ремонта
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={handleAddTemplate}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={templates}
          renderItem={renderTemplate}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          extraData={`${editingId}-${expandedId}`}
        />
      )}

      <AppDialog
        visible={!!deleteTarget}
        title="Удалить этап?"
        message={`Этап «${deleteTarget?.title}» будет удалён. Это действие нельзя отменить.`}
        buttons={[
          { text: 'Отмена', style: 'cancel', onPress: () => setDeleteTarget(null) },
          { text: 'Удалить', style: 'destructive', onPress: confirmDelete },
        ]}
        onClose={() => setDeleteTarget(null)}
      />
    </ScreenWrapper>
  );
}

function useAdminTemplatesStyles(colors: ThemeColors, _glass: GlassTokens, isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    container: { paddingBottom: 100 },
    backRow: { flexDirection: 'row', marginTop: spacing.sm, marginBottom: spacing.md },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
    title: { ...typography.h1, color: colors.heading },
    subtitle: { ...typography.body, color: colors.textLight, marginTop: 2 },
    addBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.huge },
    card: { marginBottom: spacing.sm },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    indexCircle: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
    },
    indexText: { ...typography.bodyBold, color: colors.primary, fontSize: 14 },
    cardInfo: { flex: 1 },
    cardTitle: { ...typography.bodyBold, color: colors.heading },
    cardDesc: { ...typography.small, color: colors.textLight, marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: spacing.md },
    expandedContent: {
      marginTop: spacing.lg, paddingTop: spacing.md,
      borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    },
    checklistTitle: { ...typography.bodyBold, color: colors.heading, marginBottom: spacing.sm },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    checkText: { ...typography.body, color: colors.text },
    emptyText: { ...typography.body, color: colors.textLight, fontStyle: 'italic' },
    editLabel: { ...typography.bodyBold, color: colors.heading, marginBottom: spacing.xs, marginTop: spacing.md },
    editInput: {
      backgroundColor: colors.bgInput,
      borderRadius: radius.lg, padding: spacing.md,
      ...typography.body, color: colors.heading, borderWidth: 0,
    },
    editInputMultiline: { minHeight: 80, textAlignVertical: 'top' },
    editCheckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    editCheckInput: {
      flex: 1, backgroundColor: colors.bgInput,
      borderRadius: radius.lg, padding: spacing.sm, paddingHorizontal: spacing.md,
      ...typography.body, color: colors.heading, borderWidth: 0,
    },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.xl },
    cancelBtn: {
      paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
      borderRadius: radius.xl, borderWidth: 1, borderColor: colors.textLight,
    },
    cancelBtnText: { ...typography.body, color: colors.textLight },
    saveBtn: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
      borderRadius: radius.xl, backgroundColor: colors.primary,
    },
    saveBtnText: { ...typography.bodyBold, color: colors.white },
  }), [colors, isDark]);
}
