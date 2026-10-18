import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterSheet, type FilterGroup } from '@/components/ui/FilterSheet';
import { ListFooter } from '@/components/ui/ListFooter';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { ProductCard } from '../components/ProductCard';
import { useProductList } from '../hooks';
import { selectCartCount, useCartStore } from '../store';

import type { Product, ProductCategory, ProductForm, ProductSortOption } from '../types';
import type { ShopStackScreenProps } from '@/navigation/types';

type Props = ShopStackScreenProps<'ProductList'>;

const CATEGORIES: ProductCategory[] = [
  'Ashwagandha', 'Triphala', 'Chyawanprash', 'Turmeric', 'Tulsi',
  'Brahmi', 'Shilajit', 'Aloe Vera', 'Neem', 'Spirulina',
];
const FORMS: ProductForm[] = ['capsule', 'powder', 'oil', 'tablet', 'juice', 'churna'];
const PRICE_BANDS = [
  { value: 500, label: '≤ ₹500' },
  { value: 1000, label: '≤ ₹1,000' },
  { value: 2000, label: '≤ ₹2,000' },
];
const SORT_OPTIONS: Array<{ value: ProductSortOption; labelKey: string }> = [
  { value: 'relevance', labelKey: 'shop.sortRelevance' },
  { value: 'price_asc', labelKey: 'shop.sortPriceAsc' },
  { value: 'price_desc', labelKey: 'shop.sortPriceDesc' },
  { value: 'rating', labelKey: 'shop.sortRating' },
];

export function ProductListScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [filtersVisible, setFiltersVisible] = useState(false);

  const list = useProductList();
  const cartCount = useCartStore(selectCartCount);
  const wishlist = useCartStore((s) => s.wishlist);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);

  const activeFilterCount =
    (list.filters.categories?.length ?? 0) +
    (list.filters.forms?.length ?? 0) +
    (list.filters.tags?.length ?? 0) +
    (list.filters.maxPrice !== undefined ? 1 : 0) +
    (list.filters.minRating ? 1 : 0) +
    (list.filters.inStockOnly ? 1 : 0);

  const openProduct = useCallback(
    (product: Product) => navigation.navigate('ProductDetail', { productId: product.id }),
    [navigation],
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      // Wrap in fixed-width container for a stable 2-column grid layout.
      <View style={styles.gridCell}>
        <ProductCard
          product={item}
          onPress={openProduct}
          onToggleWishlist={toggleWishlist}
          inWishlist={wishlist.includes(item.id)}
        />
      </View>
    ),
    [openProduct, toggleWishlist, wishlist],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const onEndReached = useCallback(() => {
    if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
  }, [list]);

  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      {
        key: 'categories',
        title: t('shop.category'),
        type: 'multi',
        options: CATEGORIES.map((c) => ({ value: c, label: c })),
        selected: list.filters.categories ?? [],
        onToggle: (value) => list.toggleInArrayFilter('categories', value),
      },
      {
        key: 'forms',
        title: t('shop.form'),
        type: 'multi',
        options: FORMS.map((f) => ({ value: f, label: f })),
        selected: list.filters.forms ?? [],
        onToggle: (value) => list.toggleInArrayFilter('forms', value),
      },
      {
        key: 'price',
        title: t('shop.price'),
        type: 'single',
        values: PRICE_BANDS,
        selected: list.filters.maxPrice,
        onSelect: (value) =>
          list.setFilters({
            ...list.filters,
            maxPrice: list.filters.maxPrice === value ? undefined : Number(value),
          }),
      },
      {
        key: 'rating',
        title: t('shop.sortRating'),
        type: 'single',
        values: [
          { value: 4.5, label: '4.5+' },
          { value: 4, label: '4+' },
          { value: 3.5, label: '3.5+' },
        ],
        selected: list.filters.minRating,
        onSelect: (value) =>
          list.setFilters({
            ...list.filters,
            minRating: list.filters.minRating === value ? undefined : Number(value),
          }),
      },
      {
        key: 'stock',
        title: t('shop.inStockOnly'),
        type: 'toggle',
        selected: list.filters.inStockOnly ?? false,
        onSelect: (value) => list.setFilters({ ...list.filters, inStockOnly: Boolean(value) }),
      },
    ],
    [list, t],
  );

  const header = (
    <View style={styles.header}>
      <OfflineBanner />
      <View style={styles.titleRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
            {t('shop.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{t('shop.subtitle')}</Text>
        </View>
        <Chip label={`${t('shop.wishlist')} (${wishlist.length})`} onPress={() => navigation.navigate('Wishlist')} />
        <Chip label={`${t('shop.cart')} (${cartCount})`} selected onPress={() => navigation.navigate('Cart')} />
      </View>
      <SearchBar value={list.query} onChangeText={list.setQuery} placeholder={`${t('common.search')} products…`} />
      <View style={styles.controlsRow}>
        <View style={styles.sortWrap}>
          <SegmentedControl
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            value={list.sort}
            onChange={(value: ProductSortOption) => list.setSort(value)}
            accessibilityLabel={t('shop.sort')}
          />
        </View>
        <Chip
          label={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
          selected={activeFilterCount > 0}
          onPress={() => setFiltersVisible(true)}
        />
      </View>
      <View style={styles.countRow}>
        <Text style={[styles.count, { color: theme.colors.textMuted }]}>
          {t('common.results', { count: list.total })}
        </Text>
        {list.isSearching ? <Badge label="Updating…" tone="info" size="sm" /> : null}
      </View>
    </View>
  );

  const ListEmptyComponent = (() => {
    if (list.isLoading) {
      return (
        <View style={styles.loadingGrid}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} style={styles.gridCell}>
              <Skeleton width="100%" height={210} radius={14} />
            </View>
          ))}
        </View>
      );
    }
    if (list.error) {
      return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;
    }
    return (
      <EmptyState
        title="No products found"
        description="Try different keywords or clear your filters."
        actionLabel={activeFilterCount > 0 ? 'Clear filters' : undefined}
        onAction={activeFilterCount > 0 ? list.resetFilters : undefined}
      />
    );
  })();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={list.products}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        numColumns={2}
        ListHeaderComponent={header}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={
          <ListFooter loading={list.isFetchingNextPage} hasMore={list.hasNextPage && list.products.length > 0} />
        }
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Product listing"
      />

      <FilterSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onApply={() => setFiltersVisible(false)}
        onClear={list.resetFilters}
        groups={filterGroups}
        title={t('shop.category')}
        resultCount={list.total}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  header: { gap: 10, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  titleCol: { flex: 1, minWidth: 140 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: -4 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortWrap: { flex: 1 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { fontSize: 12.5 },
  columnWrapper: { gap: 10 },
  gridCell: { flex: 1, marginBottom: 10 },
  loadingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
