import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Typography } from '@/lib/theme';
import { OnboardingProgress } from '@/components/OnboardingProgress';

const STAGES = [
  { key: 'perimenopause', label: 'Perimenopause', description: 'I still have periods but they\'re changing' },
  { key: 'transition', label: 'Menopause transition', description: 'My periods have been stopping and starting' },
  { key: 'post_menopause', label: 'Post-menopause', description: 'I haven\'t had a period for 12+ months' },
  { key: 'not_sure', label: 'Not sure', description: 'I\'m not certain which stage I\'m at' },
] as const;

export default function OnboardingStageScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (key: string) => {
    setSelected(key);
    // Auto-advance after 0.8s per UX_PRINCIPLES.md
    setTimeout(() => {
      (global as Record<string, unknown>).__onboarding = { ...(global as Record<string, unknown>).__onboarding, menopause_stage: key };
      router.push('/(auth)/invite/onboarding/cycle');
    }, 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OnboardingProgress step={3} total={6} />

      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>
        Where are you in your menopause journey?
      </Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 28 }]}>
        If you're not sure, that's okay — just pick the closest one.
      </Text>

      <View style={styles.cards}>
        {STAGES.map((stage) => {
          const isSelected = selected === stage.key;
          return (
            <TouchableOpacity
              key={stage.key}
              style={[
                styles.card,
                { borderColor: isSelected ? theme.primary : theme.border, backgroundColor: isSelected ? theme.greenPale : theme.surface },
              ]}
              onPress={() => handleSelect(stage.key)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[Typography.cardTitle, { color: isSelected ? theme.primary : theme.textPrimary }]}>
                {stage.label}
              </Text>
              <Text style={[Typography.muted, { color: theme.textMuted, marginTop: 2 }]}>
                {stage.description}
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
  card: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 18,
    minHeight: 72,
    justifyContent: 'center',
  },
});
