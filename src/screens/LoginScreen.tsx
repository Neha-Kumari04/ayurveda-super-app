import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/toast/ToastProvider';
import { humanizeApiError } from '@/core/api/errors';
import { useBiometric } from '@/core/hooks/useBiometric';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';

export function LoginScreen() {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((s) => s.signIn);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const biometricEnabled = useSettingsStore((s) => s.isFeatureEnabled('biometric.enabled'));
  const biometric = useBiometric(biometricEnabled);

  const [email, setEmail] = useState('asha@ayurveda.dev');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const onSignIn = useCallback(async () => {
    if (!email.trim() || !password) {
      toast.error('Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      toast.error(humanizeApiError(error));
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn, toast]);

  const onBiometric = useCallback(async () => {
    setBioLoading(true);
    const ok = await biometric.authenticate();
    setBioLoading(false);
    if (ok) {
      // Demo app: biometric success signs in with the stored demo credentials.
      await onSignIn();
    } else {
      toast.warning('Biometric authentication cancelled');
    }
  }, [biometric, onSignIn, toast]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 40 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.logo} accessibilityElementsHidden>
          🌿
        </Text>
        <Text style={[styles.appName, { color: theme.colors.text }]} accessibilityRole="header">
          Ayurveda Super App
        </Text>
        <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>
          Consultations · Shop · Health Records
        </Text>
      </View>

      {sessionExpired ? (
        <Text style={[styles.expired, { color: theme.colors.warning }]} accessibilityRole="alert">
          Your session expired. Please sign in again.
        </Text>
      ) : null}

      <Card style={styles.card}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Button label="Sign in" onPress={() => void onSignIn()} loading={loading} fullWidth />
        {biometric.isAvailable && biometric.isEnrolled ? (
          <Button
            label="Use biometrics"
            variant="secondary"
            onPress={() => void onBiometric()}
            loading={bioLoading}
            fullWidth
          />
        ) : null}
      </Card>

      <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
        Demo mode: any email + password (4+ chars) works.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, gap: 16 },
  hero: { alignItems: 'center', gap: 6, marginBottom: 12 },
  logo: { fontSize: 48 },
  appName: { fontSize: 24, fontWeight: '800' },
  tagline: { fontSize: 13 },
  expired: { fontSize: 13, textAlign: 'center', fontWeight: '600' },
  card: { gap: 14 },
  hint: { fontSize: 12, textAlign: 'center' },
});
