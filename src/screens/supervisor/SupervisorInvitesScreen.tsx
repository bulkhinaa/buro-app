import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Share,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card, Button, Input, AppDialog } from '../../components';
import type { DialogButton } from '../../components';
import { hapticSuccess } from '../../utils/haptics';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';

const BASE_URL = 'https://bulkhinaa.github.io/buro-app/';

interface Invite {
  id: string;
  code: string;
  invited_phone: string | null;
  invited_email: string | null;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  accepted_by: string | null;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (I,O,0,1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(invite: Invite): boolean {
  return invite.status === 'pending' && new Date(invite.expires_at) < new Date();
}

// ─── Mock data for dev users ─────────────────────────────────────────────────

const MOCK_INVITES: Invite[] = [
  {
    id: 'inv-1',
    code: 'AB3K7P',
    invited_phone: '+7 999 123-45-67',
    invited_email: null,
    status: 'accepted',
    created_at: '2026-03-01T10:00:00Z',
    expires_at: '2026-03-31T10:00:00Z',
    accepted_by: 'user-123',
  },
  {
    id: 'inv-2',
    code: 'XR9M4N',
    invited_phone: null,
    invited_email: 'master@example.com',
    status: 'pending',
    created_at: '2026-03-15T12:00:00Z',
    expires_at: '2026-04-14T12:00:00Z',
    accepted_by: null,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SupervisorInvitesScreen() {
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.show);
  const isDev = user?.id?.startsWith('dev-');

  const [invites, setInvites] = useState<Invite[]>(isDev ? MOCK_INVITES : []);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  // New invite form
  const [showForm, setShowForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<DialogButton[]>([]);

  // ─── Load invites ───────────────────────────────────────────────────────────

  const loadInvites = useCallback(async () => {
    if (!user || isDev) return;
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('supervisor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch {
      showToast('Ошибка загрузки приглашений', 'error');
    }
  }, [user, isDev]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvites();
    setRefreshing(false);
  };

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  // ─── Create invite ──────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);

    try {
      const code = generateCode();

      if (isDev) {
        // Local mock
        const newInvite: Invite = {
          id: `inv-${Date.now()}`,
          code,
          invited_phone: invitePhone.trim() || null,
          invited_email: inviteEmail.trim() || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_by: null,
        };
        setInvites((prev) => [newInvite, ...prev]);
      } else {
        const { error } = await supabase.from('invites').insert({
          code,
          supervisor_id: user.id,
          invited_phone: invitePhone.trim() || null,
          invited_email: inviteEmail.trim() || null,
        });
        if (error) throw error;

        // Send invite email if email provided
        if (inviteEmail.trim()) {
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: inviteEmail.trim(),
                type: 'invite',
                data: {
                  supervisor_name: user.name || 'Супервайзер',
                  invite_url: `${BASE_URL}?invite=${code}`,
                },
              },
            });
          } catch {
            // Non-critical — invite still created
          }
        }

        await loadInvites();
      }

      // Share link
      const inviteUrl = `${BASE_URL}?invite=${code}`;
      const inviteText = `Присоединяйся к платформе «Бюро ремонтов» как мастер!\n\nРегистрируйся: ${inviteUrl}`;

      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(inviteText);
        showToast('Приглашение создано, ссылка скопирована', 'success');
      } else {
        showToast('Приглашение создано', 'success');
        try {
          await Share.share({ message: inviteText });
        } catch {
          // User cancelled
        }
      }

      hapticSuccess();
      setShowForm(false);
      setInviteEmail('');
      setInvitePhone('');
    } catch {
      showToast('Ошибка создания приглашения', 'error');
    } finally {
      setCreating(false);
    }
  };

  // ─── Share existing invite ──────────────────────────────────────────────────

  const handleShare = async (invite: Invite) => {
    const inviteUrl = `${BASE_URL}?invite=${invite.code}`;
    const inviteText = `Присоединяйся к платформе «Бюро ремонтов» как мастер!\n\nРегистрируйся: ${inviteUrl}`;

    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(inviteText);
      showToast('Ссылка скопирована', 'success');
    } else {
      try {
        await Share.share({ message: inviteText });
      } catch {
        // Cancelled
      }
    }
  };

  // ─── Render invite card ─────────────────────────────────────────────────────

  const renderInvite = ({ item }: { item: Invite }) => {
    const expired = isExpired(item);
    const status = expired ? 'expired' : item.status;

    const statusConfig = {
      pending: { label: 'Ожидание', color: colors.accent, bg: 'rgba(197,165,90,0.12)' },
      accepted: { label: 'Принято', color: colors.success, bg: 'rgba(52,199,89,0.12)' },
      expired: { label: 'Истекло', color: colors.textLight, bg: 'rgba(136,136,136,0.12)' },
    };

    const cfg = statusConfig[status];

    return (
      <Card style={[styles.inviteCard, expired && styles.expiredCard]}>
        <View style={styles.cardTop}>
          {/* Code */}
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Contact info */}
        {(item.invited_email || item.invited_phone) && (
          <View style={styles.contactRow}>
            {item.invited_email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={13} color={colors.textLight} />
                <Text style={styles.contactText}>{item.invited_email}</Text>
              </View>
            )}
            {item.invited_phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={13} color={colors.textLight} />
                <Text style={styles.contactText}>{item.invited_phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {formatDate(item.created_at)}
            {status === 'pending' && ` · до ${formatDate(item.expires_at)}`}
          </Text>

          {status === 'pending' && (
            <Pressable
              onPress={() => handleShare(item)}
              style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="share-outline" size={16} color={colors.primary} />
              <Text style={styles.shareBtnText}>Поделиться</Text>
            </Pressable>
          )}
        </View>
      </Card>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const pendingCount = invites.filter((i) => i.status === 'pending' && !isExpired(i)).length;
  const acceptedCount = invites.filter((i) => i.status === 'accepted').length;

  return (
    <ScreenWrapper>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.accent }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Ожидают</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.success }]}>{acceptedCount}</Text>
          <Text style={styles.statLabel}>Приняли</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{invites.length}</Text>
          <Text style={styles.statLabel}>Всего</Text>
        </View>
      </View>

      {/* New invite form */}
      {showForm ? (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Новое приглашение</Text>
          <Input
            placeholder="Email мастера (необязательно)"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textLight} />}
          />
          <Input
            placeholder="Телефон мастера (необязательно)"
            value={invitePhone}
            onChangeText={setInvitePhone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color={colors.textLight} />}
          />
          <View style={styles.formActions}>
            <Button
              title={creating ? 'Создаём...' : 'Создать и отправить'}
              onPress={handleCreate}
              loading={creating}
              style={{ flex: 1 }}
            />
            <Button
              title="Отмена"
              variant="outline"
              onPress={() => { setShowForm(false); setInviteEmail(''); setInvitePhone(''); }}
              style={{ flex: 0.5 }}
            />
          </View>
          <Text style={styles.formHint}>
            Будет создана уникальная ссылка для регистрации. Если указан email — отправим приглашение.
          </Text>
        </Card>
      ) : (
        <Button
          title="Новое приглашение"
          onPress={() => setShowForm(true)}
          fullWidth
          icon={<Ionicons name="add-circle-outline" size={18} color={colors.white} />}
          style={{ marginBottom: spacing.lg }}
        />
      )}

      {/* Invites list */}
      <FlatList
        data={invites}
        keyExtractor={(i) => i.id}
        renderItem={renderInvite}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="person-add-outline" size={48} color={colors.primary} />
            <Text style={styles.emptyTitle}>Нет приглашений</Text>
            <Text style={styles.emptySubtitle}>
              Создайте приглашение, чтобы привлечь мастеров на платформу
            </Text>
          </Card>
        }
      />

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  statNum: {
    ...typography.h1,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textLight,
  },

  formCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  formTitle: {
    ...typography.bodyBold,
    color: colors.heading,
    marginBottom: spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  formHint: {
    ...typography.caption,
    color: colors.textLight,
    lineHeight: 18,
  },

  listContent: {
    paddingBottom: 120,
    gap: spacing.sm,
  },

  inviteCard: {},
  expiredCard: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  codeBox: {
    backgroundColor: 'rgba(123,45,62,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },

  contactRow: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactText: {
    ...typography.small,
    color: colors.text,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...typography.caption,
    color: colors.textLight,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  shareBtnText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.bodyBold,
    color: colors.heading,
  },
  emptySubtitle: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
  },
});
