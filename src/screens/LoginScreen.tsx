import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInDownView } from '@/components/ui/FadeInDownView';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DoctorPulseBadge } from '@/components/ui/DoctorPulseBadge';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
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
      style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 20 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FadeInDownView duration={400} style={styles.hero}>
        <View style={[styles.emblemBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }, theme.shadows.card]}>
          <Ionicons name="medkit" size={36} color={theme.colors.primary} />
          <View style={[styles.emblemBadge, { backgroundColor: theme.colors.pulseLive }]}>
            <Ionicons name="pulse" size={12} color="#FFFFFF" />
          </View>
        </View>
        <Text style={[styles.appName, { color: theme.colors.text }]} accessibilityRole="header">
          AyurMed Healthcare
        </Text>
        <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>
          Consultations · Dispensary · Health Records
        </Text>
        <DoctorPulseBadge label="Clinical Systems Operational" isOnline size="sm" />
      </FadeInDownView>

      {sessionExpired ? (
        <FadeInDownView duration={300}>
          <Text style={[styles.expired, { color: theme.colors.warning }]} accessibilityRole="alert">
            Your clinical session expired. Please sign in again.
          </Text>
        </FadeInDownView>
      ) : null}

      <FadeInDownView delay={120} duration={450}>
        <Card style={styles.card} elevated>
          <View style={styles.cardHeader}>
            <Text style={[styles.portalTitle, { color: theme.colors.text }]}>Patient & Doctor Access</Text>
            <View style={[styles.secureBadge, { backgroundColor: theme.colors.primaryMuted }]}>
              <Ionicons name="lock-closed" size={11} color={theme.colors.primary} />
              <Text style={[styles.secureText, { color: theme.colors.primary }]}>256-bit Encrypted</Text>
            </View>
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="asha@ayurveda.dev"
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
              label="Use Biometrics"
              variant="secondary"
              onPress={() => void onBiometric()}
              loading={bioLoading}
              icon={<Ionicons name="finger-print" size={18} color={theme.colors.primary} />}
              fullWidth
            />
          ) : null}

          {/* Quick Demo Autofill */}
          <View style={[styles.demoRow, { borderTopColor: theme.colors.borderLight }]}>
            <Text style={[styles.demoLabel, { color: theme.colors.textMuted }]}>Autofill:</Text>
            <PressableScale
              onPress={() => {
                setEmail('asha@ayurveda.dev');
                setPassword('demo1234');
              }}
              style={[styles.demoPill, { backgroundColor: theme.colors.borderLight }]}
            >
              <Text style={[styles.demoPillText, { color: theme.colors.textSecondary }]}>Patient Demo</Text>
            </PressableScale>
            <PressableScale
              onPress={() => {
                setEmail('dr.sharma@ayurveda.dev');
                setPassword('demo1234');
              }}
              style={[styles.demoPill, { backgroundColor: theme.colors.borderLight }]}
            >
              <Text style={[styles.demoPillText, { color: theme.colors.textSecondary }]}>Doctor Demo</Text>
            </PressableScale>
          </View>
        </Card>
      </FadeInDownView>

      <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
        HIPAA & AYUSH Compliant · Encrypted Telehealth Gateway
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 16 },
  hero: { alignItems: 'center', gap: 6, marginBottom: 8 },
  emblemBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  emblemBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  appName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  tagline: { fontSize: 13 },
  expired: { fontSize: 13, textAlign: 'center', fontWeight: '600' },
  card: { gap: 12, padding: 18, borderRadius: 18 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  portalTitle: { fontSize: 16, fontWeight: '700' },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  secureText: { fontSize: 10.5, fontWeight: '700' },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  demoLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  demoPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  demoPillText: { fontSize: 11.5, fontWeight: '600' },
  hint: { fontSize: 11.5, textAlign: 'center', lineHeight: 16 },
});

