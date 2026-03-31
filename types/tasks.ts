export type TaskAssignee = 'Michael' | 'Mark' | 'Enock' | 'Alen';

export type TaskAsset =
  | 'Coachacadem'
  | 'PhD Success'
  | 'Corpink'
  | 'Funyula'
  | 'Velo'
  | 'Safari Books';

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type Task = {
  id: string;
  title: string;
  description?: string;
  asset: TaskAsset;
  assignedTo: TaskAssignee;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export const TASK_ASSETS: TaskAsset[] = [
  'Coachacadem',
  'PhD Success',
  'Corpink',
  'Funyula',
  'Velo',
  'Safari Books',
];
export const TASK_ASSIGNEES: TaskAssignee[] = ['Michael', 'Mark', 'Enock', 'Alen'];
export const TASK_STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'Done'];

