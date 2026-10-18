import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Branded first-frame screen shown while the app bootstraps (auth, sync,
 * remote config) — the native splash hands off to this view.
 */
export function BootScreen() {
  return (
    <View style={styles.container} accessibilityRole="header">
      <Ionicons name="leaf" size={64} color="#1B5E20" accessibilityElementsHidden />
      <Text style={styles.title}>Ayurveda Super App</Text>
      <Text style={styles.subtitle}>Consultations · Shop · Health Records</Text>
      <ActivityIndicator color="#1B5E20" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4FE',
    gap: 6,
    padding: 32,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#132A17' },
  subtitle: { fontSize: 13, color: '#3E5C46' },
  spinner: { marginTop: 16 },
});
