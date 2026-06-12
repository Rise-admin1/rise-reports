import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  deleteExpoRegistrationById,
  deleteVolunteerById,
  fetchAllExpoRegistrationsForPdf,
  fetchAllFunyulaReportsForPdf,
  fetchAllFunyulaVolunteersForPdf,
  fetchExpoRegistrations,
  fetchFunyulaReports,
  fetchFunyulaVolunteers,
  fetchManifestoUsers,
} from '@/services/api';
import {
  ExpoRegistration,
  ExpoFieldFilters,
  ExpoRegistrationsResponse,
  FunyulaReportsResponse,
  ManifestoUser,
  ManifestoUsersResponse,
  Payment,
  Volunteer,
  VolunteerFieldFilters,
  VolunteerGenderFilter,
  VolunteerRoleFilter,
  VolunteersResponse,
} from '@/types/reports';
import {
  buildFunyulaContributionsPdfHtml,
  buildFunyulaVolunteersPdfHtml,
  buildSamiaWomenPdfHtml,
  exportHtmlToPdf,
} from '@/utils/reportPdf';
import { formatVolunteerGender, formatVolunteerRole } from '@/utils/volunteerDisplay';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FunyulaScreen() {
  const [funyulaReportType, setFunyulaReportType] = useState<
    'contributions' | 'volunteer' | 'samia-women' | 'manifesto-users' | null
  >(
    null
  );
  const [reportsData, setReportsData] = useState<FunyulaReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(10);
  const [showSuccessOnly, setShowSuccessOnly] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [expoSearchInput, setExpoSearchInput] = useState('');
  const [expoSearchQuery, setExpoSearchQuery] = useState('');
  const [expoFieldFilters, setExpoFieldFilters] = useState<ExpoFieldFilters>({
    groupName: '',
    designation: '',
    groupLeaderName: '',
    yourName: '',
    phoneNumber: '',
  });

  const [volunteersData, setVolunteersData] = useState<VolunteersResponse | null>(null);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [volunteersError, setVolunteersError] = useState<string | null>(null);
  const [volunteersPage, setVolunteersPage] = useState(1);
  const [showVolunteerFilters, setShowVolunteerFilters] = useState(false);
  const [volunteerRoleFilter, setVolunteerRoleFilter] = useState<VolunteerRoleFilter>('ALL');
  const [volunteerGenderFilter, setVolunteerGenderFilter] = useState<VolunteerGenderFilter>('ALL');
  const [volunteerSearchInput, setVolunteerSearchInput] = useState('');
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState('');
  const [volunteerFieldFilters, setVolunteerFieldFilters] = useState<VolunteerFieldFilters>({
    phone: '',
    ward: '',
    location: '',
    subLocation: '',
    pollingStation: '',
  });
  const [expoRegistrationsData, setExpoRegistrationsData] = useState<ExpoRegistrationsResponse | null>(null);
  const [expoRegistrationsLoading, setExpoRegistrationsLoading] = useState(false);
  const [expoRegistrationsError, setExpoRegistrationsError] = useState<string | null>(null);
  const [expoPage, setExpoPage] = useState(1);
  const [showExpoFilters, setShowExpoFilters] = useState(false);
  const [deletingVolunteerId, setDeletingVolunteerId] = useState<string | null>(null);
  const [deletingExpoId, setDeletingExpoId] = useState<string | null>(null);
  const [manifestoUsersData, setManifestoUsersData] = useState<ManifestoUsersResponse | null>(null);
  const [manifestoUsersLoading, setManifestoUsersLoading] = useState(false);
  const [manifestoUsersError, setManifestoUsersError] = useState<string | null>(null);

  const [pdfExporting, setPdfExporting] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;


  const loadFunyulaReports = async ({ nextPage }: { nextPage: number }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFunyulaReports(nextPage, limit);
      setReportsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadVolunteersPage = async (nextPage: number) => {
    if (nextPage < 1) return;
    setVolunteersLoading(true);
    setVolunteersError(null);
    try {
      const offset = (nextPage - 1) * limit;
      const data = await fetchFunyulaVolunteers(offset, limit, {
        roleFilter: volunteerRoleFilter,
        genderFilter: volunteerGenderFilter,
        search: volunteerSearchQuery,
        filters: volunteerFieldFilters,
      });
      setVolunteersData(data);
      setVolunteersPage(nextPage);
    } catch (err) {
      setVolunteersError(err instanceof Error ? err.message : 'Failed to load Funyula volunteers');
    } finally {
      setVolunteersLoading(false);
    }
  };

  const loadExpoPage = async (nextPage: number) => {
    if (nextPage < 1) return;
    setExpoRegistrationsLoading(true);
    setExpoRegistrationsError(null);
    try {
      const offset = (nextPage - 1) * limit;
      const data = await fetchExpoRegistrations(offset, limit, {
        search: expoSearchQuery,
        filters: expoFieldFilters,
      });
      setExpoRegistrationsData(data);
      setExpoPage(nextPage);
    } catch (err) {
      setExpoRegistrationsError(err instanceof Error ? err.message : 'Failed to load Samia women registrations');
    } finally {
      setExpoRegistrationsLoading(false);
    }
  };

  const loadManifestoUsers = async () => {
    setManifestoUsersLoading(true);
    setManifestoUsersError(null);
    try {
      const data = await fetchManifestoUsers();
      setManifestoUsersData(data);
    } catch (err) {
      setManifestoUsersError(err instanceof Error ? err.message : 'Failed to load manifesto users');
    } finally {
      setManifestoUsersLoading(false);
    }
  };

  const confirmDeleteVolunteer = (volunteer: Volunteer) => {
    Alert.alert('Delete volunteer', `Remove ${volunteer.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!volunteersData) return;
            const wasOnlyOnPage = volunteersData.data.length === 1;
            const pageAfterDelete = wasOnlyOnPage && volunteersPage > 1 ? volunteersPage - 1 : volunteersPage;
            setDeletingVolunteerId(volunteer.id);
            try {
              await deleteVolunteerById(volunteer.id);
              await loadVolunteersPage(pageAfterDelete);
            } catch (err) {
              Alert.alert('Delete failed', err instanceof Error ? err.message : 'Unknown error');
            } finally {
              setDeletingVolunteerId(null);
            }
          })();
        },
      },
    ]);
  };

  const confirmDeleteExpoRegistration = (registration: ExpoRegistration) => {
    Alert.alert('Delete registration', `Remove registration for ${registration.groupName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!expoRegistrationsData) return;
            const wasOnlyOnPage = expoRegistrationsData.data.length === 1;
            const pageAfterDelete = wasOnlyOnPage && expoPage > 1 ? expoPage - 1 : expoPage;
            setDeletingExpoId(registration.id);
            try {
              await deleteExpoRegistrationById(registration.id);
              await loadExpoPage(pageAfterDelete);
            } catch (err) {
              Alert.alert('Delete failed', err instanceof Error ? err.message : 'Unknown error');
            } finally {
              setDeletingExpoId(null);
            }
          })();
        },
      },
    ]);
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

  const volunteerPdfFileBase: Record<VolunteerRoleFilter, string> = {
    ALL: 'funyula_volunteers_all',
    POLLING_AGENT: 'funyula_volunteers_polling_agent',
    BLOGGING_TEAM: 'funyula_volunteers_blogging_team',
    VOTER: 'funyula_volunteers_voter',
  };

  const runVolunteerPdfWithRoleFilter = (roleFilter: VolunteerRoleFilter) => {
    void runPdfExport(volunteerPdfFileBase[roleFilter], async () => {
      const data = await fetchAllFunyulaVolunteersForPdf({
        roleFilter,
        genderFilter: volunteerGenderFilter,
        search: volunteerSearchQuery,
        filters: volunteerFieldFilters,
      });
      return buildFunyulaVolunteersPdfHtml(data, {
        roleFilter,
        genderFilter: volunteerGenderFilter,
        search: volunteerSearchQuery,
      });
    });
  };

  const volunteerRoleLabel = (value: VolunteerRoleFilter) => {
    switch (value) {
      case 'POLLING_AGENT':
        return 'Polling Agent';
      case 'BLOGGING_TEAM':
        return 'Blogging Team';
      case 'VOTER':
        return 'Voter';
      default:
        return 'All roles';
    }
  };

  const volunteerGenderLabel = (value: VolunteerGenderFilter) => {
    switch (value) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      default:
        return 'All genders';
    }
  };

  const promptVolunteerRoleFilter = () => {
    Alert.alert('Filter by role', 'Choose role filter.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'All roles', onPress: () => setVolunteerRoleFilter('ALL') },
      { text: 'Polling Agent', onPress: () => setVolunteerRoleFilter('POLLING_AGENT') },
      { text: 'Blogging Team', onPress: () => setVolunteerRoleFilter('BLOGGING_TEAM') },
      { text: 'Voter', onPress: () => setVolunteerRoleFilter('VOTER') },
    ]);
  };

  const promptVolunteerGenderFilter = () => {
    Alert.alert('Filter by gender', 'Choose gender filter.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'All genders', onPress: () => setVolunteerGenderFilter('ALL') },
      { text: 'Male', onPress: () => setVolunteerGenderFilter('MALE') },
      { text: 'Female', onPress: () => setVolunteerGenderFilter('FEMALE') },
    ]);
  };

  const promptVolunteerPdfRole = () => {
    Alert.alert('Volunteer PDF', 'Download current filtered data as PDF?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Download', onPress: () => runVolunteerPdfWithRoleFilter(volunteerRoleFilter) },
    ]);
  };

  const updateExpoFieldFilter = (key: keyof ExpoFieldFilters, value: string) => {
    setExpoFieldFilters((prev) => ({ ...prev, [key]: value }));
  };

  const promptExpoDesignationFilter = () => {
    Alert.alert('Filter by designation', 'Choose designation.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'All designations', onPress: () => updateExpoFieldFilter('designation', '') },
      { text: 'Official', onPress: () => updateExpoFieldFilter('designation', 'Official') },
      { text: 'Member', onPress: () => updateExpoFieldFilter('designation', 'Member') },
    ]);
  };

  const updateVolunteerFieldFilter = (key: keyof VolunteerFieldFilters, value: string) => {
    setVolunteerFieldFilters((prev) => ({ ...prev, [key]: value }));
  };

  const basePayments =
    reportsData
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
  const displayedExpoRegistrations = expoRegistrationsData?.data ?? [];

  useEffect(() => {
    if (funyulaReportType !== 'samia-women') return;
    void loadExpoPage(1);
  }, [funyulaReportType, expoSearchQuery, expoFieldFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExpoSearchQuery(expoSearchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [expoSearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVolunteerSearchQuery(volunteerSearchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [volunteerSearchInput]);

  useEffect(() => {
    if (funyulaReportType !== 'volunteer') return;
    void loadVolunteersPage(1);
  }, [
    funyulaReportType,
    volunteerRoleFilter,
    volunteerGenderFilter,
    volunteerSearchQuery,
    volunteerFieldFilters,
  ]);

  const { refreshing, onRefresh } = useRefreshControl(
    useCallback(async () => {
      switch (funyulaReportType) {
        case 'contributions':
          if (reportsData) {
            await loadFunyulaReports({ nextPage: reportsData.data.pagination.currentPage });
          }
          break;
        case 'volunteer':
          await loadVolunteersPage(volunteersPage);
          break;
        case 'samia-women':
          await loadExpoPage(expoPage);
          break;
        case 'manifesto-users':
          await loadManifestoUsers();
          break;
        default:
          break;
      }
    }, [
      funyulaReportType,
      reportsData,
      volunteersPage,
      expoPage,
    ])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          onPress={() => (funyulaReportType === null ? router.back() : undefined)}
          disabled={funyulaReportType !== null}
          style={styles.headerTitleWrap}
          accessibilityLabel="Back to home">
          <ThemedText type="title" style={styles.headerTitle}>
            Funyula
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
        {loading && funyulaReportType === 'contributions' && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>Loading reports...</ThemedText>
          </View>
        )}

        {error && funyulaReportType === 'contributions' && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
            <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
            <ThemedText style={[styles.errorText, { color: colors.errorText }]}>Error: {error}</ThemedText>
          </View>
        )}

        {funyulaReportType !== null && (
          <View style={[styles.riseReportHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              onPress={() => {
                setFunyulaReportType(null);
                setReportsData(null);
                setError(null);
                setLoading(false);
                setVolunteersData(null);
                setVolunteersError(null);
                setVolunteersLoading(false);
                setVolunteersPage(1);
                setShowVolunteerFilters(false);
                setVolunteerRoleFilter('ALL');
                setVolunteerGenderFilter('ALL');
                setVolunteerSearchInput('');
                setVolunteerSearchQuery('');
                setVolunteerFieldFilters({
                  phone: '',
                  ward: '',
                  location: '',
                  subLocation: '',
                  pollingStation: '',
                });
                setExpoRegistrationsData(null);
                setExpoRegistrationsError(null);
                setExpoRegistrationsLoading(false);
                setExpoPage(1);
                setShowExpoFilters(false);
                setExpoSearchInput('');
                setExpoSearchQuery('');
                setExpoFieldFilters({
                  groupName: '',
                  designation: '',
                  groupLeaderName: '',
                  yourName: '',
                  phoneNumber: '',
                });
                setManifestoUsersData(null);
                setManifestoUsersError(null);
                setManifestoUsersLoading(false);
              }}
              style={styles.riseBackRow}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              <ThemedText style={styles.riseBackText}>
                {funyulaReportType === 'contributions'
                  ? 'Funyula Contributions'
                  : funyulaReportType === 'volunteer'
                    ? 'Funyula Volunteer'
                    : funyulaReportType === 'samia-women'
                      ? 'Samia Women Registration'
                      : 'Get User Manifesto'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {funyulaReportType === null && (
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
                setVolunteersPage(1);
                setShowVolunteerFilters(false);
                setVolunteerRoleFilter('ALL');
                setVolunteerGenderFilter('ALL');
                setVolunteerSearchInput('');
                setVolunteerSearchQuery('');
                setVolunteerFieldFilters({
                  phone: '',
                  ward: '',
                  location: '',
                  subLocation: '',
                  pollingStation: '',
                });
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
            <TouchableOpacity
              style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => {
                setFunyulaReportType('samia-women');
                setExpoPage(1);
                setShowExpoFilters(false);
                setExpoSearchInput('');
                setExpoSearchQuery('');
                setExpoFieldFilters({
                  groupName: '',
                  designation: '',
                  groupLeaderName: '',
                  yourName: '',
                  phoneNumber: '',
                });
              }}
              activeOpacity={0.85}>
              <View style={styles.riseReportCardContent}>
                <MaterialIcons name="person-add-alt-1" size={32} color={colors.tint} />
                <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                  Samia Women Registration
                </ThemedText>
                <ThemedText style={styles.riseReportCardDesc}>GET /volunteer/expo-register/all</ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.riseReportCard, { backgroundColor: cardBackground, borderColor }]}
              onPress={() => {
                setFunyulaReportType('manifesto-users');
                setManifestoUsersData(null);
                setManifestoUsersError(null);
                setManifestoUsersLoading(false);
                void loadManifestoUsers();
              }}
              activeOpacity={0.85}>
              <View style={styles.riseReportCardContent}>
                <MaterialIcons name="fact-check" size={32} color={colors.tint} />
                <ThemedText type="subtitle" style={styles.riseReportCardTitle}>
                  Get User Manifesto
                </ThemedText>
                <ThemedText style={styles.riseReportCardDesc}>GET /volunteer/get-manifesto-users</ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>
          </>
        )}

        {!loading && !error && funyulaReportType === 'contributions' && reportsData && (
          <>
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
                runPdfExport('funyula_contributions', async () => {
                  const data = await fetchAllFunyulaReportsForPdf();
                  return buildFunyulaContributionsPdfHtml(data);
                })
              }
              activeOpacity={0.85}
              disabled={pdfExporting}
              accessibilityLabel="Download contributions report as PDF">
              {pdfExporting ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <MaterialIcons name="picture-as-pdf" size={22} color={colors.tint} />
              )}
              <ThemedText style={[styles.pdfDownloadButtonText, { color: colors.tint }]}>
                Download as PDF
              </ThemedText>
            </TouchableOpacity>
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
              {displayedPayments.map((payment: Payment) => {
                const paymentRowId =
                  (reportsData.data.pagination.currentPage - 1) * limit +
                  Math.max(0, basePayments.indexOf(payment)) +
                  1;
                return (
                <View
                  key={payment.id}
                  style={[styles.paymentCard, { backgroundColor: cardBackground, borderColor }]}>
                  <View style={styles.cardIdRow}>
                    <View style={[styles.cardIdBadge, { backgroundColor: colors.buttonSecondary, borderColor }]}>
                      <ThemedText type="defaultSemiBold" style={[styles.cardIdText, { color: colors.tint }]}>
                        ID {paymentRowId}
                      </ThemedText>
                    </View>
                  </View>
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
              );
              })}
            </View>

            <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.paginationRow}>
                <MaterialIcons name="list" size={20} color={colors.icon} />
                <ThemedText style={styles.paginationText}>
                  {reportsData.data.pagination.totalCount} total transactions · {limit} per page
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
                      loading || reportsData.data.pagination.currentPage <= 1 ? 0.45 : 1,
                  },
                ]}
                onPress={() =>
                  loadFunyulaReports({ nextPage: reportsData.data.pagination.currentPage - 1 })
                }
                disabled={loading || reportsData.data.pagination.currentPage <= 1}
                accessibilityLabel="Previous page">
                <MaterialIcons name="chevron-left" size={22} color={colors.text} />
                <ThemedText style={styles.paginationNavLabel}>Previous</ThemedText>
              </TouchableOpacity>
              <View style={styles.paginationNavCenter}>
                <ThemedText style={styles.paginationNavPageText}>
                  Page {reportsData.data.pagination.currentPage} of {reportsData.data.pagination.totalPages}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[
                  styles.paginationNavButton,
                  {
                    backgroundColor: colors.buttonSecondary,
                    borderColor,
                    opacity:
                      loading || !reportsData.data.pagination.hasNextPage ? 0.45 : 1,
                  },
                ]}
                onPress={() =>
                  loadFunyulaReports({ nextPage: reportsData.data.pagination.currentPage + 1 })
                }
                disabled={loading || !reportsData.data.pagination.hasNextPage}
                accessibilityLabel="Next page">
                <ThemedText style={styles.paginationNavLabel}>Next</ThemedText>
                <MaterialIcons name="chevron-right" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {funyulaReportType === 'volunteer' && (
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
                    <TouchableOpacity
                      style={[
                        styles.pdfDownloadButton,
                        {
                          borderColor: colors.tint,
                          backgroundColor: colors.buttonSecondary,
                          opacity: pdfExporting ? 0.65 : 1,
                        },
                      ]}
                      onPress={() => promptVolunteerPdfRole()}
                      activeOpacity={0.85}
                      disabled={pdfExporting}
                      accessibilityLabel="Download volunteers report as PDF">
                      {pdfExporting ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <MaterialIcons name="picture-as-pdf" size={22} color={colors.tint} />
                      )}
                      <ThemedText style={[styles.pdfDownloadButtonText, { color: colors.tint }]}>
                        Download as PDF
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterIconButton, { backgroundColor: colors.buttonSecondary, borderColor }]}
                      onPress={() => setShowVolunteerFilters((prev) => !prev)}
                      activeOpacity={0.85}
                      accessibilityLabel="Toggle volunteer filters">
                      <MaterialIcons name="filter-list" size={20} color={colors.tint} />
                      <ThemedText style={[styles.filterIconButtonText, { color: colors.tint }]}>
                        {showVolunteerFilters ? 'Hide filters' : 'Show filters'}
                      </ThemedText>
                    </TouchableOpacity>
                    {showVolunteerFilters && (
                      <>
                        <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                          <MaterialIcons name="search" size={20} color={colors.icon} />
                          <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search volunteers"
                            placeholderTextColor={colors.icon}
                            value={volunteerSearchInput}
                            onChangeText={setVolunteerSearchInput}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                          />
                          {volunteerSearchInput.length > 0 && (
                            <TouchableOpacity
                              onPress={() => setVolunteerSearchInput('')}
                              accessibilityLabel="Clear volunteer search">
                              <MaterialIcons name="close" size={20} color={colors.icon} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={styles.section}>
                          <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                            <MaterialIcons name="phone" size={20} color={colors.icon} />
                            <TextInput
                              style={[styles.searchInput, { color: colors.text }]}
                              placeholder="Filter by phone number"
                              placeholderTextColor={colors.icon}
                              value={volunteerFieldFilters.phone ?? ''}
                              onChangeText={(value) => updateVolunteerFieldFilter('phone', value)}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="phone-pad"
                            />
                          </View>
                          <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                            <MaterialIcons name="map" size={20} color={colors.icon} />
                            <TextInput
                              style={[styles.searchInput, { color: colors.text }]}
                              placeholder="Filter by ward"
                              placeholderTextColor={colors.icon}
                              value={volunteerFieldFilters.ward ?? ''}
                              onChangeText={(value) => updateVolunteerFieldFilter('ward', value)}
                              autoCapitalize="words"
                              autoCorrect={false}
                            />
                          </View>
                          <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                            <MaterialIcons name="place" size={20} color={colors.icon} />
                            <TextInput
                              style={[styles.searchInput, { color: colors.text }]}
                              placeholder="Filter by location"
                              placeholderTextColor={colors.icon}
                              value={volunteerFieldFilters.location ?? ''}
                              onChangeText={(value) => updateVolunteerFieldFilter('location', value)}
                              autoCapitalize="words"
                              autoCorrect={false}
                            />
                          </View>
                          <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                            <MaterialIcons name="location-on" size={20} color={colors.icon} />
                            <TextInput
                              style={[styles.searchInput, { color: colors.text }]}
                              placeholder="Filter by sub location"
                              placeholderTextColor={colors.icon}
                              value={volunteerFieldFilters.subLocation ?? ''}
                              onChangeText={(value) => updateVolunteerFieldFilter('subLocation', value)}
                              autoCapitalize="words"
                              autoCorrect={false}
                            />
                          </View>
                          <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                            <MaterialIcons name="how-to-vote" size={20} color={colors.icon} />
                            <TextInput
                              style={[styles.searchInput, { color: colors.text }]}
                              placeholder="Filter by polling station"
                              placeholderTextColor={colors.icon}
                              value={volunteerFieldFilters.pollingStation ?? ''}
                              onChangeText={(value) => updateVolunteerFieldFilter('pollingStation', value)}
                              autoCapitalize="words"
                              autoCorrect={false}
                            />
                          </View>
                        </View>
                        <View style={styles.filterPills}>
                          <TouchableOpacity
                            style={[
                              styles.filterPill,
                              {
                                backgroundColor: colors.buttonSecondary,
                                borderColor,
                              },
                            ]}
                            onPress={promptVolunteerRoleFilter}
                            activeOpacity={0.8}>
                            <ThemedText style={[styles.filterPillText, { color: colors.buttonSecondaryText }]}>
                              {volunteerRoleLabel(volunteerRoleFilter)}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.filterPill,
                              {
                                backgroundColor: colors.buttonSecondary,
                                borderColor,
                              },
                            ]}
                            onPress={promptVolunteerGenderFilter}
                            activeOpacity={0.8}>
                            <ThemedText style={[styles.filterPillText, { color: colors.buttonSecondaryText }]}>
                              {volunteerGenderLabel(volunteerGenderFilter)}
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                    <View style={styles.section}>
                      {volunteersData.data.map((volunteer: Volunteer, vIndex: number) => {
                        const volunteerRowId = (volunteersPage - 1) * limit + vIndex + 1;
                        return (
                          <View
                            key={volunteer.id}
                            style={[styles.riseItemCard, { backgroundColor: cardBackground, borderColor }]}>
                            <View style={styles.cardIdRow}>
                              <View style={[styles.cardIdBadge, { backgroundColor: colors.buttonSecondary, borderColor }]}>
                                <ThemedText type="defaultSemiBold" style={[styles.cardIdText, { color: colors.tint }]}>
                                  ID {volunteerRowId}
                                </ThemedText>
                              </View>
                            </View>
                            <View style={styles.volunteerField}>
                              <ThemedText style={styles.volunteerLabel}>Full Name</ThemedText>
                              <ThemedText style={styles.volunteerValuePrimary}>
                                {volunteer.fullName}
                              </ThemedText>
                            </View>
                            <View style={styles.volunteerField}>
                              <ThemedText style={styles.volunteerLabel}>Role</ThemedText>
                              <ThemedText style={styles.volunteerValueSecondary}>
                                {formatVolunteerRole(volunteer.role)}
                              </ThemedText>
                            </View>
                            <View style={styles.volunteerField}>
                              <ThemedText style={styles.volunteerLabel}>Gender</ThemedText>
                              <ThemedText style={styles.volunteerValueSecondary}>
                                {formatVolunteerGender(volunteer.gender)}
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
                            <View style={styles.volunteerField}>
                              <ThemedText style={styles.volunteerLabel}>Date and Time Registered</ThemedText>
                              <ThemedText style={styles.volunteerValueSecondary}>
                                {formatRiseDate(volunteer.createdAt)}
                              </ThemedText>
                            </View>
                            <TouchableOpacity
                              style={[styles.cardDeleteButton, { borderColor: colors.error }]}
                              onPress={() => confirmDeleteVolunteer(volunteer)}
                              disabled={deletingVolunteerId !== null || volunteersLoading}
                              activeOpacity={0.8}
                              accessibilityLabel="Delete volunteer">
                              {deletingVolunteerId === volunteer.id ? (
                                <ActivityIndicator size="small" color={colors.error} />
                              ) : (
                                <>
                                  <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                                  <ThemedText style={[styles.cardDeleteLabel, { color: colors.error }]}>
                                    Delete
                                  </ThemedText>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                    <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
                      <View style={styles.paginationRow}>
                        <MaterialIcons name="list" size={20} color={colors.icon} />
                        <ThemedText style={styles.paginationText}>
                          Total {volunteersData.pagination.totalCount} volunteers · {limit} per page
                        </ThemedText>
                      </View>
                    </View>
                    {(() => {
                      const vTotal = volunteersData.pagination.totalCount;
                      const vPerPage = volunteersData.pagination.limit || limit;
                      const vTotalPages = Math.max(1, Math.ceil(vTotal / vPerPage));
                      return (
                        <View style={styles.paginationNav}>
                          <TouchableOpacity
                            style={[
                              styles.paginationNavButton,
                              {
                                backgroundColor: colors.buttonSecondary,
                                borderColor,
                                opacity: volunteersLoading || volunteersPage <= 1 ? 0.45 : 1,
                              },
                            ]}
                            onPress={() => loadVolunteersPage(volunteersPage - 1)}
                            disabled={volunteersLoading || volunteersPage <= 1}
                            accessibilityLabel="Previous page">
                            <MaterialIcons name="chevron-left" size={22} color={colors.text} />
                            <ThemedText style={styles.paginationNavLabel}>Previous</ThemedText>
                          </TouchableOpacity>
                          <View style={styles.paginationNavCenter}>
                            <ThemedText style={styles.paginationNavPageText}>
                              Page {volunteersPage} of {vTotalPages}
                            </ThemedText>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.paginationNavButton,
                              {
                                backgroundColor: colors.buttonSecondary,
                                borderColor,
                                opacity:
                                  volunteersLoading || volunteersPage >= vTotalPages ? 0.45 : 1,
                              },
                            ]}
                            onPress={() => loadVolunteersPage(volunteersPage + 1)}
                            disabled={volunteersLoading || volunteersPage >= vTotalPages}
                            accessibilityLabel="Next page">
                            <ThemedText style={styles.paginationNavLabel}>Next</ThemedText>
                            <MaterialIcons name="chevron-right" size={22} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </>
        )}

        {funyulaReportType === 'samia-women' && (
          <>
            {expoRegistrationsLoading && !expoRegistrationsData ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <ThemedText style={styles.loadingText}>Loading Samia women registrations…</ThemedText>
              </View>
            ) : (
              <>
                {expoRegistrationsError && (
                  <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                    <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
                    <ThemedText style={[styles.errorText, { color: colors.errorText }]}>
                      Error: {expoRegistrationsError}
                    </ThemedText>
                  </View>
                )}
                {expoRegistrationsData && (
                  <>
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
                        runPdfExport('samia_women_registration', async () => {
                          const data = await fetchAllExpoRegistrationsForPdf({
                            search: expoSearchQuery,
                            filters: expoFieldFilters,
                          });
                          return buildSamiaWomenPdfHtml(data);
                        })
                      }
                      activeOpacity={0.85}
                      disabled={pdfExporting}
                      accessibilityLabel="Download Samia women registrations as PDF">
                      {pdfExporting ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <MaterialIcons name="picture-as-pdf" size={22} color={colors.tint} />
                      )}
                      <ThemedText style={[styles.pdfDownloadButtonText, { color: colors.tint }]}>
                        Download as PDF
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterIconButton, { backgroundColor: colors.buttonSecondary, borderColor }]}
                      onPress={() => setShowExpoFilters((prev) => !prev)}
                      activeOpacity={0.85}
                      accessibilityLabel="Toggle registration filters">
                      <MaterialIcons name="filter-list" size={20} color={colors.tint} />
                      <ThemedText style={[styles.filterIconButtonText, { color: colors.tint }]}>
                        {showExpoFilters ? 'Hide filters' : 'Show filters'}
                      </ThemedText>
                    </TouchableOpacity>
                    {showExpoFilters && (
                      <>
                        <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                          <MaterialIcons name="search" size={20} color={colors.icon} />
                          <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search registrations"
                            placeholderTextColor={colors.icon}
                            value={expoSearchInput}
                            onChangeText={setExpoSearchInput}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                          />
                          {expoSearchInput.length > 0 && (
                            <TouchableOpacity
                              onPress={() => setExpoSearchInput('')}
                              accessibilityLabel="Clear registration search">
                              <MaterialIcons name="close" size={20} color={colors.icon} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                          <MaterialIcons name="group" size={20} color={colors.icon} />
                          <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Filter by Group Name"
                            placeholderTextColor={colors.icon}
                            value={expoFieldFilters.groupName ?? ''}
                            onChangeText={(value) => updateExpoFieldFilter('groupName', value)}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                          />
                        </View>
                        <View style={styles.filterPills}>
                          <TouchableOpacity
                            style={[
                              styles.filterPill,
                              {
                                backgroundColor: colors.buttonSecondary,
                                borderColor,
                              },
                            ]}
                            onPress={promptExpoDesignationFilter}
                            activeOpacity={0.8}>
                            <ThemedText style={[styles.filterPillText, { color: colors.buttonSecondaryText }]}>
                              {expoFieldFilters.designation?.trim()
                                ? `Designation: ${expoFieldFilters.designation}`
                                : 'Designation: All'}
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                          <MaterialIcons name="person" size={20} color={colors.icon} />
                          <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Filter by Group Leader Name"
                            placeholderTextColor={colors.icon}
                            value={expoFieldFilters.groupLeaderName ?? ''}
                            onChangeText={(value) => updateExpoFieldFilter('groupLeaderName', value)}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="done"
                          />
                        </View>
                        <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                          <MaterialIcons name="person-outline" size={20} color={colors.icon} />
                          <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Filter by Your Name"
                            placeholderTextColor={colors.icon}
                            value={expoFieldFilters.yourName ?? ''}
                            onChangeText={(value) => updateExpoFieldFilter('yourName', value)}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="done"
                          />
                        </View>
                        <View style={[styles.searchBarContainer, { backgroundColor: cardBackground, borderColor }]}>
                          <MaterialIcons name="phone" size={20} color={colors.icon} />
                          <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Filter by Phone Number"
                            placeholderTextColor={colors.icon}
                            value={expoFieldFilters.phoneNumber ?? ''}
                            onChangeText={(value) => updateExpoFieldFilter('phoneNumber', value)}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="phone-pad"
                            returnKeyType="done"
                          />
                        </View>
                        {(expoSearchInput.length > 0 ||
                          Object.values(expoFieldFilters).some((value) => (value ?? '').trim().length > 0)) && (
                            <TouchableOpacity
                              style={[styles.filterPill, { alignSelf: 'flex-start', backgroundColor: colors.buttonSecondary, borderColor }]}
                              onPress={() => {
                                setExpoSearchInput('');
                                setExpoSearchQuery('');
                                setExpoFieldFilters({
                                  groupName: '',
                                  designation: '',
                                  groupLeaderName: '',
                                  yourName: '',
                                  phoneNumber: '',
                                });
                              }}
                              accessibilityLabel="Clear registration filters">
                              <ThemedText style={[styles.filterPillText, { color: colors.buttonSecondaryText }]}>
                                Clear filters
                              </ThemedText>
                            </TouchableOpacity>
                          )}
                      </>
                    )}
                    <View style={styles.section}>
                      {displayedExpoRegistrations.map((registration: ExpoRegistration, eIndex: number) => {
                        const expoRowId = (expoPage - 1) * limit + eIndex + 1;
                        return (
                        <View
                          key={registration.id}
                          style={[styles.riseItemCard, { backgroundColor: cardBackground, borderColor }]}>
                          <View style={styles.cardIdRow}>
                            <View style={[styles.cardIdBadge, { backgroundColor: colors.buttonSecondary, borderColor }]}>
                              <ThemedText type="defaultSemiBold" style={[styles.cardIdText, { color: colors.tint }]}>
                                ID {expoRowId}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Group Name</ThemedText>
                            <ThemedText style={styles.volunteerValuePrimary}>{registration.groupName}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Designation</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{registration.designation}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Group Leader Name</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>
                              {registration.groupLeaderName}
                            </ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Your Name</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{registration.yourName}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>ID Number</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{registration.idNumber}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Phone Number</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{registration.phoneNumber}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Verified</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>
                              {registration.isVerified ? 'Yes' : 'No'}
                            </ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Date and Time Registered</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>
                              {formatRiseDate(registration.createdAt)}
                            </ThemedText>
                          </View>
                          <TouchableOpacity
                            style={[styles.cardDeleteButton, { borderColor: colors.error }]}
                            onPress={() => confirmDeleteExpoRegistration(registration)}
                            disabled={deletingExpoId !== null || expoRegistrationsLoading}
                            activeOpacity={0.8}
                            accessibilityLabel="Delete registration">
                            {deletingExpoId === registration.id ? (
                              <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                              <>
                                <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                                <ThemedText style={[styles.cardDeleteLabel, { color: colors.error }]}>
                                  Delete
                                </ThemedText>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                      })}
                      {displayedExpoRegistrations.length === 0 && (
                        <View style={[styles.emptyState, { backgroundColor: cardBackground, borderColor }]}>
                          <MaterialIcons name="search-off" size={22} color={colors.icon} />
                          <ThemedText style={styles.emptyStateText}>
                            No registrations match this selected group.
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
                      <View style={styles.paginationRow}>
                        <MaterialIcons name="list" size={20} color={colors.icon} />
                        <ThemedText style={styles.paginationText}>
                          Total {expoRegistrationsData.pagination.totalCount} registrations · {limit} per page
                        </ThemedText>
                      </View>
                    </View>
                    {(() => {
                      const eTotal = expoRegistrationsData.pagination.totalCount;
                      const ePerPage = expoRegistrationsData.pagination.limit || limit;
                      const eTotalPages = Math.max(1, Math.ceil(eTotal / ePerPage));
                      return (
                        <View style={styles.paginationNav}>
                          <TouchableOpacity
                            style={[
                              styles.paginationNavButton,
                              {
                                backgroundColor: colors.buttonSecondary,
                                borderColor,
                                opacity: expoRegistrationsLoading || expoPage <= 1 ? 0.45 : 1,
                              },
                            ]}
                            onPress={() => loadExpoPage(expoPage - 1)}
                            disabled={expoRegistrationsLoading || expoPage <= 1}
                            accessibilityLabel="Previous page">
                            <MaterialIcons name="chevron-left" size={22} color={colors.text} />
                            <ThemedText style={styles.paginationNavLabel}>Previous</ThemedText>
                          </TouchableOpacity>
                          <View style={styles.paginationNavCenter}>
                            <ThemedText style={styles.paginationNavPageText}>
                              Page {expoPage} of {eTotalPages}
                            </ThemedText>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.paginationNavButton,
                              {
                                backgroundColor: colors.buttonSecondary,
                                borderColor,
                                opacity:
                                  expoRegistrationsLoading || expoPage >= eTotalPages ? 0.45 : 1,
                              },
                            ]}
                            onPress={() => loadExpoPage(expoPage + 1)}
                            disabled={expoRegistrationsLoading || expoPage >= eTotalPages}
                            accessibilityLabel="Next page">
                            <ThemedText style={styles.paginationNavLabel}>Next</ThemedText>
                            <MaterialIcons name="chevron-right" size={22} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </>
        )}

        {funyulaReportType === 'manifesto-users' && (
          <>
            {manifestoUsersLoading && !manifestoUsersData ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <ThemedText style={styles.loadingText}>Loading manifesto users…</ThemedText>
              </View>
            ) : (
              <>
                {manifestoUsersError && (
                  <View style={[styles.errorContainer, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                    <MaterialIcons name="error-outline" size={24} color={colors.errorText} />
                    <ThemedText style={[styles.errorText, { color: colors.errorText }]}>Error: {manifestoUsersError}</ThemedText>
                  </View>
                )}
                {manifestoUsersData && (
                  <>
                    <View style={styles.section}>
                      {manifestoUsersData.data.map((user: ManifestoUser, mIndex: number) => (
                        <View
                          key={user.id}
                          style={[styles.riseItemCard, { backgroundColor: cardBackground, borderColor }]}>
                          <View style={styles.cardIdRow}>
                            <View style={[styles.cardIdBadge, { backgroundColor: colors.buttonSecondary, borderColor }]}>
                              <ThemedText type="defaultSemiBold" style={[styles.cardIdText, { color: colors.tint }]}>
                                ID {mIndex + 1}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Full Name</ThemedText>
                            <ThemedText style={styles.volunteerValuePrimary}>{user.fullName}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Phone</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>{user.phone}</ThemedText>
                          </View>
                          <View style={styles.volunteerField}>
                            <ThemedText style={styles.volunteerLabel}>Date and Time Registered</ThemedText>
                            <ThemedText style={styles.volunteerValueSecondary}>
                              {formatRiseDate(user.createdAt)}
                            </ThemedText>
                          </View>
                        </View>
                      ))}
                      {manifestoUsersData.data.length === 0 && (
                        <View style={[styles.emptyState, { backgroundColor: cardBackground, borderColor }]}>
                          <MaterialIcons name="search-off" size={22} color={colors.icon} />
                          <ThemedText style={styles.emptyStateText}>No manifesto users found.</ThemedText>
                        </View>
                      )}
                    </View>
                    <View style={[styles.paginationCard, { backgroundColor: cardBackground, borderColor }]}>
                      <View style={styles.paginationRow}>
                        <MaterialIcons name="list" size={20} color={colors.icon} />
                        <ThemedText style={styles.paginationText}>
                          Total {manifestoUsersData.data.length} manifesto users
                        </ThemedText>
                      </View>
                    </View>
                  </>
                )}
              </>
            )}
          </>
        )}

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
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyStateText: {
    fontSize: 14,
    opacity: 0.75,
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
  cardDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardDeleteLabel: {
    fontSize: 14,
    fontWeight: '700',
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
  homeReportCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  homeReportCardImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeReportCardImage: {
    width: 48,
    height: 48,
  },
  homeReportCardTitle: {
    marginTop: 0,
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
  },
  volunteerValueSecondary: {
    fontSize: 14,
    fontWeight: '600',
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
  filterIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  filterIconButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pdfDownloadButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
