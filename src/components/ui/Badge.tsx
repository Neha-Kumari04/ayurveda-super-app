import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

export const Badge = memo(function ({ label, tone = 'neutral', size = 'md' }: BadgeProps) {
  const theme = useTheme();

  const palette = {
    neutral: { bg: theme.colors.skeleton, fg: theme.colors.textSecondary },
    success: { bg: theme.colors.successMuted, fg: theme.colors.success },
    warning: { bg: theme.colors.warningMuted, fg: theme.colors.warning },
    danger: { bg: theme.colors.dangerMuted, fg: theme.colors.danger },
    info: { bg: theme.colors.infoMuted, fg: theme.colors.info },
  }[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg },
        size === 'sm' ? styles.sm : styles.md,
      ]}
      accessibilityRole="text"
    >
      <Text style={[styles.label, { color: palette.fg, fontSize: size === 'sm' ? 10 : 12 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: { borderRadius: 999, alignSelf: 'flex-start' },
  sm: { paddingVertical: 2, paddingHorizontal: 7 },
  md: { paddingVertical: 4, paddingHorizontal: 10 },
  label: { fontWeight: '600' },
});
