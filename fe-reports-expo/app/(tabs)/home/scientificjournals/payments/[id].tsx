import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchScientificJournalsPaymentDetail } from '@/services/api';
import type { ScientificJournalsPaymentDetail } from '@/types/scientificJournals';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMinor, openDocument } from '../format';

export default function ScientificJournalsPaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [payment, setPayment] = useState<ScientificJournalsPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing payment id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPayment(await fetchScientificJournalsPaymentDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const invoiceUrl = payment?.payment.invoiceUrl
    ? documentUrl(payment.payment.invoiceUrl)
    : null;

  return (
    <DetailChrome
      title={payment?.articleTitle || 'Payment'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {payment ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Payment</ThemedText>
            <ThemedText type="subtitle">
              {typeof payment.payment.paymentAmount === 'number'
                ? formatMinor(
                    payment.payment.paymentAmount,
                    payment.payment.paymentCurrency || 'AED'
                  )
                : '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {payment.payment.paymentStatus ? 'Paid' : 'Unpaid'} · {payment.payment.accessModel}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {formatDate(payment.payment.paymentDate)} · Intent{' '}
              {payment.payment.paymentIntent || '—'}
            </ThemedText>
            {invoiceUrl ? (
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                onPress={() => {
                  void openDocument(invoiceUrl);
                }}>
                <ThemedText style={detailStyles.actionButtonText}>View invoice</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={detailStyles.meta}>No invoice URL.</ThemedText>
            )}
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{payment.articleTitle}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {payment.articleStatus} · Vol {payment.articleVolume} Iss {payment.articleIssue}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {payment.journal?.journalTitle || 'Journal'}
            </ThemedText>
            <TouchableOpacity
              style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
              onPress={() =>
                router.push(`/home/scientificjournals/articles/${encodeURIComponent(payment.id)}`)
              }>
              <ThemedText style={detailStyles.actionButtonText}>Open full article</ThemedText>
            </TouchableOpacity>
          </View>

          {payment.submitter ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(
                  `/home/scientificjournals/users/${encodeURIComponent(payment.submitter!.id)}`
                )
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Payer / submitter</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {payment.submitter.name || 'User'}
                  </ThemedText>
                  <ThemedText style={detailStyles.meta}>{payment.submitter.email}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}
    </DetailChrome>
  );
}
