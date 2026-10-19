import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchVeloAgentDetail } from '@/services/api';
import type { VeloAgentDetail, VeloOrganisationDetail } from '@/types/velo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMoney, openDocument } from '../format';

function OrganisationCard({
  title,
  org,
  colors,
}: {
  title: string;
  org: VeloOrganisationDetail;
  colors: { card: string; border: string };
}) {
  return (
    <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={detailStyles.sectionTitle}>{title}</ThemedText>
      <ThemedText type="defaultSemiBold">{org.organisationName || 'Organisation'}</ThemedText>
      <ThemedText style={detailStyles.meta}>{org.organisationAddress || 'No address'}</ThemedText>
      <ThemedText style={detailStyles.meta}>
        {org.modeOfWork} · {org.superAdminApproval ? 'Approved' : 'Not approved'} ·{' '}
        {org.organisationEmployeesCount} seats
      </ThemedText>
      <ThemedText style={detailStyles.meta}>
        Doc {formatMoney(org.documentPricePerPiece)}/pc · Pkg {formatMoney(org.packagePricePerKg)}
        /kg · {formatMoney(org.packagePricePerPiece)}/pc · {org.deliveryTimeline} days
      </ThemedText>
      {org.organisationWebsiteUrl ? (
        <ThemedText style={detailStyles.meta}>{org.organisationWebsiteUrl}</ThemedText>
      ) : null}
    </View>
  );
}

export default function VeloAgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [agent, setAgent] = useState<VeloAgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing agent id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAgent(await fetchVeloAgentDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const verificationUrl = agent?.verificationDocumentUrl
    ? documentUrl(agent.verificationDocumentUrl)
    : null;

  return (
    <DetailChrome
      title={agent?.name || 'Agent'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {agent ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{agent.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {agent.email} · {agent.role}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {agent.mobileCode} {agent.mobileNumber}
              {agent.mobileCountry ? ` · ${agent.mobileCountry}` : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {agent.registerVerificationStatus}
              {agent.isOrganisationLeader ? ' · Org leader' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Appointment {formatDate(agent.appointmentDate)} · Joined {formatDate(agent.createdAt)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Countries {agent.counts.countries} · Categories {agent.counts.categories} · Listings{' '}
              {agent.counts.listings}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Picked {agent.pickedShipmentsCount} · Delivered {agent.deliveredShipmentsCount}
            </ThemedText>
            {verificationUrl ? (
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                onPress={() => {
                  void openDocument(verificationUrl);
                }}>
                <ThemedText style={detailStyles.actionButtonText}>View verification document</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={detailStyles.meta}>No verification document.</ThemedText>
            )}
          </View>

          {agent.organisation ? (
            <OrganisationCard title="Organisation" org={agent.organisation} colors={colors} />
          ) : (
            <ThemedText style={detailStyles.meta}>No organisation linked.</ThemedText>
          )}

          {agent.leadsOrganisation &&
          agent.leadsOrganisation.id !== agent.organisation?.id ? (
            <OrganisationCard
              title="Leads organisation"
              org={agent.leadsOrganisation}
              colors={colors}
            />
          ) : null}

          <ThemedText style={detailStyles.sectionTitle}>Countries</ThemedText>
          {agent.countries.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No countries assigned.</ThemedText>
          ) : (
            agent.countries.map((row) => (
              <View
                key={row.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">
                  {row.country.name}
                  {row.country.isoCode ? ` (${row.country.isoCode})` : ''}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {row.roleInCountry || 'No role'} · Assigned {formatDate(row.assignedAt)}
                  {row.country.region ? ` · ${row.country.region}` : ''}
                </ThemedText>
              </View>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Categories</ThemedText>
          {agent.categories.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No categories assigned.</ThemedText>
          ) : (
            agent.categories.map((row) => (
              <View
                key={row.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{row.category.name}</ThemedText>
                <ThemedText style={detailStyles.meta}>
                  Assigned {formatDate(row.assignedAt)}
                </ThemedText>
              </View>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Listings</ThemedText>
          {agent.listings.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No listings.</ThemedText>
          ) : (
            agent.listings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(`/home/velo/listings/${encodeURIComponent(listing.id)}`)
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">{listing.title}</ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {formatMoney(listing.price)} · {listing.condition}
                      {listing.categoryName ? ` · ${listing.categoryName}` : ''}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      Created {formatDate(listing.createdAt)}
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
