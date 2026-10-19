export type ScientificJournalsStats = {
  usersJoined: number;
  reviewersJoined: number;
  reviewersPending: number;
  reviewersApproved: number;
  articlesSubmitted: number;
  articlesPublished: number;
  articlesInReview: number;
  articlesAccepted: number;
  paidArticles: number;
  articlePaymentTotalMinor: number;
  subscriptionsTotal: number;
  activeSubscriptions: number;
  fullIssuePurchases: number;
  fullIssueRevenueMinor: number;
  journalsCount: number;
};

export type ScientificJournalsStatsResponse = {
  success: boolean;
  data: ScientificJournalsStats;
};

export type ScientificJournalsUser = {
  id: string;
  email: string;
  name: string;
  affiliation: string;
  emailVerified: boolean;
  articlesCount: number;
  createdAt: string;
};

export type ScientificJournalsUsersResponse = {
  page: number;
  pageSize: number;
  total: number;
  users: ScientificJournalsUser[];
};

export type ScientificJournalsReviewer = {
  id: string;
  email: string;
  name: string;
  affiliation: string;
  cvUrl: string | null;
  reviewerApproved: boolean;
  acceptedArticlesCount: number;
  createdAt: string;
};

export type ScientificJournalsReviewersResponse = {
  page: number;
  pageSize: number;
  total: number;
  reviewers: ScientificJournalsReviewer[];
};

export type ScientificJournalsArticle = {
  id: string;
  title: string;
  status: string;
  issue: number;
  volume: number;
  paymentStatus: boolean;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  paymentDate: string | null;
  accessModel: string;
  isPublished: boolean;
  isAccepted: boolean;
  isReview: boolean;
  journalTitle: string | null;
  journalAbbreviation: string | null;
  submitterEmail: string | null;
  submitterName: string | null;
  createdAt: string;
};

export type ScientificJournalsArticlesResponse = {
  page: number;
  pageSize: number;
  total: number;
  articles: ScientificJournalsArticle[];
};

export type ScientificJournalsPayment = {
  id: string;
  articleTitle: string;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  paymentDate: string | null;
  paymentIntent: string | null;
  invoiceUrl: string | null;
  accessModel: string;
  payerEmail: string | null;
  payerName: string | null;
  journalTitle: string | null;
};

export type ScientificJournalsPaymentsResponse = {
  page: number;
  pageSize: number;
  total: number;
  payments: ScientificJournalsPayment[];
};

export type ScientificJournalsSubscription = {
  id: string;
  email: string;
  isSubscribed: boolean;
  amountMinor: number;
  periodStart: number;
  periodEnd: number;
  isActive: boolean;
  invoiceId: string;
  customerId: string;
  invoiceUrl: string;
  invoicePdf: string;
  userName: string | null;
  createdAt: string;
};

export type ScientificJournalsSubscriptionsResponse = {
  page: number;
  pageSize: number;
  total: number;
  subscriptions: ScientificJournalsSubscription[];
};

export type ScientificJournalsFullIssuePurchase = {
  paymentIntent: string;
  amountMinor: number | null;
  currency: string | null;
  invoiceUrl: string | null;
  userEmail: string | null;
  userName: string | null;
  journalTitle: string | null;
  journalAbbreviation: string | null;
  volume: number | null;
  issue: number | null;
};

export type ScientificJournalsFullIssuePurchasesResponse = {
  page: number;
  pageSize: number;
  total: number;
  purchases: ScientificJournalsFullIssuePurchase[];
};

export type ScientificJournalsJournalBrief = {
  id: string;
  journalTitle: string;
  journalAbbreviation: string;
  journalISSN: string | null;
  journalDOI: string | null;
  journalLanguage: string | null;
  journalDescription?: string;
  journalStartYear?: number;
  journalStartMonth?: number;
  journalPublishedArticles?: number;
  journalImageURL?: string;
};

export type ScientificJournalsUserDetail = {
  id: string;
  email: string;
  title: string;
  surname: string;
  otherName: string;
  name: string;
  affiliation: string;
  emailVerified: boolean;
  confirmed: boolean;
  marketingCommunications: boolean;
  userType: string;
  createdAt: string;
  articles: Array<{
    id: string;
    articleTitle: string;
    articleStatus: string;
    isPublished: boolean;
    isAccepted: boolean;
    isReview: boolean;
    paymentStatus: boolean;
    articleIssue: number;
    articleVolume: number;
    createdAt: string;
    journal: ScientificJournalsJournalBrief | null;
  }>;
  subscriptions: Array<{
    id: string;
    isSubscribed: boolean;
    amountMinor: number;
    subscriptionEmail: string;
    periodStart: number;
    periodEnd: number;
    invoiceId: string;
    invoiceUrl: string;
    createdAt: string;
  }>;
  fullIssuePurchases: Array<{
    paymentIntent: string;
    amountMinor: number | null;
    currency: string | null;
    invoiceUrl: string | null;
    volume: number | null;
    issue: number | null;
    journalTitle: string | null;
    journalAbbreviation: string | null;
  }>;
  counts: {
    articles: number;
    subscriptions: number;
    fullIssuePurchases: number;
  };
};

export type ScientificJournalsReviewerDetail = {
  id: string;
  email: string;
  title: string;
  surname: string;
  otherName: string;
  name: string;
  affiliation: string;
  emailVerified: boolean;
  cvUrl: string | null;
  reviewerApproved: boolean;
  userType: string;
  createdAt: string;
  acceptedArticles: Array<{
    id: string;
    articleTitle: string;
    articleStatus: string;
    isPublished: boolean;
    isAccepted: boolean;
    journal: ScientificJournalsJournalBrief | null;
    submitter: { id: string; email: string; name: string | null } | null;
  }>;
  counts: { acceptedArticles: number };
};

export type ScientificJournalsArticleDetail = {
  id: string;
  articleTitle: string;
  articleAbstract: string;
  articleKeywords: string;
  articleAuthors: unknown;
  filesURL: unknown;
  rejectionFilesURL: unknown;
  articleIssue: number;
  articleVolume: number;
  articleStatus: string;
  isReview: boolean;
  isPublished: boolean;
  isAccepted: boolean;
  specialReview: boolean;
  rejectionText: string;
  articleReceivedDate: string;
  articleAcceptedDate: string;
  articlePublishedDate: string;
  createdAt: string;
  updatedAt: string;
  publicPdfName: string;
  publishedPdfName: string | null;
  awsId: string;
  payment: {
    paymentStatus: boolean;
    paymentIntent: string | null;
    paymentAmount: number | null;
    paymentCurrency: string | null;
    paymentDate: string | null;
    invoiceUrl: string | null;
    accessModel: string;
  };
  journal: ScientificJournalsJournalBrief | null;
  submitter: {
    id: string;
    email: string;
    name: string | null;
    affiliation: string;
  } | null;
  reviewerAcceptedBy: { id: string; email: string; name: string | null } | null;
};

export type ScientificJournalsPaymentDetail = ScientificJournalsArticleDetail;

export type ScientificJournalsSubscriptionDetail = {
  id: string;
  email: string;
  isSubscribed: boolean;
  amountMinor: number;
  periodStart: number;
  periodEnd: number;
  isActive: boolean;
  invoiceId: string;
  customerId: string;
  invoiceUrl: string;
  invoicePdf: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    affiliation: string;
  } | null;
};

export type ScientificJournalsFullIssuePurchaseDetail = {
  paymentIntent: string;
  amountMinor: number | null;
  currency: string | null;
  invoiceUrl: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    affiliation: string;
  } | null;
  fullIssue: {
    id: string;
    issueVolume: number;
    issueNumber: number;
    issuePrice: string;
    issueImageURL: string;
    issueDoccumentURL: string;
    stripe_lookupId: string;
    issueCount: number;
    journal: ScientificJournalsJournalBrief | null;
  } | null;
};
