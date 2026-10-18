import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductImage } from './ProductCard';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

import type { Product } from '../types';

export interface CartItemRowProps {
  product: Product;
  quantity: number;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export const CartItemRow = memo(function ({
  product,
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <ProductImage uri={product.imageUrl} size={72} accessibilityLabel={product.name} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.brand, { color: theme.colors.textMuted }]}>{product.brand}</Text>
        <Text style={[styles.price, { color: theme.colors.text }]}>{formatCurrency(product.price)}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onRemove(product.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${product.name} from cart`}
        >
          <Text style={{ color: theme.colors.danger, fontSize: 15 }}>✕</Text>
        </Pressable>
        <View style={[styles.stepper, { borderColor: theme.colors.border }]}>
          <Pressable
            onPress={() => onDecrement(product.id)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Decrease quantity of ${product.name}`}
            style={styles.stepBtn}
          >
            <Text style={[styles.stepText, { color: theme.colors.text }]}>−</Text>
          </Pressable>
          <Text style={[styles.qty, { color: theme.colors.text }]} accessibilityLabel={`Quantity ${quantity}`}>
            {quantity}
          </Text>
          <Pressable
            onPress={() => onIncrement(product.id)}
            hitSlop={6}
            disabled={quantity >= 10}
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity of ${product.name}`}
            style={styles.stepBtn}
          >
            <Text style={[styles.stepText, { color: quantity >= 10 ? theme.colors.textMuted : theme.colors.text }]}>
              +
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  brand: { fontSize: 12 },
  price: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: 10 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  stepText: { fontSize: 16, fontWeight: '700' },
  qty: { fontSize: 14, fontWeight: '700', minWidth: 18, textAlign: 'center' },
});
