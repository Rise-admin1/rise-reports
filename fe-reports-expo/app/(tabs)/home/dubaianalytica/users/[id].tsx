import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchDubaiAnalyticaUserDetail } from '@/services/api';
import type { DubaiAnalyticaUserDetail } from '@/types/dubaiAnalytica';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMinor, formatUnix, openDocument } from '../format';

export default function DubaiAnalyticaUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<DubaiAnalyticaUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing user id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setUser(await fetchDubaiAnalyticaUserDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const invoiceUrl = user?.proMember?.invoiceUrl
    ? documentUrl(user.proMember.invoiceUrl)
    : null;

  return (
    <DetailChrome
      title={user?.name || 'User'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {user ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{user.name || 'User'}</ThemedText>
            <ThemedText style={detailStyles.meta}>{user.email}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {user.emailVerified ? 'Email verified' : 'Email not verified'}
              {user.isGoogleUser ? ' · Google' : ''}
              {user.isGuest ? ' · guest' : ''}
              {user.isAProMember ? ' · Pro' : ''}
              {user.isAdmin ? ' · admin' : ''}
              {user.isSuperAdmin ? ' · super admin' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Marketing {user.receiveMarketingEmails ? 'opt-in' : 'opt-out'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>Joined {formatDate(user.createdAt)}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              Surveys {user.counts.surveys} · purchases {user.counts.purchases} · refunds{' '}
              {user.counts.refundRequests} · AI gens {user.counts.aiSurveyGenerations} · chat{' '}
              {user.counts.assistantChatUsages}
            </ThemedText>
          </View>

          {user.proMember ? (
            <>
              <TouchableOpacity
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(
                    `/home/dubaianalytica/subscriptions/${encodeURIComponent(user.proMember!.id)}`
                  )
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText style={detailStyles.sectionTitle}>Pro membership</ThemedText>
                    <ThemedText type="defaultSemiBold">{user.proMember.email}</ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {formatMinor(user.proMember.amountMinor)} ·{' '}
                      {user.proMember.isActive ? 'active' : 'inactive'}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {formatUnix(user.proMember.periodStart)} →{' '}
                      {formatUnix(user.proMember.periodEnd)}
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                </View>
              </TouchableOpacity>
              {invoiceUrl ? (
                <TouchableOpacity
                  style={[detailStyles.actionButton, { backgroundColor: colors.tint }]}
                  onPress={() => {
                    void openDocument(invoiceUrl);
                  }}>
                  <ThemedText style={detailStyles.actionButtonText}>Open Pro invoice</ThemedText>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <ThemedText style={detailStyles.meta}>No Pro membership.</ThemedText>
          )}

          {user.zoomConnection ? (
            <View
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Zoom connection</ThemedText>
              <ThemedText style={detailStyles.meta}>
                {user.zoomConnection.zoomEmail || user.zoomConnection.zoomUserId}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                Token expires {formatDate(user.zoomConnection.tokenExpiresAt)}
              </ThemedText>
            </View>
          ) : null}

          <ThemedText style={detailStyles.sectionTitle}>Surveys</ThemedText>
          {user.surveys.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No surveys.</ThemedText>
          ) : (
            user.surveys.map((survey) => (
              <TouchableOpacity
                key={survey.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(`/home/dubaianalytica/surveys/${encodeURIComponent(survey.id)}`)
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">{survey.surveyTitle}</ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {survey.surveyStatus} · views {survey.surveyViews} · responses{' '}
                      {survey.responsesCount}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>{formatDate(survey.createdAt)}</ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                </View>
              </TouchableOpacity>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Market purchases</ThemedText>
          {user.purchases.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No purchases.</ThemedText>
          ) : (
            user.purchases.map((purchase) => (
              <TouchableOpacity
                key={purchase.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(
                    `/home/dubaianalytica/purchases/${encodeURIComponent(purchase.id)}`
                  )
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">
                      {formatMinor(purchase.amountPaid, purchase.amountCurrency)}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      Qty {purchase.responseQuantity}
                      {purchase.paidStatus ? ' · paid' : ' · unpaid'}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>{formatDate(purchase.createdAt)}</ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                </View>
              </TouchableOpacity>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Refund requests</ThemedText>
          {user.refundRequests.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No refund requests.</ThemedText>
          ) : (
            user.refundRequests.map((refund) => (
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
