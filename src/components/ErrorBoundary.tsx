/**
 * ErrorBoundary — catches unhandled React render errors.
 *
 * Logs the error to errorService (Supabase error_logs) and shows a fallback UI.
 * Wraps the entire app in App.tsx.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { logError } from '../services/errorService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError('ui_error', 'critical', 'Unknown', 'render_crash', error, {
      componentStack: info.componentStack || '',
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="warning-outline" size={64} color={colors.danger} />
            <Text style={styles.title}>Что-то пошло не так</Text>
            <Text style={styles.message}>
              Произошла непредвиденная ошибка. Мы уже знаем о ней и работаем над исправлением.
            </Text>
            <Pressable style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Попробовать снова</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    ...typography.h2,
    color: colors.heading,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 20,
  },
  buttonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
