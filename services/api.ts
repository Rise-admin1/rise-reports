import {
  ExpoRegistrationsResponse,
  FunyulaReportsResponse,
  RiseReportItem,
  RiseReportsResponse,
  VolunteerRoleFilter,
  VolunteersResponse,
} from '@/types/reports';
import { Task, TaskAsset, TaskAssignee, TaskStatus } from '@/types/tasks';

const API_BASE_URL = 'https://future.funyula.com/api';
// const API_BASE_URL = 'http://localhost:3001/api';
/** Base URL for RISE endpoints (Profile reports, Rise investors) */
const RISE_API_BASE_URL = 'https://react-journal1.onrender.com/api/rise';

export async function fetchFunyulaReports(
  page: number = 1,
  limit: number = 2
): Promise<FunyulaReportsResponse> {
  try {
    const response = await fetch(
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
  roleFilter: VolunteerRoleFilter = 'ALL'
): Promise<VolunteersResponse> {
  try {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (roleFilter !== 'ALL') {
      params.set('role', roleFilter);
    }
    const response = await fetch(`${API_BASE_URL}/volunteer/all?${params.toString()}`);
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
  search: string = ''
): Promise<ExpoRegistrationsResponse> {
  try {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    const trimmedSearch = search.trim();
    if (trimmedSearch.length > 0) {
      params.set('search', trimmedSearch);
    }
    const response = await fetch(`${API_BASE_URL}/volunteer/expo-register/all?${params.toString()}`);
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
  const response = await fetch(`${API_BASE_URL}/volunteer/entry/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await throwIfDeleteFailed(response, 'Failed to delete volunteer');
}

export async function deleteExpoRegistrationById(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/volunteer/expo-register/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await throwIfDeleteFailed(response, 'Failed to delete registration');
}

export async function fetchRiseProfileReports(
  page: number = 1,
  limit: number = 10
): Promise<RiseReportsResponse> {
  try {
    const response = await fetch(
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
    const response = await fetch(
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
  roleFilter: VolunteerRoleFilter = 'ALL'
): Promise<VolunteersResponse> {
  const first = await fetchFunyulaVolunteers(0, PDF_FETCH_CHUNK, roleFilter);
  const totalCount = first.pagination.totalCount;
  const merged: VolunteersResponse['data'] = [...first.data];
  let offset = first.pagination.offset + first.pagination.limit;
  let iterations = 0;

  while (merged.length < totalCount && iterations < PDF_FETCH_MAX_ITERATIONS) {
    iterations += 1;
    const chunk = await fetchFunyulaVolunteers(offset, PDF_FETCH_CHUNK, roleFilter);
    if (chunk.data.length === 0) break;
    merged.push(...chunk.data);
    offset += chunk.pagination.limit;
  }

  return {
    ...first,
    data: merged,
    pagination: {
      offset: 0,
      limit: merged.length,
      totalCount,
    },
  };
}

/** Merge every offset window until all expo registrations are loaded. */
export async function fetchAllExpoRegistrationsForPdf(): Promise<ExpoRegistrationsResponse> {
  const first = await fetchExpoRegistrations(0, PDF_FETCH_CHUNK);
  const totalCount = first.pagination.totalCount;
  const merged: ExpoRegistrationsResponse['data'] = [...first.data];
  let offset = first.pagination.offset + first.pagination.limit;
  let iterations = 0;

  while (merged.length < totalCount && iterations < PDF_FETCH_MAX_ITERATIONS) {
    iterations += 1;
    const chunk = await fetchExpoRegistrations(offset, PDF_FETCH_CHUNK);
    if (chunk.data.length === 0) break;
    merged.push(...chunk.data);
    offset += chunk.pagination.limit;
  }

  return {
    ...first,
    data: merged,
    pagination: {
      offset: 0,
      limit: merged.length,
      totalCount,
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

export async function fetchTasks(params: {
  page: number;
  limit: number;
  asset?: TaskAsset | null;
  assignedTo?: TaskAssignee | null;
  status?: TaskStatus | null;
}): Promise<FetchTasksResponse> {
  const { page, limit, asset, assignedTo, status } = params;

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (asset) query.set('asset', asset);
  if (assignedTo) query.set('assignedTo', assignedTo);
  if (status) query.set('status', status);

  const response = await fetch(`${API_BASE_URL}/rise-reports/get-tasks?${query.toString()}`);
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
  assignedTo: TaskAssignee;
  status: TaskStatus;
}): Promise<{ success: boolean; data: { task: Task } }> {
  const response = await fetch(`${API_BASE_URL}/rise-reports/create-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      asset: payload.asset,
      assignedTo: payload.assignedTo,
      status: payload.status,
    }),
  });
  console.log(response,'response');
  

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
  assignedTo: TaskAssignee;
  status: TaskStatus;
}): Promise<{ success: boolean; data: { task: Task } }> {
  const response = await fetch(`${API_BASE_URL}/rise-reports/update-task`, {
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
  const response = await fetch(`${API_BASE_URL}/rise-reports/delete-task`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as { success: boolean; data: { id: string } };
}
