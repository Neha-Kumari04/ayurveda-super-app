import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';

import type { StyleProp, ViewStyle } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  accessibilityLabel?: string;
}

export const Card = memo(function ({
  children,
  onPress,
  style,
  padded = true,
  elevated = false,
  accessibilityLabel,
}: CardProps) {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
          borderColor: theme.colors.border,
          padding: padded ? theme.spacing.lg : 0,
          borderRadius: theme.radius.lg,
        },
        elevated ? theme.shadows.card : null,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeScale={0.98}
    >
      {content}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});

