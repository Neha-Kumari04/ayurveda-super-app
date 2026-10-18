import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { logger } from '@/core/logger/logger';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { EMPTY_PROFILE, useProfileStore, type Gender, type UserProfile } from '@/store/profileStore';

export type ProfileField = 'fullName' | 'phone' | 'email' | 'gender' | 'age' | 'address' | 'city' | 'pincode';

export interface UserDetailsFormModalProps {
  visible: boolean;
  title: string;
  description?: string;
  /** Which fields this form collects — validation runs on every field shown. */
  fields: ProfileField[];
  submitLabel: string;
  /** Initial values merged over the saved profile (e.g. account email). */
  defaults?: Partial<UserProfile>;
  /** When provided, a close/cancel button is shown (e.g. backing out of booking). */
  onClose?: () => void;
  onSubmit: (values: Partial<UserProfile>) => void;
}

function isValidField(field: ProfileField, value: UserProfile): boolean {
  switch (field) {
    case 'fullName':
      return value.fullName.trim().length >= 2;
    case 'phone':
      return /^\d{10}$/.test(value.phone);
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email);
    case 'gender':
      return value.gender !== '';
    case 'age': {
      const age = Number(value.age);
      return Number.isInteger(age) && age >= 1 && age <= 120;
    }
    case 'address':
      return value.address.trim().length >= 4;
    case 'city':
      return value.city.trim().length >= 2;
    case 'pincode':
      return /^\d{6}$/.test(value.pincode);
  }
}

/**
 * Full-screen details form used at three moments: after sign-in (identity),
 * before booking (patient details) and as the shared form the checkout
 * address section is prefilled from. Saved into the persisted profile store.
 */
export function UserDetailsFormModal({
  visible,
  title,
  description,
  fields,
  submitLabel,
  defaults,
  onClose,
  onSubmit,
}: UserDetailsFormModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((s) => s.profile);
  const saveProfile = useProfileStore((s) => s.saveProfile);

  const [form, setForm] = useState<UserProfile>({ ...EMPTY_PROFILE });
  const [showAllErrors, setShowAllErrors] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // Re-seed from the saved profile (+ account defaults) each time the form opens.
  useEffect(() => {
    if (visible) {
      setForm({ ...EMPTY_PROFILE, ...profile, ...defaults });
      setShowAllErrors(false);
    }
    // `defaults` is intentionally excluded — re-seeding on identity/defaults
    // churn mid-session would clobber in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, profile]);

  const setField = useCallback(
    (key: keyof UserProfile) => (value: string) => setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  const invalidFields = useMemo(() => fields.filter((field) => !isValidField(field, form)), [fields, form]);

  const onSubmitPress = useCallback(() => {
    if (invalidFields.length > 0) {
      setShowAllErrors(true);
      logger.warn('Profile form incomplete — submit blocked', { missing: invalidFields });
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const patch = Object.fromEntries(fields.map((field) => [field, form[field]])) as Partial<UserProfile>;
    saveProfile(patch);
    onSubmit(patch);
  }, [invalidFields, fields, form, saveProfile, onSubmit]);

  if (!visible) return null;

  const errorFor = (field: ProfileField): string | undefined => {
    const raw = form[field];
    if (raw === '' || isValidField(field, form)) return undefined;
    switch (field) {
      case 'phone':
        return t('profile.errorPhone');
      case 'email':
        return t('profile.errorEmail');
      case 'age':
        return t('profile.errorAge');
      case 'pincode':
        return t('profile.errorPincode');
      default:
        return t('profile.errorRequired');
    }
  };

  const touchedValue = (field: ProfileField): string => form[field] ?? '';
  // Errors appear after a field has content, or after a failed submit attempt.
  const showError = (field: ProfileField): string | undefined =>
    showAllErrors || touchedValue(field) !== '' ? errorFor(field) : undefined;

  const includes = (field: ProfileField): boolean => fields.includes(field);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
                {title}
              </Text>
              {description ? (
                <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
              ) : null}
            </View>
            {onClose ? (
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                style={[styles.close, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            ) : null}
          </View>

          {showAllErrors && invalidFields.length > 0 ? (
            <View
              accessibilityRole="alert"
              style={[styles.errorBanner, { borderColor: theme.colors.danger }]}
            >
              <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
              <Text style={[styles.errorBannerText, { color: theme.colors.danger }]}>
                {t('profile.fixErrors')}
              </Text>
            </View>
          ) : null}

          {includes('fullName') ? (
            <Input
              label={t('profile.fullName')}
              value={form.fullName}
              onChangeText={setField('fullName')}
              placeholder="Asha Sharma"
              autoComplete="name"
              error={showError('fullName')}
            />
          ) : null}
          {includes('phone') ? (
            <Input
              label={t('profile.phone')}
              value={form.phone}
              onChangeText={(v) => setField('phone')(v.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              keyboardType="phone-pad"
              error={showError('phone')}
            />
          ) : null}
          {includes('email') ? (
            <Input
              label={t('profile.email')}
              value={form.email}
              onChangeText={setField('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              error={showError('email')}
            />
          ) : null}
          {includes('gender') ? (
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>{t('profile.gender')}</Text>
              <SegmentedControl<Gender | ''>
                options={[
                  { value: 'male', label: t('profile.male') },
                  { value: 'female', label: t('profile.female') },
                  { value: 'other', label: t('profile.other') },
                ]}
                value={form.gender}
                onChange={(gender) => setForm((f) => ({ ...f, gender }))}
                accessibilityLabel={t('profile.gender')}
              />
              {showError('gender') ? (
                <Text style={[styles.error, { color: theme.colors.danger }]}>{errorFor('gender')}</Text>
              ) : null}
            </View>
          ) : null}
          {includes('age') ? (
            <Input
              label={t('profile.age')}
              value={form.age}
              onChangeText={(v) => setField('age')(v.replace(/\D/g, '').slice(0, 3))}
              placeholder="32"
              keyboardType="number-pad"
              error={showError('age')}
            />
          ) : null}
          {includes('address') ? (
            <Input
              label={t('profile.address')}
              value={form.address}
              onChangeText={setField('address')}
              placeholder="Flat / street / landmark"
              error={showError('address')}
            />
          ) : null}
          {includes('city') || includes('pincode') ? (
            <View style={styles.rowInputs}>
              {includes('city') ? (
                <Input
                  label={t('profile.city')}
                  value={form.city}
                  onChangeText={setField('city')}
                  placeholder="Pune"
                  containerStyle={styles.flex}
                  error={showError('city')}
                />
              ) : null}
              {includes('pincode') ? (
                <Input
                  label={t('profile.pincode')}
                  value={form.pincode}
                  onChangeText={(v) => setField('pincode')(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="411001"
                  keyboardType="number-pad"
                  containerStyle={styles.flex}
                  error={showError('pincode')}
                />
              ) : null}
            </View>
          ) : null}

          <Button label={submitLabel} onPress={onSubmitPress} fullWidth style={styles.submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  headerText: { flex: 1, gap: 4 },
  title: { fontSize: 22, fontWeight: '800' },
  description: { fontSize: 14, lineHeight: 20 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  errorBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  error: { fontSize: 12 },
  rowInputs: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  submit: { marginTop: 8 },
});
