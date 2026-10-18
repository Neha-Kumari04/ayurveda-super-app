import React, { memo, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/theme/ThemeProvider';

export interface VoiceSearchButtonProps {
  isListening: boolean;
  onPress: () => void;
  onCancel?: () => void;
}

/**
 * Animated microphone button for voice search.
 *
 * Idle  — solid mic icon.
 * Listen — pulsing rings + red tint (tap again to cancel).
 */
export const VoiceSearchButton = memo(function ({
  isListening,
  onPress,
  onCancel,
}: VoiceSearchButtonProps) {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      AccessibilityInfo.announceForAccessibility('Listening… speak now');
      return () => pulse.stop();
    }
    pulseAnim.setValue(0);
  }, [isListening, pulseAnim]);

  const handlePress = () => {
    // Scale bounce on press.
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    if (isListening) {
      onCancel?.();
      AccessibilityInfo.announceForAccessibility('Voice search cancelled');
    } else {
      onPress();
    }
  };

  const ringOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const ringScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Stop voice search' : 'Start voice search'}
      accessibilityState={{ selected: isListening }}
      style={styles.container}
    >
      {/* Pulse rings (visible only while listening) */}
      {isListening ? (
        <>
          <Animated.View
            style={[
              styles.ring,
              { backgroundColor: theme.colors.danger, opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.ring,
              {
                backgroundColor: theme.colors.danger,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
            pointerEvents="none"
          />
        </>
      ) : null}

      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: isListening ? theme.colors.danger : theme.colors.primary,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons name={isListening ? 'stop' : 'mic'} size={18} color={theme.colors.onPrimary} />
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
