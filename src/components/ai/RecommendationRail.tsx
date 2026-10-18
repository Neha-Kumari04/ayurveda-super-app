import React, { memo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/modules/shop/components/ProductCard';
import { useTheme } from '@/theme/ThemeProvider';

import type { Product } from '@/modules/shop/types';

export interface RecommendationRailProps {
  title: string;
  subtitle?: string;
  items: Product[];
  onSelect: (product: Product) => void;
}

/**
 * Horizontal "You might like" / "Top Rated" rail shown above product grids.
 * Uses the same memoised ProductCard as the main list for consistent perf.
 */
export const RecommendationRail = memo(function ({
  title,
  subtitle,
  items,
  onSelect,
}: RecommendationRailProps) {
  const theme = useTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ProductCard product={item} onPress={onSelect} layout="row" />
          </View>
        )}
        initialNumToRender={4}
        windowSize={3}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingBottom: 4 },
  header: { paddingHorizontal: 16 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: -2 },
  list: { paddingHorizontal: 12, gap: 8 },
  cardWrap: { width: 240 },
});
