import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

const THEME_OPTIONS = [
  { key: 'system', label: 'Follow device', description: 'Matches your phone\'s light/dark setting' },
  { key: 'light', label: 'Light', description: 'Always use light mode' },
  { key: 'dark', label: 'Dark', description: 'Always use dark mode' },
] as const;

type ThemePref = typeof THEME_OPTIONS[number]['key'];

export default function AppearanceScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<ThemePref>((profile?.theme_preference as ThemePref) ?? 'system');
  const [saving, setSaving] = useState(false);

  const handleSelect = async (pref: ThemePref) => {
    if (!profile || saving) return;
    setSelected(pref);
    setSaving(true);

    await supabase
      .from('profiles')
      .update({ theme_preference: pref })
      .eq('id', profile.id);

    setSaving(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 8 }]}>Appearance</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 32 }]}>
        Choose how Fastwell looks on your device.
      </Text>

      <View style={[styles.optionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {THEME_OPTIONS.map((opt, idx) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.optionRow,
              idx < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              selected === opt.key && { backgroundColor: theme.greenPale },
            ]}
            onPress={() => handleSelect(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === opt.key }}
          >
            <View style={styles.optionText}>
              <Text style={[Typography.cardTitle, { color: theme.textPrimary }]}>{opt.label}</Text>
              <Text style={[Typography.muted, { color: theme.textMuted }]}>{opt.description}</Text>
            </View>
            <View style={[styles.radio, { borderColor: selected === opt.key ? theme.primary : theme.border }]}>
              {selected === opt.key && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[Typography.muted, { color: theme.textMuted, marginTop: 20, textAlign: 'center' }]}>
        {saving ? 'Saving…' : ' '}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  optionsCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, minHeight: 70 },
  optionText: { flex: 1, gap: 4 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
