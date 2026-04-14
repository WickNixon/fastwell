import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

const DAILY_GOAL = 10000;

export default function StepsScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [steps, setSteps] = useState('');
  const [saved, setSaved] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('health_entries')
      .select('value')
      .eq('user_id', profile.id)
      .eq('entry_date', today)
      .eq('metric', 'steps')
      .eq('source', 'manual')
      .single()
      .then(({ data }) => {
        if (data?.value != null) {
          setSaved(data.value);
          setSteps(String(data.value));
        }
      });
  }, [profile]);

  const handleSave = async () => {
    if (!profile || saving) return;
    const v = parseInt(steps, 10);
    if (isNaN(v) || v < 0) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error } = await supabase.from('health_entries').upsert({
      user_id: profile.id,
      entry_date: today,
      metric: 'steps',
      value: v,
      unit: 'steps',
      source: 'manual',
    }, { onConflict: 'user_id,entry_date,metric,source' });

    if (!error) {
      setSaved(v);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSaving(false);
  };

  const pct = saved != null ? Math.min((saved / DAILY_GOAL) * 100, 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Steps</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 32 }]}>Today's step count</Text>

      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
      </View>
      <View style={styles.goalRow}>
        <Text style={[Typography.muted, { color: theme.textMuted }]}>
          {saved != null ? saved.toLocaleString() : '—'} steps
        </Text>
        <Text style={[Typography.muted, { color: theme.textMuted }]}>
          Goal: {DAILY_GOAL.toLocaleString()}
        </Text>
      </View>

      {pct >= 100 && (
        <Text style={[Typography.body, { color: theme.primary, fontFamily: 'Montserrat-SemiBold', marginBottom: 8, textAlign: 'center' }]}>
          Goal reached — brilliant effort today.
        </Text>
      )}

      {/* Input */}
      <TextInput
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
        keyboardType="number-pad"
        placeholder="e.g. 8500"
        placeholderTextColor={theme.textMuted}
        value={steps}
        onChangeText={setSteps}
        maxLength={6}
      />

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }, (!steps || saving) && styles.disabled]}
        onPress={handleSave}
        disabled={!steps || saving}
        accessibilityRole="button"
        accessibilityLabel="Log steps"
      >
        <Text style={[styles.saveText, { fontFamily: 'Montserrat-Bold' }]}>
          {saving ? 'Saving…' : 'Log steps'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  progressBg: { height: 10, borderRadius: 5, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 5 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 62,
  },
  saveButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52 },
  disabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontSize: 16 },
});
