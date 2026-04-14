import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { Biomarker } from '@/lib/types';

// Ketone zones based on Dr. Mindy Pelz / nutritional ketosis guidance
const ZONES = [
  { min: 0, max: 0.4, label: 'Glucose burning', color: '#7A9A6A' },
  { min: 0.4, max: 1.5, label: 'Light ketosis', color: '#5C8A34' },
  { min: 1.5, max: 3.0, label: 'Nutritional ketosis', color: '#3D6B1F' },
  { min: 3.0, max: 99, label: 'Deep ketosis', color: '#2C4A1A' },
];

function getZone(val: number) {
  return ZONES.find((z) => val >= z.min && val < z.max) ?? ZONES[0];
}

export default function KetonesScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [history, setHistory] = useState<Biomarker[]>([]);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const loadHistory = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('biomarkers')
      .select('*')
      .eq('user_id', profile.id)
      .eq('marker', 'ketones')
      .order('reading_date', { ascending: false })
      .limit(20);
    setHistory(data ?? []);
  };

  useEffect(() => { loadHistory(); }, [profile]);

  const handleSave = async () => {
    if (!profile || saving) return;
    const v = parseFloat(value);
    if (isNaN(v) || v < 0) return;
    setSaving(true);

    await supabase.from('biomarkers').insert({
      user_id: profile.id,
      marker: 'ketones',
      value: v,
      unit: 'mmol/L',
      reading_date: today,
    });

    setValue('');
    await loadHistory();
    setSaving(false);
  };

  const latestValue = history.length > 0 ? history[0].value : null;
  const zone = latestValue !== null ? getZone(latestValue) : null;

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Ketones</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 20 }]}>Blood ketone reading in mmol/L</Text>

      {latestValue !== null && zone && (
        <View style={[styles.zoneBanner, { backgroundColor: theme.greenPale, borderColor: theme.primary }]}>
          <Text style={[Typography.cardTitle, { color: zone.color }]}>
            {latestValue} mmol/L — {zone.label}
          </Text>
          <Text style={[Typography.muted, { color: theme.textMuted }]}>Most recent reading</Text>
        </View>
      )}

      {/* Zone guide */}
      <View style={[styles.zoneGuide, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 10 }]}>KETONE ZONES</Text>
        {ZONES.map((z) => (
          <View key={z.label} style={styles.zoneRow}>
            <View style={[styles.zoneDot, { backgroundColor: z.color }]} />
            <Text style={[Typography.muted, { color: theme.textPrimary }]}>
              {z.min}–{z.max === 99 ? '3.0+' : z.max} mmol/L
            </Text>
            <Text style={[Typography.muted, { color: theme.textMuted, flex: 1, textAlign: 'right' }]}>{z.label}</Text>
          </View>
        ))}
      </View>

      {/* Log a reading */}
      <View style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[Typography.cardTitle, { color: theme.textPrimary, marginBottom: 16 }]}>Log a reading</Text>

        <TextInput
          style={[styles.valueInput, { borderColor: theme.border, backgroundColor: theme.background, color: theme.textPrimary }]}
          keyboardType="decimal-pad"
          placeholder="0.8"
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={setValue}
          maxLength={5}
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
          {history.map((b) => {
            const z = getZone(b.value);
            return (
              <View key={b.id} style={[styles.historyRow, { borderBottomColor: theme.border }]}>
                <View style={styles.historyLeft}>
                  <View style={[styles.zoneDot, { backgroundColor: z.color }]} />
                  <Text style={[Typography.body, { color: theme.textPrimary }]}>{b.value} mmol/L</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[Typography.muted, { color: theme.textMuted }]}>{z.label}</Text>
                  <Text style={[Typography.muted, { color: theme.textMuted }]}>
                    {new Date(b.reading_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  zoneBanner: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  zoneGuide: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  zoneDot: { width: 10, height: 10, borderRadius: 5 },
  logCard: { borderWidth: 1, borderRadius: 12, padding: 20, marginBottom: 24 },
  valueInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 14, fontSize: 28, textAlign: 'center', marginBottom: 16, minHeight: 60, fontFamily: 'Montserrat-Bold' },
  saveButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52 },
  disabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontSize: 16 },
  historySection: { marginTop: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyRight: { alignItems: 'flex-end', gap: 2 },
});
