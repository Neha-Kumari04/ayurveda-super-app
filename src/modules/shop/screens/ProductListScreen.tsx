import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInDownView } from '@/components/ui/FadeInDownView';

import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterSheet, type FilterGroup } from '@/components/ui/FilterSheet';
import { ListFooter } from '@/components/ui/ListFooter';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { RecommendationRail } from '@/components/ai/RecommendationRail';
import { VoiceSearchButton } from '@/components/ai/VoiceSearchButton';
import { useVoiceSearch } from '@/core/ai/voice/useVoiceSearch';
import { useProductRecommendations } from '@/core/ai/recs/useRecommendations';
import { useInteractionStore } from '@/core/ai/recs/interactions';
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
  const voice = useVoiceSearch();
  const recs = useProductRecommendations();
  const trackSearch = useInteractionStore((s) => s.trackSearch);

  const handleVoiceResult = useCallback(
    (text: string) => {
      list.setQuery(text);
      trackSearch(text);
    },
    [list, trackSearch],
  );

  const activeFilterCount =
    (list.filters.categories?.length ?? 0) +
    (list.filters.forms?.length ?? 0) +
    (list.filters.tags?.length ?? 0) +
    (list.filters.maxPrice !== undefined ? 1 : 0) +
    (list.filters.minRating ? 1 : 0) +
    (list.filters.inStockOnly ? 1 : 0);

  const openProduct = useCallback(
    (product: Product) => {
      useInteractionStore.getState().trackProductView(product.id, product.category, product.tags);
      navigation.navigate('ProductDetail', { productId: product.id });
    },
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
    <FadeInDownView duration={400} style={styles.header}>
      <OfflineBanner />

      {/* Ayurvedic Pharmacy / Dispensary Hero Card */}
      <View
        style={[
          styles.dispensaryHeroCard,
          { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
          theme.shadows.card,
        ]}
      >
        <View style={styles.dispensaryTop}>
          <View style={[styles.dispensaryIconBox, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name="leaf" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.dispensaryTitles}>
            <View style={styles.certifiedTagRow}>
              <Ionicons name="shield-checkmark" size={13} color={theme.colors.herbGold} />
              <Text style={[styles.certifiedTag, { color: theme.colors.herbGold }]}>
                GMP Certified Pharmacy
              </Text>
            </View>
            <Text style={[styles.dispensaryTitle, { color: theme.colors.text }]}>
              Ayurvedic Dispensary
            </Text>
          </View>

          <View style={styles.headerButtonsRow}>
            <PressableScale
              onPress={() => navigation.navigate('Wishlist')}
              style={[styles.headerActionBtn, { backgroundColor: theme.colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Wishlist"
            >
              <Ionicons name="heart-outline" size={18} color={theme.colors.text} />
              {wishlist.length > 0 ? (
                <View style={[styles.cartBadge, { backgroundColor: theme.colors.danger }]}>
                  <Text style={styles.cartBadgeText}>{wishlist.length}</Text>
                </View>
              ) : null}
            </PressableScale>

            <PressableScale
              onPress={() => navigation.navigate('Cart')}
              style={[styles.cartChipBtn, { backgroundColor: theme.colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={`${t('shop.cart')} (${cartCount})`}
            >
              <Ionicons name="cart" size={16} color={theme.colors.onPrimary} />
              <Text style={styles.cartChipText}>{`${t('shop.cart')} (${cartCount})`}</Text>
            </PressableScale>
          </View>
        </View>

        <Text style={[styles.dispensarySubtitle, { color: theme.colors.textSecondary }]}>
          {t('shop.subtitle')}
        </Text>
      </View>

      <SearchBar
        value={voice.isListening || voice.isProcessing ? voice.interimText || list.query : list.query}
        onChangeText={list.setQuery}
        placeholder="Search classical herbs, formulations…"
        rightAccessory={
          <VoiceSearchButton
            isListening={voice.isListening}
            onPress={() => voice.start(handleVoiceResult)}
            onCancel={voice.cancel}
          />
        }
      />

      {/* Category Pills Rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRail}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = list.filters.categories?.includes(cat);
          return (
            <Chip
              key={cat}
              label={cat}
              selected={isSelected}
              onPress={() => list.toggleInArrayFilter('categories', cat)}
              size="sm"
            />
          );
        })}
      </ScrollView>

      {voice.isListening ? (
        <View style={styles.voiceHintRow}>
          <Ionicons name="mic" size={13} color={theme.colors.primary} />
          <Text style={[styles.voiceHint, { color: theme.colors.primary }]}>
            {voice.interimText || t('ai.voiceListening')}
          </Text>
        </View>
      ) : null}
      {voice.isProcessing ? (
        <Text style={[styles.voiceHint, { color: theme.colors.textMuted }]}>{t('ai.voiceProcessing')}</Text>
      ) : null}
      {voice.error ? (
        <Text style={[styles.voiceHint, { color: theme.colors.danger }]}>{voice.error}</Text>
      ) : null}
      {/* AI recommendation rails — only shown when no active search */}
      {list.query.length === 0 && !list.isLoading ? (
        <>
          <RecommendationRail
            title={t('ai.forYou')}
            subtitle={t('ai.forYouSubtitle')}
            items={recs.forYou}
            onSelect={openProduct}
          />
          <RecommendationRail
            title={t('ai.topRated')}
            subtitle={t('ai.topRatedSubtitle')}
            items={recs.topRated}
            onSelect={openProduct}
          />
        </>
      ) : null}
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
    </FadeInDownView>
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
  header: { gap: 12, paddingBottom: 14 },
  dispensaryHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  dispensaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dispensaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispensaryTitles: {
    flex: 1,
    gap: 2,
  },
  certifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  certifiedTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dispensaryTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dispensarySubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cartChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  categoryRail: {
    gap: 8,
    paddingVertical: 2,
  },
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
  voiceHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16 },
  voiceHint: { fontSize: 12, fontWeight: '600' },
});

