import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ErrorState } from '@/components/ui/ErrorState';
import { Rating } from '@/components/ui/Rating';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/toast/ToastProvider';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

import { ProductImage } from '../components/ProductCard';
import { useProduct } from '../hooks';
import { selectCartCount, useCartStore } from '../store';

import type { ShopStackScreenProps } from '@/navigation/types';

type Props = ShopStackScreenProps<'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const productQuery = useProduct(productId);
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore(selectCartCount);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const wishlist = useCartStore((s) => s.wishlist);
  const inWishlist = wishlist.includes(productId);

  const onAddToCart = useCallback(() => {
    if (!productQuery.data) return;
    addItem(productId, 1);
    toast.success(`${productQuery.data.name} added to cart`);
  }, [addItem, productQuery.data, productId, toast]);

  const onBuyNow = useCallback(() => {
    if (!productQuery.data) return;
    addItem(productId, 1);
    navigation.navigate('Cart');
  }, [addItem, navigation, productQuery.data, productId]);

  if (productQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <Skeleton width="100%" height={260} radius={16} />
          <Skeleton width="70%" height={22} />
          <Skeleton width="40%" height={18} />
          <Skeleton width="100%" height={100} />
        </View>
      </View>
    );
  }

  if (productQuery.error || !productQuery.data) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <ErrorState error={productQuery.error} onRetry={() => void productQuery.refetch()} />
      </View>
    );
  }

  const product = productQuery.data;
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <ProductImage uri={product.imageUrl} size={280} borderRadius={16} accessibilityLabel={product.name} />
        <Text style={[styles.name, { color: theme.colors.text }]} accessibilityRole="header">
          {product.name}
        </Text>
        <View style={styles.metaRow}>
          <Rating value={product.rating} count={product.reviewCount} />
          <Badge label={product.form} tone="info" size="sm" />
          <Badge label={product.category} tone="neutral" size="sm" />
          {product.inStock ? <Badge label="In stock" tone="success" size="sm" /> : <Badge label="Out of stock" tone="danger" size="sm" />}
        </View>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.colors.text }]}>{formatCurrency(product.price)}</Text>
          {discount > 0 ? (
            <>
              <Text style={[styles.mrp, { color: theme.colors.textMuted }]}>{formatCurrency(product.mrp)}</Text>
              <Text style={[styles.discount, { color: theme.colors.success }]}>{discount}% off</Text>
            </>
          ) : null}
        </View>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{product.description}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('shop.ingredients')}</Text>
          <View style={styles.chipRow}>
            {product.ingredients.map((ingredient) => (
              <Chip key={ingredient} label={ingredient} size="sm" />
            ))}
          </View>
        </Card>

        {product.tags.length > 0 ? (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('shop.tags')}</Text>
            <View style={styles.chipRow}>
              {product.tags.map((tag) => (
                <Chip key={tag} label={tag} size="sm" selected />
              ))}
            </View>
          </Card>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Button
          label={inWishlist ? '♥ Saved' : '♡ Wishlist'}
          variant="ghost"
          onPress={() => toggleWishlist(productId)}
          style={styles.wishBtn}
          accessibilityLabel={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        />
        <Button
          label={cartCount > 0 ? t('shop.addToCart') : t('shop.addToCart')}
          onPress={onAddToCart}
          disabled={!product.inStock}
          style={styles.cartBtn}
        />
        <Button label={t('shop.checkout')} variant="success" onPress={onBuyNow} disabled={!product.inStock} style={styles.buyBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12, alignItems: 'stretch' },
  loadingWrap: { gap: 12, padding: 16 },
  name: { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: 24, fontWeight: '800' },
  mrp: { fontSize: 15, textDecorationLine: 'line-through' },
  discount: { fontSize: 14, fontWeight: '700' },
  card: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  wishBtn: { paddingHorizontal: 12 },
  cartBtn: { flex: 1 },
  buyBtn: { flex: 1 },
});
