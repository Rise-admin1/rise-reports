import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReportPermission } from '@/types/appAuth';
import {
  COACH_ACADEM_PERMS,
  DUBAI_ANALYTICA_PERMS,
  SAFARI_BOOKS_PERMS,
  SCIENTIFIC_JOURNALS_PERMS,
  VELO_PERMS,
} from '@/types/appAuth';

const FUNYULA_PERMS: ReportPermission[] = [
  'FUNYULA_PAYMENTS',
  'FUNYULA_VOLUNTEERS',
  'FUNYULA_SAMIA_WOMEN',
  'FUNYULA_MANIFESTO',
];
const RISE_PERMS: ReportPermission[] = ['RISE_PROFILES', 'RISE_INVESTORS', 'RISE_SCHEDULING'];
const PHD_PERMS: ReportPermission[] = ['PHD_SCHEDULING'];
const COACH_PERMS = COACH_ACADEM_PERMS;
const VELO_HOME_PERMS = VELO_PERMS;
const SAFARI_PERMS = SAFARI_BOOKS_PERMS;
const SJP_PERMS = SCIENTIFIC_JOURNALS_PERMS;
const DA_PERMS = DUBAI_ANALYTICA_PERMS;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loading, hasAnyPermission, isSuperAdmin, role } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const canSeeHome =
    isSuperAdmin ||
    hasAnyPermission([
      ...FUNYULA_PERMS,
      ...RISE_PERMS,
      ...PHD_PERMS,
      ...COACH_PERMS,
      ...VELO_HOME_PERMS,
      ...SAFARI_PERMS,
      ...SJP_PERMS,
      ...DA_PERMS,
    ]);
  const canSeeTasks = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'USER';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          href: canSeeHome ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="task"
        options={{
          title: 'Tasks',
          href: canSeeTasks ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          href: isSuperAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="lock.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
