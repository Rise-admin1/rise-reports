import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PhdSuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          PhD Success AE
        </ThemedText>
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
        </View>
      </ThemedView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={[styles.logoContainer, { backgroundColor: cardBackground, borderColor }]}>
            <Image
              source={require('@/assets/images/phd_logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
          <ThemedText type="subtitle" style={styles.brandTitle}>
            PhD Success AE
          </ThemedText>
        </View>

        <View style={styles.reportChoice}>
          <ThemedText type="subtitle" style={styles.reportChoiceTitle}>
            Reports
          </ThemedText>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push('/home/phdsuccess/calendar-metrics' as Href)}
            activeOpacity={0.85}
            accessibilityLabel="Open Calendar Metrics">
            <View style={styles.reportCardContent}>
              <MaterialIcons name="calendar-month" size={32} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.reportCardTitle}>
                Calendar Metrics
              </ThemedText>
              <ThemedText style={styles.reportCardDesc}>GET /api/scheduling/metrics?appSource=phd-success</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push('/home/phdsuccess/booking-stats' as Href)}
            activeOpacity={0.85}
            accessibilityLabel="Open Booking Stats">
            <View style={styles.reportCardContent}>
              <MaterialIcons name="query-stats" size={32} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.reportCardTitle}>
                Client Booking Stats
              </ThemedText>
              <ThemedText style={styles.reportCardDesc}>GET /api/scheduling/booking-stats?appSource=phd-success</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push('/home/phdsuccess/availability-settings' as Href)}
            activeOpacity={0.85}
            accessibilityLabel="Open Availability Settings">
            <View style={styles.reportCardContent}>
              <MaterialIcons name="schedule" size={32} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.reportCardTitle}>
                Availability Settings
              </ThemedText>
              <ThemedText style={styles.reportCardDesc}>
                View & edit weekly booking windows in your timezone
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push('/home/phdsuccess/set-appointment' as Href)}
            activeOpacity={0.85}
            accessibilityLabel="Open Set Appointment">
            <View style={styles.reportCardContent}>
              <MaterialIcons name="event-available" size={32} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.reportCardTitle}>
                Set Appointment
              </ThemedText>
              <ThemedText style={styles.reportCardDesc}>
                Create paid or free shareable booking links
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push('/home/phdsuccess/manage-meetings' as Href)}
            activeOpacity={0.85}
            accessibilityLabel="Open Manage Meetings">
            <View style={styles.reportCardContent}>
              <MaterialIcons name="event-note" size={32} color={colors.tint} />
              <ThemedText type="subtitle" style={styles.reportCardTitle}>
                Manage Meetings
              </ThemedText>
              <ThemedText style={styles.reportCardDesc}>
                Reschedule or cancel upcoming Google Calendar sessions
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>
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
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  reportChoice: {
    marginBottom: 24,
  },
  reportChoiceTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reportCardContent: {
    flex: 1,
  },
  reportCardTitle: {
    marginTop: 8,
    marginBottom: 4,
  },
  reportCardDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
});
