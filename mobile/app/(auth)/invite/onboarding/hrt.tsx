import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Typography } from '@/lib/theme';
import { OnboardingProgress } from '@/components/OnboardingProgress';

const HRT_OPTIONS = [
  { key: 'yes', label: 'Yes' },
  { key: 'no', label: 'No' },
  { key: 'not_sure', label: 'Not sure' },
] as const;

export default function OnboardingHRTScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (key: string) => {
    setSelected(key);
    setTimeout(() => {
      (global as Record<string, unknown>).__onboarding = { ...(global as Record<string, unknown>).__onboarding, on_hrt: key };
      router.push('/(auth)/invite/onboarding/goal');
    }, 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OnboardingProgress step={5} total={6} />

      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>
        Are you currently using HRT or bioidentical hormones?
      </Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 28 }]}>
        This helps us make your experience more relevant. You can update this anytime.
      </Text>

      <View style={styles.cards}>
        {HRT_OPTIONS.map((opt) => {
          const isSelected = selected === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.card,
                { borderColor: isSelected ? theme.primary : theme.border, backgroundColor: isSelected ? theme.greenPale : theme.surface },
              ]}
              onPress={() => handleSelect(opt.key)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[Typography.cardTitle, { color: isSelected ? theme.primary : theme.textPrimary }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 48 },
  cards: { gap: 12 },
  card: { borderWidth: 2, borderRadius: 12, padding: 18, minHeight: 60, justifyContent: 'center' },
});
