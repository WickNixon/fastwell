import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

const ENERGY_LEVELS = [
  { value: 1, label: 'Exhausted', emoji: '😴' },
  { value: 2, label: 'Low', emoji: '😔' },
  { value: 3, label: 'Okay', emoji: '🙂' },
  { value: 4, label: 'Good', emoji: '😊' },
  { value: 5, label: 'Energised', emoji: '⚡' },
];

export default function EnergyScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('health_entries')
      .select('value')
      .eq('user_id', profile.id)
      .eq('entry_date', today)
      .eq('metric', 'energy')
      .eq('source', 'manual')
      .single()
      .then(({ data }) => {
        if (data?.value != null) setSelected(data.value);
      });
  }, [profile]);

  const handleSelect = async (value: number) => {
    if (!profile || saving) return;
    setSelected(value);
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error } = await supabase.from('health_entries').upsert({
      user_id: profile.id,
      entry_date: today,
      metric: 'energy',
      value,
      unit: 'scale_1_5',
      source: 'manual',
    }, { onConflict: 'user_id,entry_date,metric,source' });

    if (!error) {
      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSaving(false);
  };

  const selectedLevel = ENERGY_LEVELS.find((e) => e.value === selected);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Energy</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 40 }]}>
        How are your energy levels today?
      </Text>

      {saved && selectedLevel && (
        <View style={[styles.savedBanner, { backgroundColor: theme.greenPale, borderColor: theme.primary }]}>
          <Text style={[Typography.body, { color: theme.primary, fontFamily: 'Montserrat-SemiBold' }]}>
            {selectedLevel.emoji} {selectedLevel.label} — logged.
          </Text>
        </View>
      )}

      <View style={styles.levels}>
        {ENERGY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.levelCard,
              {
                backgroundColor: selected === level.value ? theme.greenPale : theme.surface,
                borderColor: selected === level.value ? theme.primary : theme.border,
                borderWidth: selected === level.value ? 2 : 1,
              },
            ]}
            onPress={() => handleSelect(level.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === level.value }}
            accessibilityLabel={level.label}
          >
            <Text style={styles.emoji}>{level.emoji}</Text>
            <Text style={[Typography.label, { color: selected === level.value ? theme.primary : theme.textMuted, marginTop: 8 }]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  savedBanner: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 28, alignItems: 'center' },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  levelCard: {
    width: '43%',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  emoji: { fontSize: 32 },
});
