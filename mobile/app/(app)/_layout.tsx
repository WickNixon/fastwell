import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: { fontFamily: 'Montserrat-SemiBold', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fasting"
        options={{
          title: 'Fast',
          tabBarIcon: ({ color, size }) => <Ionicons name="timer-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Results',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />

      {/* Hidden screens — navigable but not shown in tab bar */}
      <Tabs.Screen name="biomarkers" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="supplements" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="rewards" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="paywall" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
