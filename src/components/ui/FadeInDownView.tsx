import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import type { StyleProp, ViewStyle } from 'react-native';

export interface FadeInDownViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeInDownView({
  children,
  delay = 0,
  duration = 380,
  distance = 18,
  style,
}: FadeInDownViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const runAnimation = () => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    };

    if (delay > 0) {
      timer = setTimeout(runAnimation, delay);
    } else {
      runAnimation();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [delay, distance, duration, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
