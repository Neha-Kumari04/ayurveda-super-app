import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = memo(function ({
  title,
  description,
  icon = '🌿',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container} accessibilityRole="text">
      <Text style={styles.icon} accessibilityElementsHidden>
        {icon}
      </Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  icon: { fontSize: 40, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  description: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: 12 },
});
