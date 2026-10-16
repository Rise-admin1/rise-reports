import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { fetchCoachAcademPurchaseDetail } from '@/services/api';
import type { CoachAcademPurchaseDetail } from '@/types/coachAcadem';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DetailChrome, detailStyles } from '../DetailChrome';
import { documentUrl, formatDate, formatMinor, openDocument } from '../format';

export default function CoachAcademPurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [purchase, setPurchase] = useState<CoachAcademPurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setPurchase(await fetchCoachAcademPurchaseDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);
  const receiptUrl = purchase?.purchaseReceiptUrl
    ? documentUrl(purchase.purchaseReceiptUrl)
    : null;

  return (
    <DetailChrome
      title={purchase?.subject?.subjectName || 'Purchase'}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}>
      {purchase ? (
        <>
          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">{purchase.subject?.subjectName || 'Subject'}</ThemedText>
            <ThemedText style={detailStyles.meta}>
              {formatMinor(purchase.purchaseAmount, purchase.purchaseCurrency || 'AED')}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Purchase {purchase.purchaseStatus} · Payment {purchase.paymentStatus}
            </ThemedText>
            <ThemedText style={detailStyles.meta}>
              Purchased {formatDate(purchase.purchaseDate)} · Created{' '}
              {formatDate(purchase.createdAt)}
            </ThemedText>
            {purchase.subject ? (
              <ThemedText style={detailStyles.meta}>
                {[
                  purchase.subject.courseType,
                  purchase.subject.subjectBoard,
                  purchase.subject.subjectGrade != null
                    ? `Grade ${purchase.subject.subjectGrade}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>
            ) : null}
            {receiptUrl ? (
              <TouchableOpacity
                style={[detailStyles.actionButton, { backgroundColor: colors.tint, marginTop: 8 }]}
                onPress={() => {
                  void openDocument(receiptUrl);
                }}>
                <ThemedText style={detailStyles.actionButtonText}>View receipt</ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={detailStyles.meta}>No receipt URL.</ThemedText>
            )}
          </View>

          <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={detailStyles.sectionTitle}>Student</ThemedText>
            <ThemedText type="defaultSemiBold">{purchase.student.name || 'Student'}</ThemedText>
            <ThemedText style={detailStyles.meta}>{purchase.student.email || 'No email'}</ThemedText>
          </View>

          {purchase.booking ? (
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Booking</ThemedText>
              <ThemedText style={detailStyles.meta}>Status {purchase.booking.bookingStatus}</ThemedText>
              <ThemedText style={detailStyles.meta}>
                {purchase.booking.bookingDate
                  ? formatDate(purchase.booking.bookingDate)
                  : 'No booking date'}
                {purchase.booking.bookingTime ? ` · ${purchase.booking.bookingTime}` : ''}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                {[
                  purchase.booking.bookingHours != null
                    ? `${purchase.booking.bookingHours}h`
                    : null,
                  purchase.booking.bookingMinutes != null
                    ? `${purchase.booking.bookingMinutes}m`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' ') || 'Duration —'}
              </ThemedText>
              {purchase.booking.bookingZoomUrl ? (
                <ThemedText style={detailStyles.meta}>{purchase.booking.bookingZoomUrl}</ThemedText>
              ) : null}
            </View>
          ) : null}

          {purchase.courseEnrollment ? (
            <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={detailStyles.sectionTitle}>Course enrollment</ThemedText>
              <ThemedText style={detailStyles.meta}>
                Status {purchase.courseEnrollment.enrollmentStatus}
              </ThemedText>
              <ThemedText style={detailStyles.meta}>
                Enrolled{' '}
                {formatDate(
                  purchase.courseEnrollment.enrolledAt || purchase.courseEnrollment.createdAt
                )}
              </ThemedText>
            </View>
          ) : null}

          {!purchase.booking && !purchase.courseEnrollment ? (
            <ThemedText style={detailStyles.meta}>No booking or enrollment linked.</ThemedText>
          ) : null}
        </>
      ) : null}
    </DetailChrome>
  );
}
