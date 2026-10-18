import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { FadeInDownView } from './FadeInDownView';
import { PressableScale } from './PressableScale';

import type { StyleProp, ViewStyle } from 'react-native';

export interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  index?: number;
  accessibilityLabel?: string;
}

export const AnimatedCard = memo(function ({
  children,
  onPress,
  style,
  padded = true,
  elevated = true,
  index = 0,
  accessibilityLabel,
}: AnimatedCardProps) {
  const theme = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
      borderColor: theme.colors.border,
      padding: padded ? theme.spacing.lg : 0,
      borderRadius: theme.radius.lg,
    },
    elevated ? theme.shadows.card : null,
    style,
  ];

  const content = (
    <FadeInDownView delay={Math.min(index * 55, 350)} style={cardStyle}>
      {children}
    </FadeInDownView>
  );

  if (!onPress) {
    return content;
  }

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeScale={0.97}
    >
      <FadeInDownView delay={Math.min(index * 55, 350)} style={cardStyle}>
        {children}
      </FadeInDownView>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
