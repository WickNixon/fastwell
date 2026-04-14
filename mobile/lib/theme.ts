import { useColorScheme } from 'react-native';
import { useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';
import { Colors, ThemeColors } from '@/constants/colors';

/**
 * Returns the active theme colours.
 * Reads profile.theme_preference from AuthContext and overrides the system
 * colour scheme when explicitly set to 'light' or 'dark'.
 * Falls back gracefully to system scheme when called outside AuthProvider.
 */
export function useTheme(): ThemeColors & { isDark: boolean } {
  const { profile } = useContext(AuthContext);
  const systemScheme = useColorScheme();
  const pref = profile?.theme_preference ?? 'system';

  let isDark: boolean;
  if (pref === 'dark') isDark = true;
  else if (pref === 'light') isDark = false;
  else isDark = systemScheme === 'dark';

  return { ...Colors[isDark ? 'dark' : 'light'], isDark };
}

export const Typography = {
  screenHeading: { fontFamily: 'Montserrat-Bold', fontSize: 24, lineHeight: 30 },
  cardTitle: { fontFamily: 'Montserrat-SemiBold', fontSize: 17, lineHeight: 22 },
  body: { fontFamily: 'Lato-Regular', fontSize: 16, lineHeight: 24 },
  label: { fontFamily: 'Montserrat-SemiBold', fontSize: 12, lineHeight: 16 },
  muted: { fontFamily: 'Lato-Regular', fontSize: 13, lineHeight: 20 },
  timer: { fontFamily: 'Montserrat-Bold', fontSize: 46, lineHeight: 54 },
} as const;
