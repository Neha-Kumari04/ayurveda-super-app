import React, { memo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
  onClear?: () => void;
}

export const SearchBar = memo(function ({
  value,
  onChangeText,
  placeholder = 'Search…',
  autoFocus,
  onSubmit,
  onClear,
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={[styles.icon, { borderColor: theme.colors.textMuted }]}>
        <View style={[styles.glass, { borderColor: theme.colors.textMuted }]} />
        <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, { color: theme.colors.text }]}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        autoCorrect={false}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={[styles.clear, { backgroundColor: theme.colors.skeleton }]}
        >
          <View style={[styles.clearGlyph, { backgroundColor: theme.colors.textMuted }]} />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  // Simple magnifier drawn with views to avoid pulling icon deps into the DS.
  icon: { width: 14, height: 14, justifyContent: 'flex-start' },
  glass: { width: 10, height: 10, borderRadius: 6, borderWidth: 1.8 },
  handle: { width: 6, height: 1.8, borderRadius: 1, transform: [{ rotate: '45deg' }], marginTop: -1, marginLeft: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  clear: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  clearGlyph: { width: 9, height: 1.6, borderRadius: 1, transform: [{ rotate: '45deg' }] },
});
