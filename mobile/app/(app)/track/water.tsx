import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

const INCREMENTS = [150, 250, 500];
const DAILY_GOAL_ML = 2000;

export default function WaterScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const fillAnim = React.useRef(new Animated.Value(0)).current;

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('health_entries')
      .select('value')
      .eq('user_id', profile.id)
      .eq('entry_date', today)
      .eq('metric', 'water_ml')
      .eq('source', 'manual')
      .single()
      .then(({ data }) => {
        const val = data?.value ?? 0;
        setTotal(val);
        Animated.timing(fillAnim, { toValue: Math.min(val / DAILY_GOAL_ML, 1), duration: 600, useNativeDriver: false }).start();
      });
  }, [profile]);

  const logWater = async (ml: number) => {
    if (!profile || saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newTotal = total + ml;
    const { error } = await supabase
      .from('health_entries')
      .upsert({
        user_id: profile.id,
        entry_date: today,
        metric: 'water_ml',
        value: newTotal,
        unit: 'ml',
        source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });

    if (!error) {
      setTotal(newTotal);
      Animated.timing(fillAnim, { toValue: Math.min(newTotal / DAILY_GOAL_ML, 1), duration: 400, useNativeDriver: false }).start();
    }
    setSaving(false);
  };

  const fillHeight = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const percent = Math.round((total / DAILY_GOAL_ML) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 4 }]}>Water</Text>
      <Text style={[Typography.muted, { color: theme.textMuted, marginBottom: 32 }]}>Today's intake</Text>

      {/* Visual fill */}
      <View style={[styles.glassContainer, { borderColor: theme.primary }]}>
        <Animated.View
          style={[styles.glassFill, { height: fillHeight, backgroundColor: theme.primary + '40' }]}
        />
        <View style={styles.glassOverlay}>
          <Text style={[Typography.timer, { color: theme.primary, fontSize: 36 }]}>{total}ml</Text>
          <Text style={[Typography.muted, { color: theme.textMuted }]}>of {DAILY_GOAL_ML}ml goal</Text>
          {percent >= 100 && (
            <Text style={[Typography.body, { color: theme.primary, marginTop: 8, fontFamily: 'Montserrat-SemiBold' }]}>
              Goal reached 💧
            </Text>
          )}
        </View>
      </View>

      {/* Increment buttons */}
      <View style={styles.buttons}>
        {INCREMENTS.map((ml) => (
          <TouchableOpacity
            key={ml}
            style={[styles.incrementButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => logWater(ml)}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={`Add ${ml}ml`}
          >
            <Text style={[Typography.cardTitle, { color: theme.primary }]}>+{ml}ml</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 56, paddingBottom: 32 },
  glassContainer: {
    height: 240,
    borderWidth: 2,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  glassFill: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  glassOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttons: { flexDirection: 'row', gap: 12 },
  incrementButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center', minHeight: 56 },
});
