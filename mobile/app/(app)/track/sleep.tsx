import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

const QUALITY_OPTIONS = [
  { value: 1, label: 'Poor', emoji: '😔' },
  { value: 2, label: 'Fair', emoji: '😐' },
  { value: 3, label: 'Okay', emoji: '🙂' },
  { value: 4, label: 'Good', emoji: '😊' },
  { value: 5, label: 'Great', emoji: '⭐' },
];

export default function SleepScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('health_entries').select('value').eq('user_id', profile.id).eq('entry_date', today).eq('metric', 'sleep_hours').single(),
      supabase.from('health_entries').select('value').eq('user_id', profile.id).eq('entry_date', today).eq('metric', 'sleep_quality').single(),
    ]).then(([hoursResult, qualityResult]) => {
      if (hoursResult.data?.value) setHours(String(hoursResult.data.value));
      if (qualityResult.data?.value) setQuality(qualityResult.data.value);
    });
  }, [profile]);

  const handleSave = async () => {
    if (!profile || saving) return;
    const h = parseFloat(hours);
    if (isNaN(h) || h < 0 || h > 24) { Alert.alert('Invalid hours', 'Enter a value between 0 and 24.'); return; }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const upserts = [
      supabase.from('health_entries').upsert({ user_id: profile.id, entry_date: today, metric: 'sleep_hours', value: h, unit: 'hours', source: 'manual' }, { onConflict: 'user_id,entry_date,metric,source' }),
    ];
    if (quality) {
      upserts.push(supabase.from('health_entries').upsert({ user_id: profile.id, entry_date: today, metric: 'sleep_quality', value: quality, unit: '1-5', source: 'manual' }, { onConflict: 'user_id,entry_date,metric,source' }));
    }
    await Promise.all(upserts);
    setSaving(false);
    setSaved(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Sleep</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 32 }]}>Last night's sleep</Text>

      <Text style={[Typography.body, { color: theme.textPrimary, marginBottom: 8 }]}>Hours slept</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary, fontFamily: 'Montserrat-Bold' }]}
        keyboardType="decimal-pad"
        placeholder="7.5"
        placeholderTextColor={theme.textMuted}
        value={hours}
        onChangeText={setHours}
        maxLength={4}
      />

      <Text style={[Typography.body, { color: theme.textPrimary, marginTop: 24, marginBottom: 12 }]}>Sleep quality</Text>
      <View style={styles.qualityRow}>
        {QUALITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.qualityButton, { borderColor: quality === opt.value ? theme.primary : theme.border, backgroundColor: quality === opt.value ? theme.greenPale : theme.surface }]}
            onPress={() => setQuality(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: quality === opt.value }}
          >
            <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
            <Text style={[Typography.label, { color: theme.textMuted, marginTop: 4 }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!hours || saving}
      >
        <Text style={[styles.saveButtonText, { fontFamily: 'Montserrat-Bold' }]}>
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 56 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, textAlign: 'center', minHeight: 60 },
  qualityRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  qualityButton: { flex: 1, borderWidth: 2, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 32, minHeight: 52 },
  buttonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16 },
});
