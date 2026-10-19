import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchVeloShipmentDetail } from '@/services/api';
import type { VeloShipmentDetail } from '@/types/velo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMoney, openDocument } from '../format';

function addressLine(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(', ') || '—';
}

export default function VeloShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [shipment, setShipment] = useState<VeloShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing shipment id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setShipment(await fetchVeloShipmentDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shipment');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const receiptUrl = shipment?.payment.receiptUrl
    ? documentUrl(shipment.payment.receiptUrl)
    : null;

  const imageEntries = shipment
    ? (
        [
          ['Picked', shipment.statusImages.picked],
          ['Dropped', shipment.statusImages.dropped],
          ['In transit start', shipment.statusImages.inTransitStart],
          ['In transit end', shipment.statusImages.inTransitEnd],
          ['Out for delivery', shipment.statusImages.outForDelivery],
          ['Delivered', shipment.statusImages.delivered],
        ] as const
      ).filter(([, url]) => !!url)
    : [];

  return (
    <DetailChrome
      title={shipment?.shipmentId || 'Shipment'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {shipment ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{shipment.shipmentId || shipment.id}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.shipmentStatus} · {shipment.source} · {shipment.shipmentType} ·{' '}
              {shipment.shippingMarket}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Ship {formatDate(shipment.shipmentDate)} · Deliver {formatDate(shipment.deliveryDate)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Image status {shipment.imageStatus}
              {shipment.customPrice ? ' · custom price' : ''}
              {shipment.openMarketPrice
                ? ` · open market ${formatMoney(shipment.openMarketPrice)}`
                : ''}
            </ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Payment</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.payment.paymentSuccess ? 'Paid' : 'Unpaid'} ·{' '}
              {typeof shipment.payment.paymentAmount === 'number'
                ? formatMoney(
                    shipment.payment.paymentAmount,
                    shipment.payment.paymentCurrency || 'USD'
                  )
                : '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Stripe {shipment.payment.stripeId || '—'} · Customer{' '}
              {shipment.payment.customerId || '—'}
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
            <ThemedText style={detailStyles.sectionTitle}>Sender</ThemedText>
            <ThemedText type="defaultSemiBold">{shipment.sender.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {addressLine([
                shipment.sender.addressOne,
                shipment.sender.addressTwo,
                shipment.sender.city,
                shipment.sender.state,
              ])}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.sender.email} · {shipment.sender.mobileNumber}
            </ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Receiver</ThemedText>
            <ThemedText type="defaultSemiBold">{shipment.receiver.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {addressLine([
                shipment.receiver.addressOne,
                shipment.receiver.addressTwo,
                shipment.receiver.city,
                shipment.receiver.state,
                shipment.receiver.zipCode,
              ])}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.receiver.email} · {shipment.receiver.countryCode}{' '}
              {shipment.receiver.mobileNumber}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.receiver.country?.name || 'No country'}
              {shipment.receiver.residentAddress ? ' · resident address' : ''}
            </ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Package</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.package.length}×{shipment.package.width}×{shipment.package.height} ·{' '}
              {shipment.package.weight} · {shipment.package.pieces} pieces
            </ThemedText>
            <ThemedText>{shipment.package.description || 'No description'}</ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Pickup</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.pickup.pickupTimeFrom || '—'} – {shipment.pickup.pickupTimeTo || '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.pickup.pickupInstructions || 'No instructions'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {shipment.pickup.pickupSpecialInstructions || 'No special instructions'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Verbal {shipment.pickup.verbalNotificationService ? 'yes' : 'no'} · Adult sig{' '}
              {shipment.pickup.adultSignatureService ? 'yes' : 'no'} · Direct sig{' '}
              {shipment.pickup.directSignatureService ? 'yes' : 'no'}
            </ThemedText>
          </View>

          {shipment.user ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(`/home/velo/senders/${encodeURIComponent(shipment.user!.id)}`)
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Account user</ThemedText>
                  <ThemedText type="defaultSemiBold">{shipment.user.name}</ThemedText>
                  <ThemedText style={detailStyles.meta}>
                    {shipment.user.email} · {shipment.user.mobileNumber}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : null}

          {shipment.organisation ? (
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Assigned organisation</ThemedText>
              <ThemedText type="defaultSemiBold">
                {shipment.organisation.organisationName || 'Organisation'}
              </ThemedText>
            </View>
          ) : null}

          {shipment.pickUpAgent ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(`/home/velo/agents/${encodeURIComponent(shipment.pickUpAgent!.id)}`)
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Pickup agent</ThemedText>
                  <ThemedText type="defaultSemiBold">{shipment.pickUpAgent.name}</ThemedText>
                  <ThemedText style={detailStyles.meta}>{shipment.pickUpAgent.email}</ThemedText>
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
