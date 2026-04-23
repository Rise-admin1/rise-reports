export interface Payment {
  id: string;
  merchantRequestID: string;
  checkoutRequestID: string;
  phoneNumber: string;
  amount: string;
  mpesaReceiptNumber: string | null;
  accountReference: string | null;
  transactionDate: string | null;
  status: string;
  resultCode: number;
  resultDesc: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  totalAmount: string;
}

export interface Summary {
  totalAmount: string;
  totalTransactions: number;
  statusBreakdown: StatusBreakdown[];
}

export interface FunyulaReportsResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: Pagination;
    summary: Summary;
  };
}

/** RISE profile / investor item (same shape for both endpoints) */
export interface RiseReportItem {
  id: string;
  name: string;
  email: string;
  receipt_url: string;
  createdAt: string;
}

export interface RisePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RiseReportsResponse {
  data: RiseReportItem[];
  pagination: RisePagination;
}

/** Query `role` for GET /volunteer/all — `ALL` means no filter (omit param or use ALL). */
export type VolunteerRoleFilter = 'ALL' | 'POLLING_AGENT' | 'BLOGGING_TEAM' | 'VOTER';
/** Query `gender` for GET /volunteer/all — `ALL` means no filter. */
export type VolunteerGenderFilter = 'ALL' | 'MALE' | 'FEMALE';
export type VolunteerFieldFilters = {
  id?: string;
  fullName?: string;
  name?: string;
  ward?: string;
  phone?: string;
  location?: string;
  subLocation?: string;
  pollingStation?: string;
  message?: string;
};

export interface Volunteer {
  id: string;
  fullName: string;
  role?: string;
  gender?: string;
  ward: string;
  location: string;
  subLocation: string;
  pollingStation: string;
  phone: string;
  createdAt: string;
}

export interface VolunteerPagination {
  offset: number;
  limit: number;
  totalCount: number;
}

export interface VolunteersResponse {
  data: Volunteer[];
  pagination: VolunteerPagination;
}

export interface ExpoRegistration {
  id: string;
  groupName: string;
  designation: string;
  groupLeaderName: string;
  yourName: string;
  idNumber: string;
  phoneNumber: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpoRegistrationsResponse {
  data: ExpoRegistration[];
  pagination: VolunteerPagination;
}

export type ExpoFieldFilters = {
  groupName?: string;
  designation?: string;
  groupLeaderName?: string;
  yourName?: string;
  phoneNumber?: string;
};
