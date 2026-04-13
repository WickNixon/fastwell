import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { FastingSession, AiInsight } from '@/lib/types';

export default function HomeScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const loadData = useCallback(async () => {
    if (!profile) return;

    // Load active fast
    const { data: fast } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    setActiveFast(fast ?? null);
    if (fast) {
      const started = new Date(fast.started_at).getTime();
      setElapsedMinutes(Math.floor((Date.now() - started) / 60000));
    }

    // Load AI insights
    const { data: insightData } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', profile.id)
      .gt('expires_at', new Date().toISOString())
      .is('dismissed_at', null)
      .order('generated_at', { ascending: false })
      .limit(3);

    setInsights(insightData ?? []);
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update elapsed time every minute when fasting
  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => {
      const started = new Date(activeFast.started_at).getTime();
      setElapsedMinutes(Math.floor((Date.now() - started) / 60000));
    }, 60000);
    return () => clearInterval(interval);
  }, [activeFast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const dismissInsight = async (id: string) => {
    await supabase.from('ai_insights').update({ dismissed_at: new Date().toISOString() }).eq('id', id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const formatElapsed = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const today = new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      {/* Greeting */}
      <Text style={[Typography.screenHeading, { color: theme.textPrimary }]}>
        {greeting}{profile?.first_name ? `, ${profile.first_name}` : ''}.
      </Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 24 }]}>
        {today} · Wicked Wellbeing
      </Text>

      {/* Fasting Timer Card */}
      <TouchableOpacity
        style={[
          styles.fastingCard,
          { backgroundColor: activeFast ? theme.primary : theme.surface, borderColor: activeFast ? 'transparent' : theme.border },
        ]}
        onPress={() => router.push('/(app)/fasting/timer')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={activeFast ? `Fasting for ${formatElapsed(elapsedMinutes)}` : 'Start a fast'}
      >
        {activeFast ? (
          <>
            <Text style={[Typography.muted, { color: 'rgba(255,255,255,0.75)', marginBottom: 4 }]}>
              {activeFast.protocol ?? 'Fasting'} · In progress
            </Text>
            <Text style={[Typography.timer, { color: '#FFFFFF' }]}>
              {formatElapsed(elapsedMinutes)}
            </Text>
            <Text style={[Typography.muted, { color: 'rgba(255,255,255,0.75)', marginTop: 4 }]}>
              Tap to view
            </Text>
          </>
        ) : (
          <>
            <Text style={[Typography.cardTitle, { color: theme.textMuted, marginBottom: 8 }]}>Not fasting</Text>
            <Text style={[Typography.body, { color: theme.primary, fontFamily: 'Montserrat-SemiBold' }]}>
              Start a fast →
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* AI Insight Cards */}
      {insights.length > 0 && (
        <View style={styles.section}>
          <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 12 }]}>YOUR INSIGHTS</Text>
          {insights.map((insight) => (
            <View
              key={insight.id}
              style={[styles.insightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[Typography.body, { color: theme.textPrimary, flex: 1, lineHeight: 22 }]}>
                {insight.insight_text}
              </Text>
              <TouchableOpacity
                onPress={() => dismissInsight(insight.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Dismiss insight"
                accessibilityRole="button"
                style={styles.dismissButton}
              >
                <Text style={{ color: theme.textMuted, fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Quick Check-in Strip */}
      <View style={styles.section}>
        <Text style={[Typography.label, { color: theme.textMuted, marginBottom: 12 }]}>QUICK CHECK-IN</Text>
        <View style={styles.checkInStrip}>
          {[
            { label: 'Water', icon: '💧', route: '/(app)/track/water' },
            { label: 'Energy', icon: '⚡', route: '/(app)/track/energy' },
            { label: 'Mood', icon: '🌿', route: '/(app)/track/mood' },
            { label: 'Symptoms', icon: '📋', route: '/(app)/track/symptoms' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.checkInItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(item.route as never)}
              accessibilityRole="button"
              accessibilityLabel={`Log ${item.label}`}
            >
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              <Text style={[Typography.label, { color: theme.textMuted, marginTop: 4 }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  fastingCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'center',
  },
  section: { marginBottom: 24 },
  insightCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dismissButton: { paddingLeft: 12, paddingTop: 2 },
  checkInStrip: { flexDirection: 'row', gap: 10 },
  checkInItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
});
