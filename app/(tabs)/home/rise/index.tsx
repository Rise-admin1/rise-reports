import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  fetchAllRiseInvestorsForPdf,
  fetchAllRiseProfileReportsForPdf,
  fetchRiseInvestors,
  fetchRiseProfileReports,
} from '@/services/api';
import { RiseReportItem, RiseReportsResponse } from '@/types/reports';
import { buildRiseReportPdfHtml, exportHtmlToPdf } from '@/utils/reportPdf';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, type Href } from 'expo-router';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RiseScreen() {
  const [riseReportType, setRiseReportType] = useState<'profile-reports' | 'rise-investors' | null>(null);
  const [riseData, setRiseData] = useState<RiseReportsResponse | null>(null);
  const [riseLoading, setRiseLoading] = useState(false);
  const [riseError, setRiseError] = useState<string | null>(null);
  const riseLimit = 10;
  const [pdfExporting, setPdfExporting] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;

  const loadRiseReport = useCallback(async (type: 'profile-reports' | 'rise-investors', nextPage: number = 1) => {
    if (nextPage < 1) return;
    setRiseLoading(true);
    setRiseError(null);
    try {
      const data =
        type === 'profile-reports'
          ? await fetchRiseProfileReports(nextPage, riseLimit)
          : await fetchRiseInvestors(nextPage, riseLimit);
      setRiseData(data);
    } catch (err) {
      setRiseError(err instanceof Error ? err.message : 'Failed to load RISE report');
    } finally {
      setRiseLoading(false);
    }
  }, [riseLimit]);

  const { refreshing, onRefresh } = useRefreshControl(
    useCallback(async () => {
      if (riseReportType) {
        await loadRiseReport(riseReportType, riseData?.pagination.page ?? 1);
      }
    }, [riseReportType, riseData?.pagination.page, loadRiseReport])
  );

  const handleRiseReportTypeSelect = (type: 'profile-reports' | 'rise-investors') => {
    setRiseReportType(type);
    loadRiseReport(type, 1);
  };

  const formatRiseDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const runPdfExport = async (fileBase: string, buildHtml: () => Promise<string>) => {
    if (pdfExporting) return;
    try {
      setPdfExporting(true);
      const html = await buildHtml();
      await exportHtmlToPdf(html, fileBase);
    } catch (err) {
      Alert.alert('PDF export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          onPress={() => (riseReportType === null ? router.back() : undefined)}
          disabled={riseReportType !== null}
          style={styles.headerTitleWrap}
          accessibilityLabel="Back to home">
          <ThemedText type="title" style={styles.headerTitle}>
            RISE
          </ThemedText>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.themeButton, { borderColor: borderColor, backgroundColor: cardBackground }]}
            onPress={toggleTheme}
            accessibilityLabel={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
            <MaterialIcons
              name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }>
        <>
{riseReportType === null ? (
              <>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.riseBackRow, { marginBottom: 16 }]}
                  accessibilityLabel="Back to home">
                  <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                  <ThemedText style={styles.riseBackText}>Back to reports</ThemedText>
                </TouchableOpacity>
              <View style={styles.riseReportChoice}>
                <ThemedText type="subtitle" style={styles.riseReportChoiceTitle}>
                  Choose a RISE report
                </ThemedText>
                <TouchableOpacity
                  style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => handleRiseReportTypeSelect('profile-reports')}
                  activeOpacity={0.85}>
                  <View style={styles.riseReportCardContent}>
                    <MaterialIcons name="person" size={32} color={colors.tint} />
                    <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                      Profile reports
                    </ThemedText>
                    <ThemedText style={styles.riseReportCardDesc}>
                      GET /get-profile-reports
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => handleRiseReportTypeSelect('rise-investors')}
                  activeOpacity={0.85}>
                  <View style={styles.riseReportCardContent}>
                    <MaterialIcons name="groups" size={32} color={colors.tint} />
                    <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                      Rise investors
                    </ThemedText>
                    <ThemedText style={styles.riseReportCardDesc}>
                      GET /get-rise-investors
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.riseReportChoice}>
                <ThemedText type="subtitle" style={styles.riseReportChoiceTitle}>
                  Scheduling
                </ThemedText>
                <TouchableOpacity
                  style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => router.push('/home/rise/calendar-metrics' as Href)}
                  activeOpacity={0.85}
                  accessibilityLabel="Open Calendar Metrics">
                  <View style={styles.riseReportCardContent}>
                    <MaterialIcons name="calendar-month" size={32} color={colors.tint} />
                    <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                      Calendar Metrics
                    </ThemedText>
                    <ThemedText style={styles.riseReportCardDesc}>
                      GET /api/scheduling/metrics?appSource=rise
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => router.push('/home/rise/booking-stats' as Href)}
                  activeOpacity={0.85}
                  accessibilityLabel="Open Booking Stats">
                  <View style={styles.riseReportCardContent}>
                    <MaterialIcons name="query-stats" size={32} color={colors.tint} />
                    <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                      Client Booking Stats
                    </ThemedText>
                    <ThemedText style={styles.riseReportCardDesc}>
                      GET /api/scheduling/booking-stats?appSource=rise
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => router.push('/home/rise/availability-settings' as Href)}
                  activeOpacity={0.85}
                  accessibilityLabel="Open Availability Settings">
                  <View style={styles.riseReportCardContent}>
                    <MaterialIcons name="schedule" size={32} color={colors.tint} />
                    <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                      Availability Settings
                    </ThemedText>
                    <ThemedText style={styles.riseReportCardDesc}>
                      View & edit weekly booking windows in your timezone
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => router.push('/home/rise/set-appointment' as Href)}
                  activeOpacity={0.85}
                  accessibilityLabel="Open Set Appointment">
                  <View style={styles.riseReportCardContent}>
                    <MaterialIcons name="event-available" size={32} color={colors.tint} />
                    <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                      Set Appointment
                    </ThemedText>
                    <ThemedText style={styles.riseReportCardDesc}>
                      Create paid or free shareable booking links
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => router.push('/home/rise/grant-sessions' as Href)}
                  activeOpacity={0.85}
                  accessibilityLabel="Open Grant Sessions">
                  <View style={styles.riseReportCardContent}>
                    <MaterialIcons name="card-giftcard" size={32} color={colors.tint} />
                    <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                      Grant Session Package
                    </ThemedText>
                    <ThemedText style={styles.riseReportCardDesc}>
                      Add sessions for external payments and email a booking link
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
                  onPress={() => router.push('/home/rise/manage-meetings' as Href)}
                  activeOpacity={0.85}
                  accessibilityLabel="Open Manage Meetings">
                  <View style={styles.riseReportCardContent}>
                    <MaterialIcons name="event-note" size={32} color={colors.tint} />
                    <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                      Manage Meetings
                    </ThemedText>
                    <ThemedText style={styles.riseReportCardDesc}>
                      Reschedule or cancel upcoming Google Calendar sessions
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
                </TouchableOpacity>
              </View>
              </>
            ) : riseLoading && !riseData ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <ThemedText style={styles.loadingText}>Loading RISE report…</ThemedText>
              </View>
            ) : (
              <>
                {riseError && (
                  <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                    <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
                    <ThemedText style={[styles.errorText, { color: colors.errorText }]}>Error: {riseError}</ThemedText>
                  </View>
                )}
                {riseData && (
                  <>
                    <View style={[styles.riseReportHeader, { borderBottomColor: borderColor }]}>
                      <TouchableOpacity
                        onPress={() => {
                          setRiseReportType(null);
                          setRiseData(null);
                          setRiseError(null);
                        }}
                        style={styles.riseBackRow}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                        <ThemedText style={styles.riseBackText}>
                          {riseReportType === 'profile-reports' ? 'Profile reports' : 'Rise investors'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.pdfDownloadButton,
                        {
                          borderColor: colors.tint,
                          backgroundColor: colors.buttonSecondary,
                          opacity: pdfExporting ? 0.65 : 1,
                        },
                      ]}
                      onPress={() =>
                        runPdfExport(
                          riseReportType === 'profile-reports' ? 'rise_profile_reports' : 'rise_investors',
                          async () => {
                            const data =
                              riseReportType === 'profile-reports'
                                ? await fetchAllRiseProfileReportsForPdf()
                                : await fetchAllRiseInvestorsForPdf();
                            return buildRiseReportPdfHtml(
                              riseReportType === 'profile-reports' ? 'RISE profile reports' : 'RISE investors',
                              data
                            );
                          }
                        )
                      }
                      activeOpacity={0.85}
                      disabled={pdfExporting}
                      accessibilityLabel="Download RISE report as PDF">
                      {pdfExporting ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <MaterialIcons name="picture-as-pdf" size={22} color={colors.tint} />
                      )}
                      <ThemedText style={[styles.pdfDownloadButtonText, { color: colors.tint }]}>
                        Download as PDF
                      </ThemedText>
                    </TouchableOpacity>
                    <View style={styles.section}>
                      {riseData.data.map((item: RiseReportItem, rIndex: number) => {
                        const riseRowId = (riseData.pagination.page - 1) * riseLimit + rIndex + 1;
                        return (
                        <View
                          key={item.id}
                          style={[styles.riseItemCard, { backgroundColor: cardBackground, borderColor }]}>
                          <View style={styles.cardIdRow}>
                            <View style={[styles.cardIdBadge, { backgroundColor: colors.buttonSecondary, borderColor }]}>
                              <ThemedText type="defaultSemiBold" style={[styles.cardIdText, { color: colors.tint }]}>
                                ID {riseRowId}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.riseItemRow}>
                            <ThemedText type="defaultSemiBold" style={styles.riseItemName}>
                              {item.name}
                            </ThemedText>
                            <ThemedText style={styles.riseItemDate}>{formatRiseDate(item.createdAt)}</ThemedText>
                          </View>
                          <View style={styles.riseItemRow}>
                            <MaterialIcons name="email" size={16} color={colors.icon} />
                            <ThemedText style={styles.riseItemEmail}>{item.email}</ThemedText>
                          </View>
                          {item.receipt_url ? (
                            <TouchableOpacity
                              style={styles.riseReceiptRow}
                              onPress={() => Linking.openURL(item.receipt_url)}
                              activeOpacity={0.8}>
                              <MaterialIcons name="receipt" size={16} color={colors.tint} />
                              <ThemedText style={[styles.riseReceiptLink, { color: colors.tint }]} numberOfLines={1}>
                                {item.receipt_url}
                              </ThemedText>
                            </TouchableOpacity>
                          ) : (
                            <ThemedText style={styles.riseNoReceipt}>No receipt</ThemedText>
                          )}
                        </View>
                      );
                      })}
                    </View>
                    <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
                      <View style={styles.paginationRow}>
                        <MaterialIcons name="list" size={20} color={colors.icon} />
                        <ThemedText style={styles.paginationText}>
                          {riseData.pagination.total} total · {riseLimit} per page
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.paginationNav}>
                      <TouchableOpacity
                        style={[
                          styles.paginationNavButton,
                          {
                            backgroundColor: colors.buttonSecondary,
                            borderColor,
                            opacity:
                              riseLoading || !riseReportType || riseData.pagination.page <= 1 ? 0.45 : 1,
                          },
                        ]}
                        onPress={() =>
                          riseReportType && loadRiseReport(riseReportType, riseData.pagination.page - 1)
                        }
                        disabled={riseLoading || !riseReportType || riseData.pagination.page <= 1}
                        accessibilityLabel="Previous page">
                        <MaterialIcons name="chevron-left" size={22} color={colors.text} />
                        <ThemedText style={styles.paginationNavLabel}>Previous</ThemedText>
                      </TouchableOpacity>
                      <View style={styles.paginationNavCenter}>
                        <ThemedText style={styles.paginationNavPageText}>
                          Page {riseData.pagination.page} of {riseData.pagination.totalPages}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.paginationNavButton,
                          {
                            backgroundColor: colors.buttonSecondary,
                            borderColor,
                            opacity:
                              riseLoading ||
                              !riseReportType ||
                              riseData.pagination.page >= riseData.pagination.totalPages
                                ? 0.45
                                : 1,
                          },
                        ]}
                        onPress={() =>
                          riseReportType && loadRiseReport(riseReportType, riseData.pagination.page + 1)
                        }
                        disabled={
                          riseLoading ||
                          !riseReportType ||
                          riseData.pagination.page >= riseData.pagination.totalPages
                        }
                        accessibilityLabel="Next page">
                        <ThemedText style={styles.paginationNavLabel}>Next</ThemedText>
                        <MaterialIcons name="chevron-right" size={22} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
        </>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
        fontSize: 24,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  pdfDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 16,
  },
  pdfDownloadButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  paginationCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paginationText: {
    fontSize: 14,
  },
  paginationNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  paginationNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 108,
    justifyContent: 'center',
  },
  paginationNavCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  paginationNavLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginationNavPageText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  riseReportChoice: {
    marginBottom: 24,
  },
  riseReportChoiceTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  riseReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  riseReportCardContent: {
    flex: 1,
  },
  riseReportCardTitle: {
    marginTop: 8,
    marginBottom: 4,
  },
  riseReportCardDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
  riseReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  riseBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riseBackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  riseItemCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIdRow: {
    marginBottom: 12,
  },
  cardIdBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardIdText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  riseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  riseItemName: {
    flex: 1,
    fontSize: 16,
  },
  riseItemDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  riseItemEmail: {
    flex: 1,
    fontSize: 14,
    opacity: 0.8,
  },
  riseReceiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  riseReceiptLink: {
    flex: 1,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  riseNoReceipt: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  }
});
