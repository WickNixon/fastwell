import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Typography } from '@/lib/theme';

const DAILY_CATEGORIES = [
  { key: 'weight', label: 'Weight', icon: '⚖️', route: '/(app)/track/weight' },
  { key: 'sleep', label: 'Sleep', icon: '🌙', route: '/(app)/track/sleep' },
  { key: 'water', label: 'Water', icon: '💧', route: '/(app)/track/water' },
  { key: 'steps', label: 'Steps', icon: '👣', route: '/(app)/track/steps' },
  { key: 'exercise', label: 'Exercise', icon: '🏃‍♀️', route: '/(app)/track/exercise' },
  { key: 'mood', label: 'Mood', icon: '🌿', route: '/(app)/track/mood' },
  { key: 'symptoms', label: 'Symptoms', icon: '📋', route: '/(app)/track/symptoms' },
] as const;

const CLINICAL_CATEGORIES = [
  { key: 'hba1c', label: 'HbA1c', icon: '🩸', route: '/(app)/biomarkers/hba1c' },
  { key: 'glucose', label: 'Blood Glucose', icon: '📊', route: '/(app)/biomarkers/glucose' },
  { key: 'ketones', label: 'Ketones', icon: '🔥', route: '/(app)/biomarkers/ketones' },
] as const;

export default function TrackingHubScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>
        Track
      </Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 28 }]}>
        Everything is optional. Log what feels right today.
      </Text>

      {/* Daily tracking */}
      <View style={styles.grid}>
        {DAILY_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(cat.route as never)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Log ${cat.label}`}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[Typography.cardTitle, { color: theme.textPrimary, marginTop: 8 }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Biomarkers */}
      <Text style={[Typography.label, { color: theme.textMuted, marginTop: 32, marginBottom: 14 }]}>BIOMARKERS</Text>
      <View style={styles.grid}>
        {CLINICAL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(cat.route as never)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Log ${cat.label}`}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[Typography.cardTitle, { color: theme.textPrimary, marginTop: 8 }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Supplements */}
      <Text style={[Typography.label, { color: theme.textMuted, marginTop: 32, marginBottom: 14 }]}>SUPPLEMENTS & HRT</Text>
      <TouchableOpacity
        style={[styles.wideCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => router.push('/(app)/supplements' as never)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Manage supplements and HRT"
      >
        <Text style={styles.categoryIcon}>💊</Text>
        <View style={styles.wideCardText}>
          <Text style={[Typography.cardTitle, { color: theme.textPrimary }]}>Supplements & HRT</Text>
          <Text style={[Typography.muted, { color: theme.textMuted }]}>Log and manage your medications</Text>
        </View>
        <Text style={[Typography.muted, { color: theme.textMuted }]}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  categoryCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  categoryIcon: { fontSize: 32 },
  wideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    gap: 16,
    minHeight: 72,
  },
  wideCardText: { flex: 1, gap: 4 },
});
