import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ui/ErrorState';
import { FilterSheet, type FilterGroup } from '@/components/ui/FilterSheet';
import { ListFooter } from '@/components/ui/ListFooter';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { DoctorCard } from '../components/DoctorCard';
import { DOCTOR_SORT_OPTIONS } from '../api';
import { useDoctorList } from '../hooks';

import type { Doctor, DoctorGender, SortOption } from '../types';
import type { ConsultStackScreenProps } from '@/navigation/types';

// Module-local screen props helper (stack lives inside the Consult tab).
type Props = ConsultStackScreenProps<'DoctorList'>;

const SPECIALTIES = [
  'Panchakarma', 'Kayachikitsa', 'Shalya Tantra', 'Shalakya Tantra',
  'Prasuti Tantra', 'Kaumarbhritya', 'Agada Tantra',
] as const;

const CITIES = [
  'Pune', 'Kerala', 'Bengaluru', 'Mysuru', 'Varanasi', 'Hyderabad',
  'Chennai', 'Delhi', 'Jaipur', 'Kolkata', 'Kochi', 'Thrissur',
];

const GENDERS: DoctorGender[] = ['male', 'female', 'other'];
const RATINGS = [4.5, 4.0, 3.5];
const FEE_OPTIONS = [
  { value: 5000, label: '≤ ₹5,000' },
  { value: 8000, label: '≤ ₹8,000' },
  { value: 12000, label: '≤ ₹12,000' },
];

export function DoctorListScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [filtersVisible, setFiltersVisible] = useState(false);

  const list = useDoctorList();

  const activeFilterCount =
    (list.filters.specialties?.length ?? 0) +
    (list.filters.cities?.length ?? 0) +
    (list.filters.genders?.length ?? 0) +
    (list.filters.minRating ? 1 : 0) +
    (list.filters.maxFee ? 1 : 0) +
    (list.filters.availableOnly ? 1 : 0);

  const openDoctor = useCallback(
    (doctor: Doctor) => navigation.navigate('DoctorDetail', { doctorId: doctor.id }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Doctor }) => <DoctorCard doctor={item} onPress={openDoctor} />,
    [openDoctor],
  );

  const keyExtractor = useCallback((item: Doctor) => item.id, []);

  const onEndReached = useCallback(() => {
    if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
  }, [list]);

  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      {
        key: 'specialties',
        title: t('consult.specialties'),
        type: 'multi',
        options: SPECIALTIES.map((s) => ({ value: s, label: s })),
        selected: list.filters.specialties ?? [],
        onToggle: list.toggleSpecialty,
      },
      {
        key: 'cities',
        title: t('consult.city'),
        type: 'multi',
        options: CITIES.map((c) => ({ value: c, label: c })),
        selected: list.filters.cities ?? [],
        onToggle: (value) => {
          const current = list.filters.cities ?? [];
          const next = current.includes(value as never) ? current.filter((c) => c !== value) : [...current, value as never];
          list.setFilters({ ...list.filters, cities: next.length ? (next as never) : undefined });
        },
      },
      {
        key: 'genders',
        title: t('consult.gender'),
        type: 'multi',
        options: GENDERS.map((g) => ({ value: g, label: g })),
        selected: list.filters.genders ?? [],
        onToggle: (value) => {
          const current = list.filters.genders ?? [];
          const next = current.includes(value as never) ? current.filter((g) => g !== value) : [...current, value as never];
          list.setFilters({ ...list.filters, genders: next.length ? (next as never) : undefined });
        },
      },
      {
        key: 'rating',
        title: t('consult.rating'),
        type: 'single',
        values: RATINGS.map((r) => ({ value: r, label: `${r}+` })),
        selected: list.filters.minRating,
        onSelect: (value) =>
          list.setFilters({
            ...list.filters,
            minRating: list.filters.minRating === value ? undefined : Number(value),
          }),
      },
      {
        key: 'fee',
        title: t('consult.fee'),
        type: 'single',
        values: FEE_OPTIONS,
        selected: list.filters.maxFee,
        onSelect: (value) =>
          list.setFilters({ ...list.filters, maxFee: list.filters.maxFee === value ? undefined : Number(value) }),
      },
      {
        key: 'available',
        title: t('consult.availableOnly'),
        type: 'toggle',
        selected: list.filters.availableOnly ?? false,
        onSelect: (value) => list.setFilters({ ...list.filters, availableOnly: Boolean(value) }),
      },
    ],
    [list, t],
  );

  const header = (
    <View style={styles.header}>
      <OfflineBanner />
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
        {t('consult.title')}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{t('consult.findDoctor')}</Text>
      <SearchBar
        value={list.query}
        onChangeText={list.setQuery}
        placeholder={`${t('common.search')} doctors, clinics…`}
      />
      <View style={styles.controlsRow}>
        <View style={styles.sortWrap}>
          <SegmentedControl
            options={DOCTOR_SORT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            value={list.sort}
            onChange={(value: SortOption) => list.setSort(value)}
            accessibilityLabel={t('consult.sort')}
          />
        </View>
        <Chip
          label={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
          selected={activeFilterCount > 0}
          onPress={() => setFiltersVisible(true)}
          accessibilityLabel="Open filters"
        />
      </View>
      <Text style={[styles.count, { color: theme.colors.textMuted }]}>
        {t('common.results', { count: list.total })}
      </Text>
    </View>
  );

  const ListEmptyComponent = (() => {
    if (list.isLoading) {
      return (
        <View style={styles.loadingList}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <Skeleton width="100%" height={104} radius={14} />
            </View>
          ))}
        </View>
      );
    }
    if (list.error) {
      return <ErrorState error={list.error} onRetry={() => void list.refetch()} retrying={list.isSearching} />;
    }
    return (
      <EmptyState
        title="No doctors found"
        description="Try a different search term or clear your filters."
        actionLabel={activeFilterCount > 0 ? 'Clear filters' : undefined}
        onAction={activeFilterCount > 0 ? list.resetFilters : undefined}
      />
    );
  })();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={list.doctors}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={
          <ListFooter loading={list.isFetchingNextPage} hasMore={list.hasNextPage && list.doctors.length > 0} />
        }
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        // Virtualisation tuning for large datasets.
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        accessibilityLabel="Doctor listing"
      />

      <FilterSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onApply={() => setFiltersVisible(false)}
        onClear={list.resetFilters}
        groups={filterGroups}
        title={t('consult.specialties')}
        resultCount={list.total}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  header: { gap: 10, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: -6 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortWrap: { flex: 1 },
  count: { fontSize: 12.5 },
  loadingList: { gap: 10 },
  skeletonCard: { marginBottom: 10 },
});
