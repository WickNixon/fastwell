import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useTheme, Typography } from '@/lib/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const settingsItems = [
    { label: 'Profile', route: '/(app)/settings/profile', icon: '👤' },
    { label: 'Subscription & billing', route: '/(app)/settings/subscription', icon: '💳' },
    { label: 'Notifications', route: '/(app)/settings/notifications', icon: '🔔' },
    { label: 'Appearance', route: '/(app)/settings/appearance', icon: '🌓' },
    { label: 'Change password', route: '/(app)/settings/change-password', icon: '🔑' },
    { label: 'Integrations', route: '/(app)/settings/integrations', icon: '🔗' },
  ];

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Settings</Text>
      {profile?.first_name && (
        <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 28 }]}>
          {profile.first_name}
        </Text>
      )}

      <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {settingsItems.map((item, idx) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.settingsRow, idx < settingsItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            onPress={() => router.push(item.route as never)}
            accessibilityRole="button"
          >
            <Text style={styles.rowIcon}>{item.icon}</Text>
            <Text style={[Typography.body, { color: theme.textPrimary, flex: 1 }]}>{item.label}</Text>
            <Text style={[Typography.muted, { color: theme.textMuted }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: theme.border }]}
        onPress={signOut}
        accessibilityRole="button"
      >
        <Text style={[Typography.body, { color: theme.accentOrange, fontFamily: 'Montserrat-SemiBold', textAlign: 'center' }]}>
          Log out
        </Text>
      </TouchableOpacity>

      <Text style={[Typography.muted, { color: theme.textMuted, textAlign: 'center', marginTop: 20 }]}>
        Fastwell · Wicked Wellbeing
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 48 },
  settingsGroup: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 14, minHeight: 56 },
  rowIcon: { fontSize: 18, width: 28 },
  signOutButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 14, marginTop: 8 },
});
