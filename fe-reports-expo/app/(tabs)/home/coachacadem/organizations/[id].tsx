import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchCoachAcademOrganizationDetail } from '@/services/api';
import type { CoachAcademOrganizationDetail } from '@/types/coachAcadem';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, openDocument } from '../format';

export default function CoachAcademOrganizationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [org, setOrg] = useState<CoachAcademOrganizationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setOrg(await fetchCoachAcademOrganizationDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const licenseUrl = org?.orgLicense ? documentUrl(org.orgLicense) : null;

  return (
    <DetailChrome
      title={org?.orgName || 'Organization'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {org ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{org.orgName}</ThemedText>
            <ThemedText style={detailStyles.meta}>{org.orgEmail || 'No email'}</ThemedText>
            {org.orgWebsite ? (
              <ThemedText style={detailStyles.meta}>{org.orgWebsite}</ThemedText>
            ) : null}
            <ThemedText style={detailStyles.meta}>
              Members {org.memberCount}
              {org.orgCapacity != null ? ` / capacity ${org.orgCapacity}` : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>Created {formatDate(org.createdAt)}</ThemedText>
            {org.teamLead ? (
              <ThemedText style={detailStyles.meta}>
                Lead {org.teamLead.name} · {org.teamLead.email}
                {org.teamLead.organizationRole ? ` · ${org.teamLead.organizationRole}` : ''}
              </ThemedText>
            ) : null}
            {licenseUrl ? (
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                onPress={() => {
                  void openDocument(licenseUrl);
                }}>
                <ThemedText style={detailStyles.actionButtonText}>View trade license</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={detailStyles.meta}>No trade license on file.</ThemedText>
            )}
          </View>

          <ThemedText style={detailStyles.sectionTitle}>Members</ThemedText>
          {org.members.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No members.</ThemedText>
          ) : (
            org.members.map((member) => (
              <View
                key={member.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">
                  {member.name}
                  {member.isTeamLead ? ' (Team lead)' : ''}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>{member.email}</ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {member.organizationRole || 'No role'}
                </ThemedText>
              </View>
            ))
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
