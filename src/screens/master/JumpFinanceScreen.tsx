import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, Input } from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useMasterStore } from '../../store/masterStore';
import { useToastStore } from '../../store/toastStore';
import { hapticSuccess } from '../../utils/haptics';
import { supabase } from '../../lib/supabase';

const REQUIREMENTS = [
  { icon: 'document-text-outline' as const, text: 'ИНН (12 цифр)' },
  { icon: 'phone-portrait-outline' as const, text: 'Приложение «Мой налог» (установлено)' },
  { icon: 'shield-checkmark-outline' as const, text: 'Статус самозанятого в ФНС' },
];

const PENDING_STEPS = [
  { step: '1', text: 'Откройте приложение «Мой налог»' },
  { step: '2', text: 'Перейдите в раздел «Партнёры»' },
  { step: '3', text: 'Примите приглашение от «Jump.Работа»' },
];

export function JumpFinanceScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const profile = useMasterStore((s) => s.profile);
  const updateProfile = useMasterStore((s) => s.updateProfile);
  const setVerificationStatus = useMasterStore((s) => s.setVerificationStatus);
  const showToast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [inn, setInn] = useState('');
  const [innError, setInnError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = profile?.verification_status || 'none';

  const callJumpFunction = async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('jump-finance', {
      body: { action, ...payload },
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const validateInn = (value: string): boolean => {
    const clean = value.replace(/\s/g, '');
    if (!/^\d{12}$/.test(clean)) {
      setInnError('ИНН должен содержать 12 цифр');
      return false;
    }
    setInnError('');
    return true;
  };

  const handleStartVerification = async () => {
    if (!validateInn(inn)) return;

    setLoading(true);
    try {
      // Create contractor in Jump Finance
      const createRes = await callJumpFunction('create_contractor', {
        name: user?.name || 'Мастер',
        phone: user?.phone || '',
        inn: inn.replace(/\s/g, ''),
      });

      if (createRes.error) {
        showToast(createRes.error, 'error');
        setLoading(false);
        return;
      }

      const contractorId = createRes.contractor_id;
      await updateProfile({ jump_contractor_id: contractorId });
      await setVerificationStatus('pending');
      showToast('Регистрация прошла успешно! Примите приглашение в «Мой налог»', 'success');
      hapticSuccess();
    } catch (err: any) {
      showToast(err.message || 'Ошибка при регистрации', 'error');
    }
    setLoading(false);
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const contractorId = profile?.jump_contractor_id;
      if (!contractorId) {
        showToast('ID подрядчика не найден', 'error');
        setLoading(false);
        return;
      }

      const res = await callJumpFunction('check_status', { contractor_id: contractorId });

      if (res.error) {
        showToast(res.error, 'error');
        setLoading(false);
        return;
      }

      await setVerificationStatus(res.status);

      if (res.status === 'approved') {
        showToast('Верификация пройдена!', 'success');
        hapticSuccess();
      } else if (res.status === 'rejected') {
        showToast(res.reason || 'Верификация отклонена', 'error');
      } else {
        showToast(res.reason || 'Ожидание подтверждения в «Мой налог»', 'info');
      }
    } catch {
      showToast('Ошибка при проверке статуса', 'error');
    }
    setLoading(false);
  };

  const handleRetry = async () => {
    await setVerificationStatus('none');
    await updateProfile({ jump_contractor_id: null });
    setInn('');
    setInnError('');
  };

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* ── None — start verification ── */}
        {status === 'none' && (
          <>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Стать самозанятым</Text>
            <Text style={styles.description}>
              Для получения заказов необходимо зарегистрироваться как самозанятый через Jump Finance.
              Это позволит легально получать оплату за работу.
            </Text>

            <Card style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>Что понадобится:</Text>
              {REQUIREMENTS.map((req, i) => (
                <View key={i} style={styles.requirementRow}>
                  <View style={styles.requirementIconCircle}>
                    <Ionicons name={req.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.requirementText}>{req.text}</Text>
                </View>
              ))}
            </Card>

            <View style={styles.innInputContainer}>
              <Input
                label="ИНН"
                showLabel
                placeholder="Введите ваш ИНН (12 цифр)"
                value={inn}
                onChangeText={(text) => {
                  // Allow only digits
                  const digits = text.replace(/\D/g, '').slice(0, 12);
                  setInn(digits);
                  if (innError) setInnError('');
                }}
                error={innError}
                keyboardType="numeric"
                maxLength={12}
                leftIcon={
                  <Ionicons name="document-text-outline" size={20} color={colors.textLight} />
                }
              />
            </View>

            <Button
              title="Зарегистрироваться"
              onPress={handleStartVerification}
              loading={loading}
              disabled={inn.length < 12}
              fullWidth
              style={styles.actionButton}
            />
          </>
        )}

        {/* ── Pending — waiting for verification ── */}
        {status === 'pending' && (
          <>
            <View style={[styles.statusBanner, styles.pendingBanner]}>
              <Ionicons name="time-outline" size={32} color={colors.warning} />
              <Text style={[styles.statusTitle, { color: colors.warning }]}>
                Ожидание подтверждения
              </Text>
              <Text style={styles.statusText}>
                Вы зарегистрированы в Jump Finance. Теперь подтвердите партнёрство в приложении «Мой налог».
              </Text>
            </View>

            <Card style={styles.stepsCard}>
              <Text style={styles.requirementsTitle}>Как подтвердить:</Text>
              {PENDING_STEPS.map((item, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNumber}>{item.step}</Text>
                  </View>
                  <Text style={styles.stepText}>{item.text}</Text>
                </View>
              ))}
            </Card>

            {loading && (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
            )}

            <Button
              title="Проверить статус"
              onPress={handleCheckStatus}
              loading={loading}
              fullWidth
              style={styles.actionButton}
            />
          </>
        )}

        {/* ── Approved — verified ── */}
        {status === 'approved' && (
          <>
            <View style={[styles.statusBanner, styles.approvedBanner]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={[styles.statusTitle, { color: colors.success }]}>
                Вы верифицированы
              </Text>
              <Text style={styles.statusText}>
                Ваш статус самозанятого подтверждён. Вы можете получать заказы и принимать оплату.
              </Text>
            </View>

            <Card style={styles.badgeCard}>
              <View style={styles.badgeRow}>
                <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                <Text style={styles.badgeText}>Самозанятый</Text>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              </View>
            </Card>

            <Button
              title="Готово"
              onPress={() => navigation.goBack()}
              fullWidth
              style={styles.actionButton}
            />
          </>
        )}

        {/* ── Rejected — verification failed ── */}
        {status === 'rejected' && (
          <>
            <View style={[styles.statusBanner, styles.rejectedBanner]}>
              <Ionicons name="close-circle" size={48} color={colors.danger} />
              <Text style={[styles.statusTitle, { color: colors.danger }]}>
                Верификация отклонена
              </Text>
              <Text style={styles.statusText}>
                К сожалению, ваша заявка была отклонена. Убедитесь, что все данные заполнены корректно и попробуйте снова.
              </Text>
            </View>

            <Button
              title="Попробовать снова"
              onPress={handleRetry}
              fullWidth
              style={styles.actionButton}
            />
          </>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(123, 45, 62, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  requirementsCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  requirementsTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  requirementIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(123, 45, 62, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  innInputContainer: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  stepsCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    ...typography.bodyBold,
    color: '#fff',
    fontSize: 14,
  },
  stepText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  statusBanner: {
    width: '100%',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
  },
  pendingBanner: {
    backgroundColor: 'rgba(255, 149, 0, 0.06)',
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  approvedBanner: {
    backgroundColor: 'rgba(52, 199, 89, 0.06)',
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  rejectedBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  statusTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statusText: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  badgeCard: {
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeText: {
    ...typography.bodyBold,
    color: colors.success,
    flex: 1,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
