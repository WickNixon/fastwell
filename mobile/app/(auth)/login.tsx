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

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) Alert.alert('Login failed', error.message);
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={[styles.logo, { color: theme.primary, fontFamily: 'Montserrat-Bold' }]}>
            Fastwell
          </Text>
        </View>

        <View style={styles.form}>
          {/* Email */}
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary, fontFamily: 'Lato-Regular' },
            ]}
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

          {/* Password with eye toggle */}
          <PasswordInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            containerStyle={styles.passwordContainer}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {/* Forgot password */}
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotContainer} accessibilityRole="link">
              <Text style={[Typography.muted, { color: theme.textMuted, textAlign: 'right' }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password}
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            <Text style={[styles.primaryButtonText, { fontFamily: 'Montserrat-Bold' }]}>
              {loading ? 'Logging in…' : 'Log in'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[Typography.muted, { color: theme.textMuted, marginHorizontal: 12 }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} accessibilityRole="link">
              <Text style={[styles.secondaryButtonText, { color: theme.primary, fontFamily: 'Montserrat-SemiBold' }]}>
                Create an account
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
  logoContainer: { alignItems: 'center', marginBottom: 48 },
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
  passwordContainer: { marginTop: 0 },
  forgotContainer: { alignSelf: 'flex-end', paddingVertical: 4 },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dividerLine: { flex: 1, height: 1 },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 52,
  },
  secondaryButtonText: { fontSize: 16 },
});
