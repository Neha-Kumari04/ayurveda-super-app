import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { ProductCard } from '../components/ProductCard';
import { useProductsByIds } from '../hooks';
import { useCartStore } from '../store';

import type { Product } from '../types';
import type { ShopStackScreenProps } from '@/navigation/types';

type Props = ShopStackScreenProps<'Wishlist'>;

export function WishlistScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const wishlist = useCartStore((s) => s.wishlist);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const products = useProductsByIds(wishlist);

  const openProduct = useCallback(
    (product: Product) => navigation.navigate('ProductDetail', { productId: product.id }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        layout="row"
        onPress={openProduct}
        onToggleWishlist={toggleWishlist}
        inWishlist
      />
    ),
    [openProduct, toggleWishlist],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8 }]}>
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
        {t('shop.wishlist')}
      </Text>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={t('shop.emptyWishlist')}
            description="Tap the heart on any product to save it here."
            actionLabel="Browse products"
            onAction={() => navigation.goBack()}
          />
        }
        initialNumToRender={8}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontWeight: '800', paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
});
