import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { logger } from '@/core/logger/logger';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  /** Rendered instead of the default fallback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Global error boundary. Catches render/runtime errors, logs them through the
 * crash-reporting abstraction and shows a recoverable fallback UI.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.error('Unhandled render error', {
      error,
      componentStack: info.componentStack ?? undefined,
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return <DefaultFallback error={error} onReset={this.reset} />;
  }
}

function DefaultFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={4}>
        {error.message}
      </Text>
      <Pressable
        onPress={onReset}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  message: { fontSize: 14, textAlign: 'center' },
  button: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { fontSize: 15, fontWeight: '600' },
});
