import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Rating } from '@/components/ui/Rating';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

import type { Product } from '@/modules/shop/types';

export interface SimilarSectionProps {
  items: Product[];
  onSelect: (product: Product) => void;
}

/**
 * "You might also like" — vertical card list shown on product detail.
 */
export const SimilarSection = memo(function ({ items, onSelect }: SimilarSectionProps) {
  const theme = useTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
        You might also like
      </Text>
      {items.map((item) => {
        const discount = Math.round(((item.mrp - item.price) / item.mrp) * 100);
        return (
          <Card
            key={item.id}
            style={styles.card}
            onPress={() => onSelect(item)}
            accessibilityLabel={`${item.name}, ${formatCurrency(item.price)}`}
          >
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Rating value={item.rating} count={item.reviewCount} size="sm" />
              </View>
              <View style={styles.priceCol}>
                <Text style={[styles.price, { color: theme.colors.text }]}>{formatCurrency(item.price)}</Text>
                {discount > 0 ? (
                  <Text style={[styles.discount, { color: theme.colors.success }]}>{discount}% off</Text>
                ) : null}
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '600' },
  priceCol: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 15, fontWeight: '800' },
  discount: { fontSize: 11, fontWeight: '600' },
});
