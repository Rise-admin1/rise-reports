import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchVeloListingDetail } from '@/services/api';
import type { VeloListingDetail } from '@/types/velo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate, formatMoney } from '../format';

export default function VeloListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [listing, setListing] = useState<VeloListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing listing id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setListing(await fetchVeloListingDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
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
      title={listing?.title || 'Listing'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {listing ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {listing.imageUrl ? (
              <Image
                source={{ uri: listing.imageUrl }}
                style={{ width: '100%', height: 180, borderRadius: 8, marginBottom: 8 }}
                resizeMode="cover"
              />
            ) : null}
            <ThemedText type="subtitle">{listing.title}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {formatMoney(listing.price)} · {listing.condition}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Created {formatDate(listing.createdAt)} · Updated {formatDate(listing.updatedAt)}
            </ThemedText>
            <ThemedText>{listing.description || 'No description'}</ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Category</ThemedText>
            <ThemedText type="defaultSemiBold">
              {listing.category?.name || 'Uncategorized'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {listing.category?.description || 'No category description'}
            </ThemedText>
          </View>

          {listing.agent ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(`/home/velo/agents/${encodeURIComponent(listing.agent!.id)}`)
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Agent</ThemedText>
                  <ThemedText type="defaultSemiBold">{listing.agent.name}</ThemedText>
                  <ThemedText style={detailStyles.meta}>
                    {listing.agent.email} · {listing.agent.role} ·{' '}
                    {listing.agent.registerVerificationStatus}
                  </ThemedText>
                  <ThemedText style={detailStyles.meta}>
                    {listing.agent.organisation?.organisationName || 'No organisation'}
                    {listing.agent.organisation
                      ? listing.agent.organisation.superAdminApproval
                        ? ' · approved'
                        : ' · not approved'
                      : ''}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : (
            <ThemedText style={detailStyles.meta}>No agent linked.</ThemedText>
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
