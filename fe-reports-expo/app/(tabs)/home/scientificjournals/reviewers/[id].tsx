import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  approveScientificJournalsReviewer,
  fetchScientificJournalsReviewerDetail,
  rejectScientificJournalsReviewer,
} from '@/services/api';
import type { ScientificJournalsReviewerDetail } from '@/types/scientificJournals';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, openDocument } from '../format';

export default function ScientificJournalsReviewerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [reviewer, setReviewer] = useState<ScientificJournalsReviewerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing reviewer id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setReviewer(await fetchScientificJournalsReviewerDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviewer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const cvUrl = reviewer?.cvUrl ? documentUrl(reviewer.cvUrl) : null;

  const onApprove = () => {
    if (!id) return;
    Alert.alert('Approve reviewer', 'Approve this reviewer account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          void (async () => {
            setActionBusy(true);
            try {
              await approveScientificJournalsReviewer(id);
              router.back();
            } catch (err) {
              Alert.alert(
                'Approve failed',
                err instanceof Error ? err.message : 'Unable to approve'
              );
            } finally {
              setActionBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const onReject = () => {
    if (!id) return;
    Alert.alert('Reject reviewer', 'Reject this reviewer account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setActionBusy(true);
            try {
              await rejectScientificJournalsReviewer(id);
              router.back();
            } catch (err) {
              Alert.alert(
                'Reject failed',
                err instanceof Error ? err.message : 'Unable to reject'
              );
            } finally {
              setActionBusy(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <DetailChrome
      title={reviewer?.name || 'Reviewer'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {reviewer ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{reviewer.name || 'Reviewer'}</ThemedText>
            <ThemedText style={detailStyles.meta}>{reviewer.email}</ThemedText>
            <ThemedText style={detailStyles.meta}>{reviewer.affiliation || 'No affiliation'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {reviewer.reviewerApproved ? 'Approved' : 'Pending'} ·{' '}
              {reviewer.emailVerified ? 'email verified' : 'email not verified'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Joined {formatDate(reviewer.createdAt)} · accepted{' '}
              {reviewer.counts.acceptedArticles}
            </ThemedText>
            {cvUrl ? (
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                onPress={() => {
                  void openDocument(cvUrl);
                }}>
                <ThemedText style={detailStyles.actionButtonText}>Open CV</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={detailStyles.meta}>No CV URL.</ThemedText>
            )}
            {!reviewer.reviewerApproved ? (
              <View style={detailStyles.actionRow}>
                <TouchableOpacity
                  style={[
                    detailStyles.actionButton,
                    { backgroundColor: colors.tint, opacity: actionBusy ? 0.6 : 1 },
                  ]}
                  disabled={actionBusy}
                  onPress={onApprove}>
                  {actionBusy ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={detailStyles.actionButtonText}>Approve</ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[detailStyles.actionButton, detailStyles.rejectButton, { borderColor: '#c0392b' }]}
                  disabled={actionBusy}
                  onPress={onReject}>
                  <ThemedText style={detailStyles.rejectButtonText}>Reject</ThemedText>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <ThemedText style={detailStyles.sectionTitle}>Accepted articles</ThemedText>
          {reviewer.acceptedArticles.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No accepted articles.</ThemedText>
          ) : (
            reviewer.acceptedArticles.map((article) => (
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
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {article.submitter?.name || article.submitter?.email || 'Submitter'}
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
