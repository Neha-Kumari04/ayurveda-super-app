export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  info: string;
  infoMuted: string;
  skeleton: string;
  overlay: string;
}

const palette = {
  green50: '#E8F5E9',
  green100: '#C8E6C9',
  green500: '#2E7D32',
  green600: '#1B5E20',
  green700: '#14522A',
  teal50: '#E0F2F1',
  teal600: '#00796B',
  amber50: '#FFF8E1',
  amber600: '#F9A825',
  amber800: '#8D6E00',
  red50: '#FFEBEE',
  red600: '#C62828',
  red800: '#8E0000',
  blue50: '#E3F2FD',
  blue600: '#1565C0',
  gray0: '#FFFFFF',
  gray25: '#FAFAFA',
  gray50: '#F5F6F5',
  gray100: '#EEEFEE',
  gray200: '#E0E2E0',
  gray400: '#B0B4B0',
  gray500: '#8A8F8A',
  gray600: '#6B706B',
  gray700: '#4A4E4A',
  gray800: '#2C302C',
  gray900: '#1A1D1A',
  gray950: '#121412',
  white: '#FFFFFF',
};

export const lightColors: ThemeColors = {
  background: palette.gray25,
  surface: palette.gray0,
  surfaceElevated: palette.gray0,
  border: palette.gray200,
  text: palette.gray900,
  textSecondary: palette.gray700,
  textMuted: palette.gray500,
  primary: palette.green600,
  primaryMuted: palette.green50,
  onPrimary: palette.white,
  accent: palette.teal600,
  success: palette.green500,
  successMuted: palette.green50,
  warning: palette.amber800,
  warningMuted: palette.amber50,
  danger: palette.red600,
  dangerMuted: palette.red50,
  info: palette.blue600,
  infoMuted: palette.blue50,
  skeleton: palette.gray100,
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkColors: ThemeColors = {
  background: palette.gray950,
  surface: palette.gray900,
  surfaceElevated: palette.gray800,
  border: palette.gray800,
  text: palette.gray50,
  textSecondary: palette.gray200,
  textMuted: palette.gray400,
  primary: '#66BB6A',
  primaryMuted: palette.green700,
  onPrimary: palette.gray950,
  accent: '#4DB6AC',
  success: '#81C784',
  successMuted: palette.green700,
  warning: '#FFD54F',
  warningMuted: palette.amber800,
  danger: '#E57373',
  dangerMuted: palette.red800,
  info: '#64B5F6',
  infoMuted: palette.blue600,
  skeleton: palette.gray800,
  overlay: 'rgba(0,0,0,0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  hero: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  heading: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  subheading: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 18 },
} as const;
