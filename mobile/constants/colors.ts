// Fastwell — Wicked Wellbeing Brand Colours
// From UX_PRINCIPLES.md

export const Colors = {
  light: {
    background: '#F4FAF0',
    surface: '#FFFFFF',
    primary: '#5C8A34',
    primaryDeep: '#3D6020',
    accentOrange: '#D06820',
    textPrimary: '#2C4A1A',
    textMuted: '#7A9A6A',
    greenPale: '#EAF3DC',
    border: '#C8DFB0',
    tabBar: '#FFFFFF',
    tabBarActive: '#5C8A34',
    tabBarInactive: '#7A9A6A',
  },
  dark: {
    background: '#0D1A07',
    surface: '#1A2E0D',
    primary: '#7CBB44',
    primaryLight: '#A8D878',
    accentOrange: '#E8842A',
    textPrimary: '#D4EEC0',
    textMuted: '#6B9B4A',
    greenPale: '#1E3A10',
    border: '#2E5018',
    tabBar: '#1A2E0D',
    tabBarActive: '#7CBB44',
    tabBarInactive: '#6B9B4A',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
