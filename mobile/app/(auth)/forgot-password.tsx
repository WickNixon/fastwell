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
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      // Always show the same message regardless of whether email exists — security best practice
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'fastwell://reset-password',
      });
    } catch {
      // Swallow error — never reveal if email is registered
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity accessibilityRole="link" accessibilityLabel="Back to login">
              <Text style={[Typography.body, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 8 }]}>
          Reset your password
        </Text>
        <Text style={[Typography.body, { color: theme.textMuted, marginBottom: 32 }]}>
          Enter your email and we'll send you a reset link.
        </Text>

        {sent ? (
          <View style={[styles.sentCard, { backgroundColor: theme.greenPale, borderColor: theme.border }]}>
            <Text style={[Typography.body, { color: theme.textPrimary }]}>
              If that email is registered, you'll receive a reset link shortly.
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={[styles.backButton, { borderColor: theme.border }]} accessibilityRole="link">
                <Text style={[Typography.body, { color: theme.primary, fontFamily: 'Montserrat-SemiBold' }]}>
                  Back to log in
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
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
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }, (!email.trim() || loading) && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={!email.trim() || loading}
              accessibilityRole="button"
            >
              <Text style={[styles.primaryButtonText, { fontFamily: 'Montserrat-Bold' }]}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 48 },
  header: { marginBottom: 32 },
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
  sentCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
  },
});
