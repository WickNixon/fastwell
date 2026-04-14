import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { Biomarker } from '@/lib/types';

// NZ clinical standard is mmol/L; mg/dL conversion for those who prefer it
const UNITS = ['mmol/L', 'mg/dL'] as const;
type Unit = typeof UNITS[number];

const REFERENCE: Record<Unit, { low: number; high: number; label: string }> = {
  'mmol/L': { low: 3.9, high: 5.5, label: 'Normal fasting: 3.9–5.5 mmol/L' },
  'mg/dL': { low: 70, high: 99, label: 'Normal fasting: 70–99 mg/dL' },
};

export default function GlucoseScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [history, setHistory] = useState<Biomarker[]>([]);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<Unit>('mmol/L');
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const loadHistory = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('biomarkers')
      .select('*')
      .eq('user_id', profile.id)
      .eq('marker', 'blood_glucose')
      .order('reading_date', { ascending: false })
      .limit(20);
    setHistory(data ?? []);
  };

  useEffect(() => { loadHistory(); }, [profile]);

  const handleSave = async () => {
    if (!profile || saving) return;
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return;
    setSaving(true);

    await supabase.from('biomarkers').insert({
      user_id: profile.id,
      marker: 'blood_glucose',
      value: v,
      unit,
      reading_date: today,
    });

    setValue('');
    await loadHistory();
    setSaving(false);
  };

  const ref = REFERENCE[unit];
  const latestValue = history.length > 0 ? history[0].value : null;
  const isInRange = latestValue !== null && latestValue >= ref.low && latestValue <= ref.high;

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Blood Glucose</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 20 }]}>{ref.label}</Text>

      {latestValue !== null && (
        <View style={[styles.latestBanner, { backgroundColor: isInRange ? theme.greenPale : theme.surface, borderColor: isInRange ? theme.primary : theme.border }]}>
          <Text style={[Typography.cardTitle, { color: isInRange ? theme.primary : theme.textPrimary }]}>
            Latest: {latestValue} {history[0]?.unit}
          </Text>
          <Text style={[Typography.muted, { color: theme.textMuted }]}>
            {isInRange ? 'Within normal range' : 'Outside reference range — discuss with your GP'}
          </Text>
        </View>
      )}

      {/* Log a reading */}
      <View style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[Typography.cardTitle, { color: theme.textPrimary, marginBottom: 16 }]}>Log a reading</Text>

        <View style={styles.unitToggle}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitButton, { borderColor: unit === u ? theme.primary : theme.border, backgroundColor: unit === u ? theme.greenPale : 'transparent' }]}
              onPress={() => { setUnit(u); setValue(''); }}
            >
              <Text style={[Typography.label, { color: unit === u ? theme.primary : theme.textMuted }]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.valueInput, { borderColor: theme.border, backgroundColor: theme.background, color: theme.textPrimary }]}
          keyboardType="decimal-pad"
          placeholder={unit === 'mmol/L' ? '5.1' : '92'}
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={setValue}
          maxLength={6}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }, (!value || saving) && styles.disabled]}
          onPress={handleSave}
          disabled={!value || saving}
          accessibilityRole="button"
        >
          <Text style={[styles.saveText, { fontFamily: 'Montserrat-Bold' }]}>
            {saving ? 'Saving…' : 'Log reading'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* History */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 12 }]}>HISTORY</Text>
          {history.map((b) => (
            <View key={b.id} style={[styles.historyRow, { borderBottomColor: theme.border }]}>
              <Text style={[Typography.body, { color: theme.textPrimary }]}>{b.value} {b.unit}</Text>
              <Text style={[Typography.muted, { color: theme.textMuted }]}>
                {new Date(b.reading_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
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
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  latestBanner: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  logCard: { borderWidth: 1, borderRadius: 12, padding: 20, marginBottom: 24 },
  unitToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  unitButton: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderRadius: 8 },
  valueInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 14, fontSize: 28, textAlign: 'center', marginBottom: 16, minHeight: 60, fontFamily: 'Montserrat-Bold' },
  saveButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52 },
  disabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontSize: 16 },
  historySection: { marginTop: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
});
