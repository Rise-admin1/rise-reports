import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchDubaiAnalyticaSubscriptionDetail } from '@/services/api';
import type { DubaiAnalyticaSubscriptionDetail } from '@/types/dubaiAnalytica';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMinor, formatUnix, openDocument } from '../format';

export default function DubaiAnalyticaSubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [subscription, setSubscription] = useState<DubaiAnalyticaSubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing subscription id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSubscription(await fetchDubaiAnalyticaSubscriptionDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const invoiceUrl = subscription?.invoiceUrl ? documentUrl(subscription.invoiceUrl) : null;
  const invoicePdf = subscription?.invoicePdf ? documentUrl(subscription.invoicePdf) : null;

  return (
    <DetailChrome
      title={subscription?.user?.name || subscription?.email || 'Subscription'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {subscription ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{subscription.email}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {formatMinor(subscription.amountMinor)} ·{' '}
              {subscription.isActive ? 'active' : 'inactive'}
              {subscription.isSubscribed ? ' · subscribed' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {formatUnix(subscription.periodStart)} → {formatUnix(subscription.periodEnd)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Invoice {subscription.invoiceId} · Customer {subscription.customerId}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Created {formatDate(subscription.createdAt)}
            </ThemedText>
            {invoiceUrl ? (
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                onPress={() => {
                  void openDocument(invoiceUrl);
                }}>
                <ThemedText style={detailStyles.actionButtonText}>Open invoice URL</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={detailStyles.meta}>No invoice URL.</ThemedText>
            )}
            {invoicePdf ? (
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 4 }]}
                onPress={() => {
                  void openDocument(invoicePdf);
                }}>
                <ThemedText style={detailStyles.actionButtonText}>Open invoice PDF</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={detailStyles.meta}>No invoice PDF.</ThemedText>
            )}
          </View>

          {subscription.user ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(
                  `/home/dubaianalytica/users/${encodeURIComponent(subscription.user!.id)}`
                )
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Linked user</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {subscription.user.name || 'User'}
                  </ThemedText>
                  <ThemedText style={detailStyles.meta}>{subscription.user.email}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : (
            <ThemedText style={detailStyles.meta}>No linked user account.</ThemedText>
          )}

          <ThemedText style={detailStyles.sectionTitle}>Refund requests</ThemedText>
          {subscription.refundRequests.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No refund requests.</ThemedText>
          ) : (
            subscription.refundRequests.map((refund) => (
              <View
                key={refund.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">
                  {formatMinor(refund.refundAmount, refund.refundCurrency)}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {refund.refundStatus} · invoice {refund.invoiceId}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {refund.refundReason || 'No reason'} · {formatDate(refund.requestedAt)}
                </ThemedText>
              </View>
            ))
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
