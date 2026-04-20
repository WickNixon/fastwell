export const colors = {
  green:       '#1E8A4F',
  greenDeep:   '#14693A',
  orange:      '#E2682A',
  surface:     '#FFFFFF',
  bg:          '#F3F0E7',
  text:        '#1A1A1A',
  muted:       '#6B7066',
  border:      '#E8E4D9',
  palegreen:   '#D9ECE0',
  paleorange:  '#FBE4D6',
};

export const typography = {
  heading: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: '700' as const,
    letterSpacing: '-0.01em',
    color: colors.text,
  },
  subhead: {
    fontFamily: 'Lato, sans-serif',
    fontWeight: '400' as const,
    fontSize: '15px',
    color: colors.muted,
  },
  label: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: '600' as const,
    fontSize: '11px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: colors.muted,
  },
  body: {
    fontFamily: 'Lato, sans-serif',
    fontWeight: '400' as const,
    fontSize: '16px',
    color: colors.text,
  },
};

export const shadows = {
  card: '0 2px 8px rgba(0,0,0,0.04)',
  btnPrimary: '0 2px 8px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 14px rgba(30,138,79,0.35)',
};
