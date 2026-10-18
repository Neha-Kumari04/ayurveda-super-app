import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { humanizeApiError } from '@/core/api/errors';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';

export interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export const ErrorState = memo(function ({ error, title, onRetry, retrying }: ErrorStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.icon} accessibilityElementsHidden>
        ⚠️
      </Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title ?? 'Something went wrong'}</Text>
      <Text style={[styles.message, { color: theme.colors.textMuted }]}>{humanizeApiError(error)}</Text>
      {onRetry ? (
        <Button label="Retry" onPress={onRetry} variant="secondary" loading={retrying} style={styles.button} />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  icon: { fontSize: 36, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  button: { marginTop: 12 },
});
