import React, { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInDownView } from '@/components/ui/FadeInDownView';

import { Chip } from '@/components/ui/Chip';
import { DoctorPulseBadge } from '@/components/ui/DoctorPulseBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterSheet, type FilterGroup } from '@/components/ui/FilterSheet';
import { ListFooter } from '@/components/ui/ListFooter';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PressableScale } from '@/components/ui/PressableScale';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { RecordCard } from '../components/RecordCard';
import { useHealthTimeline } from '../hooks';
import { buildTimelineSections, collectProviders, collectTags } from '../utils';

import type { HealthRecord, RecordType, TimelineGroupBy } from '../types';
import type { HealthStackScreenProps } from '@/navigation/types';

type Props = HealthStackScreenProps<'Timeline'>;

const RECORD_TYPES: RecordType[] = ['lab_report', 'prescription', 'consultation', 'vaccination', 'allergy'];

export function TimelineScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const [filtersVisible, setFiltersVisible] = useState(false);

  const list = useHealthTimeline();

  const sections = useMemo(
    () => buildTimelineSections(list.records, list.groupBy, locale),
    [list.records, list.groupBy, locale],
  );

  // Options derived from the loaded pages — cheap and avoids a separate endpoint.
  const tags = useMemo(() => collectTags(list.records), [list.records]);
  const providers = useMemo(() => collectProviders(list.records), [list.records]);

  const openRecord = useCallback(
    (record: HealthRecord) => navigation.navigate('RecordDetail', { recordId: record.id }),
    [navigation],
  );

  const renderRecord = useCallback(
    ({ item, index }: { item: HealthRecord; index: number }) => (
      <RecordCard record={item} index={index} onPress={openRecord} />
    ),
    [openRecord],
  );


  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string; data: HealthRecord[] } }) => {
      if (!section.title) return null;
      return (
        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]} accessibilityRole="header">
            {section.title}
          </Text>
          <Text style={[styles.sectionCount, { color: theme.colors.textMuted }]}>{section.data.length}</Text>
        </View>
      );
    },
    [theme],
  );

  const onEndReached = useCallback(() => {
    if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
  }, [list]);

  const activeFilterCount =
    (list.filters.types?.length ?? 0) +
    (list.filters.tags?.length ?? 0) +
    (list.filters.providers?.length ?? 0);

  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      {
        key: 'types',
        title: 'Record type',
        type: 'multi',
        options: RECORD_TYPES.map((type) => ({ value: type, label: t(`health.${type}`) })),
        selected: list.filters.types ?? [],
        onToggle: (value) => list.toggleInArrayFilter('types', value),
      },
      {
        key: 'tags',
        title: t('health.tags'),
        type: 'multi',
        options: tags.map((tag) => ({ value: tag, label: tag })),
        selected: list.filters.tags ?? [],
        onToggle: (value) => list.toggleInArrayFilter('tags', value),
      },
      {
        key: 'providers',
        title: t('health.provider'),
        type: 'multi',
        options: providers.map((provider) => ({ value: provider, label: provider })),
        selected: list.filters.providers ?? [],
        onToggle: (value) => list.toggleInArrayFilter('providers', value),
      },
    ],
    [list, tags, providers, t],
  );

  const header = (
    <FadeInDownView duration={400} style={styles.header}>
      <OfflineBanner />

      {/* Clinical Patient Chart & Vitals Card */}
      <View
        style={[
          styles.vitalsHeroCard,
          { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
          theme.shadows.card,
        ]}
      >
        <View style={styles.vitalsHeroTop}>
          <View style={[styles.vitalsIconWrap, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name="pulse" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.vitalsTitleCol}>
            <Text style={[styles.vitalsTitle, { color: theme.colors.text }]}>Patient Health Chart</Text>
            <Text style={[styles.vitalsSubtitle, { color: theme.colors.textMuted }]}>
              Encrypted Medical Records & Ayurvedic Diagnostics
            </Text>
          </View>
        </View>

        <View style={[styles.vitalsGrid, { backgroundColor: theme.colors.borderLight }]}>
          <View style={styles.vitalItem}>
            <View style={styles.vitalItemHeader}>
              <Ionicons name="heart" size={13} color={theme.colors.danger} />
              <Text style={[styles.vitalLabel, { color: theme.colors.textMuted }]}>Cardiac Pulse</Text>
            </View>
            <Text style={[styles.vitalValue, { color: theme.colors.text }]}>72 bpm</Text>
            <DoctorPulseBadge label="Normal" isOnline size="sm" />
          </View>

          <View style={[styles.vitalDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.vitalItem}>
            <View style={styles.vitalItemHeader}>
              <Ionicons name="leaf" size={13} color={theme.colors.herbGold} />
              <Text style={[styles.vitalLabel, { color: theme.colors.textMuted }]}>Ayurveda Dosha</Text>
            </View>
            <Text style={[styles.vitalValue, { color: theme.colors.text }]}>Pitta-Kapha</Text>
            <Text style={[styles.vitalSub, { color: theme.colors.primary }]}>Equilibrium</Text>
          </View>

          <View style={[styles.vitalDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.vitalItem}>
            <View style={styles.vitalItemHeader}>
              <Ionicons name="document-text" size={13} color={theme.colors.accent} />
              <Text style={[styles.vitalLabel, { color: theme.colors.textMuted }]}>Total Records</Text>
            </View>
            <Text style={[styles.vitalValue, { color: theme.colors.text }]}>{list.total}</Text>
            <Text style={[styles.vitalSub, { color: theme.colors.textMuted }]}>Verified</Text>
          </View>
        </View>
      </View>

      <SearchBar value={list.query} onChangeText={list.setQuery} placeholder={`${t('common.search')} prescriptions, reports…`} />
      <View style={styles.controlsRow}>
        <Chip
          label={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
          selected={activeFilterCount > 0}
          onPress={() => setFiltersVisible(true)}
        />
        <View style={styles.groupControl}>
          <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>{t('health.groupBy')}</Text>
          <SegmentedControl
            options={[
              { value: 'month', label: t('health.groupMonth') },
              { value: 'year', label: t('health.groupYear') },
              { value: 'none', label: t('health.groupNone') },
            ]}
            value={list.groupBy}
            onChange={(value: TimelineGroupBy) => list.setGroupBy(value)}
            accessibilityLabel={t('health.groupBy')}
          />
        </View>
      </View>
      <Text style={[styles.count, { color: theme.colors.textMuted }]}>{t('common.results', { count: list.total })}</Text>
    </FadeInDownView>
  );

  const ListEmptyComponent = (() => {
    if (list.isLoading) {
      return (
        <View style={styles.loading}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} width="100%" height={110} radius={14} />
          ))}
        </View>
      );
    }
    if (list.error) {
      return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;
    }
    return (
      <EmptyState
        title="No records found"
        description="Adjust your search or filters, or add a new health record."
        actionLabel={activeFilterCount > 0 ? 'Clear filters' : 'Add record'}
        onAction={activeFilterCount > 0 ? list.resetFilters : () => navigation.navigate('AddRecord')}
      />
    );
  })();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={sections}
        renderItem={renderRecord}
        keyExtractor={(item: HealthRecord) => item.id}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        ListHeaderComponent={header}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={
          <ListFooter loading={list.isFetchingNextPage} hasMore={list.hasNextPage && list.records.length > 0} />
        }
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Health records timeline"
      />

      {/* Floating animated add record button */}
      <PressableAddButton onPress={() => navigation.navigate('AddRecord')} bottom={insets.bottom + 80} />

      <FilterSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onApply={() => setFiltersVisible(false)}
        onClear={list.resetFilters}
        groups={filterGroups}
        title="Filters"
        resultCount={list.total}
      />
    </View>
  );
}

function PressableAddButton({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('health.addRecord')}
      activeScale={0.9}
      style={[
        styles.fab,
        { backgroundColor: theme.colors.primary, bottom },
        theme.shadows.floating,
      ]}
    >
      <Ionicons name="add" size={30} color={theme.colors.onPrimary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  header: { gap: 12, paddingBottom: 14 },
  vitalsHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  vitalsHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vitalsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalsTitleCol: {
    flex: 1,
    gap: 2,
  },
  vitalsTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  vitalsSubtitle: {
    fontSize: 12,
  },
  vitalsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  vitalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  vitalItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vitalDivider: {
    width: 1,
    height: 34,
  },
  vitalLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  vitalSub: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: -6 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupControl: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupLabel: { fontSize: 12 },
  count: { fontSize: 12.5 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingRight: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { fontSize: 12 },
  loading: { gap: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

