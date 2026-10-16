import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  fetchCoachAcademSubjectDetail,
  rejectCoachAcademSubject,
  verifyCoachAcademSubject,
} from '@/services/api';
import type { CoachAcademSubjectDetail } from '@/types/coachAcadem';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMinor, openDocument, stringList } from '../format';

export default function CoachAcademSubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [subject, setSubject] = useState<CoachAcademSubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setSubject(await fetchCoachAcademSubjectDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subject');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);

  const pending = !!subject && !subject.subjectVerification && !subject.rejectedAt;
  const points = stringList(subject?.subjectPoints);
  const documents = stringList(subject?.teacherVerification)
    .map(documentUrl)
    .filter((url): url is string => Boolean(url));
  const topics = Array.isArray(subject?.subjectTopics) ? subject.subjectTopics : [];

  const handleVerify = () => {
    if (!subject) return;
    Alert.alert(
      'Verify subject',
      `Approve "${String(subject.subjectName || subject.id)}" for the catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: () => {
            void (async () => {
              setActing(true);
              try {
                await verifyCoachAcademSubject(subject.id);
                router.back();
              } catch (err) {
                Alert.alert(
                  'Verify failed',
                  err instanceof Error ? err.message : 'Could not verify subject'
                );
              } finally {
                setActing(false);
              }
            })();
          },
        },
      ]
    );
  };

  const submitReject = async () => {
    if (!subject) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      Alert.alert('Reason required', 'Rejection reason must be at least 10 characters.');
      return;
    }
    setActing(true);
    try {
      await rejectCoachAcademSubject(subject.id, reason);
      setRejectOpen(false);
      router.back();
    } catch (err) {
      Alert.alert('Reject failed', err instanceof Error ? err.message : 'Could not reject subject');
    } finally {
      setActing(false);
    }
  };

  const statusLabel = subject?.subjectVerification
    ? 'Verified'
    : subject?.rejectedAt
      ? 'Rejected'
      : 'Pending verification';

  return (
    <>
      <DetailChrome
        title={subject?.subjectName || 'Subject'}
        loading={loading}
        error={error}
        refreshing={refreshing}
        onRefresh={onRefresh}>
        {subject ? (
          <>
            {subject.subjectImage ? (
              <Image source={{ uri: String(subject.subjectImage) }} style={styles.hero} />
            ) : null}
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText type="defaultSemiBold">{statusLabel}</ThemedText>
              <ThemedText style={detailStyles.meta}>
                Submitted {formatDate(subject.submittedForVerificationAt || subject.createdAt)}
              </ThemedText>
              <ThemedText type="subtitle">{String(subject.subjectName || subject.id)}</ThemedText>
              {subject.subjectNameSubHeading ? (
                <ThemedText style={detailStyles.meta}>{String(subject.subjectNameSubHeading)}</ThemedText>
              ) : null}
              <ThemedText style={detailStyles.meta}>
                {[
                  subject.subjectBoard ? String(subject.subjectBoard) : null,
                  subject.subjectGrade != null ? `Grade ${subject.subjectGrade}` : null,
                  subject.subjectLanguage ? String(subject.subjectLanguage) : null,
                  subject.courseType ? String(subject.courseType) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                {typeof subject.subjectPrice === 'number'
                  ? formatMinor(subject.subjectPrice)
                  : '—'}
                {subject.subjectDuration != null ? ` · ${subject.subjectDuration} months` : ''}
                {subject.maxCapacity != null ? ` · capacity ${subject.maxCapacity}` : ''}
              </ThemedText>
              {(subject.user?.name || subject.user?.email) && (
                <ThemedText style={detailStyles.meta}>
                  Teacher {subject.user?.name || '—'}
                  {subject.user?.email ? ` · ${subject.user.email}` : ''}
                </ThemedText>
              )}
              {subject.scheduledDateTime ? (
                <ThemedText style={detailStyles.meta}>
                  Scheduled {formatDate(String(subject.scheduledDateTime))}
                </ThemedText>
              ) : null}
            </View>

            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Course description</ThemedText>
              <ThemedText>{subject.subjectDescription || 'No description'}</ThemedText>
            </View>

            {points.length > 0 ? (
              <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText style={detailStyles.sectionTitle}>Course highlights</ThemedText>
                {points.map((point, index) => (
                  <ThemedText key={`${index}-${point}`}>
                    {index + 1}. {point}
                  </ThemedText>
                ))}
              </View>
            ) : null}

            {topics.length > 0 ? (
              <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText style={detailStyles.sectionTitle}>Topics</ThemedText>
                {topics.map((topic) => (
                  <View key={topic.id} style={detailStyles.row}>
                    <ThemedText type="defaultSemiBold">{topic.topicTitle}</ThemedText>
                    <ThemedText style={detailStyles.meta}>
                      {topic.hours} hour{topic.hours === 1 ? '' : 's'}
                      {topic.scheduledAt ? ` · ${formatDate(topic.scheduledAt)}` : ''}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}

            {subject.rejectionReason ? (
              <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText style={detailStyles.sectionTitle}>Rejection reason</ThemedText>
                <ThemedText>{String(subject.rejectionReason)}</ThemedText>
              </View>
            ) : null}

            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Verification documents</ThemedText>
              {documents.length === 0 ? (
                <ThemedText style={detailStyles.meta}>No documents uploaded.</ThemedText>
              ) : (
                documents.map((url, index) => (
                  <TouchableOpacity
                    key={url}
                    style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 6 }]}
                    onPress={() => {
                      void openDocument(url);
                    }}>
                    <ThemedText style={detailStyles.actionButtonText}>
                      View document {index + 1}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {pending ? (
              <View style={detailStyles.actionRow}>
                <TouchableOpacity
                  style={[
                    detailStyles.actionButton,
                    { backgroundColor: colors.tint, opacity: acting ? 0.6 : 1 },
                  ]}
                  disabled={acting}
                  onPress={handleVerify}>
                  {acting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={detailStyles.actionButtonText}>Verify</ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    detailStyles.actionButton,
                    styles.rejectButton,
                    { borderColor: colors.border, opacity: acting ? 0.6 : 1 },
                  ]}
                  disabled={acting}
                  onPress={() => {
                    setRejectReason('');
                    setRejectOpen(true);
                  }}>
                  <ThemedText style={styles.rejectButtonText}>Reject</ThemedText>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ) : null}
      </DetailChrome>

      <Modal visible={rejectOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <ThemedText type="subtitle">Reject subject</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {subject ? String(subject.subjectName || subject.id) : ''}
            </ThemedText>
            <ThemedText style={[detailStyles.meta, { marginTop: 8 }]}>
              Provide feedback for the teacher (min 10 characters).
            </ThemedText>
            <TextInput
              style={[
                styles.reasonInput,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
              ]}
              placeholder="Rejection reason"
              placeholderTextColor={colors.icon}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
              editable={!acting}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                disabled={acting}
                onPress={() => {
                  setRejectOpen(false);
                  setRejectReason('');
                }}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: '#c0392b', opacity: acting ? 0.7 : 1 }]}
                disabled={acting}
                onPress={() => {
                  void submitReject();
                }}>
                {acting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={detailStyles.actionButtonText}>Reject</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 180, borderRadius: 12 },
  rejectButton: { backgroundColor: 'transparent', borderWidth: 1 },
  rejectButtonText: { color: '#c0392b', fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 100,
    padding: 12,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
});
