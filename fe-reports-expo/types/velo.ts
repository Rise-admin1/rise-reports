export type VeloStats = {
  sendersJoined: number;
  agentsJoined: number;
  subAgentsJoined: number;
  organisations: number;
  shipmentsCreated: number;
  completedShipments: number;
  paidPurchases: number;
  totalPurchaseAmount: number;
  shipmentDrafts: number;
  pendingAgentAppointments: number;
  contactInquiries: number;
  paymentPendingShipments: number;
  ordersInMarket: number;
  listingsCreated: number;
};

export type VeloStatsResponse = {
  success: boolean;
  data: VeloStats;
};

export type VeloSender = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  registerVerificationStatus: string;
  shipmentsCount: number;
  createdAt: string;
};

export type VeloSendersResponse = {
  page: number;
  pageSize: number;
  total: number;
  senders: VeloSender[];
};

export type VeloAgent = {
  id: string;
  name: string;
  email: string;
  role: string;
  registerVerificationStatus: string;
  isOrganisationLeader: boolean;
  appointmentDate: string | null;
  organisationName: string | null;
  superAdminApproval: boolean | null;
  createdAt: string;
};

export type VeloAgentsResponse = {
  page: number;
  pageSize: number;
  total: number;
  agents: VeloAgent[];
};

export type VeloShipment = {
  id: string;
  shipmentId: string;
  shipmentStatus: string;
  shipmentDate: string | null;
  paymentSuccess: boolean;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  senderName: string | null;
  senderEmail: string | null;
  receiverLocation: string;
  userName: string | null;
  userEmail: string | null;
};

export type VeloShipmentsResponse = {
  page: number;
  pageSize: number;
  total: number;
  shipments: VeloShipment[];
};

export type VeloPurchase = {
  id: string;
  shipmentId: string;
  purchaseDate: string | null;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  receiptUrl: string | null;
  senderName: string | null;
  senderEmail: string | null;
  stripeId: string | null;
};

export type VeloPurchasesResponse = {
  page: number;
  pageSize: number;
  total: number;
  purchases: VeloPurchase[];
};

export type VeloContactInquiry = {
  id: string;
  name?: string;
  email?: string;
  message?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type VeloContactInquiriesResponse = {
  page: number;
  pageSize: number;
  total: number;
  inquiries: VeloContactInquiry[];
};

export type VeloAppointmentRequest = {
  id: string;
  name?: string;
  email?: string;
  appointmentDate?: string | null;
  registerVerificationStatus?: string;
  organisation?: { organisationName?: string } | null;
  [key: string]: unknown;
};

export type VeloAppointmentRequestsResponse = {
  message?: string;
  allAppointmentRequest: VeloAppointmentRequest[];
};

export type VeloListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  imageUrl: string | null;
  createdAt: string;
  categoryId: string | null;
  categoryName: string | null;
  agentId: string | null;
  agentName: string | null;
  agentEmail: string | null;
  organisationName: string | null;
};

export type VeloListingsResponse = {
  page: number;
  pageSize: number;
  total: number;
  listings: VeloListing[];
};
