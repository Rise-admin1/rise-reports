import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchCoachAcademParentDetail } from '@/services/api';
import type { CoachAcademParentDetail } from '@/types/coachAcadem';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate } from '../format';

export default function CoachAcademParentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [parent, setParent] = useState<CoachAcademParentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setParent(await fetchCoachAcademParentDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parent');
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
      title={parent?.name || 'Parent'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {parent ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {parent.profileImage ? (
              <Image
                source={{ uri: parent.profileImage }}
                style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 8 }}
              />
            ) : null}
            <ThemedText type="subtitle">{parent.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>{parent.email}</ThemedText>
            <ThemedText style={detailStyles.meta}>Joined {formatDate(parent.createdAt)}</ThemedText>
            <ThemedText style={detailStyles.meta}>{parent.links.length} child link(s)</ThemedText>
          </View>

          <ThemedText style={detailStyles.sectionTitle}>Linked children</ThemedText>
          {parent.links.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No child links.</ThemedText>
          ) : (
            parent.links.map((link) => (
              <View
                key={link.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{link.student.name || 'Student'}</ThemedText>
                <ThemedText style={detailStyles.meta}>{link.student.email || 'No email'}</ThemedText>
                <ThemedText style={detailStyles.meta}>Status {link.status}</ThemedText>
                <ThemedText style={detailStyles.meta}>
                  Linked {formatDate(link.createdAt)}
                  {link.respondedAt ? ` · Responded ${formatDate(link.respondedAt)}` : ''}
                </ThemedText>
              </View>
            ))
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
