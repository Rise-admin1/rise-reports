import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchSafariBooksListenerDetail } from '@/services/api';
import type { SafariBooksListenerDetail } from '@/types/safariBooks';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate } from '../format';

export default function SafariBooksListenerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [listener, setListener] = useState<SafariBooksListenerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing listener id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setListener(await fetchSafariBooksListenerDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listener');
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
      title={listener?.name || 'Listener'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {listener ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{listener.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>{listener.email}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {listener.emailVerified ? 'Email verified' : 'Email not verified'} ·{' '}
              {listener.role}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Joined {formatDate(listener.createdAt)}
              {listener.firstTimeLogin ? ' · first-time login pending' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Library {listener.counts.library} · Bookmarks {listener.counts.bookmarks} · Likes{' '}
              {listener.counts.likes}
            </ThemedText>
          </View>

          <ThemedText style={detailStyles.sectionTitle}>Library</ThemedText>
          {listener.library.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No library entries.</ThemedText>
          ) : (
            listener.library.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                disabled={!entry.book?.id}
                onPress={() =>
                  entry.book?.id
                    ? router.push(`/home/safaribooks/books/${encodeURIComponent(entry.book.id)}`)
                    : undefined
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">
                      {entry.book?.title || 'Book'}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {entry.book?.authorName || '—'} · {entry.status} · pos {entry.timestamp}s
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      Updated {formatDate(entry.updatedAt)}
                    </ThemedText>
                  </View>
                  {entry.book?.id ? (
                    <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Bookmarks</ThemedText>
          {listener.bookmarks.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No bookmarks.</ThemedText>
          ) : (
            listener.bookmarks.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                disabled={!entry.book?.id}
                onPress={() =>
                  entry.book?.id
                    ? router.push(`/home/safaribooks/books/${encodeURIComponent(entry.book.id)}`)
                    : undefined
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">
                      {entry.book?.title || 'Book'}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {entry.book?.authorName || '—'} · {formatDate(entry.createdAt)}
                    </ThemedText>
                  </View>
                  {entry.book?.id ? (
                    <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Likes</ThemedText>
          {listener.likes.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No likes.</ThemedText>
          ) : (
            listener.likes.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                disabled={!entry.book?.id}
                onPress={() =>
                  entry.book?.id
                    ? router.push(`/home/safaribooks/books/${encodeURIComponent(entry.book.id)}`)
                    : undefined
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">
                      {entry.book?.title || 'Book'}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {entry.book?.authorName || '—'} · {formatDate(entry.createdAt)}
                    </ThemedText>
                  </View>
                  {entry.book?.id ? (
                    <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
