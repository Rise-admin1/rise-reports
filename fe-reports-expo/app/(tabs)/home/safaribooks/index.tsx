import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  fetchSafariBooksBooks,
  fetchSafariBooksListeners,
  fetchSafariBooksPendingVerifications,
  fetchSafariBooksPublishers,
  fetchSafariBooksStats,
  rejectSafariBooksPublisher,
} from '@/services/api';
import type {
  SafariBooksBook,
  SafariBooksListener,
  SafariBooksPendingPublisher,
  SafariBooksPublisher,
  SafariBooksStats,
} from '@/types/safariBooks';
import type { ReportPermission } from '@/types/appAuth';
import { SAFARI_BOOKS_PERMS } from '@/types/appAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ReportView =
  | 'menu'
  | 'overview'
  | 'listeners'
  | 'publishers'
  | 'books'
  | 'pending';

type PendingItem = SafariBooksPendingPublisher & { kind: 'company' | 'author' };

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function SafariBooksScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const { hasPermission, hasAnyPermission } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const canAccess = hasAnyPermission(SAFARI_BOOKS_PERMS);

  const [view, setView] = useState<ReportView>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<SafariBooksStats | null>(null);
  const [listeners, setListeners] = useState<SafariBooksListener[]>([]);
  const [listenersTotal, setListenersTotal] = useState(0);
  const [publishers, setPublishers] = useState<SafariBooksPublisher[]>([]);
  const [publishersTotal, setPublishersTotal] = useState(0);
  const [books, setBooks] = useState<SafariBooksBook[]>([]);
  const [booksTotal, setBooksTotal] = useState(0);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [rejectTarget, setRejectTarget] = useState<PendingItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const loadView = useCallback(async (next: ReportView) => {
    if (next === 'menu') return;
    setLoading(true);
    setError(null);
    try {
      if (next === 'overview') {
        const resp = await fetchSafariBooksStats();
        setStats(resp.data);
      } else if (next === 'listeners') {
        const resp = await fetchSafariBooksListeners({ page: 1, pageSize: 50 });
        setListeners(resp.listeners);
        setListenersTotal(resp.total);
      } else if (next === 'publishers') {
        const resp = await fetchSafariBooksPublishers({ page: 1, pageSize: 50 });
        setPublishers(resp.publishers);
        setPublishersTotal(resp.total);
      } else if (next === 'books') {
        const resp = await fetchSafariBooksBooks({ page: 1, pageSize: 50 });
        setBooks(resp.books);
        setBooksTotal(resp.total);
      } else if (next === 'pending') {
        const resp = await fetchSafariBooksPendingVerifications();
        const companies = (resp.company || []).map((item) => ({ ...item, kind: 'company' as const }));
        const authors = (resp.author || []).map((item) => ({ ...item, kind: 'author' as const }));
        setPending([...companies, ...authors]);
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

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      Alert.alert('Reason required', 'Please enter at least 10 characters.');
      return;
    }
    setRejectSubmitting(true);
    try {
      await rejectSafariBooksPublisher(rejectTarget.id, rejectTarget.kind === 'company', reason);
      setPending((current) => current.filter((item) => item.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      Alert.alert('Reject failed', err instanceof Error ? err.message : 'Could not reject publisher');
    } finally {
      setRejectSubmitting(false);
    }
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
      desc: 'Listeners, publishers, books, engagement',
      icon: 'insights',
      permission: 'SAFARI_BOOKS_STATS',
    },
    {
      id: 'listeners',
      title: 'Listeners joined',
      desc: 'Listener signups and library activity',
      icon: 'headphones',
      permission: 'SAFARI_BOOKS_LISTENERS',
    },
    {
      id: 'publishers',
      title: 'Publishers',
      desc: 'Authors and companies with verification status',
      icon: 'business',
      permission: 'SAFARI_BOOKS_PUBLISHERS',
    },
    {
      id: 'books',
      title: 'Books catalog',
      desc: 'Published and draft audiobooks',
      icon: 'menu-book',
      permission: 'SAFARI_BOOKS_BOOKS',
    },
    {
      id: 'pending',
      title: 'Pending verifications',
      desc: 'Publisher applications awaiting review',
      icon: 'pending-actions',
      permission: 'SAFARI_BOOKS_PENDING',
    },
  ];
  const menuItems = allMenuItems.filter((item) => hasPermission(item.permission));

  const titleByView: Record<ReportView, string> = {
    menu: 'Safari Books',
    overview: 'Platform overview',
    listeners: 'Listeners joined',
    publishers: 'Publishers',
    books: 'Books catalog',
    pending: 'Pending verifications',
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
              Choose a Safari Books report
            </ThemedText>
            {menuItems.length === 0 ? (
              <ThemedText style={styles.meta}>No Safari Books reports assigned to your account.</ThemedText>
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
              { label: 'Listeners joined', value: String(stats.listenersJoined), icon: 'headphones' as const },
              { label: 'Publisher accounts', value: String(stats.publishersJoined), icon: 'person' as const },
              { label: 'Narrators', value: String(stats.narratorsJoined), icon: 'mic' as const },
              {
                label: 'Publishers pending',
                value: String(stats.publishersPending),
                icon: 'pending-actions' as const,
              },
              {
                label: 'Companies verified',
                value: String(stats.companiesVerified),
                icon: 'apartment' as const,
              },
              {
                label: 'Authors verified',
                value: String(stats.authorsVerified),
                icon: 'verified' as const,
              },
              { label: 'Books total', value: String(stats.booksTotal), icon: 'menu-book' as const },
              {
                label: 'Books published',
                value: String(stats.booksPublished),
                icon: 'check-circle' as const,
              },
              { label: 'Featured books', value: String(stats.booksFeatured), icon: 'star' as const },
              { label: 'Library adds', value: String(stats.libraryEntries), icon: 'library-add' as const },
              { label: 'Bookmarks', value: String(stats.bookmarks), icon: 'bookmark' as const },
              { label: 'Likes', value: String(stats.likes), icon: 'favorite' as const },
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
        ) : view === 'listeners' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {listenersTotal}</ThemedText>
            {listeners.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.meta}>{item.email}</ThemedText>
                <ThemedText style={styles.meta}>
                  Joined {formatDate(item.createdAt)} · library {item.libraryCount} · bookmarks{' '}
                  {item.bookmarksCount} · likes {item.likesCount}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'publishers' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {publishersTotal}</ThemedText>
            {publishers.map((item) => (
              <View
                key={`${item.type}-${item.id}`}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.displayName}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.type} · {item.email || '—'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.bookTitle || 'No book title'} · books {item.booksCount} ·{' '}
                  {item.isVerified ? 'verified' : item.isRejected ? 'rejected' : 'pending'}
                </ThemedText>
                <ThemedText style={styles.meta}>{formatDate(item.createdAt)}</ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'books' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {booksTotal}</ThemedText>
            {books.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.authorName} · {item.publisher}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.isPublished ? 'Published' : 'Draft'}
                  {item.featuredBook ? ' · featured' : ''} · library {item.libraryCount} · likes{' '}
                  {item.likesCount}
                </ThemedText>
                <ThemedText style={styles.meta}>{formatDate(item.createdAt)}</ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'pending' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Pending {pending.length}</ThemedText>
            {pending.map((item) => (
              <View
                key={`${item.kind}-${item.id}`}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">
                  {item.kind === 'company' ? item.companyName || 'Company' : item.fullName || 'Author'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.kind} · {item.user?.email || '—'}
                </ThemedText>
                <ThemedText style={styles.meta}>{item.title || 'No book title yet'}</ThemedText>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton, { borderColor: '#c0392b' }]}
                    onPress={() => {
                      setRejectTarget(item);
                      setRejectReason('');
                    }}>
                    <ThemedText style={styles.rejectButtonText}>Reject</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={!!rejectTarget} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <ThemedText type="subtitle">Reject publisher</ThemedText>
            <ThemedText style={styles.meta}>
              {rejectTarget?.kind === 'company'
                ? rejectTarget?.companyName
                : rejectTarget?.fullName || 'Publisher'}
            </ThemedText>
            <TextInput
              style={[styles.reasonInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Rejection reason (min 10 characters)"
              placeholderTextColor={colors.icon}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#c0392b', opacity: rejectSubmitting ? 0.7 : 1 }]}
                disabled={rejectSubmitting}
                onPress={() => {
                  void submitReject();
                }}>
                {rejectSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 100,
    padding: 12,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  error: { color: '#c0392b', marginTop: 20 },
});
