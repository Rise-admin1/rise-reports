import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchSafariBooksBookDetail } from '@/services/api';
import type { SafariBooksBookDetail } from '@/types/safariBooks';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatAmount, formatDate, openDocument } from '../format';

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

export default function SafariBooksBookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [book, setBook] = useState<SafariBooksBookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing book id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setBook(await fetchSafariBooksBookDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book');
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
      title={book?.title || 'Book'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {book ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {book.coverImage ? (
              <Image
                source={{ uri: book.coverImage }}
                style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 8 }}
                resizeMode="cover"
              />
            ) : null}
            <ThemedText type="subtitle">{book.title}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {book.authorName} · narrated by {book.narratorName}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {book.publisher} · {book.categories} · {book.language}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {book.isPublished ? 'Published' : 'Draft'}
              {book.featuredBook ? ' · featured' : ''} · rating {book.rating} · amount{' '}
              {formatAmount(book.amount)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Duration {book.durationInHours}h {book.durationInMinutes}m · release{' '}
              {formatDate(book.releaseDate)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Created {formatDate(book.createdAt)} · published {formatDate(book.publishedAt)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Library {book.counts.library} · likes {book.counts.likes} · bookmarks{' '}
              {book.counts.bookmarks}
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={{ marginTop: 4 }}>
              Description
            </ThemedText>
            <ThemedText>{book.description || 'No description'}</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ marginTop: 4 }}>
              Summary
            </ThemedText>
            <ThemedText>{book.summary || 'No summary'}</ThemedText>
            <LinkButton label="Sample audio" url={book.sampleAudioURL} tint={colors.tint} />
            <LinkButton label="Complete audio" url={book.completeAudioUrl} tint={colors.tint} />
          </View>

          {book.company ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(
                  `/home/safaribooks/publishers/company/${encodeURIComponent(book.company!.id)}`
                )
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Company</ThemedText>
                  <ThemedText type="defaultSemiBold">{book.company.companyName}</ThemedText>
                  <ThemedText style={detailStyles.meta}>
                    {book.company.isVerified ? 'Verified' : 'Not verified'}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : null}

          {book.author ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(
                  `/home/safaribooks/publishers/author/${encodeURIComponent(book.author!.id)}`
                )
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Author</ThemedText>
                  <ThemedText type="defaultSemiBold">{book.author.fullName}</ThemedText>
                  <ThemedText style={detailStyles.meta}>
                    {book.author.isVerified ? 'Verified' : 'Not verified'}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : null}

          {book.user ? (
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Linked user</ThemedText>
              <ThemedText type="defaultSemiBold">{book.user.name}</ThemedText>
              <ThemedText style={detailStyles.meta}>{book.user.email}</ThemedText>
            </View>
          ) : null}
        </>
      ) : null}
    </DetailChrome>
  );
}
