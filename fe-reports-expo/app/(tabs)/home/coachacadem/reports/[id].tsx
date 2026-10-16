import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchCoachAcademAbuseReportDetail } from '@/services/api';
import type { CoachAcademAbuseReport } from '@/types/coachAcadem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate } from '../format';

export default function CoachAcademReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [report, setReport] = useState<CoachAcademAbuseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchCoachAcademAbuseReportDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const description = String(report?.reportDescription || report?.reason || '—');

  return (
    <DetailChrome
      title="Abuse report"
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {report ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.meta}>
              Status {String(report.reportStatus || 'PENDING')} · {formatDate(report.createdAt)}
            </ThemedText>
            <ThemedText style={detailStyles.sectionTitle}>Description</ThemedText>
            <ThemedText>{description}</ThemedText>
            {report.reportResolution ? (
              <>
                <ThemedText style={detailStyles.sectionTitle}>Resolution</ThemedText>
                <ThemedText>{String(report.reportResolution)}</ThemedText>
              </>
            ) : null}
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Reporter</ThemedText>
            <ThemedText type="defaultSemiBold">{report.reporterName || 'Unknown'}</ThemedText>
            <ThemedText style={detailStyles.meta}>{report.reporterEmail || 'No email'}</ThemedText>
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Subject</ThemedText>
            <ThemedText type="defaultSemiBold">{report.subjectName || 'Unknown subject'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              Teacher {report.teacherName || '—'}
              {report.teacherEmail ? ` · ${report.teacherEmail}` : ''}
            </ThemedText>
            {report.subjectId ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}
                onPress={() =>
                  router.push(
                    `/home/coachacadem/subjects/${encodeURIComponent(String(report.subjectId))}`
                  )
                }>
                <ThemedText style={{ color: colors.tint, fontWeight: '700' }}>View subject</ThemedText>
                <MaterialIcons name="chevron-right" size={18} color={colors.tint} />
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      ) : null}
    </DetailChrome>
  );
}
