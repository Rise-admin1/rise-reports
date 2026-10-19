import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchDubaiAnalyticaSurveyDetail } from '@/services/api';
import type { DubaiAnalyticaSurveyDetail } from '@/types/dubaiAnalytica';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate } from '../format';

export default function DubaiAnalyticaSurveyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [survey, setSurvey] = useState<DubaiAnalyticaSurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing survey id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSurvey(await fetchDubaiAnalyticaSurveyDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load survey');
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
      title={survey?.surveyTitle || 'Survey'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {survey ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{survey.surveyTitle}</ThemedText>
            {survey.surveyDescription ? (
              <ThemedText style={detailStyles.meta}>{survey.surveyDescription}</ThemedText>
            ) : null}
            <ThemedText style={detailStyles.meta}>
              {survey.surveyStatus} · layout {survey.surveyLayout}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Views {survey.surveyViews} · completed {survey.surveyCompleted} · tracked{' '}
              {survey.surveyResponses} · responses {survey.counts.responses}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Questions {survey.formQuestionsCount} · forms {survey.surveyFormsCount} · selected
              items {survey.selectedItemsCount}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Target {survey.targetCountry || '—'}
              {survey.maxResponses != null ? ` · max ${survey.maxResponses}` : ''}
              {survey.oneResponsePerPerson ? ' · one per person' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Closes {formatDate(survey.closesAt)} · created {formatDate(survey.createdAt)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Brand {survey.brandColor || '—'}
              {survey.hidePoweredBy ? ' · powered-by hidden' : ''}
              {survey.brandLogoUrl ? ' · logo set' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Invite campaigns {survey.counts.inviteCampaigns} · AI generations{' '}
              {survey.counts.aiGenerations}
            </ThemedText>
          </View>

          {survey.owner ? (
            <TouchableOpacity
              style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push(`/home/dubaianalytica/users/${encodeURIComponent(survey.owner!.id)}`)
              }
              activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText style={detailStyles.sectionTitle}>Owner</ThemedText>
                  <ThemedText type="defaultSemiBold">{survey.owner.name || 'User'}</ThemedText>
                  <ThemedText style={detailStyles.meta}>{survey.owner.email}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ) : (
            <ThemedText style={detailStyles.meta}>No owner linked.</ThemedText>
          )}

          <ThemedText style={detailStyles.sectionTitle}>Recent responses</ThemedText>
          {survey.responses.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No responses.</ThemedText>
          ) : (
            survey.responses.map((response) => (
              <View
                key={response.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">
                  {response.userName || response.userEmail || 'Respondent'}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>{response.userEmail}</ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {response.isComplete ? 'Complete' : 'Incomplete'} · time{' '}
                  {response.userTimeSpent || '—'}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>{formatDate(response.createdAt)}</ThemedText>
              </View>
            ))
          )}

          <ThemedText style={detailStyles.sectionTitle}>Invite campaigns</ThemedText>
          {survey.inviteCampaigns.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No invite campaigns.</ThemedText>
          ) : (
            survey.inviteCampaigns.map((campaign) => (
              <View
                key={campaign.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{campaign.subject || 'Campaign'}</ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {campaign.status} · recipients {campaign.recipientsCount}
                  {campaign.reminderAfterHours != null
                    ? ` · remind ${campaign.reminderAfterHours}h`
                    : ''}
                </ThemedText>
                <ThemedText style={detailStyles.meta}>{formatDate(campaign.createdAt)}</ThemedText>
              </View>
            ))
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
