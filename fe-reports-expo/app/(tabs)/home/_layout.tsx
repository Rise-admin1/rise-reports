import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Stack, useRouter, type Href } from 'expo-router';
import React, { useEffect } from 'react';

export default function HomeLayout() {
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const tabNavigation = navigation.getParent<BottomTabNavigationProp<ParamListBase>>();
    if (!tabNavigation) return;

    const unsubscribe = tabNavigation.addListener('tabPress', () => {
      router.replace('/home' as Href);
    });

    return unsubscribe;
  }, [navigation, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Reports' }} />
      <Stack.Screen name="funyula" options={{ title: 'Funyula' }} />
      <Stack.Screen name="rise" options={{ title: 'RISE' }} />
      <Stack.Screen name="phdsuccess" options={{ title: 'PhD Success AE' }} />
      <Stack.Screen name="coachacadem" options={{ title: 'Coach Academ' }} />
      <Stack.Screen name="velo" options={{ title: 'Velo' }} />
      <Stack.Screen name="safaribooks" options={{ title: 'Safari Books' }} />
      <Stack.Screen name="scientificjournals" options={{ title: 'Scientific Journals Portal' }} />
      <Stack.Screen name="dubaianalytica" options={{ title: 'Dubai Analytica' }} />
    </Stack>
  );
}
