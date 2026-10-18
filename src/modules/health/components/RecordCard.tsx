import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDate } from '@/utils/format';

import { AttachmentPreview } from './AttachmentPreview';
import { RECORD_TYPE_ICON } from '../api';

import type { HealthRecord } from '../types';

export interface RecordCardProps {
  record: HealthRecord;
  onPress: (record: HealthRecord) => void;
  index?: number;
}

export const RecordCard = memo(function ({ record, onPress, index = 0 }: RecordCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const iconBg =
    record.type === 'allergy'
      ? theme.colors.dangerMuted
      : record.type === 'prescription'
        ? theme.colors.successMuted
        : record.type === 'lab_report' || record.type === 'vaccination'
          ? theme.colors.infoMuted
          : theme.colors.primaryMuted;

  const iconColor =
    record.type === 'allergy'
      ? theme.colors.danger
      : record.type === 'prescription'
        ? theme.colors.success
        : record.type === 'lab_report' || record.type === 'vaccination'
          ? theme.colors.info
          : theme.colors.primary;

  return (
    <AnimatedCard
      index={index}
      onPress={() => onPress(record)}
      style={styles.card}
      accessibilityLabel={`${record.type}: ${record.title}`}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={RECORD_TYPE_ICON[record.type]} size={20} color={iconColor} />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {record.title}
            </Text>
            {record.syncStatus === 'pending' ? (
              <Badge label={t('common.pendingSync')} tone="warning" size="sm" />
            ) : null}
          </View>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            {t(`health.${record.type}`)} · {formatDate(record.date)} · {record.provider}
          </Text>
        </View>
      </View>

      {record.description ? (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {record.description}
        </Text>
      ) : null}

      {record.tags.length > 0 ? (
        <View style={styles.tags}>
          {record.tags.slice(0, 4).map((tag) => (
            <Chip key={tag} label={tag} size="sm" />
          ))}
        </View>
      ) : null}

      {record.attachments.length > 0 ? (
        <AttachmentPreview attachments={record.attachments} />
      ) : null}
    </AnimatedCard>
  );
});


const styles = StyleSheet.create({
  card: { marginBottom: 10, gap: 8 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  meta: { fontSize: 12 },
  description: { fontSize: 13.5, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
