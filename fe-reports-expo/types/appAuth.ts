export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export type ReportPermission =
  | 'FUNYULA_PAYMENTS'
  | 'FUNYULA_VOLUNTEERS'
  | 'FUNYULA_SAMIA_WOMEN'
  | 'FUNYULA_MANIFESTO'
  | 'RISE_PROFILES'
  | 'RISE_INVESTORS'
  | 'RISE_SCHEDULING'
  | 'PHD_SCHEDULING'
  | 'COACH_ACADEM_STATS'
  | 'COACH_ACADEM_TEACHERS'
  | 'COACH_ACADEM_PARENTS'
  | 'COACH_ACADEM_ORGANIZATIONS'
  | 'COACH_ACADEM_PURCHASES'
  | 'COACH_ACADEM_PENDING_SUBJECTS'
  | 'COACH_ACADEM_REPORTS'
  | 'VELO_STATS'
  | 'VELO_SENDERS'
  | 'VELO_AGENTS'
  | 'VELO_SHIPMENTS'
  | 'VELO_PURCHASES'
  | 'VELO_LISTINGS'
  | 'VELO_CONTACT_INQUIRIES'
  | 'VELO_APPOINTMENTS'
  | 'SAFARI_BOOKS_STATS'
  | 'SAFARI_BOOKS_LISTENERS'
  | 'SAFARI_BOOKS_PUBLISHERS'
  | 'SAFARI_BOOKS_BOOKS'
  | 'SAFARI_BOOKS_PENDING'
  | 'SCIENTIFIC_JOURNALS_STATS'
  | 'SCIENTIFIC_JOURNALS_USERS'
  | 'SCIENTIFIC_JOURNALS_REVIEWERS'
  | 'SCIENTIFIC_JOURNALS_ARTICLES'
  | 'SCIENTIFIC_JOURNALS_PAYMENTS'
  | 'SCIENTIFIC_JOURNALS_SUBSCRIPTIONS'
  | 'SCIENTIFIC_JOURNALS_FULL_ISSUES'
  | 'DUBAI_ANALYTICA_STATS'
  | 'DUBAI_ANALYTICA_USERS'
  | 'DUBAI_ANALYTICA_SURVEYS'
  | 'DUBAI_ANALYTICA_PURCHASES'
  | 'DUBAI_ANALYTICA_SUBSCRIPTIONS'
  | 'DUBAI_ANALYTICA_DRI_PAYMENTS';

export type ReportPermissionAsset =
  | 'Funyula'
  | 'RISE'
  | 'PhD Success'
  | 'Coach Academ'
  | 'Velo'
  | 'Safari Books'
  | 'Scientific Journals Portal'
  | 'Dubai Analytica';

export type ReportPermissionGroup = {
  asset: ReportPermissionAsset;
  permissions: ReportPermission[];
};

export const REPORT_PERMISSION_GROUPS: ReportPermissionGroup[] = [
  {
    asset: 'Funyula',
    permissions: [
      'FUNYULA_PAYMENTS',
      'FUNYULA_VOLUNTEERS',
      'FUNYULA_SAMIA_WOMEN',
      'FUNYULA_MANIFESTO',
    ],
  },
  {
    asset: 'RISE',
    permissions: ['RISE_PROFILES', 'RISE_INVESTORS', 'RISE_SCHEDULING'],
  },
  {
    asset: 'PhD Success',
    permissions: ['PHD_SCHEDULING'],
  },
  {
    asset: 'Coach Academ',
    permissions: [
      'COACH_ACADEM_STATS',
      'COACH_ACADEM_TEACHERS',
      'COACH_ACADEM_PARENTS',
      'COACH_ACADEM_ORGANIZATIONS',
      'COACH_ACADEM_PURCHASES',
      'COACH_ACADEM_PENDING_SUBJECTS',
      'COACH_ACADEM_REPORTS',
    ],
  },
  {
    asset: 'Velo',
    permissions: [
      'VELO_STATS',
      'VELO_SENDERS',
      'VELO_AGENTS',
      'VELO_SHIPMENTS',
      'VELO_PURCHASES',
      'VELO_LISTINGS',
      'VELO_CONTACT_INQUIRIES',
      'VELO_APPOINTMENTS',
    ],
  },
  {
    asset: 'Safari Books',
    permissions: [
      'SAFARI_BOOKS_STATS',
      'SAFARI_BOOKS_LISTENERS',
      'SAFARI_BOOKS_PUBLISHERS',
      'SAFARI_BOOKS_BOOKS',
      'SAFARI_BOOKS_PENDING',
    ],
  },
  {
    asset: 'Scientific Journals Portal',
    permissions: [
      'SCIENTIFIC_JOURNALS_STATS',
      'SCIENTIFIC_JOURNALS_USERS',
      'SCIENTIFIC_JOURNALS_REVIEWERS',
      'SCIENTIFIC_JOURNALS_ARTICLES',
      'SCIENTIFIC_JOURNALS_PAYMENTS',
      'SCIENTIFIC_JOURNALS_SUBSCRIPTIONS',
      'SCIENTIFIC_JOURNALS_FULL_ISSUES',
    ],
  },
  {
    asset: 'Dubai Analytica',
    permissions: [
      'DUBAI_ANALYTICA_STATS',
      'DUBAI_ANALYTICA_USERS',
      'DUBAI_ANALYTICA_SURVEYS',
      'DUBAI_ANALYTICA_PURCHASES',
      'DUBAI_ANALYTICA_SUBSCRIPTIONS',
      'DUBAI_ANALYTICA_DRI_PAYMENTS',
    ],
  },
];

export const REPORT_PERMISSIONS: ReportPermission[] = REPORT_PERMISSION_GROUPS.flatMap(
  (group) => group.permissions
);

export const COACH_ACADEM_PERMS = REPORT_PERMISSION_GROUPS.find((g) => g.asset === 'Coach Academ')!
  .permissions;
export const VELO_PERMS = REPORT_PERMISSION_GROUPS.find((g) => g.asset === 'Velo')!.permissions;
export const SAFARI_BOOKS_PERMS = REPORT_PERMISSION_GROUPS.find((g) => g.asset === 'Safari Books')!
  .permissions;
export const SCIENTIFIC_JOURNALS_PERMS = REPORT_PERMISSION_GROUPS.find(
  (g) => g.asset === 'Scientific Journals Portal'
)!.permissions;
export const DUBAI_ANALYTICA_PERMS = REPORT_PERMISSION_GROUPS.find(
  (g) => g.asset === 'Dubai Analytica'
)!.permissions;

/** Short labels shown under an asset section header */
export const REPORT_PERMISSION_LABELS: Record<ReportPermission, string> = {
  FUNYULA_PAYMENTS: 'Payments / contributions',
  FUNYULA_VOLUNTEERS: 'Volunteers',
  FUNYULA_SAMIA_WOMEN: 'Samia Women registrations',
  FUNYULA_MANIFESTO: 'Manifesto users',
  RISE_PROFILES: 'Profile reports',
  RISE_INVESTORS: 'Investors',
  RISE_SCHEDULING: 'Scheduling',
  PHD_SCHEDULING: 'Scheduling',
  COACH_ACADEM_STATS: 'Platform overview',
  COACH_ACADEM_TEACHERS: 'Teachers joined',
  COACH_ACADEM_PARENTS: 'Parents joined',
  COACH_ACADEM_ORGANIZATIONS: 'Organizations',
  COACH_ACADEM_PURCHASES: 'Purchases',
  COACH_ACADEM_PENDING_SUBJECTS: 'Subjects awaiting review',
  COACH_ACADEM_REPORTS: 'Abuse / moderation reports',
  VELO_STATS: 'Platform overview',
  VELO_SENDERS: 'Senders joined',
  VELO_AGENTS: 'Agents & sub-agents',
  VELO_SHIPMENTS: 'Shipments created',
  VELO_PURCHASES: 'Paid purchases',
  VELO_LISTINGS: 'Marketplace listings',
  VELO_CONTACT_INQUIRIES: 'Contact inquiries',
  VELO_APPOINTMENTS: 'Agent appointments',
  SAFARI_BOOKS_STATS: 'Platform overview',
  SAFARI_BOOKS_LISTENERS: 'Listeners joined',
  SAFARI_BOOKS_PUBLISHERS: 'Publishers',
  SAFARI_BOOKS_BOOKS: 'Books catalog',
  SAFARI_BOOKS_PENDING: 'Pending verifications',
  SCIENTIFIC_JOURNALS_STATS: 'Platform overview',
  SCIENTIFIC_JOURNALS_USERS: 'User signups',
  SCIENTIFIC_JOURNALS_REVIEWERS: 'Reviewer signups',
  SCIENTIFIC_JOURNALS_ARTICLES: 'Articles submitted',
  SCIENTIFIC_JOURNALS_PAYMENTS: 'Article payments',
  SCIENTIFIC_JOURNALS_SUBSCRIPTIONS: 'Subscriptions',
  SCIENTIFIC_JOURNALS_FULL_ISSUES: 'Full-issue purchases',
  DUBAI_ANALYTICA_STATS: 'Platform overview',
  DUBAI_ANALYTICA_USERS: 'User signups',
  DUBAI_ANALYTICA_SURVEYS: 'Surveys created',
  DUBAI_ANALYTICA_PURCHASES: 'Market purchases',
  DUBAI_ANALYTICA_SUBSCRIPTIONS: 'Pro subscriptions',
  DUBAI_ANALYTICA_DRI_PAYMENTS: 'DRI report payments',
};

export function formatPermissionWithAsset(permission: ReportPermission): string {
  const group = REPORT_PERMISSION_GROUPS.find((g) => g.permissions.includes(permission));
  const asset = group?.asset ?? 'Report';
  return `${asset}: ${REPORT_PERMISSION_LABELS[permission]}`;
}

export type AppUser = {
  id: string;
  username: string;
  displayName: string | null;
  role: AppRole;
  createdById: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: ReportPermission[];
};

export type AppLoginResponse = {
  success: boolean;
  data: {
    token: string;
    expiresAt: string;
    user: AppUser;
  };
};

export type AppMeResponse = {
  success: boolean;
  data: {
    user: AppUser;
    expiresAt: string;
  };
};

export type AppUsersResponse = {
  success: boolean;
  data: {
    users: AppUser[];
  };
};

export type AppUserResponse = {
  success: boolean;
  data: {
    user: AppUser;
  };
};
