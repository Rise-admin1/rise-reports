import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchCoachAcademTeacherDetail } from '@/services/api';
import type { CoachAcademTeacherDetail } from '@/types/coachAcadem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { formatDate } from '../format';

export default function CoachAcademTeacherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [teacher, setTeacher] = useState<CoachAcademTeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setTeacher(await fetchCoachAcademTeacherDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teacher');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);

  const verifiedCount = teacher?.subjects.filter((s) => s.status === 'verified').length ?? 0;
  const pendingCount = teacher?.subjects.filter((s) => s.status === 'pending').length ?? 0;
  const rejectedCount = teacher?.subjects.filter((s) => s.status === 'rejected').length ?? 0;

  return (
    <DetailChrome
      title={teacher?.name || 'Teacher'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {teacher ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {teacher.profileImage ? (
              <Image
                source={{ uri: teacher.profileImage }}
                style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 8 }}
              />
            ) : null}
            <ThemedText type="subtitle">{teacher.name}</ThemedText>
            <ThemedText style={detailStyles.meta}>{teacher.email}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {teacher.verified ? 'Email verified' : 'Email not verified'} · Joined{' '}
              {formatDate(teacher.createdAt)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Last seen {formatDate(teacher.lastSeenAt)}
            </ThemedText>
            <ThemedText>{teacher.userDescription || 'No description provided'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              Zoom account {teacher.teacherProfile.zoomAccountCreated ? 'created' : 'not created'}
              {' · '}
              invite {teacher.teacherProfile.zoomUserAcceptedInvite ? 'accepted' : 'pending'}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {teacher.teacherProfile.organization?.orgName || 'Independent'}
              {teacher.teacherProfile.organizationRole
                ? ` · ${teacher.teacherProfile.organizationRole}`
                : ''}
              {teacher.teacherProfile.isTeamLead ? ' · Team lead' : ''}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Subjects: {verifiedCount} verified · {pendingCount} pending · {rejectedCount} rejected
            </ThemedText>
          </View>

          <ThemedText style={detailStyles.sectionTitle}>Subjects</ThemedText>
          {teacher.subjects.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No subjects created.</ThemedText>
          ) : (
            teacher.subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() =>
                  router.push(`/home/coachacadem/subjects/${encodeURIComponent(subject.id)}`)
                }
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="defaultSemiBold">{subject.subjectName}</ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {subject.status}
                      {subject.subjectBoard ? ` · ${subject.subjectBoard}` : ''}
                      {subject.subjectGrade != null ? ` · Grade ${subject.subjectGrade}` : ''}
                      {subject.courseType ? ` · ${subject.courseType}` : ''}
                    </ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      Created {formatDate(subject.createdAt)}
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
