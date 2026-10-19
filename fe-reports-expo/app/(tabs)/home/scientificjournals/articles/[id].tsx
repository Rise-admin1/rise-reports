import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchScientificJournalsArticleDetail } from '@/services/api';
import type { ScientificJournalsArticleDetail } from '@/types/scientificJournals';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import {
  documentUrl,
  formatDate,
  formatMinor,
  jsonAsLines,
  openDocument,
} from '../format';

function LinkButton({
  label,
  url,
  tint,
}: {
  label: string;
  url?: string | null;
  tint: string;
}) {
  const safe = url ? documentUrl(url) : null;
  if (!safe) {
    return <ThemedText style={detailStyles.meta}>No {label.toLowerCase()}.</ThemedText>;
  }
  return (
    <TouchableOpacity
      style={[detailStyles.actionButton, { backgroundColor: tint, marginTop: 4 }]}
      onPress={() => {
        void openDocument(safe);
      }}>
      <ThemedText style={detailStyles.actionButtonText}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

export default function ScientificJournalsArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [article, setArticle] = useState<ScientificJournalsArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing article id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setArticle(await fetchScientificJournalsArticleDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const authors = article ? jsonAsLines(article.articleAuthors) : [];
  const files = article ? jsonAsLines(article.filesURL) : [];
  const rejectionFiles = article ? jsonAsLines(article.rejectionFilesURL) : [];

  return (
    <DetailChrome
      title={article?.articleTitle || 'Article'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {article ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{article.articleTitle}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {article.articleStatus} · Vol {article.articleVolume} Iss {article.articleIssue}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {article.isPublished ? 'Published' : 'Not published'}
              {article.isAccepted ? ' · accepted' : ''}
              {article.isReview ? ' · in review' : ''}
              {article.specialReview ? ' · special review' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Received {formatDate(article.articleReceivedDate)} · accepted{' '}
              {formatDate(article.articleAcceptedDate)} · published{' '}
              {formatDate(article.articlePublishedDate)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>Keywords: {article.articleKeywords || '—'}</ThemedText>
            <ThemedText>{article.articleAbstract || 'No abstract'}</ThemedText>
            {article.rejectionText ? (
              <ThemedText style={detailStyles.meta}>Rejection: {article.rejectionText}</ThemedText>
            ) : null}
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Payment</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {article.payment.paymentStatus ? 'Paid' : 'Unpaid'} · {article.payment.accessModel}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {typeof article.payment.paymentAmount === 'number'
                ? formatMinor(
                    article.payment.paymentAmount,
                    article.payment.paymentCurrency || 'AED'
                  )
                : '—'}{' '}
              · {formatDate(article.payment.paymentDate)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Intent {article.payment.paymentIntent || '—'}
            </ThemedText>
            <LinkButton label="Open invoice" url={article.payment.invoiceUrl} tint={colors.tint} />
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Journal</ThemedText>
            <ThemedText type="defaultSemiBold">
              {article.journal?.journalTitle || 'Journal'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {article.journal?.journalAbbreviation || '—'}
              {article.journal?.journalISSN ? ` · ISSN ${article.journal.journalISSN}` : ''}
              {article.journal?.journalDOI ? ` · DOI ${article.journal.journalDOI}` : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {article.journal?.journalLanguage || '—'}
              {article.journal?.journalStartYear != null
                ? ` · started ${article.journal.journalStartMonth}/${article.journal.journalStartYear}`
                : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {article.journal?.journalDescription || 'No journal description'}
            </ThemedText>
          </View>

          {article.submitter ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(
                  `/home/scientificjournals/users/${encodeURIComponent(article.submitter!.id)}`
                )
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Submitter</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {article.submitter.name || 'User'}
                  </ThemedText>
                  <ThemedText style={detailStyles.meta}>
                    {article.submitter.email} · {article.submitter.affiliation || '—'}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : null}

          {article.reviewerAcceptedBy ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(
                  `/home/scientificjournals/reviewers/${encodeURIComponent(article.reviewerAcceptedBy!.id)}`
                )
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Accepted by reviewer</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {article.reviewerAcceptedBy.name || 'Reviewer'}
                  </ThemedText>
                  <ThemedText style={detailStyles.meta}>{article.reviewerAcceptedBy.email}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : null}

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Authors</ThemedText>
            {authors.length === 0 ? (
              <ThemedText style={detailStyles.meta}>No authors listed.</ThemedText>
            ) : (
              authors.map((line) => (
                <ThemedText key={line} style={detailStyles.meta}>
                  {line}
                </ThemedText>
              ))
            )}
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Files</ThemedText>
            <ThemedText style={detailStyles.meta}>
              Public PDF {article.publicPdfName || '—'} · Published PDF{' '}
              {article.publishedPdfName || '—'} · AWS {article.awsId || '—'}
            </ThemedText>
            {files.length === 0 ? (
              <ThemedText style={detailStyles.meta}>No file URLs.</ThemedText>
            ) : (
              files.map((line) => {
                const safe = documentUrl(line);
                return safe ? (
                  <TouchableOpacity
                    key={line}
                    style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 4 }]}
                    onPress={() => {
                      void openDocument(safe);
                    }}>
                    <ThemedText style={detailStyles.actionButtonText}>Open file</ThemedText>
                  </TouchableOpacity>
                ) : (
                  <ThemedText key={line} style={detailStyles.meta}>
                    {line}
                  </ThemedText>
                );
              })
            )}
            {rejectionFiles.length > 0 ? (
              <>
                <ThemedText style={detailStyles.sectionTitle}>Rejection files</ThemedText>
                {rejectionFiles.map((line) => {
                  const safe = documentUrl(line);
                  return safe ? (
                    <TouchableOpacity
                      key={line}
                      style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 4 }]}
                      onPress={() => {
                        void openDocument(safe);
                      }}>
                      <ThemedText style={detailStyles.actionButtonText}>Open rejection file</ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <ThemedText key={line} style={detailStyles.meta}>
                      {line}
                    </ThemedText>
                  );
                })}
              </>
            ) : null}
          </View>
        </>
      ) : null}
    </DetailChrome>
  );
}
