import { FunyulaReportsResponse, RiseReportsResponse, VolunteersResponse } from '@/types/reports';
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

export async function fetchFunyulaVolunteers(offset: number = 0, limit: number = 10): Promise<VolunteersResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/volunteer/all?offset=${offset}&limit=${limit}`);
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
    body: JSON.stringify(payload),
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
