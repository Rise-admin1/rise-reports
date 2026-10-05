import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  fetchCoachAcademAbuseReports,
  fetchCoachAcademOrganizations,
  fetchCoachAcademParents,
  fetchCoachAcademPendingSubjects,
  fetchCoachAcademPurchases,
  fetchCoachAcademStats,
  fetchCoachAcademTeachers,
  rejectCoachAcademSubject,
  verifyCoachAcademSubject,
} from '@/services/api';
import type {
  CoachAcademAbuseReport,
  CoachAcademOrganization,
  CoachAcademParent,
  CoachAcademPendingSubject,
  CoachAcademPurchase,
  CoachAcademStats,
  CoachAcademTeacher,
} from '@/types/coachAcadem';
import type { ReportPermission } from '@/types/appAuth';
import { COACH_ACADEM_PERMS } from '@/types/appAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
  | 'teachers'
  | 'parents'
  | 'organizations'
  | 'purchases'
  | 'pending'
  | 'reports';

function formatMinor(amount: number, currency = 'AED'): string {
  const major = amount / 100;
  return `${currency} ${major.toLocaleString(undefined, {
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

export default function CoachAcademScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const { hasPermission, hasAnyPermission } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const canAccess = hasAnyPermission(COACH_ACADEM_PERMS);

  const [view, setView] = useState<ReportView>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<CoachAcademStats | null>(null);
  const [teachers, setTeachers] = useState<CoachAcademTeacher[]>([]);
  const [teachersTotal, setTeachersTotal] = useState(0);
  const [parents, setParents] = useState<CoachAcademParent[]>([]);
  const [parentsTotal, setParentsTotal] = useState(0);
  const [organizations, setOrganizations] = useState<CoachAcademOrganization[]>([]);
  const [orgsTotal, setOrgsTotal] = useState(0);
  const [purchases, setPurchases] = useState<CoachAcademPurchase[]>([]);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [pending, setPending] = useState<CoachAcademPendingSubject[]>([]);
  const [reports, setReports] = useState<CoachAcademAbuseReport[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CoachAcademPendingSubject | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const loadView = useCallback(async (next: ReportView) => {
    if (next === 'menu') return;
    setLoading(true);
    setError(null);
    try {
      if (next === 'overview') {
        const resp = await fetchCoachAcademStats();
        setStats(resp.data);
      } else if (next === 'teachers') {
        const resp = await fetchCoachAcademTeachers({ page: 1, pageSize: 50 });
        setTeachers(resp.teachers);
        setTeachersTotal(resp.total);
      } else if (next === 'parents') {
        const resp = await fetchCoachAcademParents({ page: 1, pageSize: 50 });
        setParents(resp.parents);
        setParentsTotal(resp.total);
      } else if (next === 'organizations') {
        const resp = await fetchCoachAcademOrganizations({ page: 1, pageSize: 50 });
        setOrganizations(resp.organizations);
        setOrgsTotal(resp.total);
      } else if (next === 'purchases') {
        const resp = await fetchCoachAcademPurchases({ page: 1, pageSize: 50 });
        setPurchases(resp.purchases);
        setPurchasesTotal(resp.total);
      } else if (next === 'pending') {
        setPending(await fetchCoachAcademPendingSubjects());
      } else if (next === 'reports') {
        setReports(await fetchCoachAcademAbuseReports());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Coach Academ data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    if (view !== 'menu') {
      void loadView(view);
    }
  }, [view, loadView, canAccess]);

  const { refreshing, onRefresh } = useRefreshControl(
    useCallback(async () => {
      if (view !== 'menu') await loadView(view);
    }, [view, loadView])
  );

  if (!canAccess) {
    return <Redirect href="/home" />;
  }

  const openView = (next: ReportView) => setView(next);

  const handleVerify = (subject: CoachAcademPendingSubject) => {
    Alert.alert(
      'Verify subject',
      `Approve "${String(subject.subjectName || subject.id)}" for the catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: () => {
            void (async () => {
              setActionId(subject.id);
              setError(null);
              try {
                await verifyCoachAcademSubject(subject.id);
                setPending((current) => current.filter((item) => item.id !== subject.id));
              } catch (err) {
                Alert.alert(
                  'Verify failed',
                  err instanceof Error ? err.message : 'Could not verify subject'
                );
              } finally {
                setActionId(null);
              }
            })();
          },
        },
      ]
    );
  };

  const openReject = (subject: CoachAcademPendingSubject) => {
    setRejectTarget(subject);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      Alert.alert('Reason required', 'Rejection reason must be at least 10 characters.');
      return;
    }
    setRejectSubmitting(true);
    setError(null);
    try {
      await rejectCoachAcademSubject(rejectTarget.id, reason);
      setPending((current) => current.filter((item) => item.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      Alert.alert('Reject failed', err instanceof Error ? err.message : 'Could not reject subject');
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
      desc: 'Students, teachers, parents, subjects, purchases',
      icon: 'insights',
      permission: 'COACH_ACADEM_STATS',
    },
    {
      id: 'teachers',
      title: 'Teachers joined',
      desc: 'Teacher signups and subject verification mix',
      icon: 'person',
      permission: 'COACH_ACADEM_TEACHERS',
    },
    {
      id: 'parents',
      title: 'Parents joined',
      desc: 'Parent signups and child-link status',
      icon: 'family-restroom',
      permission: 'COACH_ACADEM_PARENTS',
    },
    {
      id: 'organizations',
      title: 'Organizations',
      desc: 'Org roster, capacity, and team leads',
      icon: 'apartment',
      permission: 'COACH_ACADEM_ORGANIZATIONS',
    },
    {
      id: 'purchases',
      title: 'Purchases',
      desc: 'Confirmed subject purchases and spend',
      icon: 'payments',
      permission: 'COACH_ACADEM_PURCHASES',
    },
    {
      id: 'pending',
      title: 'Subjects awaiting review',
      desc: 'Subjects waiting for admin approval',
      icon: 'pending-actions',
      permission: 'COACH_ACADEM_PENDING_SUBJECTS',
    },
    {
      id: 'reports',
      title: 'Abuse / moderation reports',
      desc: 'Subject reports submitted by users',
      icon: 'report',
      permission: 'COACH_ACADEM_REPORTS',
    },
  ];
  const menuItems = allMenuItems.filter((item) => hasPermission(item.permission));

  const titleByView: Record<ReportView, string> = {
    menu: 'Coach Academ',
    overview: 'Platform overview',
    teachers: 'Teachers joined',
    parents: 'Parents joined',
    organizations: 'Organizations',
    purchases: 'Purchases',
    pending: 'Subjects awaiting review',
    reports: 'Abuse reports',
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
              Choose a Coach Academ report
            </ThemedText>
            {menuItems.length === 0 ? (
              <ThemedText style={styles.meta}>No Coach Academ reports assigned to your account.</ThemedText>
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
              { label: 'Students joined', value: String(stats.studentsJoined), icon: 'school' as const },
              { label: 'Teachers joined', value: String(stats.teachersJoined), icon: 'person' as const },
              { label: 'Parents joined', value: String(stats.parentsJoined), icon: 'family-restroom' as const },
              {
                label: 'Subjects created (est.)',
                value: String(stats.subjectsCreatedEstimate),
                icon: 'menu-book' as const,
              },
              {
                label: 'Subjects verified / live',
                value: String(stats.subjectsVerified),
                icon: 'verified' as const,
              },
              {
                label: 'Awaiting admin review',
                value: String(stats.subjectsAwaitingReview),
                icon: 'pending-actions' as const,
              },
              {
                label: 'Organizations',
                value: String(stats.organizations),
                icon: 'apartment' as const,
              },
              {
                label: 'Confirmed purchases',
                value: String(stats.confirmedPurchases),
                icon: 'payments' as const,
              },
              {
                label: 'Total spend',
                value: formatMinor(stats.totalSpendMinor),
                icon: 'attach-money' as const,
              },
              {
                label: 'Abuse reports',
                value: String(stats.abuseReports),
                icon: 'report' as const,
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
        ) : view === 'teachers' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {teachersTotal}</ThemedText>
            {teachers.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.meta}>{item.email}</ThemedText>
                <ThemedText style={styles.meta}>
                  Joined {formatDate(item.createdAt)}
                  {item.organizationName ? ` · ${item.organizationName}` : ''}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  Subjects: {item.verifiedSubjects} verified · {item.pendingSubjects} pending ·{' '}
                  {item.rejectedSubjects} rejected
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'parents' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {parentsTotal}</ThemedText>
            {parents.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.meta}>{item.email}</ThemedText>
                <ThemedText style={styles.meta}>
                  Joined {formatDate(item.createdAt)} · links {item.acceptedLinks} accepted /{' '}
                  {item.pendingLinks} pending
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'organizations' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {orgsTotal}</ThemedText>
            {organizations.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.orgName}</ThemedText>
                <ThemedText style={styles.meta}>{item.orgEmail || 'No email'}</ThemedText>
                <ThemedText style={styles.meta}>
                  Members {item.memberCount}
                  {item.orgCapacity != null ? ` / capacity ${item.orgCapacity}` : ''}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  Lead {item.teamLeadName || '—'}
                  {item.teamLeadEmail ? ` · ${item.teamLeadEmail}` : ''}
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
                <ThemedText type="defaultSemiBold">{item.subjectName || 'Subject'}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.studentName || 'Student'}
                  {item.studentEmail ? ` · ${item.studentEmail}` : ''}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {typeof item.purchaseAmount === 'number'
                    ? formatMinor(item.purchaseAmount, item.purchaseCurrency || 'AED')
                    : '—'}{' '}
                  · {formatDate(item.purchaseDate)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'pending' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>{pending.length} awaiting review</ThemedText>
            {pending.length === 0 ? (
              <ThemedText style={styles.meta}>No subjects waiting for review.</ThemedText>
            ) : (
              pending.map((subject) => {
                const busy = actionId === subject.id;
                return (
                  <View
                    key={subject.id}
                    style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ThemedText type="defaultSemiBold">
                      {String(subject.subjectName || subject.id)}
                    </ThemedText>
                    <ThemedText style={styles.meta}>
                      {[
                        subject.subjectBoard ? String(subject.subjectBoard) : null,
                        subject.subjectGrade != null ? `Grade ${subject.subjectGrade}` : null,
                        subject.createdAt ? formatDate(String(subject.createdAt)) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </ThemedText>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.tint, opacity: busy ? 0.6 : 1 }]}
                        disabled={busy || rejectSubmitting}
                        onPress={() => handleVerify(subject)}>
                        {busy ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <ThemedText style={styles.actionButtonText}>Verify</ThemedText>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.rejectButton,
                          { borderColor: colors.border, opacity: busy ? 0.6 : 1 },
                        ]}
                        disabled={busy || rejectSubmitting}
                        onPress={() => openReject(subject)}>
                        <ThemedText style={styles.rejectButtonText}>Reject</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : view === 'reports' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>{reports.length} reports</ThemedText>
            {reports.length === 0 ? (
              <ThemedText style={styles.meta}>No abuse reports.</ThemedText>
            ) : (
              reports.map((item) => (
                <View
                  key={item.id}
                  style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ThemedText type="defaultSemiBold">{String(item.reason || item.id)}</ThemedText>
                  <ThemedText style={styles.meta}>{formatDate(item.createdAt)}</ThemedText>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={!!rejectTarget} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <ThemedText type="subtitle">Reject subject</ThemedText>
            <ThemedText style={styles.meta}>
              {rejectTarget ? String(rejectTarget.subjectName || rejectTarget.id) : ''}
            </ThemedText>
            <ThemedText style={[styles.meta, { marginTop: 8 }]}>
              Provide feedback for the teacher (min 10 characters).
            </ThemedText>
            <TextInput
              style={[
                styles.reasonInput,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
              ]}
              placeholder="Rejection reason"
              placeholderTextColor={colors.icon}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
              editable={!rejectSubmitting}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                disabled={rejectSubmitting}
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
