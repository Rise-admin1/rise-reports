import { clearAppToken, getAppToken, setAppToken } from '@/services/appAuth';
import { clearVaultToken, getVaultToken, setVaultToken } from '@/services/vaultAuth';
import type {
  AppLoginResponse,
  AppMeResponse,
  AppRole,
  AppUser,
  AppUserResponse,
  AppUsersResponse,
  ReportPermission,
} from '@/types/appAuth';
import type {
  CoachAcademAbuseReport,
  CoachAcademOrganizationsResponse,
  CoachAcademParentsResponse,
  CoachAcademPendingSubject,
  CoachAcademPurchasesResponse,
  CoachAcademStatsResponse,
  CoachAcademTeachersResponse,
} from '@/types/coachAcadem';
import type {
  DubaiAnalyticaDriPaymentsResponse,
  DubaiAnalyticaPurchasesResponse,
  DubaiAnalyticaStatsResponse,
  DubaiAnalyticaSubscriptionsResponse,
  DubaiAnalyticaSurveysResponse,
  DubaiAnalyticaUsersResponse,
} from '@/types/dubaiAnalytica';
import {
  ExpoFieldFilters,
  ExpoRegistrationsResponse,
  FunyulaReportsResponse,
  ManifestoUsersResponse,
  RiseReportItem,
  RiseReportsResponse,
  VolunteerFieldFilters,
  VolunteerGenderFilter,
  VolunteerRoleFilter,
  VolunteersResponse,
} from '@/types/reports';
import type {
  SafariBooksBooksResponse,
  SafariBooksListenersResponse,
  SafariBooksPendingVerificationsResponse,
  SafariBooksPublishersResponse,
  SafariBooksStatsResponse,
} from '@/types/safariBooks';
import {
  AvailabilitySettingInput,
  GrantSessionCreditsResponse,
  SchedulingAppSource,
  SchedulingAvailabilitySettingResponse,
  SchedulingAvailabilitySettingsResponse,
  SchedulingBookingStatsResponse,
  SchedulingInviteResponse,
  SchedulingInviteType,
  SchedulingMeetingResponse,
  SchedulingMeetingsResponse,
  SchedulingMetricsResponse,
  SessionCreditsListResponse,
  SessionCreditsResponse,
} from '@/types/scheduling';
import type {
  ScientificJournalsArticlesResponse,
  ScientificJournalsFullIssuePurchasesResponse,
  ScientificJournalsPaymentsResponse,
  ScientificJournalsReviewersResponse,
  ScientificJournalsStatsResponse,
  ScientificJournalsSubscriptionsResponse,
  ScientificJournalsUsersResponse,
} from '@/types/scientificJournals';
import { Task, TaskAsset, TaskAssigneeUser, TaskStatus } from '@/types/tasks';
import {
  CreateVaultGuestAccessResponse,
  FetchVaultDocumentsResponse,
  FetchVaultGuestAccessResponse,
  VaultDocument,
  VaultLoginResponse,
  VaultMeResponse,
  VaultSession,
} from '@/types/vault';
import type {
  VeloAgentsResponse,
  VeloAppointmentRequestsResponse,
  VeloContactInquiriesResponse,
  VeloListingsResponse,
  VeloPurchasesResponse,
  VeloSendersResponse,
  VeloShipmentsResponse,
  VeloStatsResponse,
} from '@/types/velo';

/** BFF base — all non-Vault app traffic goes here */
const APP_API_BASE_URL = process.env.EXPO_PUBLIC_APP_API_URL || 'https://rise-reports.onrender.com/api';

/** Vault stays on mch-mp / Funyula host (not proxied by the BFF) */
const VAULT_API_BASE_URL = process.env.EXPO_PUBLIC_VAULT_API_URL || 'https://future.funyula.com/api';

const API_BASE_URL = APP_API_BASE_URL;
const SCHEDULING_API_BASE_URL = APP_API_BASE_URL;
/** RISE profile/investor routes are proxied under /api/rise on the BFF */
const RISE_API_BASE_URL = `${APP_API_BASE_URL}/rise`;

export class AppAuthError extends Error {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message);
    this.name = 'AppAuthError';
  }
}

async function appAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getAppToken();
  if (!token) {
    throw new AppAuthError('Not signed in');
  }
  return {
    Authorization: `Bearer ${token}`,
    ...(extra || {}),
  };
}

async function parseAppAuthError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message || fallback;
  if (response.status === 401) {
    await clearAppToken();
    throw new AppAuthError(message);
  }
  throw new Error(message);
}

async function appFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = await appAuthHeaders(
    (init.headers as Record<string, string> | undefined) || undefined
  );
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    await clearAppToken();
    throw new AppAuthError('Session expired. Please sign in again.');
  }
  return response;
}

export async function appLogin(username: string, password: string): Promise<AppLoginResponse['data']> {
  const response = await fetch(`${APP_API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Invalid username or password');
  }
  const json = (await response.json()) as AppLoginResponse;
  await setAppToken(json.data.token);
  return json.data;
}

export async function appLogout(): Promise<void> {
  try {
    const headers = await appAuthHeaders().catch(() => null);
    if (headers) {
      await fetch(`${APP_API_BASE_URL}/auth/logout`, { method: 'POST', headers }).catch(() => {});
    }
  } finally {
    await clearAppToken();
  }
}

export async function appMe(): Promise<AppMeResponse['data']> {
  const response = await appFetch(`${APP_API_BASE_URL}/auth/me`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  const json = (await response.json()) as AppMeResponse;
  return json.data;
}

export async function fetchAppUsers(): Promise<AppUser[]> {
  const response = await appFetch(`${APP_API_BASE_URL}/users`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  const json = (await response.json()) as AppUsersResponse;
  return json.data.users;
}

export async function createAppUser(payload: {
  username: string;
  password: string;
  displayName?: string | null;
  role: AppRole;
  permissions?: ReportPermission[];
}): Promise<AppUser> {
  const response = await appFetch(`${APP_API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  const json = (await response.json()) as AppUserResponse;
  return json.data.user;
}

export async function updateAppUser(
  id: string,
  payload: {
    displayName?: string | null;
    role?: AppRole;
    isActive?: boolean;
    permissions?: ReportPermission[];
  }
): Promise<AppUser> {
  const response = await appFetch(`${APP_API_BASE_URL}/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  const json = (await response.json()) as AppUserResponse;
  return json.data.user;
}

export async function resetAppUserPassword(id: string, password: string): Promise<void> {
  const response = await appFetch(`${APP_API_BASE_URL}/users/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function deleteAppUser(id: string): Promise<void> {
  const response = await appFetch(`${APP_API_BASE_URL}/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function fetchCoachAcademStats(): Promise<CoachAcademStatsResponse> {
  const response = await appFetch(`${APP_API_BASE_URL}/coach-academ/stats`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as CoachAcademStatsResponse;
}

export async function fetchCoachAcademPendingSubjects(): Promise<CoachAcademPendingSubject[]> {
  const response = await appFetch(`${APP_API_BASE_URL}/coach-academ/subjects/pending`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? (data as CoachAcademPendingSubject[]) : [];
}

export async function verifyCoachAcademSubject(subjectId: string): Promise<void> {
  const response = await appFetch(
    `${APP_API_BASE_URL}/coach-academ/subjects/${encodeURIComponent(subjectId)}/verify`,
    { method: 'PUT' }
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function rejectCoachAcademSubject(subjectId: string, reason: string): Promise<void> {
  const response = await appFetch(
    `${APP_API_BASE_URL}/coach-academ/subjects/${encodeURIComponent(subjectId)}/reject`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function fetchCoachAcademTeachers(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<CoachAcademTeachersResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/coach-academ/teachers?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as CoachAcademTeachersResponse;
}

export async function fetchCoachAcademParents(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<CoachAcademParentsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/coach-academ/parents?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as CoachAcademParentsResponse;
}

export async function fetchCoachAcademOrganizations(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<CoachAcademOrganizationsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(
    `${APP_API_BASE_URL}/coach-academ/organizations?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as CoachAcademOrganizationsResponse;
}

export async function fetchCoachAcademPurchases(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<CoachAcademPurchasesResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/coach-academ/purchases?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as CoachAcademPurchasesResponse;
}

export async function fetchCoachAcademAbuseReports(): Promise<CoachAcademAbuseReport[]> {
  const response = await appFetch(`${APP_API_BASE_URL}/coach-academ/reports`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? (data as CoachAcademAbuseReport[]) : [];
}

export async function fetchVeloStats(): Promise<VeloStatsResponse> {
  const response = await appFetch(`${APP_API_BASE_URL}/velo/stats`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as VeloStatsResponse;
}

export async function fetchVeloSenders(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<VeloSendersResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/velo/senders?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as VeloSendersResponse;
}

export async function fetchVeloAgents(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<VeloAgentsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/velo/agents?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as VeloAgentsResponse;
}

export async function fetchVeloShipments(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<VeloShipmentsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.status?.trim()) query.set('status', params.status.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/velo/shipments?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as VeloShipmentsResponse;
}

export async function fetchVeloPurchases(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<VeloPurchasesResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/velo/purchases?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as VeloPurchasesResponse;
}

export async function fetchVeloContactInquiries(params?: {
  page?: number;
  pageSize?: number;
}): Promise<VeloContactInquiriesResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  const response = await appFetch(`${APP_API_BASE_URL}/velo/contact-inquiries?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as VeloContactInquiriesResponse;
}

export async function fetchVeloListings(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<VeloListingsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/velo/listings?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as VeloListingsResponse;
}

export async function fetchVeloAppointmentRequests(): Promise<VeloAppointmentRequestsResponse> {
  const response = await appFetch(`${APP_API_BASE_URL}/velo/appointment-requests`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as VeloAppointmentRequestsResponse;
}

export async function approveVeloAgentAppointment(agentId: string): Promise<void> {
  const response = await appFetch(
    `${APP_API_BASE_URL}/velo/agents/${encodeURIComponent(agentId)}/approve`,
    { method: 'PUT' }
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function declineVeloAgentAppointment(agentId: string): Promise<void> {
  const response = await appFetch(
    `${APP_API_BASE_URL}/velo/agents/${encodeURIComponent(agentId)}/decline`,
    { method: 'PUT' }
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function fetchSafariBooksStats(): Promise<SafariBooksStatsResponse> {
  const response = await appFetch(`${APP_API_BASE_URL}/safari-books/stats`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as SafariBooksStatsResponse;
}

export async function fetchSafariBooksListeners(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<SafariBooksListenersResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/safari-books/listeners?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as SafariBooksListenersResponse;
}

export async function fetchSafariBooksPublishers(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}): Promise<SafariBooksPublishersResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  if (params?.status?.trim()) query.set('status', params.status.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/safari-books/publishers?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as SafariBooksPublishersResponse;
}

export async function fetchSafariBooksBooks(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  published?: string;
}): Promise<SafariBooksBooksResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  if (params?.published?.trim()) query.set('published', params.published.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/safari-books/books?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as SafariBooksBooksResponse;
}

export async function fetchSafariBooksPendingVerifications(): Promise<SafariBooksPendingVerificationsResponse> {
  const response = await appFetch(`${APP_API_BASE_URL}/safari-books/pending-verifications`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as SafariBooksPendingVerificationsResponse;
}

export async function rejectSafariBooksPublisher(
  id: string,
  isCompany: boolean,
  message: string
): Promise<void> {
  const query = new URLSearchParams();
  query.set('isCompany', String(isCompany));
  const response = await appFetch(
    `${APP_API_BASE_URL}/safari-books/reject-publisher/${encodeURIComponent(id)}?${query.toString()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function fetchScientificJournalsStats(): Promise<ScientificJournalsStatsResponse> {
  const response = await appFetch(`${APP_API_BASE_URL}/scientific-journals/stats`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as ScientificJournalsStatsResponse;
}

export async function fetchScientificJournalsUsers(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<ScientificJournalsUsersResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(
    `${APP_API_BASE_URL}/scientific-journals/users?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as ScientificJournalsUsersResponse;
}

export async function fetchScientificJournalsReviewers(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}): Promise<ScientificJournalsReviewersResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  if (params?.status?.trim()) query.set('status', params.status.trim());
  const response = await appFetch(
    `${APP_API_BASE_URL}/scientific-journals/reviewers?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as ScientificJournalsReviewersResponse;
}

export async function fetchScientificJournalsArticles(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}): Promise<ScientificJournalsArticlesResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  if (params?.status?.trim()) query.set('status', params.status.trim());
  const response = await appFetch(
    `${APP_API_BASE_URL}/scientific-journals/articles?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as ScientificJournalsArticlesResponse;
}

export async function fetchScientificJournalsPayments(params?: {
  page?: number;
  pageSize?: number;
}): Promise<ScientificJournalsPaymentsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  const response = await appFetch(
    `${APP_API_BASE_URL}/scientific-journals/payments?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as ScientificJournalsPaymentsResponse;
}

export async function fetchScientificJournalsSubscriptions(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  active?: boolean;
}): Promise<ScientificJournalsSubscriptionsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  if (params?.active) query.set('active', 'true');
  const response = await appFetch(
    `${APP_API_BASE_URL}/scientific-journals/subscriptions?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as ScientificJournalsSubscriptionsResponse;
}

export async function fetchScientificJournalsFullIssuePurchases(params?: {
  page?: number;
  pageSize?: number;
}): Promise<ScientificJournalsFullIssuePurchasesResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  const response = await appFetch(
    `${APP_API_BASE_URL}/scientific-journals/full-issue-purchases?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as ScientificJournalsFullIssuePurchasesResponse;
}

export async function approveScientificJournalsReviewer(userId: string): Promise<void> {
  const response = await appFetch(
    `${APP_API_BASE_URL}/scientific-journals/reviewers/${encodeURIComponent(userId)}/approve`,
    { method: 'POST' }
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function rejectScientificJournalsReviewer(userId: string): Promise<void> {
  const response = await appFetch(
    `${APP_API_BASE_URL}/scientific-journals/reviewers/${encodeURIComponent(userId)}/reject`,
    { method: 'POST' }
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
}

export async function fetchDubaiAnalyticaStats(): Promise<DubaiAnalyticaStatsResponse> {
  const response = await appFetch(`${APP_API_BASE_URL}/dubai-analytica/stats`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as DubaiAnalyticaStatsResponse;
}

export async function fetchDubaiAnalyticaUsers(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<DubaiAnalyticaUsersResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/dubai-analytica/users?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as DubaiAnalyticaUsersResponse;
}

export async function fetchDubaiAnalyticaSurveys(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<DubaiAnalyticaSurveysResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(`${APP_API_BASE_URL}/dubai-analytica/surveys?${query.toString()}`);
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as DubaiAnalyticaSurveysResponse;
}

export async function fetchDubaiAnalyticaPurchases(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<DubaiAnalyticaPurchasesResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  const response = await appFetch(
    `${APP_API_BASE_URL}/dubai-analytica/purchases?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as DubaiAnalyticaPurchasesResponse;
}

export async function fetchDubaiAnalyticaSubscriptions(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  active?: boolean;
}): Promise<DubaiAnalyticaSubscriptionsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.q?.trim()) query.set('q', params.q.trim());
  if (params?.active) query.set('active', 'true');
  const response = await appFetch(
    `${APP_API_BASE_URL}/dubai-analytica/subscriptions?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as DubaiAnalyticaSubscriptionsResponse;
}

export async function fetchDubaiAnalyticaDriPayments(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
}): Promise<DubaiAnalyticaDriPaymentsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('pageSize', String(params?.pageSize ?? 50));
  if (params?.type?.trim()) query.set('type', params.type.trim());
  const response = await appFetch(
    `${APP_API_BASE_URL}/dubai-analytica/dri-payments?${query.toString()}`
  );
  if (!response.ok) {
    await parseAppAuthError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as DubaiAnalyticaDriPaymentsResponse;
}

export async function fetchFunyulaReports(
  page: number = 1,
  limit: number = 2
): Promise<FunyulaReportsResponse> {
  try {
    const response = await appFetch(
      `${API_BASE_URL}/rise-reports/reports?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FunyulaReportsResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch Funyula reports: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchFunyulaVolunteers(
  offset: number = 0,
  limit: number = 10,
  roleOrOptions: VolunteerRoleFilter | {
    roleFilter?: VolunteerRoleFilter;
    genderFilter?: VolunteerGenderFilter;
    search?: string;
    filters?: VolunteerFieldFilters;
  } = 'ALL'
): Promise<VolunteersResponse> {
  try {
    const roleFilter =
      typeof roleOrOptions === 'string' ? roleOrOptions : (roleOrOptions.roleFilter ?? 'ALL');
    const genderFilter = typeof roleOrOptions === 'string' ? 'ALL' : (roleOrOptions.genderFilter ?? 'ALL');
    const search = typeof roleOrOptions === 'string' ? '' : (roleOrOptions.search ?? '');
    const filters = typeof roleOrOptions === 'string' ? {} : (roleOrOptions.filters ?? {});

    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (roleFilter !== 'ALL') {
      params.set('role', roleFilter);
    }
    if (genderFilter !== 'ALL') {
      params.set('gender', genderFilter);
    }
    const trimmedSearch = search.trim();
    if (trimmedSearch.length > 0) {
      params.set('search', trimmedSearch);
    }
    const fieldFilterKeys: Array<keyof VolunteerFieldFilters> = [
      'id',
      'fullName',
      'name',
      'ward',
      'phone',
      'location',
      'subLocation',
      'pollingStation',
      'message',
    ];
    for (const key of fieldFilterKeys) {
      const value = filters[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        params.set(key, value.trim());
      }
    }
    const response = await appFetch(`${API_BASE_URL}/volunteer/all?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: VolunteersResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch Funyula volunteers: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchExpoRegistrations(
  offset: number = 0,
  limit: number = 10,
  searchOrOptions: string | { search?: string; filters?: ExpoFieldFilters } = ''
): Promise<ExpoRegistrationsResponse> {
  try {
    const search = typeof searchOrOptions === 'string' ? searchOrOptions : (searchOrOptions.search ?? '');
    const filters = typeof searchOrOptions === 'string' ? {} : (searchOrOptions.filters ?? {});
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    const trimmedSearch = search.trim();
    if (trimmedSearch.length > 0) {
      params.set('search', trimmedSearch);
    }
    const fieldFilterKeys: Array<keyof ExpoFieldFilters> = [
      'groupName',
      'designation',
      'groupLeaderName',
      'yourName',
      'phoneNumber',
    ];
    for (const key of fieldFilterKeys) {
      const value = filters[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        params.set(key, value.trim());
      }
    }
    const response = await appFetch(`${API_BASE_URL}/volunteer/expo-register/all?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ExpoRegistrationsResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch Samia women registrations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchManifestoUsers(): Promise<ManifestoUsersResponse> {
  try {
    const response = await appFetch(`${API_BASE_URL}/volunteer/get-manifesto-users`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ManifestoUsersResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch manifesto users: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function throwIfDeleteFailed(response: Response, fallback: string): Promise<void> {
  if (response.ok) return;
  const text = await response.text();
  let message = fallback;
  try {
    const j = JSON.parse(text) as { message?: string };
    if (j?.message) message = j.message;
  } catch {
    message = `${fallback} (${response.status})`;
  }
  throw new Error(message);
}

export async function deleteVolunteerById(id: string): Promise<void> {
  const response = await appFetch(`${API_BASE_URL}/volunteer/entry/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await throwIfDeleteFailed(response, 'Failed to delete volunteer');
}

export async function deleteExpoRegistrationById(id: string): Promise<void> {
  const response = await appFetch(`${API_BASE_URL}/volunteer/expo-register/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await throwIfDeleteFailed(response, 'Failed to delete registration');
}

export async function fetchRiseProfileReports(
  page: number = 1,
  limit: number = 10
): Promise<RiseReportsResponse> {
  try {
    const response = await appFetch(
      `${RISE_API_BASE_URL}/get-profile-reports?page=${page}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: RiseReportsResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch RISE profile reports: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchRiseInvestors(
  page: number = 1,
  limit: number = 10
): Promise<RiseReportsResponse> {
  try {
    const response = await appFetch(
      `${RISE_API_BASE_URL}/get-rise-investors?page=${page}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: RiseReportsResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch RISE investors: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Chunk size for walking paginated endpoints until every row is loaded (PDF export).
 * Loops until the server reports no more pages — not a cap on exported rows.
 */
const PDF_FETCH_CHUNK = 500;
const PDF_FETCH_MAX_ITERATIONS = 10_000;

/** Merge every page of Funyula contributions into one payload (summary from first page). */
export async function fetchAllFunyulaReportsForPdf(): Promise<FunyulaReportsResponse> {
  const first = await fetchFunyulaReports(1, PDF_FETCH_CHUNK);
  const payments = [...first.data.payments];
  let page = first.data.pagination.currentPage;
  let hasNext = first.data.pagination.hasNextPage;
  let iterations = 0;

  while (hasNext && iterations < PDF_FETCH_MAX_ITERATIONS) {
    iterations += 1;
    page += 1;
    const chunk = await fetchFunyulaReports(page, PDF_FETCH_CHUNK);
    payments.push(...chunk.data.payments);
    hasNext = chunk.data.pagination.hasNextPage;
  }

  const totalCount = first.data.pagination.totalCount;
  return {
    ...first,
    data: {
      ...first.data,
      payments,
      pagination: {
        ...first.data.pagination,
        currentPage: 1,
        totalPages: 1,
        totalCount,
        limit: payments.length,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  };
}

/** Merge every offset window until all volunteers are loaded. */
export async function fetchAllFunyulaVolunteersForPdf(
  options: {
    roleFilter?: VolunteerRoleFilter;
    genderFilter?: VolunteerGenderFilter;
    search?: string;
    filters?: VolunteerFieldFilters;
  } = {}
): Promise<VolunteersResponse> {
  const roleFilter = options.roleFilter ?? 'ALL';
  const genderFilter = options.genderFilter ?? 'ALL';
  const search = options.search?.trim() ?? '';
  const filters = options.filters ?? {};
  const normalizedFieldFilters = {
    id: filters.id?.trim().toLowerCase() ?? '',
    fullName: (filters.fullName ?? filters.name)?.trim().toLowerCase() ?? '',
    ward: filters.ward?.trim().toLowerCase() ?? '',
    phone: filters.phone?.trim().toLowerCase() ?? '',
    location: filters.location?.trim().toLowerCase() ?? '',
    subLocation: filters.subLocation?.trim().toLowerCase() ?? '',
    pollingStation: filters.pollingStation?.trim().toLowerCase() ?? '',
    message: filters.message?.trim().toLowerCase() ?? '',
  };
  const hasFieldFilter = Object.values(normalizedFieldFilters).some((value) => value.length > 0);
  const hasClientSideFilter = roleFilter !== 'ALL' || genderFilter !== 'ALL' || search.length > 0 || hasFieldFilter;

  const first = await fetchFunyulaVolunteers(
    0,
    PDF_FETCH_CHUNK,
    hasClientSideFilter ? 'ALL' : { roleFilter, genderFilter, search }
  );
  const totalCount = first.pagination.totalCount;
  const merged: VolunteersResponse['data'] = [...first.data];
  let offset = first.pagination.offset + first.pagination.limit;
  let iterations = 0;

  while (merged.length < totalCount && iterations < PDF_FETCH_MAX_ITERATIONS) {
    iterations += 1;
    const chunk = await fetchFunyulaVolunteers(
      offset,
      PDF_FETCH_CHUNK,
      hasClientSideFilter ? 'ALL' : { roleFilter, genderFilter, search }
    );
    if (chunk.data.length === 0) break;
    merged.push(...chunk.data);
    offset += chunk.pagination.limit;
  }

  const normalizedSearch = search.toLowerCase();
  const filtered = hasClientSideFilter
    ? merged.filter((volunteer) => {
        const roleMatch = roleFilter === 'ALL' || volunteer.role === roleFilter;
        const genderMatch = genderFilter === 'ALL' || volunteer.gender === genderFilter;
        if (!roleMatch || !genderMatch) return false;
        const idMatch = normalizedFieldFilters.id
          ? volunteer.id.toLowerCase().includes(normalizedFieldFilters.id)
          : true;
        const fullNameMatch = normalizedFieldFilters.fullName
          ? volunteer.fullName.toLowerCase().includes(normalizedFieldFilters.fullName)
          : true;
        const wardMatch = normalizedFieldFilters.ward
          ? volunteer.ward.toLowerCase().includes(normalizedFieldFilters.ward)
          : true;
        const phoneMatch = normalizedFieldFilters.phone
          ? volunteer.phone.toLowerCase().includes(normalizedFieldFilters.phone)
          : true;
        const locationMatch = normalizedFieldFilters.location
          ? volunteer.location.toLowerCase().includes(normalizedFieldFilters.location)
          : true;
        const subLocationMatch = normalizedFieldFilters.subLocation
          ? volunteer.subLocation.toLowerCase().includes(normalizedFieldFilters.subLocation)
          : true;
        const pollingStationMatch = normalizedFieldFilters.pollingStation
          ? volunteer.pollingStation.toLowerCase().includes(normalizedFieldFilters.pollingStation)
          : true;
        const messageMatch = normalizedFieldFilters.message
          ? String((volunteer as VolunteerWithMessage).message ?? '').toLowerCase().includes(normalizedFieldFilters.message)
          : true;
        if (
          !idMatch ||
          !fullNameMatch ||
          !wardMatch ||
          !phoneMatch ||
          !locationMatch ||
          !subLocationMatch ||
          !pollingStationMatch ||
          !messageMatch
        ) {
          return false;
        }

        if (!normalizedSearch) return true;

        const haystacks = [
          volunteer.id,
          volunteer.fullName,
          volunteer.ward,
          volunteer.phone,
          volunteer.location,
          volunteer.subLocation,
          volunteer.pollingStation,
          volunteer.role ?? '',
          volunteer.gender ?? '',
        ];

        return haystacks.some((value) => value.toLowerCase().includes(normalizedSearch));
      })
    : merged;

  return {
    ...first,
    data: filtered,
    pagination: {
      offset: 0,
      limit: filtered.length,
      totalCount: filtered.length,
    },
  };
}

type VolunteerWithMessage = VolunteersResponse['data'][number] & { message?: string | null };

/** Merge every offset window until all expo registrations are loaded. */
export async function fetchAllExpoRegistrationsForPdf(
  options: { search?: string; filters?: ExpoFieldFilters } = {}
): Promise<ExpoRegistrationsResponse> {
  const search = options.search?.trim() ?? '';
  const filters = options.filters ?? {};
  const normalizedFieldFilters = {
    groupName: filters.groupName?.trim().toLowerCase() ?? '',
    designation: filters.designation?.trim().toLowerCase() ?? '',
    groupLeaderName: filters.groupLeaderName?.trim().toLowerCase() ?? '',
    yourName: filters.yourName?.trim().toLowerCase() ?? '',
    phoneNumber: filters.phoneNumber?.trim().toLowerCase() ?? '',
  };
  const hasFieldFilter = Object.values(normalizedFieldFilters).some((value) => value.length > 0);
  const hasClientSideFilter = search.length > 0 || hasFieldFilter;

  const first = await fetchExpoRegistrations(
    0,
    PDF_FETCH_CHUNK,
    hasClientSideFilter ? '' : { search, filters }
  );
  const totalCount = first.pagination.totalCount;
  const merged: ExpoRegistrationsResponse['data'] = [...first.data];
  let offset = first.pagination.offset + first.pagination.limit;
  let iterations = 0;

  while (merged.length < totalCount && iterations < PDF_FETCH_MAX_ITERATIONS) {
    iterations += 1;
    const chunk = await fetchExpoRegistrations(
      offset,
      PDF_FETCH_CHUNK,
      hasClientSideFilter ? '' : { search, filters }
    );
    if (chunk.data.length === 0) break;
    merged.push(...chunk.data);
    offset += chunk.pagination.limit;
  }

  const normalizedSearch = search.toLowerCase();
  const filtered = hasClientSideFilter
    ? merged.filter((item) => {
        const groupNameMatch = normalizedFieldFilters.groupName
          ? item.groupName.toLowerCase().includes(normalizedFieldFilters.groupName)
          : true;
        const designationMatch = normalizedFieldFilters.designation
          ? item.designation.toLowerCase().includes(normalizedFieldFilters.designation)
          : true;
        const groupLeaderNameMatch = normalizedFieldFilters.groupLeaderName
          ? item.groupLeaderName.toLowerCase().includes(normalizedFieldFilters.groupLeaderName)
          : true;
        const yourNameMatch = normalizedFieldFilters.yourName
          ? item.yourName.toLowerCase().includes(normalizedFieldFilters.yourName)
          : true;
        const phoneNumberMatch = normalizedFieldFilters.phoneNumber
          ? item.phoneNumber.toLowerCase().includes(normalizedFieldFilters.phoneNumber)
          : true;
        if (
          !groupNameMatch ||
          !designationMatch ||
          !groupLeaderNameMatch ||
          !yourNameMatch ||
          !phoneNumberMatch
        ) {
          return false;
        }
        if (!normalizedSearch) return true;
        return [
          item.groupName,
          item.designation,
          item.groupLeaderName,
          item.yourName,
          item.phoneNumber,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
    : merged;

  return {
    ...first,
    data: filtered,
    pagination: {
      offset: 0,
      limit: filtered.length,
      totalCount: filtered.length,
    },
  };
}

async function fetchAllRiseReportPages(
  fetchPage: (page: number, limit: number) => Promise<RiseReportsResponse>
): Promise<RiseReportsResponse> {
  const first = await fetchPage(1, PDF_FETCH_CHUNK);
  const merged: RiseReportItem[] = [...first.data];
  const totalPages = first.pagination.totalPages;
  let page = 1;
  let iterations = 0;

  while (page < totalPages && iterations < PDF_FETCH_MAX_ITERATIONS) {
    iterations += 1;
    page += 1;
    const chunk = await fetchPage(page, PDF_FETCH_CHUNK);
    merged.push(...chunk.data);
  }

  const total = first.pagination.total;
  return {
    data: merged,
    pagination: {
      page: 1,
      limit: merged.length,
      total,
      totalPages: 1,
    },
  };
}

export async function fetchAllRiseProfileReportsForPdf(): Promise<RiseReportsResponse> {
  return fetchAllRiseReportPages(fetchRiseProfileReports);
}

export async function fetchAllRiseInvestorsForPdf(): Promise<RiseReportsResponse> {
  return fetchAllRiseReportPages(fetchRiseInvestors);
}

type TaskPagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type FetchTasksResponse = {
  success: boolean;
  data: {
    tasks: Task[];
    pagination: TaskPagination;
  };
};

export async function fetchTaskAssignees(): Promise<TaskAssigneeUser[]> {
  const response = await appFetch(`${API_BASE_URL}/rise-reports/task-assignees`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const json = (await response.json()) as {
    success: boolean;
    data: { users: TaskAssigneeUser[] };
  };
  return json.data.users;
}

export async function fetchTasks(params: {
  page: number;
  limit: number;
  asset?: TaskAsset | null;
  assignedTo?: string | null;
  status?: TaskStatus | null;
}): Promise<FetchTasksResponse> {
  const { page, limit, asset, assignedTo, status } = params;

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (asset) query.set('asset', asset);
  if (assignedTo) query.set('assignedTo', assignedTo);
  if (status) query.set('status', status);

  const response = await appFetch(`${API_BASE_URL}/rise-reports/get-tasks?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: FetchTasksResponse = await response.json();
  return data;
}

export async function createTask(payload: {
  title: string;
  description?: string;
  asset: TaskAsset;
  assignedToUserId: string;
  status: TaskStatus;
}): Promise<{ success: boolean; data: { task: Task } }> {
  const response = await appFetch(`${API_BASE_URL}/rise-reports/create-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      asset: payload.asset,
      assignedToUserId: payload.assignedToUserId,
      status: payload.status,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as { success: boolean; data: { task: Task } };
}

export async function updateTask(payload: {
  id: string;
  title: string;
  description?: string;
  asset: TaskAsset;
  assignedToUserId: string;
  status: TaskStatus;
}): Promise<{ success: boolean; data: { task: Task } }> {
  const response = await appFetch(`${API_BASE_URL}/rise-reports/update-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as { success: boolean; data: { task: Task } };
}

export async function deleteTask(payload: { id: string }): Promise<{ success: boolean; data: { id: string } }> {
  const response = await appFetch(`${API_BASE_URL}/rise-reports/delete-task`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as { success: boolean; data: { id: string } };
}

export class VaultAuthError extends Error {
  constructor(message = 'Vault session expired. Please sign in again.') {
    super(message);
    this.name = 'VaultAuthError';
  }
}

async function vaultAuthHeaders(): Promise<Record<string, string>> {
  const token = await getVaultToken();
  if (!token) {
    throw new VaultAuthError('Not signed in to Vault');
  }
  return { Authorization: `Bearer ${token}` };
}

async function parseVaultError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message || fallback;
  if (response.status === 401) {
    await clearVaultToken();
    throw new VaultAuthError(message);
  }
  throw new Error(message);
}

export async function vaultLogin(username: string, password: string): Promise<VaultSession> {
  const response = await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || 'Invalid username or password');
  }

  const json = (await response.json()) as VaultLoginResponse;
  await setVaultToken(json.data.token);
  return json.data;
}

export async function vaultLogout(): Promise<void> {
  const headers = await vaultAuthHeaders().catch(() => null);
  if (headers) {
    await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/auth/logout`, {
      method: 'POST',
      headers,
    }).catch(() => {});
  }
  await clearVaultToken();
}

export async function vaultMe(): Promise<VaultMeResponse['data']> {
  const response = await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/auth/me`, {
    headers: await vaultAuthHeaders(),
  });

  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }

  const json = (await response.json()) as VaultMeResponse;
  return json.data;
}

export async function fetchVaultDocuments(params: {
  page?: number;
  limit?: number;
} = {}): Promise<FetchVaultDocumentsResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  const response = await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/documents?${query.toString()}`, {
    headers: await vaultAuthHeaders(),
  });
  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as FetchVaultDocumentsResponse;
}

export async function fetchVaultDocumentViewUrl(
  id: string
): Promise<{ success: boolean; data: { viewUrl: string; expiresIn: number } }> {
  const response = await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/documents/${encodeURIComponent(id)}/view-url`, {
    headers: await vaultAuthHeaders(),
  });
  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as { success: boolean; data: { viewUrl: string; expiresIn: number } };
}

export async function uploadVaultDocument(payload: {
  uri: string;
  name: string;
  mimeType: string;
  title?: string;
}): Promise<{ success: boolean; data: { document: VaultDocument } }> {
  const form = new FormData();
  form.append('file', {
    uri: payload.uri,
    name: payload.name,
    type: payload.mimeType,
  } as unknown as Blob);
  if (payload.title?.trim()) {
    form.append('title', payload.title.trim());
  }

  const response = await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/documents`, {
    method: 'POST',
    headers: await vaultAuthHeaders(),
    body: form,
  });

  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as { success: boolean; data: { document: VaultDocument } };
}

export async function deleteVaultDocument(payload: {
  id: string;
}): Promise<{ success: boolean; data: { id: string } }> {
  const response = await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/documents`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(await vaultAuthHeaders()),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as { success: boolean; data: { id: string } };
}

export async function createVaultGuestAccess(payload: {
  username: string;
  password: string;
  documentIds: string[];
}): Promise<CreateVaultGuestAccessResponse> {
  const response = await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/guest-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await vaultAuthHeaders()),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as CreateVaultGuestAccessResponse;
}

export async function fetchVaultGuestAccess(): Promise<FetchVaultGuestAccessResponse> {
  const response = await fetch(`${VAULT_API_BASE_URL}/rise-reports/vault/guest-access`, {
    headers: await vaultAuthHeaders(),
  });

  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as FetchVaultGuestAccessResponse;
}

export async function addVaultGuestDocuments(
  guestId: string,
  documentIds: string[]
): Promise<CreateVaultGuestAccessResponse> {
  const response = await fetch(
    `${VAULT_API_BASE_URL}/rise-reports/vault/guest-access/${encodeURIComponent(guestId)}/documents`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await vaultAuthHeaders()),
      },
      body: JSON.stringify({ documentIds }),
    }
  );

  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as CreateVaultGuestAccessResponse;
}

export async function revokeVaultGuestAccess(id: string): Promise<{ success: boolean; data: { id: string } }> {
  const response = await fetch(
    `${VAULT_API_BASE_URL}/rise-reports/vault/guest-access/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: await vaultAuthHeaders(),
    }
  );

  if (!response.ok) {
    await parseVaultError(response, `HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as { success: boolean; data: { id: string } };
}

export async function fetchSchedulingMetrics(params: {
  appSource: SchedulingAppSource;
  completedOffset?: number;
  upcomingOffset?: number;
  limit?: number;
}): Promise<SchedulingMetricsResponse> {
  try {
    const completedOffset = params.completedOffset ?? 0;
    const upcomingOffset = params.upcomingOffset ?? 0;
    const limit = params.limit ?? 10;
    const query = new URLSearchParams({
      appSource: params.appSource,
      completedOffset: String(completedOffset),
      upcomingOffset: String(upcomingOffset),
      limit: String(limit),
    });
    const response = await appFetch(`${SCHEDULING_API_BASE_URL}/scheduling/metrics?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SchedulingMetricsResponse;
  } catch (error) {
    throw new Error(
      `Failed to fetch calendar metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchSchedulingBookingStats(
  email: string,
  appSource: SchedulingAppSource
): Promise<SchedulingBookingStatsResponse> {
  try {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      throw new Error('Email is required');
    }
    const query = new URLSearchParams({ email: trimmedEmail, appSource });
    const response = await appFetch(`${SCHEDULING_API_BASE_URL}/scheduling/booking-stats?${query.toString()}`);
    if (!response.ok) {
      const text = await response.text();
      let message = `HTTP error! status: ${response.status}`;
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // keep default message
      }
      throw new Error(message);
    }
    return (await response.json()) as SchedulingBookingStatsResponse;
  } catch (error) {
    throw new Error(
      `Failed to fetch booking stats: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchSessionCreditsList(
  appSource: SchedulingAppSource
): Promise<SessionCreditsListResponse> {
  try {
    const query = new URLSearchParams({ appSource });
    const response = await appFetch(
      `${SCHEDULING_API_BASE_URL}/scheduling/session-credits/list?${query.toString()}`
    );
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SessionCreditsListResponse;
  } catch (error) {
    throw new Error(
      `Failed to fetch session credits list: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function parseSchedulingError(response: Response, fallback: string): Promise<never> {
  const text = await response.text();
  let message = fallback;
  try {
    const parsed = JSON.parse(text) as { message?: string };
    if (parsed.message) message = parsed.message;
  } catch {
    message = `${fallback} (${response.status})`;
  }
  throw new Error(message);
}

export async function fetchAvailabilitySettings(): Promise<SchedulingAvailabilitySettingsResponse> {
  try {
    const response = await appFetch(`${SCHEDULING_API_BASE_URL}/scheduling/availability-settings`);
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SchedulingAvailabilitySettingsResponse;
  } catch (error) {
    throw new Error(
      `Failed to fetch availability settings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createAvailabilitySetting(
  payload: AvailabilitySettingInput
): Promise<SchedulingAvailabilitySettingResponse> {
  try {
    const response = await appFetch(`${SCHEDULING_API_BASE_URL}/scheduling/availability-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SchedulingAvailabilitySettingResponse;
  } catch (error) {
    throw new Error(
      `Failed to create availability: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateAvailabilitySetting(
  id: string,
  payload: AvailabilitySettingInput
): Promise<SchedulingAvailabilitySettingResponse> {
  try {
    const response = await appFetch(
      `${SCHEDULING_API_BASE_URL}/scheduling/availability-settings/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SchedulingAvailabilitySettingResponse;
  } catch (error) {
    throw new Error(
      `Failed to update availability: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteAvailabilitySetting(id: string): Promise<{ success: boolean; id: string }> {
  try {
    const response = await appFetch(
      `${SCHEDULING_API_BASE_URL}/scheduling/availability-settings/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as { success: boolean; id: string };
  } catch (error) {
    throw new Error(
      `Failed to delete availability: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function grantSessionCredits(payload: {
  email: string;
  sessions: number;
  appSource: SchedulingAppSource;
  notes?: string;
  sendEmail?: boolean;
}): Promise<GrantSessionCreditsResponse> {
  try {
    const response = await appFetch(`${SCHEDULING_API_BASE_URL}/scheduling/session-credits/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as GrantSessionCreditsResponse;
  } catch (error) {
    throw new Error(
      `Failed to grant session credits: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchSessionCredits(
  email: string,
  appSource: SchedulingAppSource
): Promise<SessionCreditsResponse> {
  try {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      throw new Error('Email is required');
    }
    const query = new URLSearchParams({ email: trimmedEmail, appSource });
    const response = await appFetch(
      `${SCHEDULING_API_BASE_URL}/scheduling/session-credits?${query.toString()}`
    );
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SessionCreditsResponse;
  } catch (error) {
    throw new Error(
      `Failed to fetch session credits: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createSchedulingInvite(payload: {
  email: string;
  type: SchedulingInviteType;
  appSource: SchedulingAppSource;
}): Promise<SchedulingInviteResponse> {
  try {
    const response = await appFetch(`${SCHEDULING_API_BASE_URL}/scheduling/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SchedulingInviteResponse;
  } catch (error) {
    throw new Error(
      `Failed to create appointment invite: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchManageableMeetings(params: {
  appSource: SchedulingAppSource;
  offset?: number;
  limit?: number;
}): Promise<SchedulingMeetingsResponse> {
  try {
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 20;
    const query = new URLSearchParams({
      appSource: params.appSource,
      offset: String(offset),
      limit: String(limit),
    });
    const response = await appFetch(`${SCHEDULING_API_BASE_URL}/scheduling/meetings?${query.toString()}`);
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SchedulingMeetingsResponse;
  } catch (error) {
    throw new Error(
      `Failed to fetch meetings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function cancelSchedulingMeeting(
  id: string,
  appSource: SchedulingAppSource
): Promise<SchedulingMeetingResponse> {
  try {
    const query = new URLSearchParams({ appSource });
    const response = await appFetch(
      `${SCHEDULING_API_BASE_URL}/scheduling/meetings/${encodeURIComponent(id)}/cancel?${query.toString()}`,
      { method: 'POST' }
    );
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SchedulingMeetingResponse;
  } catch (error) {
    throw new Error(
      `Failed to cancel meeting: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function rescheduleSchedulingMeeting(
  id: string,
  payload: { startTime: string; availabilityId?: string; appSource: SchedulingAppSource }
): Promise<SchedulingMeetingResponse> {
  try {
    const response = await appFetch(
      `${SCHEDULING_API_BASE_URL}/scheduling/meetings/${encodeURIComponent(id)}/reschedule`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      await parseSchedulingError(response, `HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as SchedulingMeetingResponse;
  } catch (error) {
    throw new Error(
      `Failed to reschedule meeting: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
