import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import { PasswordInput } from '@/components/PasswordInput';

export default function SignupScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = email.trim() && passwordValid && passwordsMatch && !loading;

  const handleSignup = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert('Signup failed', error.message);
      }
      // Auth context handles redirect after successful signup
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
        <View style={styles.logoContainer}>
          <Text style={[styles.logo, { color: theme.primary, fontFamily: 'Montserrat-Bold' }]}>
            Fastwell
          </Text>
        </View>

        <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 24 }]}>
          Create your account
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary, fontFamily: 'Lato-Regular' }]}
            placeholder="Email"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          <PasswordInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
          />

          {password.length > 0 && !passwordValid && (
            <Text style={[Typography.muted, { color: theme.accentOrange }]}>
              Minimum 8 characters
            </Text>
          )}

          <PasswordInput
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="new-password"
          />

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={[Typography.muted, { color: theme.accentOrange }]}>
              Passwords don't match
            </Text>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }, !canSubmit && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={!canSubmit}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, { fontFamily: 'Montserrat-Bold' }]}>
              {loading ? 'Creating account…' : 'Create my account'}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.loginLink} accessibilityRole="link">
              <Text style={[Typography.muted, { color: theme.textMuted, textAlign: 'center' }]}>
                Already have an account?{' '}
                <Text style={{ color: theme.primary, fontFamily: 'Montserrat-SemiBold' }}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, letterSpacing: -0.5 },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16 },
  loginLink: { paddingVertical: 8 },
});
