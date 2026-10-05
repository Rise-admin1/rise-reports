export type CoachAcademStats = {
  studentsJoined: number;
  teachersJoined: number;
  parentsJoined: number;
  organizations: number;
  subjectsVerified: number;
  subjectsAwaitingReview: number;
  subjectsCreatedEstimate: number;
  confirmedPurchases: number;
  totalSpendMinor: number;
  abuseReports: number;
};

export type CoachAcademStatsResponse = {
  success: boolean;
  data: CoachAcademStats;
};

export type CoachAcademPendingSubject = {
  id: string;
  subjectName?: string;
  subjectGrade?: number | string | null;
  subjectBoard?: string | null;
  subjectPrice?: number | null;
  createdAt?: string;
  teacherProfileId?: string | null;
  [key: string]: unknown;
};

export type CoachAcademTeacher = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  organizationName: string | null;
  organizationRole: string | null;
  verifiedSubjects: number;
  pendingSubjects: number;
  rejectedSubjects: number;
};

export type CoachAcademTeachersResponse = {
  page: number;
  pageSize: number;
  total: number;
  teachers: CoachAcademTeacher[];
};

export type CoachAcademParent = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  acceptedLinks: number;
  pendingLinks: number;
};

export type CoachAcademParentsResponse = {
  page: number;
  pageSize: number;
  total: number;
  parents: CoachAcademParent[];
};

export type CoachAcademOrganization = {
  id: string;
  orgName: string;
  orgEmail: string | null;
  orgWebsite: string | null;
  orgCapacity: number | null;
  memberCount: number;
  teamLeadName: string | null;
  teamLeadEmail: string | null;
  createdAt: string;
};

export type CoachAcademOrganizationsResponse = {
  page: number;
  pageSize: number;
  total: number;
  organizations: CoachAcademOrganization[];
};

export type CoachAcademPurchase = {
  id: string;
  studentName?: string | null;
  studentEmail?: string | null;
  subjectName?: string | null;
  purchaseAmount?: number | null;
  purchaseCurrency?: string | null;
  purchaseDate?: string | null;
  receiptUrl?: string | null;
  [key: string]: unknown;
};

export type CoachAcademPurchasesResponse = {
  page: number;
  pageSize: number;
  total: number;
  purchases: CoachAcademPurchase[];
};

export type CoachAcademAbuseReport = {
  id: string;
  reason?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};
