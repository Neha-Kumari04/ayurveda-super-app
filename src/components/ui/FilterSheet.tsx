import React, { memo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Chip } from './Chip';

export interface FilterGroup {
  key: string;
  title: string;
  type: 'multi' | 'single' | 'toggle';
  options?: Array<{ value: string; label: string }>;
  /** For single-select numeric options (e.g. min rating). */
  values?: Array<{ value: number | string; label: string }>;
  selected?: string[] | string | number | boolean;
  onToggle?: (value: string) => void;
  onSelect?: (value: string | number | boolean) => void;
}

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  groups: FilterGroup[];
  title?: string;
  resultCount?: number;
}

/**
 * Bottom-sheet style filter panel. Deliberately uses core RN `Modal` so the
 * design system stays dependency-free; swap in a gesture-driven sheet later
 * without changing call sites.
 */
export const FilterSheet = memo(function ({
  visible,
  onClose,
  onApply,
  onClear,
  groups,
  title = 'Filters',
  resultCount,
}: FilterSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close filters" />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 12 },
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.clear, { color: theme.colors.primary }]}>Clear all</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {groups.map((group) => (
              <View key={group.key} style={styles.group}>
                <Text style={[styles.groupTitle, { color: theme.colors.textSecondary }]}>{group.title}</Text>
                <View style={styles.chips}>
                  {group.type === 'toggle' ? (
                    <Chip
                      label={group.title}
                      selected={group.selected === true}
                      onPress={() => group.onSelect?.(!(group.selected === true))}
                    />
                  ) : (
                    (group.options ?? group.values ?? []).map((option) => {
                      const raw = 'value' in option ? option.value : '';
                      const label = 'label' in option ? option.label : String(option);
                      const selected =
                        group.type === 'multi'
                          ? Array.isArray(group.selected) && group.selected.includes(String(raw))
                          : String(group.selected) === String(raw);
                      return (
                        <Chip
                          key={String(raw)}
                          label={label}
                          selected={selected}
                          onPress={() =>
                            group.type === 'multi' ? group.onToggle?.(String(raw)) : group.onSelect?.(raw)
                          }
                        />
                      );
                    })
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          <Button
            label={resultCount !== undefined ? `Show ${resultCount} results` : 'Apply filters'}
            onPress={onApply}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '80%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  clear: { fontSize: 14, fontWeight: '600' },
  body: { flexGrow: 0 },
  bodyContent: { gap: 20, paddingBottom: 16 },
  group: { gap: 10 },
  groupTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
