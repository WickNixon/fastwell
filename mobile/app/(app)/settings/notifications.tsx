import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useTheme, Typography } from '@/lib/theme';

const storage = new MMKV({ id: 'fastwell-notifications' });

const NOTIFICATION_PREFS = [
  {
    key: 'fast_reminder',
    label: 'Fasting reminders',
    description: 'Gentle nudge when your fast window opens',
  },
  {
    key: 'water_reminder',
    label: 'Water reminders',
    description: 'Mid-day reminder to log your water',
  },
  {
    key: 'badge_alerts',
    label: 'Badge celebrations',
    description: 'Notification when you earn a new badge',
  },
  {
    key: 'insight_alerts',
    label: 'Daily insights',
    description: 'Your personalised AI insight is ready',
  },
  {
    key: 'weekly_nudge',
    label: 'Weekly check-in',
    description: 'A gentle check-in if you\'ve gone quiet',
  },
] as const;

type PrefKey = typeof NOTIFICATION_PREFS[number]['key'];

function getPref(key: PrefKey): boolean {
  const stored = storage.getString(key);
  return stored === undefined ? true : stored === 'true';
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(() => {
    const initial = {} as Record<PrefKey, boolean>;
    NOTIFICATION_PREFS.forEach((p) => { initial[p.key] = getPref(p.key); });
    return initial;
  });

  const toggle = (key: PrefKey, value: boolean) => {
    storage.set(key, String(value));
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 8 }]}>Notifications</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 32 }]}>
        Choose which reminders work for you. None of these are mandatory.
      </Text>

      <View style={[styles.prefsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {NOTIFICATION_PREFS.map((pref, idx) => (
          <View
            key={pref.key}
            style={[
              styles.prefRow,
              idx < NOTIFICATION_PREFS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
            ]}
          >
            <View style={styles.prefText}>
              <Text style={[Typography.cardTitle, { color: theme.textPrimary }]}>{pref.label}</Text>
              <Text style={[Typography.muted, { color: theme.textMuted }]}>{pref.description}</Text>
            </View>
            <Switch
              value={prefs[pref.key]}
              onValueChange={(v) => toggle(pref.key, v)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel={pref.label}
            />
          </View>
        ))}
      </View>

      <Text style={[Typography.muted, { color: theme.textMuted, marginTop: 20, textAlign: 'center', paddingHorizontal: 16 }]}>
        Notification permissions are managed in your phone's Settings app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  prefsCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 16, minHeight: 72 },
  prefText: { flex: 1, gap: 4 },
});
