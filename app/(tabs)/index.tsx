import { CustomDrawer } from '@/components/custom-drawer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchFunyulaReports, fetchFunyulaVolunteers, fetchRiseInvestors, fetchRiseProfileReports } from '@/services/api';
import {
  FunyulaReportsResponse,
  Payment,
  Volunteer,
  RiseReportItem,
  RiseReportsResponse,
  VolunteersResponse,
} from '@/types/reports';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'funyula' | 'rise' | null>(null);
  const [funyulaReportType, setFunyulaReportType] = useState<'contributions' | 'volunteer' | null>(null);
  const [reportsData, setReportsData] = useState<FunyulaReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showSuccessOnly, setShowSuccessOnly] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');

  const [volunteersData, setVolunteersData] = useState<VolunteersResponse | null>(null);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [volunteersLoadingMore, setVolunteersLoadingMore] = useState(false);
  const [volunteersError, setVolunteersError] = useState<string | null>(null);

  const [riseReportType, setRiseReportType] = useState<'profile-reports' | 'rise-investors' | null>(null);
  const [riseData, setRiseData] = useState<RiseReportsResponse | null>(null);
  const [riseLoading, setRiseLoading] = useState(false);
  const [riseLoadingMore, setRiseLoadingMore] = useState(false);
  const [riseError, setRiseError] = useState<string | null>(null);
  const [risePage, setRisePage] = useState(1);
  const riseLimit = 10;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;

  useEffect(() => {
    if (selectedReportType === 'funyula') {
      setFunyulaReportType(null);
      setReportsData(null);
      setError(null);
      setVolunteersData(null);
      setVolunteersError(null);
      setRiseReportType(null);
      setRiseData(null);
      setRiseError(null);
    } else if (selectedReportType === 'rise') {
      setFunyulaReportType(null);
      setReportsData(null);
      setError(null);
      setVolunteersData(null);
      setVolunteersError(null);
      setRiseReportType(null);
      setRiseData(null);
      setRiseError(null);
    }
  }, [selectedReportType]);

  const loadFunyulaReports = async ({ nextPage }: { nextPage: number }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFunyulaReports(nextPage, limit);
      setReportsData(data);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFunyulaReports = async () => {
    if (loadingMore || loading) return;
    if (!reportsData?.data.pagination.hasNextPage) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchFunyulaReports(nextPage, limit);
      setReportsData((prev) => {
        if (!prev || !prev.data) return data;
        return {
          ...data,
          data: {
            ...data.data,
            payments: [...prev.data.payments, ...data.data.payments],
          },
        };
      });
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more reports');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadVolunteers = async ({ nextOffset }: { nextOffset: number }) => {
    const isLoadMore = nextOffset > 0;
    if (isLoadMore) {
      setVolunteersLoadingMore(true);
    } else {
      setVolunteersLoading(true);
    }
    setVolunteersError(null);

    try {
      const data = await fetchFunyulaVolunteers(nextOffset, limit);
      if (nextOffset === 0) {
        setVolunteersData(data);
      } else {
        setVolunteersData((prev) =>
          prev
            ? {
                ...data,
                data: [...prev.data, ...data.data],
              }
            : data
        );
      }
    } catch (err) {
      setVolunteersError(err instanceof Error ? err.message : 'Failed to load Funyula volunteers');
    } finally {
      setVolunteersLoading(false);
      setVolunteersLoadingMore(false);
    }
  };

  const loadMoreVolunteers = () => {
    if (!volunteersData || volunteersLoadingMore || volunteersLoading) return;
    const { offset, limit: pageLimit, totalCount } = volunteersData.pagination;
    const nextOffset = offset + pageLimit;
    if (nextOffset >= totalCount) return;
    loadVolunteers({ nextOffset });
  };

  const handleMenuItemSelect = (menuItem: 'funyula' | 'rise') => {
    setSelectedReportType(menuItem);
  };

  const loadRiseReport = async (type: 'profile-reports' | 'rise-investors', page: number = 1) => {
    const isLoadMore = page > 1;
    if (isLoadMore) {
      setRiseLoadingMore(true);
    } else {
      setRiseLoading(true);
    }
    setRiseError(null);
    try {
      const data =
        type === 'profile-reports'
          ? await fetchRiseProfileReports(page, riseLimit)
          : await fetchRiseInvestors(page, riseLimit);
      if (page === 1) {
        setRiseData(data);
        setRisePage(1);
      } else {
        setRiseData((prev) =>
          prev
            ? {
                ...data,
                data: [...prev.data, ...data.data],
              }
            : data
        );
        setRisePage(page);
      }
    } catch (err) {
      setRiseError(err instanceof Error ? err.message : 'Failed to load RISE report');
    } finally {
      setRiseLoading(false);
      setRiseLoadingMore(false);
    }
  };

  const handleRiseReportTypeSelect = (type: 'profile-reports' | 'rise-investors') => {
    setRiseReportType(type);
    loadRiseReport(type, 1);
  };

  const loadMoreRiseReport = () => {
    if (!riseReportType || !riseData || riseLoadingMore || riseLoading) return;
    const { page, totalPages } = riseData.pagination;
    if (page >= totalPages) return;
    loadRiseReport(riseReportType, page + 1);
  };

  const formatRiseDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount: string) => {
    return `KES ${parseFloat(amount).toLocaleString()}`;
  };

  const basePayments =
    selectedReportType === 'funyula' && reportsData
      ? showSuccessOnly
        ? reportsData.data.payments.filter((p) => p.status === 'success')
        : reportsData.data.payments
      : [];

  const phoneSearchTrimmed = phoneSearch.trim().toLowerCase();
  const displayedPayments =
    phoneSearchTrimmed === ''
      ? basePayments
      : basePayments.filter((p) =>
          (p.phoneNumber || '').toLowerCase().includes(phoneSearchTrimmed)
        );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerOpen(true)}
          accessibilityLabel="Open menu">
          <MaterialIcons name="menu" size={28} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Reports
        </ThemedText>
        {selectedReportType && (
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <ThemedText style={[styles.badgeText, { color: colors.tintText }]}>
              {selectedReportType === 'funyula' ? 'Funyula' : 'RISE'}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {loading && selectedReportType === 'funyula' && funyulaReportType === 'contributions' && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>Loading reports...</ThemedText>
          </View>
        )}

        {error && selectedReportType === 'funyula' && funyulaReportType === 'contributions' && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
            <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
            <ThemedText style={[styles.errorText, { color: colors.errorText }]}>Error: {error}</ThemedText>
          </View>
        )}

        {selectedReportType === 'funyula' && funyulaReportType !== null && (
          <View style={[styles.riseReportHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              onPress={() => {
                setFunyulaReportType(null);
                setReportsData(null);
                setError(null);
                setLoading(false);
                setLoadingMore(false);
                setVolunteersData(null);
                setVolunteersError(null);
                setVolunteersLoading(false);
                setVolunteersLoadingMore(false);
              }}
              style={styles.riseBackRow}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              <ThemedText style={styles.riseBackText}>
                {funyulaReportType === 'contributions' ? 'Funyula Contributions' : 'Funyula Volunteer'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {selectedReportType === 'funyula' && funyulaReportType === null && (
          <View style={styles.riseReportChoice}>
            <ThemedText type="subtitle" style={styles.riseReportChoiceTitle}>
              Choose a Funyula report
            </ThemedText>
            <TouchableOpacity
              style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => {
                setFunyulaReportType('contributions');
                loadFunyulaReports({ nextPage: 1 });
              }}
              activeOpacity={0.85}>
              <View style={styles.riseReportCardContent}>
                <MaterialIcons name="account-balance-wallet" size={32} color={colors.tint} />
                <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                  Funyula Contributions
                </ThemedText>
                <ThemedText style={styles.riseReportCardDesc}>GET /rise-reports/reports</ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => {
                setFunyulaReportType('volunteer');
                loadVolunteers({ nextOffset: 0 });
              }}
              activeOpacity={0.85}>
              <View style={styles.riseReportCardContent}>
                <MaterialIcons name="groups" size={32} color={colors.tint} />
                <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                  Funyula Volunteer
                </ThemedText>
                <ThemedText style={styles.riseReportCardDesc}>GET /volunteer/all</ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && selectedReportType === 'funyula' && funyulaReportType === 'contributions' && reportsData && (
          <>
            <View style={[styles.summaryGrid, { gap: 16 }]}>
              <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor }]}>
                <View style={styles.summaryIconContainer}>
                  <MaterialIcons name="account-balance-wallet" size={32} color={colors.success} />
                </View>
                <ThemedText style={styles.summaryLabel}>Total Amount</ThemedText>
                <ThemedText type="title" style={styles.summaryValue}>
                  {formatAmount(reportsData.data.summary.totalAmount)}
                </ThemedText>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor }]}>
                <View style={styles.summaryIconContainer}>
                  <MaterialIcons name="receipt" size={32} color={colors.tint} />
                </View>
                <ThemedText style={styles.summaryLabel}>Transactions</ThemedText>
                <ThemedText type="title" style={styles.summaryValue}>
                  {reportsData.data.summary.totalTransactions}
                </ThemedText>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Status Breakdown
              </ThemedText>
              <View style={styles.statusGrid}>
                {reportsData.data.summary.statusBreakdown.map((breakdown, index) => (
                  <View
                    key={index}
                    style={[
                      styles.statusCard,
                      {
                        backgroundColor: cardBackground,
                        borderColor,
                        borderLeftWidth: 4,
                        borderLeftColor: breakdown.status === 'success' ? colors.success : colors.error,
                      },
                    ]}>
                    <View style={styles.statusHeader}>
                      <ThemedText
                        type="defaultSemiBold"
                        style={[
                          styles.statusTitle,
                          { color: breakdown.status === 'success' ? colors.success : colors.error },
                        ]}>
                        {breakdown.status.toUpperCase()}
                      </ThemedText>
                      <MaterialIcons
                        name={breakdown.status === 'success' ? 'check-circle' : 'cancel'}
                        size={20}
                        color={breakdown.status === 'success' ? colors.success : colors.error}
                      />
                    </View>
                    <ThemedText style={styles.statusCount}>{breakdown.count} transactions</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.statusAmount}>
                      {formatAmount(breakdown.totalAmount)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                <MaterialIcons name="phone" size={20} color={colors.icon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search by phone number"
                  placeholderTextColor={colors.icon}
                  value={phoneSearch}
                  onChangeText={setPhoneSearch}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Recent Payments
                </ThemedText>
                <View style={styles.paymentsHeaderRight}>
                  <View style={styles.filterPills}>
                    <TouchableOpacity
                      style={[
                        styles.filterPill,
                        !showSuccessOnly
                          ? [styles.filterPillActive, { backgroundColor: colors.tint }]
                          : {
                              backgroundColor: colors.buttonSecondary,
                              borderColor,
                            },
                      ]}
                      onPress={() => setShowSuccessOnly(false)}
                      activeOpacity={0.8}>
                      <ThemedText
                        style={[
                          styles.filterPillText,
                          !showSuccessOnly
                            ? { color: colors.tintText }
                            : { color: colors.buttonSecondaryText },
                        ]}>
                        All
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterPill,
                        showSuccessOnly
                          ? [styles.filterPillActive, { backgroundColor: colors.tint }]
                          : {
                              backgroundColor: colors.buttonSecondary,
                              borderColor,
                            },
                      ]}
                      onPress={() => setShowSuccessOnly(true)}
                      activeOpacity={0.8}>
                      <ThemedText
                        style={[
                          styles.filterPillText,
                          showSuccessOnly
                            ? { color: colors.tintText }
                            : { color: colors.buttonSecondaryText },
                        ]}>
                        Success
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <ThemedText style={styles.paymentCount}>
                    {displayedPayments.length} shown
                  </ThemedText>
                </View>
              </View>
              {displayedPayments.map((payment: Payment) => (
                <View
                  key={payment.id}
                  style={[styles.paymentCard, { backgroundColor: cardBackground, borderColor }]}>
                  <View style={styles.paymentHeader}>
                    <View style={styles.paymentHeaderLeft}>
                      <View
                        style={[
                          styles.paymentIconContainer,
                          {
                            backgroundColor:
                              payment.status === 'success' ? colors.successMuted : colors.errorMuted,
                          },
                        ]}>
                        <MaterialIcons
                          name={payment.status === 'success' ? 'check-circle' : 'error'}
                          size={24}
                          color={payment.status === 'success' ? colors.success : colors.error}
                        />
                      </View>
                      <View style={styles.paymentInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.paymentId}>
                          {payment.merchantRequestID.slice(0, 20)}...
                        </ThemedText>
                        <ThemedText style={styles.paymentDate}>
                          {formatDate(payment.transactionDate)}
                        </ThemedText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        payment.status === 'success'
                          ? { backgroundColor: colors.successMuted }
                          : { backgroundColor: colors.errorMuted },
                      ]}>
                      <ThemedText
                        style={[
                          styles.statusText,
                          { color: payment.status === 'success' ? colors.successText : colors.errorText },
                        ]}>
                        {payment.status}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.paymentDivider} />

                  <View style={styles.paymentDetails}>
                    <View style={styles.paymentDetailRow}>
                      <View style={styles.paymentDetailLabel}>
                        <MaterialIcons name="phone" size={16} color={colors.icon} />
                        <ThemedText style={styles.paymentDetailText}>Phone</ThemedText>
                      </View>
                      <ThemedText style={styles.paymentDetailValue}>
                        {payment.phoneNumber || 'N/A'}
                      </ThemedText>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <View style={styles.paymentDetailLabel}>
                        <MaterialIcons name="attach-money" size={16} color={colors.icon} />
                        <ThemedText style={styles.paymentDetailText}>Amount</ThemedText>
                      </View>
                      <ThemedText type="defaultSemiBold" style={[styles.paymentAmount, { color: colors.success }]}>
                        {formatAmount(payment.amount)}
                      </ThemedText>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <View style={styles.paymentDetailLabel}>
                        <MaterialIcons name="description" size={16} color={colors.icon} />
                        <ThemedText style={styles.paymentDetailText}>Description</ThemedText>
                      </View>
                      <ThemedText style={styles.paymentDetailValue} numberOfLines={2}>
                        {payment.resultDesc}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.paginationRow}>
                <MaterialIcons name="info-outline" size={20} color={colors.icon} />
                <ThemedText style={styles.paginationText}>
                  Page {reportsData.data.pagination.currentPage} of{' '}
                  {reportsData.data.pagination.totalPages}
                </ThemedText>
              </View>
              <View style={styles.paginationRow}>
                <MaterialIcons name="list" size={20} color={colors.icon} />
                <ThemedText style={styles.paginationText}>
                  {reportsData.data.pagination.totalCount} total transactions
                </ThemedText>
              </View>
              <View style={styles.paginationRow}>
                <MaterialIcons
                  name={reportsData.data.pagination.hasNextPage ? 'arrow-forward' : 'check'}
                  size={20}
                  color={colors.icon}
                />
                <ThemedText style={styles.paginationText}>
                  {reportsData.data.pagination.hasNextPage ? 'More pages available' : 'Last page'}
                </ThemedText>
              </View>
            </View>

            {reportsData.data.pagination.hasNextPage && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { backgroundColor: colors.tint }]}
                onPress={loadMoreFunyulaReports}
                activeOpacity={0.85}
                disabled={loadingMore}>
                {loadingMore ? (
                  <View style={styles.loadMoreInner}>
                    <ActivityIndicator size="small" color={colors.tintText} />
                    <ThemedText style={[styles.loadMoreText, { color: colors.tintText }]}>Loading more…</ThemedText>
                  </View>
                ) : (
                  <View style={styles.loadMoreInner}>
                    <MaterialIcons name="expand-more" size={20} color={colors.tintText} />
                    <ThemedText style={[styles.loadMoreText, { color: colors.tintText }]}>Load more</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        {selectedReportType === 'funyula' && funyulaReportType === 'volunteer' && (
          <>
            {volunteersLoading && !volunteersData ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <ThemedText style={styles.loadingText}>Loading Funyula volunteers…</ThemedText>
              </View>
            ) : (
              <>
                {volunteersError && (
                  <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                    <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
                    <ThemedText style={[styles.errorText, { color: colors.errorText }]}>Error: {volunteersError}</ThemedText>
                  </View>
                )}
                {volunteersData && (
                  <>
                    <View style={styles.section}>
                      {volunteersData.data.map((volunteer: Volunteer) => (
                        <View
                          key={volunteer.id}
                          style={[styles.riseItemCard, { backgroundColor: cardBackground, borderColor }]}>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Full Name</ThemedText>
                            <ThemedText style={styles.volunteerValuePrimary}>
                              {volunteer.fullName}
                            </ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Ward</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{volunteer.ward}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Location</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{volunteer.location}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Sub Location</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{volunteer.subLocation}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Polling Station</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{volunteer.pollingStation}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Phone</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{volunteer.phone}</ThemedText>
                          </View>
                        </View>
                      ))}
                    </View>
                    <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
                      <View style={styles.paginationRow}>
                        <MaterialIcons name="info-outline" size={20} color={colors.icon} />
                        <ThemedText style={styles.paginationText}>
                          Total {volunteersData.pagination.totalCount} volunteers
                        </ThemedText>
                      </View>
                      <View style={styles.paginationRow}>
                        <MaterialIcons name="list" size={20} color={colors.icon} />
                        <ThemedText style={styles.paginationText}>
                          Offset {volunteersData.pagination.offset} / Limit {volunteersData.pagination.limit}
                        </ThemedText>
                      </View>
                    </View>
                    {volunteersData.pagination.offset + volunteersData.pagination.limit <
                      volunteersData.pagination.totalCount && (
                        <TouchableOpacity
                          style={[styles.loadMoreButton, { backgroundColor: colors.tint }]}
                          onPress={loadMoreVolunteers}
                          activeOpacity={0.85}
                          disabled={volunteersLoadingMore}>
                          {volunteersLoadingMore ? (
                            <View style={styles.loadMoreInner}>
                              <ActivityIndicator size="small" color={colors.tintText} />
                              <ThemedText style={[styles.loadMoreText, { color: colors.tintText }]}>
                                Loading more…
                              </ThemedText>
                            </View>
                          ) : (
                            <View style={styles.loadMoreInner}>
                              <MaterialIcons name="expand-more" size={20} color={colors.tintText} />
                              <ThemedText style={[styles.loadMoreText, { color: colors.tintText }]}>Load more</ThemedText>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {!loading && !error && selectedReportType === 'rise' && (
          <>
            {riseReportType === null ? (
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
                    <View style={styles.section}>
                      {riseData.data.map((item: RiseReportItem) => (
                        <View
                          key={item.id}
                          style={[styles.riseItemCard, { backgroundColor: cardBackground, borderColor }]}>
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
                      ))}
                    </View>
                    <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
                      <View style={styles.paginationRow}>
                        <MaterialIcons name="info-outline" size={20} color={colors.icon} />
                        <ThemedText style={styles.paginationText}>
                          Page {riseData.pagination.page} of {riseData.pagination.totalPages}
                        </ThemedText>
                      </View>
                      <View style={styles.paginationRow}>
                        <MaterialIcons name="list" size={20} color={colors.icon} />
                        <ThemedText style={styles.paginationText}>
                          {riseData.pagination.total} total
                        </ThemedText>
                      </View>
                    </View>
                    {riseData.pagination.page < riseData.pagination.totalPages && (
                      <TouchableOpacity
                        style={[styles.loadMoreButton, { backgroundColor: colors.tint }]}
                        onPress={loadMoreRiseReport}
                        activeOpacity={0.85}
                        disabled={riseLoadingMore}>
                        {riseLoadingMore ? (
                          <View style={styles.loadMoreInner}>
                            <ActivityIndicator size="small" color={colors.tintText} />
                            <ThemedText style={[styles.loadMoreText, { color: colors.tintText }]}>Loading more…</ThemedText>
                          </View>
                        ) : (
                          <View style={styles.loadMoreInner}>
                            <MaterialIcons name="expand-more" size={20} color={colors.tintText} />
                            <ThemedText style={[styles.loadMoreText, { color: colors.tintText }]}>Load more</ThemedText>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {!loading && !error && !selectedReportType && (
          <View style={styles.centerContainer}>
            <MaterialIcons name="dashboard" size={64} color={colors.icon} />
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Select a Report Type
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              Choose Funyula or RISE from the menu to view reports.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <CustomDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onMenuItemSelect={handleMenuItemSelect}
      />
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
  menuButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  paymentCount: {
    fontSize: 14,
    opacity: 0.6,
  },
  paymentsHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    borderWidth: 0,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIconContainer: {
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusGrid: {
    gap: 12,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusCount: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 4,
  },
  statusAmount: {
    fontSize: 16,
  },
  paymentCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentId: {
    fontSize: 15,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
    opacity: 0.5,
  },
  paymentDetails: {
    gap: 12,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentDetailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  paymentDetailText: {
    fontSize: 14,
    opacity: 0.7,
  },
  paymentDetailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  paymentAmount: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  loadMoreButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
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
  volunteerField: {
    marginBottom: 10,
  },
  volunteerLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 4,
  },
  volunteerValuePrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  volunteerValueSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
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
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
