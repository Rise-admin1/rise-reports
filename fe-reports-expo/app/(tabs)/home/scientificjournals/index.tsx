import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  approveScientificJournalsReviewer,
  fetchScientificJournalsArticles,
  fetchScientificJournalsFullIssuePurchases,
  fetchScientificJournalsPayments,
  fetchScientificJournalsReviewers,
  fetchScientificJournalsStats,
  fetchScientificJournalsSubscriptions,
  fetchScientificJournalsUsers,
  rejectScientificJournalsReviewer,
} from '@/services/api';
import type {
  ScientificJournalsArticle,
  ScientificJournalsFullIssuePurchase,
  ScientificJournalsPayment,
  ScientificJournalsReviewer,
  ScientificJournalsStats,
  ScientificJournalsSubscription,
  ScientificJournalsUser,
} from '@/types/scientificJournals';
import type { ReportPermission } from '@/types/appAuth';
import { SCIENTIFIC_JOURNALS_PERMS } from '@/types/appAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  | 'reviewers'
  | 'articles'
  | 'payments'
  | 'subscriptions'
  | 'fullIssues';

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

export default function ScientificJournalsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const { hasPermission, hasAnyPermission } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const canAccess = hasAnyPermission(SCIENTIFIC_JOURNALS_PERMS);

  const [view, setView] = useState<ReportView>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<ScientificJournalsStats | null>(null);
  const [users, setUsers] = useState<ScientificJournalsUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [reviewers, setReviewers] = useState<ScientificJournalsReviewer[]>([]);
  const [reviewersTotal, setReviewersTotal] = useState(0);
  const [articles, setArticles] = useState<ScientificJournalsArticle[]>([]);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [payments, setPayments] = useState<ScientificJournalsPayment[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [subscriptions, setSubscriptions] = useState<ScientificJournalsSubscription[]>([]);
  const [subscriptionsTotal, setSubscriptionsTotal] = useState(0);
  const [fullIssues, setFullIssues] = useState<ScientificJournalsFullIssuePurchase[]>([]);
  const [fullIssuesTotal, setFullIssuesTotal] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadView = useCallback(async (next: ReportView) => {
    if (next === 'menu') return;
    setLoading(true);
    setError(null);
    try {
      if (next === 'overview') {
        const resp = await fetchScientificJournalsStats();
        setStats(resp.data);
      } else if (next === 'users') {
        const resp = await fetchScientificJournalsUsers({ page: 1, pageSize: 50 });
        setUsers(resp.users);
        setUsersTotal(resp.total);
      } else if (next === 'reviewers') {
        const resp = await fetchScientificJournalsReviewers({ page: 1, pageSize: 50 });
        setReviewers(resp.reviewers);
        setReviewersTotal(resp.total);
      } else if (next === 'articles') {
        const resp = await fetchScientificJournalsArticles({ page: 1, pageSize: 50 });
        setArticles(resp.articles);
        setArticlesTotal(resp.total);
      } else if (next === 'payments') {
        const resp = await fetchScientificJournalsPayments({ page: 1, pageSize: 50 });
        setPayments(resp.payments);
        setPaymentsTotal(resp.total);
      } else if (next === 'subscriptions') {
        const resp = await fetchScientificJournalsSubscriptions({ page: 1, pageSize: 50 });
        setSubscriptions(resp.subscriptions);
        setSubscriptionsTotal(resp.total);
      } else if (next === 'fullIssues') {
        const resp = await fetchScientificJournalsFullIssuePurchases({ page: 1, pageSize: 50 });
        setFullIssues(resp.purchases);
        setFullIssuesTotal(resp.total);
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

  const onApprove = (userId: string) => {
    Alert.alert('Approve reviewer', 'Approve this reviewer application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          void (async () => {
            setActionId(userId);
            try {
              await approveScientificJournalsReviewer(userId);
              setReviewers((current) =>
                current.map((r) => (r.id === userId ? { ...r, reviewerApproved: true } : r))
              );
            } catch (err) {
              Alert.alert('Failed', err instanceof Error ? err.message : 'Could not approve');
            } finally {
              setActionId(null);
            }
          })();
        },
      },
    ]);
  };

  const onReject = (userId: string) => {
    Alert.alert('Reject reviewer', 'Mark this reviewer as not approved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setActionId(userId);
            try {
              await rejectScientificJournalsReviewer(userId);
              setReviewers((current) =>
                current.map((r) => (r.id === userId ? { ...r, reviewerApproved: false } : r))
              );
            } catch (err) {
              Alert.alert('Failed', err instanceof Error ? err.message : 'Could not reject');
            } finally {
              setActionId(null);
            }
          })();
        },
      },
    ]);
  };

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
      desc: 'Users, reviewers, articles, payments, subscriptions',
      icon: 'insights',
      permission: 'SCIENTIFIC_JOURNALS_STATS',
    },
    {
      id: 'users',
      title: 'User signups',
      desc: 'Author / reader accounts',
      icon: 'person',
      permission: 'SCIENTIFIC_JOURNALS_USERS',
    },
    {
      id: 'reviewers',
      title: 'Reviewer signups',
      desc: 'Pending and approved reviewers',
      icon: 'rate-review',
      permission: 'SCIENTIFIC_JOURNALS_REVIEWERS',
    },
    {
      id: 'articles',
      title: 'Articles submitted',
      desc: 'Manuscript pipeline and publish status',
      icon: 'article',
      permission: 'SCIENTIFIC_JOURNALS_ARTICLES',
    },
    {
      id: 'payments',
      title: 'Article payments',
      desc: 'Open-access / manuscript payment records',
      icon: 'payments',
      permission: 'SCIENTIFIC_JOURNALS_PAYMENTS',
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions',
      desc: 'Portal subscription invoices and periods',
      icon: 'card-membership',
      permission: 'SCIENTIFIC_JOURNALS_SUBSCRIPTIONS',
    },
    {
      id: 'fullIssues',
      title: 'Full-issue purchases',
      desc: 'One-off issue purchases',
      icon: 'library-books',
      permission: 'SCIENTIFIC_JOURNALS_FULL_ISSUES',
    },
  ];
  const menuItems = allMenuItems.filter((item) => hasPermission(item.permission));

  const titleByView: Record<ReportView, string> = {
    menu: 'Scientific Journals Portal',
    overview: 'Platform overview',
    users: 'User signups',
    reviewers: 'Reviewer signups',
    articles: 'Articles submitted',
    payments: 'Article payments',
    subscriptions: 'Subscriptions',
    fullIssues: 'Full-issue purchases',
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
              Choose a Scientific Journals report
            </ThemedText>
            {menuItems.length === 0 ? (
              <ThemedText style={styles.meta}>
                No Scientific Journals reports assigned to your account.
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
              { label: 'User signups', value: String(stats.usersJoined), icon: 'person' as const },
              {
                label: 'Reviewers joined',
                value: String(stats.reviewersJoined),
                icon: 'rate-review' as const,
              },
              {
                label: 'Reviewers pending',
                value: String(stats.reviewersPending),
                icon: 'pending-actions' as const,
              },
              {
                label: 'Reviewers approved',
                value: String(stats.reviewersApproved),
                icon: 'verified' as const,
              },
              {
                label: 'Articles submitted',
                value: String(stats.articlesSubmitted),
                icon: 'article' as const,
              },
              {
                label: 'In review',
                value: String(stats.articlesInReview),
                icon: 'hourglass-empty' as const,
              },
              {
                label: 'Accepted (unpublished)',
                value: String(stats.articlesAccepted),
                icon: 'task-alt' as const,
              },
              {
                label: 'Published',
                value: String(stats.articlesPublished),
                icon: 'check-circle' as const,
              },
              {
                label: 'Paid articles',
                value: String(stats.paidArticles),
                icon: 'payments' as const,
              },
              {
                label: 'Article payment volume',
                value: formatMinor(stats.articlePaymentTotalMinor),
                icon: 'attach-money' as const,
              },
              {
                label: 'Subscriptions total',
                value: String(stats.subscriptionsTotal),
                icon: 'card-membership' as const,
              },
              {
                label: 'Active subscriptions',
                value: String(stats.activeSubscriptions),
                icon: 'verified-user' as const,
              },
              {
                label: 'Full-issue purchases',
                value: String(stats.fullIssuePurchases),
                icon: 'library-books' as const,
              },
              {
                label: 'Full-issue revenue',
                value: formatMinor(stats.fullIssueRevenueMinor),
                icon: 'storefront' as const,
              },
              { label: 'Journals', value: String(stats.journalsCount), icon: 'menu-book' as const },
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
                  {item.affiliation || '—'} · articles {item.articlesCount}
                </ThemedText>
                <ThemedText style={styles.meta}>Joined {formatDate(item.createdAt)}</ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'reviewers' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {reviewersTotal}</ThemedText>
            {reviewers.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name || 'Reviewer'}</ThemedText>
                <ThemedText style={styles.meta}>{item.email}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.affiliation || '—'} ·{' '}
                  {item.reviewerApproved ? 'approved' : 'pending'} · accepted{' '}
                  {item.acceptedArticlesCount}
                </ThemedText>
                <ThemedText style={styles.meta}>Joined {formatDate(item.createdAt)}</ThemedText>
                {!item.reviewerApproved ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: colors.tint, opacity: actionId === item.id ? 0.6 : 1 },
                      ]}
                      disabled={actionId === item.id}
                      onPress={() => onApprove(item.id)}>
                      {actionId === item.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton, { borderColor: '#c0392b' }]}
                      disabled={actionId === item.id}
                      onPress={() => onReject(item.id)}>
                      <ThemedText style={styles.rejectButtonText}>Reject</ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : view === 'articles' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {articlesTotal}</ThemedText>
            {articles.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.journalAbbreviation || item.journalTitle || 'Journal'} · Vol {item.volume} Iss{' '}
                  {item.issue}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.status}
                  {item.paymentStatus ? ' · paid' : ''} · {item.accessModel}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.submitterName || item.submitterEmail || 'Submitter'} ·{' '}
                  {formatDate(item.createdAt)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'payments' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {paymentsTotal}</ThemedText>
            {payments.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.articleTitle}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.payerName || item.payerEmail || 'Payer'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {typeof item.paymentAmount === 'number'
                    ? formatMinor(item.paymentAmount, item.paymentCurrency || 'AED')
                    : '—'}{' '}
                  · {formatDate(item.paymentDate)}
                </ThemedText>
                <ThemedText style={styles.meta}>{item.journalTitle || '—'}</ThemedText>
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
        ) : view === 'fullIssues' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {fullIssuesTotal}</ThemedText>
            {fullIssues.map((item) => (
              <View
                key={item.paymentIntent}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">
                  {item.journalAbbreviation || item.journalTitle || 'Issue'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  Vol {item.volume ?? '—'} Iss {item.issue ?? '—'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.userName || item.userEmail || 'Buyer'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {typeof item.amountMinor === 'number'
                    ? formatMinor(item.amountMinor, item.currency || 'AED')
                    : '—'}
                </ThemedText>
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
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionButton: {
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: { color: '#fff', fontWeight: '700' },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  rejectButtonText: { color: '#c0392b', fontWeight: '700' },
  error: { color: '#c0392b', marginTop: 20 },
});
