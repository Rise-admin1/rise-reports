import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  approveVeloAgentAppointment,
  declineVeloAgentAppointment,
  fetchVeloAppointmentDetail,
} from '@/services/api';
import type { VeloAgentDetail } from '@/types/velo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMoney, openDocument } from '../format';

export default function VeloAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [agent, setAgent] = useState<VeloAgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing appointment id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAgent(await fetchVeloAppointmentDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment');
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
  const canDecide = agent?.registerVerificationStatus === 'APPOINTMENT_BOOKED';
  const org = agent?.leadsOrganisation || agent?.organisation;

  const onApprove = () => {
    if (!id) return;
    Alert.alert('Approve appointment', 'Approve this organisation leader?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          void (async () => {
            setActionBusy(true);
            try {
              await approveVeloAgentAppointment(id);
              router.back();
            } catch (err) {
              Alert.alert(
                'Approve failed',
                err instanceof Error ? err.message : 'Unable to approve'
              );
            } finally {
              setActionBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const onDecline = () => {
    if (!id) return;
    Alert.alert('Decline appointment', 'Decline this organisation leader?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setActionBusy(true);
            try {
              await declineVeloAgentAppointment(id);
              router.back();
            } catch (err) {
              Alert.alert(
                'Decline failed',
                err instanceof Error ? err.message : 'Unable to decline'
              );
            } finally {
              setActionBusy(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <DetailChrome
      title={agent?.name || 'Appointment'}
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
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              {agent.registerVerificationStatus} · Appointment{' '}
              {formatDate(agent.appointmentDate)}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>Joined {formatDate(agent.createdAt)}</ThemedText>
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
            {canDecide ? (
              <View style={detailStyles.actionRow}>
                <TouchableOpacity
                  style={[
                    detailStyles.actionButton,
                    { backgroundColor: colors.tint, opacity: actionBusy ? 0.6 : 1 },
                  ]}
                  disabled={actionBusy}
                  onPress={onApprove}>
                  {actionBusy ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={detailStyles.actionButtonText}>Approve</ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[detailStyles.actionButton, detailStyles.rejectButton, { borderColor: '#c0392b' }]}
                  disabled={actionBusy}
                  onPress={onDecline}>
                  <ThemedText style={detailStyles.rejectButtonText}>Decline</ThemedText>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {org ? (
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Organisation</ThemedText>
              <ThemedText type="defaultSemiBold">
                {org.organisationName || 'Organisation'}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>{org.organisationAddress || 'No address'}</ThemedText>
              <ThemedText style={detailStyles.meta}>
                {org.modeOfWork} · {org.superAdminApproval ? 'Approved' : 'Not approved'} ·{' '}
                {org.organisationEmployeesCount} seats
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                Doc {formatMoney(org.documentPricePerPiece)}/pc · Pkg{' '}
                {formatMoney(org.packagePricePerKg)}/kg · {org.deliveryTimeline} days
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={detailStyles.meta}>No organisation linked.</ThemedText>
          )}

          <ThemedText style={detailStyles.sectionTitle}>Countries</ThemedText>
          {agent.countries.length === 0 ? (
            <ThemedText style={detailStyles.meta}>No countries assigned.</ThemedText>
          ) : (
            agent.countries.map((row) => (
              <View
                key={row.id}
                style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{row.country.name}</ThemedText>
                <ThemedText style={detailStyles.meta}>
                  {row.roleInCountry || 'No role'} · {formatDate(row.assignedAt)}
                </ThemedText>
              </View>
            ))
          )}
        </>
      ) : null}
    </DetailChrome>
  );
}
