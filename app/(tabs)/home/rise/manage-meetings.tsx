import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  cancelSchedulingMeeting,
  fetchManageableMeetings,
  rescheduleSchedulingMeeting,
} from '@/services/api';
import type { SchedulingMeeting } from '@/types/scheduling';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
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

function buildUtcIso(dateYmd: string, timeHm: string): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeHm.trim());
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0)).toISOString();
}

function MeetingCard({
  meeting,
  colors,
  cardBackground,
  borderColor,
  onCancel,
  onReschedule,
  actionId,
  saving,
}: {
  meeting: SchedulingMeeting;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
  onCancel: (meeting: SchedulingMeeting) => void;
  onReschedule: (meeting: SchedulingMeeting, startTime: string) => void;
  actionId: string | null;
  saving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const start = new Date(meeting.startTime);
  const [dateYmd, setDateYmd] = useState(
    `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`
  );
  const [timeHm, setTimeHm] = useState(
    `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')}`
  );

  const isBusy = saving && actionId === meeting.id;

  return (
    <View style={[styles.meetingCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.eventRow}>
        <MaterialIcons name="person" size={18} color={colors.icon} />
        <ThemedText type="defaultSemiBold" style={styles.eventName}>
          {meeting.name}
        </ThemedText>
      </View>
      <View style={styles.eventRow}>
        <MaterialIcons name="email" size={16} color={colors.icon} />
        <ThemedText style={styles.eventDetail}>{meeting.email}</ThemedText>
      </View>
      <View style={styles.eventRow}>
        <MaterialIcons name="schedule" size={16} color={colors.icon} />
        <ThemedText style={styles.eventDetail}>
          {formatEventTime(meeting.startTime, meeting.endTime)}
        </ThemedText>
      </View>
      {meeting.meetLink ? (
        <TouchableOpacity
          style={styles.meetLinkRow}
          onPress={() => Linking.openURL(meeting.meetLink!)}
          activeOpacity={0.8}>
          <MaterialIcons name="videocam" size={16} color={colors.tint} />
          <ThemedText style={[styles.meetLinkText, { color: colors.tint }]}>Open Google Meet</ThemedText>
        </TouchableOpacity>
      ) : (
        <ThemedText style={styles.noMeetText}>No Google Meet link on file</ThemedText>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor, backgroundColor: colors.buttonSecondary }]}
          onPress={() => setExpanded((prev) => !prev)}
          disabled={isBusy}>
          <MaterialIcons name="edit-calendar" size={18} color={colors.tint} />
          <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
            {expanded ? 'Hide reschedule' : 'Reschedule'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton, { borderColor: '#dc2626' }]}
          onPress={() => onCancel(meeting)}
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

      {expanded ? (
        <View style={[styles.rescheduleForm, { borderColor }]}>
          <ThemedText type="defaultSemiBold" style={styles.formLabel}>
            New date (UTC)
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: colors.text, backgroundColor: cardBackground }]}
            value={dateYmd}
            onChangeText={setDateYmd}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.icon}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ThemedText type="defaultSemiBold" style={styles.formLabel}>
            New time (UTC, on the hour)
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: colors.text, backgroundColor: cardBackground }]}
            value={timeHm}
            onChangeText={setTimeHm}
            placeholder="HH:MM"
            placeholderTextColor={colors.icon}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={() => {
              const startTime = buildUtcIso(dateYmd, timeHm);
              if (!startTime) {
                Alert.alert('Invalid time', 'Use YYYY-MM-DD and HH:MM in UTC.');
                return;
              }
              onReschedule(meeting, startTime);
            }}
            disabled={isBusy}>
            {isBusy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Save new time</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default function ManageMeetingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;

  const [meetings, setMeetings] = useState<SchedulingMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadMeetings = useCallback(async (nextOffset: number, append: boolean) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setError(null);
      }
      const data = await fetchManageableMeetings({ appSource: 'rise', offset: nextOffset, limit: 20 });
      setMeetings((prev) => (append ? [...prev, ...data.meetings] : data.meetings));
      setOffset(nextOffset + data.meetings.length);
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings(0, false);
  }, [loadMeetings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    loadMeetings(0, false);
  }, [loadMeetings]);

  const handleCancel = useCallback(
    (meeting: SchedulingMeeting) => {
      Alert.alert(
        'Cancel meeting',
        `Cancel the session with ${meeting.name}? This removes the Google Calendar event and notifies the client.`,
        [
          { text: 'Keep meeting', style: 'cancel' },
          {
            text: 'Cancel meeting',
            style: 'destructive',
            onPress: async () => {
              setSaving(true);
              setActionId(meeting.id);
              try {
                await cancelSchedulingMeeting(meeting.id, 'rise');
                setMeetings((prev) => prev.filter((item) => item.id !== meeting.id));
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

  const handleReschedule = useCallback(
    async (meeting: SchedulingMeeting, startTime: string) => {
      setSaving(true);
      setActionId(meeting.id);
      try {
        const result = await rescheduleSchedulingMeeting(meeting.id, { startTime, appSource: 'rise' });
        setMeetings((prev) =>
          prev.map((item) => (item.id === meeting.id ? result.meeting : item))
        );
        Alert.alert('Rescheduled', 'Meeting time and Google Calendar event were updated.');
      } catch (err) {
        Alert.alert('Reschedule failed', err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSaving(false);
        setActionId(null);
      }
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
          Manage Meetings
        </ThemedText>
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
      </ThemedView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.subtitle}>
            Upcoming confirmed sessions. Reschedule updates Google Calendar and notifies attendees.
            Cancel removes the calendar event.
          </ThemedText>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : error ? (
            <View style={[styles.errorBox, { borderColor }]}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <TouchableOpacity onPress={() => loadMeetings(0, false)}>
                <ThemedText style={{ color: colors.tint }}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : meetings.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor, backgroundColor: cardBackground }]}>
              <MaterialIcons name="event-available" size={40} color={colors.icon} />
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                No upcoming meetings
              </ThemedText>
              <ThemedText style={styles.emptyText}>Confirmed future sessions will appear here.</ThemedText>
            </View>
          ) : (
            <>
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  colors={colors}
                  cardBackground={cardBackground}
                  borderColor={borderColor}
                  onCancel={handleCancel}
                  onReschedule={handleReschedule}
                  actionId={actionId}
                  saving={saving}
                />
              ))}
              {hasMore ? (
                <TouchableOpacity
                  style={[styles.loadMoreButton, { borderColor, backgroundColor: cardBackground }]}
                  onPress={() => loadMeetings(offset, true)}
                  disabled={loadingMore}>
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : (
                    <ThemedText style={{ color: colors.tint }}>Load more</ThemedText>
                  )}
                </TouchableOpacity>
              ) : null}
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
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
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
  subtitle: {
    marginBottom: 20,
    opacity: 0.75,
    lineHeight: 20,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  errorText: {
    color: '#dc2626',
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  meetingCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventName: {
    flex: 1,
  },
  eventDetail: {
    flex: 1,
    opacity: 0.85,
  },
  meetLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  meetLinkText: {
    fontWeight: '600',
  },
  noMeetText: {
    opacity: 0.6,
    fontSize: 13,
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
  rescheduleForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  formLabel: {
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  loadMoreButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
});
