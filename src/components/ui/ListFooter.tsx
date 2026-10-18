import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface ListFooterProps {
  loading: boolean;
  hasMore: boolean;
  endMessage?: string;
}

/** Footer for FlatLists that pages in more data (infinite scroll indicator). */
export const ListFooter = memo(function ({ loading, hasMore, endMessage = 'You’re all caught up' }: ListFooterProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>Loading more…</Text>
      </View>
    );
  }

  if (!hasMore) {
    return (
      <View style={styles.container}>
        <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>{endMessage}</Text>
      </View>
    );
  }

  return <View style={styles.spacer} />;
});

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 },
  line: { width: 48, height: StyleSheet.hairlineWidth, marginBottom: 4 },
  text: { fontSize: 13 },
  spacer: { height: 24 },
});
