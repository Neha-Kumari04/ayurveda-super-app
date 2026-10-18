import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
}

export const Rating = memo(function ({ value, count, size = 'md' }: RatingProps) {
  const theme = useTheme();
  const fontSize = size === 'sm' ? 12 : 14;

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={`Rated ${value} out of 5`}>
      <Text style={[styles.star, { color: theme.colors.warning, fontSize }]}>★</Text>
      <Text style={[styles.value, { color: theme.colors.text, fontSize }]}>{value.toFixed(1)}</Text>
      {count !== undefined ? (
        <Text style={[styles.count, { color: theme.colors.textMuted, fontSize: fontSize - 1 }]}>({count})</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  star: { fontWeight: '700' },
  value: { fontWeight: '600' },
  count: { marginLeft: 2 },
});
