import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { HealthEntry } from '@/lib/types';

const EXERCISE_TYPES = ['Walk', 'Run', 'Swim', 'Cycle', 'Strength', 'Yoga', 'Pilates', 'Other'];
const INTENSITY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'light', label: 'Light' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'vigorous', label: 'Vigorous' },
];

export default function ExerciseScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [selectedType, setSelectedType] = useState('Walk');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [saving, setSaving] = useState(false);
  const [todayEntries, setTodayEntries] = useState<HealthEntry[]>([]);
  const today = new Date().toISOString().split('T')[0];

  const loadToday = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('health_entries')
      .select('*')
      .eq('user_id', profile.id)
      .eq('entry_date', today)
      .eq('metric', 'exercise_minutes')
      .order('created_at', { ascending: false });
    setTodayEntries(data ?? []);
  };

  useEffect(() => { loadToday(); }, [profile]);

  const handleLog = async () => {
    if (!profile || saving) return;
    const mins = parseInt(duration, 10);
    if (isNaN(mins) || mins <= 0) { Alert.alert('Enter duration in minutes'); return; }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error } = await supabase.from('health_entries').insert({
      user_id: profile.id,
      entry_date: today,
      metric: 'exercise_minutes',
      value: mins,
      value_text: `${selectedType} — ${intensity}`,
      unit: 'minutes',
      source: 'manual',
    });

    if (!error) {
      setDuration('');
      await loadToday();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSaving(false);
  };

  const totalMinutes = todayEntries.reduce((sum, e) => sum + (e.value ?? 0), 0);

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Exercise</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 28 }]}>
        {totalMinutes > 0 ? `${totalMinutes} minutes logged today` : "What did you do today?"}
      </Text>

      {/* Type selector */}
      <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 10 }]}>TYPE</Text>
      <View style={styles.chipRow}>
        {EXERCISE_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.chip,
              { borderColor: selectedType === t ? theme.primary : theme.border, backgroundColor: selectedType === t ? theme.greenPale : theme.surface },
            ]}
            onPress={() => setSelectedType(t)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedType === t }}
          >
            <Text style={[Typography.label, { color: selectedType === t ? theme.primary : theme.textMuted }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Duration */}
      <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 10, marginTop: 24 }]}>DURATION (minutes)</Text>
      <TextInput
        style={[styles.durationInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
        keyboardType="number-pad"
        placeholder="30"
        placeholderTextColor={theme.textMuted}
        value={duration}
        onChangeText={setDuration}
        maxLength={3}
      />

      {/* Intensity */}
      <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 10, marginTop: 24 }]}>INTENSITY</Text>
      <View style={styles.intensityRow}>
        {INTENSITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.intensityButton,
              { borderColor: intensity === opt.key ? theme.primary : theme.border, backgroundColor: intensity === opt.key ? theme.greenPale : theme.surface, flex: 1 },
            ]}
            onPress={() => setIntensity(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: intensity === opt.key }}
          >
            <Text style={[Typography.label, { color: intensity === opt.key ? theme.primary : theme.textMuted }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.logButton, { backgroundColor: theme.primary, marginTop: 28 }, (!duration || saving) && styles.disabled]}
        onPress={handleLog}
        disabled={!duration || saving}
        accessibilityRole="button"
        accessibilityLabel="Log exercise"
      >
        <Text style={[styles.logText, { fontFamily: 'Montserrat-Bold' }]}>
          {saving ? 'Saving…' : 'Log exercise'}
        </Text>
      </TouchableOpacity>

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <View style={[styles.todaySection, { marginTop: 32 }]}>
          <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 12 }]}>TODAY</Text>
          {todayEntries.map((e) => (
            <View key={e.id} style={[styles.entryRow, { borderBottomColor: theme.border }]}>
              <Text style={[Typography.body, { color: theme.textPrimary }]}>
                {e.value} min{e.value_text ? ` · ${e.value_text}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  durationInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 26,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    minHeight: 60,
  },
  intensityRow: { flexDirection: 'row', gap: 10 },
  intensityButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', minHeight: 48 },
  logButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52 },
  disabled: { opacity: 0.5 },
  logText: { color: '#FFFFFF', fontSize: 16 },
  todaySection: {},
  entryRow: { paddingVertical: 12, borderBottomWidth: 1 },
});
