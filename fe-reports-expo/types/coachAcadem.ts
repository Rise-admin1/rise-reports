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

export type CoachAcademTeacherSubject = {
  id: string;
  subjectName: string;
  subjectBoard: string | null;
  subjectGrade: number | null;
  subjectPrice: number | null;
  subjectVerification: boolean;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  submittedForVerificationAt: string;
  courseType: string;
  status: 'verified' | 'pending' | 'rejected';
};

export type CoachAcademTeacherDetail = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  userDescription: string;
  verified: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  teacherProfile: {
    id: string;
    zoomAccountCreated: boolean;
    zoomUserAcceptedInvite: boolean;
    isTeamLead: boolean;
    organizationRole: string | null;
    organization: { id: string; orgName: string; orgEmail: string | null } | null;
  };
  subjects: CoachAcademTeacherSubject[];
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

export type CoachAcademParentLink = {
  id: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  student: {
    id: string;
    userId: string;
    name: string | null;
    email: string | null;
    profileImage: string | null;
  };
};

export type CoachAcademParentDetail = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  createdAt: string;
  links: CoachAcademParentLink[];
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

export type CoachAcademOrganizationMember = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  organizationRole: string | null;
  isTeamLead: boolean;
};

export type CoachAcademOrganizationDetail = {
  id: string;
  orgName: string;
  orgEmail: string | null;
  orgWebsite: string | null;
  orgLicense: string | null;
  orgCapacity: number | null;
  createdAt: string;
  updatedAt: string;
  teamLead: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    organizationRole: string | null;
  } | null;
  members: CoachAcademOrganizationMember[];
  memberCount: number;
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
  purchaseReceiptUrl?: string | null;
  [key: string]: unknown;
};

export type CoachAcademPurchasesResponse = {
  page: number;
  pageSize: number;
  total: number;
  purchases: CoachAcademPurchase[];
};

export type CoachAcademPurchaseDetail = {
  id: string;
  purchaseAmount: number;
  purchaseCurrency: string;
  purchaseDate: string;
  purchaseStatus: string;
  paymentStatus: string;
  purchaseReceiptUrl: string | null;
  stripeCustomerId: string | null;
  stripeChargeId: string | null;
  createdAt: string;
  student: {
    profileId: string | null;
    userId: string | null;
    name: string | null;
    email: string | null;
  };
  subject: {
    id: string;
    subjectName: string;
    courseType: string;
    subjectBoard: string | null;
    subjectGrade: number | null;
    subjectPrice: number | null;
  } | null;
  booking: {
    id: string;
    bookingStatus: string;
    bookingDate: string | null;
    bookingTime: string | null;
    bookingHours: number | null;
    bookingMinutes: number | null;
    bookingZoomUrl: string | null;
    subjectTopicId: string | null;
    createdAt: string;
  } | null;
  courseEnrollment: {
    id: string;
    enrollmentStatus: string;
    enrolledAt?: string | null;
    createdAt: string;
  } | null;
};

export type CoachAcademAbuseReport = {
  id: string;
  reason?: string | null;
  reportDescription?: string | null;
  reportStatus?: string | null;
  reportResolution?: string | null;
  createdAt?: string;
  reporterId?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  teacherName?: string | null;
  teacherEmail?: string | null;
  [key: string]: unknown;
};

export type CoachAcademSubjectTopic = {
  id: string;
  orderIndex: number;
  topicTitle: string;
  hours: number;
  scheduledAt?: string | null;
};

export type CoachAcademSubjectDetail = {
  id: string;
  subjectName?: string;
  subjectNameSubHeading?: string | null;
  subjectDescription?: string | null;
  subjectPoints?: string[] | null;
  subjectImage?: string | null;
  subjectPrice?: number | null;
  subjectBoard?: string | null;
  subjectLanguage?: string | null;
  subjectGrade?: number | null;
  subjectDuration?: number | null;
  subjectVerification?: boolean;
  teacherVerification?: string[] | null;
  courseType?: string | null;
  maxCapacity?: number | null;
  currentEnrollment?: number | null;
  scheduledDateTime?: string | null;
  createdAt?: string;
  submittedForVerificationAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  subjectTopics?: CoachAcademSubjectTopic[];
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    profileImage?: string | null;
  } | null;
  [key: string]: unknown;
};
