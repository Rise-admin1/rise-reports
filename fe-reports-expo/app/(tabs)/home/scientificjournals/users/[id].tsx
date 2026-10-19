import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchScientificJournalsUserDetail } from '@/services/api';
import type { ScientificJournalsUserDetail } from '@/types/scientificJournals';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate, formatMinor, formatUnix } from '../format';

export default function ScientificJournalsUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<ScientificJournalsUserDetail | null>(null);
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
      setUser(await fetchScientificJournalsUserDetail(id));
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
            <ThemedText style={detailStyles.meta}>{user.affiliation || 'No affiliation'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {user.emailVerified ? 'Email verified' : 'Email not verified'}
              {user.confirmed ? ' · confirmed' : ''}
              {user.marketingCommunications ? ' · marketing opt-in' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>Joined {formatDate(user.createdAt)}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              Articles {user.counts.articles} · Subscriptions {user.counts.subscriptions} · Full
              issues {user.counts.fullIssuePurchases}
            </ThemedText>
          </View>

          <ThemedText style={detailStyles.sectionTitle}>Articles</ThemedText>
          {user.articles.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No articles.</ThemedText>
          ) : (
            user.articles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(
                    `/home/scientificjournals/articles/${encodeURIComponent(article.id)}`
                  )
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">{article.articleTitle}</ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {article.journal?.journalAbbreviation ||
                        article.journal?.journalTitle ||
                        'Journal'}{' '}
                      · {article.articleStatus}
                      {article.paymentStatus ? ' · paid' : ''}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      Vol {article.articleVolume} Iss {article.articleIssue} ·{' '}
                      {formatDate(article.createdAt)}
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                </View>
              </TouchableOpacity>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Subscriptions</ThemedText>
          {user.subscriptions.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No subscriptions.</ThemedText>
          ) : (
            user.subscriptions.map((subscription) => (
              <TouchableOpacity
                key={subscription.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(
                    `/home/scientificjournals/subscriptions/${encodeURIComponent(subscription.id)}`
                  )
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">
                      {subscription.subscriptionEmail}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {formatMinor(subscription.amountMinor)} ·{' '}
                      {subscription.isSubscribed ? 'subscribed' : 'not subscribed'}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {formatUnix(subscription.periodStart)} → {formatUnix(subscription.periodEnd)}
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                </View>
              </TouchableOpacity>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Full-issue purchases</ThemedText>
          {user.fullIssuePurchases.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No full-issue purchases.</ThemedText>
          ) : (
            user.fullIssuePurchases.map((purchase) => (
              <TouchableOpacity
                key={purchase.paymentIntent}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(
                    `/home/scientificjournals/full-issues/${encodeURIComponent(purchase.paymentIntent)}`
                  )
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">
                      {purchase.journalAbbreviation || purchase.journalTitle || 'Issue'}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      Vol {purchase.volume ?? '—'} Iss {purchase.issue ?? '—'}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {typeof purchase.amountMinor === 'number'
                        ? formatMinor(purchase.amountMinor, purchase.currency || 'AED')
                        : '—'}
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
