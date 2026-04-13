import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Typography } from '@/lib/theme';

interface PaywallData {
  fasting_sessions: number;
  badges_earned: number;
  days_tracked: number;
}

export default function PaywallScreen() {
  const { profile } = useAuth();
  const [data, setData] = useState<PaywallData | null>(null);
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);

  useEffect(() => {
    supabase.functions.invoke('check-paywall').then(({ data: d }) => {
      if (d) setData(d);
    });
  }, []);

  const handleChoosePlan = async (plan: 'monthly' | 'annual') => {
    if (!profile || loading) return;
    setLoading(plan);
    try {
      const { data: checkoutData } = await supabase.functions.invoke('create-subscriber-checkout', {
        body: { plan },
      });
      if (checkoutData?.url) {
        await Linking.openURL(checkoutData.url);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#5C8A34' }]}>
      {/* Logo */}
      <Text style={[styles.logo, { fontFamily: 'Montserrat-Bold' }]}>Fastwell</Text>

      <Text style={[Typography.screenHeading, { color: '#FFFFFF', textAlign: 'center', marginBottom: 8 }]}>
        Your 14 days are up — ready to keep going?
      </Text>

      {data && (
        <View style={styles.summaryCard}>
          <Text style={[Typography.body, { color: '#2C4A1A', textAlign: 'center' }]}>
            You've logged{' '}
            <Text style={{ fontFamily: 'Montserrat-SemiBold' }}>{data.fasting_sessions} fasting sessions</Text>
            {' '}and earned{' '}
            <Text style={{ fontFamily: 'Montserrat-SemiBold' }}>{data.badges_earned} badges</Text>.
            {'\n'}Don't lose your progress.
          </Text>
        </View>
      )}

      {/* Plan cards */}
      <View style={styles.planCards}>
        <TouchableOpacity
          style={[styles.planCard, { borderColor: '#C8DFB0' }]}
          onPress={() => handleChoosePlan('monthly')}
          disabled={!!loading}
          accessibilityRole="button"
          accessibilityLabel="Monthly plan, $18.99 per month"
        >
          <Text style={[Typography.cardTitle, { color: '#2C4A1A', textAlign: 'center' }]}>Monthly</Text>
          <Text style={[styles.planPrice, { fontFamily: 'Montserrat-Bold' }]}>$18.99</Text>
          <Text style={[Typography.muted, { color: '#7A9A6A', textAlign: 'center' }]}>per month</Text>
          {loading === 'monthly' && (
            <Text style={[Typography.muted, { color: '#5C8A34', textAlign: 'center', marginTop: 4 }]}>
              Opening checkout…
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, { borderColor: '#D06820', borderWidth: 2 }]}
          onPress={() => handleChoosePlan('annual')}
          disabled={!!loading}
          accessibilityRole="button"
          accessibilityLabel="Annual plan, $159.52 per year, save 30 percent"
        >
          <View style={styles.saveBadge}>
            <Text style={[Typography.label, { color: '#FFFFFF', fontFamily: 'Montserrat-Bold' }]}>SAVE 30%</Text>
          </View>
          <Text style={[Typography.cardTitle, { color: '#2C4A1A', textAlign: 'center', marginTop: 8 }]}>Annual</Text>
          <Text style={[styles.planPrice, { fontFamily: 'Montserrat-Bold' }]}>$159.52</Text>
          <Text style={[Typography.muted, { color: '#7A9A6A', textAlign: 'center' }]}>per year · $13.29/month</Text>
          {loading === 'annual' && (
            <Text style={[Typography.muted, { color: '#5C8A34', textAlign: 'center', marginTop: 4 }]}>
              Opening checkout…
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[Typography.muted, { color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 20 }]}>
        Wicked Wellbeing members get 50% off —{' '}
        <Text style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL('https://wickedwellbeing.com')}>
          find out more →
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40, justifyContent: 'center' },
  logo: { fontSize: 32, color: '#FFFFFF', textAlign: 'center', marginBottom: 24 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginVertical: 20 },
  planCards: { flexDirection: 'row', gap: 14 },
  planCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  planPrice: { fontSize: 28, color: '#2C4A1A', textAlign: 'center', marginTop: 4 },
  saveBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#D06820', paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 8 },
});
