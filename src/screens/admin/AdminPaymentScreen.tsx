import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, Input, SystemButton, AppDialog, GlassChip } from '../../components';
import type { DialogButton } from '../../components';
import { hapticSuccess, hapticLight } from '../../utils/haptics';
import { spacing, typography, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { fetchProjectStages, recordPayment, fetchProjectPayments } from '../../services/projectService';
import type { Stage } from '../../types';

import type { ThemeColors } from '../../theme/colors';
import type { GlassTokens } from '../../theme/glass';

type PaymentMethod = 'cash' | 'transfer' | 'card';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Наличные',
  transfer: 'Перевод',
  card: 'Карта',
};

const METHOD_ICONS: Record<PaymentMethod, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  transfer: 'swap-horizontal-outline',
  card: 'card-outline',
};

interface PaymentRecord {
  id: string;
  stage_id?: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
  created_at: string;
}

// Mock stages for dev
const MOCK_STAGES: Stage[] = [
  { id: 'st-1', project_id: 'mock-p4', title: 'Демонтаж', order_index: 1, status: 'approved' },
  { id: 'st-2', project_id: 'mock-p4', title: 'Электрика (черновая)', order_index: 2, status: 'approved' },
  { id: 'st-3', project_id: 'mock-p4', title: 'Сантехника (черновая)', order_index: 3, status: 'in_progress' },
  { id: 'st-4', project_id: 'mock-p4', title: 'Стяжка пола', order_index: 4, status: 'pending' },
];

const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 'pay-1', stage_id: 'st-1', amount: 25000, method: 'transfer', created_at: '2026-03-01T10:00:00Z' },
  { id: 'pay-2', stage_id: 'st-2', amount: 45000, method: 'cash', note: 'Частичная оплата', created_at: '2026-03-10T14:00:00Z' },
];

export function AdminPaymentScreen({ route, navigation }: any) {
  const { colors, glass, isDark } = useTheme();
  const styles = useAdminPaymentStyles(colors, glass, isDark);
  const { projectId } = route.params;
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const isDev = user?.id.startsWith('dev-');

  const [stages, setStages] = useState<Stage[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isDev) {
        setStages(MOCK_STAGES);
        setPayments(MOCK_PAYMENTS);
      } else {
        const [stagesData, paymentsData] = await Promise.all([
          fetchProjectStages(projectId),
          fetchProjectPayments(projectId),
        ]);
        setStages(stagesData);
        setPayments(paymentsData as PaymentRecord[]);
      }
    } catch {
      setStages(MOCK_STAGES);
      setPayments(MOCK_PAYMENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Введите сумму', 'error');
      return;
    }

    setDialogTitle('Подтвердить оплату?');
    setDialogMessage(
      `Сумма: ${parsedAmount.toLocaleString('ru-RU')} ₽\nСпособ: ${METHOD_LABELS[method]}${selectedStage ? `\nЭтап: ${stages.find((s) => s.id === selectedStage)?.title}` : ''}`,
    );
    setDialogButtons([
      {
        text: 'Подтвердить',
        onPress: async () => {
          setSaving(true);
          try {
            if (!isDev) {
              await recordPayment({
                project_id: projectId,
                stage_id: selectedStage || undefined,
                amount: parsedAmount,
                method,
                recorded_by: user!.id,
                note: note.trim() || undefined,
              });
            }
            const newPayment: PaymentRecord = {
              id: `pay-${Date.now()}`,
              stage_id: selectedStage || undefined,
              amount: parsedAmount,
              method,
              note: note.trim() || undefined,
              created_at: new Date().toISOString(),
            };
            setPayments((prev) => [newPayment, ...prev]);
            setAmount('');
            setNote('');
            setSelectedStage(null);
            hapticSuccess();
            showToast('Оплата зафиксирована', 'success');
          } catch {
            showToast('Ошибка при сохранении', 'error');
          } finally {
            setSaving(false);
          }
        },
      },
      { text: 'Отмена', style: 'cancel', onPress: () => {} },
    ]);
    setDialogVisible(true);
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.backRow}>
        <SystemButton type="back" onPress={() => navigation.goBack()} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Оплата</Text>
        <Text style={styles.subtitle}>
          Всего оплачено: {totalPaid.toLocaleString('ru-RU')} ₽
        </Text>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Новая оплата</Text>

          <Text style={styles.fieldLabel}>Этап (необязательно)</Text>
          <View style={styles.stagesList}>
            {stages.map((stage) => (
              <Pressable
                key={stage.id}
                onPress={() => {
                  setSelectedStage(selectedStage === stage.id ? null : stage.id);
                  hapticLight();
                }}
              >
                <GlassChip
                  label={`${stage.order_index}. ${stage.title}`}
                  active={selectedStage === stage.id}
                />
              </Pressable>
            ))}
          </View>

          <Input placeholder="Сумма, ₽" value={amount} onChangeText={setAmount} keyboardType="numeric" />

          <Text style={styles.fieldLabel}>Способ оплаты</Text>
          <View style={styles.methodRow}>
            {(['cash', 'transfer', 'card'] as PaymentMethod[]).map((m) => (
              <Pressable
                key={m}
                style={[styles.methodCard, method === m && styles.methodCardActive]}
                onPress={() => { setMethod(m); hapticLight(); }}
              >
                <Ionicons name={METHOD_ICONS[m]} size={20} color={method === m ? colors.primary : colors.textLight} />
                <Text style={[styles.methodLabel, method === m && styles.methodLabelActive]}>{METHOD_LABELS[m]}</Text>
              </Pressable>
            ))}
          </View>

          <Input placeholder="Примечание (необязательно)" value={note} onChangeText={setNote} />

          <Button
            title={saving ? 'Сохранение...' : 'Зафиксировать оплату'}
            onPress={handleSave}
            loading={saving}
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </Card>

        {payments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>История оплат</Text>
            {payments.map((payment) => {
              const stage = stages.find((s) => s.id === payment.stage_id);
              return (
                <Card key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentRow}>
                    <Ionicons name={METHOD_ICONS[payment.method]} size={20} color={colors.primary} />
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>{payment.amount.toLocaleString('ru-RU')} ₽</Text>
                      <Text style={styles.paymentMeta}>
                        {METHOD_LABELS[payment.method]}
                        {stage ? ` · ${stage.title}` : ''}
                      </Text>
                      {payment.note && <Text style={styles.paymentNote}>{payment.note}</Text>}
                    </View>
                    <Text style={styles.paymentDate}>{new Date(payment.created_at).toLocaleDateString('ru-RU')}</Text>
                  </View>
                </Card>
              );
            })}
          </>
        )}
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

function useAdminPaymentStyles(colors: ThemeColors, glass: GlassTokens, isDark: boolean) {
  return useMemo(() => StyleSheet.create({
    container: { paddingBottom: 24 },
    backRow: { flexDirection: 'row', marginTop: spacing.sm, marginBottom: spacing.md },
    title: { ...typography.h1, color: colors.heading },
    subtitle: { ...typography.body, color: colors.gold, fontWeight: '600', marginTop: 2, marginBottom: spacing.lg },
    formCard: { marginBottom: spacing.xxl },
    sectionTitle: { ...typography.h3, color: colors.heading, marginBottom: spacing.md },
    fieldLabel: { ...typography.small, color: colors.textLight, marginBottom: spacing.xs, marginTop: spacing.md },
    stagesList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    methodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    methodCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      backgroundColor: glass.fill.regular,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: glass.border.light,
      gap: spacing.xs,
    },
    methodCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    methodLabel: { ...typography.small, color: colors.textLight, fontWeight: '500' },
    methodLabelActive: { color: colors.primary, fontWeight: '600' },
    paymentCard: { marginBottom: spacing.sm },
    paymentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    paymentInfo: { flex: 1 },
    paymentAmount: { ...typography.bodyBold, color: colors.heading },
    paymentMeta: { ...typography.small, color: colors.textLight, marginTop: 2 },
    paymentNote: { ...typography.small, color: colors.text, fontStyle: 'italic', marginTop: 4 },
    paymentDate: { ...typography.small, color: colors.textLight },
  }), [colors, glass, isDark]);
}
