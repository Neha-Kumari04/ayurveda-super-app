import React, { memo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = memo(function ({
  label,
  error,
  containerStyle,
  inputStyle,
  leftElement,
  rightElement,
  ...rest
}: InputProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]} accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
        ]}
      >
        {leftElement}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }, inputStyle]}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          {...rest}
        />
        {rightElement}
      </View>
      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
  },
  error: { fontSize: 12 },
});
