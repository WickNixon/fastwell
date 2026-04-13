import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { SymptomType } from '@/lib/types';

const SYMPTOMS: Array<{ key: SymptomType; label: string; emoji: string }> = [
  { key: 'hot_flush', label: 'Hot flush', emoji: '🔥' },
  { key: 'night_sweats', label: 'Night sweats', emoji: '🌙' },
  { key: 'brain_fog', label: 'Brain fog', emoji: '🌫️' },
  { key: 'joint_pain', label: 'Joint pain', emoji: '🦴' },
  { key: 'anxiety', label: 'Anxiety', emoji: '💭' },
  { key: 'bloating', label: 'Bloating', emoji: '🫁' },
  { key: 'headache', label: 'Headache', emoji: '🤕' },
  { key: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { key: 'mood_swings', label: 'Mood swings', emoji: '🎭' },
  { key: 'low_libido', label: 'Low libido', emoji: '💔' },
  { key: 'vaginal_dryness', label: 'Vaginal dryness', emoji: '🌵' },
  { key: 'hair_thinning', label: 'Hair thinning', emoji: '💇' },
  { key: 'insomnia', label: 'Insomnia', emoji: '😶' },
];

export default function SymptomsScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('symptoms_log')
      .select('symptom')
      .eq('user_id', profile.id)
      .eq('entry_date', today)
      .then(({ data }) => {
        if (data) setLogged(new Set(data.map((d) => d.symptom)));
      });
  }, [profile]);

  const toggleSymptom = async (key: SymptomType) => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (logged.has(key)) {
      await supabase.from('symptoms_log').delete()
        .eq('user_id', profile.id).eq('entry_date', today).eq('symptom', key);
      setLogged((prev) => { const next = new Set(prev); next.delete(key); return next; });
    } else {
      await supabase.from('symptoms_log').insert({
        user_id: profile.id,
        entry_date: today,
        symptom: key,
        severity: 3, // default — could add severity picker
      });
      setLogged((prev) => new Set([...prev, key]));
    }
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Symptoms</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 28 }]}>
        Tap anything you're experiencing today.
      </Text>

      <View style={styles.grid}>
        {SYMPTOMS.map((s) => {
          const isLogged = logged.has(s.key);
          return (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.symptomCard,
                { borderColor: isLogged ? theme.accentOrange : theme.border, backgroundColor: isLogged ? '#FFF3E8' : theme.surface },
              ]}
              onPress={() => toggleSymptom(s.key)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isLogged }}
              accessibilityLabel={s.label}
            >
              <Text style={styles.symptomEmoji}>{s.emoji}</Text>
              <Text style={[Typography.label, { color: isLogged ? theme.accentOrange : theme.textPrimary, textAlign: 'center', marginTop: 4 }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  symptomCard: { width: '47%', borderWidth: 1.5, borderRadius: 12, padding: 14, alignItems: 'center', minHeight: 80 },
  symptomEmoji: { fontSize: 28 },
});
