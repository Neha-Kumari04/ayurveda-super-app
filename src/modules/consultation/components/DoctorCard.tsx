import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '@/components/ui/Avatar';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { DoctorPulseBadge } from '@/components/ui/DoctorPulseBadge';
import { Rating } from '@/components/ui/Rating';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

import type { Doctor } from '../types';

export interface DoctorCardProps {
  doctor: Doctor;
  onPress: (doctor: Doctor) => void;
  index?: number;
}

/** Memoised animated row with clinical doctor styling and micro-interactions. */
export const DoctorCard = memo(function ({ doctor, onPress, index = 0 }: DoctorCardProps) {
  const theme = useTheme();

  return (
    <AnimatedCard
      onPress={() => onPress(doctor)}
      index={index}
      style={styles.card}
      accessibilityLabel={`Doctor ${doctor.name}, ${doctor.specialty}`}
    >
      {/* Top Banner: Clinical status / Live Pulse */}
      <View style={styles.topBanner}>
        <DoctorPulseBadge
          label={doctor.isAvailable ? 'Available Now • Video Consult' : 'Next Available Tomorrow'}
          isOnline={doctor.isAvailable}
          size="sm"
        />
        <View style={[styles.specialtyBadge, { backgroundColor: theme.colors.primaryMuted }]}>
          <Ionicons name="medkit" size={12} color={theme.colors.primary} />
          <Text style={[styles.specialtyText, { color: theme.colors.primary }]} numberOfLines={1}>
            {doctor.specialty}
          </Text>
        </View>
      </View>

      {/* Main Doctor Profile Row */}
      <View style={styles.profileRow}>
        <View style={styles.avatarContainer}>
          <Avatar uri={doctor.avatarUrl} size={68} accessibilityLabel={`Portrait of ${doctor.name}`} />
          <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="checkmark-sharp" size={11} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.detailsCol}>
          <View style={styles.doctorHeader}>
            <Text style={[styles.doctorName, { color: theme.colors.text }]} numberOfLines={1}>
              {doctor.name}
            </Text>
          </View>

          <View style={styles.clinicRow}>
            <Ionicons name="location-sharp" size={12} color={theme.colors.textMuted} />
            <Text style={[styles.clinicText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {doctor.clinicName} · {doctor.city}
            </Text>
          </View>

          <View style={styles.credentialsRow}>
            <View style={[styles.expPill, { backgroundColor: theme.colors.borderLight }]}>
              <Ionicons name="ribbon-outline" size={12} color={theme.colors.accent} />
              <Text style={[styles.expText, { color: theme.colors.textSecondary }]}>
                {doctor.experienceYears} yrs exp
              </Text>
            </View>
            <Text style={[styles.langText, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {doctor.languages.slice(0, 2).join(', ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Clinical Footer: Rating & Consultation Fee */}
      <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

      <View style={styles.footerRow}>
        <View style={styles.ratingBox}>
          <Rating value={doctor.rating} count={doctor.reviewCount} size="sm" />
        </View>

        <View style={styles.actionBox}>
          <View style={styles.feeWrap}>
            <Text style={[styles.feeLabel, { color: theme.colors.textMuted }]}>Consultation</Text>
            <Text style={[styles.feeAmount, { color: theme.colors.primary }]}>
              {formatCurrency(doctor.fee)}
            </Text>
          </View>
          <View style={[styles.bookBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.bookBtnText}>Book</Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </AnimatedCard>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 14,
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  specialtyText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  detailsCol: {
    flex: 1,
    gap: 4,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clinicText: {
    fontSize: 12,
    fontWeight: '500',
  },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  expPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  langText: {
    fontSize: 11.5,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feeWrap: {
    alignItems: 'flex-end',
  },
  feeLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  feeAmount: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

