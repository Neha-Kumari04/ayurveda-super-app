import React, { memo, useState } from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import type { Attachment } from '../types';

export interface AttachmentPreviewProps {
  attachments: Attachment[];
}

/**
 * Attachment strip: image thumbnails + PDF tiles with page-count hint.
 * Tapping an attachment opens a full-screen preview (images inline; PDFs
 * hand off to the system viewer via the URL).
 */
export const AttachmentPreview = memo(function ({ attachments }: AttachmentPreviewProps) {
  const theme = useTheme();
  const [viewer, setViewer] = useState<Attachment | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const open = (attachment: Attachment) => {
    if (attachment.kind === 'pdf') {
      void Linking.openURL(attachment.url).catch(() => {
        // If no PDF viewer is available, fall back to in-app image-style preview.
        setViewer(attachment);
      });
    } else {
      setViewer(attachment);
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {attachments.map((attachment) => (
          <Pressable
            key={attachment.id}
            onPress={() => open(attachment)}
            accessibilityRole="button"
            accessibilityLabel={`Open attachment ${attachment.name}`}
            style={[styles.tile, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          >
            {attachment.kind === 'image' ? (
              <Image source={{ uri: attachment.url }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.pdfTile, { backgroundColor: theme.colors.dangerMuted }]}>
                <Text style={[styles.pdfIcon, { color: theme.colors.danger }]}>PDF</Text>
              </View>
            )}
            <Text style={[styles.name, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {attachment.name}
            </Text>
            <Text style={[styles.size, { color: theme.colors.textMuted }]}>{attachment.sizeKb} KB</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={viewer !== null} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable
          style={[styles.viewerBackdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={() => setViewer(null)}
          accessibilityLabel="Close preview"
        >
          <View style={[styles.viewerCard, { backgroundColor: theme.colors.surface }]} onStartShouldSetResponder={() => true}>
            {viewer?.kind === 'image' ? (
              <Image source={{ uri: viewer.url }} style={styles.viewerImage} resizeMode="contain" />
            ) : (
              <View style={styles.pdfPreview}>
                <Text style={[styles.pdfIconLarge, { color: theme.colors.danger }]}>PDF</Text>
                <Text style={[styles.viewerName, { color: theme.colors.text }]} numberOfLines={2}>
                  {viewer?.name}
                </Text>
                <Text style={[styles.size, { color: theme.colors.textMuted }]}>
                  Opens in your system PDF viewer
                </Text>
              </View>
            )}
            <Text style={[styles.viewerName, { color: theme.colors.textMuted, marginTop: 8 }]} numberOfLines={1}>
              {viewer?.name}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: 96,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 4,
  },
  thumb: { width: '100%', height: 64, borderRadius: 6, backgroundColor: '#00000010' },
  pdfTile: { width: '100%', height: 64, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  pdfIcon: { fontSize: 13, fontWeight: '800' },
  name: { fontSize: 11 },
  size: { fontSize: 10 },
  viewerBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  viewerCard: { borderRadius: 16, padding: 16, maxWidth: 480, width: '100%', alignItems: 'center' },
  viewerImage: { width: '100%', height: 360, borderRadius: 12 },
  pdfPreview: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  pdfIconLarge: { fontSize: 42, fontWeight: '800' },
  viewerName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
