import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FadeInDownView } from '@/components/ui/FadeInDownView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DoctorPulseBadge } from '@/components/ui/DoctorPulseBadge';
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

      {/* Clinical Patient / Doctor Identity Card */}
      <FadeInDownView duration={350}>
        <Card style={styles.card} elevated>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryMuted }]}>
              <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 20 }}>
                {user?.name?.charAt(0) ?? 'A'}
              </Text>
              <View style={[styles.avatarStatusDot, { backgroundColor: theme.colors.pulseLive }]} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{user?.name ?? 'Dr. Asha Vaidya'}</Text>
                <View style={[styles.roleBadge, { backgroundColor: theme.colors.primaryMuted }]}>
                  <Text style={[styles.roleText, { color: theme.colors.primary }]}>Active</Text>
                </View>
              </View>
              <Text style={[styles.email, { color: theme.colors.textMuted }]}>{user?.email}</Text>
              <DoctorPulseBadge label="Identity Verified · HIPAA Sec" isOnline size="sm" />
            </View>
          </View>
        </Card>
      </FadeInDownView>

      {/* Appearance Section */}
      <FadeInDownView delay={100} duration={400}>
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="color-palette-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.appearance')}</Text>
          </View>
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
      </FadeInDownView>

      {/* Security Section */}
      <FadeInDownView delay={180} duration={400}>
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.security')}</Text>
          </View>
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
      </FadeInDownView>

      {/* Sync Queue Section */}
      <FadeInDownView delay={240} duration={400}>
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="cloud-done-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.syncQueue')}</Text>
          </View>
          <View style={styles.syncRow}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
              {pendingOps} operation{pendingOps === 1 ? '' : 's'} waiting to sync
            </Text>
            {pendingOps > 0 ? <Badge label="Queued" tone="warning" size="sm" /> : <Badge label="Synchronized" tone="success" size="sm" />}
          </View>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            Offline bookings and records upload automatically when you reconnect.
          </Text>
        </Card>
      </FadeInDownView>

      {/* Diagnostics / Remote Config */}
      <FadeInDownView delay={300} duration={400}>
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="options-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.featureFlags')}</Text>
          </View>
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
      </FadeInDownView>

      {/* About Section & Sign Out */}
      <FadeInDownView delay={360} duration={400}>
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.section, { color: theme.colors.text }]}>{t('settings.about')}</Text>
          </View>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            {t('settings.version')} 1.0.0 · Clinical Telehealth & Ayurveda Super App.
          </Text>
          <Button label="Sign Out" variant="danger" onPress={() => void onSignOut()} />
        </Card>
      </FadeInDownView>
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
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarStatusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#FFFFFF' },
  profileInfo: { flex: 1, gap: 4 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 13 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchInfo: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 14.5, fontWeight: '600' },
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flagName: { fontSize: 13, flexShrink: 1, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
});
