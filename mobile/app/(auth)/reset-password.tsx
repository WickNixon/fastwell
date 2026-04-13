import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import { PasswordInput } from '@/components/PasswordInput';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch && !loading;

  const handleReset = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert('Reset failed', error.message);
      } else {
        await supabase.auth.signOut();
        Alert.alert(
          'Password updated',
          'Log in to continue.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
        );
      }
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 8 }]}>
          Set new password
        </Text>
        <Text style={[Typography.body, { color: theme.textMuted, marginBottom: 32 }]}>
          Choose a password that's at least 8 characters.
        </Text>

        <View style={styles.form}>
          <PasswordInput
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
          />
          {password.length > 0 && !passwordValid && (
            <Text style={[Typography.muted, { color: theme.accentOrange }]}>Minimum 8 characters</Text>
          )}

          <PasswordInput
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="new-password"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={[Typography.muted, { color: theme.accentOrange }]}>Passwords don't match</Text>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }, !canSubmit && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={!canSubmit}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, { fontFamily: 'Montserrat-Bold' }]}>
              {loading ? 'Updating…' : 'Set new password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 48 },
  form: { gap: 12 },
  primaryButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8, minHeight: 52 },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16 },
});
