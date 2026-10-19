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

export type VeloCountryBrief = {
  id: number;
  name: string;
  isoCode: string;
  flag?: string | null;
  region?: string | null;
};

export type VeloOrganisationDetail = {
  id: string;
  organisationName: string | null;
  organisationAddress: string | null;
  organisationWebsiteUrl: string | null;
  modeOfWork: string;
  superAdminApproval: boolean;
  organisationEmployeesCount: number;
  documentPricePerPiece: number;
  packagePricePerKg: number;
  packagePricePerPiece: number;
  deliveryTimeline: number;
};

export type VeloSenderDetail = {
  id: string;
  name: string;
  email: string;
  mobileCode: string;
  mobileCountry: string;
  mobileNumber: string;
  registerVerificationStatus: string;
  firstTimeLogin: boolean;
  createdAt: string;
  updatedAt: string;
  addresses: Array<{
    id: string;
    addressOne: string;
    addressTwo: string;
    city: string;
    state: string;
    zipCode: string;
    country: VeloCountryBrief | null;
  }>;
  savedAddresses: Array<{
    id: string;
    name: string;
    companyName: string | null;
    addressOne: string;
    addressTwo: string;
    city: string;
    state: string;
    zipCode: string;
    email: string;
    mobileNumber: string;
    countryCode: string;
    residentAddress: boolean;
    country: Pick<VeloCountryBrief, 'id' | 'name' | 'isoCode'> | null;
  }>;
  shipments: Array<{
    id: string;
    shipmentId: string | null;
    shipmentStatus: string;
    shipmentDate: string | null;
    paymentSuccess: boolean;
    paymentAmount: number | null;
    paymentCurrency: string | null;
    receiverCity: string;
    receiverState: string;
  }>;
  completedShipmentsCount: number;
  shipmentDraftsCount: number;
  counts: {
    addresses: number;
    savedAddresses: number;
    shipments: number;
    completedShipments: number;
    drafts: number;
  };
};

export type VeloAgentDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  mobileCode: string;
  mobileCountry: string;
  mobileNumber: string;
  registerVerificationStatus: string;
  firstTimeLogin: boolean;
  isOrganisationLeader: boolean;
  appointmentDate: string | null;
  verificationDocumentUrl: string | null;
  createdAt: string;
  updatedAt: string;
  organisation: VeloOrganisationDetail | null;
  leadsOrganisation: VeloOrganisationDetail | null;
  countries: Array<{
    id: string;
    assignedAt: string;
    roleInCountry: string | null;
    country: VeloCountryBrief;
  }>;
  categories: Array<{
    id: string;
    assignedAt: string;
    category: { id: string; name: string };
  }>;
  listings: Array<{
    id: string;
    title: string;
    price: number;
    condition: string;
    createdAt: string;
    categoryName: string | null;
  }>;
  pickedShipmentsCount: number;
  deliveredShipmentsCount: number;
  counts: {
    countries: number;
    categories: number;
    listings: number;
    pickedShipments: number;
    deliveredShipments: number;
  };
};

export type VeloShipmentDetail = {
  id: string;
  shipmentId: string | null;
  source: 'active' | 'completed';
  shipmentStatus: string;
  shipmentType: string;
  shippingMarket: string;
  customPrice: boolean;
  openMarketPrice: number;
  imageStatus: string;
  shipmentDate: string | null;
  deliveryDate: string | null;
  sender: {
    name: string;
    addressOne: string;
    addressTwo: string;
    city: string;
    state: string;
    email: string;
    mobileNumber: string;
  };
  receiver: {
    name: string;
    addressOne: string;
    addressTwo: string;
    city: string;
    state: string;
    email: string;
    mobileNumber: string;
    countryCode: string;
    zipCode: string;
    residentAddress: boolean;
    country: VeloCountryBrief | null;
  };
  package: {
    length: string;
    width: string;
    height: string;
    weight: string;
    pieces: string;
    description: string;
  };
  pickup: {
    pickupTimeFrom: string;
    pickupTimeTo: string;
    pickupInstructions: string;
    pickupSpecialInstructions: string;
    verbalNotificationService: boolean;
    adultSignatureService: boolean;
    directSignatureService: boolean;
  };
  payment: {
    paymentSuccess: boolean;
    paymentAmount: number | null;
    paymentCurrency: string | null;
    customerId: string | null;
    receiptUrl: string | null;
    stripeId: string | null;
  };
  statusImages: {
    picked: string | null;
    dropped: string | null;
    inTransitStart: string | null;
    inTransitEnd: string | null;
    outForDelivery: string | null;
    delivered: string | null;
  };
  user: { id: string; name: string; email: string; mobileNumber: string } | null;
  organisation: { id: string; organisationName: string | null } | null;
  pickUpAgent: { id: string; name: string; email: string } | null;
};

export type VeloPurchaseDetail = VeloShipmentDetail;

export type VeloListingDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    description: string;
    categoryImgUrl: string;
  } | null;
  agent: {
    id: string;
    name: string;
    email: string;
    role: string;
    registerVerificationStatus: string;
    organisation: {
      id: string;
      organisationName: string | null;
      superAdminApproval: boolean;
    } | null;
  } | null;
};

export type VeloContactInquiryDetail = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  country: string | null;
  message: string;
  createdAt: string;
};
