import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenWrapper,
  Button,
  TextArea,
  CellIndicator,
  CellFaq,
} from '../../components';
import { colors, spacing, radius, typography } from '../../theme';
import { useToastStore } from '../../store/toastStore';

const FAQ_DATA = [
  {
    question: 'Как долго длится типичный ремонт?',
    answer:
      'Сроки зависят от типа ремонта и площади. Косметический ремонт — 2-3 недели, стандартный — 1-2 месяца, капитальный — 2-4 месяца. Точные сроки рассчитываются после осмотра объекта супервайзером.',
  },
  {
    question: 'Кто такой супервайзер?',
    answer:
      'Супервайзер — это независимый специалист, который контролирует качество работ на каждом этапе. Он проверяет соответствие стандартам, принимает работы мастеров и защищает ваши интересы.',
  },
  {
    question: 'Как происходит оплата?',
    answer:
      'Оплата поэтапная — вы платите за каждый завершённый и принятый этап. Это гарантирует, что вы платите только за качественно выполненную работу.',
  },
  {
    question: 'Что делать, если качество работы не устраивает?',
    answer:
      'При приёмке каждого этапа вы можете отклонить работу и описать замечания. Мастер обязан исправить недочёты до повторной приёмки. Супервайзер контролирует процесс исправлений.',
  },
  {
    question: 'Можно ли отменить проект?',
    answer:
      'Да, вы можете отменить проект на любом этапе. Оплате подлежат только завершённые и принятые этапы работ. Свяжитесь с поддержкой для уточнения деталей.',
  },
];

export function SupportScreen() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      showToast('Введите текст сообщения', 'error');
      return;
    }
    setSending(true);
    try {
      // In production: send message to support API
      await new Promise((resolve) => setTimeout(resolve, 500));
      showToast('Сообщение отправлено. Ответим в течение 15 минут', 'success');
      setMessage('');
    } catch {
      showToast('Не удалось отправить сообщение', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@buroremontov.ru');
  };

  return (
    <ScreenWrapper scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Contact options */}
          <Text style={styles.sectionTitle}>Связаться с нами</Text>
          <View style={styles.contactCard}>
            <CellIndicator
              variant="card"
              icon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
              name="Email"
              value="support@br.ru"
              showChevron
              onPress={handleEmailSupport}
            />
          </View>

          {/* Write to support */}
          <Text style={styles.sectionTitle}>Написать в поддержку</Text>
          <TextArea
            placeholder="Опишите ваш вопрос или проблему..."
            value={message}
            onChangeText={setMessage}
            minHeight={100}
          />
          <Button
            title={sending ? 'Отправляем...' : 'Отправить'}
            onPress={handleSendMessage}
            loading={sending}
            fullWidth
          />

          {/* FAQ */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xxxl }]}>
            Частые вопросы
          </Text>
          {FAQ_DATA.map((faq, i) => (
            <CellFaq key={i} question={faq.question} answer={faq.answer} />
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.heading,
    marginBottom: spacing.lg,
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    padding: spacing.xs,
    marginBottom: spacing.xxl,
    // Glass shadow
    shadowColor: 'rgba(123, 45, 62, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
});
