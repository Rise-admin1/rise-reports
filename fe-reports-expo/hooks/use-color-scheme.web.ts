import { useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import { useOptionalThemePreference } from '@/context/theme-context';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const themePreference = useOptionalThemePreference();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useNativeColorScheme();

  if (themePreference) {
    return themePreference.colorScheme;
  }

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
