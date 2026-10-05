import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import type { ReportPermission } from '@/types/appAuth';
import {
  COACH_ACADEM_PERMS,
  DUBAI_ANALYTICA_PERMS,
  SAFARI_BOOKS_PERMS,
  SCIENTIFIC_JOURNALS_PERMS,
  VELO_PERMS,
} from '@/types/appAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const { hasAnyPermission, logout, user } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;
  const { refreshing, onRefresh } = useRefreshControl(useCallback(async () => {}, []));

  const showFunyula = hasAnyPermission(FUNYULA_PERMS);
  const showRise = hasAnyPermission(RISE_PERMS);
  const showPhd = hasAnyPermission(PHD_PERMS);
  const showCoach = hasAnyPermission(COACH_PERMS);
  const showVelo = hasAnyPermission(VELO_HOME_PERMS);
  const showSafari = hasAnyPermission(SAFARI_PERMS);
  const showSjp = hasAnyPermission(SJP_PERMS);
  const showDa = hasAnyPermission(DA_PERMS);

  const onLogout = () => {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerTitleBlock}>
          <ThemedText type="title" style={styles.headerTitle}>
            Reports
          </ThemedText>
          {user ? (
            <ThemedText style={styles.headerSubtitle}>
              {user.displayName || user.username} · {user.role}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.themeButton, { borderColor, backgroundColor: cardBackground }]}
            onPress={toggleTheme}
            accessibilityLabel={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
            <MaterialIcons
              name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeButton, { borderColor, backgroundColor: cardBackground }]}
            onPress={onLogout}
            accessibilityLabel="Sign out">
            <MaterialIcons name="logout" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }>
        <View style={styles.reportChoice}>
          <ThemedText type="subtitle" style={styles.reportChoiceTitle}>
            Choose a report
          </ThemedText>
          {!showFunyula &&
          !showRise &&
          !showPhd &&
          !showCoach &&
          !showVelo &&
          !showSafari &&
          !showSjp &&
          !showDa ? (
            <ThemedText style={styles.emptyText}>No report access assigned to your account.</ThemedText>
          ) : null}
          {showFunyula ? (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push('/home/funyula' as Href)}
              activeOpacity={0.85}>
              <View style={styles.reportCardLeft}>
                <View style={styles.reportCardImageContainer}>
                  <Image
                    source={require('@/assets/images/funyula.png')}
                    style={styles.reportCardImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.reportCardContent}>
                  <ThemedText type="subtitle" style={styles.reportCardTitle}>
                    Funyula
                  </ThemedText>
                  <ThemedText style={styles.reportCardDesc}>View Funyula reports</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
          {showRise ? (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push('/home/rise' as Href)}
              activeOpacity={0.85}>
              <View style={styles.reportCardLeft}>
                <View style={styles.reportCardImageContainer}>
                  <Image
                    source={require('@/assets/images/1-7ffa7b50.png')}
                    style={styles.reportCardImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.reportCardContent}>
                  <ThemedText type="subtitle" style={styles.reportCardTitle}>
                    RISE
                  </ThemedText>
                  <ThemedText style={styles.reportCardDesc}>View RISE reports</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
          {showPhd ? (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push('/home/phdsuccess' as Href)}
              activeOpacity={0.85}>
              <View style={styles.reportCardLeft}>
                <View style={styles.reportCardImageContainer}>
                  <Image
                    source={require('@/assets/images/phd_logo.png')}
                    style={styles.reportCardImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.reportCardContent}>
                  <ThemedText type="subtitle" style={styles.reportCardTitle}>
                    PhD Success
                  </ThemedText>
                  <ThemedText style={styles.reportCardDesc}>View PhD Success AE reports</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
          {showCoach ? (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push('/home/coachacadem' as Href)}
              activeOpacity={0.85}>
              <View style={styles.reportCardLeft}>
                <View style={styles.reportCardImageContainer}>
                  <Image
                    source={require('@/assets/images/coachacadem.png')}
                    style={styles.reportCardImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.reportCardContent}>
                  <ThemedText type="subtitle" style={styles.reportCardTitle}>
                    Coach Academ
                  </ThemedText>
                  <ThemedText style={styles.reportCardDesc}>
                    Signups, subjects, purchases and admin queue
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
          {showVelo ? (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push('/home/velo' as Href)}
              activeOpacity={0.85}>
              <View style={styles.reportCardLeft}>
                <View style={styles.reportCardImageContainer}>
                  <Image
                    source={require('@/assets/images/velo.png')}
                    style={styles.reportCardImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.reportCardContent}>
                  <ThemedText type="subtitle" style={styles.reportCardTitle}>
                    Velo
                  </ThemedText>
                  <ThemedText style={styles.reportCardDesc}>
                    Senders, agents, shipments, purchases and admin queue
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
          {showSafari ? (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push('/home/safaribooks' as Href)}
              activeOpacity={0.85}>
              <View style={styles.reportCardLeft}>
                <View style={styles.reportCardImageContainer}>
                  <Image
                    source={require('@/assets/images/safaribooks.png')}
                    style={styles.reportCardImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.reportCardContent}>
                  <ThemedText type="subtitle" style={styles.reportCardTitle}>
                    Safari Books
                  </ThemedText>
                  <ThemedText style={styles.reportCardDesc}>
                    Listeners, publishers, books and verification queue
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
          {showSjp ? (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push('/home/scientificjournals' as Href)}
              activeOpacity={0.85}>
              <View style={styles.reportCardLeft}>
                <View style={styles.reportCardImageContainer}>
                  <Image
                    source={require('@/assets/images/scientificjournals.png')}
                    style={styles.reportCardImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.reportCardContent}>
                  <ThemedText type="subtitle" style={styles.reportCardTitle}>
                    Scientific Journals Portal
                  </ThemedText>
                  <ThemedText style={styles.reportCardDesc}>
                    Users, reviewers, articles, payments and subscriptions
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
          {showDa ? (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => router.push('/home/dubaianalytica' as Href)}
              activeOpacity={0.85}>
              <View style={styles.reportCardLeft}>
                <View style={styles.reportCardImageContainer}>
                  <Image
                    source={require('@/assets/images/dubaianalytica.png')}
                    style={styles.reportCardImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.reportCardContent}>
                  <ThemedText type="subtitle" style={styles.reportCardTitle}>
                    Dubai Analytica
                  </ThemedText>
                  <ThemedText style={styles.reportCardDesc}>
                    Signups, surveys, market purchases and subscriptions
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  reportChoice: {
    gap: 12,
  },
  reportChoiceTitle: {
    marginBottom: 4,
  },
  emptyText: {
    opacity: 0.7,
    marginBottom: 8,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  reportCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportCardImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCardImage: {
    width: 44,
    height: 44,
  },
  reportCardContent: {
    flex: 1,
  },
  reportCardTitle: {
    fontSize: 17,
  },
  reportCardDesc: {
    opacity: 0.65,
    fontSize: 13,
  },
});
