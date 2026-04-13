import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Typography } from '@/lib/theme';
import { OnboardingProgress } from '@/components/OnboardingProgress';

export default function OnboardingAgeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const firstName = ((global as Record<string, unknown>).__onboarding as Record<string, string>)?.first_name ?? '';
  const [age, setAge] = useState('');

  const handleContinue = () => {
    const parsed = parseInt(age);
    if (isNaN(parsed) || parsed < 18 || parsed > 110) return;
    (global as Record<string, unknown>).__onboarding = { ...(global as Record<string, unknown>).__onboarding, age: parsed };
    router.push('/(auth)/invite/onboarding/stage');
  };

  const ageNum = parseInt(age);
  const valid = !isNaN(ageNum) && ageNum >= 18 && ageNum <= 110;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <OnboardingProgress step={2} total={6} />

        <Text style={[Typography.screenHeading, { color: theme.textPrimary }]}>
          How old are you{firstName ? `, ${firstName}` : ''}?
        </Text>
        <Text style={[Typography.muted, { color: theme.textMuted, marginTop: 4, marginBottom: 24 }]}>
          No judgment here. This helps us personalise your experience.
        </Text>

        <TextInput
          style={[styles.ageInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary, fontFamily: 'Montserrat-Bold' }]}
          placeholder="Your age"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
          autoFocus
          maxLength={3}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: theme.primary }, !valid && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!valid}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { fontFamily: 'Montserrat-Bold' }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 48, justifyContent: 'center' },
  ageInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 18, fontSize: 28, marginBottom: 16, textAlign: 'center', minHeight: 64 },
  continueButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16 },
});
