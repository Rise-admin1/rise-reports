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

export type DubaiAnalyticaDriType = 'interim' | 'full';

export type DubaiAnalyticaRefundSummary = {
  id: string;
  invoiceId: string;
  refundAmount: number;
  refundCurrency: string;
  refundStatus: string;
  refundReason: string | null;
  requestedAt: string;
  processedAt: string | null;
  createdAt: string;
};

export type DubaiAnalyticaUserDetail = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  emailVerified: boolean;
  isGoogleUser: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAProMember: boolean;
  receiveMarketingEmails: boolean;
  createdAt: string;
  updatedAt: string;
  surveys: Array<{
    id: string;
    surveyTitle: string;
    surveyStatus: string;
    surveyViews: number;
    surveyCompleted: number;
    surveyResponses: number;
    responsesCount: number;
    createdAt: string;
  }>;
  purchases: Array<{
    id: string;
    responseQuantity: number;
    amountPaid: number;
    amountCurrency: string;
    paidStatus: boolean;
    stripePaymentIntentId: string;
    createdAt: string;
  }>;
  proMember: {
    id: string;
    email: string;
    amountMinor: number;
    periodStart: number;
    periodEnd: number;
    isSubscribed: boolean;
    isActive: boolean;
    invoiceId: string;
    invoiceUrl: string;
    invoicePdf: string;
    customerId: string;
    createdAt: string;
  } | null;
  refundRequests: DubaiAnalyticaRefundSummary[];
  zoomConnection: {
    id: string;
    zoomUserId: string;
    zoomEmail: string | null;
    tokenExpiresAt: string;
  } | null;
  counts: {
    surveys: number;
    purchases: number;
    refundRequests: number;
    aiSurveyGenerations: number;
    assistantChatUsages: number;
  };
};

export type DubaiAnalyticaSurveyDetail = {
  id: string;
  surveyTitle: string;
  surveyDescription: string;
  surveyStatus: string;
  surveyViews: number;
  surveyCompleted: number;
  surveyResponses: number;
  surveyIntroduction: string | null;
  formQuestions: unknown;
  surveyForms: unknown;
  selectedItems: unknown;
  formQuestionsCount: number;
  surveyFormsCount: number;
  selectedItemsCount: number;
  targetCountry: string;
  targetCountries: unknown;
  closesAt: string | null;
  maxResponses: number | null;
  oneResponsePerPerson: boolean;
  surveyLayout: string;
  brandLogoUrl: string | null;
  brandColor: string | null;
  hidePoweredBy: boolean;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; email: string; name: string | null } | null;
  responses: Array<{
    id: string;
    userEmail: string;
    userName: string;
    isComplete: boolean;
    userTimeSpent: string;
    createdAt: string;
  }>;
  inviteCampaigns: Array<{
    id: string;
    subject: string;
    status: string;
    reminderAfterHours: number | null;
    recipientsCount: number;
    createdAt: string;
  }>;
  counts: {
    responses: number;
    inviteCampaigns: number;
    aiGenerations: number;
  };
};

export type DubaiAnalyticaPurchaseDetail = {
  id: string;
  sessionIdUrl: string;
  userEmail: string;
  responseQuantity: number;
  amountPaid: number;
  amountCurrency: string;
  paidStatus: boolean;
  stripePaymentIntentId: string;
  receiptUrl: string;
  selectedRegions: string;
  selectedIndustries: string;
  selectedEducationLevels: string;
  selectedPositions: string;
  selectedExperience: string;
  stripeName: string;
  stripeCountry: string | null;
  stripeAddressLineOne: string | null;
  stripeAddressLineTwo: string | null;
  stripePostalCode: string | null;
  stripeState: string | null;
  stripeCardBrand: string | null;
  stripeCardLastFourDigit: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; name: string | null } | null;
};

export type DubaiAnalyticaSubscriptionDetail = {
  id: string;
  email: string;
  amountMinor: number;
  periodStart: number;
  periodEnd: number;
  isSubscribed: boolean;
  isActive: boolean;
  invoiceId: string;
  invoiceUrl: string;
  invoicePdf: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; name: string | null } | null;
  refundRequests: DubaiAnalyticaRefundSummary[];
};

export type DubaiAnalyticaDriScores = {
  cat1: number | null;
  cat2: number | null;
  cat3: number | null;
  cat4: number | null;
  cat5: number | null;
  cat6: number | null;
  cat7: number | null;
  cat8: number | null;
  cat9: number | null;
  cat10: number | null;
  fullCat1: number | null;
  fullCat2: number | null;
  fullCat3: number | null;
  fullCat4: number | null;
  fullCat5: number | null;
  fullCat6: number | null;
  fullCat7: number | null;
  fullCat8: number | null;
  fullCat9: number | null;
  fullCat10: number | null;
  bandPositionLabel: string;
  fullBandPositionLabel: string | null;
  fullScorePercent: number | null;
};

export type DubaiAnalyticaDriPaymentDetail = {
  id: string;
  type: DubaiAnalyticaDriType;
  paidStatus: boolean;
  stripeId: string;
  emailId: string;
  createdAt: string;
  response: {
    id: string;
    userEmail: string;
    userName: string;
    isComplete: boolean;
    userTimeSpent: string;
    createdAt: string;
    survey: { id: string; surveyTitle: string; surveyStatus: string } | null;
  } | null;
  driScores: DubaiAnalyticaDriScores | null;
};
