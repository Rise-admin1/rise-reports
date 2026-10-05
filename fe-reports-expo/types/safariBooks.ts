export type SafariBooksStats = {
  listenersJoined: number;
  publishersJoined: number;
  narratorsJoined: number;
  companiesTotal: number;
  companiesVerified: number;
  companiesPending: number;
  companiesRejected: number;
  authorsTotal: number;
  authorsVerified: number;
  authorsPending: number;
  authorsRejected: number;
  publishersPending: number;
  booksTotal: number;
  booksPublished: number;
  booksFeatured: number;
  libraryEntries: number;
  bookmarks: number;
  likes: number;
};

export type SafariBooksStatsResponse = {
  success: boolean;
  data: SafariBooksStats;
};

export type SafariBooksListener = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  libraryCount: number;
  bookmarksCount: number;
  likesCount: number;
  createdAt: string;
};

export type SafariBooksListenersResponse = {
  page: number;
  pageSize: number;
  total: number;
  listeners: SafariBooksListener[];
};

export type SafariBooksPublisher = {
  id: string;
  type: 'company' | 'author';
  displayName: string;
  bookTitle: string | null;
  email: string | null;
  userName: string | null;
  isVerified: boolean;
  isRejected: boolean;
  isRegistrationComplete: boolean;
  booksCount: number;
  createdAt: string;
};

export type SafariBooksPublishersResponse = {
  page: number;
  pageSize: number;
  total: number;
  publishers: SafariBooksPublisher[];
};

export type SafariBooksBook = {
  id: string;
  title: string;
  authorName: string;
  narratorName: string;
  publisher: string;
  category: string;
  amount: number;
  isPublished: boolean;
  featuredBook: boolean;
  rating: number;
  libraryCount: number;
  likesCount: number;
  bookmarksCount: number;
  createdAt: string;
  publishedAt: string | null;
};

export type SafariBooksBooksResponse = {
  page: number;
  pageSize: number;
  total: number;
  books: SafariBooksBook[];
};

export type SafariBooksPendingPublisher = {
  id: string;
  companyName?: string;
  fullName?: string;
  title?: string | null;
  isVerified?: boolean;
  isRejected?: boolean;
  user?: { name?: string; email?: string } | null;
  [key: string]: unknown;
};

export type SafariBooksPendingVerificationsResponse = {
  message?: string;
  company: SafariBooksPendingPublisher[];
  author: SafariBooksPendingPublisher[];
};
