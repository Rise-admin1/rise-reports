import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { REPORT_PERMISSIONS } from '@/types/appAuth';

export default function Index() {
  const { isAuthenticated, loading, isSuperAdmin, hasAnyPermission } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const canSeeHome = isSuperAdmin || hasAnyPermission(REPORT_PERMISSIONS);
  return <Redirect href={canSeeHome ? '/home' : '/task'} />;
}
