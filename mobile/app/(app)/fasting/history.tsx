import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';
import type { FastingSession } from '@/lib/types';

const FILTERS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '3m', days: 90 },
  { label: 'All', days: 0 },
] as const;

function formatDuration(minutes: number | null) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function FastingHistoryScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]>(FILTERS[1]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!profile) return;
    let query = supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false });

    if (filter.days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - filter.days);
      query = query.gte('started_at', since.toISOString());
    }

    const { data } = await query.limit(100);
    setSessions(data ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { setLoading(true); load(); }, [profile, filter]);

  const onRefresh = () => { setRefreshing(true); load(); };

  // Stats for the filtered period
  const completed = sessions.filter((s) => s.duration_minutes != null);
  const avgDuration = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / completed.length)
    : null;
  const longestFast = completed.length > 0
    ? Math.max(...completed.map((s) => s.duration_minutes ?? 0))
    : null;

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 20 }]}>Fasting History</Text>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterTab, filter.label === f.label && { backgroundColor: theme.primary }]}
            onPress={() => setFilter(f)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter.label === f.label }}
          >
            <Text style={[Typography.label, { color: filter.label === f.label ? '#FFFFFF' : theme.textMuted }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary stats */}
      {completed.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[Typography.cardTitle, { color: theme.primary, fontSize: 22 }]}>{completed.length}</Text>
            <Text style={[Typography.muted, { color: theme.textMuted }]}>Fasts</Text>
          </View>
          {avgDuration !== null && (
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[Typography.cardTitle, { color: theme.primary, fontSize: 22 }]}>{formatDuration(avgDuration)}</Text>
              <Text style={[Typography.muted, { color: theme.textMuted }]}>Average</Text>
            </View>
          )}
          {longestFast !== null && (
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[Typography.cardTitle, { color: theme.primary, fontSize: 22 }]}>{formatDuration(longestFast)}</Text>
              <Text style={[Typography.muted, { color: theme.textMuted }]}>Longest</Text>
            </View>
          )}
        </View>
      )}

      {/* Session list */}
      {!loading && sessions.length === 0 && (
        <Text style={[Typography.body, { color: theme.textMuted, textAlign: 'center', marginTop: 40 }]}>
          No completed fasts in this period.
        </Text>
      )}

      {sessions.map((s) => {
        const goalHours = s.protocol === '24h' ? 24 : s.protocol === '20:4' ? 20 : s.protocol === '18:6' ? 18 : 16;
        const goalMins = goalHours * 60;
        const achieved = (s.duration_minutes ?? 0) >= goalMins;

        return (
          <View key={s.id} style={[styles.sessionCard, { backgroundColor: theme.surface, borderColor: achieved ? theme.primary : theme.border }]}>
            <View style={styles.sessionLeft}>
              <Text style={[Typography.cardTitle, { color: theme.textPrimary }]}>
                {formatDuration(s.duration_minutes)}
              </Text>
              <Text style={[Typography.muted, { color: theme.textMuted }]}>
                {s.protocol ?? 'Custom'} · {formatDate(s.started_at)}
              </Text>
            </View>
            {achieved && (
              <View style={[styles.achievedBadge, { backgroundColor: theme.greenPale }]}>
                <Text style={[Typography.label, { color: theme.primary }]}>Goal met</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  filterRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  sessionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 10 },
  sessionLeft: { gap: 4 },
  achievedBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
});
