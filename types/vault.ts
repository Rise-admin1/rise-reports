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
