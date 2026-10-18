import React, { memo, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
}

export const Chip = memo(function ({
  label,
  selected = false,
  onPress,
  onRemove,
  size = 'md',
  accessibilityLabel,
}: ChipProps) {
  const theme = useTheme();

  const handlePress = useCallback(() => {
    if (!onPress) return;
    void Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  const padding = size === 'sm' ? { paddingVertical: 4, paddingHorizontal: 9 } : { paddingVertical: 7, paddingHorizontal: 12 };

  return (
    <PressableScale
      onPress={handlePress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      activeScale={0.94}
      haptic={false}
      style={[
        styles.chip,
        padding,
        {
          backgroundColor: selected ? theme.colors.primaryMuted : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? theme.colors.primary : theme.colors.textSecondary, fontSize: size === 'sm' ? 12 : 13 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {onRemove ? (
        <Text
          onPress={(e) => {
            e.stopPropagation?.();
            onRemove();
          }}
          style={[styles.remove, { color: theme.colors.textMuted }]}
          accessibilityLabel={`Remove ${label}`}
        >
          ✕
        </Text>
      ) : null}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontWeight: '500' },
  remove: { fontSize: 11, fontWeight: '700', paddingLeft: 2 },
});
