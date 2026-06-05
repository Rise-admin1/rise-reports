import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchSchedulingBookingStats } from '@/services/api';
import type { SchedulingBookingStatsResponse } from '@/types/scheduling';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatHours(hours: number): string {
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatCard({
  label,
  value,
  icon,
  colors,
  cardBackground,
  borderColor,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: cardBackground, borderColor }]}>
      <MaterialIcons name={icon} size={22} color={colors.tint} />
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold" style={styles.statValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function BookingStatsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;

  const [email, setEmail] = useState('');
  const [stats, setStats] = useState<SchedulingBookingStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter an email address');
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchedulingBookingStats(trimmed, 'rise');
      setStats(data);
      setSearchedEmail(trimmed);
    } catch (err) {
      setStats(null);
      setSearchedEmail(null);
      setError(err instanceof Error ? err.message : 'Failed to load booking stats');
    } finally {
      setLoading(false);
    }
  };

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
          Booking Stats
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.searchCard, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText type="subtitle" style={styles.searchTitle}>
              Look up client bookings
            </ThemedText>
            <ThemedText style={styles.searchHint}>
              Enter a client email to see confirmed session totals and hours booked.
            </ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="client@example.com"
              placeholderTextColor={colors.icon}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              style={[
                styles.emailInput,
                {
                  color: colors.text,
                  borderColor,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }]}
              onPress={handleSearch}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityLabel="Search booking stats">
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="search" size={20} color="#fff" />
                  <ThemedText style={styles.searchButtonText}>Search</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
              <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
              <ThemedText style={[styles.errorText, { color: colors.errorText }]}>{error}</ThemedText>
            </View>
          )}

          {stats && (
            <>
              <View style={[styles.profileCard, { backgroundColor: cardBackground, borderColor }]}>
                <MaterialIcons name="person" size={28} color={colors.tint} />
                <View style={styles.profileText}>
                  <ThemedText type="defaultSemiBold" style={styles.profileName}>
                    {stats.name ?? 'Unknown client'}
                  </ThemedText>
                  <ThemedText style={styles.profileEmail}>{searchedEmail ?? stats.email}</ThemedText>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <StatCard
                  label="Total bookings"
                  value={String(stats.totalBookings)}
                  icon="event"
                  colors={colors}
                  cardBackground={cardBackground}
                  borderColor={borderColor}
                />
                <StatCard
                  label="Total hours"
                  value={formatHours(stats.totalHours)}
                  icon="schedule"
                  colors={colors}
                  cardBackground={cardBackground}
                  borderColor={borderColor}
                />
                <StatCard
                  label="Completed"
                  value={`${stats.completedBookings} · ${formatHours(stats.completedHours)}`}
                  icon="check-circle"
                  colors={colors}
                  cardBackground={cardBackground}
                  borderColor={borderColor}
                />
                <StatCard
                  label="Upcoming"
                  value={`${stats.upcomingBookings} · ${formatHours(stats.upcomingHours)}`}
                  icon="event-available"
                  colors={colors}
                  cardBackground={cardBackground}
                  borderColor={borderColor}
                />
              </View>

              <View style={[styles.timelineCard, { backgroundColor: cardBackground, borderColor }]}>
                <ThemedText type="subtitle" style={styles.timelineTitle}>
                  Booking timeline
                </ThemedText>
                <View style={styles.timelineRow}>
                  <ThemedText style={styles.timelineLabel}>First session</ThemedText>
                  <ThemedText type="defaultSemiBold">{formatDateTime(stats.firstBookingAt)}</ThemedText>
                </View>
                <View style={[styles.timelineDivider, { backgroundColor: borderColor }]} />
                <View style={styles.timelineRow}>
                  <ThemedText style={styles.timelineLabel}>Final session</ThemedText>
                  <ThemedText type="defaultSemiBold">{formatDateTime(stats.lastBookingAt)}</ThemedText>
                </View>
                <View style={[styles.timelineDivider, { backgroundColor: borderColor }]} />
                <View style={styles.timelineRow}>
                  <ThemedText style={styles.timelineLabel}>Last completed</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {stats.lastCompletedMeeting
                      ? formatDateTime(stats.lastCompletedMeeting.startTime)
                      : '—'}
                  </ThemedText>
                </View>
              </View>

              {stats.totalBookings === 0 && (
                <View style={[styles.emptyCard, { backgroundColor: cardBackground, borderColor }]}>
                  <ThemedText style={styles.emptyText}>
                    No confirmed bookings found for this email.
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  searchCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchHint: {
    fontSize: 14,
    opacity: 0.75,
    lineHeight: 20,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  profileText: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
  },
  profileEmail: {
    fontSize: 14,
    opacity: 0.75,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  statLabel: {
    fontSize: 13,
    opacity: 0.75,
  },
  statValue: {
    fontSize: 20,
  },
  timelineCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timelineLabel: {
    fontSize: 14,
    opacity: 0.75,
  },
  timelineDivider: {
    height: 1,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.65,
    textAlign: 'center',
  },
});
