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

export type SafariBooksPublisherType = 'company' | 'author';

export type SafariBooksListenerDetail = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  firstTimeLogin: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  library: Array<{
    id: string;
    status: string;
    timestamp: number;
    createdAt: string;
    updatedAt: string;
    book: {
      id: string;
      title: string;
      authorName: string;
      coverImage: string;
      isPublished: boolean;
    } | null;
  }>;
  bookmarks: Array<{
    id: string;
    createdAt: string;
    book: {
      id: string;
      title: string;
      authorName: string;
      coverImage: string;
    } | null;
  }>;
  likes: Array<{
    id: string;
    createdAt: string;
    book: {
      id: string;
      title: string;
      authorName: string;
      coverImage: string;
    } | null;
  }>;
  counts: {
    library: number;
    bookmarks: number;
    likes: number;
  };
};

export type SafariBooksPublisherBook = {
  id: string;
  title: string;
  authorName: string;
  narratorName: string;
  isPublished: boolean;
  featuredBook: boolean;
  amount: number;
  rating: number;
  libraryCount: number;
  likesCount: number;
  bookmarksCount: number;
  createdAt: string;
};

export type SafariBooksPublisherDetail = {
  id: string;
  type: SafariBooksPublisherType;
  displayName: string;
  address: string;
  telephone: string;
  isVerified: boolean;
  isRejected: boolean;
  reject: string | null;
  rejectedAt: string | null;
  isRegistrationComplete: boolean;
  registrationStartedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    createdAt: string;
  } | null;
  title: string | null;
  language: string | null;
  categories: string | null;
  date: string | null;
  ISBNDOIISRC: string | null;
  synopsis: string | null;
  narrator: string | null;
  narrationSampleHeartzRate: string | null;
  narrationSpeakingRate: string | null;
  narrationGender: string | null;
  narrationLanguageCode: string | null;
  narrationVoiceName: string | null;
  narrationSegments: string | null;
  audioSampleURL: string | null;
  completeAudioUrl: string | null;
  pdfURL: string | null;
  coverImage: string | null;
  amount: number;
  rightsHolder: boolean | null;
  companyRegNo?: string;
  kraPin?: string;
  companyRegNoPdfUrl?: string;
  kraPinPdfUrl?: string;
  idppNo?: string;
  idppPdfUrl?: string;
  writersGuildNo?: string | null;
  books: SafariBooksPublisherBook[];
  counts: { books: number };
};

export type SafariBooksBookDetail = {
  id: string;
  title: string;
  description: string;
  summary: string;
  durationInHours: number;
  durationInMinutes: number;
  coverImage: string;
  authorName: string;
  narratorName: string;
  releaseDate: string;
  language: string;
  publisher: string;
  rating: number;
  categories: string;
  colorCode: string | null;
  sampleAudioURL: string | null;
  completeAudioUrl: string | null;
  isPublished: boolean;
  featuredBook: boolean;
  amount: number;
  timeStamp: unknown;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  company: { id: string; companyName: string; isVerified: boolean } | null;
  author: { id: string; fullName: string; isVerified: boolean } | null;
  user: { id: string; name: string; email: string } | null;
  counts: {
    library: number;
    likes: number;
    bookmarks: number;
  };
};
