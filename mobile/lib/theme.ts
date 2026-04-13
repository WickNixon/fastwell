import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '@/constants/colors';

export function useTheme(): ThemeColors & { isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
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
