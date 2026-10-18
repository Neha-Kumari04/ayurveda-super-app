import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export const SectionHeader = memo(function ({ title, subtitle, right }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  left: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13 },
});
