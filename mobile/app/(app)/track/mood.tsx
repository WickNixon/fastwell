import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

const MOOD_OPTIONS = [
  { value: 1, label: 'Low', emoji: '😔' },
  { value: 2, label: 'Okay', emoji: '😐' },
  { value: 3, label: 'Alright', emoji: '🙂' },
  { value: 4, label: 'Good', emoji: '😊' },
  { value: 5, label: 'Great', emoji: '😄' },
];

export default function MoodScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('health_entries')
      .select('value')
      .eq('user_id', profile.id)
      .eq('entry_date', today)
      .eq('metric', 'mood')
      .single()
      .then(({ data }) => { if (data?.value) setSelected(data.value); });
  }, [profile]);

  const logMood = async (value: number) => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(value);

    await supabase.from('health_entries').upsert({
      user_id: profile.id,
      entry_date: today,
      metric: 'mood',
      value,
      unit: '1-5',
      source: 'manual',
    }, { onConflict: 'user_id,entry_date,metric,source' });

    setSaved(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Mood</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 40 }]}>How are you feeling today?</Text>

      <View style={styles.moodRow}>
        {MOOD_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.moodButton,
              { borderColor: selected === opt.value ? theme.primary : theme.border, backgroundColor: selected === opt.value ? theme.greenPale : theme.surface },
            ]}
            onPress={() => logMood(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === opt.value }}
            accessibilityLabel={opt.label}
          >
            <Text style={styles.moodEmoji}>{opt.emoji}</Text>
            <Text style={[Typography.label, { color: theme.textMuted, marginTop: 4 }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {saved && (
        <Text style={[Typography.body, { color: theme.primary, textAlign: 'center', marginTop: 24, fontFamily: 'Montserrat-SemiBold' }]}>
          Logged ✓
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 56 },
  moodRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  moodButton: { flex: 1, borderWidth: 2, borderRadius: 12, paddingVertical: 16, alignItems: 'center', minHeight: 80 },
  moodEmoji: { fontSize: 28 },
});
