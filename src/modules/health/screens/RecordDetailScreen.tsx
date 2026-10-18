import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ErrorState } from '@/components/ui/ErrorState';
import { FadeInDownView } from '@/components/ui/FadeInDownView';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDate, formatDateTime } from '@/utils/format';

import { AttachmentPreview } from '../components/AttachmentPreview';
import { RECORD_TYPE_ICON } from '../api';
import { useRecord } from '../hooks';

import type { HealthStackScreenProps } from '@/navigation/types';

type Props = HealthStackScreenProps<'RecordDetail'>;

export function RecordDetailScreen({ navigation, route }: Props) {
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
      showsVerticalScrollIndicator={false}
    >
      {/* Top Clinical Navigation Bar */}
      <FadeInDownView duration={350} style={styles.topNavRow}>
        <PressableScale
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </PressableScale>
        <Text style={[styles.navTitle, { color: theme.colors.text }]} numberOfLines={1}>
          Clinical Health Record
        </Text>
        <View style={[styles.verifiedPill, { backgroundColor: theme.colors.primaryMuted }]}>
          <Ionicons name="shield-checkmark" size={13} color={theme.colors.primary} />
          <Text style={[styles.verifiedPillText, { color: theme.colors.primary }]}>EHR Signed</Text>
        </View>
      </FadeInDownView>

      <FadeInDownView delay={60} duration={400}>
        <Card style={[styles.heroCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name={RECORD_TYPE_ICON[record.type]} size={32} color={theme.colors.primary} accessibilityElementsHidden />
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
              {record.title}
            </Text>
            <View style={styles.badgeRow}>
              <Badge label={t(`health.${record.type}`)} tone="info" size="sm" />
              {record.syncStatus === 'pending' ? (
                <Badge label={t('health.savedOffline')} tone="warning" size="sm" />
              ) : (
                <Badge label="Encrypted Sync" tone="success" size="sm" />
              )}
            </View>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {formatDateTime(record.date)} · Dr / Clinic: {record.provider}
            </Text>
          </View>
        </Card>
      </FadeInDownView>

      {record.description ? (
        <FadeInDownView delay={120} duration={400}>
          <Card style={[styles.card, { borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="document-text-outline" size={17} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Clinical Findings</Text>
            </View>
            <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{record.description}</Text>
          </Card>
        </FadeInDownView>
      ) : null}

      {metaEntries.length > 0 ? (
        <FadeInDownView delay={180} duration={400}>
          <Card style={[styles.card, { borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="fitness-outline" size={17} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Biometrics & Vitals</Text>
            </View>
            {metaEntries.map(([key, value]) => (
              <View key={key} style={[styles.metaRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.metaKey, { color: theme.colors.textMuted }]}>{formatLabel(key)}</Text>
                <Text style={[styles.metaValue, { color: theme.colors.primary }]}>
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </Text>
              </View>
            ))}
          </Card>
        </FadeInDownView>
      ) : null}

      {record.tags.length > 0 ? (
        <FadeInDownView delay={240} duration={400}>
          <Card style={[styles.card, { borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="pricetags-outline" size={17} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('health.tags')}</Text>
            </View>
            <View style={styles.tags}>
              {record.tags.map((tag) => (
                <Chip key={tag} label={tag} size="sm" selected />
              ))}
            </View>
          </Card>
        </FadeInDownView>
      ) : null}

      <FadeInDownView delay={300} duration={400}>
        <Card style={[styles.card, { borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="attach-outline" size={17} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('health.attachments')}</Text>
          </View>
          {record.attachments.length > 0 ? (
            <AttachmentPreview attachments={record.attachments} />
          ) : (
            <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t('health.noAttachments')}</Text>
          )}
        </Card>
      </FadeInDownView>

      <Text style={[styles.footnote, { color: theme.colors.textMuted }]}>
        Digitally Verified EHR Record · {formatDate(record.date)}
      </Text>
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
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: { flex: 1, gap: 6 },
  title: { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  meta: { fontSize: 12.5, lineHeight: 18 },
  card: { gap: 10, borderRadius: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 22 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  metaKey: { fontSize: 13, flexShrink: 1 },
  metaValue: { fontSize: 13.5, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  footnote: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
