import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  fetchDubaiAnalyticaDriPayments,
  fetchDubaiAnalyticaPurchases,
  fetchDubaiAnalyticaStats,
  fetchDubaiAnalyticaSubscriptions,
  fetchDubaiAnalyticaSurveys,
  fetchDubaiAnalyticaUsers,
} from '@/services/api';
import type {
  DubaiAnalyticaDriPayment,
  DubaiAnalyticaPurchase,
  DubaiAnalyticaStats,
  DubaiAnalyticaSubscription,
  DubaiAnalyticaSurvey,
  DubaiAnalyticaUser,
} from '@/types/dubaiAnalytica';
import type { ReportPermission } from '@/types/appAuth';
import { DUBAI_ANALYTICA_PERMS } from '@/types/appAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ReportView =
  | 'menu'
  | 'overview'
  | 'users'
  | 'surveys'
  | 'purchases'
  | 'subscriptions'
  | 'dri';

function formatMinor(amount: number, currency = 'AED'): string {
  const major = amount / 100;
  return `${currency.toUpperCase()} ${major.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function formatUnix(value?: number | null): string {
  if (value == null) return '—';
  try {
    return new Date(value * 1000).toLocaleDateString();
  } catch {
    return String(value);
  }
}

export default function DubaiAnalyticaScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const { hasPermission, hasAnyPermission } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const canAccess = hasAnyPermission(DUBAI_ANALYTICA_PERMS);

  const [view, setView] = useState<ReportView>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DubaiAnalyticaStats | null>(null);
  const [users, setUsers] = useState<DubaiAnalyticaUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [surveys, setSurveys] = useState<DubaiAnalyticaSurvey[]>([]);
  const [surveysTotal, setSurveysTotal] = useState(0);
  const [purchases, setPurchases] = useState<DubaiAnalyticaPurchase[]>([]);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [subscriptions, setSubscriptions] = useState<DubaiAnalyticaSubscription[]>([]);
  const [subscriptionsTotal, setSubscriptionsTotal] = useState(0);
  const [driPayments, setDriPayments] = useState<DubaiAnalyticaDriPayment[]>([]);
  const [driTotal, setDriTotal] = useState(0);

  const loadView = useCallback(async (next: ReportView) => {
    if (next === 'menu') return;
    setLoading(true);
    setError(null);
    try {
      if (next === 'overview') {
        const resp = await fetchDubaiAnalyticaStats();
        setStats(resp.data);
      } else if (next === 'users') {
        const resp = await fetchDubaiAnalyticaUsers({ page: 1, pageSize: 50 });
        setUsers(resp.users);
        setUsersTotal(resp.total);
      } else if (next === 'surveys') {
        const resp = await fetchDubaiAnalyticaSurveys({ page: 1, pageSize: 50 });
        setSurveys(resp.surveys);
        setSurveysTotal(resp.total);
      } else if (next === 'purchases') {
        const resp = await fetchDubaiAnalyticaPurchases({ page: 1, pageSize: 50 });
        setPurchases(resp.purchases);
        setPurchasesTotal(resp.total);
      } else if (next === 'subscriptions') {
        const resp = await fetchDubaiAnalyticaSubscriptions({ page: 1, pageSize: 50 });
        setSubscriptions(resp.subscriptions);
        setSubscriptionsTotal(resp.total);
      } else if (next === 'dri') {
        const resp = await fetchDubaiAnalyticaDriPayments({ page: 1, pageSize: 50 });
        setDriPayments(resp.payments);
        setDriTotal(resp.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const openView = (next: ReportView) => {
    setView(next);
    void loadView(next);
  };

  const { refreshing, onRefresh } = useRefreshControl(
    useCallback(async () => {
      if (view !== 'menu') await loadView(view);
    }, [loadView, view])
  );

  if (!canAccess) {
    return <Redirect href="/home" />;
  }

  const allMenuItems: Array<{
    id: ReportView;
    title: string;
    desc: string;
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    permission: ReportPermission;
  }> = [
    {
      id: 'overview',
      title: 'Platform overview',
      desc: 'Signups, surveys, purchases, subscriptions, DRI',
      icon: 'insights',
      permission: 'DUBAI_ANALYTICA_STATS',
    },
    {
      id: 'users',
      title: 'User signups',
      desc: 'Registered accounts and Pro status',
      icon: 'person',
      permission: 'DUBAI_ANALYTICA_USERS',
    },
    {
      id: 'surveys',
      title: 'Surveys created',
      desc: 'Draft and live surveys with response counts',
      icon: 'poll',
      permission: 'DUBAI_ANALYTICA_SURVEYS',
    },
    {
      id: 'purchases',
      title: 'Market purchases',
      desc: 'Paid response marketplace orders',
      icon: 'payments',
      permission: 'DUBAI_ANALYTICA_PURCHASES',
    },
    {
      id: 'subscriptions',
      title: 'Pro subscriptions',
      desc: 'Active and historical Pro memberships',
      icon: 'card-membership',
      permission: 'DUBAI_ANALYTICA_SUBSCRIPTIONS',
    },
    {
      id: 'dri',
      title: 'DRI report payments',
      desc: 'Interim and full Defence Readiness payments',
      icon: 'security',
      permission: 'DUBAI_ANALYTICA_DRI_PAYMENTS',
    },
  ];
  const menuItems = allMenuItems.filter((item) => hasPermission(item.permission));

  const titleByView: Record<ReportView, string> = {
    menu: 'Dubai Analytica',
    overview: 'Platform overview',
    users: 'User signups',
    surveys: 'Surveys created',
    purchases: 'Market purchases',
    subscriptions: 'Pro subscriptions',
    dri: 'DRI report payments',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => (view === 'menu' ? router.back() : setView('menu'))}
          style={styles.backButton}
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          {titleByView[view]}
        </ThemedText>
        <TouchableOpacity
          style={[styles.themeButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={toggleTheme}>
          <MaterialIcons
            name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'}
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }>
        {view === 'menu' ? (
          <View style={styles.menu}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Choose a Dubai Analytica report
            </ThemedText>
            {menuItems.length === 0 ? (
              <ThemedText style={styles.meta}>
                No Dubai Analytica reports assigned to your account.
              </ThemedText>
            ) : null}
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openView(item.id)}
                activeOpacity={0.85}>
                <MaterialIcons name={item.icon} size={28} color={colors.tint} />
                <View style={styles.menuCardText}>
                  <ThemedText type="subtitle">{item.title}</ThemedText>
                  <ThemedText style={styles.menuDesc}>{item.desc}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
              </TouchableOpacity>
            ))}
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : view === 'overview' && stats ? (
          <View style={styles.grid}>
            {[
              { label: 'Users joined', value: String(stats.usersJoined), icon: 'person' as const },
              { label: 'Verified users', value: String(stats.verifiedUsers), icon: 'verified' as const },
              { label: 'Guest users', value: String(stats.guestUsers), icon: 'person-outline' as const },
              { label: 'Pro members', value: String(stats.proMembers), icon: 'workspace-premium' as const },
              {
                label: 'Active subscriptions',
                value: String(stats.activeSubscriptions),
                icon: 'card-membership' as const,
              },
              { label: 'Surveys total', value: String(stats.surveysTotal), icon: 'poll' as const },
              {
                label: 'Surveys published',
                value: String(stats.surveysPublished),
                icon: 'check-circle' as const,
              },
              { label: 'Survey drafts', value: String(stats.surveysDraft), icon: 'drafts' as const },
              {
                label: 'Survey responses',
                value: String(stats.surveyResponses),
                icon: 'how-to-vote' as const,
              },
              {
                label: 'Market purchases',
                value: String(stats.marketPurchases),
                icon: 'payments' as const,
              },
              {
                label: 'Market purchase volume',
                value: formatMinor(stats.marketPurchaseTotalMinor),
                icon: 'attach-money' as const,
              },
              {
                label: 'DRI interim paid',
                value: String(stats.driInterimPaid),
                icon: 'security' as const,
              },
              { label: 'DRI full paid', value: String(stats.driFullPaid), icon: 'shield' as const },
              {
                label: 'Pending refunds',
                value: String(stats.pendingRefunds),
                icon: 'money-off' as const,
              },
              {
                label: 'Invite campaigns',
                value: String(stats.inviteCampaigns),
                icon: 'mail' as const,
              },
              {
                label: 'AI survey generations',
                value: String(stats.aiSurveyGenerations),
                icon: 'auto-awesome' as const,
              },
            ].map((card) => (
              <View
                key={card.label}
                style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialIcons name={card.icon} size={22} color={colors.tint} />
                <ThemedText style={styles.statValue}>{card.value}</ThemedText>
                <ThemedText style={styles.statLabel}>{card.label}</ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'users' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {usersTotal}</ThemedText>
            {users.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name || 'User'}</ThemedText>
                <ThemedText style={styles.meta}>{item.email}</ThemedText>
                <ThemedText style={styles.meta}>
                  Surveys {item.surveysCount} · purchases {item.purchasesCount}
                  {item.subscriptionActive ? ' · Pro active' : ''}
                  {item.isSuperAdmin ? ' · super admin' : ''}
                </ThemedText>
                <ThemedText style={styles.meta}>Joined {formatDate(item.createdAt)}</ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'surveys' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {surveysTotal}</ThemedText>
            {surveys.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.status} · views {item.views} · responses {item.responsesCount}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.ownerName || item.ownerEmail || 'Owner'} · {formatDate(item.createdAt)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'purchases' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {purchasesTotal}</ThemedText>
            {purchases.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name || item.email}</ThemedText>
                <ThemedText style={styles.meta}>{item.email}</ThemedText>
                <ThemedText style={styles.meta}>
                  {formatMinor(item.amountPaid, item.currency)} · qty {item.quantity}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.country || '—'} · {formatDate(item.createdAt)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'subscriptions' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {subscriptionsTotal}</ThemedText>
            {subscriptions.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.userName || item.email}</ThemedText>
                <ThemedText style={styles.meta}>{item.email}</ThemedText>
                <ThemedText style={styles.meta}>
                  {formatMinor(item.amountMinor)} · {item.isActive ? 'active' : 'inactive'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {formatUnix(item.periodStart)} → {formatUnix(item.periodEnd)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'dri' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {driTotal}</ThemedText>
            {driPayments.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">
                  {item.type === 'full' ? 'Full report' : 'Interim summary'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.respondentName || item.email || 'Respondent'}
                </ThemedText>
                <ThemedText style={styles.meta}>{item.surveyTitle || 'Survey'}</ThemedText>
                <ThemedText style={styles.meta}>{formatDate(item.createdAt)}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  themeButton: { borderWidth: 1, borderRadius: 8, padding: 8 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { marginBottom: 12 },
  menu: { gap: 12 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  menuCardText: { flex: 1 },
  menuDesc: { fontSize: 12, opacity: 0.65, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    minWidth: 140,
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, opacity: 0.7 },
  list: { gap: 10 },
  rowCard: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  meta: { fontSize: 12, opacity: 0.7 },
  error: { color: '#c0392b', marginTop: 20 },
});
