import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTheme } from '@/theme/ThemeProvider';
import { formatTime } from '@/utils/format';
import { isPast } from '@/utils/date';

import type { TimeSlot } from '../types';

export interface SlotPickerProps {
  slots: TimeSlot[];
  loading?: boolean;
  /** True when the API reported a truncated slot list. */
  partial?: boolean;
  selectedSlotId?: string;
  onSelect: (slot: TimeSlot) => void;
}

export const SlotPicker = memo(function ({ slots, loading, partial, selectedSlotId, onSelect }: SlotPickerProps) {
  const theme = useTheme();
  // Stable per-mount clock — avoids re-creating renderSlot every render.
  const now = useMemo(() => new Date(), []);

  const renderSlot = useCallback(
    (slot: TimeSlot) => {
      const expired = isPast(slot.start, now);
      const disabled = slot.isBooked || expired;
      const selected = slot.id === selectedSlotId;

      return (
        <Pressable
          key={slot.id}
          disabled={disabled}
          onPress={() => onSelect(slot)}
          accessibilityRole="button"
          accessibilityState={{ selected, disabled }}
          accessibilityLabel={`${formatTime(slot.start)}${expired ? ' expired' : slot.isBooked ? ' booked' : ''}`}
          style={({ pressed }) => [
            styles.slot,
            {
              backgroundColor: selected
                ? theme.colors.primary
                : disabled
                  ? theme.colors.skeleton
                  : theme.colors.surface,
              borderColor: selected ? theme.colors.primary : theme.colors.border,
              opacity: pressed && !disabled ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.slotText,
              {
                color: selected ? theme.colors.onPrimary : disabled ? theme.colors.textMuted : theme.colors.text,
              },
            ]}
          >
            {formatTime(slot.start)}
          </Text>
          {expired ? (
            <Text style={[styles.slotHint, { color: selected ? theme.colors.onPrimary : theme.colors.textMuted }]}>
              past
            </Text>
          ) : slot.isBooked ? (
            <Text style={[styles.slotHint, { color: selected ? theme.colors.onPrimary : theme.colors.textMuted }]}>
              booked
            </Text>
          ) : null}
        </Pressable>
      );
    },
    [selectedSlotId, onSelect, theme, now],
  );

  if (loading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} width="23%" height={44} radius={10} />
        ))}
      </View>
    );
  }

  const availableCount = slots.filter((s) => !s.isBooked && !isPast(s.start, now)).length;

  return (
    <View style={styles.wrapper}>
      {partial ? (
        <Badge label="Some slots may be unavailable right now" tone="warning" size="sm" />
      ) : null}
      <View style={styles.grid}>{slots.map(renderSlot)}</View>
      {availableCount === 0 ? <Text style={[styles.empty, { color: theme.colors.textMuted }]}>No open slots</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    minWidth: '23%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  slotText: { fontSize: 13.5, fontWeight: '600' },
  slotHint: { fontSize: 10, marginTop: 1 },
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});
