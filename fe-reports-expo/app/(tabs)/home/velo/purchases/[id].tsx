import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchVeloPurchaseDetail } from '@/services/api';
import type { VeloPurchaseDetail } from '@/types/velo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMoney, openDocument } from '../format';

function addressLine(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(', ') || '—';
}

export default function VeloPurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [purchase, setPurchase] = useState<VeloPurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing purchase id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPurchase(await fetchVeloPurchaseDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const receiptUrl = purchase?.payment.receiptUrl
    ? documentUrl(purchase.payment.receiptUrl)
    : null;

  const imageEntries = purchase
    ? (
        [
          ['Picked', purchase.statusImages.picked],
          ['Dropped', purchase.statusImages.dropped],
          ['In transit start', purchase.statusImages.inTransitStart],
          ['In transit end', purchase.statusImages.inTransitEnd],
          ['Out for delivery', purchase.statusImages.outForDelivery],
          ['Delivered', purchase.statusImages.delivered],
        ] as const
      ).filter(([, url]) => !!url)
    : [];

  return (
    <DetailChrome
      title={purchase?.shipmentId || 'Purchase'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {purchase ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Payment</ThemedText>
            <ThemedText type="subtitle">
              {typeof purchase.payment.paymentAmount === 'number'
                ? formatMoney(
                    purchase.payment.paymentAmount,
                    purchase.payment.paymentCurrency || 'USD'
                  )
                : '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.payment.paymentSuccess ? 'Paid' : 'Unpaid'} ·{' '}
              {purchase.shipmentId || purchase.id}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Purchased {formatDate(purchase.shipmentDate)} · Stripe{' '}
              {purchase.payment.stripeId || '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Customer {purchase.payment.customerId || '—'}
            </ThemedText>
            {receiptUrl ? (
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                onPress={() => {
                  void openDocument(receiptUrl);
                }}>
                <ThemedText style={detailStyles.actionButtonText}>View receipt</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={detailStyles.meta}>No receipt URL.</ThemedText>
            )}
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{purchase.shipmentId || purchase.id}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.shipmentStatus} · {purchase.source} · {purchase.shipmentType} ·{' '}
              {purchase.shippingMarket}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Ship {formatDate(purchase.shipmentDate)} · Deliver {formatDate(purchase.deliveryDate)}
            </ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Sender</ThemedText>
            <ThemedText type="defaultSemiBold">{purchase.sender.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {addressLine([
                purchase.sender.addressOne,
                purchase.sender.addressTwo,
                purchase.sender.city,
                purchase.sender.state,
              ])}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.sender.email} · {purchase.sender.mobileNumber}
            </ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Receiver</ThemedText>
            <ThemedText type="defaultSemiBold">{purchase.receiver.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {addressLine([
                purchase.receiver.addressOne,
                purchase.receiver.addressTwo,
                purchase.receiver.city,
                purchase.receiver.state,
                purchase.receiver.zipCode,
              ])}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.receiver.email} · {purchase.receiver.countryCode}{' '}
              {purchase.receiver.mobileNumber}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.receiver.country?.name || 'No country'}
            </ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Package</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.package.length}×{purchase.package.width}×{purchase.package.height} ·{' '}
              {purchase.package.weight} · {purchase.package.pieces} pieces
            </ThemedText>
            <ThemedText>{purchase.package.description || 'No description'}</ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Pickup</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.pickup.pickupTimeFrom || '—'} – {purchase.pickup.pickupTimeTo || '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.pickup.pickupInstructions || 'No instructions'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {purchase.pickup.pickupSpecialInstructions || 'No special instructions'}
            </ThemedText>
          </View>

          {purchase.user ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(`/home/velo/senders/${encodeURIComponent(purchase.user!.id)}`)
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Account user</ThemedText>
                  <ThemedText type="defaultSemiBold">{purchase.user.name}</ThemedText>
                  <ThemedText style={detailStyles.meta}>{purchase.user.email}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : null}

          {purchase.organisation ? (
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Assigned organisation</ThemedText>
              <ThemedText type="defaultSemiBold">
                {purchase.organisation.organisationName || 'Organisation'}
              </ThemedText>
            </View>
          ) : null}

          {purchase.pickUpAgent ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(`/home/velo/agents/${encodeURIComponent(purchase.pickUpAgent!.id)}`)
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Pickup agent</ThemedText>
                  <ThemedText type="defaultSemiBold">{purchase.pickUpAgent.name}</ThemedText>
                  <ThemedText style={detailStyles.meta}>{purchase.pickUpAgent.email}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : null}

          <ThemedText style={detailStyles.sectionTitle}>Status images</ThemedText>
          {imageEntries.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No status images.</ThemedText>
          ) : (
            imageEntries.map(([label, url]) => {
              const safe = documentUrl(url!);
              return (
                <View
                  key={label}
                  style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ThemedText type="defaultSemiBold">{label}</ThemedText>
                  {safe ? (
                    <TouchableOpacity
                      style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                      onPress={() => {
                        void openDocument(safe);
                      }}>
                      <ThemedText style={detailStyles.actionButtonText}>Open image</ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <ThemedText style={detailStyles.meta}>Invalid URL</ThemedText>
                  )}
                </View>
              );
            })
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
