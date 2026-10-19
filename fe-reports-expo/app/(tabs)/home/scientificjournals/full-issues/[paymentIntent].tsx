import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchScientificJournalsFullIssuePurchaseDetail } from '@/services/api';
import type { ScientificJournalsFullIssuePurchaseDetail } from '@/types/scientificJournals';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatMinor, openDocument } from '../format';

export default function ScientificJournalsFullIssuePurchaseDetailScreen() {
  const { paymentIntent } = useLocalSearchParams<{ paymentIntent: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [purchase, setPurchase] = useState<ScientificJournalsFullIssuePurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!paymentIntent) {
      setError('Missing payment intent');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPurchase(await fetchScientificJournalsFullIssuePurchaseDetail(paymentIntent));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load full-issue purchase');
    } finally {
      setLoading(false);
    }
  }, [paymentIntent]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const invoiceUrl = purchase?.invoiceUrl ? documentUrl(purchase.invoiceUrl) : null;
  const issueDoc = purchase?.fullIssue?.issueDoccumentURL
    ? documentUrl(purchase.fullIssue.issueDoccumentURL)
    : null;
  const issueImage = purchase?.fullIssue?.issueImageURL
    ? documentUrl(purchase.fullIssue.issueImageURL)
    : null;

  return (
    <DetailChrome
      title={
        purchase?.fullIssue?.journal?.journalAbbreviation ||
        purchase?.fullIssue?.journal?.journalTitle ||
        'Full issue'
      }
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {purchase ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Purchase</ThemedText>
            <ThemedText type="subtitle">
              {typeof purchase.amountMinor === 'number'
                ? formatMinor(purchase.amountMinor, purchase.currency || 'AED')
                : '—'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>Intent {purchase.paymentIntent}</ThemedText>
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

          {purchase.fullIssue ? (
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {issueImage ? (
                <Image
                  source={{ uri: issueImage }}
                  style={{ width: '100%', height: 180, borderRadius: 8, marginBottom: 8 }}
                  resizeMode="cover"
                />
              ) : null}
              <ThemedText type="subtitle">
                {purchase.fullIssue.journal?.journalTitle || 'Issue'}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                {purchase.fullIssue.journal?.journalAbbreviation || '—'} · Vol{' '}
                {purchase.fullIssue.issueVolume} Iss {purchase.fullIssue.issueNumber}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                Price {purchase.fullIssue.issuePrice} · count {purchase.fullIssue.issueCount} ·
                lookup {purchase.fullIssue.stripe_lookupId}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                {purchase.fullIssue.journal?.journalDescription || 'No journal description'}
              </ThemedText>
              {issueDoc ? (
                <TouchableOpacity
                  style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                  onPress={() => {
                    void openDocument(issueDoc);
                  }}>
                  <ThemedText style={detailStyles.actionButtonText}>Open issue document</ThemedText>
                </TouchableOpacity>
              ) : (
                <ThemedText style={detailStyles.meta}>No issue document.</ThemedText>
              )}
            </View>
          ) : (
            <ThemedText style={detailStyles.meta}>No full-issue record linked.</ThemedText>
          )}

          {purchase.user ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(
                  `/home/scientificjournals/users/${encodeURIComponent(purchase.user!.id)}`
                )
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Buyer</ThemedText>
                  <ThemedText type="defaultSemiBold">{purchase.user.name || 'User'}</ThemedText>
                  <ThemedText style={detailStyles.meta}>
                    {purchase.user.email} · {purchase.user.affiliation || '—'}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : (
            <ThemedText style={detailStyles.meta}>No linked buyer.</ThemedText>
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
