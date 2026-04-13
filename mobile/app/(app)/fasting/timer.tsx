import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Typography } from '@/lib/theme';
import type { FastingSession } from '@/lib/types';

const PROTOCOLS: Array<{ key: string; label: string; hours: number }> = [
  { key: '16:8', label: '16:8', hours: 16 },
  { key: '18:6', label: '18:6', hours: 18 },
  { key: '20:4', label: '20:4', hours: 20 },
  { key: '24h', label: '24h', hours: 24 },
];

export default function FastingTimerScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [selectedProtocol, setSelectedProtocol] = useState('16:8');
  const [loading, setLoading] = useState(true);
  const [breaking, setBreaking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Gentle pulse on active fast
  useEffect(() => {
    if (!activeFast) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [activeFast]);

  useEffect(() => {
    if (!profile) return;
    loadActiveFast();
  }, [profile]);

  const loadActiveFast = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    setActiveFast(data ?? null);
    if (data) startTick(new Date(data.started_at));
    setLoading(false);
  };

  const startTick = (startTime: Date) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const update = () => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    update();
    intervalRef.current = setInterval(update, 1000);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const startFast = async () => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('fasting_sessions')
      .insert({ user_id: profile.id, protocol: selectedProtocol, started_at: now })
      .select()
      .single();

    if (!error && data) {
      setActiveFast(data as FastingSession);
      startTick(new Date(data.started_at));
    }
  };

  const confirmBreakFast = () => {
    Alert.alert(
      'Break your fast?',
      'This will end your current fasting window.',
      [
        { text: 'Keep fasting', style: 'cancel' },
        { text: 'Break my fast', onPress: breakFast, style: 'destructive' },
      ],
    );
  };

  const breakFast = async () => {
    if (!activeFast || breaking) return;
    setBreaking(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const endedAt = new Date().toISOString();
    const durationMinutes = Math.floor(elapsed / 60);

    await supabase.from('fasting_sessions').update({
      ended_at: endedAt,
      duration_minutes: durationMinutes,
    }).eq('id', activeFast.id);

    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveFast(null);
    setElapsed(0);
    setBreaking(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const goalHours = PROTOCOLS.find((p) => p.key === (activeFast?.protocol ?? selectedProtocol))?.hours ?? 16;
  const goalSeconds = goalHours * 3600;
  const progress = Math.min(elapsed / goalSeconds, 1);
  const remaining = Math.max(goalSeconds - elapsed, 0);

  if (loading) return <View style={[styles.flex, { backgroundColor: '#5C8A34' }]} />;

  return (
    <View style={[styles.flex, { backgroundColor: activeFast ? '#5C8A34' : '#F4FAF0' }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {activeFast ? (
          // ACTIVE FASTING STATE — green background, white text
          <View style={styles.activeContainer}>
            <Text style={[Typography.muted, { color: 'rgba(255,255,255,0.75)', marginBottom: 4 }]}>
              {activeFast.protocol ?? 'Fasting'} fast
            </Text>

            <Animated.Text style={[Typography.timer, { color: '#FFFFFF', transform: [{ scale: pulseAnim }] }]}>
              {formatTime(elapsed)}
            </Animated.Text>

            <Text style={[Typography.body, { color: 'rgba(255,255,255,0.8)', marginTop: 8 }]}>
              {remaining > 0
                ? `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m remaining`
                : 'Window complete — well done.'}
            </Text>

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            {/* Break fast button */}
            <TouchableOpacity
              style={styles.breakButton}
              onPress={confirmBreakFast}
              disabled={breaking}
              accessibilityRole="button"
              accessibilityLabel="Break my fast"
            >
              <Text style={[Typography.body, { color: '#5C8A34', fontFamily: 'Montserrat-SemiBold' }]}>
                Break my fast
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // IDLE STATE
          <View style={styles.idleContainer}>
            <Text style={[Typography.screenHeading, { color: '#2C4A1A', marginBottom: 8 }]}>
              Start a fast
            </Text>
            <Text style={[Typography.body, { color: '#7A9A6A', marginBottom: 32 }]}>
              Choose your fasting window.
            </Text>

            {/* Protocol selector */}
            <View style={styles.protocols}>
              {PROTOCOLS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.protocolCard,
                    { borderColor: selectedProtocol === p.key ? '#5C8A34' : '#C8DFB0', backgroundColor: selectedProtocol === p.key ? '#EAF3DC' : '#FFFFFF' },
                  ]}
                  onPress={() => setSelectedProtocol(p.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedProtocol === p.key }}
                >
                  <Text style={[Typography.cardTitle, { color: selectedProtocol === p.key ? '#5C8A34' : '#2C4A1A' }]}>
                    {p.label}
                  </Text>
                  <Text style={[Typography.muted, { color: '#7A9A6A' }]}>{p.hours}h fast</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: '#5C8A34' }]}
              onPress={startFast}
              accessibilityRole="button"
              accessibilityLabel="Start fast"
            >
              <Text style={[styles.startButtonText, { fontFamily: 'Montserrat-Bold' }]}>Start fast</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  activeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  idleContainer: { flex: 1, paddingTop: 20 },
  progressBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 8 },
  progressFill: { height: 6, backgroundColor: '#FFFFFF', borderRadius: 3 },
  breakButton: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  protocols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  protocolCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  startButton: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  startButtonText: { color: '#FFFFFF', fontSize: 16 },
});
