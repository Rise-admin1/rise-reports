import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  fetchSafariBooksPendingDetail,
  rejectSafariBooksPublisher,
} from '@/services/api';
import type { SafariBooksPublisherDetail, SafariBooksPublisherType } from '@/types/safariBooks';
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
import { DetailChrome, detailStyles } from '../../DetailChrome';
import { documentUrl, formatAmount, formatDate, openDocument } from '../../format';

function isPublisherType(value: string | undefined): value is SafariBooksPublisherType {
  return value === 'company' || value === 'author';
}

function LinkButton({
  label,
  url,
  tint,
}: {
  label: string;
  url?: string | null;
  tint: string;
}) {
  const safe = url ? documentUrl(url) : null;
  if (!safe) {
    return <ThemedText style={detailStyles.meta}>No {label.toLowerCase()}.</ThemedText>;
  }
  return (
    <TouchableOpacity
      style={[detailStyles.actionButton, { backgroundColor: tint, marginTop: 4 }]}
      onPress={() => {
        void openDocument(safe);
      }}>
      <ThemedText style={detailStyles.actionButtonText}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

export default function SafariBooksPendingDetailScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [publisher, setPublisher] = useState<SafariBooksPublisherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id || !isPublisherType(type)) {
      setError('Missing or invalid pending publisher');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPublisher(await fetchSafariBooksPendingDetail(type, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending publisher');
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);

  const submitReject = async () => {
    if (!publisher || !isPublisherType(type)) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      Alert.alert('Reason required', 'Please enter at least 10 characters.');
      return;
    }
    setRejectSubmitting(true);
    try {
      await rejectSafariBooksPublisher(publisher.id, type === 'company', reason);
      setRejectOpen(false);
      setRejectReason('');
      router.back();
    } catch (err) {
      Alert.alert('Reject failed', err instanceof Error ? err.message : 'Could not reject publisher');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const canReject =
    !!publisher && !publisher.isVerified && !publisher.isRejected && isPublisherType(type);

  return (
    <>
      <DetailChrome
        title={publisher?.displayName || 'Pending publisher'}
        loading={loading}
        error={error}
        refreshing={refreshing}
        onRefresh={onRefresh}>
        {publisher ? (
          <>
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {publisher.coverImage ? (
                <Image
                  source={{ uri: publisher.coverImage }}
                  style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 8 }}
                  resizeMode="cover"
                />
              ) : null}
              <ThemedText type="subtitle">{publisher.displayName}</ThemedText>
              <ThemedText style={detailStyles.meta}>
                {publisher.type} ·{' '}
                {publisher.isVerified
                  ? 'verified'
                  : publisher.isRejected
                    ? 'rejected'
                    : 'pending'}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                {publisher.address} · {publisher.telephone}
              </ThemedText>
              {publisher.user ? (
                <ThemedText style={detailStyles.meta}>
                  {publisher.user.name} · {publisher.user.email}
                </ThemedText>
              ) : null}
              <ThemedText style={detailStyles.meta}>
                Registered {formatDate(publisher.registrationStartedAt)}
              </ThemedText>
              {canReject ? (
                <View style={detailStyles.actionRow}>
                  <TouchableOpacity
                    style={[detailStyles.actionButton, detailStyles.rejectButton, { borderColor: '#c0392b' }]}
                    onPress={() => {
                      setRejectReason('');
                      setRejectOpen(true);
                    }}>
                    <ThemedText style={detailStyles.rejectButtonText}>Reject</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Draft / listing</ThemedText>
              <ThemedText type="defaultSemiBold">{publisher.title || 'No title yet'}</ThemedText>
              <ThemedText style={detailStyles.meta}>
                {[publisher.language, publisher.categories, publisher.narrator]
                  .filter(Boolean)
                  .join(' · ') || 'No draft metadata'}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                Amount {formatAmount(publisher.amount)}
              </ThemedText>
              <ThemedText>{publisher.synopsis || 'No synopsis'}</ThemedText>
              <LinkButton label="Open PDF" url={publisher.pdfURL} tint={colors.tint} />
              <LinkButton label="Sample audio" url={publisher.audioSampleURL} tint={colors.tint} />
            </View>

            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Documents</ThemedText>
              {publisher.type === 'company' ? (
                <>
                  <ThemedText style={detailStyles.meta}>
                    Reg {publisher.companyRegNo || '—'} · KRA {publisher.kraPin || '—'}
                  </ThemedText>
                  <LinkButton
                    label="Company registration PDF"
                    url={publisher.companyRegNoPdfUrl}
                    tint={colors.tint}
                  />
                  <LinkButton label="KRA PIN PDF" url={publisher.kraPinPdfUrl} tint={colors.tint} />
                </>
              ) : (
                <>
                  <ThemedText style={detailStyles.meta}>
                    ID/PP {publisher.idppNo || '—'} · KRA {publisher.kraPin || '—'}
                  </ThemedText>
                  <LinkButton label="ID/PP PDF" url={publisher.idppPdfUrl} tint={colors.tint} />
                  <LinkButton label="KRA PIN PDF" url={publisher.kraPinPdfUrl} tint={colors.tint} />
                </>
              )}
            </View>
          </>
        ) : null}
      </DetailChrome>

      <Modal visible={rejectOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <ThemedText type="subtitle">Reject publisher</ThemedText>
            <ThemedText style={detailStyles.meta}>{publisher?.displayName || 'Publisher'}</ThemedText>
            <TextInput
              style={[styles.reasonInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Rejection reason (min 10 characters)"
              placeholderTextColor={colors.icon}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setRejectOpen(false);
                  setRejectReason('');
                }}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  detailStyles.actionButton,
                  { backgroundColor: '#c0392b', opacity: rejectSubmitting ? 0.7 : 1 },
                ]}
                disabled={rejectSubmitting}
                onPress={() => {
                  void submitReject();
                }}>
                {rejectSubmitting ? (
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
