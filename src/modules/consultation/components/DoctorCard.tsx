import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Rating } from '@/components/ui/Rating';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

import type { Doctor } from '../types';

export interface DoctorCardProps {
  doctor: Doctor;
  onPress: (doctor: Doctor) => void;
}

/** Memoised row — critical for smooth virtualisation over 5,000 doctors. */
export const DoctorCard = memo(function ({ doctor, onPress }: DoctorCardProps) {
  const theme = useTheme();

  return (
    <Card onPress={() => onPress(doctor)} style={styles.card} accessibilityLabel={`${doctor.name}, ${doctor.specialty}`}>
      <View style={styles.row}>
        <Avatar uri={doctor.avatarUrl} size={64} accessibilityLabel={`Portrait of ${doctor.name}`} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
              {doctor.name}
            </Text>
            {doctor.isAvailable ? <Badge label="Available" tone="success" size="sm" /> : null}
          </View>
          <Text style={[styles.specialty, { color: theme.colors.primary }]} numberOfLines={1}>
            {doctor.specialty}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {doctor.city} · {doctor.experienceYears} yrs · {doctor.languages.join(', ')}
          </Text>
          <View style={styles.footer}>
            <Rating value={doctor.rating} count={doctor.reviewCount} size="sm" />
            <Text style={[styles.fee, { color: theme.colors.text }]}>
              {formatCurrency(doctor.fee)}
              <Text style={[styles.feeSuffix, { color: theme.colors.textMuted }]}> /session</Text>
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', gap: 12 },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  specialty: { fontSize: 13, fontWeight: '600' },
  meta: { fontSize: 12.5 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  fee: { fontSize: 15, fontWeight: '700' },
  feeSuffix: { fontSize: 12, fontWeight: '400' },
});
