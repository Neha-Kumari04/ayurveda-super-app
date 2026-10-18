import React, { memo } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

const BLURHASH = 'L2As*|00_39G00_300of00WB';

export interface ProductImageProps {
  uri: string;
  size?: number;
  borderRadius?: number;
  accessibilityLabel?: string;
}

export const ProductImage = memo(function ({
  uri,
  size = 120,
  borderRadius = 12,
  accessibilityLabel,
}: ProductImageProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius, backgroundColor: theme.colors.borderLight },
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={BLURHASH}
        transition={200}
        cachePolicy="memory-disk"
        priority="low"
      />
    </View>
  );
});

export interface ProductCardProps {
  product: import('../types').Product;
  onPress: (product: import('../types').Product) => void;
  onToggleWishlist?: (productId: string) => void;
  inWishlist?: boolean;
  /** 'grid' for 2-column listing, 'row' for vertical stacks. */
  layout?: 'grid' | 'row';
}

/** Memoised product tile — the hot path for 20k-product virtualised lists. */
export const ProductCard = memo(function ({
  product,
  onPress,
  onToggleWishlist,
  inWishlist = false,
  layout = 'grid',
}: ProductCardProps) {
  const theme = useTheme();
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <PressableScale
      onPress={() => onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatCurrency(product.price)}`}
      activeScale={0.96}
      style={[
        layout === 'grid' ? styles.grid : styles.row,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
        theme.shadows.card,
      ]}
    >
      <ProductImage uri={product.imageUrl} size={layout === 'grid' ? 120 : 88} accessibilityLabel={product.name} />
      <View style={styles.info}>
        <View style={styles.badgeRow}>
          <Text style={[styles.brand, { color: theme.colors.primary }]} numberOfLines={1}>
            {product.brand}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.colors.text }]}>{formatCurrency(product.price)}</Text>
          {discount > 0 ? (
            <>
              <Text style={[styles.mrp, { color: theme.colors.textMuted }]}>{formatCurrency(product.mrp)}</Text>
              <Text style={[styles.discount, { color: theme.colors.success }]}>{discount}% off</Text>
            </>
          ) : null}
        </View>
        {!product.inStock ? (
          <Text style={[styles.outOfStock, { color: theme.colors.danger }]}>Out of stock</Text>
        ) : (
          <View style={[styles.verifiedPill, { backgroundColor: theme.colors.primaryMuted }]}>
            <Text style={[styles.verifiedPillText, { color: theme.colors.primary }]}>Ayush Certified</Text>
          </View>
        )}
      </View>
      {onToggleWishlist ? (
        <Pressable
          onPress={() => onToggleWishlist(product.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          style={styles.wish}
        >
          <Text style={{ fontSize: 16, color: inWishlist ? theme.colors.danger : theme.colors.textMuted }}>
            {inWishlist ? '♥' : '♡'}
          </Text>
        </Pressable>
      ) : null}
    </PressableScale>
  );
});


const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  grid: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    marginBottom: 10,
  },
  info: { flex: 1, gap: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  name: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  price: { fontSize: 15, fontWeight: '800' },
  mrp: { fontSize: 12, textDecorationLine: 'line-through' },
  discount: { fontSize: 12, fontWeight: '700' },
  outOfStock: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  verifiedPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  verifiedPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  wish: { position: 'absolute', top: 8, right: 8, padding: 4 },
});

