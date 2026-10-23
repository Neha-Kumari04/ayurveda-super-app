import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInDownView } from '@/components/ui/FadeInDownView';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DoctorPulseBadge } from '@/components/ui/DoctorPulseBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserDetailsFormModal } from '@/components/forms/UserDetailsFormModal';
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
  const [showPatientForm, setShowPatientForm] = useState(false);

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
      setShowPatientForm(false);
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <FadeInDownView duration={350} style={styles.topNavRow}>
          <PressableScale
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </PressableScale>
          <Text style={[styles.navTitle, { color: theme.colors.text }]}>Doctor Profile</Text>
          <View style={[styles.verifiedPill, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name="shield-checkmark" size={13} color={theme.colors.primary} />
            <Text style={[styles.verifiedPillText, { color: theme.colors.primary }]}>Verified</Text>
          </View>
        </FadeInDownView>

        {/* Doctor Hero Profile Card */}
        <FadeInDownView
          delay={100}
          duration={450}
          style={[styles.heroCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }, theme.shadows.card]}
        >
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}>
              <Avatar uri={doctor.avatarUrl} size={88} accessibilityLabel={`Portrait of ${doctor.name}`} />
              <View style={[styles.heroVerifiedBadge, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroInfo}>
              <DoctorPulseBadge
                label={doctor.isAvailable ? 'Available Today' : 'Next Available Tomorrow'}
                isOnline={doctor.isAvailable}
                size="sm"
              />
              <Text style={[styles.name, { color: theme.colors.text }]} accessibilityRole="header">
                {doctor.name}
              </Text>
              <Text style={[styles.specialty, { color: theme.colors.primary }]}>{doctor.specialty}</Text>
              <View style={styles.clinicRow}>
                <Ionicons name="business-outline" size={13} color={theme.colors.textMuted} />
                <Text style={[styles.clinicText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {doctor.clinicName}
                </Text>
              </View>
            </View>
          </View>

          {/* Clinical Stats Strip */}
          <View style={[styles.statsStrip, { backgroundColor: theme.colors.borderLight }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{doctor.experienceYears}+ yrs</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Experience</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statCol}>
              <View style={styles.statRatingRow}>
                <Ionicons name="star" size={13} color={theme.colors.herbGold} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{doctor.rating.toFixed(1)}</Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{doctor.reviewCount} reviews</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{doctor.languages.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Languages</Text>
            </View>
          </View>
        </FadeInDownView>

        {/* About & Medical Background */}
        <FadeInDownView
          delay={180}
          duration={450}
          style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About Doctor</Text>
          </View>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{doctor.bio}</Text>
          <View style={styles.chipRow}>
            {doctor.qualifications.map((q) => (
              <Chip key={q} label={q} size="sm" />
            ))}
          </View>
        </FadeInDownView>

        {/* Clinic & Location Details */}
        <FadeInDownView
          delay={240}
          duration={450}
          style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Clinic & Consultations</Text>
          </View>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
            {doctor.clinicName} · {doctor.city}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Spoken: {doctor.languages.join(', ')}
          </Text>
        </FadeInDownView>

        {/* Appointment Slot Picker */}
        <FadeInDownView
          delay={300}
          duration={450}
          style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('consult.bookSlot')}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((date) => {
              const selected = isSameDay(date, selectedDate);
              return (
                <PressableScale
                  key={date.toISOString()}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  activeScale={0.93}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceElevated,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                    },
                    selected ? theme.shadows.subtle : null,
                  ]}
                >
                  <Text style={{ color: selected ? theme.colors.onPrimary : theme.colors.text, fontWeight: '700', fontSize: 13 }}>
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                  <Text style={{ color: selected ? theme.colors.onPrimary : theme.colors.textMuted, fontSize: 12 }}>
                    {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </Text>
                </PressableScale>
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
        </FadeInDownView>

        {/* Booking Summary Card */}
        {selectedSlot ? (
          <FadeInDownView
            duration={300}
            style={[styles.sectionCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }, theme.shadows.card]}
          >
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="checkbox-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Booking Summary</Text>
            </View>
            <Row label="Doctor" value={doctor.name} />
            <Row label="Specialty" value={doctor.specialty} />
            <Row label="Time Slot" value={new Date(selectedSlot.start).toLocaleString()} />
            <Row label="Fee" value={formatCurrency(doctor.fee)} />
            <Input
              label={t('consult.reason')}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. recurring migraines, dosha analysis"
              multiline
            />
          </FadeInDownView>
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
          onPress={selectedSlot ? () => setShowPatientForm(true) : () => {}}
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

      <UserDetailsFormModal
        visible={showPatientForm}
        title={t('profile.patientDetails')}
        description={t('profile.patientDescription')}
        fields={['fullName', 'age', 'gender']}
        submitLabel={t('profile.confirmAndBook')}
        onClose={() => setShowPatientForm(false)}
        onSubmit={() => void onBook()}
      />
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
  content: { paddingHorizontal: 16, gap: 14 },
  loadingWrap: { alignItems: 'center', gap: 14, padding: 24 },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  heroTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  heroVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  specialty: {
    fontSize: 14,
    fontWeight: '700',
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clinicText: {
    fontSize: 12.5,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  statRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  dateRow: {
    gap: 8,
    paddingVertical: 4,
  },
  dateChip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  feeCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  feeLabel: {
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  feeValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  bookButton: {
    alignSelf: 'stretch',
  },
  manage: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
