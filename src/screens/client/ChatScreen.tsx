import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';
import { ChatMessage } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useChatStore, DEV_SENDER_NAMES } from '../../store/chatStore';

// Stable reference to avoid infinite re-renders in Zustand selector (BUG-14)
const EMPTY_MESSAGES: ChatMessage[] = [];

type Props = {
  route?: any;
};

export function ChatScreen({ route }: Props) {
  const { user } = useAuthStore();
  const { loadMessages, sendMessage: storeSendMessage, getMessages, isLoading } = useChatStore();

  const projectId = route?.params?.projectId || 'proj-1';
  const channelId = route?.params?.channelId || 'stage_mt-1';

  const messages = useChatStore((s) => s.messages[channelId] ?? EMPTY_MESSAGES);

  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages(channelId, projectId);
  }, [channelId, projectId]);

  const handleSend = () => {
    if (!message.trim() || !user) return;
    storeSendMessage(channelId, projectId, user.id, message);
    setMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.sender_id === user?.id;
    // Look up sender name — dev mode uses static map, prod would join with profiles
    const senderName = !isOwn
      ? DEV_SENDER_NAMES[item.sender_id] || item.sender_id
      : '';

    return (
      <View style={[styles.msgContainer, isOwn && styles.msgContainerOwn]}>
        {!isOwn && <Text style={styles.senderName}>{senderName}</Text>}
        <View style={[styles.msgBubble, isOwn && styles.msgBubbleOwn]}>
          <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>
            {item.text}
          </Text>
          <Text style={[styles.msgTime, isOwn && styles.msgTimeOwn]}>
            {new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Сообщение..."
            placeholderTextColor={colors.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  messagesList: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
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
  },
  msgTimeOwn: {
    color: 'rgba(255,255,255,0.6)',
  },
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
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textBright,
    ...typography.body,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
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
  sendBtnText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
});
