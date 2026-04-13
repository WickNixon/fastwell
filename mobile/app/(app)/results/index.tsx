import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

type TimeFilter = '7d' | '30d' | '3m' | '6m' | '12m';

const FILTERS: Array<{ key: TimeFilter; label: string; days: number }> = [
  { key: '7d', label: '7d', days: 7 },
  { key: '30d', label: '30d', days: 30 },
  { key: '3m', label: '3m', days: 90 },
  { key: '6m', label: '6m', days: 180 },
  { key: '12m', label: '12m', days: 365 },
];

interface Stats {
  fastingSessions: number;
  avgFastingHours: number;
  avgSleepHours: number;
  avgEnergy: number;
  avgMood: number;
  totalWaterDays: number;
  latestWeight: number | null;
  latestHba1c: number | null;
  firstHba1c: number | null;
  badgesEarned: number;
}

export default function ResultsScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [filter, setFilter] = useState<TimeFilter>('30d');
  const [stats, setStats] = useState<Stats | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadStats = useCallback(async () => {
    if (!profile) return;
    const days = FILTERS.find((f) => f.key === filter)?.days ?? 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = fromDate.toISOString().split('T')[0];

    const [fasting, healthData, hba1c, badges] = await Promise.all([
      supabase.from('fasting_sessions').select('duration_minutes').eq('user_id', profile.id).gte('started_at', fromStr).not('ended_at', 'is', null),
      supabase.from('health_entries').select('metric, value').eq('user_id', profile.id).gte('entry_date', fromStr),
      supabase.from('biomarkers').select('value, reading_date').eq('user_id', profile.id).eq('marker', 'hba1c').order('reading_date'),
      supabase.from('user_badges').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
    ]);

    const entries = healthData.data ?? [];
    const byMetric = (m: string) => entries.filter((e) => e.metric === m).map((e) => e.value as number).filter(Boolean);
    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
    const sessions = fasting.data ?? [];

    setStats({
      fastingSessions: sessions.length,
      avgFastingHours: avg(sessions.map((s) => Math.round((s.duration_minutes ?? 0) / 60))),
      avgSleepHours: avg(byMetric('sleep_hours')),
      avgEnergy: avg(byMetric('energy_level')),
      avgMood: avg(byMetric('mood')),
      totalWaterDays: byMetric('water_ml').length,
      latestWeight: byMetric('weight').at(-1) ?? null,
      latestHba1c: hba1c.data?.at(-1)?.value ?? null,
      firstHba1c: hba1c.data?.[0]?.value ?? null,
      badgesEarned: badges.count ?? 0,
    });
  }, [profile, filter]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleExport = async () => {
    if (!profile || exporting) return;
    setExporting(true);
    const days = FILTERS.find((f) => f.key === filter)?.days ?? 30;
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = fromDate.toISOString().split('T')[0];

    try {
      const { data, error } = await supabase.functions.invoke('generate-export', {
        body: { from_date: fromStr, to_date: toDate },
      });

      if (error || !data?.download_url) {
        Alert.alert('Export failed', 'Please try again.');
      } else {
        Alert.alert('Report ready', 'Your health report has been generated.', [
          { text: 'OK' },
        ]);
      }
    } catch {
      Alert.alert('Export failed', 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 24 }]}>Results</Text>

      {/* Time filter */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterButton, { borderColor: filter === f.key ? theme.primary : theme.border, backgroundColor: filter === f.key ? theme.greenPale : theme.surface }]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[Typography.label, { color: filter === f.key ? theme.primary : theme.textMuted }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard theme={theme} label="Fasting sessions" value={String(stats.fastingSessions)} unit="total" />
          <StatCard theme={theme} label="Avg fast" value={String(stats.avgFastingHours)} unit="hours" />
          <StatCard theme={theme} label="Avg sleep" value={String(stats.avgSleepHours)} unit="hours" />
          <StatCard theme={theme} label="Avg energy" value={String(stats.avgEnergy)} unit="/ 5" />
          <StatCard theme={theme} label="Avg mood" value={String(stats.avgMood)} unit="/ 5" />
          <StatCard theme={theme} label="Water days" value={String(stats.totalWaterDays)} unit="logged" />
          {stats.latestHba1c && (
            <StatCard theme={theme} label="HbA1c" value={String(stats.latestHba1c)} unit="% latest" />
          )}
          <StatCard theme={theme} label="Badges earned" value={String(stats.badgesEarned)} unit="milestones" />
        </View>
      )}

      {/* HbA1c progress */}
      {stats?.firstHba1c && stats.latestHba1c && stats.latestHba1c < stats.firstHba1c && (
        <View style={[styles.progressCard, { backgroundColor: theme.greenPale, borderColor: theme.primary }]}>
          <Text style={[Typography.body, { color: theme.primary, fontFamily: 'Montserrat-SemiBold' }]}>
            HbA1c down from {stats.firstHba1c}% to {stats.latestHba1c}% since you started. That's real progress.
          </Text>
        </View>
      )}

      {/* GP Export */}
      <TouchableOpacity
        style={[styles.exportButton, { backgroundColor: theme.accentOrange }, exporting && styles.buttonDisabled]}
        onPress={handleExport}
        disabled={exporting}
        accessibilityRole="button"
      >
        <Text style={[styles.exportButtonText, { fontFamily: 'Montserrat-Bold' }]}>
          {exporting ? 'Generating report…' : 'Share with my GP'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ theme, label, value, unit }: { theme: Record<string, string>; label: string; value: string; unit: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: (theme as Record<string, string>).surface, borderColor: (theme as Record<string, string>).border }]}>
      <Text style={[Typography.muted, { color: (theme as Record<string, string>).textMuted, marginBottom: 4 }]}>{label}</Text>
      <Text style={[Typography.cardTitle, { color: (theme as Record<string, string>).textPrimary, fontSize: 22 }]}>{value}</Text>
      <Text style={[Typography.muted, { color: (theme as Record<string, string>).textMuted }]}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  filterButton: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', borderWidth: 1, borderRadius: 12, padding: 16 },
  progressCard: { borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 20 },
  exportButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  buttonDisabled: { opacity: 0.6 },
  exportButtonText: { color: '#FFFFFF', fontSize: 16 },
});
