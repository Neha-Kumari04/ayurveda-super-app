import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/toast/ToastProvider';
import { useBiometric } from '@/core/hooks/useBiometric';
import { getPendingCount, subscribeSyncQueue } from '@/core/sync/syncQueue';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore, type Locale, type ThemeMode } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'SettingsTab'>;

export function SettingsScreen(_props: Props) {
  const theme = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const remoteConfig = useSettingsStore((s) => s.remoteConfig);
  const isFeatureEnabled = useSettingsStore((s) => s.isFeatureEnabled);
  const fetchRemoteConfig = useSettingsStore((s) => s.fetchRemoteConfig);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const biometricEnabled = isFeatureEnabled('biometric.enabled');
  const biometric = useBiometric(biometricEnabled);
  const [biometricLocked, setBiometricLocked] = useState(false);

  const [pendingOps, setPendingOps] = useState(() => getPendingCount());

  useEffect(() => subscribeSyncQueue(() => setPendingOps(getPendingCount())), []);

  useEffect(() => {
    void fetchRemoteConfig();
  }, [fetchRemoteConfig]);

  const onSignOut = useCallback(async () => {
    await signOut();
    toast.info('Signed out');
  }, [signOut, toast]);

  const flags = remoteConfig?.flags ?? {};

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
        {t('settings.title')}
      </Text>

      <Card style={styles.card}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryMuted }]}>
            <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 18 }}>
              {user?.name?.charAt(0) ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{user?.name ?? 'Guest'}</Text>
            <Text style={[styles.email, { color: theme.colors.textMuted }]}>{user?.email}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.appearance')}</Text>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('settings.theme')}</Text>
        <SegmentedControl
          options={[
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
            { value: 'system', label: t('settings.themeSystem') },
          ]}
          value={themeMode}
          onChange={(value: ThemeMode) => setThemeMode(value)}
          accessibilityLabel={t('settings.theme')}
        />
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('settings.language')}</Text>
        <SegmentedControl
          options={[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'हिन्दी' },
          ]}
          value={locale}
          onChange={(value: Locale) => setLocale(value)}
          accessibilityLabel={t('settings.language')}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.security')}</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>{t('settings.biometric')}</Text>
            <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
              {biometric.isAvailable && biometric.isEnrolled
                ? 'Require biometrics to unlock the app'
                : 'No biometrics enrolled on this device'}
            </Text>
          </View>
          <Switch
            value={biometricLocked}
            onValueChange={(value) => setBiometricLocked(value)}
            disabled={!biometric.isAvailable || !biometric.isEnrolled}
            trackColor={{ true: theme.colors.primary }}
            accessibilityLabel={t('settings.biometric')}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.syncQueue')}</Text>
        <View style={styles.syncRow}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
            {pendingOps} operation{pendingOps === 1 ? '' : 's'} waiting to sync
          </Text>
          {pendingOps > 0 ? <Badge label="Queued" tone="warning" size="sm" /> : <Badge label="Idle" tone="success" size="sm" />}
        </View>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          Offline bookings and records upload automatically when you reconnect.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.featureFlags')}</Text>
        {Object.keys(flags).length === 0 ? (
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            Flags load from remote config on launch (or use local env fallbacks).
          </Text>
        ) : (
          Object.entries(flags).map(([flag, enabled]) => (
            <View key={flag} style={styles.flagRow}>
              <Text style={[styles.flagName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {flag}
              </Text>
              <Badge label={enabled ? 'enabled' : 'disabled'} tone={enabled ? 'success' : 'neutral'} size="sm" />
            </View>
          ))
        )}
        <Button label="Refresh remote config" variant="ghost" size="sm" onPress={() => void fetchRemoteConfig()} />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.about')}</Text>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {t('settings.version')} 1.0.0 · Architecture demo with offline-first sync.
        </Text>
        <Button label="Sign out" variant="danger" onPress={() => void onSignOut()} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  card: { gap: 12 },
  section: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 12.5, lineHeight: 17 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchInfo: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 14.5, fontWeight: '600' },
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flagName: { fontSize: 13, flexShrink: 1, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
});
