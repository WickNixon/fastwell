import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { FastingSession } from '@/lib/types';

function formatDuration(minutes: number | null) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function FastingHubScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<FastingSession[]>([]);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  useEffect(() => {
    if (!activeFast) return;
    const update = () => {
      const started = new Date(activeFast.started_at).getTime();
      setElapsedMinutes(Math.floor((Date.now() - started) / 60000));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [activeFast]);

  const loadData = async () => {
    if (!profile) return;

    const { data: active } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    setActiveFast(active ?? null);

    const { data: recent } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(5);

    setRecentSessions(recent ?? []);
  };

  const formatElapsed = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 24 }]}>Fasting</Text>

      {/* Active fast card / start button */}
      <TouchableOpacity
        style={[
          styles.timerCard,
          { backgroundColor: activeFast ? theme.primary : theme.surface, borderColor: activeFast ? 'transparent' : theme.border },
        ]}
        onPress={() => router.push('/(app)/fasting/timer')}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {activeFast ? (
          <>
            <Text style={[Typography.muted, { color: 'rgba(255,255,255,0.75)', marginBottom: 6 }]}>
              {activeFast.protocol ?? 'Fast'} · In progress
            </Text>
            <Text style={[Typography.timer, { color: '#FFFFFF' }]}>
              {formatElapsed(elapsedMinutes)}
            </Text>
            <Text style={[Typography.muted, { color: 'rgba(255,255,255,0.8)', marginTop: 10 }]}>
              Tap to manage your fast
            </Text>
          </>
        ) : (
          <>
            <Text style={[Typography.cardTitle, { color: theme.textMuted, marginBottom: 8 }]}>
              Not currently fasting
            </Text>
            <Text style={[Typography.body, { color: theme.primary, fontFamily: 'Montserrat-SemiBold' }]}>
              Start a fast →
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={[Typography.label, { color: theme.textMuted }]}>RECENT FASTS</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/fasting/history')} accessibilityRole="link">
              <Text style={[Typography.label, { color: theme.primary }]}>View all</Text>
            </TouchableOpacity>
          </View>

          {recentSessions.map((s) => {
            const goalHours = s.protocol === '24h' ? 24 : s.protocol === '20:4' ? 20 : s.protocol === '18:6' ? 18 : 16;
            const achieved = (s.duration_minutes ?? 0) >= goalHours * 60;
            return (
              <View key={s.id} style={[styles.sessionRow, { borderBottomColor: theme.border }]}>
                <View>
                  <Text style={[Typography.body, { color: theme.textPrimary }]}>
                    {formatDuration(s.duration_minutes)}
                  </Text>
                  <Text style={[Typography.muted, { color: theme.textMuted }]}>
                    {s.protocol ?? 'Custom'} · {formatDate(s.started_at)}
                  </Text>
                </View>
                {achieved && (
                  <View style={[styles.goalBadge, { backgroundColor: theme.greenPale }]}>
                    <Text style={[Typography.label, { color: theme.primary }]}>Goal met</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  timerCard: { borderWidth: 1, borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 32, minHeight: 150, justifyContent: 'center' },
  historySection: {},
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  goalBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
});
