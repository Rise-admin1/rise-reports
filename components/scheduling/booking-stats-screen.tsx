import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { createSchedulingInvite, fetchSchedulingBookingStats, fetchSessionCreditsList } from '@/services/api';
import type {
  SchedulingAppSource,
  SchedulingBookingStatsResponse,
  SchedulingInvite,
  SchedulingInviteType,
  SessionCreditListItem,
} from '@/types/scheduling';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

function formatExpiry(iso: string | null): string {
  if (!iso) return 'No expiry';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function inviteTypeLabel(invite: SchedulingInvite): string {
  if (invite.type === 'package') {
    return `Package (${invite.remainingSessions ?? 0} remaining)`;
  }
  if (invite.type === 'free') return 'Free (100% off)';
  return 'Paid';
}

function inviteExpiryLabel(invite: SchedulingInvite): string {
  if (invite.type === 'free') return formatExpiry(invite.expiresAt);
  return 'Never';
}

function inviteWhatsAppMessage(invite: SchedulingInvite, brand: string): string {
  if (invite.type === 'package') {
    return `You have a complimentary ${brand} session from your package (${invite.remainingSessions ?? 0} remaining). Book here: ${invite.shareUrl}`;
  }
  if (invite.type === 'free') {
    return `You have a complimentary ${brand} session (100% off). Book here: ${invite.shareUrl}`;
  }
  return `Book your ${brand} session here: ${invite.shareUrl}`;
}

function sessionBrandLabel(appSource: SchedulingAppSource): string {
  return appSource === 'rise' ? 'RISE' : 'PhD Success AE';
}

function ClientSetAppointmentCard({
  email,
  appSource,
  colors,
  cardBackground,
  borderColor,
}: {
  email: string;
  appSource: SchedulingAppSource;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
}) {
  const [inviteType, setInviteType] = useState<SchedulingInviteType>('paid');
  const [invite, setInvite] = useState<SchedulingInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const brand = sessionBrandLabel(appSource);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const data = await createSchedulingInvite({ email, type: inviteType, appSource });
      setInvite(data.invite);
    } catch (err) {
      setInvite(null);
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!invite?.shareUrl) return;
    await Clipboard.setStringAsync(invite.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    if (!invite?.shareUrl) return;
    const message = inviteWhatsAppMessage(invite, brand);
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  return (
    <View style={[styles.appointmentCard, { backgroundColor: cardBackground, borderColor }]}>
      <ThemedText type="subtitle" style={styles.appointmentTitle}>
        Create booking link
      </ThemedText>
      <ThemedText style={styles.appointmentHint}>
        Generate a personal link for this client. Their email is pre-filled on the scheduling page.
      </ThemedText>

      <View style={styles.metaRow}>
        <ThemedText style={styles.metaLabel}>Client email</ThemedText>
        <ThemedText type="defaultSemiBold">{email}</ThemedText>
      </View>

      <ThemedText type="defaultSemiBold" style={styles.label}>
        Session type
      </ThemedText>
      <View style={styles.typeRow}>
        {(['paid', 'free'] as SchedulingInviteType[]).map((type) => {
          const selected = inviteType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeChip,
                {
                  borderColor: selected ? colors.tint : borderColor,
                  backgroundColor: selected ? colors.buttonSecondary : cardBackground,
                },
              ]}
              onPress={() => setInviteType(type)}
              accessibilityLabel={type === 'paid' ? 'Paid session' : 'Free session'}>
              <MaterialIcons
                name={type === 'paid' ? 'payments' : 'redeem'}
                size={20}
                color={selected ? colors.tint : colors.icon}
              />
              <ThemedText
                style={[
                  styles.typeChipText,
                  selected && { color: colors.tint, fontWeight: '700' },
                ]}>
                {type === 'paid' ? 'Paid' : 'Free'}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ThemedText style={styles.typeHint}>
        {inviteType === 'free'
          ? 'If this client has package sessions remaining, their package link is used and one session is consumed when they book. Otherwise the link expires in 10 minutes, is one-time use, and applies a 100% Stripe coupon at checkout.'
          : 'Paid links do not expire. Client pays full price at Stripe checkout.'}
      </ThemedText>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }]}
        onPress={handleCreate}
        disabled={loading}
        accessibilityLabel="Create appointment link">
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons name="link" size={20} color="#fff" />
            <ThemedText style={styles.createButtonText}>Generate link</ThemedText>
          </>
        )}
      </TouchableOpacity>

      {error && (
        <View style={[styles.inviteError, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
          <MaterialIcons name="error-outline" size={20} color={colors.errorText} />
          <ThemedText style={[styles.inviteErrorText, { color: colors.errorText }]}>{error}</ThemedText>
        </View>
      )}

      {invite && (
        <View style={[styles.inviteResult, { borderColor }]}>
          <ThemedText type="defaultSemiBold" style={styles.inviteResultTitle}>
            Share link
          </ThemedText>
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Type</ThemedText>
            <ThemedText type="defaultSemiBold">{inviteTypeLabel(invite)}</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Expires</ThemedText>
            <ThemedText type="defaultSemiBold">{inviteExpiryLabel(invite)}</ThemedText>
          </View>

          <View style={[styles.urlBox, { borderColor, backgroundColor: colors.background }]}>
            <ThemedText style={styles.urlText} selectable>
              {invite.shareUrl}
            </ThemedText>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor, backgroundColor: colors.buttonSecondary }]}
              onPress={handleCopy}
              accessibilityLabel="Copy link">
              <MaterialIcons name={copied ? 'check' : 'content-copy'} size={20} color={colors.tint} />
              <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
                {copied ? 'Copied' : 'Copy URL'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor, backgroundColor: '#25D36622' }]}
              onPress={handleWhatsApp}
              accessibilityLabel="Share via WhatsApp">
              <MaterialIcons name="chat" size={20} color="#25D366" />
              <ThemedText style={[styles.actionButtonText, { color: '#25D366' }]}>WhatsApp</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
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

function PackageCreditRow({
  item,
  onPress,
  loading,
  colors,
  cardBackground,
  borderColor,
}: {
  item: SessionCreditListItem;
  onPress: () => void;
  loading: boolean;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.creditRow, { backgroundColor: cardBackground, borderColor }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      accessibilityLabel={`View booking stats for ${item.email}`}>
      <View style={styles.creditRowContent}>
        <ThemedText type="defaultSemiBold" style={styles.creditEmail}>
          {item.email}
        </ThemedText>
        <ThemedText style={styles.creditMeta}>
          Used {item.usedSessions} · Left {item.remainingSessions}
        </ThemedText>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.tint} />
      ) : (
        <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
      )}
    </TouchableOpacity>
  );
}

function BookingStatsDetail({
  stats,
  searchedEmail,
  appSource,
  colors,
  cardBackground,
  borderColor,
}: {
  stats: SchedulingBookingStatsResponse;
  searchedEmail: string;
  appSource: SchedulingAppSource;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
}) {
  return (
    <>
      <View style={[styles.profileCard, { backgroundColor: cardBackground, borderColor }]}>
        <MaterialIcons name="person" size={28} color={colors.tint} />
        <View style={styles.profileText}>
          <ThemedText type="defaultSemiBold" style={styles.profileName}>
            {stats.name ?? 'Unknown client'}
          </ThemedText>
          <ThemedText style={styles.profileEmail}>{searchedEmail}</ThemedText>
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
        <StatCard
          label="Package sessions total"
          value={String(stats.packageSessionsTotal)}
          icon="inventory"
          colors={colors}
          cardBackground={cardBackground}
          borderColor={borderColor}
        />
        <StatCard
          label="Package sessions used"
          value={String(stats.packageSessionsUsed)}
          icon="done-all"
          colors={colors}
          cardBackground={cardBackground}
          borderColor={borderColor}
        />
        <StatCard
          label="Package sessions left"
          value={String(stats.packageSessionsLeft)}
          icon="card-giftcard"
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

      <ClientSetAppointmentCard
        email={searchedEmail}
        appSource={appSource}
        colors={colors}
        cardBackground={cardBackground}
        borderColor={borderColor}
      />

      {stats.totalBookings === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText style={styles.emptyText}>
            No confirmed bookings found for this email.
          </ThemedText>
        </View>
      )}
    </>
  );
}

export default function BookingStatsScreen({ appSource }: { appSource: SchedulingAppSource }) {
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
  const [packageCredits, setPackageCredits] = useState<SessionCreditListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedListEmail, setSelectedListEmail] = useState<string | null>(null);

  const inDetailView = stats !== null;

  const loadPackageCredits = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const data = await fetchSessionCreditsList(appSource);
      setPackageCredits(data.credits);
    } catch (err) {
      setPackageCredits([]);
      setListError(err instanceof Error ? err.message : 'Failed to load package sessions');
    } finally {
      setListLoading(false);
    }
  }, [appSource]);

  useEffect(() => {
    loadPackageCredits();
  }, [loadPackageCredits]);

  const loadStatsForEmail = async (targetEmail: string) => {
    const trimmed = targetEmail.trim();
    if (!trimmed) {
      setError('Please enter an email address');
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchedulingBookingStats(trimmed, appSource);
      setStats(data);
      setSearchedEmail(trimmed);
      setEmail(trimmed);
    } catch (err) {
      setStats(null);
      setSearchedEmail(null);
      setError(err instanceof Error ? err.message : 'Failed to load booking stats');
    } finally {
      setLoading(false);
      setSelectedListEmail(null);
    }
  };

  const handleSearch = () => loadStatsForEmail(email);

  const handleSelectCredit = (item: SessionCreditListItem) => {
    setSelectedListEmail(item.email);
    loadStatsForEmail(item.email);
  };

  const handleBack = () => {
    if (inDetailView) {
      setStats(null);
      setSearchedEmail(null);
      setError(null);
      setSelectedListEmail(null);
      return;
    }
    router.back();
  };

  const { refreshing, onRefresh } = useRefreshControl(
    useCallback(async () => {
      if (inDetailView && searchedEmail) {
        await loadStatsForEmail(searchedEmail);
        return;
      }
      await loadPackageCredits();
    }, [inDetailView, searchedEmail, loadPackageCredits])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel={inDetailView ? 'Back to package list' : 'Go back'}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          {inDetailView ? 'Client details' : 'Booking Stats'}
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
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }>
          {!inDetailView && (
            <>
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
                  style={[
                    styles.searchButton,
                    { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 },
                  ]}
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

              <View style={[styles.listCard, { backgroundColor: cardBackground, borderColor }]}>
                <ThemedText type="subtitle" style={styles.listTitle}>
                  Package sessions
                </ThemedText>
                <ThemedText style={styles.listHint}>
                  All clients with granted package sessions for this app.
                </ThemedText>

                {listLoading ? (
                  <View style={styles.listLoading}>
                    <ActivityIndicator color={colors.tint} />
                  </View>
                ) : listError ? (
                  <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                    <MaterialIcons name="error-outline" size={20} color={colors.errorText} />
                    <ThemedText style={[styles.errorText, { color: colors.errorText }]}>{listError}</ThemedText>
                  </View>
                ) : packageCredits.length === 0 ? (
                  <ThemedText style={styles.listEmpty}>No package sessions granted yet.</ThemedText>
                ) : (
                  <View style={styles.creditList}>
                    {packageCredits.map((item) => (
                      <PackageCreditRow
                        key={item.email}
                        item={item}
                        onPress={() => handleSelectCredit(item)}
                        loading={loading && selectedListEmail === item.email}
                        colors={colors}
                        cardBackground={colors.background}
                        borderColor={borderColor}
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
              <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
              <ThemedText style={[styles.errorText, { color: colors.errorText }]}>{error}</ThemedText>
            </View>
          )}

          {stats && searchedEmail && (
            <BookingStatsDetail
              stats={stats}
              searchedEmail={searchedEmail}
              appSource={appSource}
              colors={colors}
              cardBackground={cardBackground}
              borderColor={borderColor}
            />
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
  listCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listHint: {
    fontSize: 14,
    opacity: 0.75,
    lineHeight: 20,
  },
  listLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  listEmpty: {
    fontSize: 14,
    opacity: 0.65,
    textAlign: 'center',
    paddingVertical: 12,
  },
  creditList: {
    gap: 10,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  creditRowContent: {
    flex: 1,
    gap: 4,
  },
  creditEmail: {
    fontSize: 15,
  },
  creditMeta: {
    fontSize: 13,
    opacity: 0.75,
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
  appointmentCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    gap: 10,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  appointmentHint: {
    fontSize: 14,
    opacity: 0.75,
    lineHeight: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metaLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeHint: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  inviteError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  inviteErrorText: {
    flex: 1,
    fontSize: 14,
  },
  inviteResult: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  inviteResultTitle: {
    fontSize: 16,
  },
  urlBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  urlText: {
    fontSize: 13,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
