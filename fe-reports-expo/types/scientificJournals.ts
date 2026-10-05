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
