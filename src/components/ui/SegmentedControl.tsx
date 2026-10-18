import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
  accessibilityLabel?: string;
}

function SegmentedControlInner<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  const content = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        onPress={() => onChange(option.value)}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        style={({ pressed }) => [
          styles.segment,
          {
            backgroundColor: selected ? theme.colors.primaryMuted : 'transparent',
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: selected ? theme.colors.primary : theme.colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </ScrollView>
  );
}

export const SegmentedControl = memo(SegmentedControlInner) as typeof SegmentedControlInner;

const styles = StyleSheet.create({
  row: { gap: 6, paddingVertical: 2 },
  segment: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999 },
  label: { fontSize: 13, fontWeight: '500' },
});
