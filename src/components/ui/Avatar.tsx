import React, { memo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface AvatarProps {
  uri: string;
  size?: number;
  rounded?: boolean;
  accessibilityLabel?: string;
}

const BLURHASH = 'L03[?n00_39G00_300of00WB';

export const Avatar = memo(function ({ uri, size = 48, rounded = true, accessibilityLabel }: AvatarProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : 12,
          backgroundColor: theme.colors.skeleton,
        },
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={BLURHASH}
        transition={200}
        cachePolicy="memory-disk"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
