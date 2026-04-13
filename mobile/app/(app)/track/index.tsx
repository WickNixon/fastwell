import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Typography } from '@/lib/theme';

const TRACKING_CATEGORIES = [
  { key: 'weight', label: 'Weight', icon: '⚖️', route: '/(app)/track/weight' },
  { key: 'sleep', label: 'Sleep', icon: '🌙', route: '/(app)/track/sleep' },
  { key: 'water', label: 'Water', icon: '💧', route: '/(app)/track/water' },
  { key: 'steps', label: 'Steps', icon: '👣', route: '/(app)/track/steps' },
  { key: 'exercise', label: 'Exercise', icon: '🏃‍♀️', route: '/(app)/track/exercise' },
  { key: 'mood', label: 'Mood', icon: '🌿', route: '/(app)/track/mood' },
  { key: 'symptoms', label: 'Symptoms', icon: '📋', route: '/(app)/track/symptoms' },
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

      <View style={styles.grid}>
        {TRACKING_CATEGORIES.map((cat) => (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
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
});
