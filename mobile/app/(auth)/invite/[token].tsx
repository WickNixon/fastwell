import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import { PasswordInput } from '@/components/PasswordInput';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const theme = useTheme();
  const router = useRouter();

  const [phase, setPhase] = useState<'loading' | 'animation' | 'form' | 'invalid'>('loading');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const bgColor = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setPhase('invalid');
      return;
    }

    supabase.functions.invoke('validate-invite', { body: { token } }).then(({ data }) => {
      if (data?.valid) {
        setEmail(data.email);
        setFirstName(data.first_name ?? '');
        setPhase('animation');
      } else {
        setPhase('invalid');
      }
    }).catch(() => setPhase('invalid'));
  }, [token]);

  // Logo fade animation sequence per UX_PRINCIPLES.md
  useEffect(() => {
    if (phase !== 'animation') return;

    // Dark background → Logo fades in (300ms) → hold 1.5s → Logo fades out (300ms) → bg transitions → form slides up
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(logoOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      // Transition background to light
      Animated.timing(bgColor, { toValue: 1, duration: 200, useNativeDriver: false }).start(() => {
        setPhase('form');
        // Slide form up
        Animated.parallel([
          Animated.timing(formOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(formTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    });
  }, [phase]);

  const handleSubmit = async () => {
    if (!password || password !== confirmPassword || password.length < 8) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-member-account', {
        body: { token, password },
      });

      if (error || !data?.success) {
        Alert.alert('Something went wrong', 'Please try again or contact support.');
        return;
      }

      // Sign in with the new credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        Alert.alert('Account created', 'Please log in to continue.');
        router.replace('/(auth)/login');
      }
      // Auth context will redirect to onboarding
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const interpolatedBg = bgColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#0D1A07', '#F4FAF0'],
  });

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch && !submitting;

  if (phase === 'invalid') {
    return (
      <View style={[styles.flex, styles.centred, { backgroundColor: theme.background }]}>
        <Text style={[Typography.screenHeading, { color: theme.textPrimary, textAlign: 'center' }]}>
          This invite link is no longer valid.
        </Text>
        <Text style={[Typography.body, { color: theme.textMuted, textAlign: 'center', marginTop: 12 }]}>
          It may have expired or already been used. Contact your coach for a new link.
        </Text>
      </View>
    );
  }

  if (phase === 'loading') {
    return <View style={[styles.flex, { backgroundColor: '#0D1A07' }]} />;
  }

  return (
    <Animated.View style={[styles.flex, { backgroundColor: interpolatedBg }]}>
      {/* Logo animation — only shown during animation phase */}
      {(phase === 'animation') && (
        <View style={[styles.flex, styles.centred]}>
          <Animated.Text
            style={[styles.animLogo, { opacity: logoOpacity, fontFamily: 'Montserrat-Bold' }]}
          >
            Fastwell
          </Animated.Text>
        </View>
      )}

      {/* Form — shown after animation */}
      {phase === 'form' && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Animated.View
              style={{ opacity: formOpacity, transform: [{ translateY: formTranslateY }] }}
            >
              <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>
                Welcome to Fastwell.
              </Text>
              <Text style={[Typography.body, { color: theme.textMuted, marginBottom: 32 }]}>
                Let's get you set up.
              </Text>

              {/* Email — locked */}
              <View style={[styles.lockedEmail, { borderColor: theme.border, backgroundColor: theme.greenPale }]}>
                <Text style={[Typography.muted, { color: theme.textMuted, flex: 1 }]}>{email}</Text>
                <Text style={{ fontSize: 16 }}>🔒</Text>
              </View>

              <View style={{ gap: 12, marginTop: 12 }}>
                <PasswordInput
                  placeholder="Create password"
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="new-password"
                />
                {password.length > 0 && !passwordValid && (
                  <Text style={[Typography.muted, { color: theme.accentOrange }]}>Minimum 8 characters</Text>
                )}

                <PasswordInput
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoComplete="new-password"
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <Text style={[Typography.muted, { color: theme.accentOrange }]}>Passwords don't match</Text>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.primary }, !canSubmit && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  accessibilityRole="button"
                >
                  <Text style={[styles.primaryButtonText, { fontFamily: 'Montserrat-Bold' }]}>
                    {submitting ? 'Setting up…' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centred: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 48, justifyContent: 'center' },
  animLogo: { fontSize: 42, color: '#A8D878', letterSpacing: -0.5 },
  lockedEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  primaryButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8, minHeight: 52 },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16 },
});
