import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

const WEIGHT_UNITS = ['kg', 'lbs'] as const;
const STAGE_OPTIONS = [
  { key: 'perimenopause', label: 'Perimenopause' },
  { key: 'transition', label: 'Menopause transition' },
  { key: 'post_menopause', label: 'Post-menopause' },
  { key: 'not_sure', label: 'Not sure' },
] as const;

export default function ProfileSettingsScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [stage, setStage] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? '');
    setWeightUnit((profile.weight_unit as 'kg' | 'lbs') ?? 'kg');
    setStage(profile.menopause_stage ?? '');
  }, [profile]);

  const handleSave = async () => {
    if (!profile || saving) return;
    if (!firstName.trim()) { Alert.alert('Name is required'); return; }
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        weight_unit: weightUnit,
        menopause_stage: stage || null,
      })
      .eq('id', profile.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 28 }]}>Profile</Text>

      <FormField label="FIRST NAME">
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Your first name"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="words"
        />
      </FormField>

      <FormField label="WEIGHT UNIT">
        <View style={styles.toggleRow}>
          {WEIGHT_UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.toggleButton, { borderColor: weightUnit === u ? theme.primary : theme.border, backgroundColor: weightUnit === u ? theme.greenPale : theme.surface, flex: 1 }]}
              onPress={() => setWeightUnit(u)}
              accessibilityRole="radio"
              accessibilityState={{ checked: weightUnit === u }}
            >
              <Text style={[Typography.label, { color: weightUnit === u ? theme.primary : theme.textMuted }]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FormField>

      <FormField label="MENOPAUSE STAGE">
        <View style={styles.stageOptions}>
          {STAGE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.stageButton, { borderColor: stage === opt.key ? theme.primary : theme.border, backgroundColor: stage === opt.key ? theme.greenPale : theme.surface }]}
              onPress={() => setStage(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: stage === opt.key }}
            >
              <Text style={[Typography.body, { color: stage === opt.key ? theme.primary : theme.textPrimary }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FormField>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: saved ? theme.textMuted : theme.primary }, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
      >
        <Text style={[styles.saveText, { fontFamily: 'Montserrat-Bold' }]}>
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[Typography.label, { color: '#7A9A6A', marginBottom: 10 }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  field: { marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Lato-Regular', fontSize: 16, minHeight: 52 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', minHeight: 48 },
  stageOptions: { gap: 10 },
  stageButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, minHeight: 52 },
  saveButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52, marginTop: 8 },
  disabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontSize: 16 },
});
