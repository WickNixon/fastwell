import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Typography } from '@/lib/theme';

const INTEGRATIONS = [
  {
    key: 'apple_health',
    name: 'Apple Health',
    description: 'Sync steps, sleep, and heart rate automatically from HealthKit.',
    status: 'coming_soon',
    icon: '🍎',
  },
  {
    key: 'garmin',
    name: 'Garmin Connect',
    description: 'Pull activity, sleep, and stress data from your Garmin device.',
    status: 'coming_soon',
    icon: '⌚',
  },
  {
    key: 'oura',
    name: 'Oura Ring',
    description: 'Deep sleep and HRV data from your Oura ring.',
    status: 'coming_soon',
    icon: '💍',
  },
] as const;

export default function IntegrationsScreen() {
  const theme = useTheme();

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 8 }]}>Integrations</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 32 }]}>
        Connect your wearables so Fastwell can see the full picture — without you having to log everything manually.
      </Text>

      {INTEGRATIONS.map((integration) => (
        <View
          key={integration.key}
          style={[styles.integrationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={styles.icon}>{integration.icon}</Text>
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={[Typography.cardTitle, { color: theme.textPrimary }]}>{integration.name}</Text>
              <View style={[styles.badge, { backgroundColor: theme.greenPale, borderColor: theme.primary }]}>
                <Text style={[Typography.label, { color: theme.primary }]}>Coming soon</Text>
              </View>
            </View>
            <Text style={[Typography.muted, { color: theme.textMuted }]}>{integration.description}</Text>
          </View>
        </View>
      ))}

      <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[Typography.muted, { color: theme.textMuted, textAlign: 'center', lineHeight: 22 }]}>
          Integrations are coming in the next update. Everything you log manually is already working — these will just make it easier.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  integrationCard: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12, gap: 14 },
  icon: { fontSize: 28, marginTop: 2 },
  cardBody: { flex: 1, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  infoBox: { borderWidth: 1, borderRadius: 14, padding: 20, marginTop: 12 },
});
