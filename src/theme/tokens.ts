export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  accentMuted: string;
  doctorBadge: string;
  doctorBadgeBg: string;
  pulseLive: string;
  pulseLiveBg: string;
  vitalsCardBg: string;
  herbGold: string;
  herbGoldBg: string;
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
  // Clinical Teal / Ocean Spruce (Medical Ayurveda)
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal200: '#99F6E4',
  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488',
  teal700: '#0F766E',
  teal800: '#115E59',
  teal900: '#134E4A',
  teal950: '#042F2E',

  // Medical Cyan / Pulse Blue
  cyan50: '#ECFEFF',
  cyan100: '#CFFAFE',
  cyan500: '#06B6D4',
  cyan600: '#0891B2',
  blue50: '#F0F9FF',
  blue100: '#E0F2FE',
  blue500: '#0EA5E9',
  blue600: '#0284C7',
  blue700: '#0369A1',

  // Vitality Green (Pulse & Availability)
  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald500: '#10B981',
  emerald600: '#059669',

  // Ayurveda Warm Herb / Amber Gold
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber800: '#92400E',

  // Alert & Medical Danger
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red500: '#EF4444',
  red600: '#DC2626',
  red800: '#991B1B',

  // Neutral Clinical Slate
  slate0: '#FFFFFF',
  slate25: '#F8FAFC',
  slate50: '#F1F5F9',
  slate100: '#E2E8F0',
  slate200: '#CBD5E1',
  slate300: '#94A3B8',
  slate400: '#64748B',
  slate500: '#475569',
  slate600: '#334155',
  slate700: '#1E293B',
  slate800: '#0F172A',
  slate900: '#020617',
  slate950: '#010409',
};

export const lightColors: ThemeColors = {
  background: palette.slate25,
  surface: palette.slate0,
  surfaceElevated: palette.slate0,
  border: palette.slate100,
  borderLight: palette.slate50,
  text: palette.slate800,
  textSecondary: palette.slate500,
  textMuted: palette.slate400,
  primary: palette.teal700,
  primaryMuted: palette.teal50,
  onPrimary: '#FFFFFF',
  accent: palette.cyan600,
  accentMuted: palette.cyan50,
  doctorBadge: palette.blue600,
  doctorBadgeBg: palette.blue100,
  pulseLive: palette.emerald500,
  pulseLiveBg: palette.emerald50,
  vitalsCardBg: palette.teal50,
  herbGold: palette.amber600,
  herbGoldBg: palette.amber50,
  success: palette.emerald600,
  successMuted: palette.emerald50,
  warning: palette.amber600,
  warningMuted: palette.amber50,
  danger: palette.red600,
  dangerMuted: palette.red50,
  info: palette.blue600,
  infoMuted: palette.blue50,
  skeleton: palette.slate100,
  overlay: 'rgba(15, 23, 42, 0.45)',
};

export const darkColors: ThemeColors = {
  background: '#071618',
  surface: '#0B2023',
  surfaceElevated: '#102B30',
  border: '#163B42',
  borderLight: '#112C32',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: palette.teal400,
  primaryMuted: '#0D3437',
  onPrimary: '#042F2E',
  accent: '#38BDF8',
  accentMuted: '#0C2D3D',
  doctorBadge: '#38BDF8',
  doctorBadgeBg: '#0C2D3D',
  pulseLive: '#34D399',
  pulseLiveBg: '#064E3B',
  vitalsCardBg: '#082528',
  herbGold: '#FBBF24',
  herbGoldBg: '#392408',
  success: '#34D399',
  successMuted: '#064E3B',
  warning: '#FBBF24',
  warningMuted: '#392408',
  danger: '#F87171',
  dangerMuted: '#450A0A',
  info: '#38BDF8',
  infoMuted: '#082F49',
  skeleton: '#13353C',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const shadows = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  floating: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
} as const;

export const typography = {
  hero: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  heading: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  subheading: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
} as const;

