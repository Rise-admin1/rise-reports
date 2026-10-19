import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchVeloContactInquiryDetail } from '@/services/api';
import type { VeloContactInquiryDetail } from '@/types/velo';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate } from '../format';

export default function VeloInquiryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [inquiry, setInquiry] = useState<VeloContactInquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing inquiry id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setInquiry(await fetchVeloContactInquiryDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiry');
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
      title={inquiry?.name || 'Inquiry'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {inquiry ? (
        <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText type="subtitle">{inquiry.name}</ThemedText>
          <ThemedText style={detailStyles.meta}>{inquiry.email}</ThemedText>
          <ThemedText style={detailStyles.meta}>
            {inquiry.phoneNumber || 'No phone'}
            {inquiry.country ? ` · ${inquiry.country}` : ''}
          </ThemedText>
          <ThemedText style={detailStyles.meta}>Received {formatDate(inquiry.createdAt)}</ThemedText>
          <ThemedText style={detailStyles.sectionTitle}>Message</ThemedText>
          <ThemedText>{inquiry.message}</ThemedText>
        </View>
      ) : null}
    </DetailChrome>
  );
}
