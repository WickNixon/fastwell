import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography } from '@/lib/theme';

const TIER_LABELS: Record<string, string> = {
  member: 'Wicked Wellbeing Member',
  subscriber: 'Fastwell Subscriber',
  inactive: 'No active plan',
};

const TIER_COLORS: Record<string, string> = {
  member: '#5C8A34',
  subscriber: '#D06820',
  inactive: '#7A9A6A',
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SubscriptionScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const tier = profile?.subscription_tier ?? 'inactive';
  const status = profile?.subscription_status;
  const trialEnd = profile?.trial_ends_at;
  const isTrialing = status === 'trialing';

  const openBillingPortal = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { user_id: profile.id },
      });
      if (error || !data?.url) throw new Error('Could not open billing portal');
      await Linking.openURL(data.url);
    } catch {
      Alert.alert('Something went wrong', 'Please try again or contact support at hello@wickedwellbeing.com');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.screenHeading, { color: theme.textPrimary, marginBottom: 28 }]}>Subscription</Text>

      {/* Current plan card */}
      <View style={[styles.planCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[tier] + '20', borderColor: TIER_COLORS[tier] }]}>
          <Text style={[Typography.label, { color: TIER_COLORS[tier] }]}>{TIER_LABELS[tier]}</Text>
        </View>

        {isTrialing && trialEnd && (
          <View style={styles.trialInfo}>
            <Text style={[Typography.body, { color: theme.textPrimary, fontFamily: 'Montserrat-SemiBold' }]}>
              Free trial active
            </Text>
            <Text style={[Typography.muted, { color: theme.textMuted }]}>
              Ends {formatDate(trialEnd)}
            </Text>
          </View>
        )}

        {status === 'active' && (
          <Text style={[Typography.body, { color: theme.primary, fontFamily: 'Montserrat-SemiBold', marginTop: 12 }]}>
            Active subscription
          </Text>
        )}

        {status === 'past_due' && (
          <Text style={[Typography.body, { color: '#D06820', fontFamily: 'Montserrat-SemiBold', marginTop: 12 }]}>
            Payment overdue — please update your payment method
          </Text>
        )}

        {tier === 'member' && (
          <Text style={[Typography.muted, { color: theme.textMuted, marginTop: 12 }]}>
            50% member discount applied forever.
          </Text>
        )}
      </View>

      {/* Billing portal — only show if they have a Stripe subscription */}
      {profile?.stripe_subscription_id && (
        <TouchableOpacity
          style={[styles.portalButton, { backgroundColor: theme.primary }, loading && styles.disabled]}
          onPress={openBillingPortal}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Manage billing"
        >
          <Text style={[styles.portalText, { fontFamily: 'Montserrat-Bold' }]}>
            {loading ? 'Opening…' : 'Manage billing & payment'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[Typography.muted, { color: theme.textMuted, textAlign: 'center', marginTop: 20, paddingHorizontal: 16 }]}>
        Questions about your subscription? Email hello@wickedwellbeing.com
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  planCard: { borderWidth: 1, borderRadius: 14, padding: 20, marginBottom: 24, gap: 8 },
  tierBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  trialInfo: { marginTop: 8, gap: 4 },
  portalButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', minHeight: 52 },
  disabled: { opacity: 0.5 },
  portalText: { color: '#FFFFFF', fontSize: 16 },
});
