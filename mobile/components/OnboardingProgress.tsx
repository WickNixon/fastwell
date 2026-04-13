import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

interface Props {
  step: number;
  total: number;
}

export function OnboardingProgress({ step, total }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container} accessibilityLabel={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i < step ? theme.primary : theme.greenPale, borderColor: theme.border },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
});
