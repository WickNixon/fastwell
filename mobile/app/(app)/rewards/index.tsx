import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Modal, RefreshControl } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { UserBadge } from '@/lib/types';

const BADGE_MESSAGES: Record<string, string> = {
  onboarding_complete: 'Completing your profile is the first step most people never take. Welcome to Fastwell.',
  first_fast: 'Your first fasting session is in the books. This is where it begins.',
  know_your_numbers: "You've logged your HbA1c. Now you have a starting point — and in three months, you'll see how far you've come.",
  momentum_7: 'Seven days of showing up for yourself. This is what consistency actually looks like.',
  lifestyle_30: "Thirty days. Not perfect — consistent. That's the one that changes everything.",
  deep_fast: 'A 24-hour fast. Your body worked hard and so did you.',
  hydration_7: 'Seven days of logging your water. Your body notices.',
  first_export: "You've generated your first GP report. Your data is yours — use it.",
  hba1c_improved: 'Your HbA1c has improved since you started. Your hard work is showing up in your results.',
  three_months: 'Three months ago you started something. Look at where you are now.',
  six_months: "Six months of showing up. That is not a habit anymore — it's who you are.",
};

const BADGE_EMOJIS: Record<string, string> = {
  onboarding_complete: '🌱', first_fast: '⏱️', know_your_numbers: '📊',
  momentum_7: '🔥', lifestyle_30: '⭐', deep_fast: '🌙', hydration_7: '💧',
  first_export: '📄', hba1c_improved: '💚', three_months: '🌿', six_months: '🌳',
};

export default function RewardsScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadBadges = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', profile.id)
      .order('earned_at', { ascending: false });
    setBadges(data ?? []);
  }, [profile]);

  useEffect(() => { loadBadges(); }, [loadBadges]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBadges();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>
        Your milestones
      </Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 28 }]}>
        {badges.length} earned
      </Text>

      <View style={styles.grid}>
        {badges.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            style={[styles.badgeCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}
            onPress={() => setSelectedBadge(badge)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={badge.badge_name}
          >
            <Text style={styles.badgeEmoji}>{BADGE_EMOJIS[badge.badge_key] ?? '🏅'}</Text>
            <Text style={[Typography.label, { color: theme.textPrimary, textAlign: 'center', marginTop: 6 }]}>
              {badge.badge_name}
            </Text>
            <Text style={[Typography.muted, { color: theme.textMuted, textAlign: 'center', fontSize: 11, marginTop: 2 }]}>
              {new Date(badge.earned_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Badge detail modal */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setSelectedBadge(null)}
          activeOpacity={1}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.modalEmoji}>{BADGE_EMOJIS[selectedBadge?.badge_key ?? ''] ?? '🏅'}</Text>
            <Text style={[Typography.screenHeading, { color: theme.primary, textAlign: 'center', marginTop: 8 }]}>
              {selectedBadge?.badge_name}
            </Text>
            <Text style={[Typography.body, { color: theme.textPrimary, textAlign: 'center', marginTop: 12, lineHeight: 24 }]}>
              {BADGE_MESSAGES[selectedBadge?.badge_key ?? ''] ?? ''}
            </Text>
            <Text style={[Typography.muted, { color: theme.textMuted, textAlign: 'center', marginTop: 12 }]}>
              Earned {selectedBadge ? new Date(selectedBadge.earned_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '46%', borderWidth: 1.5, borderRadius: 14, padding: 16, alignItems: 'center' },
  badgeEmoji: { fontSize: 36 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  modalCard: { borderWidth: 1, borderRadius: 20, padding: 28, alignItems: 'center', width: '100%' },
  modalEmoji: { fontSize: 56 },
});
