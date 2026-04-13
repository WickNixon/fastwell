import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Typography } from '@/lib/theme';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { supabase } from '@/lib/supabase';

const GOALS = [
  { key: 'energy', label: 'More energy' },
  { key: 'sleep', label: 'Better sleep' },
  { key: 'weight_loss', label: 'Weight loss' },
  { key: 'hormonal_balance', label: 'Hormonal balance' },
  { key: 'blood_sugar', label: 'Blood sugar control' },
  { key: 'all', label: 'All of the above' },
] as const;

export default function OnboardingGoalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = (key: string) => {
    setSelected(key);
  };

  const handleFinish = async () => {
    if (!selected || saving) return;
    setSaving(true);

    const data = (global as Record<string, unknown>).__onboarding as Record<string, unknown> ?? {};
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from('profiles').update({
      first_name: data.first_name,
      age: data.age,
      menopause_stage: data.menopause_stage,
      has_regular_cycle: data.has_regular_cycle,
      cycle_length_days: data.cycle_length_days ?? null,
      on_hrt: data.on_hrt,
      primary_goal: selected,
      onboarding_complete: true,
    }).eq('id', user.id);

    if (error) {
      Alert.alert('Something went wrong', 'Please try again.');
      setSaving(false);
      return;
    }

    // Clear temp state
    delete (global as Record<string, unknown>).__onboarding;
    // Auth context will detect onboarding_complete = true and navigate to dashboard
    setSaving(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OnboardingProgress step={6} total={6} />

      {(() => {
        const firstName = ((global as Record<string, unknown>).__onboarding as Record<string, string>)?.first_name ?? '';
        return (
          <>
            <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>
              What's your main focus right now{firstName ? `, ${firstName}` : ''}?
            </Text>
            <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 24 }]}>
              We'll show you what matters most to you first. You can change this anytime.
            </Text>
          </>
        );
      })()}

      {/* 2-column grid per UX_PRINCIPLES.md */}
      <View style={styles.grid}>
        {GOALS.map((goal) => {
          const isSelected = selected === goal.key;
          return (
            <TouchableOpacity
              key={goal.key}
              style={[
                styles.goalCard,
                {
                  borderColor: isSelected ? theme.accentOrange : theme.border,
                  backgroundColor: isSelected ? '#FFF3E8' : theme.surface,
                  flex: goal.key === 'all' ? 0 : 1,
                  width: goal.key === 'all' ? '100%' : undefined,
                },
              ]}
              onPress={() => handleSelect(goal.key)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[Typography.cardTitle, { color: isSelected ? theme.accentOrange : theme.textPrimary, textAlign: 'center' }]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.finishButton, { backgroundColor: theme.primary }, (!selected || saving) && styles.buttonDisabled]}
        onPress={handleFinish}
        disabled={!selected || saving}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { fontFamily: 'Montserrat-Bold' }]}>
          {saving ? 'Setting up your dashboard…' : 'Take me to my dashboard'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 48 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  goalCard: { borderWidth: 2, borderRadius: 12, padding: 16, minHeight: 60, justifyContent: 'center', alignItems: 'center', minWidth: '45%' },
  finishButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16 },
});
