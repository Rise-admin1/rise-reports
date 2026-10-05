import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cancelSchedulingMeeting, fetchSchedulingMetrics } from '@/services/api';
import type { SchedulingEvent, SchedulingMetricsResponse } from '@/types/scheduling';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatEventTime(startTime: string, endTime: string): string {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const datePart = start.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const startPart = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const endPart = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${datePart} · ${startPart} – ${endPart}`;
  } catch {
    return `${startTime} – ${endTime}`;
  }
}

function EventCard({
  event,
  index,
  colors,
  cardBackground,
  borderColor,
  showCancel,
  onCancel,
  actionId,
  saving,
}: {
  event: SchedulingEvent;
  index: number;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
  showCancel?: boolean;
  onCancel?: (event: SchedulingEvent) => void;
  actionId?: string | null;
  saving?: boolean;
}) {
  const isBusy = saving && actionId === event.id;
  return (
    <View style={[styles.eventCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.cardIdRow}>
        <View style={[styles.cardIdBadge, { backgroundColor: colors.buttonSecondary, borderColor }]}>
          <ThemedText type="defaultSemiBold" style={[styles.cardIdText, { color: colors.tint }]}>
            #{index}
          </ThemedText>
        </View>
      </View>
      <View style={styles.eventRow}>
        <MaterialIcons name="person" size={18} color={colors.icon} />
        <ThemedText type="defaultSemiBold" style={styles.eventName}>
          {event.name}
        </ThemedText>
      </View>
      <View style={styles.eventRow}>
        <MaterialIcons name="email" size={16} color={colors.icon} />
        <ThemedText style={styles.eventDetail}>{event.email}</ThemedText>
      </View>
      <View style={styles.eventRow}>
        <MaterialIcons name="schedule" size={16} color={colors.icon} />
        <ThemedText style={styles.eventDetail}>{formatEventTime(event.startTime, event.endTime)}</ThemedText>
      </View>
      {event.meetLink ? (
        <TouchableOpacity
          style={styles.meetLinkRow}
          onPress={() => Linking.openURL(event.meetLink!)}
          activeOpacity={0.8}
          accessibilityLabel="Open Google Meet link">
          <MaterialIcons name="videocam" size={16} color={colors.tint} />
          <ThemedText style={[styles.meetLinkText, { color: colors.tint }]} numberOfLines={1}>
            {event.meetLink}
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <ThemedText style={styles.noMeetLink}>No meet link</ThemedText>
      )}
      {showCancel && onCancel ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, { borderColor: '#dc2626' }]}
            onPress={() => onCancel(event)}
            disabled={isBusy}>
            {isBusy ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <>
                <MaterialIcons name="event-busy" size={18} color="#dc2626" />
                <ThemedText style={[styles.actionButtonText, { color: '#dc2626' }]}>Cancel</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function EventSection({
  title,
  icon,
  events,
  emptyMessage,
  colors,
  cardBackground,
  borderColor,
  page,
  totalCount,
  limit,
  loading,
  onPrevious,
  onNext,
  showCancel,
  onCancel,
  actionId,
  saving,
}: {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  events: SchedulingEvent[];
  emptyMessage: string;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
  page: number;
  totalCount: number;
  limit: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
  showCancel?: boolean;
  onCancel?: (event: SchedulingEvent) => void;
  actionId?: string | null;
  saving?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={22} color={colors.tint} />
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {title}
        </ThemedText>
        <View style={[styles.countBadge, { backgroundColor: colors.buttonSecondary, borderColor }]}>
          <ThemedText style={[styles.countText, { color: colors.tint }]}>{totalCount}</ThemedText>
        </View>
      </View>
      {events.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
        </View>
      ) : (
        events.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            index={(page - 1) * limit + index + 1}
            colors={colors}
            cardBackground={cardBackground}
            borderColor={borderColor}
            showCancel={showCancel}
            onCancel={onCancel}
            actionId={actionId}
            saving={saving}
          />
        ))
      )}
      {totalCount > 0 && (
        <>
          <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.paginationRow}>
              <MaterialIcons name="list" size={20} color={colors.icon} />
              <ThemedText style={styles.paginationText}>
                Total {totalCount} · {limit} per page
              </ThemedText>
            </View>
          </View>
          <View style={styles.paginationNav}>
            <TouchableOpacity
              style={[
                styles.paginationNavButton,
                {
                  backgroundColor: colors.buttonSecondary,
                  borderColor,
                  opacity: loading || page <= 1 ? 0.45 : 1,
                },
              ]}
              onPress={onPrevious}
              disabled={loading || page <= 1}
              accessibilityLabel="Previous page">
              <MaterialIcons name="chevron-left" size={22} color={colors.text} />
              <ThemedText style={styles.paginationNavLabel}>Previous</ThemedText>
            </TouchableOpacity>
            <View style={styles.paginationNavCenter}>
              <ThemedText style={styles.paginationNavPageText}>
                Page {page} of {totalPages}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[
                styles.paginationNavButton,
                {
                  backgroundColor: colors.buttonSecondary,
                  borderColor,
                  opacity: loading || page >= totalPages ? 0.45 : 1,
                },
              ]}
              onPress={onNext}
              disabled={loading || page >= totalPages}
              accessibilityLabel="Next page">
              <ThemedText style={styles.paginationNavLabel}>Next</ThemedText>
              <MaterialIcons name="chevron-right" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export default function CalendarMetricsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;
  const pageLimit = 10;

  const [metrics, setMetrics] = useState<SchedulingMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadMetrics = useCallback(
    async (
      options: {
        isRefresh?: boolean;
        upcomingPage?: number;
        completedPage?: number;
      } = {}
    ) => {
      const nextUpcomingPage = options.upcomingPage ?? 1;
      const nextCompletedPage = options.completedPage ?? 1;
      const isRefresh = options.isRefresh ?? false;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await fetchSchedulingMetrics({
          appSource: 'phd-success',
          upcomingOffset: (nextUpcomingPage - 1) * pageLimit,
          completedOffset: (nextCompletedPage - 1) * pageLimit,
          limit: pageLimit,
        });
        setMetrics(data);
        setUpcomingPage(nextUpcomingPage);
        setCompletedPage(nextCompletedPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calendar metrics');
        setMetrics(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMetrics({ upcomingPage: 1, completedPage: 1 });
  }, [loadMetrics]);

  const handleCancel = useCallback(
    (event: SchedulingEvent) => {
      Alert.alert(
        'Cancel meeting',
        `Cancel the session with ${event.name}? This removes the Google Calendar event and notifies the client.`,
        [
          { text: 'Keep meeting', style: 'cancel' },
          {
            text: 'Cancel meeting',
            style: 'destructive',
            onPress: async () => {
              setSaving(true);
              setActionId(event.id);
              try {
                await cancelSchedulingMeeting(event.id, 'phd-success');
                setMetrics((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    upcomingEvents: prev.upcomingEvents.filter((item) => item.id !== event.id),
                    pagination: {
                      ...prev.pagination,
                      upcoming: {
                        ...prev.pagination.upcoming,
                        totalCount: Math.max(0, prev.pagination.upcoming.totalCount - 1),
                      },
                    },
                  };
                });
              } catch (err) {
                Alert.alert('Cancel failed', err instanceof Error ? err.message : 'Unknown error');
              } finally {
                setSaving(false);
                setActionId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

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
          Calendar Metrics
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

      {loading && !metrics ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading calendar metrics…</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMetrics({ isRefresh: true, upcomingPage: 1, completedPage: 1 })}
              tintColor={colors.tint}
            />
          }>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
              <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
              <ThemedText style={[styles.errorText, { color: colors.errorText }]}>{error}</ThemedText>
              <TouchableOpacity onPress={() => loadMetrics()} accessibilityLabel="Retry">
                <ThemedText style={[styles.retryText, { color: colors.tint }]}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {metrics && (
            <>
              <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor }]}>
                <View style={styles.summaryRow}>
                  <MaterialIcons name="event-available" size={20} color={colors.success} />
                  <ThemedText style={styles.summaryLabel}>Upcoming</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
                    {metrics.pagination.upcoming.totalCount}
                  </ThemedText>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
                <View style={styles.summaryRow}>
                  <MaterialIcons name="event-busy" size={20} color={colors.icon} />
                  <ThemedText style={styles.summaryLabel}>Completed</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
                    {metrics.pagination.completed.totalCount}
                  </ThemedText>
                </View>
              </View>

              <EventSection
                title="Upcoming events"
                icon="event"
                events={metrics.upcomingEvents}
                emptyMessage="No upcoming confirmed sessions."
                colors={colors}
                cardBackground={cardBackground}
                borderColor={borderColor}
                page={upcomingPage}
                totalCount={metrics.pagination.upcoming.totalCount}
                limit={metrics.pagination.limit}
                loading={loading}
                onPrevious={() => loadMetrics({ upcomingPage: upcomingPage - 1 })}
                onNext={() => loadMetrics({ upcomingPage: upcomingPage + 1 })}
                showCancel
                onCancel={handleCancel}
                actionId={actionId}
                saving={saving}
              />

              <EventSection
                title="Completed events"
                icon="history"
                events={metrics.completedEvents}
                emptyMessage="No completed sessions yet."
                colors={colors}
                cardBackground={cardBackground}
                borderColor={borderColor}
                page={completedPage}
                totalCount={metrics.pagination.completed.totalCount}
                limit={metrics.pagination.limit}
                loading={loading}
                onPrevious={() => loadMetrics({ completedPage: completedPage - 1 })}
                onNext={() => loadMetrics({ completedPage: completedPage + 1 })}
              />
            </>
          )}
        </ScrollView>
      )}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    minWidth: '60%',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 18,
  },
  summaryDivider: {
    height: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.65,
    textAlign: 'center',
  },
  eventCard: {
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
  cardIdRow: {
    marginBottom: 12,
  },
  cardIdBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardIdText: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  eventName: {
    flex: 1,
    fontSize: 16,
  },
  eventDetail: {
    flex: 1,
    fontSize: 14,
    opacity: 0.85,
  },
  meetLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  meetLinkText: {
    flex: 1,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  noMeetLink: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontWeight: '600',
  },
  paginationCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationText: {
    fontSize: 13,
    opacity: 0.8,
  },
  paginationNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  paginationNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  paginationNavLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginationNavCenter: {
    flex: 1,
    alignItems: 'center',
  },
  paginationNavPageText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
