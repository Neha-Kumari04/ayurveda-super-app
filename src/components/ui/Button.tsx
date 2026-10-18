import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/theme/ThemeProvider';

import type { StyleProp, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  haptic?: boolean;
}

export const Button = memo(function ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  accessibilityLabel,
  haptic = true,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: theme.colors.primary, fg: theme.colors.onPrimary, border: 'transparent' },
    secondary: { bg: theme.colors.primaryMuted, fg: theme.colors.primary, border: 'transparent' },
    ghost: { bg: 'transparent', fg: theme.colors.primary, border: theme.colors.border },
    danger: { bg: theme.colors.dangerMuted, fg: theme.colors.danger, border: 'transparent' },
    success: { bg: theme.colors.success, fg: '#fff', border: 'transparent' },
  }[variant];

  const sizeStyles = {
    sm: { paddingVertical: 7, paddingHorizontal: 12, fontSize: 13 },
    md: { paddingVertical: 11, paddingHorizontal: 16, fontSize: 15 },
    lg: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 16 },
  }[size];

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return;
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: palette.fg, fontSize: sizeStyles.fontSize }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontWeight: '600' },
});
