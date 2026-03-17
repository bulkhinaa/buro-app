import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper, Button, GlassView, AppDialog } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';

export function MasterOfferDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.show);

  const {
    offerId,
    projectTitle,
    stageTitle,
    address,
    matchScore,
    clientName,
  } = route.params || {};

  const [responding, setResponding] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const isDevUser = user?.id?.startsWith('dev-');

  const handleAccept = useCallback(async () => {
    setResponding(true);

    if (isDevUser) {
      setTimeout(() => {
        showToast('Предложение принято!', 'success');
        setResponding(false);
        navigation.goBack();
      }, 1000);
      return;
    }

    try {
      const { error } = await supabase
        .from('master_offers')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      if (error) throw error;

      // Notify client
      const { data: offer } = await supabase
        .from('master_offers')
        .select('offered_by')
        .eq('id', offerId)
        .single();

      if (offer?.offered_by) {
        await supabase.functions.invoke('send-push', {
          body: {
            userIds: [offer.offered_by],
            title: 'Мастер принял предложение',
            body: `${user?.name} принял предложение на этапе "${stageTitle}"`,
            data: { type: 'master_accepted', offerId },
          },
        });
      }

      showToast('Предложение принято!', 'success');
      navigation.goBack();
    } catch {
      showToast('Ошибка при принятии', 'error');
    } finally {
      setResponding(false);
    }
  }, [offerId, isDevUser, stageTitle, user, navigation, showToast]);

  const handleDecline = useCallback(async () => {
    setResponding(true);
    setShowDeclineDialog(false);

    if (isDevUser) {
      setTimeout(() => {
        showToast('Предложение отклонено', 'info');
        setResponding(false);
        navigation.goBack();
      }, 1000);
      return;
    }

    try {
      const { error } = await supabase
        .from('master_offers')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      if (error) throw error;

      // Notify client
      const { data: offer } = await supabase
        .from('master_offers')
        .select('offered_by')
        .eq('id', offerId)
        .single();

      if (offer?.offered_by) {
        await supabase.functions.invoke('send-push', {
          body: {
            userIds: [offer.offered_by],
            title: 'Мастер отклонил предложение',
            body: `${user?.name} отклонил предложение на этапе "${stageTitle}"`,
            data: { type: 'master_declined', offerId },
          },
        });
      }

      showToast('Предложение отклонено', 'info');
      navigation.goBack();
    } catch {
      showToast('Ошибка при отклонении', 'error');
    } finally {
      setResponding(false);
    }
  }, [offerId, isDevUser, stageTitle, user, navigation, showToast]);

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
          <Text style={styles.title}>Предложение</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Offer card */}
        <GlassView style={styles.offerCard}>
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>Совпадение {matchScore || 0}%</Text>
          </View>

          <Text style={styles.projectTitle}>{projectTitle || 'Проект'}</Text>
          <Text style={styles.stageLabel}>{stageTitle || 'Этап'}</Text>

          {address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textLight} />
              <Text style={styles.infoText}>{address}</Text>
            </View>
          )}

          {clientName && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={colors.textLight} />
              <Text style={styles.infoText}>Клиент: {clientName}</Text>
            </View>
          )}
        </GlassView>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Принять предложение"
            onPress={handleAccept}
            loading={responding}
            style={styles.acceptBtn}
          />
          <Button
            title="Отклонить"
            variant="outline"
            onPress={() => setShowDeclineDialog(true)}
            loading={responding}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <AppDialog
        visible={showDeclineDialog}
        title="Отклонить предложение?"
        message="Клиент будет уведомлён. Вы сможете получить новые предложения позже."
        onClose={() => setShowDeclineDialog(false)}
        buttons={[
          { text: 'Отмена', style: 'cancel', onPress: () => setShowDeclineDialog(false) },
          { text: 'Отклонить', style: 'destructive', onPress: handleDecline },
        ]}
      />
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
    marginBottom: spacing.xl,
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
  offerCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  matchBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  stageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
  },
  actions: {
    gap: spacing.md,
  },
  acceptBtn: {
    marginBottom: 0,
  },
});
