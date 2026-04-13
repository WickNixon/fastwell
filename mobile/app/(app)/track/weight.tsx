import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

export default function WeightScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const unit = profile?.weight_unit ?? 'kg';

  useEffect(() => {
    if (!profile) return;
    supabase.from('health_entries').select('value').eq('user_id', profile.id).eq('entry_date', today).eq('metric', 'weight').single()
      .then(({ data }) => { if (data?.value) setWeight(String(data.value)); });
  }, [profile]);

  const handleSave = async () => {
    if (!profile || saving) return;
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) { Alert.alert('Invalid weight'); return; }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await supabase.from('health_entries').upsert({
      user_id: profile.id, entry_date: today, metric: 'weight', value: w, unit, source: 'manual',
    }, { onConflict: 'user_id,entry_date,metric,source' });
    setSaving(false);
    setSaved(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Weight</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 32 }]}>Today's reading</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.weightInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary, fontFamily: 'Montserrat-Bold' }]}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={theme.textMuted}
          value={weight}
          onChangeText={setWeight}
          maxLength={6}
          autoFocus
        />
        <Text style={[Typography.cardTitle, { color: theme.textMuted, marginLeft: 12 }]}>{unit}</Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }, (!weight || saving) && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!weight || saving}
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
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  weightInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 18, fontSize: 36, textAlign: 'center', minHeight: 72 },
  saveButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  buttonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16 },
});
