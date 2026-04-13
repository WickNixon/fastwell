import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Typography } from '@/lib/theme';
import { OnboardingProgress } from '@/components/OnboardingProgress';

const CYCLE_OPTIONS = [
  { key: 'yes_regular', label: 'Yes, regular' },
  { key: 'yes_irregular', label: 'Yes, but irregular' },
  { key: 'no', label: 'No' },
] as const;

export default function OnboardingCycleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [cycleLength, setCycleLength] = useState('28');

  const handleSelect = (key: string) => {
    setSelected(key);
    if (key !== 'yes_regular') {
      setTimeout(() => {
        (global as Record<string, unknown>).__onboarding = { ...(global as Record<string, unknown>).__onboarding, has_regular_cycle: key };
        router.push('/(auth)/invite/onboarding/hrt');
      }, 800);
    }
  };

  const handleContinueRegular = () => {
    const length = parseInt(cycleLength);
    if (isNaN(length) || length < 20 || length > 45) return;
    (global as Record<string, unknown>).__onboarding = {
      ...(global as Record<string, unknown>).__onboarding,
      has_regular_cycle: 'yes_regular',
      cycle_length_days: length,
    };
    router.push('/(auth)/invite/onboarding/hrt');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OnboardingProgress step={4} total={6} />

      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 28 }]}>
        Are you still getting a regular period?
      </Text>

      <View style={styles.cards}>
        {CYCLE_OPTIONS.map((opt) => {
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

      {/* Inline follow-up for regular cycle */}
      {selected === 'yes_regular' && (
        <View style={[styles.cycleLengthCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[Typography.body, { color: theme.textPrimary, marginBottom: 12 }]}>
            How long is your cycle usually? (days)
          </Text>
          <TextInput
            style={[styles.cycleLengthInput, { borderColor: theme.border, color: theme.textPrimary, fontFamily: 'Montserrat-Bold' }]}
            keyboardType="number-pad"
            value={cycleLength}
            onChangeText={setCycleLength}
            maxLength={2}
            textAlign="center"
            returnKeyType="done"
            onSubmitEditing={handleContinueRegular}
          />
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.primary }]}
            onPress={handleContinueRegular}
          >
            <Text style={[styles.buttonText, { fontFamily: 'Montserrat-Bold' }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 48 },
  cards: { gap: 12 },
  card: { borderWidth: 2, borderRadius: 12, padding: 18, minHeight: 60, justifyContent: 'center' },
  cycleLengthCard: { marginTop: 20, borderWidth: 1, borderRadius: 12, padding: 20 },
  cycleLengthInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 24, marginBottom: 16, width: 80, alignSelf: 'center' },
  continueButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52 },
  buttonText: { color: '#FFFFFF', fontSize: 16 },
});
