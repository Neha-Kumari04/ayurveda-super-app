import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

import { darkColors, lightColors, radius, shadows, spacing, typography } from './tokens';

import type { ThemeColors } from './tokens';

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  scheme: 'light' | 'dark';
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  const value = useMemo<Theme>(() => {
    const scheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    return {
      colors: scheme === 'dark' ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      shadows,
      scheme,
    };
  }, [mode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}
