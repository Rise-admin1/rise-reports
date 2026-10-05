export type DubaiAnalyticaStats = {
  usersJoined: number;
  guestUsers: number;
  verifiedUsers: number;
  proMembers: number;
  activeSubscriptions: number;
  surveysTotal: number;
  surveysPublished: number;
  surveysDraft: number;
  surveyResponses: number;
  marketPurchases: number;
  marketPurchaseTotalMinor: number;
  driInterimPaid: number;
  driFullPaid: number;
  refundRequests: number;
  pendingRefunds: number;
  inviteCampaigns: number;
  aiSurveyGenerations: number;
};

export type DubaiAnalyticaStatsResponse = {
  success: boolean;
  data: DubaiAnalyticaStats;
};

export type DubaiAnalyticaUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isProMember: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  surveysCount: number;
  purchasesCount: number;
  subscriptionActive: boolean;
  createdAt: string;
};

export type DubaiAnalyticaUsersResponse = {
  page: number;
  pageSize: number;
  total: number;
  users: DubaiAnalyticaUser[];
};

export type DubaiAnalyticaSurvey = {
  id: string;
  title: string;
  status: string;
  views: number;
  completed: number;
  responsesTracked: number;
  responsesCount: number;
  ownerEmail: string | null;
  ownerName: string | null;
  createdAt: string;
};

export type DubaiAnalyticaSurveysResponse = {
  page: number;
  pageSize: number;
  total: number;
  surveys: DubaiAnalyticaSurvey[];
};

export type DubaiAnalyticaPurchase = {
  id: string;
  email: string;
  name: string | null;
  quantity: number;
  amountPaid: number;
  currency: string;
  paymentIntentId: string;
  receiptUrl: string;
  country: string | null;
  regions: string;
  industries: string;
  createdAt: string;
};

export type DubaiAnalyticaPurchasesResponse = {
  page: number;
  pageSize: number;
  total: number;
  purchases: DubaiAnalyticaPurchase[];
};

export type DubaiAnalyticaSubscription = {
  id: string;
  email: string;
  amountMinor: number;
  periodStart: number;
  periodEnd: number;
  isSubscribed: boolean;
  isActive: boolean;
  invoiceId: string;
  invoiceUrl: string;
  userName: string | null;
  createdAt: string;
};

export type DubaiAnalyticaSubscriptionsResponse = {
  page: number;
  pageSize: number;
  total: number;
  subscriptions: DubaiAnalyticaSubscription[];
};

export type DubaiAnalyticaDriPayment = {
  id: string;
  type: 'interim' | 'full';
  email: string | null;
  respondentName: string | null;
  surveyTitle: string | null;
  stripeId: string;
  createdAt: string;
};

export type DubaiAnalyticaDriPaymentsResponse = {
  page: number;
  pageSize: number;
  total: number;
  payments: DubaiAnalyticaDriPayment[];
};
