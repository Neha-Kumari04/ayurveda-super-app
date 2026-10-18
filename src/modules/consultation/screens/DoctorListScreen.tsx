import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInDownView } from '@/components/ui/FadeInDownView';

import { ErrorState } from '@/components/ui/ErrorState';
import { FilterSheet, type FilterGroup } from '@/components/ui/FilterSheet';
import { ListFooter } from '@/components/ui/ListFooter';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { VoiceSearchButton } from '@/components/ai/VoiceSearchButton';
import { useVoiceSearch } from '@/core/ai/voice/useVoiceSearch';
import { useDoctorRecommendations } from '@/core/ai/recs/useRecommendations';
import { useInteractionStore } from '@/core/ai/recs/interactions';
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
  const voice = useVoiceSearch();
  const docRecs = useDoctorRecommendations();
  const trackSearch = useInteractionStore((s) => s.trackSearch);

  const handleVoiceResult = useCallback(
    (text: string) => {
      list.setQuery(text);
      trackSearch(text);
    },
    [list, trackSearch],
  );

  const activeFilterCount =
    (list.filters.specialties?.length ?? 0) +
    (list.filters.cities?.length ?? 0) +
    (list.filters.genders?.length ?? 0) +
    (list.filters.minRating ? 1 : 0) +
    (list.filters.maxFee ? 1 : 0) +
    (list.filters.availableOnly ? 1 : 0);

  const openDoctor = useCallback(
    (doctor: Doctor) => {
      useInteractionStore.getState().trackDoctorView(doctor.id, doctor.specialty);
      navigation.navigate('DoctorDetail', { doctorId: doctor.id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Doctor; index: number }) => (
      <DoctorCard doctor={item} index={index} onPress={openDoctor} />
    ),
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
    <FadeInDownView duration={400} style={styles.header}>
      <OfflineBanner />

      {/* Clinical Telehealth Hero Banner */}
      <View style={[styles.clinicHeroCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }, theme.shadows.card]}>
        <View style={styles.clinicHeroTop}>
          <View style={[styles.clinicIconBox, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name="medkit" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.clinicHeroTitles}>
            <View style={styles.verifiedRow}>
              <Ionicons name="shield-checkmark" size={14} color={theme.colors.primary} />
              <Text style={[styles.verifiedTag, { color: theme.colors.primary }]}>
                Verified AYUSH Doctors
              </Text>
            </View>
            <Text style={[styles.clinicTitle, { color: theme.colors.text }]}>
              Ayurvedic Consultations
            </Text>
          </View>
        </View>

        <Text style={[styles.clinicSubtitle, { color: theme.colors.textSecondary }]}>
          Connect with registered Ayurvedic Vaidyas via encrypted HD video or clinic visits.
        </Text>

        <View style={[styles.heroPillsRow, { borderTopColor: theme.colors.borderLight }]}>
          <View style={styles.heroFeatureItem}>
            <Ionicons name="videocam-outline" size={13} color={theme.colors.accent} />
            <Text style={[styles.heroFeatureText, { color: theme.colors.textSecondary }]}>Instant Video</Text>
          </View>
          <View style={styles.heroFeatureItem}>
            <Ionicons name="document-text-outline" size={13} color={theme.colors.accent} />
            <Text style={[styles.heroFeatureText, { color: theme.colors.textSecondary }]}>E-Prescription</Text>
          </View>
          <View style={styles.heroFeatureItem}>
            <Ionicons name="time-outline" size={13} color={theme.colors.accent} />
            <Text style={[styles.heroFeatureText, { color: theme.colors.textSecondary }]}>Flexible Slots</Text>
          </View>
        </View>
      </View>

      {/* Search Bar with Doctor Voice Input */}
      <SearchBar
        value={voice.isListening || voice.isProcessing ? voice.interimText || list.query : list.query}
        onChangeText={list.setQuery}
        placeholder="Search doctor name, specialty, clinic…"
        rightAccessory={
          <VoiceSearchButton
            isListening={voice.isListening}
            onPress={() => voice.start(handleVoiceResult)}
            onCancel={voice.cancel}
          />
        }
      />

      {voice.isListening ? (
        <View style={styles.voiceHintRow}>
          <Ionicons name="mic" size={13} color={theme.colors.primary} />
          <Text style={[styles.voiceHint, { color: theme.colors.primary }]}>
            {voice.interimText || t('ai.voiceListening')}
          </Text>
        </View>
      ) : null}
      {voice.error ? (
        <Text style={[styles.voiceHint, { color: theme.colors.danger }]}>{voice.error}</Text>
      ) : null}

      {/* Quick Specialty Filter Rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.specialtyRail}
      >
        {SPECIALTIES.map((spec) => {
          const isSelected = list.filters.specialties?.includes(spec);
          return (
            <Chip
              key={spec}
              label={spec}
              selected={isSelected}
              onPress={() => list.toggleSpecialty(spec)}
              size="sm"
            />
          );
        })}
      </ScrollView>

      {/* Top-rated doctors rail — only when no active search */}
      {list.query.length === 0 && !list.isLoading ? (
        <View style={styles.topDocWrap}>
          <View style={styles.topDocTitleRow}>
            <Ionicons name="star" size={15} color={theme.colors.herbGold} />
            <Text style={[styles.topDocTitle, { color: theme.colors.text }]} accessibilityRole="header">
              Top Rated Doctors
            </Text>
          </View>
          {docRecs.topRated.slice(0, 3).map((doc, idx) => (
            <DoctorCard key={doc.id} doctor={doc} index={idx} onPress={openDoctor} />
          ))}
        </View>
      ) : null}

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
    </FadeInDownView>
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
  header: { gap: 12, paddingBottom: 14 },
  clinicHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  clinicHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clinicIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicHeroTitles: {
    flex: 1,
    gap: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  clinicTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  clinicSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  heroFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroFeatureText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  specialtyRail: {
    gap: 8,
    paddingVertical: 4,
  },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: -6 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortWrap: { flex: 1 },
  count: { fontSize: 12.5 },
  loadingList: { gap: 10 },
  skeletonCard: { marginBottom: 10 },
  voiceHint: { fontSize: 12, fontWeight: '600' },
  voiceHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topDocWrap: { gap: 8 },
  topDocTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topDocTitle: { fontSize: 16, fontWeight: '700' },
});

