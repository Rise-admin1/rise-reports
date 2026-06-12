export type VaultDocument = {
  id: string;
  title?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export type VaultPagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type FetchVaultDocumentsResponse = {
  success: boolean;
  data: {
    documents: VaultDocument[];
    pagination: VaultPagination;
  };
};

export type VaultRole = 'ADMIN' | 'GUEST';

export type VaultSession = {
  token: string;
  username: string;
  role: VaultRole;
  expiresAt: string | null;
  documentIds: string[];
};

export type VaultLoginResponse = {
  success: boolean;
  data: VaultSession;
};

export type VaultMeResponse = {
  success: boolean;
  data: {
    username: string;
    role: VaultRole;
    expiresAt: string | null;
    documentIds: string[];
  };
};

export type VaultGuestDocument = {
  id: string;
  title?: string;
  originalName: string;
};

export type VaultGuestAccess = {
  id: string;
  username: string;
  expiresAt: string;
  createdAt: string;
  documents: VaultGuestDocument[];
};

export type FetchVaultGuestAccessResponse = {
  success: boolean;
  data: {
    guests: VaultGuestAccess[];
  };
};

export type CreateVaultGuestAccessResponse = {
  success: boolean;
  data: VaultGuestAccess;
};
