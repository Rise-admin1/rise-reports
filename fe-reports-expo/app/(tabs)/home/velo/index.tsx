import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  approveVeloAgentAppointment,
  declineVeloAgentAppointment,
  fetchVeloAgents,
  fetchVeloAppointmentRequests,
  fetchVeloContactInquiries,
  fetchVeloListings,
  fetchVeloPurchases,
  fetchVeloSenders,
  fetchVeloShipments,
  fetchVeloStats,
} from '@/services/api';
import type {
  VeloAgent,
  VeloAppointmentRequest,
  VeloContactInquiry,
  VeloListing,
  VeloPurchase,
  VeloSender,
  VeloShipment,
  VeloStats,
} from '@/types/velo';
import type { ReportPermission } from '@/types/appAuth';
import { VELO_PERMS } from '@/types/appAuth';
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
  | 'senders'
  | 'agents'
  | 'shipments'
  | 'purchases'
  | 'listings'
  | 'appointments'
  | 'inquiries';

function formatMoney(amount: number, currency = 'USD'): string {
  return `${currency} ${amount.toLocaleString(undefined, {
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

export default function VeloScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const { hasPermission, hasAnyPermission } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const canAccess = hasAnyPermission(VELO_PERMS);

  const [view, setView] = useState<ReportView>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<VeloStats | null>(null);
  const [senders, setSenders] = useState<VeloSender[]>([]);
  const [sendersTotal, setSendersTotal] = useState(0);
  const [agents, setAgents] = useState<VeloAgent[]>([]);
  const [agentsTotal, setAgentsTotal] = useState(0);
  const [shipments, setShipments] = useState<VeloShipment[]>([]);
  const [shipmentsTotal, setShipmentsTotal] = useState(0);
  const [purchases, setPurchases] = useState<VeloPurchase[]>([]);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [listings, setListings] = useState<VeloListing[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [appointments, setAppointments] = useState<VeloAppointmentRequest[]>([]);
  const [inquiries, setInquiries] = useState<VeloContactInquiry[]>([]);
  const [inquiriesTotal, setInquiriesTotal] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadView = useCallback(async (next: ReportView) => {
    if (next === 'menu') return;
    setLoading(true);
    setError(null);
    try {
      if (next === 'overview') {
        const resp = await fetchVeloStats();
        setStats(resp.data);
      } else if (next === 'senders') {
        const resp = await fetchVeloSenders({ page: 1, pageSize: 50 });
        setSenders(resp.senders);
        setSendersTotal(resp.total);
      } else if (next === 'agents') {
        const resp = await fetchVeloAgents({ page: 1, pageSize: 50 });
        setAgents(resp.agents);
        setAgentsTotal(resp.total);
      } else if (next === 'shipments') {
        const resp = await fetchVeloShipments({ page: 1, pageSize: 50 });
        setShipments(resp.shipments);
        setShipmentsTotal(resp.total);
      } else if (next === 'purchases') {
        const resp = await fetchVeloPurchases({ page: 1, pageSize: 50 });
        setPurchases(resp.purchases);
        setPurchasesTotal(resp.total);
      } else if (next === 'listings') {
        const resp = await fetchVeloListings({ page: 1, pageSize: 50 });
        setListings(resp.listings);
        setListingsTotal(resp.total);
      } else if (next === 'appointments') {
        const resp = await fetchVeloAppointmentRequests();
        setAppointments(resp.allAppointmentRequest ?? []);
      } else if (next === 'inquiries') {
        const resp = await fetchVeloContactInquiries({ page: 1, pageSize: 50 });
        setInquiries(resp.inquiries);
        setInquiriesTotal(resp.total);
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

  const onApprove = (agentId: string) => {
    Alert.alert('Approve agent', 'Approve this organisation leader appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          void (async () => {
            setActionId(agentId);
            try {
              await approveVeloAgentAppointment(agentId);
              setAppointments((current) => current.filter((a) => a.id !== agentId));
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

  const onDecline = (agentId: string) => {
    Alert.alert('Decline agent', 'Decline this appointment request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setActionId(agentId);
            try {
              await declineVeloAgentAppointment(agentId);
              setAppointments((current) => current.filter((a) => a.id !== agentId));
            } catch (err) {
              Alert.alert('Failed', err instanceof Error ? err.message : 'Could not decline');
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
      desc: 'Senders, agents, shipments, purchases, drafts',
      icon: 'insights',
      permission: 'VELO_STATS',
    },
    {
      id: 'senders',
      title: 'Senders joined',
      desc: 'User signups and shipment counts',
      icon: 'person',
      permission: 'VELO_SENDERS',
    },
    {
      id: 'agents',
      title: 'Agents & sub-agents',
      desc: 'Agent roster and verification status',
      icon: 'groups',
      permission: 'VELO_AGENTS',
    },
    {
      id: 'shipments',
      title: 'Shipments created',
      desc: 'Active shipments with status and payment',
      icon: 'local-shipping',
      permission: 'VELO_SHIPMENTS',
    },
    {
      id: 'purchases',
      title: 'Paid purchases',
      desc: 'Successful shipment payments',
      icon: 'payments',
      permission: 'VELO_PURCHASES',
    },
    {
      id: 'listings',
      title: 'Marketplace listings',
      desc: 'All agent market listings',
      icon: 'storefront',
      permission: 'VELO_LISTINGS',
    },
    {
      id: 'appointments',
      title: 'Agent appointments',
      desc: 'Organisation leaders awaiting approval',
      icon: 'pending-actions',
      permission: 'VELO_APPOINTMENTS',
    },
    {
      id: 'inquiries',
      title: 'Contact inquiries',
      desc: 'Messages from the contact form',
      icon: 'mail',
      permission: 'VELO_CONTACT_INQUIRIES',
    },
  ];
  const menuItems = allMenuItems.filter((item) => hasPermission(item.permission));

  const titleByView: Record<ReportView, string> = {
    menu: 'Velo',
    overview: 'Platform overview',
    senders: 'Senders joined',
    agents: 'Agents & sub-agents',
    shipments: 'Shipments created',
    purchases: 'Paid purchases',
    listings: 'Marketplace listings',
    appointments: 'Agent appointments',
    inquiries: 'Contact inquiries',
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
              Choose a Velo report
            </ThemedText>
            {menuItems.length === 0 ? (
              <ThemedText style={styles.meta}>No Velo reports assigned to your account.</ThemedText>
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
              { label: 'Senders joined', value: String(stats.sendersJoined), icon: 'person' as const },
              { label: 'Agents joined', value: String(stats.agentsJoined), icon: 'groups' as const },
              {
                label: 'Sub-agents joined',
                value: String(stats.subAgentsJoined),
                icon: 'group-add' as const,
              },
              { label: 'Organisations', value: String(stats.organisations), icon: 'apartment' as const },
              {
                label: 'Shipments created',
                value: String(stats.shipmentsCreated),
                icon: 'local-shipping' as const,
              },
              {
                label: 'Completed shipments',
                value: String(stats.completedShipments),
                icon: 'check-circle' as const,
              },
              { label: 'Paid purchases', value: String(stats.paidPurchases), icon: 'payments' as const },
              {
                label: 'Total purchase volume',
                value: formatMoney(stats.totalPurchaseAmount),
                icon: 'attach-money' as const,
              },
              { label: 'Shipment drafts', value: String(stats.shipmentDrafts), icon: 'drafts' as const },
              {
                label: 'Pending appointments',
                value: String(stats.pendingAgentAppointments),
                icon: 'pending-actions' as const,
              },
              {
                label: 'Payment pending',
                value: String(stats.paymentPendingShipments),
                icon: 'hourglass-empty' as const,
              },
              {
                label: 'Orders in market',
                value: String(stats.ordersInMarket),
                icon: 'storefront' as const,
              },
              {
                label: 'Marketplace listings',
                value: String(stats.listingsCreated ?? 0),
                icon: 'sell' as const,
              },
              {
                label: 'Contact inquiries',
                value: String(stats.contactInquiries),
                icon: 'mail' as const,
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
        ) : view === 'senders' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {sendersTotal}</ThemedText>
            {senders.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.meta}>{item.email}</ThemedText>
                <ThemedText style={styles.meta}>
                  Joined {formatDate(item.createdAt)} · {item.shipmentsCount} shipments ·{' '}
                  {item.registerVerificationStatus}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'agents' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {agentsTotal}</ThemedText>
            {agents.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.email} · {item.role}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.organisationName || 'No org'} · {item.registerVerificationStatus}
                </ThemedText>
                <ThemedText style={styles.meta}>Joined {formatDate(item.createdAt)}</ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'shipments' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {shipmentsTotal}</ThemedText>
            {shipments.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.shipmentId}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.shipmentStatus}
                  {item.paymentSuccess ? ' · paid' : ''}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.senderName || item.userName || 'Sender'} → {item.receiverLocation || '—'}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {typeof item.paymentAmount === 'number'
                    ? formatMoney(item.paymentAmount, item.paymentCurrency || 'USD')
                    : '—'}{' '}
                  · {formatDate(item.shipmentDate)}
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
                <ThemedText type="defaultSemiBold">{item.shipmentId}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.senderName || 'Sender'}
                  {item.senderEmail ? ` · ${item.senderEmail}` : ''}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {typeof item.paymentAmount === 'number'
                    ? formatMoney(item.paymentAmount, item.paymentCurrency || 'USD')
                    : '—'}{' '}
                  · {formatDate(item.purchaseDate)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'listings' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {listingsTotal}</ThemedText>
            {listings.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={styles.meta}>
                  {formatMoney(item.price)} · {item.condition}
                  {item.categoryName ? ` · ${item.categoryName}` : ''}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {item.agentName || 'Agent'}
                  {item.organisationName ? ` · ${item.organisationName}` : ''}
                </ThemedText>
                <ThemedText style={styles.meta}>{formatDate(item.createdAt)}</ThemedText>
              </View>
            ))}
          </View>
        ) : view === 'appointments' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Pending {appointments.length}</ThemedText>
            {appointments.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name || 'Agent'}</ThemedText>
                <ThemedText style={styles.meta}>{item.email || '—'}</ThemedText>
                <ThemedText style={styles.meta}>
                  {item.organisation?.organisationName || 'Organisation'} ·{' '}
                  {formatDate(item.appointmentDate)}
                </ThemedText>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.tint, opacity: actionId === item.id ? 0.6 : 1 }]}
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
                    onPress={() => onDecline(item.id)}>
                    <ThemedText style={styles.rejectButtonText}>Decline</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : view === 'inquiries' ? (
          <View style={styles.list}>
            <ThemedText style={styles.meta}>Total {inquiriesTotal}</ThemedText>
            {inquiries.map((item) => (
              <View
                key={item.id}
                style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{item.name || 'Inquiry'}</ThemedText>
                <ThemedText style={styles.meta}>{item.email || '—'}</ThemedText>
                <ThemedText style={styles.meta}>{item.message || '—'}</ThemedText>
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
  error: { color: '#c0392b', marginTop: 20 },
});
