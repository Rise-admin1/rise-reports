import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchSafariBooksPublisherDetail } from '@/services/api';
import type { SafariBooksPublisherDetail, SafariBooksPublisherType } from '@/types/safariBooks';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../../DetailChrome';
import { documentUrl, formatAmount, formatDate, openDocument } from '../../format';

function isPublisherType(value: string | undefined): value is SafariBooksPublisherType {
  return value === 'company' || value === 'author';
}

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

export default function SafariBooksPublisherDetailScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [publisher, setPublisher] = useState<SafariBooksPublisherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !isPublisherType(type)) {
      setError('Missing or invalid publisher');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPublisher(await fetchSafariBooksPublisherDetail(type, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load publisher');
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);

  return (
    <DetailChrome
      title={publisher?.displayName || 'Publisher'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {publisher ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {publisher.coverImage ? (
              <Image
                source={{ uri: publisher.coverImage }}
                style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }}
                resizeMode="cover"
              />
            ) : null}
            <ThemedText type="subtitle">{publisher.displayName}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {publisher.type} ·{' '}
              {publisher.isVerified
                ? 'verified'
                : publisher.isRejected
                  ? 'rejected'
                  : 'pending'}
              {publisher.isRegistrationComplete ? ' · registration complete' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {publisher.address} · {publisher.telephone}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Registered {formatDate(publisher.registrationStartedAt)} · books{' '}
              {publisher.counts.books}
            </ThemedText>
            {publisher.user ? (
              <ThemedText style={detailStyles.meta}>
                {publisher.user.name} · {publisher.user.email}
                {publisher.user.emailVerified ? ' · verified email' : ''}
              </ThemedText>
            ) : null}
            {publisher.isRejected && publisher.reject ? (
              <ThemedText style={detailStyles.meta}>Reject reason: {publisher.reject}</ThemedText>
            ) : null}
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Draft / listing</ThemedText>
            <ThemedText type="defaultSemiBold">{publisher.title || 'No title yet'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {[publisher.language, publisher.categories, publisher.narrator]
                .filter(Boolean)
                .join(' · ') || 'No draft metadata'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              ISBN/DOI/ISRC {publisher.ISBNDOIISRC || '—'} · amount{' '}
              {formatAmount(publisher.amount)}
            </ThemedText>
            <ThemedText>{publisher.synopsis || 'No synopsis'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              Voice {publisher.narrationVoiceName || '—'} ·{' '}
              {publisher.narrationLanguageCode || '—'} · {publisher.narrationGender || '—'} · rate{' '}
              {publisher.narrationSpeakingRate || '—'}
            </ThemedText>
            <LinkButton label="Open PDF" url={publisher.pdfURL} tint={colors.tint} />
            <LinkButton label="Sample audio" url={publisher.audioSampleURL} tint={colors.tint} />
            <LinkButton label="Complete audio" url={publisher.completeAudioUrl} tint={colors.tint} />
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Documents</ThemedText>
            {publisher.type === 'company' ? (
              <>
                <ThemedText style={detailStyles.meta}>
                  Reg {publisher.companyRegNo || '—'} · KRA {publisher.kraPin || '—'}
                </ThemedText>
                <LinkButton
                  label="Company registration PDF"
                  url={publisher.companyRegNoPdfUrl}
                  tint={colors.tint}
                />
                <LinkButton label="KRA PIN PDF" url={publisher.kraPinPdfUrl} tint={colors.tint} />
              </>
            ) : (
              <>
                <ThemedText style={detailStyles.meta}>
                  ID/PP {publisher.idppNo || '—'} · KRA {publisher.kraPin || '—'}
                  {publisher.writersGuildNo ? ` · Guild ${publisher.writersGuildNo}` : ''}
                </ThemedText>
                <LinkButton label="ID/PP PDF" url={publisher.idppPdfUrl} tint={colors.tint} />
                <LinkButton label="KRA PIN PDF" url={publisher.kraPinPdfUrl} tint={colors.tint} />
              </>
            )}
          </View>

          <ThemedText style={detailStyles.sectionTitle}>Books</ThemedText>
          {publisher.books.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No published books linked.</ThemedText>
          ) : (
            publisher.books.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(`/home/safaribooks/books/${encodeURIComponent(book.id)}`)
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">{book.title}</ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {book.authorName} · {book.isPublished ? 'Published' : 'Draft'}
                      {book.featuredBook ? ' · featured' : ''}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      library {book.libraryCount} · likes {book.likesCount} ·{' '}
                      {formatDate(book.createdAt)}
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
