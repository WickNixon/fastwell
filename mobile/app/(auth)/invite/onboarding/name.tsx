import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, Typography } from '@/lib/theme';
import { OnboardingProgress } from '@/components/OnboardingProgress';

export default function OnboardingNameScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (!name.trim()) return;
    // Store in context/storage and navigate
    // Using a simple global state approach — in production use zustand or context
    (global as Record<string, unknown>).__onboarding = { ...(global as Record<string, unknown>).__onboarding, first_name: name.trim() };
    router.push('/(auth)/invite/onboarding/age');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <OnboardingProgress step={1} total={6} />

        <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 8 }]}>
          Before anything else —
        </Text>
        <Text style={[Typography.screenHeading, { color: theme.primary }]}>
          what should we call you?
        </Text>

        <TextInput
          style={[styles.nameInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary, fontFamily: 'Montserrat-Bold' }]}
          placeholder="Your first name"
          placeholderTextColor={theme.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          maxLength={50}
        />

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: theme.primary }, !name.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!name.trim()}
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
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 48, justifyContent: 'center', gap: 12 },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 22,
    marginTop: 24,
    marginBottom: 8,
    minHeight: 64,
  },
  continueButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', minHeight: 52, marginTop: 8 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16 },
});
