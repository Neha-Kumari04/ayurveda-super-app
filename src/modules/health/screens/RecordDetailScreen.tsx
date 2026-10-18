import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDate, formatDateTime } from '@/utils/format';

import { AttachmentPreview } from '../components/AttachmentPreview';
import { RECORD_TYPE_ICON } from '../api';
import { useRecord } from '../hooks';

import type { HealthStackScreenProps } from '@/navigation/types';

type Props = HealthStackScreenProps<'RecordDetail'>;

export function RecordDetailScreen({ route }: Props) {
  const { recordId } = route.params;
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const recordQuery = useRecord(recordId);

  if (recordQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8 }]}>
        <View style={styles.loading}>
          <Skeleton width="70%" height={24} />
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={80} />
        </View>
      </View>
    );
  }

  if (recordQuery.error || !recordQuery.data) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8 }]}>
        <ErrorState error={recordQuery.error} onRetry={() => void recordQuery.refetch()} />
      </View>
    );
  }

  const record = recordQuery.data;
  const metaEntries = Object.entries(record.meta).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== undefined && value !== null;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
    >
      <View style={styles.hero}>
        <Text style={styles.heroIcon} accessibilityElementsHidden>
          {RECORD_TYPE_ICON[record.type]}
        </Text>
        <View style={styles.heroInfo}>
          <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
            {record.title}
          </Text>
          <Badge label={t(`health.${record.type}`)} tone="info" size="sm" />
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            {formatDateTime(record.date)} · {record.provider}
          </Text>
        </View>
      </View>

      {record.syncStatus === 'pending' ? (
        <Badge label={t('health.savedOffline')} tone="warning" />
      ) : null}

      {record.description ? (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Details</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{record.description}</Text>
        </Card>
      ) : null}

      {metaEntries.length > 0 ? (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Clinical information</Text>
          {metaEntries.map(([key, value]) => (
            <View key={key} style={styles.metaRow}>
              <Text style={[styles.metaKey, { color: theme.colors.textMuted }]}>{formatLabel(key)}</Text>
              <Text style={[styles.metaValue, { color: theme.colors.text }]}>
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {record.tags.length > 0 ? (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('health.tags')}</Text>
          <View style={styles.tags}>
            {record.tags.map((tag) => (
              <Chip key={tag} label={tag} size="sm" selected />
            ))}
          </View>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('health.attachments')}</Text>
        {record.attachments.length > 0 ? (
          <AttachmentPreview attachments={record.attachments} />
        ) : (
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t('health.noAttachments')}</Text>
        )}
      </Card>

      <Text style={[styles.footnote, { color: theme.colors.textMuted }]}>Recorded {formatDate(record.date)}</Text>
    </ScrollView>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  loading: { gap: 12, padding: 16 },
  hero: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  heroIcon: { fontSize: 36 },
  heroInfo: { flex: 1, gap: 6 },
  title: { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  meta: { fontSize: 13 },
  card: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metaKey: { fontSize: 13, flexShrink: 1 },
  metaValue: { fontSize: 13.5, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footnote: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
