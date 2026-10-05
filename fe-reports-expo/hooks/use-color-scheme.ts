import { useOptionalThemePreference } from '@/context/theme-context';
import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  const themePreference = useOptionalThemePreference();
  const nativeColorScheme = useNativeColorScheme();

  if (themePreference) {
    return themePreference.colorScheme;
  }

  return nativeColorScheme;
}
