import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/toast/ToastProvider';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { useIsOnline } from '@/core/sync/networkMonitor';

import { useCreateRecord } from '../hooks';
import { validateRecordDraft } from '../utils';

import type { RecordType } from '../types';
import type { HealthStackScreenProps } from '@/navigation/types';

type Props = HealthStackScreenProps<'AddRecord'>;

const TYPES: RecordType[] = ['lab_report', 'prescription', 'consultation', 'vaccination', 'allergy'];
const SUGGESTED_TAGS = ['routine', 'follow-up', 'urgent', 'chronic', 'wellness', 'diagnostic'];

export function AddRecordScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const isOnline = useIsOnline();
  const createMutation = useCreateRecord();

  const [type, setType] = useState<RecordType>('lab_report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [provider, setProvider] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const validation = validateRecordDraft({ title, date, provider });

  const toggleTag = useCallback((tag: string) => {
    setTags((current) => (current.includes(tag) ? current.filter((t2) => t2 !== tag) : [...current, tag]));
  }, []);

  const onSubmit = useCallback(async () => {
    setTouched(true);
    if (!validation.ok) return;
    try {
      await createMutation.mutateAsync({
        type,
        title: title.trim(),
        description: description.trim(),
        date: new Date(date).toISOString(),
        provider: provider.trim(),
        tags,
      });
      toast.success(isOnline ? 'Record saved' : t('health.savedOffline'));
      navigation.goBack();
    } catch {
      toast.error('Could not save the record. Please try again.');
    }
  }, [validation.ok, createMutation, type, title, description, date, provider, tags, toast, isOnline, t, navigation]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
          {t('health.addRecord')}
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Type</Text>
          <SegmentedControl
            options={TYPES.map((value) => ({ value, label: t(`health.${value}`) }))}
            value={type}
            onChange={setType}
            accessibilityLabel="Record type"
          />
        </Card>

        <Card style={styles.card}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Lipid Profile — annual check"
            error={touched && validation.errors.title ? validation.errors.title : undefined}
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional details, results, notes…"
            multiline
            numberOfLines={3}
          />
          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            error={touched && validation.errors.date ? validation.errors.date : undefined}
          />
          <Input
            label={t('health.provider')}
            value={provider}
            onChangeText={setProvider}
            placeholder="e.g. Kottakkal Arya Vaidya Sala"
            error={touched && validation.errors.provider ? validation.errors.provider : undefined}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('health.tags')}</Text>
          <View style={styles.tags}>
            {SUGGESTED_TAGS.map((tag) => (
              <Chip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
            ))}
          </View>
        </Card>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        {!isOnline ? (
          <Text style={[styles.offlineHint, { color: theme.colors.warning }]}>
            Offline — the record will sync automatically
          </Text>
        ) : null}
        <Button
          label={t('common.save')}
          onPress={() => void onSubmit()}
          loading={createMutation.isPending}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  card: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
  },
  offlineHint: { fontSize: 12, textAlign: 'center' },
});
