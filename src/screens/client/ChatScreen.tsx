import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography } from '../../theme';
import { ChatMessage } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useChatStore, DEV_SENDER_NAMES } from '../../store/chatStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';

// Stable reference to avoid infinite re-renders in Zustand selector (BUG-14)
const EMPTY_MESSAGES: ChatMessage[] = [];

type Props = {
  route?: any;
};

// Resolve sender display name
function getSenderName(senderId: string): string {
  return DEV_SENDER_NAMES[senderId] || senderId.slice(0, 8);
}

export function ChatScreen({ route }: Props) {
  const { user } = useAuthStore();
  const {
    loadMessages,
    sendMessage: storeSendMessage,
    editMessage: storeEditMessage,
    deleteMessage: storeDeleteMessage,
    subscribeRealtime,
    unsubscribeRealtime,
  } = useChatStore();

  const projectId = route?.params?.projectId || 'proj-1';

  const messages = useChatStore((s) => s.messages[projectId] ?? EMPTY_MESSAGES);
  const isLoading = useChatStore((s) => s.isLoading);

  const showToast = useToastStore((s) => s.show);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [contextMenuMsg, setContextMenuMsg] = useState<ChatMessage | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Load messages and subscribe to Realtime on mount
  useEffect(() => {
    loadMessages(projectId);
    subscribeRealtime(projectId);

    return () => {
      unsubscribeRealtime();
    };
  }, [projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length]);

  // ─── Send / Edit ───

  const handleSend = useCallback(() => {
    if (!text.trim() && !editingMessage) {
      showToast('Введите сообщение', 'error');
      return;
    }
    if (!user) return;

    if (editingMessage) {
      // Edit mode
      storeEditMessage(editingMessage.id, projectId, text);
      setEditingMessage(null);
      setText('');
      showToast('Сообщение изменено', 'success');
    } else {
      // Send mode
      storeSendMessage(
        projectId,
        user.id,
        text,
        undefined,
        replyTo?.id,
      );
      setText('');
      setReplyTo(null);
    }
  }, [text, user, projectId, editingMessage, replyTo]);

  // ─── Image picker & upload ───

  const handlePickImage = useCallback(async () => {
    if (!user) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      // For dev users, send with local URI directly
      if (user.id.startsWith('dev-')) {
        storeSendMessage(projectId, user.id, text.trim(), uri, replyTo?.id);
        setText('');
        setReplyTo(null);
        return;
      }

      // For real users, upload to Supabase Storage
      setIsUploading(true);
      try {
        const fileName = `chat/${projectId}/${Date.now()}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          showToast('Ошибка загрузки фото', 'error');
          setIsUploading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        storeSendMessage(
          projectId,
          user.id,
          text.trim(),
          urlData.publicUrl,
          replyTo?.id,
        );
        setText('');
        setReplyTo(null);
      } catch {
        showToast('Ошибка загрузки', 'error');
      }
      setIsUploading(false);
    } catch {
      showToast('Не удалось открыть галерею', 'error');
    }
  }, [user, projectId, text, replyTo]);

  // ─── Context menu actions ───

  const handleReply = useCallback(() => {
    if (!contextMenuMsg) return;
    setReplyTo(contextMenuMsg);
    setContextMenuMsg(null);
    inputRef.current?.focus();
  }, [contextMenuMsg]);

  const handleStartEdit = useCallback(() => {
    if (!contextMenuMsg) return;
    setEditingMessage(contextMenuMsg);
    setText(contextMenuMsg.text || '');
    setContextMenuMsg(null);
    setReplyTo(null);
    inputRef.current?.focus();
  }, [contextMenuMsg]);

  const handleDeleteMsg = useCallback(() => {
    if (!contextMenuMsg) return;
    storeDeleteMessage(contextMenuMsg.id, projectId);
    setContextMenuMsg(null);
    showToast('Сообщение удалено', 'info');
  }, [contextMenuMsg, projectId]);

  const cancelEditReply = useCallback(() => {
    setEditingMessage(null);
    setReplyTo(null);
    setText('');
  }, []);

  // ─── Message bubble ───

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isOwn = item.sender_id === user?.id;
      const senderName = !isOwn ? getSenderName(item.sender_id) : '';

      // Find replied message
      const repliedMsg = item.reply_to
        ? messages.find((m) => m.id === item.reply_to)
        : null;

      return (
        <Pressable
          onLongPress={() => setContextMenuMsg(item)}
          delayLongPress={400}
          style={[styles.msgContainer, isOwn && styles.msgContainerOwn]}
        >
          {!isOwn && <Text style={styles.senderName}>{senderName}</Text>}

          <View style={[styles.msgBubble, isOwn && styles.msgBubbleOwn]}>
            {/* Reply preview inside bubble */}
            {repliedMsg && (
              <View style={styles.replyInBubble}>
                <View style={[styles.replyBar, isOwn && styles.replyBarOwn]} />
                <View style={styles.replyInBubbleContent}>
                  <Text
                    style={[styles.replyInBubbleSender, isOwn && styles.replyInBubbleSenderOwn]}
                    numberOfLines={1}
                  >
                    {getSenderName(repliedMsg.sender_id)}
                  </Text>
                  <Text
                    style={[styles.replyInBubbleText, isOwn && styles.replyInBubbleTextOwn]}
                    numberOfLines={1}
                  >
                    {repliedMsg.text || '📷 Фото'}
                  </Text>
                </View>
              </View>
            )}

            {/* Image */}
            {item.image_url && (
              <Pressable onPress={() => setFullscreenImage(item.image_url!)}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.msgImage}
                  resizeMode="cover"
                />
              </Pressable>
            )}

            {/* Text */}
            {item.text ? (
              <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>
                {item.text}
              </Text>
            ) : null}

            {/* Time */}
            <Text style={[styles.msgTime, isOwn && styles.msgTimeOwn]}>
              {new Date(item.created_at).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </Pressable>
      );
    },
    [user?.id, messages],
  );

  const isOwnerOfContextMsg = contextMenuMsg?.sender_id === user?.id;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>
                {isLoading ? 'Загрузка...' : 'Начните диалог'}
              </Text>
            </View>
          }
        />

        {/* Reply / Edit bar */}
        {(replyTo || editingMessage) && (
          <View style={styles.actionBar}>
            <View style={styles.actionBarLeft}>
              <Ionicons
                name={editingMessage ? 'pencil' : 'arrow-undo'}
                size={16}
                color={colors.primary}
              />
              <View style={styles.actionBarContent}>
                <Text style={styles.actionBarTitle}>
                  {editingMessage
                    ? 'Редактирование'
                    : `Ответ ${getSenderName(replyTo!.sender_id)}`}
                </Text>
                <Text style={styles.actionBarPreview} numberOfLines={1}>
                  {(editingMessage || replyTo)?.text || '📷 Фото'}
                </Text>
              </View>
            </View>
            <Pressable onPress={cancelEditReply} hitSlop={12}>
              <Ionicons name="close" size={20} color={colors.textLight} />
            </Pressable>
          </View>
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          <Pressable
            style={styles.attachBtn}
            onPress={handlePickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
            )}
          </Pressable>

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
            ]}
            placeholder="Сообщение..."
            placeholderTextColor={colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />

          <Pressable
            style={[styles.sendBtn, !text.trim() && !editingMessage && styles.sendBtnDisabled]}
            onPress={handleSend}
          >
            <Ionicons
              name={editingMessage ? 'checkmark' : 'arrow-up'}
              size={20}
              color={colors.white}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ─── Context menu modal ─── */}
      <Modal
        visible={!!contextMenuMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setContextMenuMsg(null)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setContextMenuMsg(null)}
        >
          <View style={styles.menuCard}>
            <Pressable style={styles.menuItem} onPress={handleReply}>
              <Ionicons name="arrow-undo-outline" size={20} color={colors.text} />
              <Text style={styles.menuText}>Ответить</Text>
            </Pressable>

            {isOwnerOfContextMsg && (
              <>
                <View style={styles.menuDivider} />
                <Pressable style={styles.menuItem} onPress={handleStartEdit}>
                  <Ionicons name="pencil-outline" size={20} color={colors.text} />
                  <Text style={styles.menuText}>Редактировать</Text>
                </Pressable>
                <View style={styles.menuDivider} />
                <Pressable style={styles.menuItem} onPress={handleDeleteMsg}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <Text style={[styles.menuText, { color: colors.danger }]}>
                    Удалить
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ─── Fullscreen image viewer ─── */}
      <Modal
        visible={!!fullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <Pressable
          style={styles.fullscreenOverlay}
          onPress={() => setFullscreenImage(null)}
        >
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.fullscreenClose}>
            <Ionicons name="close-circle" size={36} color={colors.white} />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  messagesList: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
  },

  // ─── Message bubble ───
  msgContainer: {
    marginBottom: spacing.md,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  msgContainerOwn: {
    alignSelf: 'flex-end',
  },
  senderName: {
    ...typography.caption,
    color: colors.gold,
    marginBottom: 2,
    marginLeft: spacing.sm,
  },
  msgBubble: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderTopLeftRadius: 4,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgBubbleOwn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: 4,
  },
  msgText: {
    ...typography.body,
    color: colors.textBright,
  },
  msgTextOwn: {
    color: colors.white,
  },
  msgTime: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.xs,
    fontSize: 11,
  },
  msgTimeOwn: {
    color: 'rgba(255,255,255,0.6)',
  },
  msgImage: {
    width: 200,
    height: 150,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },

  // ─── Reply inside bubble ───
  replyInBubble: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  replyBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  replyBarOwn: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  replyInBubbleContent: {
    flex: 1,
  },
  replyInBubbleSender: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 1,
  },
  replyInBubbleSenderOwn: {
    color: 'rgba(255,255,255,0.8)',
  },
  replyInBubbleText: {
    ...typography.small,
    color: colors.textLight,
  },
  replyInBubbleTextOwn: {
    color: 'rgba(255,255,255,0.6)',
  },

  // ─── Reply / Edit action bar ───
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  actionBarContent: {
    flex: 1,
  },
  actionBarTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  actionBarPreview: {
    ...typography.small,
    color: colors.textLight,
  },

  // ─── Input row ───
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textBright,
    ...typography.body,
    maxHeight: 100,
    borderWidth: 0,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },

  // ─── Context menu ───
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuText: {
    ...typography.body,
    color: colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  // ─── Fullscreen image ───
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '80%',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
});
