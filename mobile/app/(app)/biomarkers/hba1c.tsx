import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { Biomarker } from '@/lib/types';

export default function HbA1cScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [history, setHistory] = useState<Biomarker[]>([]);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'%' | 'mmol/mol'>('%');
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const loadHistory = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('biomarkers')
      .select('*')
      .eq('user_id', profile.id)
      .eq('marker', 'hba1c')
      .order('reading_date', { ascending: false })
      .limit(10);
    setHistory(data ?? []);
  };

  useEffect(() => { loadHistory(); }, [profile]);

  const handleSave = async () => {
    if (!profile || saving) return;
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) { Alert.alert('Invalid value'); return; }

    setSaving(true);
    const { error } = await supabase.from('biomarkers').insert({
      user_id: profile.id,
      marker: 'hba1c',
      value: v,
      unit,
      reading_date: today,
    });

    if (!error) {
      setValue('');
      await loadHistory();
    }
    setSaving(false);
  };

  const firstValue = history.length > 0 ? history[history.length - 1].value : null;
  const latestValue = history.length > 0 ? history[0].value : null;
  const improved = firstValue !== null && latestValue !== null && latestValue < firstValue;

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>HbA1c</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 4 }]}>
        A 3-month blood sugar average
      </Text>

      {/* Progress banner */}
      {improved && (
        <View style={[styles.progressBanner, { backgroundColor: theme.greenPale, borderColor: theme.primary }]}>
          <Text style={[Typography.body, { color: theme.primary, fontFamily: 'Montserrat-SemiBold' }]}>
            Down from {firstValue}% to {latestValue}%. Your body is responding.
          </Text>
        </View>
      )}

      {/* Log reading */}
      <View style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[Typography.cardTitle, { color: theme.textPrimary, marginBottom: 16 }]}>Log a reading</Text>

        {/* Unit toggle */}
        <View style={styles.unitToggle}>
          {(['%', 'mmol/mol'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitButton, { borderColor: unit === u ? theme.primary : theme.border, backgroundColor: unit === u ? theme.greenPale : 'transparent' }]}
              onPress={() => setUnit(u)}
            >
              <Text style={[Typography.label, { color: unit === u ? theme.primary : theme.textMuted }]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.valueInput, { borderColor: theme.border, backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'Montserrat-Bold' }]}
          keyboardType="decimal-pad"
          placeholder={unit === '%' ? '5.7' : '39'}
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={setValue}
          maxLength={6}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }, (!value || saving) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!value || saving}
        >
          <Text style={[styles.saveButtonText, { fontFamily: 'Montserrat-Bold' }]}>
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
              <Text style={[Typography.body, { color: theme.textPrimary }]}>
                {b.value}{b.unit}
              </Text>
              <Text style={[Typography.muted, { color: theme.textMuted }]}>
                {new Date(b.reading_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
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
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  progressBanner: { borderWidth: 1, borderRadius: 10, padding: 14, marginVertical: 16 },
  logCard: { borderWidth: 1, borderRadius: 12, padding: 20, marginTop: 16, marginBottom: 24 },
  unitToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  unitButton: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderRadius: 8 },
  valueInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 14, fontSize: 28, textAlign: 'center', marginBottom: 16, minHeight: 60 },
  saveButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52 },
  buttonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16 },
  historySection: { marginTop: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
});
