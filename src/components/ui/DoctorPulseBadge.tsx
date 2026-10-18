import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface DoctorPulseBadgeProps {
  label?: string;
  isOnline?: boolean;
  size?: 'sm' | 'md';
  pulseColor?: string;
}

export function DoctorPulseBadge({
  label = 'Available Now',
  isOnline = true,
  size = 'md',
  pulseColor,
}: DoctorPulseBadgeProps) {
  const theme = useTheme();
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.7)).current;

  const activeColor = pulseColor ?? (isOnline ? theme.colors.pulseLive : theme.colors.textMuted);

  useEffect(() => {
    if (isOnline) {
      ringScale.setValue(1);
      ringOpacity.setValue(0.7);

      const animation = Animated.loop(
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 2.2,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => {
        animation.stop();
      };
    } else {
      ringScale.setValue(1);
      ringOpacity.setValue(0);
    }
  }, [isOnline, ringScale, ringOpacity]);

  const isSmall = size === 'sm';
  const dotSize = isSmall ? 6 : 8;

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: isOnline ? theme.colors.pulseLiveBg : theme.colors.borderLight,
          borderColor: isOnline ? `${activeColor}33` : theme.colors.border,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 8 : 10,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Doctor status: ${label}`}
    >
      <View style={[styles.dotWrapper, { width: dotSize, height: dotSize }]}>
        {isOnline ? (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: activeColor,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />
        ) : null}
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: activeColor,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.label,
          {
            color: isOnline ? activeColor : theme.colors.textMuted,
            fontSize: isSmall ? 11 : 12,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  dotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
  },
  dot: {
    zIndex: 1,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
