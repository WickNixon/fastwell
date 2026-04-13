import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import { PasswordInput } from '@/components/PasswordInput';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const passwordValid = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch && !saving;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      Alert.alert('Failed', error.message);
    } else {
      Alert.alert('Password updated', 'Your password has been changed.');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 32 }]}>Change password</Text>
        <View style={{ gap: 12 }}>
          <PasswordInput placeholder="New password" value={newPassword} onChangeText={setNewPassword} autoComplete="new-password" />
          {newPassword.length > 0 && !passwordValid && <Text style={[Typography.muted, { color: theme.accentOrange }]}>Minimum 8 characters</Text>}
          <PasswordInput placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} autoComplete="new-password" />
          {confirmPassword.length > 0 && !passwordsMatch && <Text style={[Typography.muted, { color: theme.accentOrange }]}>Passwords don't match</Text>}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }, !canSubmit && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!canSubmit}
          >
            <Text style={[styles.saveButtonText, { fontFamily: 'Montserrat-Bold' }]}>{saving ? 'Updating…' : 'Update password'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 28, paddingTop: 56, paddingBottom: 40 },
  saveButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8, minHeight: 52 },
  buttonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16 },
});
