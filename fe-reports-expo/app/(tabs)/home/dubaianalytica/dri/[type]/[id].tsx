import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchDubaiAnalyticaDriPaymentDetail } from '@/services/api';
import type {
  DubaiAnalyticaDriPaymentDetail,
  DubaiAnalyticaDriType,
} from '@/types/dubaiAnalytica';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../../DetailChrome';
import { formatDate } from '../../format';

function asDriType(value?: string): DubaiAnalyticaDriType | null {
  if (value === 'interim' || value === 'full') return value;
  return null;
}

export default function DubaiAnalyticaDriPaymentDetailScreen() {
  const { type: typeParam, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const type = asDriType(typeParam);

  const [payment, setPayment] = useState<DubaiAnalyticaDriPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !type) {
      setError('Missing DRI payment id or type');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPayment(await fetchDubaiAnalyticaDriPaymentDetail(type, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DRI payment');
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const scores = payment?.driScores;

  return (
    <DetailChrome
      title={
        payment
          ? payment.type === 'full'
            ? 'Full DRI report'
            : 'Interim DRI summary'
          : 'DRI payment'
      }
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {payment ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">
              {payment.type === 'full' ? 'Full report' : 'Interim summary'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>{payment.emailId || '—'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {payment.paidStatus ? 'Paid' : 'Unpaid'} · Stripe {payment.stripeId || '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>{formatDate(payment.createdAt)}</ThemedText>
          </View>

          {payment.response ? (
            <View
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Respondent</ThemedText>
              <ThemedText type="defaultSemiBold">
                {payment.response.userName || payment.response.userEmail || 'Respondent'}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>{payment.response.userEmail}</ThemedText>
              <ThemedText style={detailStyles.meta}>
                {payment.response.isComplete ? 'Complete' : 'Incomplete'} · time{' '}
                {payment.response.userTimeSpent || '—'}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                {formatDate(payment.response.createdAt)}
              </ThemedText>
              {payment.response.survey ? (
                <TouchableOpacity
                  style={[
                    detailStyles.actionButton,
                    { backgroundColor: colors.tint, marginTop: 8, alignSelf: 'flex-start' },
                  ]}
                  onPress={() =>
                    router.push(
                      `/home/dubaianalytica/surveys/${encodeURIComponent(payment.response!.survey!.id)}`
                    )
                  }>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ThemedText style={detailStyles.actionButtonText}>
                      {payment.response.survey.surveyTitle}
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <ThemedText style={detailStyles.meta}>No linked response.</ThemedText>
          )}

          <ThemedText style={detailStyles.sectionTitle}>DRI scores</ThemedText>
          {scores ? (
            <View
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.meta}>
                Band {scores.bandPositionLabel || '—'}
                {scores.fullBandPositionLabel
                  ? ` · full band ${scores.fullBandPositionLabel}`
                  : ''}
                {scores.fullScorePercent != null ? ` · full ${scores.fullScorePercent}%` : ''}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                Interim cats:{' '}
                {[
                  scores.cat1,
                  scores.cat2,
                  scores.cat3,
                  scores.cat4,
                  scores.cat5,
                  scores.cat6,
                  scores.cat7,
                  scores.cat8,
                  scores.cat9,
                  scores.cat10,
                ]
                  .map((v) => (v == null ? '—' : String(v)))
                  .join(' · ')}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                Full cats:{' '}
                {[
                  scores.fullCat1,
                  scores.fullCat2,
                  scores.fullCat3,
                  scores.fullCat4,
                  scores.fullCat5,
                  scores.fullCat6,
                  scores.fullCat7,
                  scores.fullCat8,
                  scores.fullCat9,
                  scores.fullCat10,
                ]
                  .map((v) => (v == null ? '—' : String(v)))
                  .join(' · ')}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={detailStyles.meta}>No DRI scores available.</ThemedText>
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
