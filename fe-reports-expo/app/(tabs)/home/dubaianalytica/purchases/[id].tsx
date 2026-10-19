import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchDubaiAnalyticaPurchaseDetail } from '@/services/api';
import type { DubaiAnalyticaPurchaseDetail } from '@/types/dubaiAnalytica';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatCsvField, formatDate, formatMinor, openDocument } from '../format';

export default function DubaiAnalyticaPurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [purchase, setPurchase] = useState<DubaiAnalyticaPurchaseDetail | null>(null);
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
      setPurchase(await fetchDubaiAnalyticaPurchaseDetail(id));
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
  const receiptUrl = purchase?.receiptUrl ? documentUrl(purchase.receiptUrl) : null;

  return (
    <DetailChrome
      title={purchase?.stripeName || purchase?.userEmail || 'Purchase'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {purchase ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">
              {formatMinor(purchase.amountPaid, purchase.amountCurrency)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Qty {purchase.responseQuantity}
              {purchase.paidStatus ? ' · paid' : ' · unpaid'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>{purchase.userEmail}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              Intent {purchase.stripePaymentIntentId || '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>{formatDate(purchase.createdAt)}</ThemedText>
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
            <ThemedText style={detailStyles.sectionTitle}>Targeting</ThemedText>
            <ThemedText style={detailStyles.meta}>
              Regions: {formatCsvField(purchase.selectedRegions)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Industries: {formatCsvField(purchase.selectedIndustries)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Education: {formatCsvField(purchase.selectedEducationLevels)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Positions: {formatCsvField(purchase.selectedPositions)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Experience: {formatCsvField(purchase.selectedExperience)}
            </ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Billing</ThemedText>
            <ThemedText type="defaultSemiBold">{purchase.stripeName || '—'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {[purchase.stripeAddressLineOne, purchase.stripeAddressLineTwo]
                .filter(Boolean)
                .join(', ') || '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {[purchase.stripePostalCode, purchase.stripeState, purchase.stripeCountry]
                .filter(Boolean)
                .join(', ') || '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Card {purchase.stripeCardBrand || '—'}
              {purchase.stripeCardLastFourDigit ? ` ·••• ${purchase.stripeCardLastFourDigit}` : ''}
            </ThemedText>
          </View>

          {purchase.user ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(`/home/dubaianalytica/users/${encodeURIComponent(purchase.user!.id)}`)
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Linked user</ThemedText>
                  <ThemedText type="defaultSemiBold">{purchase.user.name || 'User'}</ThemedText>
                  <ThemedText style={detailStyles.meta}>{purchase.user.email}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : (
            <ThemedText style={detailStyles.meta}>No linked user account.</ThemedText>
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
