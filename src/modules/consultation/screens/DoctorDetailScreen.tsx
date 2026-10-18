import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Rating } from '@/components/ui/Rating';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/toast/ToastProvider';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { addDays, isSameDay } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

import { SlotPicker } from '../components/SlotPicker';
import { bookingErrorMessage, useBookSlot, useBookings, useDoctor, useDoctorSlots } from '../hooks';
import { isCancellable } from '../utils';

import type { TimeSlot } from '../types';
import type { ConsultStackScreenProps } from '@/navigation/types';

type Props = ConsultStackScreenProps<'DoctorDetail'>;

export function DoctorDetailScreen({ route, navigation }: Props) {
  const { doctorId } = route.params;
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [reason, setReason] = useState('');

  const doctorQuery = useDoctor(doctorId);
  const slotsQuery = useDoctorSlots(doctorId, selectedDate);
  const bookingsQuery = useBookings('confirmed');
  const existingBookings = useMemo(() => bookingsQuery.data?.items ?? [], [bookingsQuery.data]);
  const bookMutation = useBookSlot(existingBookings);

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => addDays(today, index));
  }, []);

  const slots = useMemo(() => slotsQuery.data?.slots ?? [], [slotsQuery.data]);

  const onSelectSlot = useCallback((slot: TimeSlot) => setSelectedSlot(slot), []);

  const onBook = useCallback(async () => {
    if (!selectedSlot || !doctorQuery.data) return;
    try {
      const booking = await bookMutation.mutateAsync({
        doctorId,
        slot: selectedSlot,
        reason: reason.trim() || undefined,
        doctorName: doctorQuery.data.name,
        specialty: doctorQuery.data.specialty,
        fee: doctorQuery.data.fee,
      });
      if (booking.syncStatus === 'pending') {
        toast.info(t('consult.conflict') && 'Booking saved offline — will sync automatically.');
      } else {
        toast.success('Consultation booked!');
      }
      setSelectedSlot(null);
      setReason('');
      navigation.navigate('Bookings');
    } catch (error) {
      const message = bookingErrorMessage(error);
      toast.error(message);
      // Refresh slots so a conflicted slot shows as taken.
      void slotsQuery.refetch();
    }
  }, [selectedSlot, doctorQuery.data, bookMutation, doctorId, reason, toast, t, navigation, slotsQuery]);

  const onCancelConfirm = useCallback(() => {
    // Placeholder for cancel from detail; real cancel lives on Bookings screen.
    Alert.alert('Manage booking', 'Open Upcoming bookings to manage or cancel this consultation.', [
      { text: 'OK' },
      { text: 'Go to bookings', onPress: () => navigation.navigate('Bookings') },
    ]);
  }, [navigation]);

  if (doctorQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <Skeleton width={80} height={80} radius={40} />
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={160} />
        </View>
      </View>
    );
  }

  if (doctorQuery.error || !doctorQuery.data) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <ErrorState error={doctorQuery.error} onRetry={() => void doctorQuery.refetch()} />
      </View>
    );
  }

  const doctor = doctorQuery.data;
  const upcomingMine = existingBookings.find((b) => b.doctorId === doctorId && isCancellable(b));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Avatar uri={doctor.avatarUrl} size={96} accessibilityLabel={`Portrait of ${doctor.name}`} />
          <View style={styles.heroInfo}>
            <Text style={[styles.name, { color: theme.colors.text }]} accessibilityRole="header">
              {doctor.name}
            </Text>
            <Text style={[styles.specialty, { color: theme.colors.primary }]}>{doctor.specialty}</Text>
            <Rating value={doctor.rating} count={doctor.reviewCount} />
            <View style={styles.badgeRow}>
              {doctor.isAvailable ? <Badge label="Available" tone="success" /> : <Badge label="Unavailable" tone="warning" />}
              <Badge label={`${doctor.experienceYears} yrs exp`} tone="info" />
            </View>
          </View>
        </View>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{doctor.bio}</Text>
          <View style={styles.chipRow}>
            {doctor.qualifications.map((q) => (
              <Chip key={q} label={q} size="sm" />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Clinic</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
            {doctor.clinicName} · {doctor.city}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
            Languages: {doctor.languages.join(', ')}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('consult.bookSlot')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((date) => {
              const selected = isSameDay(date, selectedDate);
              return (
                <Pressable
                  key={date.toISOString()}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? theme.colors.onPrimary : theme.colors.text, fontWeight: '700', fontSize: 13 }}>
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                  <Text style={{ color: selected ? theme.colors.onPrimary : theme.colors.textMuted, fontSize: 12 }}>
                    {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {slotsQuery.data?.partial ? (
            <Badge label="Partial slot availability — some times may be missing" tone="warning" size="sm" />
          ) : null}

          <SlotPicker
            slots={slots}
            loading={slotsQuery.isLoading}
            partial={slotsQuery.data?.partial}
            selectedSlotId={selectedSlot?.id}
            onSelect={onSelectSlot}
          />
        </Card>

        {selectedSlot ? (
          <Card style={styles.card} elevated>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Booking summary</Text>
            <Row label="Doctor" value={doctor.name} />
            <Row label="Slot" value={new Date(selectedSlot.start).toLocaleString()} />
            <Row label="Fee" value={formatCurrency(doctor.fee)} />
            <Input
              label={t('consult.reason')}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. recurring migraines"
              multiline
            />
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
        <View style={styles.feeCol}>
          <Text style={[styles.feeLabel, { color: theme.colors.textMuted }]}>{t('consult.perSession')}</Text>
          <Text style={[styles.feeValue, { color: theme.colors.text }]}>{formatCurrency(doctor.fee)}</Text>
        </View>
        <Button
          label={selectedSlot ? t('consult.bookNow') : t('consult.bookSlot')}
          onPress={selectedSlot ? () => void onBook() : () => {}}
          disabled={!selectedSlot || !doctor.isAvailable}
          loading={bookMutation.isPending}
          style={styles.bookButton}
        />
        {upcomingMine ? (
          <Pressable onPress={onCancelConfirm} accessibilityRole="button">
            <Text style={[styles.manage, { color: theme.colors.primary }]}>Manage booking</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  loadingWrap: { alignItems: 'center', gap: 14, padding: 24 },
  hero: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 4 },
  heroInfo: { flex: 1, gap: 4 },
  name: { fontSize: 22, fontWeight: '800' },
  specialty: { fontSize: 15, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  card: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  dateRow: { gap: 8, paddingVertical: 4 },
  dateChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', gap: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    alignItems: 'center',
  },
  feeCol: { flexDirection: 'row', alignItems: 'baseline', gap: 6, alignSelf: 'flex-start' },
  feeLabel: { fontSize: 12 },
  feeValue: { fontSize: 18, fontWeight: '800' },
  bookButton: { alignSelf: 'stretch' },
  manage: { fontSize: 13, fontWeight: '600' },
});
