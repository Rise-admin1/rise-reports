import type { AppRole } from '@/types/appAuth';

export type TaskAssigneeUser = {
  id: string;
  username: string;
  displayName: string | null;
  role: AppRole;
};

export type TaskAsset =
  | 'Funyula'
  | 'RISE'
  | 'PhD Success'
  | 'Coach Academ'
  | 'Velo'
  | 'Safari Books'
  | 'Scientific Journals Portal'
  | 'Dubai Analytica';

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type Task = {
  id: string;
  title: string;
  description?: string;
  asset: TaskAsset;
  assignedToUserId: string;
  assignedTo: TaskAssigneeUser;
  createdById?: string;
  createdBy?: TaskAssigneeUser | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export const TASK_ASSETS: TaskAsset[] = [
  'Funyula',
  'RISE',
  'PhD Success',
  'Coach Academ',
  'Velo',
  'Safari Books',
  'Scientific Journals Portal',
  'Dubai Analytica',
];
export const TASK_STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'Done'];
