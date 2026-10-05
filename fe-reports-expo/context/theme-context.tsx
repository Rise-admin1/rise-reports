import React, { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

type AppColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  colorScheme: AppColorScheme;
  toggleTheme: () => void;
  setTheme: (scheme: AppColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const nativeScheme = useNativeColorScheme();
  const nativeResolved: AppColorScheme = nativeScheme === 'dark' ? 'dark' : 'light';
  const [colorScheme, setColorScheme] = useState<AppColorScheme>(nativeResolved);

  const toggleTheme = useCallback(() => {
    setColorScheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((scheme: AppColorScheme) => {
    setColorScheme(scheme);
  }, []);

  const value = useMemo(
    () => ({
      colorScheme,
      toggleTheme,
      setTheme,
    }),
    [colorScheme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemePreference must be used inside ThemePreferenceProvider');
  }
  return context;
}

export function useOptionalThemePreference() {
  return useContext(ThemeContext);
}
