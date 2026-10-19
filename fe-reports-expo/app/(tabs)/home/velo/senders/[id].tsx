import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchVeloSenderDetail } from '@/services/api';
import type { VeloSenderDetail } from '@/types/velo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate, formatMoney } from '../format';

export default function VeloSenderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [sender, setSender] = useState<VeloSenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing sender id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSender(await fetchVeloSenderDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sender');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);

  return (
    <DetailChrome
      title={sender?.name || 'Sender'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {sender ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{sender.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>{sender.email}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {sender.mobileCode} {sender.mobileNumber}
              {sender.mobileCountry ? ` · ${sender.mobileCountry}` : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {sender.registerVerificationStatus} · Joined {formatDate(sender.createdAt)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Shipments {sender.counts.shipments} · Completed {sender.counts.completedShipments} ·
              Drafts {sender.counts.drafts}
            </ThemedText>
          </View>

          <ThemedText style={detailStyles.sectionTitle}>Addresses</ThemedText>
          {sender.addresses.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No addresses.</ThemedText>
          ) : (
            sender.addresses.map((address) => (
              <View
                key={address.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">
                  {[address.addressOne, address.addressTwo].filter(Boolean).join(', ')}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {address.country?.name || 'No country'}
                  {address.country?.isoCode ? ` (${address.country.isoCode})` : ''}
                </ThemedText>
              </View>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Saved addresses</ThemedText>
          {sender.savedAddresses.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No saved addresses.</ThemedText>
          ) : (
            sender.savedAddresses.map((address) => (
              <View
                key={address.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{address.name}</ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {[address.addressOne, address.addressTwo].filter(Boolean).join(', ')}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                  {address.country?.name ? ` · ${address.country.name}` : ''}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {address.email} · {address.countryCode} {address.mobileNumber}
                </ThemedText>
              </View>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Recent shipments</ThemedText>
          {sender.shipments.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No shipments.</ThemedText>
          ) : (
            sender.shipments.map((shipment) => (
              <TouchableOpacity
                key={shipment.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(`/home/velo/shipments/${encodeURIComponent(shipment.id)}`)
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">
                      {shipment.shipmentId || shipment.id}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {shipment.shipmentStatus}
                      {shipment.paymentSuccess ? ' · paid' : ''}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {[shipment.receiverCity, shipment.receiverState].filter(Boolean).join(', ') ||
                        '—'}{' '}
                      ·{' '}
                      {typeof shipment.paymentAmount === 'number'
                        ? formatMoney(shipment.paymentAmount, shipment.paymentCurrency || 'USD')
                        : '—'}{' '}
                      · {formatDate(shipment.shipmentDate)}
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
