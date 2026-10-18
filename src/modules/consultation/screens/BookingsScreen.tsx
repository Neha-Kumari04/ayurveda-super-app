import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { useSettingsStore } from '@/store/settingsStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { ListFooter } from '@/components/ui/ListFooter';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/toast/ToastProvider';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency, formatDateTime } from '@/utils/format';

import { bookingErrorMessage, useBookings, useCancelBooking } from '../hooks';
import { isCancellable, isUpcoming } from '../utils';

import type { Booking } from '../types';
import type { ConsultStackScreenProps } from '@/navigation/types';

type Props = ConsultStackScreenProps<'Bookings'>;
type Tab = 'upcoming' | 'past';

export function BookingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const bookingsQuery = useBookings();
  const cancelMutation = useCancelBooking();
  const videoEnabled = useSettingsStore((s) => s.isFeatureEnabled('consultation.video_enabled'));

  const { upcoming, past } = useMemo(() => {
    const items = bookingsQuery.data?.items ?? [];
    return {
      upcoming: items.filter((b) => isUpcoming(b) || b.status === 'pending'),
      past: items.filter((b) => !isUpcoming(b) && b.status !== 'pending'),
    };
  }, [bookingsQuery.data]);

  const data = tab === 'upcoming' ? upcoming : past;

  const onConfirmCancel = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync(cancelTarget.id);
      toast.success(t('consult.cancelled'));
      setCancelTarget(null);
      setCancelReason('');
    } catch (error) {
      toast.error(bookingErrorMessage(error));
    }
  }, [cancelTarget, cancelMutation, toast, t]);

  const renderItem = useCallback(
    ({ item, index }: { item: Booking; index: number }) => (
      <AnimatedCard index={index} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleCol}>
            <View style={styles.doctorHeaderRow}>
              <Ionicons name="medkit" size={14} color={theme.colors.primary} />
              <Text style={[styles.doctorName, { color: theme.colors.text }]} numberOfLines={1}>
                {item.doctorName}
              </Text>
            </View>
            <Text style={[styles.specialty, { color: theme.colors.primary }]}>{item.specialty}</Text>
          </View>
          {item.syncStatus === 'pending' ? (
            <Badge label={t('common.pendingSync')} tone="warning" size="sm" />
          ) : (
            <Badge
              label={item.status}
              tone={item.status === 'confirmed' ? 'success' : item.status === 'cancelled' ? 'danger' : 'neutral'}
              size="sm"
            />
          )}
        </View>

        <View style={styles.timeRow}>
          <Ionicons name="calendar-outline" size={13} color={theme.colors.textMuted} />
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            {formatDateTime(item.start)} · {formatCurrency(item.fee)}
          </Text>
        </View>

        {item.reason ? (
          <Text style={[styles.reason, { color: theme.colors.textMuted }]} numberOfLines={2}>
            Reason: {item.reason}
          </Text>
        ) : null}
        {item.cancelReason ? (
          <Text style={[styles.reason, { color: theme.colors.danger }]}>Cancelled: {item.cancelReason}</Text>
        ) : null}

        <View style={styles.actions}>
          {videoEnabled && item.status === 'confirmed' ? (
            <Button
              label={t('consult.joinVideoCall')}
              size="sm"
              icon={<Ionicons name="videocam" size={15} color={theme.colors.onPrimary} />}
              onPress={() =>
                navigation.navigate('VideoCall', {
                  bookingId: item.id,
                  doctorName: item.doctorName,
                  specialty: item.specialty,
                })
              }
            />
          ) : null}
          {isCancellable(item) ? (
            <Button
              label={t('consult.cancelBooking')}
              variant="danger"
              size="sm"
              onPress={() => setCancelTarget(item)}
            />
          ) : null}
        </View>
      </AnimatedCard>
    ),
    [theme, t, navigation, videoEnabled],
  );


  const keyExtractor = useCallback((item: Booking) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.tabs}>
        <SegmentedControl
          options={[
            { value: 'upcoming', label: `${t('consult.upcoming')} (${upcoming.length})` },
            { value: 'past', label: `${t('consult.past')} (${past.length})` },
          ]}
          value={tab}
          onChange={setTab}
          accessibilityLabel="Booking filter"
        />
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          bookingsQuery.isLoading ? (
            <View style={styles.loading}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} width="100%" height={110} radius={14} />
              ))}
            </View>
          ) : bookingsQuery.error ? (
            <ErrorState error={bookingsQuery.error} onRetry={() => void bookingsQuery.refetch()} />
          ) : (
            <EmptyState
              title={tab === 'upcoming' ? 'No upcoming consultations' : 'No past consultations'}
              description={
                tab === 'upcoming' ? 'Book a doctor from the Consult tab to get started.' : undefined
              }
              actionLabel={tab === 'upcoming' ? 'Find a doctor' : undefined}
              onAction={tab === 'upcoming' ? () => navigation.goBack() : undefined}
            />
          )
        }
        ListFooterComponent={<ListFooter loading={false} hasMore={false} />}
        initialNumToRender={6}
        windowSize={5}
        removeClippedSubviews
      />

      {/* Cancel confirmation modal-lite */}
      {cancelTarget ? (
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <Card style={styles.modalCard} elevated>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Cancel consultation?</Text>
            <Text style={[styles.modalBody, { color: theme.colors.textSecondary }]}>
              {cancelTarget.doctorName} · {formatDateTime(cancelTarget.start)}
            </Text>
            <Input
              label={t('consult.reason')}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Optional"
            />
            <View style={styles.modalActions}>
              <Button label={t('common.cancel')} variant="ghost" onPress={() => setCancelTarget(null)} style={styles.flex} />
              <Button
                label="Confirm cancel"
                variant="danger"
                loading={cancelMutation.isPending}
                onPress={() => void onConfirmCancel()}
                style={styles.flex}
              />
            </View>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  loading: { gap: 10 },
  card: { gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardTitleCol: { flex: 1, gap: 2 },
  doctorHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doctorName: { fontSize: 16, fontWeight: '700' },
  specialty: { fontSize: 13, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  meta: { fontSize: 13.5 },
  reason: { fontSize: 12.5, fontStyle: 'italic' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { gap: 12, width: '100%' },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalBody: { fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  flex: { flex: 1 },
});
