import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/core/sync/networkMonitor';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/** Slim banner shown whenever the device is offline. */
export const OfflineBanner = memo(function () {
  const theme = useTheme();
  const isOnline = useIsOnline();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View
      style={[styles.banner, { backgroundColor: theme.colors.warningMuted, paddingTop: insets.top * 0 + 6 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: theme.colors.warning }]} numberOfLines={1}>
        {t('common.offline')}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  banner: { paddingVertical: 6, paddingHorizontal: 16, alignItems: 'center' },
  text: { fontSize: 12, fontWeight: '600' },
});
